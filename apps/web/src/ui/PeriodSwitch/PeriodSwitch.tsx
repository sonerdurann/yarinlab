import { gameStore, useGameState, type GameState, type Period } from '../../state/gameStore';

export const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'future-none', label: '2040 · Kararsız' },
  { id: 'future-mine', label: '2040 · Kararlarınla' },
];

/** Dönem görünümü için tek satırlık açıklama; sayılar yalnızca motor sonucundan gelir. */
export function periodCaption(s: Pick<GameState, 'period' | 'history'>): string {
  if (s.period === 'today') return 'Bugünkü okul. Kararlarını verince 2040 görünümlerine bak.';
  if (s.period === 'future-none') return 'Hiç karar verilmezse (temsili): israf yüksek seyreder, bütçe erir, memnuniyet düşer.';
  const last = s.history[s.history.length - 1];
  return last
    ? `Senin kararınla (${last.choiceId}): gıda atığı ${last.after.foodWasteKg} kg/gün, memnuniyet ${last.after.wellbeing}.`
    : 'Önce Kantin görevinde bir karar ver; sonra 2040 geleceğin burada görünür.';
}

/** Haritanın üstüne binen renk katmanı: tıklamayı engellemez; yalnızca görsel yorumdur. */
export function PeriodTint() {
  const { period } = useGameState();
  return <div className={`period-tint ${period}`} aria-hidden="true" />;
}

/** Üst çubuktaki "dönem" seçimi (kılavuz §09) ve haritanın iki renk varyasyonu (§04). */
export function PeriodSwitch() {
  const s = useGameState();
  return (
    <div className="period" role="group" aria-label="Dönem">
      <div className="period-btns">
        {PERIODS.map((p) => (
          <button key={p.id} aria-pressed={s.period === p.id} className={s.period === p.id ? 'on' : ''} onClick={() => gameStore.setPeriod(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <p className="period-caption" role="status">
        {periodCaption(s)}
        {s.period !== 'today' && <small>Görsel yorumdur; ölçüm değildir.</small>}
      </p>
    </div>
  );
}
