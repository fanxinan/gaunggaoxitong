"""Display-only English translations of saved deterministic analysis text.

Translations never change decisions, metrics, source fields or saved snapshots.
Only known program-owned message fields are translated. Product names, user
notes and model-written findings are left exactly as recorded.
"""
from __future__ import annotations

from copy import deepcopy
import re
from typing import Any


_MESSAGES = {
    '总营业额缺失或为负': 'Total revenue is missing or negative',
    '广告销售额大于总销售额': 'Ad-attributed sales exceed total revenue',
    '自然销售额为负': 'Organic sales are negative',
    '总销售与广告加自然销售不一致': 'Total revenue does not reconcile with ad and organic sales',
    '有花费无销售，却导出为0% ACOS': 'Spend without ad sales was exported as 0% ACOS',
    '报告缺少单品目标设置': 'The report is missing a listing target',
    '导出占比列全为0，不能用于份额判断': 'Exported share columns are all zero and cannot establish sales shares',
    '库存、目标与日预算是导出快照，不能证明整个统计期一直保持该设置。': 'Inventory, targets and daily budgets are export snapshots; they do not establish the settings used throughout the reporting period.',
    '总销售归集存在异常，本次不据此确认营业额增长或自然销售增量；请核对归因窗口及父子ASIN归集。': 'Sales attribution does not reconcile. Do not infer revenue growth or incremental organic sales until attribution windows and parent/child ASIN aggregation are checked.',
    '有花费但无广告销售时，ACOS不可按0%判优，本次按无广告成交处理。': 'Spend without ad sales is treated as no ad conversion, not as a successful 0% ACOS result.',
    '销售占比字段存在全0列，本次不使用这些占比推断效果。': 'Some sales-share columns contain only zeros. These shares are excluded from performance assessment.',
    '尚无同站点、同统计天数且不重叠的历史报告。': 'No previous report is available for the same marketplace, equal duration and a non-overlapping period.',
    '报告日期无效，无法比较历史。': 'The report dates are invalid, so historical comparison is unavailable.',
    '已有历史记录，但周期长度不同或日期重叠；不把7天周报与30天基线作金额同比。': 'Historical reports exist, but their durations differ or their dates overlap. Amounts in a 7-day report are not compared directly with a 30-day baseline.',
    '与紧邻的同长度上一周期比较。': 'Compared with the immediately preceding period of equal duration.',
    '与最近同长度历史周期比较；中间存在日期缺口，不据此直接生成调参动作。': 'Compared with the latest historical period of equal duration. A date gap exists, so this comparison alone does not justify a target change.',
    '托管产品数量变化，整体变化包含产品范围变化，不能全归因于调参。': 'The number of managed listings has changed. Overall changes include changes in product coverage and cannot all be attributed to target adjustments.',
    '尚无已确认的人工调整记录。': 'No manually confirmed adjustment has been recorded.',
    '日期不完整，无法评估确认后的表现。': 'Incomplete dates prevent assessment of performance after the confirmed adjustment.',
    '报告期之后已有人工确认，本报告不能用于重复调整或评价该动作。': 'An adjustment was confirmed after this reporting period. This report cannot assess that adjustment or justify repeating it.',
    '人工调整发生于报告期内，数据混合调整前后表现，暂不再次改目标。': 'The adjustment occurred during this reporting period, which mixes performance before and after the change. Defer another target change.',
    '导出目标与最近确认值不一致，先核实实际设置与同步状态。': 'The exported target differs from the latest confirmed value. Check the actual setting and synchronization status first.',
    '已有完整调整后周期，仍需等待至少14天并结合归因成熟度复盘。': 'A complete post-adjustment period is available, but wait at least 14 days after the change and consider attribution maturity before reassessing.',
    '已有完整调整后周期；仅作关联观察，不能将销售变化全部归因于该次调整。': 'A complete post-adjustment period is available. This is an association only; sales changes cannot all be attributed to this adjustment.',
    '两份报告的输入目标不同，缺少完整变更时点，不把当前表现归因于单一目标。': 'The input targets differ between reports and the complete change timeline is unknown. Current performance is not attributed to a single target.',
    '没有广告销售，ACOS不可计算，不能按0%判断达标。': 'There are no ad sales, so ACOS is undefined and cannot be treated as an on-target 0%.',
    '仅1–2个广告订单，效果估计不稳定，不据此校准最优目标。': 'Only 1–2 ad orders were recorded. Performance estimates are unstable and cannot establish an optimal target.',
    '尚无可比上一周期；本次为基线或初次观察。': 'No comparable previous period is available. Treat this report as a baseline or initial observation.',
    '保持观察': 'Hold and monitor',
    '保持暂停': 'Keep paused',
    '先处理库存保护': 'Address inventory protection first',
    '先核实目标设置': 'Verify the current target first',
    '排查无成交消耗': 'Investigate spend without ad sales',
    '优先排查高成本': 'Prioritize high-cost investigation',
    '等待调整后复盘': 'Wait for post-adjustment review',
    '先查成本与样本': 'Check costs and sample size first',
    '检查投放准备': 'Check campaign readiness',
    '保持现有暂停状态，不因输入目标或历史种子数量恢复投放。': 'Keep the current paused state. Do not resume advertising solely because of the input target or historical seed counts.',
    '投放尚未处于稳定运行状态，先完成准备或状态核查，不立即调整目标。': 'Advertising is not yet in a stable active state. Complete preparation or check its status before changing the target.',
    '报告没有当前输入目标，不能安全地给出新目标值。': 'The report does not include the current input target. A new target cannot be responsibly specified.',
    '已有广告花费却没有广告销售；按消耗及归因成熟度排查，不能把ACOS当0%或仅靠换一个目标值解决。': 'Ad spend has produced no attributed ad sales. Investigate spend and attribution maturity; do not interpret ACOS as 0% or assume a different target will resolve the issue.',
    '成本明显偏离经营目标，先找具体无效消耗、点击成本及转化原因；汇总数据不足以确定另一个百分比就是解法。': 'Costs are far above the business goal. Investigate ineffective spend, click costs and conversion causes. Aggregated data does not establish another percentage as the solution.',
    '近期已有确认或输入目标发生变化，先核对实际设置并观察调整后完整周期，避免重复调参。': 'A recent adjustment was confirmed or the input target changed. Verify the actual settings and observe a full post-adjustment period before changing the target again.',
    '实际成本超过经营参考，但缺少足够的连续可比样本、稳定设置或可靠销售口径；先排查，不仅因输入较高就统一回调。': 'Actual costs exceed the business reference, but consecutive comparable samples, stable settings or reliable sales attribution are insufficient. Investigate first; a higher input target alone does not justify lowering it.',
    ' 当前已处于最低公开档位，更需要检查实际消耗来源。': ' The current target is already at the lowest published tier, making investigation of actual spend sources more important.',
    '本期无广告花费与销售，先核可售、广告创建及曝光，不能从空结果推定目标过紧。': 'There was no ad spend or ad sales in this period. Check availability, campaign creation and impressions; an empty result does not prove the target is too restrictive.',
    '当前实际ACOS符合经营参考，先保留有效设置；不为统一参数或改变颜色而调整。较高输入可能允许后续成本上升，仍需监控。': 'Actual ACOS meets the business reference. Retain the effective settings rather than changing them solely to standardize targets or change colors. A higher input target may allow costs to rise later, so keep monitoring.',
    '可评估增长空间': 'Assess potential for growth',
    '连续周期低成本且有成交样本；还需曝光、点击及流量受限证据，不能仅据低ACOS提高目标。': 'Consecutive periods show low costs with recorded orders. Impression, click and traffic-constraint evidence is still needed; low ACOS alone does not justify raising the target.',
    '有广告花费但无广告成交': 'Ad spend without attributed ad sales',
    '实际ACOS至少为经营目标的两倍': 'Actual ACOS is at least twice the business goal',
    '销售归集口径异常': 'Sales attribution does not reconcile',
    '缺少当前单品目标': 'Current listing target is missing',
    '流量相关性不足': 'Traffic may not be sufficiently relevant',
    '点击成本或商品转化问题': 'Click costs or product conversion may be problematic',
    '归因尚未成熟或销售归集缺失': 'Attribution may be incomplete or sales aggregation may be missing',
    '查看活动、搜索词和商品定位的点击及花费': 'Review clicks and spend by campaign, search term and product target',
    '核实可售状态和归因窗口': 'Verify availability and the attribution window',
    '按消耗规模控制持续无转化探索，保留有效对象': 'Control continued exploration without conversions according to spend, while retaining effective targets',
    '部分活动消耗集中': 'Spend may be concentrated in some campaigns',
    'CPC偏高或转化不足': 'CPC may be high or conversion may be insufficient',
    '样本少或订单归因异常': 'The sample may be small or order attribution may be inconsistent',
    '定位拉高成本的具体活动和对象': 'Identify the campaigns and targets driving higher costs',
    '查看点击、CPC、转化与归因数据': 'Review clicks, CPC, conversion and attribution data',
    '不要把整体降目标作为唯一处置': 'Do not rely solely on lowering the overall target',
    '当前库存不足': 'Current inventory may be insufficient',
    '可售变体或FBA/FBM库存口径差异': 'Available-variation counts or FBA/FBM inventory definitions may differ',
    '按账户规则停止扩张探索、预算强制为1；核实规则是否执行': 'Under the account rule, expansion stops and the budget is forced to 1; verify that the rule is being applied',
    '确认补货及可售变体': 'Check replenishment and available variations',
    '报表预算可能是汇总值，不能直接与1比较认定故障': 'The exported budget may be aggregated; a value other than 1 does not by itself prove a system failure',
    '广告归因与订单时间口径不同': 'Ad attribution and order dates may use different time bases',
    '父子ASIN或跨商品订单归集差异': 'Parent/child ASIN or cross-product order aggregation may differ',
    '导出数据缺失': 'Exported data may be incomplete',
    '核对亚马逊原始业务和广告报表': 'Reconcile the original Amazon business and advertising reports',
    '未核对前不据此判断自然增量或营业额增长': 'Do not infer incremental organic sales or revenue growth before reconciliation',
    '导出未提供设置值': 'The export may omit the configured value',
    '核实实际单品设置及站点继承值后再调参': 'Verify the listing setting and inherited marketplace target before making changes',
    '本期尚无广告销售，优先核实投放与无成交消耗。': 'There are no ad sales this period. Prioritize campaign checks and spend without conversions.',
    '总营业额字段存在归集问题，本期不能确认营业额增长；广告销售增长不等于全店新增营业额。': 'Total revenue does not reconcile, so revenue growth cannot be confirmed. Growth in attributed ad sales does not establish incremental store revenue.',
    '尚无可靠可比的营业额增长结论，先积累同长度周报。': 'A reliable, comparable revenue-growth conclusion is not yet available. Collect reports covering equal durations first.',
    '争取全店总营业额增长，实际ACOS以经营目标为参考；营业额增长且ACOS下降是更优结果。': 'Pursue store revenue growth while assessing actual ACOS against the business goal. Revenue growth combined with lower ACOS is the preferred outcome.',
    '本次为可复核的规则分析。异常原因是待核实假设，不是已证实因果；调整目标是受控试验，不能保证实际ACOS或营业额结果。': 'This is an auditable rules-based analysis. Suspected causes require verification and are not proven causal effects. Target adjustments are controlled trials and do not guarantee ACOS or revenue outcomes.',
    '以上是分析审核门槛，不是DeepBI私有算法或自动止损线。没有流量受限证据时，不自动生成提高目标动作。': 'These are analytical review thresholds, not DeepBI proprietary rules or automatic stop-loss limits. Without evidence of constrained traffic, the system does not recommend raising a target.',
    '存在未识别的附加列，原值已保存，但未用于本次规则计算。': 'Unrecognized additional columns were preserved in the source data but excluded from rule calculations.',
    'AI仅复核解释，不修改可执行目标；异常原因是待验证假设。': 'AI reviews explanations without changing actionable targets. Suspected causes require verification.',
    '部分AI条目因ASIN不在本次提供范围或格式无效而被过滤，请以原报告为准。': 'Some AI entries were removed because their ASIN was outside the supplied scope or their format was invalid. Refer to the original report.',
    '未配置 DEEPSEEK_API_KEY；当前结果为规则分析，尚未经过DeepSeek复核。': 'DEEPSEEK_API_KEY is not configured. These are rule results and have not been reviewed by DeepSeek.',
    '未配置 DEEPSEEK_API_KEY，当前使用规则分析。': 'DEEPSEEK_API_KEY is not configured; rules-based analysis is active.',
    '尚未配置DeepSeek密钥；当前展示可追溯的规则分析。': 'A DeepSeek key has not been configured. The current results are auditable rules-based analysis.',
    'DeepSeek认证或授权失败，请检查服务器密钥与账户权限；规则分析已保留。': 'DeepSeek authentication or authorization failed. Check the server key and account permissions; the rule analysis has been retained.',
    'DeepSeek请求限流或额度受限，请稍后重试；规则分析已保留。': 'DeepSeek requests are rate-limited or quota-limited. Retry later; the rule analysis has been retained.',
    'DeepSeek服务暂时未能完成复核，请稍后重试；规则分析已保留。': 'DeepSeek could not complete the review. Retry later; the rule analysis has been retained.',
    'DeepSeek复核超时；规则分析已保留，可稍后重试。': 'The DeepSeek review timed out. The rule analysis has been retained; retry later.',
    '暂时无法连接DeepSeek；请检查服务器网络，规则分析已保留。': 'DeepSeek could not be reached. Check the server network; the rule analysis has been retained.',
    'DeepSeek返回格式未通过校验；规则分析已保留，可重试。': 'The DeepSeek response did not pass format validation. The rule analysis has been retained; you can retry.',
    'DeepSeek复核未完成；规则分析已保留，请检查服务器配置后重试。': 'DeepSeek did not complete the review. The rule analysis has been retained; check the server configuration before retrying.',
    'AI复核暂不可用，原始报告及规则分析已保存。': 'AI review is unavailable. The original report and rule analysis have been saved.',
    '服务重启中断了AI复核。原始报告与规则分析已保留，可重新分析。': 'A service restart interrupted AI review. The original report and rule analysis have been retained; create a new analysis to retry.',
    'DEEPSEEK_MODEL 配置无效。': 'The DEEPSEEK_MODEL setting is invalid.',
    'DeepSeek 服务地址须为不含凭证、查询参数和片段的 HTTPS 地址。': 'The DeepSeek endpoint must be an HTTPS URL without credentials, query parameters or a fragment.',
    'DeepSeek 服务地址配置无效。': 'The DeepSeek endpoint setting is invalid.',
    '报告不存在': 'Report not found',
    '分析记录不存在': 'Analysis not found',
    '站点需为AE、US等代码': 'Use a valid marketplace code',
    '仅支持阿联酋站点AE和沙特站点SA': 'Only the United Arab Emirates (AE) and Saudi Arabia (SA) marketplaces are supported.',
    '报告日期范围无效，结束日期不能晚于今天，最多366天': 'The date range is invalid. The end date cannot be in the future and the report cannot exceed 366 days.',
    '请上传.xlsx格式的DeepBI报告': 'Upload a DeepBI report in .xlsx format.',
    '文件为空或超过15MB上限': 'The file is empty or exceeds the 15 MB limit.',
    '执行时间必须包含时区': 'Execution time must include a time zone.',
    '实际执行时间不能在未来，也不能早于这份报告结束日期': 'Execution time cannot be in the future or before this report ends.',
    '执行时间不能早于本次分析生成时间；请选择实际执行此次建议的时间': 'Execution time cannot precede this analysis. Enter when you actually executed this recommendation.',
    '同一批次不能重复确认相同ASIN': 'The same ASIN cannot be confirmed twice in one batch.',
    '日期格式应为YYYY-MM-DD': 'Dates must use YYYY-MM-DD format.',
    '工作簿无法读取，请检查格式和必需字段': 'The workbook could not be read. Check its format and required columns.',
    '确认的ASIN不属于该报告': 'The ASIN being confirmed is not part of this report.',
    '这份报告中的部分产品已经确认过，不能重复记录；请刷新后核对执行记录': 'Some listings in this report have already been confirmed. Refresh and review the execution records instead of creating duplicates.',
    '不接受跨站修改请求': 'Cross-site modification requests are not accepted.',
    '解压后的工作簿过大': 'The uncompressed workbook is too large.',
    '上传文件为空。': 'The uploaded file is empty.',
    '文件超过20MB，请导出单站点报表。': 'The file exceeds 20 MB. Export a report for a single marketplace.',
    '无法读取Excel文件，请上传有效的.xlsx报表。': 'The Excel file could not be read. Upload a valid .xlsx report.',
    '工作簿包含多张报表，请每次上传一个站点的一张报表。': 'The workbook contains multiple reports. Upload one report for one marketplace at a time.',
    '每份报表最多支持5000个Listing。': 'Each report supports up to 5,000 listings.',
    '报表中没有可分析的Listing。': 'The report contains no listings that can be analyzed.',
    '工作簿结构损坏或字段无法读取，请重新导出.xlsx报表。': 'The workbook structure or fields could not be read. Export a new .xlsx report.',
    'Excel解压后内容过大，请使用单站点原始导出。': 'The uncompressed Excel content is too large. Use an original single-marketplace export.',
    '不接受含宏的工作簿，请上传.xlsx原始导出。': 'Macro-enabled workbooks are not accepted. Upload the original .xlsx export.',
    '报表含重复字段，请使用未经合并的原始导出。': 'The report contains duplicate columns. Use an unmerged original export.',
    '报告没有可分析的产品。': 'The report contains no products that can be analyzed.',
    '经营目标ACOS应在16%至50%之间。': 'The business ACOS goal must be between 16% and 50%.',
}

# Full matches preserve the exact numeric values printed in historical snapshots.
# They do not recalculate values from rounded summary metrics.
_PATTERNS = [
    (r'广告花费 ([\d,.]+)，广告销售 ([\d,.]+)，广告订单 (\d+)。', 'Ad spend {0}; ad sales {1}; ad orders {2}.'),
    (r'当前库存 (\d+)；当前输入目标 ([\d.]+)%（快照）。', 'Current inventory {0}; current input target {1}% (snapshot).'),
    (r'当前库存 (\d+)；报告未提供单品目标。', 'Current inventory {0}; the report does not provide a listing target.'),
    (r'实际ACOS ([\d.]+)%，经营参考目标 ([\d.]+)%。', 'Actual ACOS {0}%; business reference target {1}%.'),
    (r'可比前期ACOS ([\d.]+)%，广告订单 (\d+)。', 'Comparable previous-period ACOS {0}%; ad orders {1}.'),
    (r'库存低于(\d+)，进入库存保护核查', 'Inventory is below {0}; review inventory protection'),
    (r'当前库存低于(\d+)，系统不扩张探索且预算强制为1；先补货和核实可售，目标调整暂缓。', 'Inventory is below {0}. Expansion stops and the budget is forced to 1. Replenish and verify availability before changing the target.'),
    (r'试调至([\d.]+)%', 'Trial target: {0}%'),
    (r'连续可比周期成本均高于([\d.]+)%，当前至少超出10%，两期各有至少5单且目标未变；可将较宽松输入收紧至([\d.]+)%做受控试验，同时观察总营业额，不能保证调后达标。', 'Costs exceed {0}% in consecutive comparable periods, with the current period at least 10% above the goal. Each period has at least 5 orders and the target is unchanged. A controlled trial may tighten the higher input target to {1}% while monitoring total revenue; success is not guaranteed.'),
    (r'整体广告ACOS ([\d.]+)%，符合([\d.]+)%参考目标；继续寻找有证据的增长机会。', 'Overall ad ACOS is {0}%, meeting the {1}% reference goal. Continue identifying growth opportunities supported by evidence.'),
    (r'整体广告ACOS ([\d.]+)%，高于([\d.]+)%参考目标；优先定位无效消耗，避免一刀切压缩销售。', 'Overall ad ACOS is {0}%, above the {1}% reference goal. Prioritize ineffective spend while avoiding indiscriminate cuts that reduce sales.'),
    (r'(\d+)款有花费但无广告销售，合计 ([\d,.]+)，占广告花费 ([\d.]+)%。', '{0} listings have spend without ad sales, totaling {1}, or {2}% of ad spend.'),
    (r'(\d+)款需先核库存保护；库存<(\d+)时不扩张探索、预算强制为1。', '{0} listings need inventory protection checks first. When inventory is below {1}, expansion stops and the budget is forced to 1.'),
    (r'(\d+)款有足够证据提出目标试调；其余保持、观察或排查，不为输出建议而强行改参数。', '{0} listings have sufficient evidence for a target trial. Hold, monitor or investigate the others; do not change targets merely to produce recommendations.'),
    (r'与可比前期相比，总营业额变化 ([+\-\d.]+)%；需结合促销、价格和产品范围变化解释。', 'Total revenue changed by {0}% from the comparable previous period. Interpret this alongside promotions, prices and changes in product coverage.'),
    (r'([A-Z0-9]{10})未导出单品目标，分析会标为目标缺失，不自动生成调参动作。', '{0}: the listing target was not exported. It is marked as missing and no target change is automatically recommended.'),
    (r'AI本次优先审阅(\d+)款，共(\d+)款；完整逐品结果由规则分析保留。', 'AI reviewed {0} prioritized listings out of {1}. The complete listing results remain available in the rule analysis.'),
    (r'([A-Z0-9]{10})为手动调整或与建议不同，请填写原因', '{0}: enter a reason for this manual adjustment or departure from the recommendation.'),
    (r'第(\d+)行的([a-z_]+)缺少数值；请重新导出完整报表。', 'Row {0}: {1} is missing a numeric value. Export a complete report again.'),
    (r'第(\d+)行的([a-z_]+)不是有效数值。', 'Row {0}: {1} is not a valid number.'),
    (r'第(\d+)行的([a-z_]+)无法解析：请保留DeepBI原始数字格式。', 'Row {0}: {1} could not be parsed. Preserve the original DeepBI number format.'),
    (r'第(\d+)行的([a-z_]+)数值超出可分析范围。', 'Row {0}: {1} is outside the supported numeric range.'),
    (r'第(\d+)行的([a-z_]+)不能为负数。', 'Row {0}: {1} cannot be negative.'),
    (r'第(\d+)行的([a-z_]+)应为整数。', 'Row {0}: {1} must be an integer.'),
    (r'第(\d+)行目标ACOS应在16%至50%之间；例如24%或24。', 'Row {0}: target ACOS must be between 16% and 50%, for example 24% or 24.'),
    (r'第(\d+)行父ASIN格式不正确，应为10位字母或数字。', 'Row {0}: the parent ASIN must contain 10 letters or digits.'),
    (r'父ASIN ([A-Z0-9]{10})重复出现；请先核对报表，避免重复计算。', 'Parent ASIN {0} appears more than once. Check the report to avoid double counting.'),
    (r'第(\d+)行缺少托管状态。', 'Row {0}: the management status is missing.'),
    (r'未找到DeepBI报表，缺少字段：(.+)。最多支持50列。', 'No DeepBI report was found. Missing source columns: {0}. Maximum: 50 columns.'),
]
_PATTERNS = [(re.compile(pattern), translated) for pattern, translated in _PATTERNS]
_CJK = re.compile(r'[\u3400-\u9fff]')


def translate_message(value: Any, lang: str = 'en') -> Any:
    """Translate only known program messages; unknown text is clearly identified."""
    if not isinstance(value, str) or not str(lang).lower().startswith('en') or not _CJK.search(value):
        return value
    if value in _MESSAGES:
        return _MESSAGES[value]
    for pattern, translated in _PATTERNS:
        match = pattern.fullmatch(value)
        if match:
            return translated.format(*match.groups())
    suffix = ' 当前已处于最低公开档位，更需要检查实际消耗来源。'
    if value.endswith(suffix) and value[:-len(suffix)] in _MESSAGES:
        return _MESSAGES[value[:-len(suffix)]] + _MESSAGES[suffix]
    if '\n\n' in value:
        return '\n\n'.join(translate_message(part, lang) for part in value.split('\n\n'))
    # Preserve unexpected historical wording rather than invent a translation.
    return 'Original message (not translated): ' + value


def _fields(container: Any, *keys: str) -> None:
    if isinstance(container, dict):
        for key in keys:
            if key in container:
                container[key] = translate_message(container[key])


def _messages(container: Any, key: str) -> None:
    if isinstance(container, dict) and isinstance(container.get(key), list):
        container[key] = [translate_message(value) for value in container[key]]


def localize_analysis(analysis: dict, lang: str) -> dict:
    """Return a localized display copy while leaving the saved analysis intact."""
    result = deepcopy(analysis)
    if not str(lang).lower().startswith('en'):
        return result
    _fields(result, 'narrative')
    summary = result.get('summary', {})
    _fields(summary, 'headline')
    _messages(summary, 'observations')
    _fields(summary.get('goals'), 'description')
    for item in result.get('recommendations', []):
        _fields(item, 'action_label', 'reason')
        _messages(item, 'evidence')
        _fields(item.get('opportunity'), 'label', 'reason')
        for anomaly in item.get('anomalies', []):
            _fields(anomaly, 'label')
            _messages(anomaly, 'possible_causes')
            _messages(anomaly, 'next_steps')
        _fields(item.get('history', {}).get('execution'), 'evaluation')
    quality = result.get('quality', {})
    _messages(quality, 'warnings')
    for issue in quality.get('issues', []):
        _fields(issue, 'label')
    _fields(result.get('comparison'), 'reason', 'scope_warning')
    _fields(result.get('methodology'), 'note')
    review = result.get('ai_review')
    if isinstance(review, dict):
        _fields(review, 'error')
        # Limitations mix fixed system messages with model prose. Only translate
        # recognized system strings; model prose stays in its original language.
        if isinstance(review.get('limitations'), list):
            review['limitations'] = [
                translate_message(message) if isinstance(message, str) and (
                    message in _MESSAGES or any(p.fullmatch(message) for p, _ in _PATTERNS)
                ) else message for message in review['limitations']
            ]
        original_text = [review.get('summary', '')]
        for finding in review.get('findings', []):
            if isinstance(finding, dict):
                original_text.extend([finding.get('comment', ''), *finding.get('possible_causes', []), *finding.get('next_steps', [])])
        original_text = ' '.join(text for text in original_text if isinstance(text, str))
        review['content_language'] = 'zh' if _CJK.search(original_text) else ('en' if original_text.strip() else 'und')
        review['localization_notice'] = (
            'AI commentary is shown in the language in which it was generated. '
            'Changing the interface language does not rewrite the saved AI review.'
            if original_text.strip() else ''
        )
    return result
