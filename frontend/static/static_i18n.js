'use strict';
// Only explicitly marked interface strings are translated. Uploaded names, notes,
// AI output and other user data never pass through this dictionary.
const STATIC_MESSAGES = {
  "ui_001": {
    "zh": "周策 · 广告经营复盘",
    "en": "Zhouce · Advertising Review"
  },
  "ui_002": {
    "zh": "周策",
    "en": "Zhouce"
  },
  "ui_003": {
    "zh": "WEEKLY AD INTELLIGENCE",
    "en": "WEEKLY AD INTELLIGENCE"
  },
  "ui_004": {
    "zh": "阿联酋",
    "en": "United Arab Emirates"
  },
  "ui_005": {
    "zh": "经营工作流",
    "en": "WORKSPACE"
  },
  "ui_006": {
    "zh": "经营总览",
    "en": "Overview"
  },
  "ui_007": {
    "zh": "逐品建议",
    "en": "Recommendations"
  },
  "ui_008": {
    "zh": "历史报告",
    "en": "Report library"
  },
  "ui_009": {
    "zh": "执行记录",
    "en": "Execution log"
  },
  "ui_010": {
    "zh": "分析设置",
    "en": "Analysis settings"
  },
  "ui_011": {
    "zh": "每周一，向前一步",
    "en": "A fresh review, every Monday"
  },
  "ui_012": {
    "zh": "上传近 7 天报告，让每次调整都有依据，也有后续复盘。",
    "en": "Upload a 7-day report to ground each change in evidence and follow up on its results."
  },
  "ui_013": {
    "zh": "上传 · 分析 · 确认 · 复盘",
    "en": "Upload · Analyze · Confirm · Review"
  },
  "ui_014": {
    "zh": "我",
    "en": "Me"
  },
  "ui_015": {
    "zh": "个人工作空间",
    "en": "Personal workspace"
  },
  "ui_016": {
    "zh": "报告与执行记录持续保存",
    "en": "Reports and execution records are saved"
  },
  "ui_017": {
    "zh": "广告经营复盘",
    "en": "Advertising review"
  },
  "ui_018": {
    "zh": "正在连接工作台",
    "en": "Connecting to workspace"
  },
  "ui_019": {
    "zh": "OVERVIEW",
    "en": "OVERVIEW"
  },
  "ui_020": {
    "zh": "每周经营复盘",
    "en": "Weekly business review"
  },
  "ui_021": {
    "zh": "本期经营总览",
    "en": "This period at a glance"
  },
  "ui_022": {
    "zh": "在可接受的广告成本内，让营业额持续增长。",
    "en": "Grow revenue while keeping advertising costs within your goal."
  },
  "ui_023": {
    "zh": "正在载入报告…",
    "en": "Loading reports…"
  },
  "ui_024": {
    "zh": "上传新报告",
    "en": "Upload report"
  },
  "ui_025": {
    "zh": "正在整理你的经营数据…",
    "en": "Preparing your business overview…"
  },
  "ui_026": {
    "zh": "ACTION PLAN",
    "en": "ACTION PLAN"
  },
  "ui_027": {
    "zh": "从判断到行动",
    "en": "From evidence to action"
  },
  "ui_028": {
    "zh": "逐品调整建议",
    "en": "Listing recommendations"
  },
  "ui_029": {
    "zh": "先看证据与原因，完成实际调整后，再确认记录。",
    "en": "Review the evidence and reasoning, then confirm after making the actual changes."
  },
  "ui_030": {
    "zh": "导出建议",
    "en": "Export recommendations"
  },
  "ui_031": {
    "zh": "确认已执行",
    "en": "Confirm execution"
  },
  "ui_032": {
    "zh": "全部建议",
    "en": "All recommendations"
  },
  "ui_033": {
    "zh": "全部产品",
    "en": "All products"
  },
  "ui_034": {
    "zh": "有异常待排查",
    "en": "Issues to investigate"
  },
  "ui_035": {
    "zh": "建议调整目标",
    "en": "Target changes suggested"
  },
  "ui_036": {
    "zh": "已选择",
    "en": "Selected"
  },
  "ui_037": {
    "zh": "产品 / 父 ASIN",
    "en": "Product / Parent ASIN"
  },
  "ui_038": {
    "zh": "实际 ACOS",
    "en": "Actual ACOS"
  },
  "ui_039": {
    "zh": "当前 → 建议目标",
    "en": "Current → Suggested target"
  },
  "ui_040": {
    "zh": "广告花费",
    "en": "Ad spend"
  },
  "ui_041": {
    "zh": "订单",
    "en": "Orders"
  },
  "ui_042": {
    "zh": "库存",
    "en": "Inventory"
  },
  "ui_043": {
    "zh": "建议与依据",
    "en": "Recommendation and evidence"
  },
  "ui_044": {
    "zh": "上一页",
    "en": "Previous"
  },
  "ui_045": {
    "zh": "下一页",
    "en": "Next"
  },
  "ui_046": {
    "zh": "单品 ACOS 数值提示色按该品输入目标判断，不代表 DeepBI 完整颜色分类；全店经营达标参考",
    "en": "Listing ACOS colors compare against that listing’s input target, not DeepBI’s full color classification. Marketplace business goal:"
  },
  "ui_047": {
    "zh": "。建议不会自动修改广告账户，异常原因会区分事实与假设。",
    "en": ". Recommendations do not change your ad account. Potential causes are distinguished from facts."
  },
  "ui_048": {
    "zh": "REPORT LIBRARY",
    "en": "REPORT LIBRARY"
  },
  "ui_049": {
    "zh": "每一期都留下依据",
    "en": "Keep the evidence from every period"
  },
  "ui_050": {
    "zh": "原始文件、分析版本和当时的建议一起保存。",
    "en": "Keep original files, analysis versions, and the recommendations made at the time."
  },
  "ui_051": {
    "zh": "历史数据会参与下一次分析",
    "en": "History informs the next analysis"
  },
  "ui_052": {
    "zh": "同站点、相同统计长度且不重叠的报告用于比较。30 天报告可以作为背景资料，不会与 7 天报告直接做周环比。",
    "en": "Comparisons use the same marketplace, equal report lengths, and non-overlapping dates. A 30-day report is background context, not a direct week-over-week comparator for a 7-day report."
  },
  "ui_053": {
    "zh": "EXECUTION LOG",
    "en": "EXECUTION LOG"
  },
  "ui_054": {
    "zh": "建立可追溯的调整记录",
    "en": "Keep a traceable record of changes"
  },
  "ui_055": {
    "zh": "记录你实际改了什么，让下一期复盘看见调整后的变化。",
    "en": "Record the changes you actually made so the next review can evaluate what followed."
  },
  "ui_056": {
    "zh": "查看本期建议",
    "en": "View recommendations"
  },
  "ui_057": {
    "zh": "YOUR GUARDRAILS",
    "en": "YOUR GUARDRAILS"
  },
  "ui_058": {
    "zh": "让分析遵循你的经营目标",
    "en": "Analyze against your business goals"
  },
  "ui_059": {
    "zh": "单品目标是调控工具；全店实际成本与营业额是评价标准。",
    "en": "Listing targets are controls. Evaluate results using marketplace-wide actual costs and revenue."
  },
  "ui_060": {
    "zh": "经营目标",
    "en": "Business goal"
  },
  "ui_061": {
    "zh": "设置会用于新分析，历史分析保持原样。",
    "en": "Changes apply to new analyses. Historical analyses remain unchanged."
  },
  "ui_062": {
    "zh": "全店预期 ACOS",
    "en": "Marketplace ACOS goal"
  },
  "ui_063": {
    "zh": "争取全店营业额增长，同时将实际 ACOS 控制在预期内；营业额增长、ACOS 下降为更优结果。",
    "en": "Aim to grow marketplace revenue while keeping actual ACOS within your goal. Revenue growth with declining ACOS is an even better outcome."
  },
  "ui_064": {
    "zh": "库存保护触发条件",
    "en": "Inventory protection threshold"
  },
  "ui_065": {
    "zh": "库存低于",
    "en": "Inventory below"
  },
  "ui_066": {
    "zh": "件",
    "en": "units"
  },
  "ui_067": {
    "zh": "进入保护的产品优先处理补货与可售状态，不建议为扩量而提高目标。当前账户规则：库存＜3，不扩张探索，预算强制为1。",
    "en": "Prioritize replenishment and availability for protected products instead of increasing targets for growth. Current account rule: inventory below 3 stops expansion and forces the budget to 1."
  },
  "ui_068": {
    "zh": "保存经营规则",
    "en": "Save marketplace settings"
  },
  "ui_069": {
    "zh": "分析引擎",
    "en": "Analysis engine"
  },
  "ui_070": {
    "zh": "先核对数据，再解释决策。",
    "en": "Validate the data, then explain the decisions."
  },
  "ui_071": {
    "zh": "计算与数据校验有明确依据",
    "en": "Calculations and data checks are traceable"
  },
  "ui_072": {
    "zh": "无广告销售不会被当作 0% ACOS",
    "en": "No ad sales is never treated as 0% ACOS"
  },
  "ui_073": {
    "zh": "不凭一两单编造精确调整值",
    "en": "One or two orders do not justify precise targets"
  },
  "ui_074": {
    "zh": "输入文件中的文字只作为数据处理",
    "en": "Text in uploaded files is treated only as data"
  },
  "ui_075": {
    "zh": "AI 服务在服务器端配置。密钥不会保存在报告中，也不会展示到浏览器。",
    "en": "AI is configured on the server. API keys are never stored in reports or shown in the browser."
  },
  "ui_076": {
    "zh": "周策 · 用每周的复盘，做更有依据的决定",
    "en": "Zhouce · Better decisions through weekly reviews"
  },
  "ui_077": {
    "zh": "原始数据可追溯 · 人工确认后留档",
    "en": "Traceable source data · Recorded after human confirmation"
  },
  "ui_078": {
    "zh": "NEW WEEK, NEW INSIGHTS",
    "en": "NEW WEEK, NEW INSIGHTS"
  },
  "ui_079": {
    "zh": "上传广告报告",
    "en": "Upload an advertising report"
  },
  "ui_080": {
    "zh": "上传 DeepBI 的 Excel 报告，开始本期经营复盘。",
    "en": "Upload a DeepBI Excel report to start reviewing this period."
  },
  "ui_081": {
    "zh": "点击选择，或把报告拖到这里",
    "en": "Choose a report, or drag it here"
  },
  "ui_082": {
    "zh": "支持 .xlsx · 建议每周上传近 7 天报告",
    "en": "Supports .xlsx · Upload a 7-day report each week"
  },
  "ui_083": {
    "zh": "站点",
    "en": "Marketplace"
  },
  "ui_084": {
    "zh": "报告统计期间",
    "en": "Report period"
  },
  "ui_085": {
    "zh": "至",
    "en": "to"
  },
  "ui_086": {
    "zh": "取消",
    "en": "Cancel"
  },
  "ui_087": {
    "zh": "保存并分析",
    "en": "Save and analyze"
  },
  "ui_088": {
    "zh": "CLOSE THE LOOP",
    "en": "CLOSE THE LOOP"
  },
  "ui_089": {
    "zh": "确认你实际完成的调整",
    "en": "Confirm the changes you made"
  },
  "ui_090": {
    "zh": "下面记录的是你在广告平台已执行的操作，不会自动修改广告。",
    "en": "This records actions you already completed in the ad platform. It does not change ads automatically."
  },
  "ui_091": {
    "zh": "实际执行时间",
    "en": "Actual execution time"
  },
  "ui_092": {
    "zh": "实际执行时间应在本次分析生成之后。",
    "en": "The execution time must be after this analysis was generated."
  },
  "ui_093": {
    "zh": "执行备注",
    "en": "Execution notes"
  },
  "ui_094": {
    "zh": "我确认已在广告平台完成上述调整，实际目标值已核对。",
    "en": "I confirm that I completed these changes in the ad platform and checked the actual target values."
  },
  "ui_095": {
    "zh": "再检查一下",
    "en": "Review again"
  },
  "ui_096": {
    "zh": "确认完成并留档",
    "en": "Confirm and save record"
  },
  "ui_097": {
    "zh": "PRODUCT REVIEW",
    "en": "PRODUCT REVIEW"
  },
  "ui_098": {
    "zh": "周策首页",
    "en": "Zhouce home"
  },
  "ui_099": {
    "zh": "主导航",
    "en": "Main navigation"
  },
  "ui_100": {
    "zh": "展开导航",
    "en": "Open navigation"
  },
  "ui_101": {
    "zh": "刷新数据",
    "en": "Refresh data"
  },
  "ui_102": {
    "zh": "选择报告",
    "en": "Select report"
  },
  "ui_103": {
    "zh": "搜索 ASIN 或商品名称",
    "en": "Search ASIN or product name"
  },
  "ui_104": {
    "zh": "搜索产品",
    "en": "Search products"
  },
  "ui_105": {
    "zh": "按建议筛选",
    "en": "Filter by recommendation"
  },
  "ui_106": {
    "zh": "按异常筛选",
    "en": "Filter by issue"
  },
  "ui_107": {
    "zh": "选择当前显示的可调整产品",
    "en": "Select adjustable products on this page"
  },
  "ui_108": {
    "zh": "关闭",
    "en": "Close"
  },
  "ui_109": {
    "zh": "开始日期",
    "en": "Start date"
  },
  "ui_110": {
    "zh": "结束日期",
    "en": "End date"
  },
  "ui_111": {
    "zh": "例如：已在 DeepBI 修改目标，某个产品因补货推迟暂不调整。",
    "en": "For example: targets changed in DeepBI; one product deferred pending replenishment."
  },
  "ui_112": {
    "zh": "关闭详情",
    "en": "Close details"
  },
  "ui_113": {
    "zh": "选择站点",
    "en": "Select marketplace"
  },
  "ui_114": {
    "zh": "页面语言",
    "en": "Page language"
  },
  "ui_115": {
    "zh": "阿联酋 · AE",
    "en": "UAE · AE"
  },
  "ui_116": {
    "zh": "沙特 · SA",
    "en": "Saudi Arabia · SA"
  },
  "ui_117": {
    "zh": "阿联酋（AE）",
    "en": "United Arab Emirates (AE)"
  },
  "ui_118": {
    "zh": "沙特（SA）",
    "en": "Saudi Arabia (SA)"
  }
};
window.applyStaticLocale = function applyStaticLocale(language) {
  const lang = language === 'en' ? 'en' : 'zh';
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const entry = STATIC_MESSAGES[element.dataset.i18n];
    if (entry) element.textContent = entry[lang];
  });
  for (const attribute of ['placeholder', 'title', 'aria-label']) {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
      const entry = STATIC_MESSAGES[element.getAttribute(`data-i18n-${attribute}`)];
      if (entry) element.setAttribute(attribute, entry[lang]);
    });
  }
};
