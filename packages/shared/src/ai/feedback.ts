import { taskById, type ModuleId, type Resources5, type TaskDef } from '../content';

/** Yapay zekâ öğretmeni çıktı sözleşmesi (kılavuz §18). Sayılar yalnızca motor sonucundan gelir. */
export type TutorResponse = { summary: string; tradeoff: string; question1: string; question2: string; sourceIds: string[] };
export type FeedbackContext = { scenarioId: string; choiceId: string; before: Resources5; after: Resources5; reasoning?: string };

const LABEL: Record<keyof Resources5, string> = {
  budget: 'bütçe', foodWasteKg: 'gıda atığı (kg/gün)', energyScore: 'enerji', waterScore: 'su', wellbeing: 'refah',
};
const fmt = (n: number) => n.toLocaleString('tr-TR');

/** Modül bazlı sokratik soru bankası: doğrudan cevap vermez, düşündürür. */
const QUESTIONS: Record<ModuleId, [string, string][]> = {
  energy: [['Bu karar gece ve bulutlu günlerde nasıl çalışır?', 'Talebi azaltmak ile üretimi artırmak arasındaki farkı nasıl açıklarsın?'],
    ['Kesinti olursa en çok kim etkilenir?', 'Bu kararın maliyeti uzun vadede nasıl değişir?'],
    ['Hangi veri bu kararın işe yaradığını gösterirdi?', 'Başka bir kaynakla birleştirsen ne değişirdi?']],
  carbon: [['Bu bilgiyi kim, hangi yöntemle ölçtü?', 'Yaşam döngüsünün hangi aşaması gözden kaçmış olabilir?'],
    ['Bu ürünü hiç almamak mümkün müydü?', 'İddiayı doğrulamak için hangi kaynağa bakardın?'],
    ['Bir arkadaşın aynı iddiaya inansa ona hangi soruyu sorardın?', 'Kanıt ile reklam arasındaki fark nedir?']],
  city: [['Bu önlem hangi mahalleleri daha çok korur?', 'Uzun vadede bakım ve maliyet ne olur?'],
    ['Sel, sıcak ve kuraklıktan hangisine karşı en zayıf kaldı şehir?', 'Doğa temelli bir çözüm burada ne katardı?'],
    ['Bu kararı en kırılgan gruptan biri nasıl değerlendirirdi?', 'Hangi veri riskin gerçekten azaldığını gösterirdi?']],
  food: [['Bu karar öğrencilerin ihtiyacını nasıl etkiler?', 'İsraf ile kayıp arasındaki farkı burada nasıl görüyorsun?'],
    ['Su ve enerji de hesaba girince sonuç değişir mi?', 'Okulda bunu hangi ölçümle doğrulardın?'],
    ['Tahmin yanlış çıkarsa kim etkilenir?', 'Önleme ile sonradan değerlendirme arasındaki fark nedir?']],
  ocean: [['Atığın kaynağı nerede olabilir?', 'Bu önlemin etkisi ne kadar sürede görülür?'],
    ['Deniz canlılarına hangi baskı en çok azaldı?', 'Balıkçılar ve doğa için denge nasıl kurulur?'],
    ['İyileşmeyi hangi göstergeyle izlerdin?', 'Isınmayı durduramadığımız hâlde neyi değiştirebiliriz?']],
  waste: [['Bu karar atık hiyerarşisinin hangi basamağında?', 'Atık hiç oluşmasaydı ne değişirdi?'],
    ['Ayrıştırma neden bazen işe yaramaz?', 'Bu kararın bütçeye uzun vadeli etkisi ne olur?'],
    ['Onarma veya paylaşma burada mümkün müydü?', 'Okulda bunu nasıl sayar ya da tartardın?']],
  council: [['Hangi grubun sesi daha az duyuldu?', 'Kararını hangi modüldeki kanıtla savunursun?'],
    ['Kısa vadeli kazanç ile uzun vadeli etkiyi nasıl karşılaştırdın?', 'Tek bir göstergeye bakmak neyi gizleyebilir?'],
    ['Karşı görüşteki biri sana hangi soruyu sorardı?', 'Bu plan gelecekte kimin hayatını nasıl değiştirir?']],
};

/** Doğrulanmış, kural tabanlı geri bildirim: model servisi yokken veya yanıt reddedilince kullanılır. */
export function fallbackFeedback(ctx: FeedbackContext, taskOverride?: TaskDef): TutorResponse {
  const t = taskOverride ?? taskById(ctx.scenarioId);
  if (!t) return { summary: 'Kararın kaydedildi.', tradeoff: 'Her kararın bir ödünleşimi vardır.', question1: 'Başka bir seçenek ne değiştirirdi?', question2: 'Bunu nasıl ölçerdin?', sourceIds: [] };
  const choice = ctx.choiceId === 'N' ? t.noDecision : t.choices.find((c) => c.id === ctx.choiceId);
  const keys = (Object.keys(LABEL) as (keyof Resources5)[]).filter((k) => ctx.after[k] !== ctx.before[k]);
  const changes = keys.map((k) => `${LABEL[k]} ${fmt(ctx.before[k])} → ${fmt(ctx.after[k])}`).join(', ');
  const idx = Math.max(0, t.choices.findIndex((c) => c.id === ctx.choiceId)) % 3;
  let [q1, q2] = QUESTIONS[t.module][idx];
  if (choice?.misconception) q1 = 'Bu seçimin dayandığı fikir her durumda doğru mu, hangi durumda işe yaramayabilir?';
  if (!ctx.reasoning) q2 = 'Bu kararı neden verdiğini bir cümleyle açıklayabilir misin?';
  return {
    summary: `“${choice?.label ?? ctx.choiceId}” kararını verdin. Simülasyonda ${changes || 'göstergeler değişmedi'}.`,
    tradeoff: (choice?.tradeoff ?? '').replace(/\d/g, '').trim() || 'Her kararın bir ödünleşimi vardır.',
    question1: q1,
    question2: q2,
    sourceIds: t.evidenceRefs.slice(0, 3),
  };
}

export function allowedNumbers(ctx: Pick<FeedbackContext, 'before' | 'after'>): Set<number> {
  const out = new Set<number>();
  for (const k of Object.keys(ctx.before) as (keyof Resources5)[]) {
    out.add(ctx.before[k]); out.add(ctx.after[k]); out.add(Math.abs(ctx.after[k] - ctx.before[k]));
  }
  return out;
}
const numbersIn = (text: string) => (text.match(/\d[\d.]*/g) ?? []).map((m) => Number(m.replace(/\./g, '')));

/** Çocuklara uygunluk: şiddet, korku dili, kişisel veri istemi, bağlantı ve iletişim bilgisi yasak. */
const UNSAFE = /(öl(dür|üm)|intihar|silah|nefret|aptal|salak|felaket\s+kaçınılmaz|herkes\s+ölecek|adresini|telefon(un|unu)|şifre|https?:\/\/|www\.|@\w)/i;
/** Uydurma sayısal karbon iddiası yasak (ör. “12 kg CO2”). Kavram olarak “emisyon” sözcüğü serbesttir. */
const CARBON_QUANT = /\d[\d.,]*\s*(kg|ton|g|gram)?\s*(co2|co₂|co2e|co₂e)|\bkgco/i;

/**
 * Model yanıtını doğrular: şema, uzunluk, en çok 2 soru, kaynaklar görevin kanıtlarından, sayılar yalnızca motor
 * sonucundan, sayısal karbon iddiası ve çocuklara uygun olmayan içerik yok. Geçmezse yedek kullanılır.
 */
export function validateTutorResponse(x: unknown, ctx: FeedbackContext, evidenceRefs?: string[]): x is TutorResponse {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const fields = ['summary', 'tradeoff', 'question1', 'question2'] as const;
  for (const k of fields) if (typeof o[k] !== 'string' || !(o[k] as string).trim() || (o[k] as string).length > 400) return false;
  const evidence = evidenceRefs ?? taskById(ctx.scenarioId)?.evidenceRefs ?? [];
  if (!Array.isArray(o.sourceIds) || o.sourceIds.length > 5 || !o.sourceIds.every((s) => typeof s === 'string' && evidence.includes(s))) return false;
  const joined = fields.map((k) => o[k] as string).join(' ');
  if (CARBON_QUANT.test(joined) || UNSAFE.test(joined)) return false;
  const allowed = allowedNumbers(ctx);
  if (!numbersIn(joined).every((n) => allowed.has(n))) return false;
  if (((o.question1 as string) + (o.question2 as string)).split('?').length - 1 > 2) return false;
  return true;
}
