// Cloudflare Pages Function TASLAĞI (P1). Model anahtarı yalnızca sunucuda, Pages "secret" olarak tanımlanır
// (env.MODEL_API_KEY); istemci paketine, repoya veya public dosyalara asla konmaz [R12].
// Şu an model çağrısı YOK: anahtar tanımlı değilse 503 döner ve istemci hazır geri bildirime düşer.
//
// P1'de eklenecekler: model sağlayıcı seçimi, istem şablonu (ROLE/INPUT/RULES, kılavuz §18) sunucuda,
// JSON şema doğrulaması, rate limit, bütçe kotası, max token, önbellek.

interface Env {
  MODEL_API_KEY?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const b = body as { scenarioId?: unknown; choiceId?: unknown };
  if (typeof b?.scenarioId !== 'string' || typeof b?.choiceId !== 'string') return json({ error: 'invalid_input' }, 400);
  if (!env.MODEL_API_KEY) return json({ error: 'ai_not_configured' }, 503);
  return json({ error: 'not_implemented' }, 501);
};
