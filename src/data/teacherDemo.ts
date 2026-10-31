/** DEMO VERİSİ: gerçek öğrenci değildir. Anonim kodlar; kişisel veri yok (kılavuz §12, §24). */
export type DemoStudent = {
  code: string;
  completed: boolean;
  choiceId: 'A' | 'B' | 'C' | null;
  /** Denenen farklı seçenek sayısı */
  attempts: number;
  reasoningKind: 'option' | 'text' | null;
  reasoning: string | null;
  /** Öğretmen rubriği 0-3 */
  rationaleScore: number | null;
  /** Ham puan /5; ön ve son test AYRI soru setleridir */
  pre: number;
  post: number | null;
};

export const DEMO_LABEL = 'DEMO VERİSİ';

const choices = ['B', 'B', 'A', 'C', 'B', 'C', 'B', 'A', 'B', 'C', 'B', 'A', 'B', 'C', 'B', 'A', 'B', 'C', 'B'] as const;
const optionReasons = [
  'Öğrencilerin memnuniyetini korumak istedim.',
  'Atığı en çok azaltan seçeneği seçtim.',
  'Bütçeyi dengede tutmak istedim.',
];
const textReasons = [
  'Herkes aynı miktarda yemek istemez, o yüzden esnek yaptım.',
  'Tahmin yanlış olursa aç kalan olur diye dikkat ettim.',
  'Hem atık azalsın hem de para çok gitmesin istedim.',
];

/** Deterministik: 24 katılımcı, 19 tamamlayan (kılavuz Ekran 04 örneği). */
export const DEMO_STUDENTS: DemoStudent[] = Array.from({ length: 24 }, (_, i) => {
  const completed = i < 19;
  const pre = 1 + (i % 3);
  const kind = completed ? (i % 2 === 0 ? 'option' : 'text') : null;
  return {
    code: `Ö-${String(i + 1).padStart(2, '0')}`,
    completed,
    choiceId: completed ? choices[i] : null,
    attempts: completed ? (i % 3 === 0 ? 1 : 2) : 1,
    reasoningKind: kind,
    reasoning: kind === 'option' ? optionReasons[i % 3] : kind === 'text' ? textReasons[i % 3] : null,
    rationaleScore: completed ? 1 + (i % 3) : null,
    pre,
    post: completed ? Math.min(5, pre + (i % 4 === 0 ? 0 : 1 + (i % 2))) : null,
  };
});
