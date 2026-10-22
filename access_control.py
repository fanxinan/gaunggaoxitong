"""Single-user login for a private deployment; credentials never enter SQLite.

Keep one application worker. Password changes revoke every existing session.
Without a password, local development keeps its existing unauthenticated flow;
WEEKLY_REQUIRE_AUTH=1 makes a missing password a startup error.
"""
from __future__ import annotations

from collections import deque
import hashlib
import hmac
import html
import os
from pathlib import Path
import secrets
import time
from urllib.parse import parse_qs, urlsplit

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

COOKIE_NAME = 'zhouce_session'
LANGUAGE_COOKIE_NAME = 'zhouce_lang'
LANGUAGE_COOKIE_SECONDS = 365 * 24 * 60 * 60
SESSION_SECONDS = 12 * 60 * 60
FAILURE_WINDOW_SECONDS = 15 * 60
MAX_FAILURES = 5
MAX_CLIENTS = 1024
LOGIN_TEMPLATE = Path(__file__).resolve().parent / 'frontend' / 'static' / 'login.html'

LOGIN_TEXT = {
    'zh': {
        'LANG_HTML': 'zh-CN', 'TITLE': '登录 · 周策', 'BRAND': '周策',
        'HEADING': '回到你的经营工作台', 'INTRO': '查看每周广告复盘，保留每次调整的依据。',
        'PASSWORD_LABEL': '工作台访问密码', 'PASSWORD_PLACEHOLDER': '输入你的访问密码',
        'SUBMIT': '登录工作台', 'LANGUAGE_LABEL': '页面语言',
        'NOTE': '这是工作台的访问密码，与 DeepSeek API 密钥不同。仅授权用户可查看报告与执行记录。',
        'FOOTER': '周策 · 每周复盘，让调整有据可依',
        'cross_site': '不接受跨站修改请求', 'login_required': '请先登录后使用工作台',
        'invalid_type': '登录请求格式不正确，请通过此页面重新提交。',
        'too_large': '登录请求过大，请重新输入访问密码。',
        'invalid_form': '登录请求格式不正确，请重新输入访问密码。',
        'rate_limit': '尝试次数过多，请15分钟后再试。',
        'wrong_password': '访问密码不正确，请重新输入。',
    },
    'en': {
        'LANG_HTML': 'en', 'TITLE': 'Sign in · Zhouce', 'BRAND': 'Zhouce',
        'HEADING': 'Welcome back to your workspace',
        'INTRO': 'Review your weekly advertising performance and keep a record of every decision.',
        'PASSWORD_LABEL': 'Workspace password', 'PASSWORD_PLACEHOLDER': 'Enter your workspace password',
        'SUBMIT': 'Sign in', 'LANGUAGE_LABEL': 'Page language',
        'NOTE': 'Use your workspace password, which is separate from your DeepSeek API key. Reports and execution records are available only to authorized users.',
        'FOOTER': 'Zhouce · Weekly reviews. Decisions backed by evidence.',
        'cross_site': 'Cross-site changes are not accepted.',
        'login_required': 'Please sign in to access your workspace.',
        'invalid_type': 'Invalid sign-in request. Please submit the form on this page.',
        'too_large': 'The sign-in request is too large. Please enter your password again.',
        'invalid_form': 'Invalid sign-in request. Please enter your password again.',
        'rate_limit': 'Too many attempts. Please try again in 15 minutes.',
        'wrong_password': 'The password is incorrect. Please try again.',
    },
}


def request_language(request: Request) -> str:
    """Use an explicit supported choice, then the shared page-language cookie."""
    query = request.query_params.get('lang', '').lower()
    if query in LOGIN_TEXT:
        return query
    cookie = request.cookies.get(LANGUAGE_COOKIE_NAME, '').lower()
    return cookie if cookie in LOGIN_TEXT else 'zh'


def login_url(request: Request) -> str:
    language = request_language(request)
    explicit_choice = request.query_params.get('lang', '').lower() in LOGIN_TEXT
    return f'/login?lang={language}' if explicit_choice or language == 'en' else '/login'


def _enabled(value: str) -> bool:
    return value.lower().strip() in {'1', 'true', 'yes', 'on'}


def install_access_control(app: FastAPI) -> None:
    password = os.environ.get('WEEKLY_ACCESS_PASSWORD', '')
    required = _enabled(os.environ.get('WEEKLY_REQUIRE_AUTH', ''))
    if required and not password:
        raise RuntimeError('公网部署必须通过安全环境设置配置 WEEKLY_ACCESS_PASSWORD。')
    if password and not 16 <= len(password) <= 512:
        raise RuntimeError('WEEKLY_ACCESS_PASSWORD 长度必须为16至512字符。')
    enabled = bool(password)
    app.state.access_control_enabled = enabled
    cookie_secure = os.environ.get('WEEKLY_COOKIE_SECURE', 'true').lower().strip() not in {'0', 'false', 'no', 'off'}
    expected_password = hashlib.sha256(password.encode('utf-8')).digest()
    signing_key = hashlib.sha256(b'zhouce-session-v1\0' + password.encode('utf-8')).digest()
    failures: dict[str, deque[float]] = {}

    def new_session() -> str:
        issued = int(time.time())
        payload = f'{issued}.{issued + SESSION_SECONDS}.{secrets.token_urlsafe(18)}'
        signature = hmac.new(signing_key, payload.encode('ascii'), hashlib.sha256).hexdigest()
        return f'{payload}.{signature}'

    def valid_session(value: str | None) -> bool:
        if not value or len(value) > 256:
            return False
        try:
            issued_s, expires_s, nonce, signature = value.split('.')
            issued, expires = int(issued_s), int(expires_s)
            if len(nonce) != 24 or len(signature) != 64 or any(c not in '0123456789abcdef' for c in signature):
                return False
            payload = f'{issued_s}.{expires_s}.{nonce}'
            expected = hmac.new(signing_key, payload.encode('ascii'), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(signature, expected):
                return False
            current = int(time.time())
            return issued <= current + 60 and expires > current and expires - issued == SESSION_SECONDS
        except (ValueError, UnicodeError):
            return False

    def remember_language(response, request: Request):
        chosen = request.query_params.get('lang', '').lower()
        if chosen in LOGIN_TEXT and request.cookies.get(LANGUAGE_COOKIE_NAME) != chosen:
            response.set_cookie(LANGUAGE_COOKIE_NAME, chosen, max_age=LANGUAGE_COOKIE_SECONDS,
                                secure=cookie_secure, httponly=False, samesite='lax', path='/')
        return response

    def login_page(request: Request, error_key: str = '', status: int = 200, retry_after: int | None = None):
        language = request_language(request)
        values = dict(LOGIN_TEXT[language])
        values.update(LANG=language, ERROR=values.get(error_key, ''),
                      ERROR_CLASS='' if error_key else 'hidden',
                      ZH_CURRENT='page' if language == 'zh' else 'false',
                      EN_CURRENT='page' if language == 'en' else 'false')
        template = LOGIN_TEMPLATE.read_text(encoding='utf-8')
        body = template
        for key, value in values.items():
            body = body.replace('{{' + key + '}}', html.escape(value, quote=True))
        response = HTMLResponse(body, status_code=status)
        response.headers['Cache-Control'] = 'no-store'
        response.headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
        if retry_after is not None:
            response.headers['Retry-After'] = str(retry_after)
        return remember_language(response, request)

    @app.middleware('http')
    async def authenticate(request: Request, call_next):
        if enabled and request.method in {'POST', 'PUT', 'PATCH', 'DELETE'}:
            origin = request.headers.get('origin')
            invalid_origin = False
            if origin:
                try:
                    parsed = urlsplit(origin)
                    invalid_origin = parsed.scheme not in {'http', 'https'} or parsed.netloc.lower() != request.headers.get('host', '').lower()
                except ValueError:
                    invalid_origin = True
            if invalid_origin or request.headers.get('sec-fetch-site') == 'cross-site':
                return JSONResponse({'detail': LOGIN_TEXT[request_language(request)]['cross_site']}, status_code=403, headers={'Cache-Control': 'no-store'})
        public = request.url.path == '/login' or (request.url.path == '/api/health' and request.method == 'GET')
        if enabled and not public and not valid_session(request.cookies.get(COOKIE_NAME)):
            if request.url.path.startswith('/api/'):
                response = JSONResponse({'detail': LOGIN_TEXT[request_language(request)]['login_required'], 'login_url': login_url(request)}, status_code=401)
            else:
                response = RedirectResponse(login_url(request), status_code=303)
        else:
            response = await call_next(request)
        if enabled or request.url.path == '/login':
            response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response

    @app.get('/login', include_in_schema=False)
    async def show_login(request: Request):
        if not enabled or valid_session(request.cookies.get(COOKIE_NAME)):
            return remember_language(RedirectResponse('/', status_code=303), request)
        return login_page(request)

    @app.post('/login', include_in_schema=False)
    async def login(request: Request):
        if not enabled:
            return remember_language(RedirectResponse('/', status_code=303), request)
        # The native HTML form is urlencoded. Bound the body before parsing it.
        if request.headers.get('content-type', '').split(';', 1)[0].strip().lower() != 'application/x-www-form-urlencoded':
            return login_page(request, 'invalid_type', 400)
        body = bytearray()
        async for chunk in request.stream():
            body.extend(chunk)
            if len(body) > 8192:
                return login_page(request, 'too_large', 413)
        try:
            fields = parse_qs(body.decode('utf-8'), keep_blank_values=True, max_num_fields=2, strict_parsing=True)
            supplied = fields.get('password', [''])[0]
            if len(fields.get('password', [])) != 1 or len(supplied) > 512:
                raise ValueError('invalid password field')
        except (ValueError, UnicodeError):
            return login_page(request, 'invalid_form', 400)

        client = request.client.host if request.client else 'unknown'
        current = time.monotonic()
        for key in list(failures):
            attempts = failures[key]
            while attempts and attempts[0] <= current - FAILURE_WINDOW_SECONDS:
                attempts.popleft()
            if not attempts:
                del failures[key]
        attempts = failures.get(client, deque())
        if len(attempts) >= MAX_FAILURES:
            retry_after = max(1, int(FAILURE_WINDOW_SECONDS - (current - attempts[0])) + 1)
            return login_page(request, 'rate_limit', 429, retry_after)
        supplied_hash = hashlib.sha256(supplied.encode('utf-8')).digest()
        if not hmac.compare_digest(supplied_hash, expected_password):
            if client not in failures and len(failures) >= MAX_CLIENTS:
                del failures[next(iter(failures))]
            attempts.append(current)
            failures[client] = attempts
            return login_page(request, 'wrong_password', 401)
        failures.pop(client, None)
        response = RedirectResponse('/', status_code=303)
        response.set_cookie(COOKIE_NAME, new_session(), max_age=SESSION_SECONDS,
                            secure=cookie_secure, httponly=True, samesite='strict', path='/')
        return remember_language(response, request)

    @app.post('/logout', include_in_schema=False)
    async def logout(request: Request):
        response = RedirectResponse(login_url(request), status_code=303)
        response.delete_cookie(COOKIE_NAME, path='/', secure=cookie_secure, httponly=True, samesite='strict')
        return remember_language(response, request)
