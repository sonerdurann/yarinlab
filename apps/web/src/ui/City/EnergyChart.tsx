import type { EnergyDay } from '@yarinlab/shared';

/** 24 saatlik üretim/talep çubukları (SVG). Ekran okuyucu için özet metin verilir. */
export function EnergyChart({ day }: { day: EnergyDay }) {
  const max = Math.max(1, ...day.hours.map((h) => Math.max(h.demand, h.solar + h.wind)));
  const W = 24 * 14, H = 90;
  return (
    <figure className="energy-chart">
      <svg viewBox={`0 0 ${W} ${H + 14}`} role="img" aria-label={`Üretim ${day.prodKwh} kWh, talep ${day.demandKwh} kWh, şebeke ${day.gridKwh} kWh, kesinti ${day.outageHours} saat`}>
        {day.hours.map((h, i) => {
          const sh = (h.solar / max) * H, wh = (h.wind / max) * H, dh = (h.demand / max) * H;
          return (
            <g key={i} transform={`translate(${i * 14},0)`}>
              <rect x={1} y={H - sh - wh} width={8} height={wh} fill="#4aa8d8" />
              <rect x={1} y={H - sh} width={8} height={sh} fill="#e8b73a" />
              <line x1={0} x2={12} y1={H - dh} y2={H - dh} stroke={h.unmet > 0 ? '#b00020' : '#12263a'} strokeWidth={2} />
              {i % 6 === 0 && <text x={0} y={H + 12} fontSize={9} fill="#12263a">{String(i).padStart(2, '0')}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="hint">
        <span className="sw sun" /> güneş <span className="sw wind" /> rüzgâr — çizgi: talep (kırmızı: karşılanamadı). Üretim {day.prodKwh} kWh · talep {day.demandKwh} kWh ·
        yenilenebilir pay %{day.renewableSharePct} · şebeke {day.gridKwh} kWh · kesinti {day.outageHours} sa. <em>Simülasyon</em>
      </figcaption>
    </figure>
  );
}
