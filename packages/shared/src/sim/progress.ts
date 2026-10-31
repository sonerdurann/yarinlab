/** Puanlama, seviye, rozet ve okuryazarlık: yalnızca sonuca değil gerekçeye ve dengeye de bakar. */
export type RowSpec = { key: string; lowerIsBetter?: boolean };
export type AttemptScore = { outcome: number; reasoning: number; balance: number; total: number; feedback: string[] };

const CAUSAL = /(çünkü|bu yüzden|bu nedenle|nedeniyle|için|sayesinde|sonucunda|eğer|ama|ancak)/i;
const EVIDENCE = /(veri|ölç|kanıt|kaynak|risk|bütçe|denge|uzun vade|maliyet|kapasite|depola|atık|su|enerji|refah|ihtiyaç)/gi;

export function scoreReasoning(text: string | undefined): number {
  const t = (text ?? '').trim();
  if (!t) return 0;
  let s = t.length >= 15 ? 40 : 20;
  if (CAUSAL.test(t)) s += 25;
  const hits = new Set((t.toLocaleLowerCase('tr').match(EVIDENCE) ?? []).map((x) => x.toLocaleLowerCase('tr')));
  s += Math.min(35, hits.size * 12);
  return Math.min(100, s);
}

export function scoreAttempt(before: Record<string, number>, after: Record<string, number>, rows: RowSpec[], reasoning?: string): AttemptScore {
  const feedback: string[] = [];
  let sum = 0, worse = 0;
  for (const r of rows) {
    const b = before[r.key] ?? 0, a = after[r.key] ?? 0;
    const rel = b !== 0 ? (a - b) / Math.abs(b) : a - b;
    const signed = r.lowerIsBetter ? -rel : rel;
    sum += Math.max(-0.5, Math.min(0.5, signed));
    if (signed < -0.1) worse++;
  }
  const outcome = Math.round(Math.max(0, Math.min(100, 50 + (sum / Math.max(1, rows.length)) * 200)));
  const balance = Math.max(0, 100 - worse * 30);
  const reasoningScore = scoreReasoning(reasoning);
  if (!reasoning) feedback.push('Kararını bir cümleyle gerekçelendirirsen puanın artar.');
  if (worse > 0) feedback.push(`${worse} göstergede belirgin düşüş var: denge için ödünleşimi düşün.`);
  if (outcome >= 60 && balance >= 70) feedback.push('Göstergeleri dengeli biçimde iyileştirdin.');
  const total = Math.round(outcome * 0.4 + reasoningScore * 0.35 + balance * 0.25);
  return { outcome, reasoning: reasoningScore, balance, total, feedback };
}

export const xpForScore = (total: number, triedAlternative: boolean) => 10 + Math.round(total / 5) + (triedAlternative ? 5 : 0);
export const levelForXp = (xp: number) => Math.min(20, 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 40)));
export const xpForLevel = (level: number) => 40 * (level - 1) ** 2;

export type ProgressFacts = {
  decisions: number;
  reasonedDecisions: number;
  completedTasks: number;
  modulesPlayed: number;
  comparedTasks: number;
  buildings: number;
  maxBuildingLevel: number;
  days: number;
  greenEnergyDays: number;
  councilDone: boolean;
  realWorldMeasurements: number;
  assessmentsPost: number;
};

export type BadgeDef = { key: string; name: string; description: string; earned: (f: ProgressFacts) => boolean };
/** Rozetler baskısızdır: süre baskısı, sıralama ya da ücretli ödül yoktur. */
export const BADGES: BadgeDef[] = [
  { key: 'first-decision', name: 'İlk Adım', description: 'İlk kararını verdin.', earned: (f) => f.decisions >= 1 },
  { key: 'reasoner', name: 'Gerekçe Ustası', description: '5 kararı gerekçelendirdin.', earned: (f) => f.reasonedDecisions >= 5 },
  { key: 'two-futures', name: 'İki Gelecek', description: '3 görevde farklı kararları karşılaştırdın.', earned: (f) => f.comparedTasks >= 3 },
  { key: 'explorer', name: 'Kâşif', description: 'Yedi modülün hepsini denedin.', earned: (f) => f.modulesPlayed >= 7 },
  { key: 'builder', name: 'Yapıcı', description: '3 yapı kurdun.', earned: (f) => f.buildings >= 3 },
  { key: 'upgrader', name: 'Geliştirici', description: 'Bir yapıyı 3. seviyeye çıkardın.', earned: (f) => f.maxBuildingLevel >= 3 },
  { key: 'clean-grid', name: 'Temiz Şebeke', description: 'Kesintisiz ve en az %50 yenilenebilir bir gün yaşadın.', earned: (f) => f.greenEnergyDays >= 1 },
  { key: 'seasons', name: 'Dört Mevsim', description: 'Bir oyun yılını tamamladın.', earned: (f) => f.days >= 32 },
  { key: 'halfway', name: 'Yarı Yol', description: '18 görev tamamladın.', earned: (f) => f.completedTasks >= 18 },
  { key: 'council', name: 'Gelecek Meclisi', description: 'Şehrin gelecek planını oyladın.', earned: (f) => f.councilDone },
  { key: 'field', name: 'Saha Araştırmacısı', description: 'Gerçek dünyada bir ölçüm kaydettin.', earned: (f) => f.realWorldMeasurements >= 1 },
  { key: 'reflect', name: 'Öğrendiğini Ölç', description: 'Bir son değerlendirmeyi tamamladın.', earned: (f) => f.assessmentsPost >= 1 },
];
export const earnedBadges = (f: ProgressFacts) => BADGES.filter((b) => b.earned(f)).map((b) => b.key);

/** İklim okuryazarlığı göstergesi (0-100): görev çeşitliliği, gerekçe kalitesi ve karşılaştırma. Oyun göstergesidir. */
export function literacyIndex(f: ProgressFacts, avgReasoning: number): number {
  return Math.max(0, Math.min(100, Math.round(f.completedTasks * 1.5 + f.modulesPlayed * 3 + f.comparedTasks * 2 + avgReasoning * 0.25)));
}
