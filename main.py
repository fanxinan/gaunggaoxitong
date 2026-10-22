"""周策: local-first weekly advertising review, immutable snapshots and execution history."""
from __future__ import annotations

import asyncio
from contextlib import contextmanager
from datetime import date, datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import sqlite3
import tempfile
import uuid
import zipfile
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from openpyxl import Workbook
from pydantic import BaseModel, ConfigDict, Field
from starlette.background import BackgroundTask

from parser import parse_report
from analysis_engine import analyze_report
from ai_review import review_analysis, ai_configuration
from access_control import install_access_control, request_language
from localized_analysis import localize_analysis, translate_message

BASE = Path(__file__).resolve().parent
MAX_UPLOAD = 15 * 1024 * 1024
DEFAULT_SETTINGS = {'target_acos': 24.0, 'growth_priority': True, 'inventory_threshold': 3}
MARKETPLACES = {
    'AE': {'code': 'AE', 'name_zh': '阿联酋', 'name_en': 'United Arab Emirates', 'currency': 'AED'},
    'SA': {'code': 'SA', 'name_zh': '沙特阿拉伯', 'name_en': 'Saudi Arabia', 'currency': 'SAR'},
}
Language = Literal['zh', 'en']


def market_code(value: str) -> str:
    code = value.strip().upper()
    if code not in MARKETPLACES:
        raise HTTPException(422, '仅支持阿联酋站点AE和沙特站点SA')
    return code


def now():
    return datetime.now(timezone.utc).isoformat()


def dumps(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False)


class SettingsInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    target_acos: float = Field(default=24, ge=16, le=50, allow_inf_nan=False)
    growth_priority: bool = True


class ConfirmationItem(BaseModel):
    model_config = ConfigDict(extra='forbid')
    asin: str = Field(min_length=1, max_length=30)
    actual_target: float = Field(ge=16, le=50, allow_inf_nan=False)
    note: str = Field(default='', max_length=2000)


class ConfirmationInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    analysis_id: str
    executed_at: datetime
    items: list[ConfirmationItem] = Field(min_length=1, max_length=500)


def create_app(data_dir: str | Path | None = None):
    store = Path(data_dir or os.environ.get('WEEKLY_DATA_DIR', BASE / 'data')).resolve()
    uploads = store / 'uploads'
    uploads.mkdir(parents=True, exist_ok=True)
    database = store / 'weekly.sqlite3'

    @contextmanager
    def db():
        con = sqlite3.connect(database, timeout=30)
        con.row_factory = sqlite3.Row
        con.execute('PRAGMA foreign_keys=ON')
        try:
            yield con
            con.commit()
        except Exception:
            con.rollback()
            raise
        finally:
            con.close()

    with db() as con:
        con.execute('PRAGMA journal_mode=WAL')
        con.executescript('''
            CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS market_settings (
                marketplace TEXT PRIMARY KEY CHECK(marketplace IN ('AE','SA')), value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY, filename TEXT NOT NULL, sha256 TEXT NOT NULL,
                marketplace TEXT NOT NULL, period_start TEXT NOT NULL, period_end TEXT NOT NULL,
                days INTEGER NOT NULL, created_at TEXT NOT NULL, row_count INTEGER NOT NULL,
                rows_json TEXT NOT NULL, parser_warnings TEXT NOT NULL,
                UNIQUE(sha256,marketplace,period_start,period_end)
            );
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(id),
                created_at TEXT NOT NULL, settings_json TEXT NOT NULL, result_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS confirmations (
                id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(id),
                analysis_id TEXT NOT NULL REFERENCES analyses(id), asin TEXT NOT NULL,
                name TEXT, previous_target REAL, recommended_target REAL, actual_target REAL NOT NULL,
                executed_at TEXT NOT NULL, confirmed_at TEXT NOT NULL, note TEXT NOT NULL,
                UNIQUE(report_id,asin)
            );
            CREATE INDEX IF NOT EXISTS analysis_report ON analyses(report_id,created_at);
            CREATE INDEX IF NOT EXISTS confirmation_asin ON confirmations(asin,executed_at);
        ''')
        con.execute('INSERT OR IGNORE INTO settings VALUES(1,?)', (dumps(DEFAULT_SETTINGS),))
        legacy_settings = con.execute('SELECT value FROM settings WHERE id=1').fetchone()[0]
        con.execute('INSERT OR IGNORE INTO market_settings VALUES(?,?)', ('AE', legacy_settings))
        con.execute('INSERT OR IGNORE INTO market_settings VALUES(?,?)', ('SA', dumps(DEFAULT_SETTINGS)))
        # A process restart cannot resume an in-memory upstream request. Preserve the snapshot.
        for a in con.execute('SELECT id,result_json FROM analyses').fetchall():
            result = json.loads(a['result_json'])
            if result.get('ai_review', {}).get('status') == 'pending':
                result['ai_review'].update(status='failed', error='服务重启中断了AI复核。原始报告与规则分析已保留，可重新分析。')
                con.execute('UPDATE analyses SET result_json=? WHERE id=?', (dumps(result), a['id']))

    app = FastAPI(title='周策 · 广告经营复盘', version='0.2.0')
    app.state.store = store
    install_access_control(app)

    @app.exception_handler(HTTPException)
    async def localized_http_error(request: Request, exc: HTTPException):
        detail = translate_message(exc.detail, request_language(request)) if isinstance(exc.detail, str) else exc.detail
        return JSONResponse({'detail': detail}, status_code=exc.status_code, headers=exc.headers)

    @app.middleware('http')
    async def same_origin(request, call_next):
        origin = request.headers.get('origin')
        if request.method in {'POST', 'PUT', 'PATCH', 'DELETE'} and origin:
            from urllib.parse import urlparse
            if urlparse(origin).netloc != request.headers.get('host'):
                return JSONResponse({'detail': translate_message('不接受跨站修改请求', request_language(request))}, status_code=403)
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'same-origin'
        if request.url.path.startswith('/api/'):
            response.headers['Cache-Control'] = 'no-store'
        return response

    def settings_value(marketplace='AE'):
        marketplace = market_code(marketplace)
        with db() as con:
            return json.loads(con.execute('SELECT value FROM market_settings WHERE marketplace=?', (marketplace,)).fetchone()[0])

    def full_report(report_id):
        with db() as con:
            row = con.execute('SELECT * FROM reports WHERE id=?', (report_id,)).fetchone()
        if row is None:
            raise HTTPException(404, '报告不存在')
        r = dict(row)
        r['rows'] = json.loads(r.pop('rows_json'))
        r['parser_warnings'] = json.loads(r['parser_warnings'])
        return r

    def meta(r):
        with db() as con:
            a = con.execute('SELECT id,result_json FROM analyses WHERE report_id=? ORDER BY created_at DESC LIMIT 1', (r['id'],)).fetchone()
        result = json.loads(a['result_json']) if a else {}
        status = result.get('ai_review', {}).get('status', 'unavailable')
        return {'id': r['id'], 'filename': r['filename'], 'marketplace': r['marketplace'],
                'currency': MARKETPLACES.get(r['marketplace'], {}).get('currency'),
                'start_date': r['period_start'], 'end_date': r['period_end'], 'day_count': r['days'],
                'created_at': r['created_at'], 'row_count': r['row_count'],
                'analysis_id': a['id'] if a else None, 'ai_status': status,
                'analysis_status': 'reviewing' if status == 'pending' else 'ready'}

    def confirmations(report_id=None, marketplace=None):
        clauses, values = [], []
        if report_id:
            clauses.append('c.report_id=?')
            values.append(report_id)
        if marketplace is not None:
            clauses.append('r.marketplace=?')
            values.append(market_code(marketplace))
        query = 'SELECT c.*,r.marketplace FROM confirmations c JOIN reports r ON r.id=c.report_id'
        if clauses:
            query += ' WHERE ' + ' AND '.join(clauses)
        query += ' ORDER BY c.executed_at DESC'
        with db() as con:
            rows = con.execute(query, values).fetchall()
        return [dict(r) for r in rows]

    def get_analysis(report_id, analysis_id=None, lang='zh'):
        r = full_report(report_id)
        with db() as con:
            if analysis_id:
                a = con.execute('SELECT * FROM analyses WHERE report_id=? AND id=?', (report_id, analysis_id)).fetchone()
            else:
                a = con.execute('SELECT * FROM analyses WHERE report_id=? ORDER BY created_at DESC LIMIT 1', (report_id,)).fetchone()
        if not a:
            raise HTTPException(404, '分析记录不存在')
        result = json.loads(a['result_json'])
        report_meta = meta(r)
        selected_ai_status = result.get('ai_review', {}).get('status', 'unavailable')
        report_meta.update(analysis_id=a['id'], ai_status=selected_ai_status,
                           analysis_status='reviewing' if selected_ai_status == 'pending' else 'ready')
        result.update(id=a['id'], report_id=report_id, created_at=a['created_at'], report=report_meta,
                      settings_snapshot=json.loads(a['settings_json']), confirmations=confirmations(report_id))
        return localize_analysis(result, lang)

    async def enrich(analysis_id, result, report, previous, events, settings):
        try:
            review = await review_analysis(result, report, previous, events, settings)
        except Exception:
            review = {'status': 'failed', 'provider': 'DeepSeek', 'summary': '', 'findings': [],
                      'limitations': [], 'error': 'AI复核暂不可用，原始报告及规则分析已保存。'}
        result = dict(result)
        result['ai_review'] = review
        with db() as con:
            con.execute('UPDATE analyses SET result_json=? WHERE id=?', (dumps(result), analysis_id))

    def create_analysis(report_id, background: BackgroundTasks, lang='zh'):
        report = full_report(report_id)
        settings = settings_value(report['marketplace'])
        with db() as con:
            ids = [row[0] for row in con.execute('SELECT id FROM reports WHERE marketplace=? AND id<>? ORDER BY period_end DESC', (report['marketplace'], report_id))]
        previous = [full_report(i) for i in ids]
        events = confirmations()
        # Same ASIN on another marketplace must never contribute execution history.
        allowed_ids = {report_id, *(r['id'] for r in previous)}
        events = [e for e in events if e['report_id'] in allowed_ids]
        result = analyze_report(report, previous, events, settings)
        result.setdefault('quality', {}).setdefault('warnings', []).extend(report['parser_warnings'])
        configured = ai_configuration()['configured']
        result['ai_review'] = {'status': 'pending' if configured else 'unavailable', 'provider': 'DeepSeek',
                               'model': os.environ.get('DEEPSEEK_MODEL', 'deepseek-chat'), 'summary': '', 'findings': [],
                               'limitations': [], 'error': None if configured else '尚未配置DeepSeek密钥；当前展示可追溯的规则分析。'}
        aid = uuid.uuid4().hex
        created = now()
        with db() as con:
            con.execute('INSERT INTO analyses VALUES(?,?,?,?,?)', (aid, report_id, created, dumps(settings), dumps(result)))
        if configured:
            background.add_task(enrich, aid, result, report, previous, events, settings)
        return get_analysis(report_id, aid, lang)

    @app.get('/api/health')
    def health():
        return {'status': 'ok', 'storage': 'SQLite', 'ai_configured': ai_configuration()['configured'], 'version': app.version}

    @app.get('/api/marketplaces')
    def list_marketplaces():
        return {'marketplaces': list(MARKETPLACES.values())}

    @app.get('/api/settings')
    def get_settings(marketplace: str = 'AE', lang: Language = 'zh'):
        marketplace = market_code(marketplace)
        value = settings_value(marketplace)
        value.update(ai=ai_configuration(),
                     storage={'type': 'SQLite', 'persistent': True},
                     access={'enabled': app.state.access_control_enabled},
                     marketplace=marketplace, currency=MARKETPLACES[marketplace]['currency'])
        if value['ai'].get('reason'):
            value['ai']['reason'] = translate_message(value['ai']['reason'], lang)
        return value

    @app.put('/api/settings')
    def put_settings(body: SettingsInput, marketplace: str = 'AE', lang: Language = 'zh'):
        marketplace = market_code(marketplace)
        value = {**body.model_dump(), 'inventory_threshold': 3}
        with db() as con:
            con.execute('UPDATE market_settings SET value=? WHERE marketplace=?', (dumps(value), marketplace))
            if marketplace == 'AE':
                con.execute('UPDATE settings SET value=? WHERE id=1', (dumps(value),))
        return get_settings(marketplace, lang)

    @app.get('/api/reports')
    def list_reports(marketplace: str | None = None):
        marketplace = market_code(marketplace) if marketplace is not None else None
        with db() as con:
            query = 'SELECT * FROM reports'
            values = []
            if marketplace:
                query += ' WHERE marketplace=?'
                values.append(marketplace)
            reports = [dict(r) for r in con.execute(query + ' ORDER BY created_at DESC', values)]
        return {'reports': [meta(r) for r in reports]}

    @app.post('/api/reports')
    async def upload_report(background_tasks: BackgroundTasks, file: UploadFile = File(...),
                            marketplace: str = Form(...), start_date: str = Form(...), end_date: str = Form(...),
                            lang: Language = 'zh'):
        marketplace = market_code(marketplace)
        try:
            start, end = date.fromisoformat(start_date), date.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(422, '日期格式应为YYYY-MM-DD')
        days = (end - start).days + 1
        if not 1 <= days <= 366 or end > datetime.now(timezone.utc).date():
            raise HTTPException(422, '报告日期范围无效，结束日期不能晚于今天，最多366天')
        filename = Path((file.filename or '').replace('\\', '/')).name[:180]
        if not filename.lower().endswith('.xlsx'):
            raise HTTPException(422, '请上传.xlsx格式的DeepBI报告')
        content = await file.read(MAX_UPLOAD + 1)
        if not content or len(content) > MAX_UPLOAD:
            raise HTTPException(413, '文件为空或超过15MB上限')
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as zipped:
                if sum(i.file_size for i in zipped.infolist()) > 64 * 1024 * 1024 or len(zipped.infolist()) > 3000:
                    raise ValueError('解压后的工作簿过大')
            parsed = await asyncio.to_thread(parse_report, content)
        except Exception as exc:
            detail = str(exc)[:250] if isinstance(exc, ValueError) else '工作簿无法读取，请检查格式和必需字段'
            raise HTTPException(422, detail)
        digest = hashlib.sha256(content).hexdigest()
        with db() as con:
            existing = con.execute('SELECT id FROM reports WHERE sha256=? AND marketplace=? AND period_start=? AND period_end=?',
                                   (digest, marketplace, start.isoformat(), end.isoformat())).fetchone()
        if existing:
            rid = existing[0]
            try:
                analysis = get_analysis(rid, lang=lang)
            except HTTPException:
                analysis = create_analysis(rid, background_tasks, lang)
            return {'report': meta(full_report(rid)), 'analysis': analysis, 'duplicate': True}
        rid = uuid.uuid4().hex
        path = uploads / f'{rid}.xlsx'
        path.write_bytes(content)
        try:
            with db() as con:
                con.execute('INSERT INTO reports VALUES(?,?,?,?,?,?,?,?,?,?,?)',
                            (rid, filename, digest, marketplace, start.isoformat(), end.isoformat(), days, now(),
                             len(parsed['rows']), dumps(parsed['rows']), dumps(parsed.get('warnings', []))))
        except Exception:
            path.unlink(missing_ok=True)
            raise
        analysis = create_analysis(rid, background_tasks, lang)
        return {'report': meta(full_report(rid)), 'analysis': analysis, 'duplicate': False}

    @app.get('/api/reports/{report_id}/analysis')
    def latest_analysis(report_id: str, lang: Language = 'zh'):
        return get_analysis(report_id, lang=lang)

    @app.get('/api/reports/{report_id}/analyses')
    def analyses(report_id: str):
        full_report(report_id)
        with db() as con:
            values = [dict(r) for r in con.execute('SELECT id,created_at,result_json FROM analyses WHERE report_id=? ORDER BY created_at DESC', (report_id,))]
        return {'analyses': [{'id': r['id'], 'created_at': r['created_at'], 'ai_status': json.loads(r['result_json']).get('ai_review', {}).get('status')} for r in values]}

    @app.get('/api/reports/{report_id}/analyses/{analysis_id}')
    def historical_analysis(report_id: str, analysis_id: str, lang: Language = 'zh'):
        return get_analysis(report_id, analysis_id, lang)

    @app.post('/api/reports/{report_id}/analyze')
    def reanalyze(report_id: str, background_tasks: BackgroundTasks, lang: Language = 'zh'):
        return {'analysis': create_analysis(report_id, background_tasks, lang)}

    @app.get('/api/reports/{report_id}/download')
    def download_original(report_id: str):
        report = full_report(report_id)
        return FileResponse(uploads / f'{report_id}.xlsx', filename=report['filename'], media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    @app.get('/api/reports/{report_id}/export')
    def export_analysis(report_id: str, analysis_id: str | None = None, lang: Language = 'zh'):
        analysis = get_analysis(report_id, analysis_id, lang)
        english = lang == 'en'
        workbook = Workbook()
        overview = workbook.active
        overview.title = 'Overview' if english else '分析概况'
        overview.append(['Field', 'Value'] if english else ['项目', '内容'])
        for key, value in analysis['summary'].items():
            overview.append([key, safe_excel(dumps(value) if isinstance(value, (dict, list)) else value)])
        overview.append(['Analysis version' if english else '分析版本', analysis['id']])
        overview.append(['Marketplace' if english else '站点', analysis['report']['marketplace']])
        overview.append(['Currency' if english else '币种', analysis['report'].get('currency')])
        overview.append(['AI review status' if english else 'AI复核状态', analysis['ai_review']['status']])
        overview.append(['AI review summary (original language)' if english else 'AI复核摘要', safe_excel(analysis['ai_review'].get('summary', ''))])
        sheet = workbook.create_sheet('Recommendations' if english else '逐品建议')
        sheet.append(['ASIN', 'Product', 'Current target', 'Suggested target', 'Actionable', 'Action', 'Reason', 'Ad spend', 'Ad sales', 'Ad ACOS', 'Orders', 'Inventory', 'Evidence', 'Issues and checks'] if english else ['ASIN', '产品', '当前目标', '建议目标', '是否有可执行建议', '动作', '理由', '广告花费', '广告销售', '广告ACOS', '订单', '库存', '证据', '异常及排查'])
        for r in analysis['recommendations']:
            metrics = r.get('metrics', {})
            vals = [r['asin'], r.get('name'), r.get('current_target'), r.get('recommended_target'),
                    ('Yes' if r.get('actionable') else 'No') if english else ('是' if r.get('actionable') else '否'), r.get('action_label'), r.get('reason'),
                    metrics.get('spend'), metrics.get('ad_sales'), metrics.get('acos'), metrics.get('orders'),
                    metrics.get('inventory'), '\n'.join(r.get('evidence', [])), dumps(r.get('anomalies', []))]
            sheet.append([safe_excel(v) for v in vals])
        sheet.freeze_panes = 'C2'
        sheet.auto_filter.ref = sheet.dimensions
        work = Path(tempfile.mkdtemp(prefix='weekly-export-'))
        dest = work / 'analysis.xlsx'
        workbook.save(dest)
        prefix = 'Zhouce_analysis' if english else '周策分析'
        return FileResponse(dest, filename=f"{prefix}_{analysis['report']['marketplace']}_{analysis['report']['end_date']}.xlsx", background=BackgroundTask(shutil.rmtree, work))

    @app.get('/api/confirmations')
    def list_confirmations(marketplace: str | None = None):
        return {'confirmations': confirmations(marketplace=marketplace)}

    @app.post('/api/reports/{report_id}/confirmations')
    def confirm(report_id: str, body: ConfirmationInput):
        analysis = get_analysis(report_id, body.analysis_id)
        executed = body.executed_at
        if executed.tzinfo is None:
            raise HTTPException(422, '执行时间必须包含时区')
        executed = executed.astimezone(timezone.utc)
        if executed > datetime.now(timezone.utc) or executed.date() < date.fromisoformat(analysis['report']['end_date']):
            raise HTTPException(422, '实际执行时间不能在未来，也不能早于这份报告结束日期')
        if executed < datetime.fromisoformat(analysis['created_at']):
            raise HTTPException(422, '执行时间不能早于本次分析生成时间；请选择实际执行此次建议的时间')
        known = {r['asin']: r for r in analysis['recommendations']}
        if len({i.asin for i in body.items}) != len(body.items):
            raise HTTPException(422, '同一批次不能重复确认相同ASIN')
        pending = []
        for item in body.items:
            if item.asin not in known:
                raise HTTPException(422, '确认的ASIN不属于该报告')
            r = known[item.asin]
            suggested = r.get('recommended_target')
            override = not r.get('actionable') or suggested is None or abs(item.actual_target - suggested) > .001
            if override and not item.note.strip():
                raise HTTPException(422, f'{item.asin}为手动调整或与建议不同，请填写原因')
            pending.append({'id': uuid.uuid4().hex, 'report_id': report_id, 'analysis_id': body.analysis_id,
                            'asin': item.asin, 'name': r.get('name'), 'previous_target': r.get('current_target'),
                            'recommended_target': suggested, 'actual_target': item.actual_target,
                            'executed_at': executed.isoformat(), 'confirmed_at': now(), 'note': item.note.strip()})
        try:
            with db() as con:
                for event in pending:
                    con.execute('INSERT INTO confirmations '
                                '(id,report_id,analysis_id,asin,name,previous_target,recommended_target,actual_target,executed_at,confirmed_at,note) '
                                'VALUES(?,?,?,?,?,?,?,?,?,?,?)', tuple(event.values()))
        except sqlite3.IntegrityError:
            raise HTTPException(409, '这份报告中的部分产品已经确认过，不能重复记录；请刷新后核对执行记录')
        return {'confirmations': pending}

    @app.get('/api/backup')
    def backup():
        work = Path(tempfile.mkdtemp(prefix='weekly-backup-'))
        snapshot = work / 'weekly.sqlite3'
        with db() as source:
            target = sqlite3.connect(snapshot)
            try:
                source.backup(target)
            finally:
                target.close()
        path = work / 'backup.zip'
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
            z.write(snapshot, 'weekly.sqlite3')
            for source in uploads.glob('*.xlsx'):
                z.write(source, f'uploads/{source.name}')
            z.writestr('RESTORE.txt', '停止服务后，将weekly.sqlite3与uploads目录放入WEEKLY_DATA_DIR，再启动。备份不含API密钥。\n')
        return FileResponse(path, filename=f'周策备份_{datetime.now(timezone.utc).date()}.zip', background=BackgroundTask(shutil.rmtree, work))

    @app.get('/')
    def index():
        return FileResponse(BASE / 'frontend' / 'static' / 'index.html')

    static = BASE / 'frontend' / 'static'
    static.mkdir(parents=True, exist_ok=True)
    app.mount('/static', StaticFiles(directory=static), name='static')
    return app


def safe_excel(value):
    if isinstance(value, str) and value.startswith(('=', '+', '-', '@')):
        return "'" + value
    return value


app = create_app()
