export const MODEL_VERSION = 'rules-0.1';
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const SCORE_KEYS = ['energyScore', 'waterScore', 'wellbeing'] as const;

// Simülasyon varsayımı; gerçek veri değildir (kılavuz §19).
export const ASSUMED_COLLECTION_CAPACITY_KG = 25;
export const OTHER_SCHOOL_WASTE_KG = 40;

export const SIMULATION_NOTICE = 'Simülasyon – gerçek saha sonucu değildir';
