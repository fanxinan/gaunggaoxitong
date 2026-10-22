"""Deterministic, evidence-first weekly advertising analysis.

All thresholds below are review heuristics, not DeepBI's private algorithm.
The model treats the listing target as a control input, never as a promised result.
"""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta
import math
from typing import Any

RULES_VERSION = "2026.10.22-growth-1"


def _number(value: Any, default: float = 0.0) -> float:
    try:
        result = float(value)
        return result if math.isfinite(result) else default
    except (TypeError, ValueError):
        return default


def _day(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def _period(report: dict) -> tuple[date | None, date | None, int]:
    start, end = _day(report.get("period_start")), _day(report.get("period_end"))
    return start, end, (end - start).days + 1 if start and end and end >= start else 0


def _acos(row: dict) -> float | None:
    sales = _number(row.get("ad_sales"))
    return _number(row.get("ad_spend")) / sales * 100 if sales > 0 else None


def _pct(current: float, previous: float | None) -> float | None:
    return round((current / previous - 1) * 100, 2) if previous is not None and previous > 0 else None


def _rounded(value: float | None) -> float | None:
    return round(value, 2) if value is not None else None


def _row_quality(row: dict) -> list[str]:
    result = []
    total = row.get("total_sales")
    sales = _number(row.get("ad_sales"))
    organic = row.get("organic_sales")
    if total is None or _number(total) < 0:
        result.append("total_sales_missing_or_negative")
    if total is not None and sales > _number(total) + 0.02:
        result.append("ad_sales_above_total")
    if organic is not None and _number(organic) < 0:
        result.append("negative_organic_sales")
    if total is not None and organic is not None and abs(_number(total) - sales - _number(organic)) > 0.02:
        result.append("sales_reconciliation")
    return result


def _quality(report: dict) -> dict:
    rows = report.get("rows", [])
    counts: Counter = Counter()
    for row in rows:
        counts.update(_row_quality(row))
        source_acos = row.get("source_acos", row.get("source_ai_acos", row.get("acos")))
        if _number(row.get("ad_spend")) > 0 and _number(row.get("ad_sales")) == 0 and source_acos is not None and _number(source_acos) == 0:
            counts["zero_sales_false_zero_acos"] += 1
        if row.get("target") is None:
            counts["missing_target"] += 1
    share_fields = ("organic_share", "sp_sales_share", "ai_sales_share")
    share_columns = [key for key in share_fields if rows and all(row.get(key) is not None and _number(row[key]) == 0 for row in rows)]
    if share_columns and any(_number(row.get("ad_sales")) > 0 for row in rows):
        counts["all_zero_shares"] = len(rows)
    labels = {
        "total_sales_missing_or_negative": "总营业额缺失或为负",
        "ad_sales_above_total": "广告销售额大于总销售额",
        "negative_organic_sales": "自然销售额为负",
        "sales_reconciliation": "总销售与广告加自然销售不一致",
        "zero_sales_false_zero_acos": "有花费无销售，却导出为0% ACOS",
        "missing_target": "报告缺少单品目标设置",
        "all_zero_shares": "导出占比列全为0，不能用于份额判断",
    }
    unreliable = any(counts.get(key, 0) for key in (
        "total_sales_missing_or_negative", "ad_sales_above_total", "negative_organic_sales", "sales_reconciliation"
    ))
    warnings = list(report.get("warnings", []))
    if unreliable:
        warnings.append("总销售归集存在异常，本次不据此确认营业额增长或自然销售增量；请核对归因窗口及父子ASIN归集。")
    if counts["zero_sales_false_zero_acos"]:
        warnings.append("有花费但无广告销售时，ACOS不可按0%判优，本次按无广告成交处理。")
    if share_columns:
        warnings.append("销售占比字段存在全0列，本次不使用这些占比推断效果。")
    warnings.append("库存、目标与日预算是导出快照，不能证明整个统计期一直保持该设置。")
    return {
        "warnings": list(dict.fromkeys(warnings)),
        "issues": [{"code": code, "label": labels[code], "count": count} for code, count in counts.items() if count],
        "total_sales_reliable": not unreliable,
    }


def _totals(report: dict) -> dict:
    rows = report.get("rows", [])
    spend = sum(_number(r.get("ad_spend")) for r in rows)
    sales = sum(_number(r.get("ad_sales")) for r in rows)
    return {
        "ad_spend": round(spend, 2), "ad_sales": round(sales, 2),
        "acos": spend / sales * 100 if sales > 0 else None,
        "orders": int(sum(_number(r.get("orders")) for r in rows)),
        "total_sales": round(sum(_number(r.get("total_sales")) for r in rows), 2),
        "listing_count": len(rows),
    }


def _comparison(report: dict, prior_reports: list[dict], quality: dict) -> tuple[dict, dict | None]:
    start, end, days = _period(report)
    base = {
        "available": False, "reason": "尚无同站点、同统计天数且不重叠的历史报告。",
        "previous_report_id": None, "previous_period": None,
        "metrics": {"spend_pct": None, "ad_sales_pct": None, "acos_pp": None, "total_sales_pct": None},
        "consecutive": False,
    }
    if not start or not end or not days:
        base["reason"] = "报告日期无效，无法比较历史。"
        return base, None
    candidates = []
    for prior in prior_reports:
        pstart, pend, pdays = _period(prior)
        if prior.get("id") == report.get("id") and report.get("id") is not None:
            continue
        if str(prior.get("marketplace", "")).upper() != str(report.get("marketplace", "")).upper():
            continue
        if pstart and pend and pdays == days and pend < start:
            candidates.append(prior)
    if not candidates:
        if any(str(p.get("marketplace", "")).upper() == str(report.get("marketplace", "")).upper() for p in prior_reports):
            base["reason"] = "已有历史记录，但周期长度不同或日期重叠；不把7天周报与30天基线作金额同比。"
        return base, None
    previous = max(candidates, key=lambda p: (_period(p)[1], str(p.get("created_at", "")), str(p.get("id", ""))))
    pstart, pend, _ = _period(previous)
    totals, before = _totals(report), _totals(previous)
    previous_quality = _quality(previous)
    reliable = quality["total_sales_reliable"] and previous_quality["total_sales_reliable"]
    consecutive = pend + timedelta(days=1) == start
    base.update({
        "available": True, "reason": "与紧邻的同长度上一周期比较。" if consecutive else "与最近同长度历史周期比较；中间存在日期缺口，不据此直接生成调参动作。",
        "previous_report_id": previous.get("id"),
        "previous_period": f"{pstart.isoformat()} — {pend.isoformat()}",
        "previous_period_start": pstart.isoformat(), "previous_period_end": pend.isoformat(),
        "consecutive": consecutive,
        "metrics": {
            "spend_pct": _pct(totals["ad_spend"], before["ad_spend"]),
            "ad_sales_pct": _pct(totals["ad_sales"], before["ad_sales"]),
            "acos_pp": round(totals["acos"] - before["acos"], 2) if totals["acos"] is not None and before["acos"] is not None else None,
            "total_sales_pct": _pct(totals["total_sales"], before["total_sales"]) if reliable else None,
        },
        "total_sales_reliable": reliable,
        "listing_count_change": totals["listing_count"] - before["listing_count"],
        "scope_warning": "托管产品数量变化，整体变化包含产品范围变化，不能全归因于调参。" if totals["listing_count"] != before["listing_count"] else None,
    })
    return base, previous


def _execution_history(asin: str, report: dict, executions: list[dict], current_target: Any) -> dict:
    start, end, _ = _period(report)
    matching = [x for x in executions if x.get("asin") == asin and (not x.get("marketplace") or x.get("marketplace") == report.get("marketplace")) and _day(x.get("executed_at"))]
    if not matching:
        return {"has_confirmation": False, "evaluation": "尚无已确认的人工调整记录。", "blocks_new_change": False}
    latest = max(matching, key=lambda x: (str(x.get("executed_at", "")), str(x.get("confirmed_at", ""))))
    executed = _day(latest.get("executed_at"))
    info = {
        "has_confirmation": True, "actual_target": latest.get("actual_target"),
        "executed_at": latest.get("executed_at"), "confirmed_at": latest.get("confirmed_at"),
        "note": latest.get("note", ""), "report_id": latest.get("report_id"),
        "blocks_new_change": True, "complete_post_change_period": False,
        "target_matches_confirmation": current_target is not None and abs(_number(current_target) - _number(latest.get("actual_target"), -999)) < .001,
    }
    if not start or not end:
        info["evaluation"] = "日期不完整，无法评估确认后的表现。"
    elif executed > end:
        info["evaluation"] = "报告期之后已有人工确认，本报告不能用于重复调整或评价该动作。"
    elif executed >= start:
        info["evaluation"] = "人工调整发生于报告期内，数据混合调整前后表现，暂不再次改目标。"
    elif not info["target_matches_confirmation"]:
        info["evaluation"] = "导出目标与最近确认值不一致，先核实实际设置与同步状态。"
    else:
        info["complete_post_change_period"] = True
        days_elapsed = (end - executed).days
        info["days_since_execution_at_period_end"] = days_elapsed
        info["blocks_new_change"] = days_elapsed < 14
        info["evaluation"] = "已有完整调整后周期，仍需等待至少14天并结合归因成熟度复盘。" if days_elapsed < 14 else "已有完整调整后周期；仅作关联观察，不能将销售变化全部归因于该次调整。"
    return info


def _anomaly(code: str, label: str, causes: list[str], steps: list[str]) -> dict:
    return {"code": code, "label": label, "possible_causes": causes, "next_steps": steps}


def analyze_report(report: dict, prior_reports: list[dict], executions: list[dict], settings: dict) -> dict:
    """Analyze without writing state. Recommendations are frozen by the caller."""
    rows = report.get("rows", [])
    if not rows:
        raise ValueError("报告没有可分析的产品。")
    goal = _number(settings.get("target_acos"), 24)
    if not 16 <= goal <= 50:
        raise ValueError("经营目标ACOS应在16%至50%之间。")
    threshold = int(_number(settings.get("inventory_threshold"), 3))
    threshold = max(0, threshold)
    quality = _quality(report)
    comparison, previous = _comparison(report, prior_reports, quality)
    previous_rows = {r["asin"]: r for r in previous.get("rows", [])} if previous else {}
    recommendations = []
    totals = _totals(report)
    zero_rows = [r for r in rows if _number(r.get("ad_spend")) > 0 and _number(r.get("ad_sales")) == 0]

    for row in rows:
        asin = row["asin"]
        target = row.get("target")
        target_number = _number(target, goal)
        spend, sales, orders, stock = (_number(row.get(k)) for k in ("ad_spend", "ad_sales", "orders", "inventory"))
        acos = _acos(row)
        old = previous_rows.get(asin)
        old_acos = _acos(old) if old else None
        row_issues = _row_quality(row)
        history = {
            "available": bool(old), "previous_report_id": previous.get("id") if previous else None,
            "previous_acos": _rounded(old_acos),
            "ad_sales_change_pct": _pct(sales, _number(old.get("ad_sales"))) if old else None,
            "spend_change_pct": _pct(spend, _number(old.get("ad_spend"))) if old else None,
            "total_sales_change_pct": _pct(_number(row.get("total_sales")), _number(old.get("total_sales"))) if old and not row_issues and not _row_quality(old) else None,
            "target_changed": bool(old and old.get("target") is not None and target is not None and abs(_number(old["target"]) - target_number) > .001),
            "execution": _execution_history(asin, report, executions, target),
        }
        evidence = [f"广告花费 {spend:,.2f}，广告销售 {sales:,.2f}，广告订单 {int(orders)}。",
                    f"当前库存 {int(stock)}；当前输入目标 {target_number:g}%（快照）。" if target is not None else f"当前库存 {int(stock)}；报告未提供单品目标。"]
        if acos is not None:
            evidence.append(f"实际ACOS {acos:.2f}%，经营参考目标 {goal:g}%。")
        elif spend > 0:
            evidence.append("没有广告销售，ACOS不可计算，不能按0%判断达标。")
        if old_acos is not None:
            evidence.append(f"可比前期ACOS {old_acos:.2f}%，广告订单 {int(_number(old.get('orders')))}。")
        if history["target_changed"]:
            evidence.append("两份报告的输入目标不同，缺少完整变更时点，不把当前表现归因于单一目标。")
        if history["execution"]["has_confirmation"]:
            evidence.append(history["execution"]["evaluation"])

        anomalies = []
        if spend > 0 and sales == 0:
            anomalies.append(_anomaly("zero_conversion", "有广告花费但无广告成交", ["流量相关性不足", "点击成本或商品转化问题", "归因尚未成熟或销售归集缺失"], ["查看活动、搜索词和商品定位的点击及花费", "核实可售状态和归因窗口", "按消耗规模控制持续无转化探索，保留有效对象"]))
        if acos is not None and acos >= goal * 2:
            anomalies.append(_anomaly("high_cost", "实际ACOS至少为经营目标的两倍", ["部分活动消耗集中", "CPC偏高或转化不足", "样本少或订单归因异常"], ["定位拉高成本的具体活动和对象", "查看点击、CPC、转化与归因数据", "不要把整体降目标作为唯一处置"]))
        if stock < threshold:
            anomalies.append(_anomaly("inventory_protection", f"库存低于{threshold}，进入库存保护核查", ["当前库存不足", "可售变体或FBA/FBM库存口径差异"], ["按账户规则停止扩张探索、预算强制为1；核实规则是否执行", "确认补货及可售变体", "报表预算可能是汇总值，不能直接与1比较认定故障"]))
        if row_issues:
            anomalies.append(_anomaly("sales_data_quality", "销售归集口径异常", ["广告归因与订单时间口径不同", "父子ASIN或跨商品订单归集差异", "导出数据缺失"], ["核对亚马逊原始业务和广告报表", "未核对前不据此判断自然增量或营业额增长"]))
        if target is None:
            anomalies.append(_anomaly("target_missing", "缺少当前单品目标", ["导出未提供设置值"], ["核实实际单品设置及站点继承值后再调参"]))

        action, label, actionable = "hold", "保持观察", False
        recommended, priority, confidence = target, "low", "low"
        opportunity = None
        status = row.get("status", "")
        history_blocked = history["execution"]["blocks_new_change"] or history["target_changed"]
        enough_history = bool(old and comparison["consecutive"] and orders >= 5 and _number(old.get("orders")) >= 5)
        steady_target = bool(old and old.get("target") is not None and target is not None and abs(_number(old["target"]) - target_number) < .001)
        clean = not row_issues and bool(old) and not _row_quality(old)
        # Stronger evidence than a single low/high percentage is needed to suggest a change.
        can_tighten = bool(
            target is not None and target_number > goal and acos is not None and old_acos is not None
            and acos >= goal * 1.1 and old_acos > goal and acos < goal * 2
            and enough_history and steady_target and clean and not history_blocked
        )
        if status == "已暂停" or "取消" in status:
            action, label = "paused", "保持暂停"
            reason = "保持现有暂停状态，不因输入目标或历史种子数量恢复投放。"
        elif status != "投放中":
            reason = "投放尚未处于稳定运行状态，先完成准备或状态核查，不立即调整目标。"
        elif stock < threshold:
            action, label, priority = "protect_inventory", "先处理库存保护", "high" if stock == 0 and spend > 0 else "medium"
            reason = f"当前库存低于{threshold}，系统不扩张探索且预算强制为1；先补货和核实可售，目标调整暂缓。"
            confidence = "high"
        elif target is None:
            action, label, priority = "investigate", "先核实目标设置", "medium"
            reason = "报告没有当前输入目标，不能安全地给出新目标值。"
        elif sales == 0 and spend > 0:
            action, label, priority = "investigate", "排查无成交消耗", "high" if spend >= 100 else "medium"
            reason = "已有广告花费却没有广告销售；按消耗及归因成熟度排查，不能把ACOS当0%或仅靠换一个目标值解决。"
        elif acos is not None and acos >= goal * 2:
            action, label, priority = "investigate", "优先排查高成本", "high" if spend >= 100 else "medium"
            reason = "成本明显偏离经营目标，先找具体无效消耗、点击成本及转化原因；汇总数据不足以确定另一个百分比就是解法。"
        elif history_blocked:
            reason = "近期已有确认或输入目标发生变化，先核对实际设置并观察调整后完整周期，避免重复调参。"
            label = "等待调整后复盘"
            priority = "medium" if acos is not None and acos > goal else "low"
        elif can_tighten:
            action, label, actionable, recommended = "tighten", f"试调至{goal:g}%", True, goal
            priority, confidence = "medium", "medium"
            reason = f"连续可比周期成本均高于{goal:g}%，当前至少超出10%，两期各有至少5单且目标未变；可将较宽松输入收紧至{goal:g}%做受控试验，同时观察总营业额，不能保证调后达标。"
        elif acos is not None and acos > goal:
            action, label, priority = "investigate", "先查成本与样本", "medium"
            reason = "实际成本超过经营参考，但缺少足够的连续可比样本、稳定设置或可靠销售口径；先排查，不仅因输入较高就统一回调。"
            if target_number <= 16:
                reason += " 当前已处于最低公开档位，更需要检查实际消耗来源。"
        elif sales == 0:
            reason = "本期无广告花费与销售，先核可售、广告创建及曝光，不能从空结果推定目标过紧。"
            label = "检查投放准备"
        else:
            reason = "当前实际ACOS符合经营参考，先保留有效设置；不为统一参数或改变颜色而调整。较高输入可能允许后续成本上升，仍需监控。"
            if enough_history and acos is not None and old_acos is not None and acos <= goal * .7 and old_acos <= goal * .7 and orders >= 10 and _number(old.get("orders")) >= 10 and clean:
                opportunity = {"label": "可评估增长空间", "reason": "连续周期低成本且有成交样本；还需曝光、点击及流量受限证据，不能仅据低ACOS提高目标。"}
                evidence.append(opportunity["reason"])
            confidence = "medium" if enough_history else "low"
        if orders in (1, 2):
            evidence.append("仅1–2个广告订单，效果估计不稳定，不据此校准最优目标。")
        if not previous:
            evidence.append("尚无可比上一周期；本次为基线或初次观察。")
        recommendations.append({
            "asin": asin, "name": row.get("name") or asin, "current_target": target,
            "recommended_target": recommended, "action": action, "action_label": label,
            "actionable": actionable, "priority": priority, "confidence": confidence,
            "reason": reason, "evidence": evidence, "anomalies": anomalies, "history": history,
            "growth_candidate": bool(opportunity), "opportunity": opportunity,
            "metrics": {"spend": round(spend, 2), "ad_sales": round(sales, 2), "orders": int(orders),
                        "acos": _rounded(acos), "inventory": int(stock), "total_sales": row.get("total_sales"),
                        "daily_budget": row.get("daily_budget"), "campaigns": row.get("campaigns")},
            "source_row": row.get("source_row"), "status": status,
        })

    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda r: (priority_order[r["priority"]], not r["actionable"], -r["metrics"]["spend"], r["asin"]))
    action_count = sum(r["actionable"] for r in recommendations)
    active_count = sum(r.get("status") == "投放中" for r in rows)
    zero_spend = sum(_number(r.get("ad_spend")) for r in zero_rows)
    overall_acos = totals["acos"]
    meets_goal = overall_acos is not None and overall_acos <= goal
    revenue_growth = comparison["metrics"]["total_sales_pct"]
    acos_delta = comparison["metrics"]["acos_pp"]
    if overall_acos is None:
        headline = "本期尚无广告销售，优先核实投放与无成交消耗。"
    elif meets_goal:
        headline = f"整体广告ACOS {overall_acos:.2f}%，符合{goal:g}%参考目标；继续寻找有证据的增长机会。"
    else:
        headline = f"整体广告ACOS {overall_acos:.2f}%，高于{goal:g}%参考目标；优先定位无效消耗，避免一刀切压缩销售。"
    observations = [
        f"{len(zero_rows)}款有花费但无广告销售，合计 {zero_spend:,.2f}，占广告花费 {zero_spend / totals['ad_spend'] * 100 if totals['ad_spend'] else 0:.2f}%。",
        f"{sum(r['action'] == 'protect_inventory' for r in recommendations)}款需先核库存保护；库存<{threshold}时不扩张探索、预算强制为1。",
        f"{action_count}款有足够证据提出目标试调；其余保持、观察或排查，不为输出建议而强行改参数。",
    ]
    if not quality["total_sales_reliable"]:
        observations.append("总营业额字段存在归集问题，本期不能确认营业额增长；广告销售增长不等于全店新增营业额。")
    elif revenue_growth is not None:
        observations.append(f"与可比前期相比，总营业额变化 {revenue_growth:+.2f}%；需结合促销、价格和产品范围变化解释。")
    else:
        observations.append("尚无可靠可比的营业额增长结论，先积累同长度周报。")
    summary = {
        **totals, "acos": _rounded(overall_acos), "active_count": active_count,
        "total_sales_reliable": quality["total_sales_reliable"], "goal_acos": goal,
        "zero_sale_spend": round(zero_spend, 2), "zero_sale_count": len(zero_rows),
        "at_risk_count": sum(r["priority"] == "high" for r in recommendations),
        "action_count": action_count, "growth_candidate_count": sum(r["growth_candidate"] for r in recommendations),
        "inventory_protection_count": sum(r["action"] == "protect_inventory" for r in recommendations),
        "headline": headline, "observations": observations,
        "goals": {"target_acos": goal, "cost_goal_met": meets_goal if overall_acos is not None else None,
                  "revenue_growth_pct": revenue_growth, "acos_change_pp": acos_delta,
                  "ideal_result": revenue_growth > 0 and acos_delta < 0 if revenue_growth is not None and acos_delta is not None else None,
                  "description": "争取全店总营业额增长，实际ACOS以经营目标为参考；营业额增长且ACOS下降是更优结果。"},
    }
    narrative = "\n\n".join([headline, *observations, "本次为可复核的规则分析。异常原因是待核实假设，不是已证实因果；调整目标是受控试验，不能保证实际ACOS或营业额结果。"])
    return {
        "summary": summary, "recommendations": recommendations, "quality": quality,
        "comparison": comparison, "rules_version": RULES_VERSION, "mode": "rules", "narrative": narrative,
        "methodology": {"inventory_threshold": threshold, "minimum_orders_per_period": 5,
                        "tighten_current_goal_multiplier": 1.1, "severe_cost_multiplier": 2,
                        "execution_observation_days": 14,
                        "note": "以上是分析审核门槛，不是DeepBI私有算法或自动止损线。没有流量受限证据时，不自动生成提高目标动作。"},
    }
