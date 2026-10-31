import { useEffect, useRef, useState } from 'react';

import { isReducedMotion as reduced } from '../state/settingsStore';

/** Değer değişince sayıyı kısa sürede ilerletir (kaynak sayaçları); hareket azaltma açıksa anında. */
export function useCountUp(target: number, ms = 700): number {
  const [v, setV] = useState(target);
  const shown = useRef(target);
  useEffect(() => {
    if (reduced() || shown.current === target) {
      shown.current = target;
      setV(target);
      return;
    }
    const from = shown.current, start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      shown.current = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      setV(shown.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // arka planda rAF durursa son değere zorla
    const done = setTimeout(() => {
      shown.current = target;
      setV(target);
    }, ms + 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [target, ms]);
  return v;
}
