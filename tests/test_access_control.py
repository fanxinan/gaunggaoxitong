"""Private deployment authentication checks; no real user data or network calls."""
from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from access_control import COOKIE_NAME, FAILURE_WINDOW_SECONDS, SESSION_SECONDS, install_access_control


class AccessControlTests(unittest.TestCase):
    password = 'private-zhouce-test-password'

    def app(self, password=None, required='1', secure='true'):
        with patch.dict(os.environ, {'WEEKLY_ACCESS_PASSWORD': self.password if password is None else password,
                                    'WEEKLY_REQUIRE_AUTH': required, 'WEEKLY_COOKIE_SECURE': secure}):
            app = FastAPI()
            install_access_control(app)
        @app.get('/')
        def index():
            return {'private': True}
        @app.get('/api/health')
        def health():
            return {'status': 'ok'}
        @app.post('/api/health')
        def health_mutation():
            return {'private': True}
        @app.get('/api/backup')
        def backup():
            return {'private_backup': True}
        @app.put('/api/settings')
        def settings():
            return {'private_settings': True}
        return app

    def client(self, **kwargs):
        return TestClient(self.app(**kwargs), base_url='https://testserver', follow_redirects=False)

    def test_public_deployment_refuses_missing_or_short_password(self):
        with self.assertRaisesRegex(RuntimeError, 'WEEKLY_ACCESS_PASSWORD'):
            self.app(password='')
        with self.assertRaisesRegex(RuntimeError, '16'):
            self.app(password='short')

    def test_local_mode_preserves_existing_api_when_not_required(self):
        with self.client(password='', required='0') as client:
            self.assertFalse(client.app.state.access_control_enabled)
            self.assertEqual(client.get('/api/backup').status_code, 200)
            self.assertEqual(client.get('/login').headers['location'], '/')

    def test_unauthenticated_reads_and_docs_are_blocked_but_health_is_public(self):
        with self.client() as client:
            self.assertTrue(client.app.state.access_control_enabled)
            self.assertEqual(client.get('/').headers['location'], '/login')
            self.assertEqual(client.get('/docs').headers['location'], '/login')
            self.assertEqual(client.get('/openapi.json').headers['location'], '/login')
            self.assertEqual(client.get('/static/app.js').headers['location'], '/login')
            response = client.get('/api/backup')
            self.assertEqual(response.status_code, 401)
            self.assertNotIn('private_backup', response.text)
            self.assertEqual(client.get('/api/health').status_code, 200)
            self.assertEqual(client.post('/api/health').status_code, 401)

    def test_successful_login_uses_secure_http_only_cookie_and_logout_revokes_browser_session(self):
        with self.client() as client:
            response = client.post('/login', data={'password': self.password})
            self.assertEqual(response.status_code, 303)
            self.assertEqual(response.headers['location'], '/')
            cookie = response.headers['set-cookie']
            for value in ['HttpOnly', 'Secure', 'SameSite=strict', 'Path=/', f'Max-Age={SESSION_SECONDS}']:
                self.assertIn(value, cookie)
            self.assertNotIn(self.password, cookie)
            self.assertEqual(client.get('/api/backup').status_code, 200)
            self.assertEqual(client.get('/login').headers['location'], '/')
            response = client.post('/logout')
            self.assertEqual(response.headers['location'], '/login')
            self.assertEqual(client.get('/api/backup').status_code, 401)

    def test_wrong_password_never_echoes_and_does_not_set_session(self):
        with self.client() as client:
            response = client.post('/login', data={'password': 'wrong-password-sensitive-text'})
            self.assertEqual(response.status_code, 401)
            self.assertNotIn('wrong-password-sensitive-text', response.text)
            self.assertNotIn('set-cookie', response.headers)
            self.assertEqual(client.get('/api/backup').status_code, 401)

    def test_tampered_expired_and_password_rotated_sessions_are_invalid(self):
        with self.client() as client:
            with patch('access_control.time.time', return_value=100000):
                client.post('/login', data={'password': self.password})
            token = client.cookies.get(COOKIE_NAME)
            with patch('access_control.time.time', return_value=100000 + SESSION_SECONDS):
                self.assertEqual(client.get('/api/backup').status_code, 401)
            client.cookies.clear()
            tampered = token[:-1] + ('0' if token[-1] != '0' else '1')
            with patch('access_control.time.time', return_value=100001):
                self.assertEqual(client.get('/api/backup', headers={'cookie': f'{COOKIE_NAME}={tampered}'}).status_code, 401)
        with self.client(password='changed-private-test-password') as changed:
            with patch('access_control.time.time', return_value=100001):
                self.assertEqual(changed.get('/api/backup', headers={'cookie': f'{COOKIE_NAME}={token}'}).status_code, 401)

    def test_cross_site_login_logout_and_mutations_are_rejected(self):
        with self.client() as client:
            response = client.post('/login', data={'password': self.password}, headers={'origin': 'https://elsewhere.example'})
            self.assertEqual(response.status_code, 403)
            client.post('/login', data={'password': self.password}, headers={'origin': 'https://testserver'})
            self.assertEqual(client.put('/api/settings', headers={'origin': 'null'}).status_code, 403)
            self.assertEqual(client.post('/logout', headers={'sec-fetch-site': 'cross-site'}).status_code, 403)
            self.assertEqual(client.get('/api/backup').status_code, 200)

    def test_repeated_failures_temporarily_block_login_then_expire(self):
        with self.client() as client:
            with patch('access_control.time.monotonic', return_value=1000):
                for _ in range(5):
                    self.assertEqual(client.post('/login', data={'password': 'wrong-password'}).status_code, 401)
                response = client.post('/login', data={'password': self.password})
                self.assertEqual(response.status_code, 429)
                self.assertIn('retry-after', response.headers)
            with patch('access_control.time.monotonic', return_value=1000 + FAILURE_WINDOW_SECONDS + 1):
                self.assertEqual(client.post('/login', data={'password': self.password}).status_code, 303)

    def test_login_payload_is_bounded_and_login_page_does_not_need_static_assets(self):
        with self.client() as client:
            page = client.get('/login')
            self.assertEqual(page.status_code, 200)
            self.assertIn('id="loginForm"', page.text)
            self.assertIn('id="password"', page.text)
            self.assertNotIn('{{ERROR', page.text)
            self.assertEqual(page.headers['cache-control'], 'no-store')
            self.assertEqual(client.post('/login', json={'password': self.password}).status_code, 400)
            self.assertEqual(client.post('/login', content='password=' + 'x' * 9000,
                                         headers={'content-type': 'application/x-www-form-urlencoded'}).status_code, 413)

    def test_unicode_password_and_explicit_local_http_cookie_are_supported(self):
        password = '周策访问密码用于测试和验证安全登录'
        with self.client(password=password, secure='false') as client:
            response = client.post('/login', data={'password': password})
            self.assertEqual(response.status_code, 303)
            self.assertNotIn('Secure', response.headers['set-cookie'])
            self.assertEqual(client.get('/api/backup').status_code, 200)


if __name__ == '__main__':
    unittest.main()
