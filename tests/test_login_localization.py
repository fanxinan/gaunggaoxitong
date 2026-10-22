"""Page-language persistence and translated auth errors without real credentials."""
from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from access_control import COOKIE_NAME, LANGUAGE_COOKIE_NAME, install_access_control


class LoginLocalizationTests(unittest.TestCase):
    password = 'a-local-test-password-for-zhouce'

    def setUp(self):
        with patch.dict(os.environ, {'WEEKLY_ACCESS_PASSWORD': self.password,
                                    'WEEKLY_REQUIRE_AUTH': '1', 'WEEKLY_COOKIE_SECURE': 'true'}):
            app = FastAPI()
            install_access_control(app)

        @app.get('/')
        def index():
            return {'private': True}

        @app.get('/api/reports')
        def reports():
            return {'private': True}

        self.client = TestClient(app, base_url='https://testserver', follow_redirects=False)

    def tearDown(self):
        self.client.close()

    def test_language_switch_sets_only_preference_and_renders_without_javascript(self):
        original = self.client.get('/login')
        self.assertIn('<html lang="zh-CN">', original.text)
        self.assertIn('回到你的经营工作台', original.text)
        page = self.client.get('/login?lang=en')
        self.assertEqual(page.status_code, 200)
        self.assertIn('<html lang="en">', page.text)
        self.assertIn('Welcome back to your workspace', page.text)
        self.assertIn('action="/login?lang=en"', page.text)
        self.assertIn('href="/login?lang=zh"', page.text)
        self.assertNotIn('{{', page.text)
        self.assertNotIn('<script', page.text)
        self.assertEqual(self.client.cookies.get(LANGUAGE_COOKIE_NAME), 'en')
        self.assertIsNone(self.client.cookies.get(COOKIE_NAME))
        self.assertNotIn('HttpOnly', page.headers['set-cookie'])
        self.assertIn('Secure', page.headers['set-cookie'])
        self.assertIn('SameSite=lax', page.headers['set-cookie'])
        self.assertEqual(self.client.get('/api/reports').status_code, 401)

    def test_cookie_keeps_english_across_errors_login_and_logout(self):
        self.client.get('/login?lang=en')
        rejected = self.client.post('/login', data={'password': 'wrong-password-never-echo'})
        self.assertEqual(rejected.status_code, 401)
        self.assertIn('The password is incorrect.', rejected.text)
        self.assertNotIn('wrong-password-never-echo', rejected.text)
        self.assertIsNone(self.client.cookies.get(COOKIE_NAME))
        denied = self.client.get('/api/reports')
        self.assertEqual(denied.json()['login_url'], '/login?lang=en')
        self.assertEqual(denied.json()['detail'], 'Please sign in to access your workspace.')
        login = self.client.post('/login', data={'password': self.password})
        self.assertEqual(login.status_code, 303)
        self.assertEqual(login.headers['location'], '/')
        self.assertEqual(self.client.get('/api/reports').status_code, 200)
        logout = self.client.post('/logout')
        self.assertEqual(logout.headers['location'], '/login?lang=en')
        self.assertEqual(self.client.cookies.get(LANGUAGE_COOKIE_NAME), 'en')
        self.assertIsNone(self.client.cookies.get(COOKIE_NAME))
        self.assertIn('Workspace password', self.client.get('/login').text)

    def test_query_overrides_cookie_and_unsupported_input_is_not_rendered(self):
        self.client.get('/login?lang=en')
        chinese = self.client.get('/login?lang=zh')
        self.assertIn('工作台访问密码', chinese.text)
        self.assertEqual(self.client.cookies.get(LANGUAGE_COOKIE_NAME), 'zh')
        self.client.get('/login?lang=en')
        invalid = self.client.get('/login', params={'lang': '<script>alert(1)</script>'})
        self.assertIn('<html lang="en">', invalid.text)
        self.assertNotIn('alert(1)', invalid.text)
        self.assertNotIn('{{', invalid.text)
        self.assertEqual(self.client.cookies.get(LANGUAGE_COOKIE_NAME), 'en')
        self.assertEqual(self.client.get('/?lang=zh').headers['location'], '/login?lang=zh')

    def test_direct_form_submission_preserves_language_without_prior_cookie(self):
        response = self.client.post('/login?lang=en', data={'password': self.password})
        self.assertEqual(response.status_code, 303)
        self.assertEqual(self.client.cookies.get(LANGUAGE_COOKIE_NAME), 'en')
        auth_cookie = next(value for value in response.headers.get_list('set-cookie')
                           if value.startswith(COOKIE_NAME + '='))
        for attribute in ('Secure', 'HttpOnly', 'SameSite=strict'):
            self.assertIn(attribute, auth_cookie)
        self.assertEqual(self.client.post('/logout').headers['location'], '/login?lang=en')

    def test_english_format_size_csrf_and_rate_limit_errors(self):
        self.client.get('/login?lang=en')
        invalid = self.client.post('/login', json={'password': self.password})
        self.assertEqual(invalid.status_code, 400)
        self.assertIn('Invalid sign-in request.', invalid.text)
        oversized = self.client.post('/login', content='password=' + 'x' * 9000,
                                     headers={'content-type': 'application/x-www-form-urlencoded'})
        self.assertEqual(oversized.status_code, 413)
        self.assertIn('The sign-in request is too large.', oversized.text)
        csrf = self.client.post('/login', data={'password': self.password},
                               headers={'origin': 'https://other.example'})
        self.assertEqual(csrf.status_code, 403)
        self.assertEqual(csrf.json()['detail'], 'Cross-site changes are not accepted.')
        for _ in range(5):
            self.assertEqual(self.client.post('/login', data={'password': 'wrong'}).status_code, 401)
        limited = self.client.post('/login', data={'password': self.password})
        self.assertEqual(limited.status_code, 429)
        self.assertIn('Too many attempts.', limited.text)
        self.assertIn('retry-after', limited.headers)


if __name__ == '__main__':
    unittest.main()
