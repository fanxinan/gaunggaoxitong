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
const stored = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
const remember = (key, value) => { try { localStorage.setItem(key,value); } catch (_) {} };
const cookieLanguage = document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('zhouce_lang='))?.split('=')[1];
const initialLanguage = ['zh','en'].includes(cookieLanguage) ? cookieLanguage : stored('zhouce_language');
const MARKETS = {AE:{zh:'阿联酋',en:'United Arab Emirates',short:'UAE',currency:'AED'},SA:{zh:'沙特阿拉伯',en:'Saudi Arabia',short:'Saudi Arabia',currency:'SAR'}};
const state = {market:['AE','SA'].includes(stored('zhouce_market'))?stored('zhouce_market'):'AE',lang:initialLanguage==='en'?'en':'zh',reports:[],analysis:null,settings:null,confirmations:[],page:'overview',selected:new Set(),search:'',actionFilter:'',issueFilter:'',tablePage:1,pageSize:30,uploadFile:null,poll:null,manualConfirmation:false,loading:false,confirming:[],mutationCount:0};
const t = (zh,en) => state.lang==='en'?en:zh;
const locale = () => state.lang==='en'?'en-GB':'zh-CN';
const plural = (count,one,many=one+'s') => count===1?one:many;
const marketName = (code=state.market) => MARKETS[code]?.[state.lang] || code;
const currency = () => MARKETS[state.market].currency;
const num = (value,digits=2) => value==null||!Number.isFinite(Number(value))?'—':Number(value).toLocaleString(locale(),{minimumFractionDigits:digits,maximumFractionDigits:digits});
const pct = (value) => value==null?t('无广告销售','No ad sales'):`${num(value)}%`;
const compactPct = (value) => value==null?'—':`${Number(value).toLocaleString(locale(),{maximumFractionDigits:2})}%`;
const dateLabel = (value,withTime=false) => {if(!value)return '—';const d=new Date(value);return Number.isNaN(d.valueOf())?String(value):d.toLocaleString(locale(),{year:'numeric',month:'2-digit',day:'2-digit',...(withTime?{hour:'2-digit',minute:'2-digit'}:{})});};
const period = (r) => r?`${r.start_date} — ${r.end_date}`:t('未选择报告','No report selected');
const periodType = (days) => days===7?t('7 天周报','7-day report'):t(`${days} 天历史基线`,`${days}-day baseline`);
const pageLabel = (page) => ({overview:t('经营总览','Overview'),recommendations:t('逐品建议','Product recommendations'),reports:t('历史报告','Report history'),executions:t('执行记录','Execution log'),settings:t('分析设置','Analysis settings')})[page];
let contextVersion=0,requestVersion=0,loadVersion=0;

function apiUrl(path) {
  const url=new URL(path,location.origin);url.searchParams.set('lang',state.lang);
  if(['/api/reports','/api/settings','/api/confirmations'].includes(url.pathname))url.searchParams.set('marketplace',state.market);
  return url.pathname+url.search;
}
async function api(path,options={}) {
  const config={...options,headers:{'Accept-Language':state.lang,...(options.body&&!(options.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(options.headers||{})}};
  const response=await fetch(apiUrl(path),config);
  if(response.status===401){location.replace(`/login?lang=${state.lang}`);throw new Error(t('登录已过期，请重新登录。','Your session has expired. Please sign in again.'));}
  if(!response.ok){let message=t(`请求失败（${response.status}）`,`Request failed (${response.status})`);try{const data=await response.json();message=typeof data.detail==='string'?data.detail:data.detail?JSON.stringify(data.detail):data.message||message;}catch(_){}throw new Error(message);}
  return response.status===204?null:response.json();
}
function hydrateIcons(container=document){container.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
function toast(message,error=false){const el=document.createElement('div');el.className=`toast${error?' error':''}`;el.textContent=message;$('toastContainer').append(el);setTimeout(()=>el.remove(),error?8000:4500);}
function showModal(id){$(id).classList.remove('hidden');document.body.style.overflow='hidden';const focusable=$(id).querySelector('input:not([type=file]),button,select');if(focusable)setTimeout(()=>focusable.focus(),40);}
function closeModal(id){$(id).classList.add('hidden');if(!document.querySelector('.modal-backdrop:not(.hidden),.drawer-backdrop:not(.hidden)'))document.body.style.overflow='';}
function setBusy(button,busy,label){button.disabled=busy;button.innerHTML=busy?`<span class="spinner"></span>${t('处理中…','Working…')}`:label;}
function mutationBusy(busy){state.mutationCount=Math.max(0,state.mutationCount+(busy?1:-1));['siteSelector','languageSelector','reportSelector'].forEach(id=>$(id).disabled=state.mutationCount>0);}
function applyLocale(){
  remember('zhouce_language',state.lang);remember('zhouce_market',state.market);
  document.cookie=`zhouce_lang=${state.lang}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
  window.applyStaticLocale?.(state.lang);document.documentElement.lang=state.lang==='en'?'en':'zh-CN';
  document.title=t('周策 · 广告经营复盘','Zhouce · Weekly Advertising Review');
  $('siteSelector').value=state.market;$('languageSelector').value=state.lang;
  $('workspaceMarketName').textContent=`Amazon · ${marketName()}`;$('workspaceCurrency').textContent=`${state.market} · ${currency()}`;
  $('breadcrumbCurrent').textContent=pageLabel(state.page);
  hydrateIcons();
}
function navigate(page){
  if(!pageLabel(page))page='overview';state.page=page;
  document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  $('breadcrumbCurrent').textContent=pageLabel(page);$('sidebar').classList.remove('open');
  if(location.hash!==`#${page}`)history.replaceState(null,'',`#${page}`);
  if(page==='executions')loadConfirmations();
}
function updateEngineStatus(){
  const status=state.analysis?.ai_review?.status,configured=state.settings?.ai?.configured;
  let text=configured?t('DeepSeek 密钥已配置','DeepSeek key configured'):t('规则分析 · DeepSeek 未连接','Rule analysis · AI not connected');
  if(status==='pending')text=t('规则已完成 · AI 复核中','Rules ready · AI reviewing');
  if(status==='completed')text=t('规则计算 + DeepSeek 复核','Rules + DeepSeek review');
  if(status==='failed')text=t('规则已完成 · AI 复核失败','Rules ready · AI review failed');
  $('engineStatus').innerHTML=`<i></i>${esc(text)}`;
}
function empty(title,description,button=''){return `<div class="panel empty-state"><span>${icon('folder')}</span><h2>${esc(title)}</h2><p>${esc(description)}</p>${button}</div>`;}
async function changeContext(market,lang){
  if(state.mutationCount)return;
  const sameMarket=market===state.market;
  const preferred=sameMarket&&state.analysis?{reportId:state.analysis.report_id,analysisId:state.analysis.id}:null;
  contextVersion++;requestVersion++;clearTimeout(state.poll);
  state.market=MARKETS[market]?market:'AE';state.lang=lang==='en'?'en':'zh';
  state.analysis=null;state.settings=null;state.reports=[];state.confirmations=[];state.selected.clear();
  state.search='';state.actionFilter='';state.issueFilter='';state.tablePage=1;state.confirming=[];
  $('productSearch').value='';$('issueFilter').value='';
  document.querySelectorAll('.modal-backdrop,.drawer-backdrop').forEach(el=>closeModal(el.id));
  $('toastContainer').replaceChildren();applyLocale();renderReportSelector();renderOverview();renderRecommendations();renderReports();renderExecutions();renderSettings();updateEngineStatus();
  await initialize(preferred);
}
async function initialize(preferred=null){
  const context=contextVersion,version=++loadVersion;state.loading=true;
  try{
    const results=await Promise.allSettled([api('/api/reports'),api('/api/settings'),api('/api/confirmations')]);
    if(context!==contextVersion||version!==loadVersion)return;
    if(results[0].status==='rejected')throw results[0].reason;
    state.reports=(results[0].value.reports||[]).filter(r=>r.marketplace===state.market);
    state.settings=results[1].status==='fulfilled'?results[1].value:null;
    state.confirmations=results[2].status==='fulfilled'?results[2].value.confirmations||[]:[];
    if(results[1].status==='rejected')toast(t('设置加载失败：','Settings could not be loaded: ')+results[1].reason.message,true);
    if(results[2].status==='rejected')toast(t('执行记录加载失败：','Execution log could not be loaded: ')+results[2].reason.message,true);
    renderReportSelector();renderReports();renderSettings();renderExecutions();
    const chosen=preferred|| (state.analysis?{reportId:state.analysis.report_id,analysisId:state.analysis.id}:null);
    if(state.reports.length){const exists=chosen&&state.reports.some(r=>r.id===chosen.reportId);await loadAnalysis(exists?chosen.reportId:state.reports[0].id,exists?chosen.analysisId:null);}
    else {state.analysis=null;renderOverview();renderRecommendations();}
    if(context===contextVersion)updateEngineStatus();
  }catch(err){if(context!==contextVersion||version!==loadVersion)return;$('overviewContent').innerHTML=empty(t('工作台暂时无法连接','Workspace unavailable'),err.message,`<button class="button primary" data-refresh>${t('重新连接','Retry')}</button>`);toast(err.message,true);}
  finally{if(context===contextVersion&&version===loadVersion)state.loading=false;}
}
function renderReportSelector(){
  $('reportSelector').innerHTML=state.reports.length?state.reports.map(r=>`<option value="${esc(r.id)}">${esc(r.marketplace)} · ${esc(period(r))}${r.day_count===7?'':t(' · 历史基线',' · Baseline')}</option>`).join(''):`<option value="">${t('该站点尚无报告','No reports for this marketplace')}</option>`;
  if(state.analysis)$('reportSelector').value=state.analysis.report_id;
}
async function loadAnalysis(reportId,analysisId=null){
  const context=contextVersion,version=++requestVersion;clearTimeout(state.poll);
  if(!state.reports.some(r=>r.id===reportId&&r.marketplace===state.market))return;
  try{
    const path=analysisId?`/api/reports/${encodeURIComponent(reportId)}/analyses/${encodeURIComponent(analysisId)}`:`/api/reports/${encodeURIComponent(reportId)}/analysis`;
    const analysis=await api(path);
    if(context!==contextVersion||version!==requestVersion)return;
    if(analysis.report?.marketplace!==state.market)throw new Error(t('报告站点与当前站点不一致。','This report belongs to a different marketplace.'));
    state.analysis=analysis;state.selected.clear();state.tablePage=1;$('reportSelector').value=reportId;
    renderOverview();renderRecommendations();updateEngineStatus();
    if(analysis.ai_review?.status==='pending')schedulePoll(reportId,analysis.id,context,version);
  }catch(err){if(context!==contextVersion||version!==requestVersion)return;state.analysis=null;$('overviewContent').innerHTML=empty(t('这份报告的分析暂时不可用','Analysis unavailable'),err.message);renderRecommendations();toast(err.message,true);}
}
function schedulePoll(reportId,analysisId,context,version){
  state.poll=setTimeout(async()=>{
    if(context!==contextVersion||version!==requestVersion||state.analysis?.id!==analysisId)return;
    try{
      const fresh=await api(`/api/reports/${encodeURIComponent(reportId)}/analyses/${encodeURIComponent(analysisId)}`);
      if(context!==contextVersion||version!==requestVersion||state.analysis?.id!==analysisId)return;
      state.analysis=fresh;renderOverview();updateEngineStatus();
      if(fresh.ai_review?.status==='pending')schedulePoll(reportId,analysisId,context,version);
      else{renderRecommendations();if(fresh.ai_review?.status==='completed')toast(t('DeepSeek 复核已完成并留档。','DeepSeek review completed and saved.'));}
    }catch(_){if(context===contextVersion&&version===requestVersion&&state.analysis?.id===analysisId)schedulePoll(reportId,analysisId,context,version);}
  },4000);
}
function metricDelta(value,kind='sales'){
  if(value==null)return `<span>${t('等待可比较的周报','Awaiting a comparable report')}</span>`;
  const positive=kind==='cost'?value<=0:value>=0;
  return `<span class="${positive?'positive':'negative'}">${value>0?'↑':value<0?'↓':'—'} ${num(Math.abs(value))}${kind==='acos'?t(' 个百分点',' pp'):'%'}</span><span>${t('对比上期','vs. previous period')}</span>`;
}
function metricCard(title,value,iconName,bottom,primary=false,warning=false){return `<div class="metric-card${primary?' primary-metric':''}${warning?' quality-warning':''}"><div class="metric-label">${esc(title)}${warning?`<span title="${t('销售口径不一致，暂不用于增长结论','Sales totals need reconciliation before assessing growth')}">${icon('info')}</span>`:''}</div><span class="metric-icon">${icon(iconName)}</span><div class="metric-value">${value}</div><div class="metric-bottom">${bottom}</div></div>`;}
function renderOverview(){
  const a=state.analysis;
  if(!a){$('overviewContent').innerHTML=empty(t(`从${marketName()}的第一份报告开始`,`Start with your first ${marketName()} report`),t('上传 DeepBI 报告，保存本期数据与建议。后续分析会参考该站点历史和已确认调整。','Upload a DeepBI report to save its data and recommendations. Future reviews will use this marketplace’s history and confirmed changes.'),`<button class="button primary" data-upload>${icon('upload')}${t('上传第一份报告','Upload first report')}</button>`);return;}
  const s=a.summary,r=a.report,c=a.comparison||{},goal=s.goal_acos??state.settings?.target_acos??24;
  const comparison=c.available?c.metrics||{}:{},quality=a.quality?.warnings||[],limitations=Array.isArray(a.ai_review?.limitations)?a.ai_review.limitations.join(' '):a.ai_review?.limitations||'';
  const risks=(a.recommendations||[]).filter(x=>x.priority==='high'||(x.anomalies||[]).length).sort((x,y)=>(x.priority==='high'?-1:1)-(y.priority==='high'?-1:1)||(y.metrics?.spend||0)-(x.metrics?.spend||0)).slice(0,4);
  const aiDone=a.ai_review?.status==='completed',description=aiDone&&a.ai_review.summary?a.ai_review.summary:(s.observations||[]).slice(0,2).join(' ');
  const good=s.acos!=null&&s.acos<=goal,width=s.acos==null?0:Math.min(100,s.acos/(goal*1.25)*100),history=state.reports.slice(0,3);
  $('overviewContent').innerHTML=`
    <div class="report-context"><div class="context-left"><span class="market-chip">${esc(marketName(r.marketplace))} · ${esc(r.marketplace)} · ${currency()}</span><span>${esc(period(r))}</span><span class="period-chip${r.day_count!==7?' baseline':''}">${periodType(r.day_count)}</span><span class="context-dot"></span><span>${num(s.listing_count,0)} ${t('个产品',plural(s.listing_count,'product'))}</span></div><span>${t('分析留档于','Analysis saved')} ${esc(dateLabel(a.created_at,true))}</span></div>
    <div class="metrics-grid">
      ${metricCard(s.total_sales_reliable?t(`站点总营业额 (${currency()})`,`Marketplace revenue (${currency()})`):t(`报表营业额 · 待核对 (${currency()})`,`Reported revenue · unverified (${currency()})`),num(s.total_sales),'trend',s.total_sales_reliable?metricDelta(comparison.total_sales_pct):`<span style="color:var(--amber)">${t('口径待核对 · 暂不判断增长','Reconciliation needed · growth unverified')}</span>`,false,!s.total_sales_reliable)}
      ${metricCard(t(`广告归因销售额 (${currency()})`,`Attributed ad sales (${currency()})`),num(s.ad_sales),'cart',metricDelta(comparison.ad_sales_pct))}
      ${metricCard(t(`广告总花费 (${currency()})`,`Ad spend (${currency()})`),num(s.ad_spend),'wallet',metricDelta(comparison.spend_pct,'cost'))}
      ${metricCard(t('站点实际 ACOS','Marketplace actual ACOS'),s.acos==null?'—':`${num(s.acos)}<span style="font-size:20px">%</span>`,'target',`<span class="${good?'positive':'negative'}">${good?t('在预期范围内','Within your goal'):s.acos==null?t('暂无广告销售','No ad sales'):t('高于经营预期','Above your goal')}</span><span>${t('目标','Goal')} ${compactPct(goal)}</span>`,true)}
    </div>
    <div class="overview-grid"><div class="panel insight-panel"><div class="insight-eyebrow">${icon('sparkles')}${aiDone?t('DEEPSEEK 复核 · 本期观察','DEEPSEEK REVIEW · THIS PERIOD'):t('规则分析 · 本期观察','RULE ANALYSIS · THIS PERIOD')}</div><h2>${esc(s.headline||t('让增长与广告效率一起向前。','Grow revenue with better advertising efficiency.'))}</h2><p class="insight-description">${esc(description)}</p>${aiDone?`<p class="ai-original-note">${esc(a.ai_review?.localization_notice||t('AI 补充内容保留生成时的语言。','AI commentary is preserved in its original language.'))}</p>`:''}<div class="insight-footer"><span><strong>${num(s.action_count,0)}</strong> ${t('个调整候选',plural(s.action_count,'adjustment candidate'))} · <strong>${num(s.at_risk_count,0)}</strong> ${t('个产品待排查',plural(s.at_risk_count,'product to investigate','products to investigate'))}</span><button class="button" data-go="recommendations">${t('查看逐品建议','View recommendations')} ${icon('arrow')}</button></div></div>
    <div class="panel goal-panel"><div class="panel-title"><h2>${t('广告成本与经营预期','Advertising cost vs. your goal')}</h2><small>${t('按销售加权计算','Sales-weighted calculation')}</small></div><div class="goal-figures"><div><small>${t('实际 ACOS','Actual ACOS')}</small><strong>${s.acos==null?'—':num(s.acos)+'%'}</strong></div><div class="goal-target"><small>${t('经营预期','Your goal')}</small><strong>≤ ${compactPct(goal)}</strong></div></div><div class="goal-track"><div class="goal-fill${good?'':' over'}" style="width:${width}%"></div><i class="goal-marker"></i></div><div class="goal-legend"><span>0%</span><span>${compactPct(goal)} ${t('目标线','goal')}</span><span>${compactPct(goal*1.25)}</span></div><div class="goal-note">${icon('info')}<span>${c.available?esc(t(`已关联 ${c.previous_period||'上期报告'}。最终看本站点的成本与营业额。`,`Compared with ${c.previous_period||'the previous report'}. Assess cost and revenue within this marketplace.`)):esc(c.reason||t('等待同站点的可比较周报。','Awaiting a comparable report for this marketplace.'))}</span></div></div></div>
    <div class="bottom-grid"><div class="panel action-panel"><div class="panel-title"><h2>${t('本周先关注这些产品','Products to review first')}</h2><button class="button text" data-go="recommendations">${t('全部建议','All recommendations')} ${icon('chevron')}</button></div>${risks.length?risks.map((x,i)=>`<div class="action-item" data-detail="${esc(x.asin)}"><span class="action-number">0${i+1}</span><div class="action-item-content"><div class="action-name">${esc(x.asin)} <span class="badge ${x.priority==='high'?'amber':'gray'}">${esc(x.action_label)}</span></div><p>${esc(x.reason?.slice(0,140)||'')}</p></div><span class="action-chevron">${icon('chevron')}</span></div>`).join(''):`<div class="empty-timeline">${t('本期没有高优先级异常，继续观察增长与成本变化。','No high-priority anomalies this period. Continue monitoring growth and cost.')}</div>`}</div>
    <div class="panel history-panel"><div class="panel-title"><h2>${t('每一期，都是下一期的依据','Each report informs the next')}</h2><small>${t('历史已保存','History saved')}</small></div>${history.map(x=>`<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${esc(period(x))}</strong><p>${esc(x.marketplace)} · ${num(x.row_count,0)} ${t('个产品',plural(x.row_count,'product'))} · ${periodType(x.day_count)}</p><span class="badge ${x.id===r.id?'teal':'gray'}">${x.id===r.id?t('当前查看','Viewing'):t('已归档','Archived')}</span></div></div>`).join('')}<div class="timeline-footer"><span>${t(`共 ${state.reports.length} 份报告`,`${state.reports.length} ${plural(state.reports.length,'report')}`)}</span><a href="#reports" data-go="reports">${t('打开历史报告','Open report history')} →</a></div></div></div>
    <div class="overview-notice">${icon('shield')}<div>${quality.length?esc(quality.slice(0,2).join(' ')):t('数据通过基础校验；分析会区分事实与可能原因。','Basic validation passed. Analysis distinguishes facts from possible causes.')} <span class="muted">${esc(limitations)} ${t(`本站点金额按 ${currency()} 展示，不与另一站点汇总或换算。`,`Amounts are shown in ${currency()} for this marketplace; currencies are not combined or converted.`)} ${a.ai_review?.status==='unavailable'?t('DeepSeek 尚未连接，当前为规则分析。','DeepSeek is not connected; rule analysis is shown.'):a.ai_review?.status==='failed'?t('AI 复核未完成，规则与原始数据已保存。','AI review failed; rules and original data remain saved.'):''}</span></div></div>`;
}
function confirmedAsins(){return new Set((state.analysis?.confirmations||[]).map(x=>x.asin));}
function isActionable(row){return Boolean(row.actionable)&&!confirmedAsins().has(row.asin);}
function filteredRows(){const query=state.search.trim().toLowerCase();return (state.analysis?.recommendations||[]).filter(r=>(!query||`${r.asin} ${r.name||''}`.toLowerCase().includes(query))&&(!state.actionFilter||r.action===state.actionFilter)&&(!state.issueFilter||state.issueFilter==='issue'&&(r.anomalies||[]).length||state.issueFilter==='actionable'&&isActionable(r)||state.issueFilter==='selected'&&state.selected.has(r.asin)));}
function renderRecommendations(){
  const a=state.analysis;$('recommendationGoal').textContent=compactPct(a?.summary.goal_acos??state.settings?.target_acos??24);
  if(!a){$('recommendationRows').innerHTML=`<tr class="no-data-row"><td colspan="9">${t('上传该站点报告后，这里会显示逐品建议。','Upload a report for this marketplace to see product recommendations.')}</td></tr>`;$('recommendationContext').innerHTML='';$('tableCount').textContent='';$('recommendationCount').textContent='0';$('actionFilter').innerHTML=`<option value="">${t('全部建议','All recommendations')}</option>`;$('tableFooterText').textContent='—';$('paginationText').textContent='1 / 1';$('prevPage').disabled=true;$('nextPage').disabled=true;updateSelection();return;}
  const actions=new Map(a.recommendations.map(r=>[r.action,r.action_label]));
  $('actionFilter').innerHTML=`<option value="">${t('全部建议','All recommendations')}</option>`+[...actions].map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join('');
  if(!actions.has(state.actionFilter))state.actionFilter='';$('actionFilter').value=state.actionFilter;
  const filtered=filteredRows(),pages=Math.max(1,Math.ceil(filtered.length/state.pageSize));state.tablePage=Math.min(state.tablePage,pages);
  const visible=filtered.slice((state.tablePage-1)*state.pageSize,state.tablePage*state.pageSize),confirmed=confirmedAsins();
  $('recommendationCount').textContent=num(a.summary.action_count,0);
  $('recommendationContext').innerHTML=`<div class="summary-strip"><span><strong>${num(a.summary.listing_count,0)}</strong> ${t('产品',plural(a.summary.listing_count,'product'))}</span><span><strong>${num(a.summary.action_count,0)}</strong> ${t('调整候选','candidates')}</span><span><strong>${num(a.summary.at_risk_count,0)}</strong> ${t('待排查','to investigate')}</span><span><strong>${confirmed.size}</strong> ${t('已确认执行','confirmed')}</span><span class="summary-period">${esc(a.report.marketplace)} · ${currency()} · ${esc(period(a.report))}</span></div>`;
  $('tableCount').textContent=t(`共 ${filtered.length} 个产品`,`${filtered.length} ${plural(filtered.length,'product')}`);
  $('recommendationRows').innerHTML=visible.length?visible.map(r=>{
    const m=r.metrics||{},same=r.recommended_target==null||r.current_target===r.recommended_target;
    const title=confirmed.has(r.asin)?t('已确认执行','Execution confirmed'):r.actionable?t('选择这项调整','Select this adjustment'):t('暂不建议调整，可在详情中记录实际操作','No target change suggested; record your actual action in the details');
    return `<tr class="${state.selected.has(r.asin)?'selected':''}"><td class="checkbox-cell"><input type="checkbox" data-select="${esc(r.asin)}" ${state.selected.has(r.asin)?'checked':''} ${isActionable(r)?'':'disabled'} aria-label="${t('选择','Select')} ${esc(r.asin)}" title="${esc(title)}"></td><td><div class="product-id">${esc(r.asin)}</div><div class="product-name" title="${esc(r.name)}">${esc(r.name||t('商品名称缺失','Product name unavailable'))}</div></td><td><span class="acos-value numeric ${m.acos==null||r.current_target==null?'':m.acos>r.current_target?'over':'good'}">${pct(m.acos)}</span></td><td><div class="target-change${same?' same':''}"><span>${compactPct(r.current_target)}</span><span class="arrow">→</span><strong>${r.recommended_target==null?t('待判断','To review'):compactPct(r.recommended_target)}</strong></div></td><td class="numeric">${num(m.spend)}</td><td class="numeric">${num(m.orders,0)}</td><td class="numeric">${num(m.inventory,0)}${m.inventory!=null&&m.inventory<3?` <span class="badge amber">${t('保护','Protected')}</span>`:''}</td><td><span class="badge ${confirmed.has(r.asin)?'blue':r.actionable?'teal':r.priority==='high'?'amber':'gray'}">${confirmed.has(r.asin)?t('已确认执行','Execution confirmed'):esc(r.action_label)}</span><div class="recommendation-reason" title="${esc(r.reason)}">${esc(r.reason)}</div></td><td><button class="icon-button" data-detail="${esc(r.asin)}" aria-label="${t('查看详情','View details')} ${esc(r.asin)}">${icon('chevron')}</button></td></tr>`;
  }).join(''):`<tr class="no-data-row"><td colspan="9">${t('没有符合筛选条件的产品。','No products match these filters.')}</td></tr>`;
  const first=filtered.length?(state.tablePage-1)*state.pageSize+1:0,last=Math.min(state.tablePage*state.pageSize,filtered.length);
  $('tableFooterText').textContent=t(`第 ${first}–${last} 项 · 金额 ${currency()} · 建议需人工判断后执行`,`${first}–${last} · Amounts in ${currency()} · Review recommendations before acting`);
  $('paginationText').textContent=`${state.tablePage} / ${pages}`;$('prevPage').disabled=state.tablePage<=1;$('nextPage').disabled=state.tablePage>=pages;updateSelection();
}
function updateSelection(){
  $('selectedCount').textContent=state.selected.size;$('confirmSelected').disabled=!state.selected.size;
  const visible=filteredRows().slice((state.tablePage-1)*state.pageSize,state.tablePage*state.pageSize).filter(isActionable);
  $('selectAll').disabled=!visible.length;$('selectAll').checked=visible.length>0&&visible.every(r=>state.selected.has(r.asin));$('selectAll').indeterminate=visible.some(r=>state.selected.has(r.asin))&&!$('selectAll').checked;
}
const reviewStatus=(status)=>status==='completed'?t('已完成 AI 复核','AI review complete'):status==='pending'?t('AI 复核中','AI review in progress'):status==='failed'?t('AI 复核失败 · 规则已保存','AI review failed · rules saved'):t('规则分析已保存','Rule analysis saved');
function renderReports(){
  $('reportList').innerHTML=state.reports.length?state.reports.map(r=>`<article class="panel report-card"><span class="report-file-icon">${icon('file')}</span><div class="report-info"><h3>${esc(r.filename)}</h3><p>${esc(period(r))} · ${esc(r.marketplace)} · ${currency()} · ${num(r.row_count,0)} ${t('个产品',plural(r.row_count,'product'))}</p><div class="report-meta"><span class="badge ${r.day_count===7?'teal':'amber'}">${periodType(r.day_count)}</span><span class="badge gray">${reviewStatus(r.ai_status)}</span><span class="muted" style="font-size:9px">${t('上传于','Uploaded')} ${esc(dateLabel(r.created_at,true))}</span></div></div><div class="report-actions"><button class="button quiet small" data-versions="${esc(r.id)}">${t('分析版本','Versions')}</button><a class="button secondary small" href="${apiUrl(`/api/reports/${encodeURIComponent(r.id)}/download`)}">${icon('download')}${t('原文件','Original')}</a><button class="button primary small" data-open-report="${esc(r.id)}">${t('查看分析','View analysis')}</button></div></article>`).join(''):empty(t(`${marketName()}尚无历史报告`,`No report history for ${marketName()}`),t('该站点上传的原文件和分析会保存在这里。','Original files and analyses for this marketplace will appear here.'),`<button class="button primary" data-upload>${icon('upload')}${t('上传报告','Upload report')}</button>`);
}
async function loadConfirmations(){const context=contextVersion;try{const data=await api('/api/confirmations');if(context!==contextVersion)return;state.confirmations=data.confirmations||[];renderExecutions();}catch(err){if(context===contextVersion)$('executionList').innerHTML=empty(t('执行记录暂时不可用','Execution log unavailable'),err.message);}}
function renderExecutions(){
  if(!state.confirmations.length){$('executionList').innerHTML=empty(t(`${marketName()}的执行调整会在这里留档`,`Your ${marketName()} adjustments will be saved here`),t('完成实际调整后，在逐品建议中确认。下期分析会参考本站点的执行记录。','Confirm your actual changes from product recommendations. Future reviews will use this marketplace’s execution history.'),`<button class="button secondary" data-go="recommendations">${t('查看逐品建议','View recommendations')} ${icon('arrow')}</button>`);return;}
  const groups=new Map();state.confirmations.forEach(c=>{const key=`${c.report_id}|${c.executed_at}|${c.confirmed_at}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);});
  $('executionList').innerHTML=[...groups.values()].map(items=>{const first=items[0],report=state.reports.find(x=>x.id===first.report_id);return `<article class="panel execution-card"><div class="execution-header"><div><strong>${esc(dateLabel(first.executed_at,true))} · ${t(`完成 ${items.length} 项调整`,`${items.length} ${plural(items.length,'adjustment')} completed`)}</strong><p>${esc(report?`${report.marketplace} · ${period(report)}`:state.market)} · ${t('确认于','Confirmed')} ${esc(dateLabel(first.confirmed_at,true))}</p></div><span class="badge teal">${t('人工确认已执行','User-confirmed execution')}</span></div><div class="table-scroll"><table class="execution-table"><thead><tr><th>${t('父 ASIN','Parent ASIN')}</th><th>${t('调整前','Before')}</th><th>${t('当时建议','Recommendation')}</th><th>${t('实际执行','Actual target')}</th><th>${t('执行备注','Notes')}</th></tr></thead><tbody>${items.map(c=>`<tr><td>${esc(c.asin)}</td><td>${compactPct(c.previous_target)}</td><td>${compactPct(c.recommended_target)}</td><td><strong>${compactPct(c.actual_target)}</strong></td><td>${esc(c.note||'—')}</td></tr>`).join('')}</tbody></table></div></article>`;}).join('');
}
function renderSettings(){
  const s=state.settings;$('goalAcos').value=s?.target_acos??24;$('stockThreshold').value=s?.inventory_threshold??3;
  $('settingsForm').querySelector('button[type=submit]').disabled=!s;
  let context=$('settingsMarketContext');if(!context){context=document.createElement('div');context.id='settingsMarketContext';context.className='settings-market-context';$('settingsForm').before(context);}
  context.textContent=t(`当前设置仅用于 Amazon ${marketName()}（${state.market}）；另一站点独立保存。`,`These settings apply only to Amazon ${marketName()} (${state.market}); the other marketplace is configured separately.`);
  if(!s){$('aiSettingsStatus').textContent=t('正在加载本站点设置…','Loading marketplace settings…');return;}
  $('aiSettingsStatus').innerHTML=s.ai?.configured?`<strong>${t('DeepSeek 密钥已配置','DeepSeek key configured')}</strong><p>${t('新报告先核对数据，再请求 DeepSeek 结合历史复核。实际成功与否以本次复核结果为准。','New reports are validated before DeepSeek reviews them with historical context. Check each review’s result to confirm success.')} ${t('模型','Model')}: ${esc(s.ai.model||'deepseek-chat')}</p>`:`<strong>${t('DeepSeek 尚未连接','DeepSeek is not connected')}</strong><p>${t('上传、历史对比、规则分析和执行确认仍可使用。接入后，新分析会增加 AI 复核。','Uploads, historical comparisons, rule analysis and execution confirmation remain available. Once connected, new analyses include an AI review.')}</p>`;
  let backup=$('backupSection');if(!backup){backup=document.createElement('div');backup.id='backupSection';backup.className='soft-note';$('aiSettingsStatus').parentElement.append(backup);}
  backup.innerHTML=`<a id="backupLink" class="button secondary" href="${apiUrl('/api/backup')}">${icon('download')}${t('下载两个站点的完整备份','Download backup of both marketplaces')}</a><p style="margin-top:8px">${t('备份包含两个站点的原始报告和历史数据库，请妥善保存。','Includes original reports and history for both marketplaces. Store the backup safely.')}</p>`;
  let logout=$('logoutForm');if(s.access?.enabled){if(!logout){logout=document.createElement('form');logout.id='logoutForm';logout.method='POST';logout.action='/logout';logout.style.marginTop='16px';$('aiSettingsStatus').parentElement.append(logout);}logout.innerHTML=`<button class="button secondary" type="submit">${t('退出登录','Sign out')}</button>`;}
}
function listHTML(values){return `<ul>${(values||[]).map(value=>`<li>${esc(value)}</li>`).join('')}</ul>`;}
function openDetails(asin){
  const r=state.analysis?.recommendations.find(x=>x.asin===asin);if(!r)return;
  const m=r.metrics||{},confirmation=(state.analysis.confirmations||[]).find(x=>x.asin===asin),finding=(state.analysis.ai_review?.findings||[]).find(x=>x.asin===asin),history=r.history||{},parts=[];
  if(history.available){if(history.previous_acos!=null)parts.push(t(`上期实际 ACOS ${pct(history.previous_acos)}`,`Previous actual ACOS: ${pct(history.previous_acos)}`));if(history.ad_sales_change_pct!=null)parts.push(t(`广告销售较上期变化 ${num(history.ad_sales_change_pct)}%`,`Ad sales change: ${num(history.ad_sales_change_pct)}%`));if(history.spend_change_pct!=null)parts.push(t(`广告花费较上期变化 ${num(history.spend_change_pct)}%`,`Ad spend change: ${num(history.spend_change_pct)}%`));if(history.target_changed)parts.push(t('输入目标发生变化，需要结合实际修改时间判断。','The input target changed; consider the actual time of adjustment.'));}else parts.push(t('尚无可比较的同周期历史，本期先作为观察依据。','No comparable historical period is available; treat this report as a baseline.'));
  if(history.execution?.evaluation)parts.push(history.execution.evaluation);
  if(history.execution?.blocks_new_change)parts.push(t('上次调整仍需观察，暂不建议再次修改目标。','Continue observing the last adjustment before changing the target again.'));
  const confidence=({high:t('较高','Higher'),medium:t('中等','Moderate'),low:t('有限','Limited')})[r.confidence]||t('有限','Limited');
  const metricItems=[[t('实际 ACOS','Actual ACOS'),pct(m.acos)],[t('广告订单','Ad orders'),num(m.orders,0)],[t('当前库存','Current stock'),num(m.inventory,0)],[t(`广告花费 ${currency()}`,`Ad spend ${currency()}`),num(m.spend)],[t(`广告销售 ${currency()}`,`Ad sales ${currency()}`),num(m.ad_sales)],[t(`报表总销售 ${currency()}`,`Reported sales ${currency()}`),num(m.total_sales)]];
  $('drawerContent').innerHTML=`<div class="drawer-product"><h2 id="drawerTitle">${esc(r.asin)}</h2><p>${esc(r.name||t('商品名称缺失','Product name unavailable'))}</p><p>${esc(marketName())} · ${state.market} · ${currency()}</p></div><div class="drawer-badges"><span class="badge ${r.actionable?'teal':r.priority==='high'?'amber':'gray'}">${esc(r.action_label)}</span><span class="badge gray">${confidence} ${t('证据置信度','evidence confidence')}</span>${confirmation?`<span class="badge blue">${t('已确认执行','Execution confirmed')}</span>`:''}</div><div class="drawer-metrics">${metricItems.map(([label,value])=>`<div class="drawer-metric"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}</div><div class="drawer-proposal"><small>${t('目标 ACOS 建议','Recommended target ACOS')}</small><strong>${compactPct(r.current_target)} → ${r.recommended_target==null?t('暂不判断','To review'):compactPct(r.recommended_target)}</strong><p>${esc(r.reason)}</p></div><div class="drawer-section"><h3>${icon('file')}${t('判断依据','Evidence')}</h3>${listHTML(r.evidence?.length?r.evidence:[t('本期证据不足以支持精确调整。','Evidence is insufficient for a precise target adjustment.')])}</div>${(r.anomalies||[]).map(x=>`<div class="drawer-section"><h3>${icon('info')}${esc(x.label)}</h3>${x.possible_causes?.length?`<p>${t('可能原因，尚待验证：','Possible causes, not yet verified:')}</p>${listHTML(x.possible_causes)}`:''}${x.next_steps?.length?`<p>${t('建议核查：','Suggested checks:')}</p>${listHTML(x.next_steps)}`:''}</div>`).join('')}<div class="drawer-section"><h3>${icon('history')}${t('历史与执行追踪','History and execution tracking')}</h3><p>${esc(parts.join(t('；','; ')))}</p></div>${finding?`<div class="drawer-section"><h3>${icon('sparkles')}${t('DeepSeek 补充复核','DeepSeek commentary')}</h3><p>${esc(state.analysis.ai_review?.localization_notice||t('以下内容保留生成时的语言。','The following commentary retains its original language.'))}</p><p>${esc(finding.comment||'')}</p>${listHTML(finding.possible_causes)}${listHTML(finding.next_steps)}</div>`:''}${confirmation?`<div class="drawer-section"><h3>${icon('check')}${t('已确认的实际执行','Confirmed actual execution')}</h3><p>${t('实际目标','Actual target')} ${compactPct(confirmation.actual_target)} · ${esc(dateLabel(confirmation.executed_at,true))}</p><p>${esc(confirmation.note||t('无备注','No notes'))}</p></div>`:`<div class="drawer-section"><button class="button ${r.actionable?'primary':'secondary'}" data-manual-confirm="${esc(r.asin)}">${icon('check')}${r.actionable?t('我已完成这项调整','I completed this adjustment'):t('记录不同于建议的实际调整','Record my actual adjustment')}</button><p style="font-size:10px;margin-top:10px">${t('仅记录已完成操作，不会自动修改广告账户。','Records your completed action; it does not modify your advertising account.')}</p></div>`}`;
  showModal('detailDrawer');
}
async function showVersions(reportId){
  const context=contextVersion;
  try{const data=await api(`/api/reports/${encodeURIComponent(reportId)}/analyses`);if(context!==contextVersion)return;const report=state.reports.find(x=>x.id===reportId);if(!report)return;
    $('drawerContent').innerHTML=`<div class="drawer-product"><h2 id="drawerTitle">${t('已保存的分析版本','Saved analysis versions')}</h2><p>${esc(report.filename)}</p></div><div class="drawer-section"><p>${t('重新分析会新增快照，旧版本与执行记录保留。切换语言不创建新版本。','Reanalysis creates a new snapshot and preserves existing versions and execution records. Switching language does not create a new version.')}</p></div>${(data.analyses||[]).map(x=>`<div class="panel version-card"><div><strong>${esc(dateLabel(x.created_at,true))}</strong><p>${reviewStatus(x.ai_status)}</p></div><button class="button secondary small" data-open-version="${esc(x.id)}" data-report-id="${esc(reportId)}">${t('查看版本','View version')}</button></div>`).join('')||`<p class="muted">${t('暂无分析版本。','No analysis versions yet.')}</p>`}<div class="drawer-section"><button class="button primary" data-reanalyze="${esc(reportId)}">${icon('sparkles')}${t('按当前规则新增分析','Create a new analysis')}</button></div>`;showModal('detailDrawer');
  }catch(err){if(context===contextVersion)toast(err.message,true);}
}
function openUpload(){
  $('uploadError').classList.add('hidden');$('uploadForm').reset();state.uploadFile=null;$('uploadMarket').value=state.market;
  $('uploadFileLabel').textContent=t('点击选择，或把报告拖到这里','Choose a report or drag it here');$('uploadFileHint').textContent=t('支持 .xlsx · 建议上传近 7 天报告','Supports .xlsx · A 7-day report is recommended');
  const end=new Date();end.setDate(end.getDate()-1);const start=new Date(end);start.setDate(start.getDate()-6);const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('uploadStart').value=localDate(start);$('uploadEnd').value=localDate(end);updatePeriodNote();showModal('uploadModal');
}
function setUploadFile(file){
  if(!file)return;if(!file.name.toLowerCase().endsWith('.xlsx')){state.uploadFile=null;$('reportFile').value='';toast(t('请选择 .xlsx 格式的 DeepBI 报告。','Choose a DeepBI report in .xlsx format.'),true);return;}
  state.uploadFile=file;$('uploadFileLabel').textContent=file.name;$('uploadFileHint').textContent=`${num(file.size/1024,1)} KB · ${t('原始文件会完整保存','The original file will be saved')}`;
  const dates=file.name.match(/(\d{4}-\d{2}-\d{2})[\s_至—-]+(\d{4}-\d{2}-\d{2})/);if(dates){$('uploadStart').value=dates[1];$('uploadEnd').value=dates[2];}
  const market=file.name.match(/_([A-Z]{2})_/);if(market&&MARKETS[market[1]])$('uploadMarket').value=market[1];updatePeriodNote();
}
function updatePeriodNote(){
  const start=new Date($('uploadStart').value+'T00:00:00Z'),end=new Date($('uploadEnd').value+'T00:00:00Z'),days=Math.round((end-start)/86400000)+1,market=$('uploadMarket').value;
  $('uploadPeriodNote').classList.toggle('warning',days!==7||market!==state.market);
  const note=!Number.isFinite(days)||days<1?t('请选择有效的报告起止日期。','Select a valid report date range.'):days===7?t('7 天周报将与同站点、同长度且不重叠的报告比较。','This 7-day report will be compared with non-overlapping reports of the same length and marketplace.'):t(`${days} 天报告将保存为历史基线，不与7天报告直接计算周环比。`,`This ${days}-day report will be saved as a baseline and will not be directly compared with 7-day reports.`);
  $('uploadPeriodNote').textContent=`${marketName(market)} (${market}) · ${MARKETS[market]?.currency||''} — ${note}${market!==state.market?t(' 上传后将切换到该站点。',' The workspace will switch to this marketplace after upload.'):''}`;
}
function openConfirmation(asins=[...state.selected],manual=false){
  const confirmed=confirmedAsins(),rows=(state.analysis?.recommendations||[]).filter(r=>asins.includes(r.asin)&&!confirmed.has(r.asin));if(!rows.length){toast(t('请选择尚未确认的调整。','Select an adjustment that has not been confirmed.'));return;}
  state.confirming=rows;state.manualConfirmation=manual||rows.some(r=>!r.actionable);
  $('confirmationItems').innerHTML=rows.map(r=>`<div class="confirmation-item"><div><strong>${esc(r.asin)}</strong><p>${esc(r.name||'')}</p><p>${state.market} · ${t('当前','Current')} ${compactPct(r.current_target)} · ${t('建议','Suggested')} ${compactPct(r.recommended_target)}</p></div><label class="confirmation-target">${t('实际目标','Actual target')} <input type="number" data-actual-target="${esc(r.asin)}" min="16" max="50" step="0.1" value="${Number(r.recommended_target??r.current_target??24)}" required aria-label="${esc(r.asin)} ${t('实际执行目标','actual target')}"> %</label></div>`).join('');
  const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());$('executedAt').value=now.toISOString().slice(0,23);$('executionNotes').value='';$('executionAttested').checked=false;$('confirmationError').classList.add('hidden');$('executionNotes').required=state.manualConfirmation;
  $('executionNotes').placeholder=state.manualConfirmation?t('请说明实际操作不同于建议的原因（必填）。','Explain why your actual action differs from the recommendation (required).'):t('例如：已在 DeepBI 修改，后续观察成交与实际 ACOS。','For example: Updated in DeepBI; monitor sales and actual ACOS.');
  closeModal('detailDrawer');showModal('confirmModal');
}

// Only interface labels are translated. Product names, filenames and user notes remain untouched.
document.addEventListener('click',async e=>{
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
  if(target.dataset.reanalyze){
    const reportId=target.dataset.reanalyze,context=contextVersion,label=target.innerHTML;setBusy(target,true);mutationBusy(true);
    try{const data=await api(`/api/reports/${encodeURIComponent(reportId)}/analyze`,{method:'POST'});if(context!==contextVersion)return;closeModal('detailDrawer');await loadAnalysis(reportId,data.analysis?.id);toast(t('新分析已保存，历史版本保持原样。','New analysis saved; previous versions are preserved.'));navigate('overview');}
    catch(err){if(context===contextVersion)toast(err.message,true);}finally{setBusy(target,false,label);mutationBusy(false);}
  }
});
$('siteSelector').addEventListener('change',e=>changeContext(e.target.value,state.lang));
$('languageSelector').addEventListener('change',e=>changeContext(state.market,e.target.value));
$('reportSelector').addEventListener('change',e=>{if(e.target.value)loadAnalysis(e.target.value);});
$('refreshButton').addEventListener('click',()=>initialize());$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
$('productSearch').addEventListener('input',e=>{state.search=e.target.value;state.tablePage=1;renderRecommendations();});
$('actionFilter').addEventListener('change',e=>{state.actionFilter=e.target.value;state.tablePage=1;renderRecommendations();});
$('issueFilter').addEventListener('change',e=>{state.issueFilter=e.target.value;state.tablePage=1;renderRecommendations();});
$('recommendationRows').addEventListener('change',e=>{if(e.target.dataset.select){e.target.checked?state.selected.add(e.target.dataset.select):state.selected.delete(e.target.dataset.select);renderRecommendations();}});
$('selectAll').addEventListener('change',e=>{filteredRows().slice((state.tablePage-1)*state.pageSize,state.tablePage*state.pageSize).filter(isActionable).forEach(r=>e.target.checked?state.selected.add(r.asin):state.selected.delete(r.asin));renderRecommendations();});
$('prevPage').addEventListener('click',()=>{state.tablePage--;renderRecommendations();});$('nextPage').addEventListener('click',()=>{state.tablePage++;renderRecommendations();});
$('confirmSelected').addEventListener('click',()=>openConfirmation());
$('exportRecommendations').addEventListener('click',()=>{if(state.analysis)location.href=apiUrl(`/api/reports/${encodeURIComponent(state.analysis.report_id)}/export?analysis_id=${encodeURIComponent(state.analysis.id)}`);else toast(t('请先上传或选择报告。','Upload or select a report first.'));});
$('reportFile').addEventListener('change',e=>setUploadFile(e.target.files[0]));['uploadStart','uploadEnd','uploadMarket'].forEach(id=>$(id).addEventListener('change',updatePeriodNote));
['dragenter','dragover'].forEach(evt=>$('dropzone').addEventListener(evt,e=>{e.preventDefault();$('dropzone').classList.add('dragover');}));
['dragleave','drop'].forEach(evt=>$('dropzone').addEventListener(evt,e=>{e.preventDefault();$('dropzone').classList.remove('dragover');}));
$('dropzone').addEventListener('drop',e=>{const file=e.dataTransfer.files[0];if(file){setUploadFile(file);const transfer=new DataTransfer();transfer.items.add(file);$('reportFile').files=transfer.files;}});
$('uploadForm').addEventListener('submit',async e=>{
  e.preventDefault();const file=state.uploadFile||$('reportFile').files[0];if(!file)return;
  if($('uploadStart').value>$('uploadEnd').value){$('uploadError').textContent=t('开始日期不能晚于结束日期。','Start date must not be later than end date.');$('uploadError').classList.remove('hidden');return;}
  const button=$('uploadSubmit'),label=button.innerHTML,context=contextVersion,market=$('uploadMarket').value;setBusy(button,true);mutationBusy(true);$('uploadError').classList.add('hidden');
  try{const data=new FormData();data.append('file',file);data.append('marketplace',market);data.append('start_date',$('uploadStart').value);data.append('end_date',$('uploadEnd').value);
    const result=await api('/api/reports',{method:'POST',body:data});if(context!==contextVersion)return;closeModal('uploadModal');
    if(state.market!==market){state.market=market;contextVersion++;requestVersion++;clearTimeout(state.poll);state.analysis=null;state.settings=null;state.reports=[];state.confirmations=[];state.selected.clear();state.search='';state.actionFilter='';state.issueFilter='';$('productSearch').value='';$('issueFilter').value='';applyLocale();renderOverview();renderRecommendations();renderReports();renderExecutions();renderSettings();}
    await initialize({reportId:result.report.id,analysisId:result.analysis?.id});navigate('overview');toast(result.duplicate?t('这份报告已存在，已打开保存的分析。','This report already exists; the saved analysis is open.'):t('报告与分析已保存。','Report and analysis saved.'));
  }catch(err){if(context===contextVersion){$('uploadError').textContent=err.message;$('uploadError').classList.remove('hidden');}}finally{setBusy(button,false,label);mutationBusy(false);}
});
$('confirmationForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!state.analysis||!$('executionAttested').checked)return;
  const analysis=state.analysis,context=contextVersion,button=$('confirmationSubmit'),label=button.innerHTML;setBusy(button,true);mutationBusy(true);$('confirmationError').classList.add('hidden');
  try{const executed=new Date($('executedAt').value);if(Number.isNaN(executed.valueOf()))throw new Error(t('请选择实际执行时间。','Select the actual execution time.'));if(executed>new Date())throw new Error(t('执行时间不能在未来。','Execution time cannot be in the future.'));if(executed<new Date(analysis.created_at))throw new Error(t('执行时间应在分析生成之后。','Execution time must be after the analysis was created.'));
    const note=$('executionNotes').value.trim();if(state.manualConfirmation&&!note)throw new Error(t('请说明实际操作不同于建议的原因。','Explain why the actual action differs from the recommendation.'));
    const items=state.confirming.map(r=>({asin:r.asin,actual_target:Number(document.querySelector(`[data-actual-target="${CSS.escape(r.asin)}"]`).value),note}));
    if(items.some(x=>!Number.isFinite(x.actual_target)||x.actual_target<16||x.actual_target>50))throw new Error(t('实际目标必须在16%至50%之间。','Actual target ACOS must be between 16% and 50%.'));
    await api(`/api/reports/${encodeURIComponent(analysis.report_id)}/confirmations`,{method:'POST',body:JSON.stringify({analysis_id:analysis.id,executed_at:executed.toISOString(),items})});if(context!==contextVersion)return;
    closeModal('confirmModal');await loadAnalysis(analysis.report_id,analysis.id);await loadConfirmations();toast(t(`已记录 ${items.length} 项执行确认。`,`${items.length} execution ${plural(items.length,'confirmation')} saved.`));
  }catch(err){if(context===contextVersion){$('confirmationError').textContent=err.message;$('confirmationError').classList.remove('hidden');}}finally{setBusy(button,false,label);mutationBusy(false);}
});
$('settingsForm').addEventListener('submit',async e=>{
  if(e.target.id!=='settingsForm')return;e.preventDefault();const button=e.target.querySelector('button[type=submit]'),label=button.innerHTML,context=contextVersion;setBusy(button,true);mutationBusy(true);
  try{const settings=await api('/api/settings',{method:'PUT',body:JSON.stringify({target_acos:Number($('goalAcos').value),growth_priority:true})});if(context!==contextVersion)return;state.settings=settings;renderSettings();updateEngineStatus();toast(t(`${marketName()}的经营目标已保存，历史分析不变。`,`${marketName()} goals saved. Historical analyses are unchanged.`));}
  catch(err){if(context===contextVersion)toast(err.message,true);}finally{setBusy(button,false,label);mutationBusy(false);}
});
document.querySelectorAll('.modal-backdrop,.drawer-backdrop').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)closeModal(el.id);}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal-backdrop:not(.hidden),.drawer-backdrop:not(.hidden)').forEach(el=>closeModal(el.id));$('sidebar').classList.remove('open');}if(e.key==='Tab'){const modal=document.querySelector('.modal-backdrop:not(.hidden),.drawer-backdrop:not(.hidden)');if(!modal)return;const focusables=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,a[href]')].filter(el=>el.offsetParent!==null);if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
applyLocale();navigate(location.hash.slice(1)||'overview');renderOverview();renderRecommendations();initialize();
