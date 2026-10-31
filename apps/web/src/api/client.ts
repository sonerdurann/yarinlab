export type ApiUser = { id: string; role: 'STUDENT' | 'TEACHER'; displayName: string; classroomId?: string };

export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    credentials: 'same-origin',
    headers: init.body ? { 'content-type': 'application/json' } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'error');
  return data as T;
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Bilgiler eşleşmedi. Sınıf kodu, takma ad ve parolayı kontrol et.',
  email_taken: 'Bu e-posta zaten kayıtlı.',
  nickname_taken: 'Bu takma ad sınıfta kullanılıyor; başka bir tane seç.',
  class_not_found: 'Bu sınıf kodu bulunamadı.',
  invalid_input: 'Girdileri kontrol et (parola en az 6/8 karakter, takma ad 3-20 karakter).',
  unauthorized: 'Önce giriş yapmalısın.',
  forbidden: 'Bu işlem için yetkin yok.',
  rate_limited: 'Çok fazla deneme yapıldı; biraz sonra tekrar dene.',
};
export const errorText = (e: unknown) =>
  e instanceof ApiError ? MESSAGES[e.code] ?? (e.status === 429 ? MESSAGES.rate_limited : 'Bir sorun oluştu. Lütfen tekrar dene.') : 'Sunucuya ulaşılamadı. Çevrim dışı oynamaya devam edebilirsin.';
