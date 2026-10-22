'use strict';

const ICONS = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
  adjust:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="3" fill="currentColor" stroke="none"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/>',
  checklist:'<path d="M9 5h11M9 12h11M9 19h11M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2"/>',
  settings:'<path d="m9 3-.6 2.5-2.2 1.3L3.8 6l-1.4 2.5 1.8 1.8v2.6l-1.8 1.8 1.4 2.5 2.4-.8 2.2 1.3L9 20h3l.6-2.5 2.2-1.3 2.4.8 1.4-2.5-1.8-1.8v-2.6l1.8-1.8L17.2 6l-2.4.8-2.2-1.3L12 3Z"/><circle cx="10.5" cy="11.5" r="3"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18m-13 4h3m3 0h2m-8 3h3"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
  download:'<path d="M12 3v13m-5-5 5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  check:'<path d="m5 12 4 4L20 5"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.2 7a7.7 7.7 0 0 1 13-2l1.8 2M4 17l1.8 2a7.7 7.7 0 0 0 13-2"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  history:'<path d="M3 4v5h5M3.7 9A8.7 8.7 0 1 1 3 15"/><path d="M12 7v5l3 2"/>',
  sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  trend:'<path d="m3 17 6-6 4 4 8-10M15 5h6v6"/>',
  wallet:'<path d="M3 7V5a2 2 0 0 1 2-2h13v4M3 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M21 11h-6v6h6m-3-3h.1"/>',
  cart:'<path d="M3 3h2l3 12h10l3-9H6m3 13h.1M17 19h.1"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/>',
  file:'<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z"/><path d="M13 3v7h7M8 14h8m-8 3h5"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-US', {minimumFractionDigits:digits, maximumFractionDigits:digits});
const pct = (value) => value == null ? '无广告销售' : `${num(value)}%`;
const compactPct = (value) => value == null ? '—' : `${Number(value).toLocaleString('en-US', {maximumFractionDigits:2})}%`;
const dateLabel = (value, withTime = false) => { if (!value) return '—'; const d = new Date(value); if (Number.isNaN(d.valueOf())) return String(value); return d.toLocaleString('zh-CN', {year:'numeric',month:'2-digit',day:'2-digit',...(withTime ? {hour:'2-digit',minute:'2-digit'} : {})}); };
const period = (r) => r ? `${r.start_date} — ${r.end_date}` : '未选择报告';
const pageLabels = {overview:'经营总览',recommendations:'逐品建议',reports:'历史报告',executions:'执行记录',settings:'分析设置'};
const state = {reports:[],analysis:null,settings:null,confirmations:[],page:'overview',selected:new Set(),search:'',actionFilter:'',issueFilter:'',tablePage:1,pageSize:30,uploadFile:null,poll:null,manualConfirmation:false,loading:false};
let requestVersion = 0;

async function api(path, options = {}) {
  const config = {...options, headers:{...(options.body && !(options.body instanceof FormData) ? {'Content-Type':'application/json'} : {}), ...(options.headers || {})}};
  const response = await fetch(path, config);
  if (response.status === 401) {
    location.replace('/login');
    throw new Error('登录已过期，请重新登录。');
  }
  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try { const data = await response.json(); message = typeof data.detail === 'string' ? data.detail : data.detail ? JSON.stringify(data.detail) : data.message || message; } catch (_) {}
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}
function hydrateIcons(container = document) { container.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
function toast(message, error = false) { const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = message; $('toastContainer').append(el); setTimeout(() => el.remove(), error ? 8000 : 4500); }
function showModal(id) { $(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; const focusable = $(id).querySelector('input:not([type=file]),button,select'); if (focusable) setTimeout(() => focusable.focus(), 40); }
function closeModal(id) { $(id).classList.add('hidden'); if (!document.querySelector('.modal-backdrop:not(.hidden),.drawer-backdrop:not(.hidden)')) document.body.style.overflow = ''; }
function navigate(page) {
  if (!pageLabels[page]) page = 'overview';
  state.page = page; document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  $('breadcrumbCurrent').textContent = pageLabels[page]; $('sidebar').classList.remove('open');
  if (location.hash !== `#${page}`) history.replaceState(null, '', `#${page}`);
  if (page === 'executions') loadConfirmations();
}
function setBusy(button, busy, label) { button.disabled = busy; button.innerHTML = busy ? '<span class="spinner"></span>处理中…' : label; }
function updateEngineStatus() {
  const status = state.analysis?.ai_review?.status;
  const connected = state.settings?.ai?.configured;
  let text = connected ? 'DeepSeek 密钥已配置 · 规则计算' : '规则分析 · DeepSeek 未连接';
  if (status === 'pending') text = '规则分析已完成 · AI 复核中';
  if (status === 'completed') text = '规则计算 + DeepSeek 复核';
  if (status === 'failed') text = '规则分析已完成 · AI 复核失败';
  $('engineStatus').innerHTML = `<i></i>${esc(text)}`;
}
function empty(title, description, button = '') { return `<div class="panel empty-state"><span>${icon('folder')}</span><h2>${esc(title)}</h2><p>${esc(description)}</p>${button}</div>`; }
async function initialize() {
  state.loading = true;
  try {
    const results = await Promise.allSettled([api('/api/reports'), api('/api/settings'), api('/api/confirmations')]);
    if (results[0].status === 'rejected') throw results[0].reason;
    state.reports = results[0].value.reports || [];
    if (results[1].status === 'fulfilled') state.settings = results[1].value;
    else toast(`设置加载失败：${results[1].reason.message}`, true);
    if (results[2].status === 'fulfilled') state.confirmations = results[2].value.confirmations || [];
    else toast(`执行记录加载失败：${results[2].reason.message}`, true);
    renderReportSelector(); renderReports(); renderSettings(); renderExecutions();
    if (state.reports.length) await loadAnalysis(state.analysis?.report_id && state.reports.some(r => r.id === state.analysis.report_id) ? state.analysis.report_id : state.reports[0].id);
    else { state.analysis = null; renderOverview(); renderRecommendations(); }
    updateEngineStatus();
  } catch (err) {
    $('overviewContent').innerHTML = empty('工作台暂时无法连接',err.message,'<button class="button primary" data-refresh>重新连接</button>');
    toast(err.message, true);
  } finally { state.loading = false; }
}
function renderReportSelector() {
  $('reportSelector').innerHTML = state.reports.length ? state.reports.map(r => `<option value="${esc(r.id)}">${esc(r.marketplace)} · ${esc(r.start_date)} 至 ${esc(r.end_date)}${r.day_count === 7 ? '' : ' · 历史基线'}</option>`).join('') : '<option value="">尚无报告</option>';
  if (state.analysis) $('reportSelector').value = state.analysis.report_id;
}
async function loadAnalysis(reportId, analysisId = null) {
  const version = ++requestVersion;
  clearTimeout(state.poll);
  try {
    const path = analysisId ? `/api/reports/${encodeURIComponent(reportId)}/analyses/${encodeURIComponent(analysisId)}` : `/api/reports/${encodeURIComponent(reportId)}/analysis`;
    const analysis = await api(path);
    if (version !== requestVersion) return;
    state.analysis = analysis; state.selected.clear(); state.tablePage = 1;
    $('reportSelector').value = reportId;
    renderOverview(); renderRecommendations(); updateEngineStatus();
    if (analysis.ai_review?.status === 'pending') schedulePoll(reportId, analysis.id);
  } catch (err) {
    if (version !== requestVersion) return;
    state.analysis = null;
    $('overviewContent').innerHTML = empty('这份报告的分析暂时不可用',err.message);
    renderRecommendations(); toast(err.message,true);
  }
}
function schedulePoll(reportId, analysisId) {
  state.poll = setTimeout(async () => {
    if (state.analysis?.id !== analysisId) return;
    try {
      const fresh = await api(`/api/reports/${encodeURIComponent(reportId)}/analyses/${encodeURIComponent(analysisId)}`);
      if (state.analysis?.id !== analysisId) return;
      state.analysis = fresh; renderOverview(); updateEngineStatus();
      if (fresh.ai_review?.status === 'pending') schedulePoll(reportId, analysisId);
      else { renderRecommendations(); if (fresh.ai_review?.status === 'completed') toast('DeepSeek 复核已完成，已保存到本次分析。'); }
    } catch (_) { if (state.analysis?.id === analysisId) schedulePoll(reportId, analysisId); }
  }, 4000);
}
function metricDelta(value, kind = 'sales') {
  if (value == null) return '<span>等待可比较的周报</span>';
  const positive = kind === 'cost' ? value <= 0 : value >= 0;
  return `<span class="${positive ? 'positive' : 'negative'}">${value > 0 ? '↑' : value < 0 ? '↓' : '—'} ${num(Math.abs(value))}${kind === 'acos' ? ' 个百分点' : '%'}</span><span>对比上期</span>`;
}
function metricCard(title, value, iconName, bottom, primary = false, warning = false) {
  return `<div class="metric-card${primary ? ' primary-metric' : ''}${warning ? ' quality-warning' : ''}"><div class="metric-label">${esc(title)}${warning ? `<span title="销售归集口径存在不一致，暂不用于增长结论">${icon('info')}</span>` : ''}</div><span class="metric-icon">${icon(iconName)}</span><div class="metric-value">${value}</div><div class="metric-bottom">${bottom}</div></div>`;
}
function renderOverview() {
  const a = state.analysis;
  if (!a) { $('overviewContent').innerHTML = empty('从第一份报告开始','上传 DeepBI 报告，保存本期数据与建议。之后每周的分析都会参考历史报告和已确认的调整。','<button class="button primary" data-upload>'+icon('upload')+'上传第一份报告</button>'); return; }
  const s = a.summary, r = a.report, c = a.comparison || {}, goal = s.goal_acos ?? state.settings?.target_acos ?? 24;
  const metricComparison = c.available ? c.metrics || {} : {};
  const qualityWarnings = a.quality?.warnings || [];
  const aiLimitations = Array.isArray(a.ai_review?.limitations) ? a.ai_review.limitations.join(' ') : a.ai_review?.limitations || '';
  const risks = (a.recommendations || []).filter(x => x.priority === 'high' || (x.anomalies || []).length).sort((x,y) => (x.priority === 'high' ? -1 : 1) - (y.priority === 'high' ? -1 : 1) || (y.metrics?.spend || 0) - (x.metrics?.spend || 0)).slice(0,4);
  const aiDone = a.ai_review?.status === 'completed';
  const description = aiDone && a.ai_review.summary ? a.ai_review.summary : (s.observations || []).slice(0,2).join(' ') || '优先核对库存和可售状态，再区分值得增加投入的产品与需要减少损耗的产品。';
  const acosGood = s.acos != null && s.acos <= goal;
  const goalWidth = s.acos == null ? 0 : Math.min(100, s.acos / (goal * 1.25) * 100);
  const history = state.reports.slice(0,3);
  $('overviewContent').innerHTML = `
    <div class="report-context"><div class="context-left"><span class="market-chip">${esc(r.marketplace)}</span><span>${esc(period(r))}</span><span class="period-chip${r.day_count !== 7 ? ' baseline' : ''}">${r.day_count === 7 ? '近 7 天周报' : `${num(r.day_count,0)} 天历史基线`}</span><span class="context-dot"></span><span>${num(s.listing_count,0)} 个 Listing</span></div><span>分析留档于 ${esc(dateLabel(a.created_at,true))}</span></div>
    <div class="metrics-grid">
      ${metricCard(s.total_sales_reliable?'全店总营业额':'报表总营业额 · 待核对',num(s.total_sales),'trend',s.total_sales_reliable ? metricDelta(metricComparison.total_sales_pct) : '<span style="color:var(--amber)">口径待核对 · 暂不判断增长</span>',false,!s.total_sales_reliable)}
      ${metricCard('广告归因销售额',num(s.ad_sales),'cart',metricDelta(metricComparison.ad_sales_pct))}
      ${metricCard('广告总花费',num(s.ad_spend),'wallet',metricDelta(metricComparison.spend_pct,'cost'))}
      ${metricCard('全店实际 ACOS',s.acos == null ? '—' : `${num(s.acos)}<span style="font-size:20px">%</span>`,'target',`<span class="${acosGood ? 'positive' : 'negative'}">${acosGood ? '在预期范围内' : s.acos == null ? '暂无广告销售' : '高于经营预期'}</span><span>目标 ${compactPct(goal)}</span>`,true)}
    </div>
    <div class="overview-grid">
      <div class="panel insight-panel"><div class="insight-eyebrow">${icon('sparkles')} ${aiDone ? 'DEEPSEEK 复核 · 本期观察' : '规则分析 · 本期观察'}</div><h2>${esc(s.headline || '让增长与广告效率，一起向前。')}</h2><p class="insight-description">${esc(description)}</p><div class="insight-footer"><span><strong>${num(s.action_count,0)}</strong> 个目标调整候选 · <strong>${num(s.at_risk_count,0)}</strong> 个产品需要排查</span><button class="button" data-go="recommendations">查看逐品建议 ${icon('arrow')}</button></div></div>
      <div class="panel goal-panel"><div class="panel-title"><h2>广告成本与经营预期</h2><small>加权计算，不取单品均值</small></div><div class="goal-figures"><div><small>实际 ACOS</small><strong>${s.acos == null ? '—' : num(s.acos)+'%'}</strong></div><div class="goal-target"><small>心理预期</small><strong>≤ ${compactPct(goal)}</strong></div></div><div class="goal-track"><div class="goal-fill${acosGood ? '' : ' over'}" style="width:${goalWidth}%"></div><i class="goal-marker"></i></div><div class="goal-legend"><span>0%</span><span>${compactPct(goal)} 目标线</span><span>${compactPct(goal*1.25)}</span></div><div class="goal-note">${icon('info')}<span>${c.available ? `已关联 ${esc(c.previous_period || '上一份可比较报告')}。目标参数不必统一，最终看全店成本与营业额。` : esc(c.reason || '积累一份可比较的周报后，将开始观察调整前后的变化。')}</span></div></div>
    </div>
    <div class="bottom-grid"><div class="panel action-panel"><div class="panel-title"><h2>本周先关注这些产品</h2><button class="button text" data-go="recommendations">全部建议 ${icon('chevron')}</button></div>${risks.length ? risks.map((x,i) => `<div class="action-item" data-detail="${esc(x.asin)}"><span class="action-number">0${i+1}</span><div class="action-item-content"><div class="action-name">${esc(x.asin)} <span class="badge ${x.priority === 'high' ? 'amber' : 'gray'}">${esc(x.action_label)}</span></div><p>${esc(x.reason?.slice(0,100) || '')}</p></div><span class="action-chevron">${icon('chevron')}</span></div>`).join('') : '<div class="empty-timeline">本期没有高优先级异常。继续观察真实增长与成本变化。</div>'}</div>
    <div class="panel history-panel"><div class="panel-title"><h2>每一期，都是下一期的依据</h2><small>历史已保存</small></div>${history.map(x => `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${esc(x.start_date)} — ${esc(x.end_date)}</strong><p>${esc(x.marketplace)} · ${num(x.row_count,0)} 个产品 · ${x.day_count === 7 ? '7 天周报' : `${x.day_count} 天历史基线`}</p><span class="badge ${x.id === r.id ? 'teal' : 'gray'}">${x.id === r.id ? '当前查看' : '已归档'}</span></div></div>`).join('')}<div class="timeline-footer"><span>共 ${state.reports.length} 份报告</span><a href="#reports" data-go="reports">打开历史报告 →</a></div></div></div>
    <div class="overview-notice">${icon('shield')}<div>${qualityWarnings.length ? esc(qualityWarnings.slice(0,2).join(' ')) : '数据通过基础校验。分析会区分已知事实与可能原因，不把短期相关性当作调整效果。'} <span class="muted">${aiLimitations ? esc(aiLimitations)+' ' : ''}金额沿用源报告单位。${a.ai_review?.status === 'unavailable' ? 'DeepSeek 尚未连接，当前内容为规则分析。' : a.ai_review?.status === 'failed' ? '本次 AI 复核未完成，规则计算与原始数据已保存。' : ''}</span></div></div>`;
}
function confirmedAsins() { return new Set((state.analysis?.confirmations || []).map(x => x.asin)); }
function isActionable(row) { return Boolean(row.actionable) && !confirmedAsins().has(row.asin); }
function filteredRows() {
  const query = state.search.trim().toLowerCase();
  return (state.analysis?.recommendations || []).filter(r => (!query || `${r.asin} ${r.name || ''}`.toLowerCase().includes(query)) && (!state.actionFilter || r.action === state.actionFilter) && (!state.issueFilter || state.issueFilter === 'issue' && (r.anomalies || []).length || state.issueFilter === 'actionable' && isActionable(r) || state.issueFilter === 'selected' && state.selected.has(r.asin)));
}
function renderRecommendations(resetFilters = false) {
  const a = state.analysis;
  if (!a) { $('recommendationRows').innerHTML='<tr class="no-data-row"><td colspan="9">上传报告后，这里会显示逐品建议。</td></tr>'; $('recommendationGoal').textContent=compactPct(a.summary.goal_acos??state.settings?.target_acos??24);
  $('recommendationContext').innerHTML=''; $('tableCount').textContent=''; $('recommendationCount').textContent='0'; updateSelection(); return; }
  const actions = new Map(a.recommendations.map(r => [r.action,r.action_label]));
  $('actionFilter').innerHTML='<option value="">全部建议</option>'+[...actions].map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join('');
  if (!actions.has(state.actionFilter)) state.actionFilter=''; $('actionFilter').value=state.actionFilter;
  const filtered=filteredRows(); const pages=Math.max(1,Math.ceil(filtered.length/state.pageSize)); state.tablePage=Math.min(state.tablePage,pages);
  const visible=filtered.slice((state.tablePage-1)*state.pageSize,state.tablePage*state.pageSize);
  const confirmed=confirmedAsins();
  $('recommendationCount').textContent=num(a.summary.action_count,0);
  $('recommendationGoal').textContent=compactPct(a.summary.goal_acos??state.settings?.target_acos??24);
  $('recommendationContext').innerHTML=`<div class="summary-strip"><span><strong>${num(a.summary.listing_count,0)}</strong>产品</span><span><strong>${num(a.summary.action_count,0)}</strong>调整候选</span><span><strong>${num(a.summary.at_risk_count,0)}</strong>待排查</span><span><strong>${confirmed.size}</strong>已确认执行</span><span class="summary-period">${esc(a.report.marketplace)} · ${esc(period(a.report))}</span></div>`;
  $('tableCount').textContent=`共 ${filtered.length} 个产品`;
  $('recommendationRows').innerHTML=visible.length?visible.map(r=>{
    const m=r.metrics||{};const same=r.recommended_target==null||r.current_target===r.recommended_target;
    return `<tr class="${state.selected.has(r.asin)?'selected':''}"><td class="checkbox-cell"><input type="checkbox" data-select="${esc(r.asin)}" ${state.selected.has(r.asin)?'checked':''} ${isActionable(r)?'':'disabled'} aria-label="选择 ${esc(r.asin)}" title="${confirmed.has(r.asin)?'已确认执行':r.actionable?'选择这项调整':'该产品暂不建议调整目标，可在详情中记录实际操作'}"></td><td><div class="product-id">${esc(r.asin)}</div><div class="product-name" title="${esc(r.name)}">${esc(r.name||'商品名称缺失')}</div></td><td><span class="acos-value numeric ${m.acos==null||r.current_target==null?'':m.acos>r.current_target?'over':'good'}">${m.acos==null?'<span class="muted" style="font-size:9px">无广告销售</span>':pct(m.acos)}</span></td><td><div class="target-change${same?' same':''}"><span>${compactPct(r.current_target)}</span><span class="arrow">→</span><strong>${r.recommended_target==null?'待判断':compactPct(r.recommended_target)}</strong></div></td><td class="numeric">${num(m.spend)}</td><td class="numeric">${num(m.orders,0)}</td><td class="numeric">${num(m.inventory,0)}${m.inventory!=null&&m.inventory<3?' <span class="badge amber">保护</span>':''}</td><td><span class="badge ${confirmed.has(r.asin)?'blue':r.actionable?'teal':r.priority==='high'?'amber':'gray'}">${confirmed.has(r.asin)?'已确认执行':esc(r.action_label)}</span><div class="recommendation-reason" title="${esc(r.reason)}">${esc(r.reason)}</div></td><td><button class="icon-button" data-detail="${esc(r.asin)}" aria-label="查看 ${esc(r.asin)} 详情">${icon('chevron')}</button></td></tr>`;
  }).join(''):'<tr class="no-data-row"><td colspan="9">没有符合筛选条件的产品。</td></tr>';
  $('tableFooterText').textContent=`第 ${filtered.length?(state.tablePage-1)*state.pageSize+1:0}–${Math.min(state.tablePage*state.pageSize,filtered.length)} 项 · 建议需要人工判断后执行`;
  $('paginationText').textContent=`${state.tablePage} / ${pages}`; $('prevPage').disabled=state.tablePage<=1; $('nextPage').disabled=state.tablePage>=pages; updateSelection();
}
function updateSelection() {
  $('selectedCount').textContent=state.selected.size;
  $('confirmSelected').disabled=!state.selected.size;
  const visible=filteredRows().slice((state.tablePage-1)*state.pageSize,state.tablePage*state.pageSize).filter(isActionable);
  $('selectAll').disabled=!visible.length;
  $('selectAll').checked=visible.length>0&&visible.every(r=>state.selected.has(r.asin));
  $('selectAll').indeterminate=visible.some(r=>state.selected.has(r.asin))&&!$('selectAll').checked;
}
function renderReports() {
  $('reportList').innerHTML=state.reports.length?state.reports.map(r=>`<article class="panel report-card"><span class="report-file-icon">${icon('file')}</span><div class="report-info"><h3>${esc(r.filename)}</h3><p>${esc(period(r))} · ${esc(r.marketplace)} · ${num(r.row_count,0)} 个产品</p><div class="report-meta"><span class="badge ${r.day_count===7?'teal':'amber'}">${r.day_count===7?'7 天周报':`${r.day_count} 天历史基线`}</span><span class="badge gray">${r.ai_status==='completed'?'已完成 AI 复核':r.ai_status==='pending'?'AI 复核中':'规则分析已保存'}</span><span class="muted" style="font-size:9px">上传于 ${esc(dateLabel(r.created_at,true))}</span></div></div><div class="report-actions"><button class="button quiet small" data-versions="${esc(r.id)}">分析版本</button><a class="button secondary small" href="/api/reports/${encodeURIComponent(r.id)}/download">${icon('download')}原文件</a><button class="button primary small" data-open-report="${esc(r.id)}">查看分析</button></div></article>`).join(''):empty('还没有历史报告','每次上传的原文件和分析都会在这里保存。','<button class="button primary" data-upload>'+icon('upload')+'上传报告</button>');
}
async function loadConfirmations() {
  try { const data=await api('/api/confirmations');state.confirmations=data.confirmations||[];renderExecutions(); }
  catch(err){$('executionList').innerHTML=empty('执行记录暂时不可用',err.message);}
}
function renderExecutions() {
  if(!state.confirmations.length){$('executionList').innerHTML=empty('执行过的调整，会在这里留下记录','完成实际调整后，在逐品建议中勾选产品并确认。下一期分析会结合这些记录复盘，而不会把一条建议误当成已执行。','<button class="button secondary" data-go="recommendations">查看逐品建议 '+icon('arrow')+'</button>');return;}
  const groups=new Map();
  state.confirmations.forEach(c=>{const key=`${c.report_id}|${c.executed_at}|${c.confirmed_at}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);});
  $('executionList').innerHTML=[...groups.values()].map(items=>{
    const first=items[0];const report=state.reports.find(x=>x.id===first.report_id);
    return `<article class="panel execution-card"><div class="execution-header"><div><strong>${esc(dateLabel(first.executed_at,true))} · 完成 ${items.length} 项调整</strong><p>${esc(report?`${report.marketplace} · ${period(report)}`:'关联历史报告')} · 确认于 ${esc(dateLabel(first.confirmed_at,true))}</p></div><span class="badge teal">人工确认已执行</span></div><div class="table-scroll"><table class="execution-table"><thead><tr><th>父 ASIN</th><th>调整前</th><th>当时建议</th><th>实际执行</th><th>执行备注</th></tr></thead><tbody>${items.map(c=>`<tr><td>${esc(c.asin)}</td><td>${compactPct(c.previous_target)}</td><td>${compactPct(c.recommended_target)}</td><td><strong>${compactPct(c.actual_target)}</strong></td><td>${esc(c.note||'—')}</td></tr>`).join('')}</tbody></table></div></article>`;
  }).join('');
}
function renderSettings() {
  const s=state.settings;if(!s)return;
  $('goalAcos').value=s.target_acos??24;$('stockThreshold').value=s.inventory_threshold??3;
  $('aiSettingsStatus').innerHTML=s.ai?.configured?`<strong>${esc(s.ai.provider||'DeepSeek')} 密钥已配置</strong><p>新报告先完成数据校验与规则计算，再请求 ${esc(s.ai.provider||'DeepSeek')} 结合历史信息复核。是否成功以每次复核结果为准。模型：${esc(s.ai.model||'deepseek-chat')}。</p>`:`<strong>DeepSeek 尚未连接</strong><p>上传、历史对比、规则分析和执行确认都可以使用。接入后，新分析会增加 AI 复核。当前不会把规则输出标记成 AI 结论。</p>`;
  if(!$('backupLink')){const note=document.createElement('div');note.className='soft-note';note.innerHTML='<a id="backupLink" class="button secondary" href="/api/backup">'+icon('download')+'下载报告与记录备份</a><p style="margin-top:8px">备份包含原始报告和历史数据库，请妥善保存。</p>';$('aiSettingsStatus').parentElement.append(note);}
  if(s.access?.enabled&&!$('logoutForm')){const form=document.createElement('form');form.id='logoutForm';form.method='POST';form.action='/logout';form.style.marginTop='16px';form.innerHTML='<button class="button secondary" type="submit">退出登录</button>';$('aiSettingsStatus').parentElement.append(form);}
}
function openDetails(asin) {
  const r=state.analysis?.recommendations.find(x=>x.asin===asin);if(!r)return;
  const m=r.metrics||{},confirmation=(state.analysis.confirmations||[]).find(x=>x.asin===asin);
  const finding=(state.analysis.ai_review?.findings||[]).find(x=>x.asin===asin);
  const history=r.history||{};
  const historyParts=[];
  if(history.available){if(history.previous_acos!=null)historyParts.push(`上期实际 ACOS ${pct(history.previous_acos)}`);if(history.ad_sales_change_pct!=null)historyParts.push(`广告销售较上期${history.ad_sales_change_pct>=0?'增加':'减少'} ${num(Math.abs(history.ad_sales_change_pct))}%`);if(history.spend_change_pct!=null)historyParts.push(`广告花费较上期${history.spend_change_pct>=0?'增加':'减少'} ${num(Math.abs(history.spend_change_pct))}%`);if(history.target_changed)historyParts.push('本期报告中的目标与上期不同，需要结合实际修改时间判断');}else{historyParts.push('尚无可比较的同周期历史数据，本期先作为观察依据。');}
  if(history.execution?.evaluation)historyParts.push(history.execution.evaluation);
  if(history.execution?.blocks_new_change)historyParts.push('上次调整仍在观察期，暂不建议再次修改目标。');
  const historyText=historyParts.join('；');
  $('drawerContent').innerHTML=`<div class="drawer-product"><h2 id="drawerTitle">${esc(r.asin)}</h2><p>${esc(r.name||'商品名称缺失')}</p></div><div class="drawer-badges"><span class="badge ${r.actionable?'teal':r.priority==='high'?'amber':'gray'}">${esc(r.action_label)}</span><span class="badge gray">${({'high':'较高','medium':'中等','low':'有限'})[r.confidence]||'有限'}证据置信度</span>${confirmation?'<span class="badge blue">已确认执行</span>':''}</div><div class="drawer-metrics"><div class="drawer-metric"><small>实际 ACOS</small><strong>${m.acos==null?'无销售':pct(m.acos)}</strong></div><div class="drawer-metric"><small>广告订单</small><strong>${num(m.orders,0)}</strong></div><div class="drawer-metric"><small>当前库存</small><strong>${num(m.inventory,0)}</strong></div><div class="drawer-metric"><small>广告花费</small><strong>${num(m.spend)}</strong></div><div class="drawer-metric"><small>广告销售</small><strong>${num(m.ad_sales)}</strong></div><div class="drawer-metric"><small>报表总销售</small><strong>${num(m.total_sales)}</strong></div></div><div class="drawer-proposal"><small>目标 ACOS 建议</small><strong>${compactPct(r.current_target)} → ${r.recommended_target==null?'暂不判断':compactPct(r.recommended_target)}</strong><p>${esc(r.reason)}</p></div><div class="drawer-section"><h3>${icon('file')}判断依据</h3><ul>${(r.evidence||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>本期数据暂不足以支持更精确的调整判断。</li>'}</ul></div>${(r.anomalies||[]).map(x=>`<div class="drawer-section"><h3>${icon('info')}${esc(x.label)}</h3>${(x.possible_causes||[]).length?`<p>可能原因，尚待验证：</p><ul>${x.possible_causes.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}${(x.next_steps||[]).length?`<p>建议核查：</p><ul>${x.next_steps.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}</div>`).join('')}${historyText?`<div class="drawer-section"><h3>${icon('history')}历史与执行追踪</h3><p>${esc(historyText)}</p></div>`:''}${finding?`<div class="drawer-section"><h3>${icon('sparkles')}DeepSeek 补充复核</h3><p>${esc(finding.comment||'')}</p>${finding.possible_causes?.length?`<ul>${finding.possible_causes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${finding.next_steps?.length?`<ul>${finding.next_steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>`:''}${confirmation?`<div class="drawer-section"><h3>${icon('check')}已确认的实际执行</h3><p>实际目标 ${compactPct(confirmation.actual_target)} · ${esc(dateLabel(confirmation.executed_at,true))}</p><p>${esc(confirmation.note||'无备注')}</p></div>`:`<div class="drawer-section"><button class="button ${r.actionable?'primary':'secondary'}" data-manual-confirm="${esc(r.asin)}">${icon('check')}${r.actionable?'我已完成这项调整':'记录不同于建议的实际调整'}</button><p style="font-size:10px;margin-top:10px">只记录你已完成的操作，不会调用广告账户执行。</p></div>`}`;
  showModal('detailDrawer');
}
async function showVersions(reportId) {
  try { const data=await api(`/api/reports/${encodeURIComponent(reportId)}/analyses`);const report=state.reports.find(x=>x.id===reportId);
    $('drawerContent').innerHTML=`<div class="drawer-product"><h2 id="drawerTitle">已保存的分析版本</h2><p>${esc(report?.filename||'历史报告')}</p></div><div class="drawer-section"><p>每次重新分析都会新增一个快照，保留之前的判断和执行记录。</p></div>${(data.analyses||[]).map((x,i)=>`<div class="panel" style="padding:16px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><strong style="font-size:12px">${esc(dateLabel(x.created_at,true))}</strong><p style="font-size:10px;color:var(--muted);margin-top:4px">${x.ai_status==='completed'?'已完成 AI 复核':x.ai_status==='pending'?'AI 复核中':'规则分析已保存'}</p></div><button class="button secondary small" data-open-version="${esc(x.id)}" data-report-id="${esc(reportId)}">查看版本</button></div></div>`).join('')||'<p class="muted">暂时没有分析版本。</p>'}<div class="drawer-section"><button class="button primary" data-reanalyze="${esc(reportId)}">${icon('sparkles')}按当前规则新增分析</button></div>`;showModal('detailDrawer');
  }catch(err){toast(err.message,true);}
}
function openUpload() {
  $('uploadError').classList.add('hidden');$('uploadForm').reset();state.uploadFile=null;
  $('uploadFileLabel').textContent='点击选择，或把报告拖到这里';$('uploadFileHint').textContent='支持 .xlsx · 建议每周上传近 7 天报告';
  const end=new Date();end.setDate(end.getDate()-1);const start=new Date(end);start.setDate(start.getDate()-6);
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('uploadStart').value=localDate(start);$('uploadEnd').value=localDate(end);updatePeriodNote();showModal('uploadModal');
}
function setUploadFile(file) {
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.xlsx')){toast('请选择 .xlsx 格式的 DeepBI 报告。',true);return;}
  state.uploadFile=file;$('uploadFileLabel').textContent=file.name;$('uploadFileHint').textContent=`${num(file.size/1024,1)} KB · 原始文件会完整保存`;
  const dates=file.name.match(/(\d{4}-\d{2}-\d{2})[\s_至—-]+(\d{4}-\d{2}-\d{2})/);
  if(dates){$('uploadStart').value=dates[1];$('uploadEnd').value=dates[2];}
  const market=file.name.match(/_([A-Z]{2})_/);if(market&&[...$('uploadMarket').options].some(o=>o.value===market[1]))$('uploadMarket').value=market[1];
  updatePeriodNote();
}
function updatePeriodNote() {
  const start=new Date($('uploadStart').value+'T00:00:00Z'),end=new Date($('uploadEnd').value+'T00:00:00Z');
  const days=Math.round((end-start)/86400000)+1;
  $('uploadPeriodNote').classList.toggle('warning',days!==7);
  $('uploadPeriodNote').textContent=!Number.isFinite(days)||days<1?'请选择有效的报告起止日期。':days===7?'这是 7 天周报，将与同站点、同长度且不重叠的历史报告比较。':`这是 ${days} 天报告，将作为历史基线保存，不与 7 天报告直接计算周环比。`;
}
function openConfirmation(asins = [...state.selected], manual = false) {
  const confirmed=confirmedAsins();const rows=(state.analysis?.recommendations||[]).filter(r=>asins.includes(r.asin)&&!confirmed.has(r.asin));
  if(!rows.length){toast('请先选择尚未确认的调整。');return;}
  state.confirming=rows;state.manualConfirmation=manual||rows.some(r=>!r.actionable);
  $('confirmationItems').innerHTML=rows.map(r=>`<div class="confirmation-item"><div><strong>${esc(r.asin)}</strong><p>${esc(r.name||'')}</p><p>当前 ${compactPct(r.current_target)} · 建议 ${compactPct(r.recommended_target)}</p></div><label class="confirmation-target">实际目标 <input type="number" data-actual-target="${esc(r.asin)}" min="16" max="50" step="0.1" value="${Number(r.recommended_target??r.current_target??24)}" required aria-label="${esc(r.asin)} 实际执行目标"> %</label></div>`).join('');
  const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());$('executedAt').value=now.toISOString().slice(0,23);
  $('executionNotes').value='';$('executionAttested').checked=false;$('confirmationError').classList.add('hidden');
  $('executionNotes').required=state.manualConfirmation;
  $('executionNotes').placeholder=state.manualConfirmation?'请说明为什么实际操作不同于系统建议（必填）。':'例如：已在 DeepBI 修改目标，后续观察成交与实际 ACOS。';
  closeModal('detailDrawer');showModal('confirmModal');
}

// All data-derived strings are escaped before entering the DOM.
document.addEventListener('click',async (e)=>{
  const target=e.target.closest('button,a,.action-item');if(!target)return;
  if(target.hasAttribute('data-page')||target.hasAttribute('data-go')){e.preventDefault();navigate(target.dataset.page||target.dataset.go);}
  if(target.hasAttribute('data-upload')){e.preventDefault();openUpload();}
  if(target.dataset.close)closeModal(target.dataset.close);
  if(target.dataset.detail)openDetails(target.dataset.detail);
  if(target.dataset.openReport){await loadAnalysis(target.dataset.openReport);navigate('overview');}
  if(target.dataset.versions)showVersions(target.dataset.versions);
  if(target.dataset.openVersion){closeModal('detailDrawer');await loadAnalysis(target.dataset.reportId,target.dataset.openVersion);navigate('overview');}
  if(target.dataset.manualConfirm)openConfirmation([target.dataset.manualConfirm],!state.analysis?.recommendations.find(r=>r.asin===target.dataset.manualConfirm)?.actionable);
  if(target.hasAttribute('data-refresh'))initialize();
  if(target.dataset.reanalyze){const label=target.innerHTML;setBusy(target,true);try{const data=await api(`/api/reports/${encodeURIComponent(target.dataset.reanalyze)}/analyze`,{method:'POST'});closeModal('detailDrawer');await loadAnalysis(target.dataset.reanalyze,data.analysis?.id);toast('新的分析快照已保存，历史版本保留。');navigate('overview');}catch(err){toast(err.message,true);}finally{setBusy(target,false,label);}}
});
$('reportSelector').addEventListener('change',e=>{if(e.target.value)loadAnalysis(e.target.value);});
$('refreshButton').addEventListener('click',()=>initialize());
$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
$('productSearch').addEventListener('input',e=>{state.search=e.target.value;state.tablePage=1;renderRecommendations();});
$('actionFilter').addEventListener('change',e=>{state.actionFilter=e.target.value;state.tablePage=1;renderRecommendations();});
$('issueFilter').addEventListener('change',e=>{state.issueFilter=e.target.value;state.tablePage=1;renderRecommendations();});
$('recommendationRows').addEventListener('change',e=>{if(e.target.dataset.select){e.target.checked?state.selected.add(e.target.dataset.select):state.selected.delete(e.target.dataset.select);renderRecommendations();}});
$('selectAll').addEventListener('change',e=>{filteredRows().slice((state.tablePage-1)*state.pageSize,state.tablePage*state.pageSize).filter(isActionable).forEach(r=>e.target.checked?state.selected.add(r.asin):state.selected.delete(r.asin));renderRecommendations();});
$('prevPage').addEventListener('click',()=>{state.tablePage--;renderRecommendations();});$('nextPage').addEventListener('click',()=>{state.tablePage++;renderRecommendations();});
$('confirmSelected').addEventListener('click',()=>openConfirmation());
$('exportRecommendations').addEventListener('click',()=>{if(state.analysis)location.href=`/api/reports/${encodeURIComponent(state.analysis.report_id)}/export?analysis_id=${encodeURIComponent(state.analysis.id)}`;else toast('请先上传或选择报告。');});
$('reportFile').addEventListener('change',e=>setUploadFile(e.target.files[0]));
['uploadStart','uploadEnd'].forEach(id=>$(id).addEventListener('change',updatePeriodNote));
['dragenter','dragover'].forEach(evt=>$('dropzone').addEventListener(evt,e=>{e.preventDefault();$('dropzone').classList.add('dragover');}));
['dragleave','drop'].forEach(evt=>$('dropzone').addEventListener(evt,e=>{e.preventDefault();$('dropzone').classList.remove('dragover');}));
$('dropzone').addEventListener('drop',e=>{const file=e.dataTransfer.files[0];if(file){setUploadFile(file);const transfer=new DataTransfer();transfer.items.add(file);$('reportFile').files=transfer.files;}});
$('uploadForm').addEventListener('submit',async e=>{
  e.preventDefault();const file=state.uploadFile||$('reportFile').files[0];if(!file)return;
  if($('uploadStart').value>$('uploadEnd').value){$('uploadError').textContent='开始日期不能晚于结束日期。';$('uploadError').classList.remove('hidden');return;}
  const button=$('uploadSubmit'),label=button.innerHTML;setBusy(button,true);$('uploadError').classList.add('hidden');
  try{const data=new FormData();data.append('file',file);data.append('marketplace',$('uploadMarket').value);data.append('start_date',$('uploadStart').value);data.append('end_date',$('uploadEnd').value);
    const result=await api('/api/reports',{method:'POST',body:data});closeModal('uploadModal');
    const all=await api('/api/reports');state.reports=all.reports||[];renderReportSelector();renderReports();await loadAnalysis(result.report.id);navigate('overview');toast(result.duplicate?'这份报告已存在，已打开保存的分析。':'报告与分析已保存。你可以开始查看本期建议。');
  }catch(err){$('uploadError').textContent=err.message;$('uploadError').classList.remove('hidden');}finally{setBusy(button,false,label);}
});
$('confirmationForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!state.analysis||!$('executionAttested').checked)return;
  const button=$('confirmationSubmit'),label=button.innerHTML;setBusy(button,true);$('confirmationError').classList.add('hidden');
  try{const executed=new Date($('executedAt').value);if(Number.isNaN(executed.valueOf()))throw new Error('请选择实际执行时间。');if(executed>new Date())throw new Error('执行时间不能在未来。');if(executed<new Date(state.analysis.created_at))throw new Error('实际执行时间应在这份分析生成之后。');
    const note=$('executionNotes').value.trim();if(state.manualConfirmation&&!note)throw new Error('请说明实际操作不同于建议的原因。');
    const items=state.confirming.map(r=>({asin:r.asin,actual_target:Number(document.querySelector(`[data-actual-target="${CSS.escape(r.asin)}"]`).value),note}));
    if(items.some(x=>!Number.isFinite(x.actual_target)||x.actual_target<16||x.actual_target>50))throw new Error('实际目标 ACOS 必须在16%至50%之间。');
    await api(`/api/reports/${encodeURIComponent(state.analysis.report_id)}/confirmations`,{method:'POST',body:JSON.stringify({analysis_id:state.analysis.id,executed_at:executed.toISOString(),items})});
    closeModal('confirmModal');await loadAnalysis(state.analysis.report_id,state.analysis.id);await loadConfirmations();toast(`已记录你的 ${items.length} 项执行确认，后续报告会参考这些变化。`);
  }catch(err){$('confirmationError').textContent=err.message;$('confirmationError').classList.remove('hidden');}finally{setBusy(button,false,label);}
});
$('settingsForm').addEventListener('submit',async e=>{
  e.preventDefault();const button=e.target.querySelector('[type=submit]'),label=button.innerHTML;setBusy(button,true);
  try{state.settings=await api('/api/settings',{method:'PUT',body:JSON.stringify({target_acos:Number($('goalAcos').value),growth_priority:true})});renderSettings();updateEngineStatus();toast('经营目标已保存。新分析将使用新规则，历史分析不会被覆盖。');}
  catch(err){toast(err.message,true);}finally{setBusy(button,false,label);}
});
document.querySelectorAll('.modal-backdrop,.drawer-backdrop').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)closeModal(el.id);}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal-backdrop:not(.hidden),.drawer-backdrop:not(.hidden)').forEach(el=>closeModal(el.id));$('sidebar').classList.remove('open');}if(e.key==='Tab'){const modal=document.querySelector('.modal-backdrop:not(.hidden),.drawer-backdrop:not(.hidden)');if(!modal)return;const focusables=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,a[href]')].filter(el=>el.offsetParent!==null);if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
hydrateIcons();navigate(location.hash.slice(1)||'overview');initialize();
