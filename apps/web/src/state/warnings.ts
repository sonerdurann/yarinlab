import type { CityIndicators } from '@yarinlab/shared';

/** Gösterge eşiğine göre bölge uyarısı (prompt §3 "uyarı balonu"; harita, bilgi kartı ve bildirim merkezi ortak kullanır). */
export function zoneWarningsOf(ind: CityIndicators): Record<string, string | undefined> {
  return {
    energy: ind.energy.outageHours > 0 ? `Enerji kesintisi: ${ind.energy.outageHours} saat` : undefined,
    city: ind.floodRisk >= 50 ? `Sel riski yüksek (${ind.floodRisk}/100)` : undefined,
    waste: ind.wasteKg > 45 ? `Çöp yükü yüksek: ${Math.round(ind.wasteKg)} kg/gün (${ind.collectionNeed} sefer)` : undefined,
    ocean: ind.coastalRisk >= 45 ? `Kıyı riski yüksek (${ind.coastalRisk}/100)` : undefined,
    school: ind.heatRisk >= 55 ? `Sıcak hava riski (${ind.heatRisk}/100)` : undefined,
  };
}
