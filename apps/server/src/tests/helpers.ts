import { buildApp } from '../app.js';

export type App = Awaited<ReturnType<typeof buildApp>>;
export const cookieOf = (res: { cookies: { name: string; value: string }[] }) => (res.cookies[0] ? `${res.cookies[0].name}=${res.cookies[0].value}` : '');
export const tag = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export function client(app: App) {
  const req = (method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', url: string, payload?: unknown, cookie?: string) =>
    app.inject({ method, url, payload: payload as never, headers: cookie ? { cookie } : {} });
  return {
    get: (url: string, cookie?: string) => req('GET', url, undefined, cookie),
    post: (url: string, payload: unknown, cookie?: string) => req('POST', url, payload, cookie),
    put: (url: string, payload: unknown, cookie?: string) => req('PUT', url, payload, cookie),
    patch: (url: string, payload: unknown, cookie?: string) => req('PATCH', url, payload, cookie),
    del: (url: string, cookie?: string) => req('DELETE', url, undefined, cookie),
    async teacher(t: string, n = 'a') {
      const r = await req('POST', '/api/auth/teacher/register', { email: `${n}-${t}@okul.test`, password: 'sifre1234', displayName: `Öğretmen ${n}` });
      return cookieOf(r);
    },
    async classroom(cookie: string, name = '7-A') {
      const r = await req('POST', '/api/classrooms', { name }, cookie);
      return r.json().classroom as { id: string; joinCode: string };
    },
    async student(code: string, nickname: string) {
      const r = await req('POST', '/api/auth/student/register', { classCode: code, nickname, password: 'abc123' });
      return { cookie: cookieOf(r), id: r.json().user.id as string };
    },
  };
}
