import type { Choice, Resources, Scenario } from '../../state/types';
import food001 from './food_001.json';
import energy001 from './energy_001.json';
import waste001 from './waste_001.json';
import city001 from './city_001.json';
import carbon001 from './carbon_001.json';
import ocean001 from './ocean_001.json';
import council001 from './council_001.json';

export type Fact = { label: string; value: string };
export type ResultRow = { key: keyof Resources; label: string; unit: string; max: number; lowerIsBetter?: boolean };
export type ChoiceSystem = {
  renewableShare?: number;
  storageUnits?: number;
  otherWasteKg?: number;
  sortingRecovery?: number;
  sealedShare?: number;
  greenShare?: number;
  rainShare?: number;
  claimScore?: number;
  habitatCare?: number;
  evidenceBias?: number;
  solarKw?: number;
  windKw?: number;
  storageKwh?: number;
  efficiency?: number;
  shade?: number;
  transitShare?: number;
};
export type PlayableChoice = Choice & { summary: string; system?: ChoiceSystem };

export type PlayableScenario = Omit<Scenario, 'choices'> & {
  title: string;
  shortTitle: string;
  brief: string;
  facts: Fact[];
  rows: ResultRow[];
  cross: 'food-waste' | 'energy-storage' | 'waste-loop' | 'city-flood' | 'carbon-claim' | 'ocean-habitat' | 'council-evidence';
  choices: PlayableChoice[];
  noDecision: PlayableChoice;
  realWorldAction: { title: string; action: string; measurementPlan: string[] };
  disclaimer: string;
  reasoningOptions: string[];
  transferQuestion: string;
};

const FOOD_ROWS: ResultRow[] = [
  { key: 'foodWasteKg', label: 'Gıda atığı', unit: 'kg/gün', max: 40, lowerIsBetter: true },
  { key: 'budget', label: 'Bütçe', unit: 'puan', max: 13000 },
  { key: 'wellbeing', label: 'Memnuniyet', unit: '/100', max: 100 },
];
const ENERGY_ROWS: ResultRow[] = [
  { key: 'energyScore', label: 'Enerji', unit: '/100', max: 100 },
  { key: 'budget', label: 'Bütçe', unit: 'puan', max: 13000 },
  { key: 'wellbeing', label: 'Memnuniyet', unit: '/100', max: 100 },
];
const WASTE_ROWS: ResultRow[] = [
  { key: 'budget', label: 'Bütçe', unit: 'puan', max: 13000 },
  { key: 'wellbeing', label: 'Memnuniyet', unit: '/100', max: 100 },
  { key: 'waterScore', label: 'Su', unit: '/100', max: 100 },
];
const CITY_ROWS: ResultRow[] = [
  { key: 'waterScore', label: 'Su', unit: '/100', max: 100 },
  { key: 'budget', label: 'Bütçe', unit: 'puan', max: 13000 },
  { key: 'wellbeing', label: 'Memnuniyet', unit: '/100', max: 100 },
];
const CARBON_ROWS: ResultRow[] = [
  { key: 'wellbeing', label: 'Memnuniyet', unit: '/100', max: 100 },
  { key: 'budget', label: 'Bütçe', unit: 'puan', max: 13000 },
  { key: 'waterScore', label: 'Su', unit: '/100', max: 100 },
];
const OCEAN_ROWS: ResultRow[] = CARBON_ROWS;
const COUNCIL_ROWS: ResultRow[] = CARBON_ROWS;

const foodJson = food001 as Omit<PlayableScenario, 'shortTitle' | 'facts' | 'rows' | 'cross'> & {
  context: { students: number; mealDemand: number; budgetLabel: string };
};

export const food: PlayableScenario = {
  ...foodJson,
  shortTitle: 'Kantin',
  cross: 'food-waste',
  rows: FOOD_ROWS,
  facts: [
    { label: 'Öğrenci', value: String(foodJson.context.students) },
    { label: 'Öğün talebi', value: String(foodJson.context.mealDemand) },
    { label: 'Örnek atık', value: `${foodJson.baseline.foodWasteKg} kg/gün` },
    { label: 'Bütçe', value: foodJson.context.budgetLabel },
    { label: 'Hedef', value: 'denge kurmak' },
  ],
};

export const energy: PlayableScenario = {
  ...(energy001 as Omit<PlayableScenario, 'shortTitle' | 'facts' | 'rows' | 'cross'>),
  shortTitle: 'Enerji',
  cross: 'energy-storage',
  rows: ENERGY_ROWS,
  facts: [
    { label: 'Yenilenebilir pay', value: '20 (oyun göstergesi)' },
    { label: 'Depolama', value: '0 birim' },
    { label: 'Enerji', value: '76/100' },
    { label: 'Bütçe', value: '12.000 puan' },
    { label: 'Hedef', value: 'riski de düşün' },
  ],
};

export const waste: PlayableScenario = {
  ...(waste001 as Omit<PlayableScenario, 'shortTitle' | 'facts' | 'rows' | 'cross'>),
  shortTitle: 'Atık',
  cross: 'waste-loop',
  rows: WASTE_ROWS,
  facts: [
    { label: 'Diğer okul atığı', value: '20 kg/gün (varsayım)' },
    { label: 'Gıda atığı', value: 'kantin kararına bağlı' },
    { label: 'Sefer kapasitesi', value: '10 kg (varsayım)' },
    { label: 'Hedef', value: 'yükü akıllıca azalt' },
  ],
};

export const city: PlayableScenario = {
  ...(city001 as Omit<PlayableScenario, 'shortTitle' | 'facts' | 'rows' | 'cross'>),
  shortTitle: 'Şehir',
  cross: 'city-flood',
  rows: CITY_ROWS,
  facts: [
    { label: 'Sızdırmaz yüzey', value: '40 (oyun göstergesi)' },
    { label: 'Yeşil pay', value: '20' },
    { label: 'Yağmur payı', value: '0' },
    { label: 'Hedef', value: 'riski de oku' },
  ],
};

export const carbon: PlayableScenario = {
  ...(carbon001 as Omit<PlayableScenario, 'shortTitle' | 'facts' | 'rows' | 'cross'>),
  shortTitle: 'Karbon',
  cross: 'carbon-claim',
  rows: CARBON_ROWS,
  facts: [
    { label: 'İnceleme puanı', value: '40 (oyun göstergesi)' },
    { label: 'Kanıt', value: 'ürün yazısı tek başına yetmez' },
    { label: 'Sera gazı', value: 'hesaplanmaz' },
    { label: 'Hedef', value: 'iddiayı kontrol et' },
  ],
};

export const ocean: PlayableScenario = {
  ...(ocean001 as Omit<PlayableScenario, 'shortTitle' | 'facts' | 'rows' | 'cross'>),
  shortTitle: 'Kıyı',
  cross: 'ocean-habitat',
  rows: OCEAN_ROWS,
  facts: [
    { label: 'Habitat bakımı', value: '10 (oyun göstergesi)' },
    { label: 'Atık yükü', value: 'kantin ve atık kararına bağlı' },
    { label: 'Hedef', value: 'kıyı riskini düşür' },
  ],
};

export const council: PlayableScenario = {
  ...(council001 as Omit<PlayableScenario, 'shortTitle' | 'facts' | 'rows' | 'cross'>),
  shortTitle: 'Meclis',
  cross: 'council-evidence',
  rows: COUNCIL_ROWS,
  facts: [
    { label: 'Seçim eğilimi', value: '0 (nötr)' },
    { label: 'Taban', value: 'oynanan modül, iki kantin seçeneği, gerekçe' },
    { label: 'Hedef', value: 'tek göstergeye kilitlenme' },
  ],
};

export const playableOrder = [food, energy, waste, city, carbon, ocean, council];

export const playableScenarios: Record<string, PlayableScenario> = {
  food_001: food,
  energy_001: energy,
  waste_001: waste,
  city_001: city,
  carbon_001: carbon,
  ocean_001: ocean,
  council_001: council,
};

export function playableById(id: string): PlayableScenario {
  return playableScenarios[id] ?? food;
}

export const scenarios: Record<string, Scenario> = playableScenarios;
