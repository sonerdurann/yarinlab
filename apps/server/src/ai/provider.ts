import Anthropic from '@anthropic-ai/sdk';

/**
 * Sağlayıcıdan bağımsız dil modeli arayüzü. Hesaplama motoru ile dil modeli ayrıdır: model yalnızca metin üretir,
 * sayısal iklim sonuçlarını değiştiremez (çıktı ortak doğrulayıcıdan geçer).
 */
export type LlmRequest = { system: string; user: string; schema: Record<string, unknown>; maxTokens: number; signal?: AbortSignal };
export type LlmResult = { text: string; inputTokens: number; outputTokens: number };
export interface LlmProvider {
  readonly name: string;
  complete(req: LlmRequest): Promise<LlmResult>;
}

export class ProviderUnavailable extends Error {}
export class ProviderRefused extends Error {}

/** Anahtar yokken: her çağrı “kullanılamaz” döner; servis doğrulanmış yedeğe düşer. */
export class NullProvider implements LlmProvider {
  readonly name = 'none';
  async complete(): Promise<LlmResult> {
    throw new ProviderUnavailable('ai_not_configured');
  }
}

/** Testler ve yerel prova için: verilen fonksiyonla yanıt üretir. */
export class MockProvider implements LlmProvider {
  readonly name = 'mock';
  calls: LlmRequest[] = [];
  constructor(private reply: (req: LlmRequest) => string | Promise<string>) {}
  async complete(req: LlmRequest): Promise<LlmResult> {
    this.calls.push(req);
    if (req.signal?.aborted) throw new ProviderUnavailable('aborted');
    return { text: await this.reply(req), inputTokens: Math.ceil(req.user.length / 4), outputTokens: 120 };
  }
}

const FALLBACK_MODELS = /^claude-(opus-5|fable-5-1|sonnet-5-5)/;

/**
 * Anthropic Messages API adaptörü (resmî SDK). Yapılandırılmış JSON çıktısı (`output_config.format`) ile şemaya uyan
 * yanıt istenir; ret (`stop_reason: refusal`) durumunda sunucu taraflı yedek model devreye girer, yine de ret olursa
 * servis doğrulanmış çevrim dışı geri bildirime düşer. Anahtar yalnızca sunucu ortam değişkenindedir.
 */
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  constructor(apiKey: string, private model: string) {
    this.client = new Anthropic({ apiKey, maxRetries: 1, timeout: 15_000 });
  }
  async complete(req: LlmRequest): Promise<LlmResult> {
    const useFallback = FALLBACK_MODELS.test(this.model);
    const res = await this.client.beta.messages.create(
      {
        model: this.model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
        output_config: { effort: 'low', format: { type: 'json_schema', schema: req.schema } },
        ...(useFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      },
      { signal: req.signal },
    );
    if (res.stop_reason === 'refusal') throw new ProviderRefused(res.stop_details?.category ?? 'refusal');
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    return { text, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens };
  }
}

/** Ortamdan sağlayıcı seçimi: AI_PROVIDER=anthropic ve ANTHROPIC_API_KEY (veya AI_API_KEY) varsa canlı model. */
export function providerFromEnv(env = process.env): LlmProvider {
  const key = env.ANTHROPIC_API_KEY || env.AI_API_KEY;
  if (env.AI_PROVIDER === 'anthropic' && key) return new AnthropicProvider(key, env.AI_MODEL || 'claude-opus-5-5');
  return new NullProvider();
}
