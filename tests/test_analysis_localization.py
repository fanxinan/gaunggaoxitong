"""Language changes must never change advertising decisions or saved evidence."""
from copy import deepcopy
import json
import re
import unittest

from analysis_engine import analyze_report
from localized_analysis import localize_analysis, translate_message


def row(index, **changes):
    value = {'asin': f'B{index:09d}', 'name': '原始商品名称', 'inventory': 40,
             'total_sales': 300, 'ad_sales': 200, 'organic_sales': 100,
             'ad_spend': 60, 'orders': 10, 'target': 28, 'status': '投放中',
             'daily_budget': 20, 'campaigns': 3, 'source_row': index + 1}
    value.update(changes)
    return value


def report(rows, previous=False):
    return {'id': 'previous' if previous else 'current', 'marketplace': 'AE',
            'period_start': '2026-10-01' if previous else '2026-10-08',
            'period_end': '2026-10-07' if previous else '2026-10-14',
            'rows': deepcopy(rows)}


def non_text_values(value, path=''):
    result = {}
    if isinstance(value, dict):
        for key, item in value.items():
            result.update(non_text_values(item, path + '/' + key))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            result.update(non_text_values(item, path + '/' + str(index)))
    elif not isinstance(value, str):
        result[path] = value
    return result


class AnalysisLocalizationTests(unittest.TestCase):
    def fixture(self):
        rows = [row(1), row(2, inventory=2), row(3, ad_sales=0, organic_sales=300),
                row(4, target=16), row(5, ad_spend=150), row(6, status='已暂停'),
                row(7, ad_sales=0, ad_spend=0, organic_sales=300), row(8, target=None),
                row(9, ad_spend=20), row(10, status='准备中'),
                row(11, total_sales=100, organic_sales=-100)]
        value = analyze_report(report(rows), [report(rows, True)], [], {'target_acos': 24, 'inventory_threshold': 3})
        value.update(id='analysis-1', report_id='current', created_at='2026-10-15T09:30:00+00:00',
                     report={'filename': '原始中文报告.xlsx', 'marketplace': 'AE'},
                     settings_snapshot={'target_acos': 24},
                     confirmations=[{'asin': rows[0]['asin'], 'actual_target': 24, 'note': '实际执行备注'}])
        return value

    def test_english_view_preserves_source_data_numbers_and_decisions(self):
        source = self.fixture()
        snapshot = deepcopy(source)
        english = localize_analysis(source, 'en')
        self.assertEqual(source, snapshot)
        self.assertEqual(non_text_values(source), non_text_values(english))
        self.assertEqual(english['confirmations'], source['confirmations'])
        self.assertEqual(english['report'], source['report'])
        for original, translated in zip(source['recommendations'], english['recommendations']):
            for field in ('asin', 'name', 'status', 'action', 'priority', 'confidence', 'metrics', 'current_target', 'recommended_target'):
                self.assertEqual(original[field], translated[field])
            self.assertFalse(re.search(r'[\u3400-\u9fff]', translated['reason']))
            self.assertTrue(all(not re.search(r'[\u3400-\u9fff]', text) for text in translated['evidence']))
        self.assertNotIn('Original message (not translated):', json.dumps(english))
        self.assertTrue(english['summary']['headline'].startswith('Overall ad ACOS'))

    def test_chinese_view_is_an_independent_unchanged_snapshot(self):
        source = self.fixture()
        chinese = localize_analysis(source, 'zh')
        self.assertEqual(chinese, source)
        chinese['recommendations'][0]['reason'] = 'Changed only in this copy'
        self.assertNotEqual(chinese, source)

    def test_target_trial_and_strict_inventory_threshold_are_not_reinterpreted(self):
        english = localize_analysis(self.fixture(), 'en')
        items = {item['asin']: item for item in english['recommendations']}
        trial = items['B000000001']
        self.assertTrue(trial['actionable'])
        self.assertEqual(trial['action_label'], 'Trial target: 24%')
        self.assertIn('at least 10% above the goal', trial['reason'])
        self.assertIn('at least 5 orders', trial['reason'])
        protected = items['B000000002']
        self.assertIn('below 3', protected['reason'])
        self.assertIn('forced to 1', protected['reason'])
        self.assertIn('lowest published tier', items['B000000004']['reason'])
        self.assertFalse(items['B000000004']['actionable'])
        self.assertTrue(items['B000000009']['growth_candidate'])
        self.assertFalse(items['B000000009']['actionable'])
        self.assertIn('low ACOS alone does not justify raising', items['B000000009']['opportunity']['reason'])

    def test_history_evaluation_is_translated_but_execution_note_is_not(self):
        current = report([row(1)])
        event = {'asin': 'B000000001', 'actual_target': 28, 'executed_at': '2026-10-09T12:00:00Z',
                 'confirmed_at': '2026-10-09T12:00:01Z', 'report_id': 'previous', 'note': '库存刚补货'}
        source = analyze_report(current, [report([row(1)], True)], [event], {'target_acos': 24})
        result = localize_analysis(source, 'en')
        history = result['recommendations'][0]['history']['execution']
        self.assertTrue(history['blocks_new_change'])
        self.assertEqual(history['note'], '库存刚补货')
        self.assertIn('during this reporting period', history['evaluation'])

    def test_model_generated_review_stays_in_original_language(self):
        source = self.fixture()
        source['ai_review'] = {'status': 'completed', 'summary': '这是原始AI观点。',
                               'findings': [{'asin': 'B000000001', 'comment': '核对点击数据。',
                                             'possible_causes': ['可能原因'], 'next_steps': ['下一步']}],
                               'limitations': ['AI仅复核解释，不修改可执行目标；异常原因是待验证假设。', '原始AI限制说明'],
                               'error': None}
        result = localize_analysis(source, 'en')['ai_review']
        self.assertEqual(result['summary'], source['ai_review']['summary'])
        self.assertEqual(result['findings'], source['ai_review']['findings'])
        self.assertEqual(result['limitations'][1], '原始AI限制说明')
        self.assertIn('AI reviews explanations', result['limitations'][0])
        self.assertEqual(result['content_language'], 'zh')
        self.assertIn('does not rewrite', result['localization_notice'])
        self.assertNotIn('localization_notice', source['ai_review'])

    def test_exact_numeric_strings_and_unknown_messages_are_preserved(self):
        result = translate_message('广告花费 1,234.57，广告销售 5,678.90，广告订单 17。')
        self.assertEqual(result, 'Ad spend 1,234.57; ad sales 5,678.90; ad orders 17.')
        self.assertEqual(translate_message('不认识的旧版规则'), 'Original message (not translated): 不认识的旧版规则')
        self.assertEqual(translate_message('已知英文 or 用户备注', 'zh'), '已知英文 or 用户备注')
        self.assertIn('Row 18', translate_message('第18行的ad_spend不能为负数。'))
        self.assertIn('17 prioritized listings out of 413', translate_message('AI本次优先审阅17款，共413款；完整逐品结果由规则分析保留。'))


if __name__ == '__main__':
    unittest.main()
