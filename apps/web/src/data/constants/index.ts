export const MODEL_VERSION = 'rules-0.1';
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const SCORE_KEYS = ['energyScore', 'waterScore', 'wellbeing'] as const;

// Simülasyon varsayımı; gerçek veri değildir (kılavuz §19).
export const ASSUMED_COLLECTION_CAPACITY_KG = 10;
export const OTHER_SCHOOL_WASTE_KG = 20;

export const SIMULATION_NOTICE = 'Simülasyon – gerçek saha sonucu değildir';

/** Ekranda gösterilen kural notları; ölçülmüş şebeke veya ayrıştırma verisi değildir. */
export const ENERGY_RISK_NOTE =
  'Kesinti riski simülasyon varsayımıdır: depolama olmadan yenilenebilir pay artınca risk yükselir. Gerçek şebeke ölçümü değildir.';
export const WASTE_RULE_NOTE =
  'Diğer okul atığı, ayırma geri kazanımı ve sefer kapasitesi simülasyon varsayımıdır; tartılmış saha verisi değildir.';
export const CITY_FLOOD_NOTE =
  'Taşkın riski simülasyon varsayımıdır: sızdırmaz yüzey artınca yükselir; yeşil alan ve yağmur payı artınca düşer. Ölçülmüş sel modeli değildir.';
export const CARBON_NOTE =
  'İddia inceleme puanı oyun göstergesidir. Ürünün sera gazı miktarı hesaplanmaz; kg CO₂e iddiası yoktur.';
export const OCEAN_NOTE =
  'Kıyı riski simülasyon varsayımıdır: atık yükü artınca yükselir, habitat bakımı artınca düşer. Saha sayımı değildir.';
export const COUNCIL_NOTE =
  'Meclis puanı oyun göstergesidir: oynanan modüller, iki kantin seçeneği ve gerekçe tabanı artırır. Sera gazı miktarı değildir.';
