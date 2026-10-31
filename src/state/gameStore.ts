import { useSyncExternalStore } from 'react';
import { hotspotById } from '../game/tiles/hotspots';
import { food, playableById } from '../data/scenarios';
import { runDecision } from '../game/systems/DecisionEngine';
import {
  ENERGY_BASELINE,
  WASTE_BASELINE,
  CITY_BASELINE,
  CARBON_BASELINE,
  OCEAN_BASELINE,
  COUNCIL_BASELINE,
  energyFromChoice,
  wasteFromChoice,
  cityFromChoice,
  carbonFromChoice,
  oceanFromChoice,
  councilFromChoice,
  type EnergySystem,
  type WasteSystem,
  type CitySystem,
  type CarbonSystem,
  type OceanSystem,
  type CouncilSystem,
} from '../game/systems/ClimateEngine';
import type { PlayableScenario } from '../data/scenarios';
import type { DecisionResult, Resources } from './types';
import { getTutorFeedback, type TutorOutcome } from '../ai/tutorClient';
import { composeWorld } from './composeWorld';

export type Period = 'today' | 'future-none' | 'future-mine';

const SESSION_KEY = 'yarinlab.session.v1';
const HOTSPOT_SCENARIO: Record<string, string> = {
  canteen: food.id,
  energy: 'energy_001',
  waste: 'waste_001',
  city: 'city_001',
  farm: 'carbon_001',
  ocean: 'ocean_001',
};

/** Anonim oturum kimliği: kişisel veri değil, yalnızca çift sayım kontrolü için. */
const newSessionId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

export type GameState = {
  sessionId: string;
  /** Harita dönemi görünümü (görsel yorum) */
  period: Period;
  /** Açılış: 2040 mesajı penceresi */
  introOpen: boolean;
  /** Harita sahnesi hazır (yükleme ekranı kapanır) */
  worldReady: boolean;
  selectedHotspotId: string | null;
  notice: string | null;
  /** Okul özeti (school.overview) */
  schoolOpen: boolean;
  /** Açık senaryo kimliği */
  activeScenarioId: string;
  /** Karar paneli açık mı */
  decisionOpen: boolean;
  /** Kantin görevi ziyaret edildi mi (adım 1) */
  canteenVisited: boolean;
  /** Seçili ama henüz değerlendirilmemiş seçenek */
  pendingChoiceId: string | null;
  /** Gerekçe: hazır seçenek veya kısa yazı */
  reasoningOption: string | null;
  reasoningText: string;
  /** Kantin transfer cevabı (ana görev) */
  transferAnswer: string;
  /** Diğer modüllerin transfer cevapları */
  transferByScenario: Record<string, string>;
  /** Güncel değerlendirme sonucu */
  result: DecisionResult | null;
  /** Denenen tüm kararlar */
  history: DecisionResult[];
  /** Modül başına son uygulanan karar (dünya durumu buradan kurulur) */
  applied: Partial<Record<string, DecisionResult>>;
  energySystem: EnergySystem;
  wasteSystem: WasteSystem;
  citySystem: CitySystem;
  carbonSystem: CarbonSystem;
  oceanSystem: OceanSystem;
  councilSystem: CouncilSystem;
  /** AI rehberi / hazır geri bildirim (güncel sonuç için) */
  tutor: { status: 'idle' | 'loading' | 'ready'; outcome: TutorOutcome | null };
  /** Yansıtma sorularına kısa cevaplar */
  reflection: [string, string];
  /** İki gelecek karşılaştırması: 'N' = kararlar yok, aksi halde seçenek id'si */
  comparisonOpen: boolean;
  compareA: string;
  compareB: string;
  /** Ortak dünya durumu */
  world: Resources;
};

const initial = (): GameState => ({
  sessionId: newSessionId(),
  period: 'today',
  introOpen: true,
  worldReady: false,
  selectedHotspotId: null,
  notice: null,
  schoolOpen: false,
  activeScenarioId: food.id,
  decisionOpen: false,
  canteenVisited: false,
  pendingChoiceId: null,
  reasoningOption: null,
  reasoningText: '',
  transferAnswer: '',
  transferByScenario: {},
  result: null,
  history: [],
  applied: {},
  energySystem: { ...ENERGY_BASELINE },
  wasteSystem: { ...WASTE_BASELINE },
  citySystem: { ...CITY_BASELINE },
  carbonSystem: { ...CARBON_BASELINE },
  oceanSystem: { ...OCEAN_BASELINE },
  councilSystem: { ...COUNCIL_BASELINE },
  tutor: { status: 'idle', outcome: null },
  reflection: ['', ''],
  comparisonOpen: false,
  compareA: 'N',
  compareB: 'B',
  world: { ...food.baseline },
});

const storage = (): Storage | null => {
  const ls = (globalThis as { localStorage?: Storage }).localStorage;
  return ls ?? null;
};

const isResources = (x: unknown): x is Resources => {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (['budget', 'foodWasteKg', 'energyScore', 'waterScore', 'wellbeing'] as const).every((k) => typeof o[k] === 'number' && Number.isFinite(o[k] as number));
};

const isResult = (x: unknown): x is DecisionResult => {
  if (!x || typeof x !== 'object') return false;
  const o = x as DecisionResult;
  return typeof o.scenarioId === 'string' && typeof o.choiceId === 'string' && isResources(o.before) && isResources(o.after);
};

const isPeriod = (x: unknown): x is Period => x === 'today' || x === 'future-none' || x === 'future-mine';

function readSaved(): Partial<GameState> | null {
  try {
    const raw = storage()?.getItem(SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (!Array.isArray(p.history) || !p.history.every(isResult)) return null;
    const applied: Partial<Record<string, DecisionResult>> = {};
    if (p.applied && typeof p.applied === 'object') {
      for (const [k, v] of Object.entries(p.applied as object)) {
        if (isResult(v) && v.scenarioId === k) applied[k] = v;
      }
    }
    const energy = p.energySystem as Partial<EnergySystem> | undefined;
    const waste = p.wasteSystem as Partial<WasteSystem> | undefined;
    const city = p.citySystem as Partial<CitySystem> | undefined;
    const carbon = p.carbonSystem as Partial<CarbonSystem> | undefined;
    const ocean = p.oceanSystem as Partial<OceanSystem> | undefined;
    const council = p.councilSystem as Partial<CouncilSystem> | undefined;
    const finite = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
    const notes: Record<string, string> = {};
    if (p.transferByScenario && typeof p.transferByScenario === 'object') {
      for (const [k, v] of Object.entries(p.transferByScenario as object)) {
        if (typeof v === 'string') notes[k] = v.slice(0, 280);
      }
    }
    const reflection = Array.isArray(p.reflection) ? p.reflection : ['', ''];
    const history = p.history as DecisionResult[];
    const patch: Partial<GameState> = {
      history,
      applied,
      energySystem: {
        renewableShare: typeof energy?.renewableShare === 'number' ? energy.renewableShare : ENERGY_BASELINE.renewableShare,
        storageUnits: typeof energy?.storageUnits === 'number' ? energy.storageUnits : ENERGY_BASELINE.storageUnits,
      },
      wasteSystem: {
        otherWasteKg: typeof waste?.otherWasteKg === 'number' ? waste.otherWasteKg : WASTE_BASELINE.otherWasteKg,
        sortingRecovery: typeof waste?.sortingRecovery === 'number' ? waste.sortingRecovery : WASTE_BASELINE.sortingRecovery,
      },
      citySystem: {
        sealedShare: finite(city?.sealedShare, CITY_BASELINE.sealedShare),
        greenShare: finite(city?.greenShare, CITY_BASELINE.greenShare),
        rainShare: finite(city?.rainShare, CITY_BASELINE.rainShare),
      },
      carbonSystem: { claimScore: finite(carbon?.claimScore, CARBON_BASELINE.claimScore) },
      oceanSystem: { habitatCare: finite(ocean?.habitatCare, OCEAN_BASELINE.habitatCare) },
      councilSystem: { evidenceBias: finite(council?.evidenceBias, COUNCIL_BASELINE.evidenceBias) },
      transferAnswer: typeof p.transferAnswer === 'string' ? p.transferAnswer.slice(0, 280) : '',
      transferByScenario: notes,
      period: isPeriod(p.period) ? p.period : 'today',
      canteenVisited: p.canteenVisited === true || history.some((h) => h.scenarioId === food.id),
      reflection: [String(reflection[0] ?? '').slice(0, 280), String(reflection[1] ?? '').slice(0, 280)],
      introOpen: history.length === 0,
      world: composeWorld(applied),
    };
    if (typeof p.sessionId === 'string') patch.sessionId = p.sessionId;
    return patch;
  } catch {
    return null;
  }
}

function persist() {
  try {
    storage()?.setItem(
      SESSION_KEY,
      JSON.stringify({
        sessionId: state.sessionId,
        history: state.history,
        applied: state.applied,
        energySystem: state.energySystem,
        wasteSystem: state.wasteSystem,
        citySystem: state.citySystem,
        carbonSystem: state.carbonSystem,
        oceanSystem: state.oceanSystem,
        councilSystem: state.councilSystem,
        transferAnswer: state.transferAnswer,
        transferByScenario: state.transferByScenario,
        period: state.period,
        canteenVisited: state.canteenVisited,
        reflection: state.reflection,
      }),
    );
  } catch {
    /* depolama yok veya dolu */
  }
}

let state: GameState = { ...initial(), ...readSaved() };
const listeners = new Set<() => void>();
const set = (patch: Partial<GameState>) => {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((l) => l());
};

const foodActs = (s: GameState) => s.history.filter((h) => h.scenarioId === food.id);

function systemsAfter(scenario: PlayableScenario, system: PlayableScenario['choices'][number]['system'], prev: GameState) {
  return {
    energySystem: scenario.cross === 'energy-storage' ? energyFromChoice(system) : prev.energySystem,
    wasteSystem: scenario.cross === 'waste-loop' ? wasteFromChoice(system) : prev.wasteSystem,
    citySystem: scenario.cross === 'city-flood' ? cityFromChoice(system) : prev.citySystem,
    carbonSystem: scenario.cross === 'carbon-claim' ? carbonFromChoice(system) : prev.carbonSystem,
    oceanSystem: scenario.cross === 'ocean-habitat' ? oceanFromChoice(system) : prev.oceanSystem,
    councilSystem: scenario.cross === 'council-evidence' ? councilFromChoice(system) : prev.councilSystem,
  };
}

function systemsReset(scenarioId: string, prev: GameState) {
  return {
    energySystem: scenarioId === 'energy_001' ? { ...ENERGY_BASELINE } : prev.energySystem,
    wasteSystem: scenarioId === 'waste_001' ? { ...WASTE_BASELINE } : prev.wasteSystem,
    citySystem: scenarioId === 'city_001' ? { ...CITY_BASELINE } : prev.citySystem,
    carbonSystem: scenarioId === 'carbon_001' ? { ...CARBON_BASELINE } : prev.carbonSystem,
    oceanSystem: scenarioId === 'ocean_001' ? { ...OCEAN_BASELINE } : prev.oceanSystem,
    councilSystem: scenarioId === 'council_001' ? { ...COUNCIL_BASELINE } : prev.councilSystem,
  };
}

export type TaskStep = { id: string; label: string; done: boolean };

/** Kılavuz §20 görev tamamlama şartları + §09 sol panel adımları. Ana görev kantindir. */
export function taskSteps(s: GameState): TaskStep[] {
  const hist = foodActs(s);
  const distinct = new Set(hist.map((h) => h.choiceId)).size;
  return [
    { id: 'inspect', label: 'Kantini incele', done: s.canteenVisited },
    { id: 'choose', label: 'Porsiyon seç', done: hist.length > 0 },
    { id: 'explain', label: 'Kararını açıkla', done: hist.some((h) => !!h.reasoning) },
    { id: 'compare', label: 'Geleceği karşılaştır', done: distinct >= 2 },
    { id: 'transfer', label: 'Simülasyon ≠ gerçek ölçüm', done: s.transferAnswer.trim().length > 0 },
  ];
}
export const isTaskComplete = (s: GameState) => taskSteps(s).every((t) => t.done);

function openScenario(scenarioId: string, hotspotId: string) {
  const result = state.applied[scenarioId] ?? null;
  set({
    selectedHotspotId: hotspotId,
    notice: null,
    schoolOpen: false,
    decisionOpen: true,
    activeScenarioId: scenarioId,
    canteenVisited: state.canteenVisited || scenarioId === food.id,
    result,
    pendingChoiceId: null,
    reasoningOption: null,
    reasoningText: '',
    tutor: result ? { status: 'loading', outcome: null } : { status: 'idle', outcome: null },
  });
  if (result) {
    void getTutorFeedback(result).then((outcome) => {
      if (state.result === result && state.activeScenarioId === scenarioId) set({ tutor: { status: 'ready', outcome } });
    });
  }
}

/** React ve Phaser arasındaki ortak state adapter (kılavuz §09; EventBus yok). */
export const gameStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  selectHotspot(id: string) {
    const h = hotspotById(id);
    if (!h) return;
    if (h.locked) return set({ selectedHotspotId: null, schoolOpen: false, decisionOpen: false, notice: `${h.label}: Henüz açılmadı (Yakında)` });
    if (id === 'school') return set({ selectedHotspotId: id, notice: null, schoolOpen: true, decisionOpen: false });
    const scenarioId = HOTSPOT_SCENARIO[id];
    if (scenarioId) openScenario(scenarioId, id);
  },
  setPeriod: (p: Period) => set({ period: p }),
  closeIntro: () => set({ introOpen: false }),
  openIntro: () => set({ introOpen: true }),
  setWorldReady: () => set({ worldReady: true }),
  closePanel: () => set({ selectedHotspotId: null, schoolOpen: false }),
  clearNotice: () => set({ notice: null }),
  openDecision: () => openScenario(food.id, 'canteen'),
  /** Meclisin harita pini yok; okul ve görev listesinden açılır. */
  openCouncil: () => openScenario('council_001', 'school'),
  closeDecision: () => set({ decisionOpen: false, selectedHotspotId: null }),
  pickChoice: (id: string) => set({ pendingChoiceId: id }),
  setReasoningOption: (v: string | null) => set({ reasoningOption: v }),
  setReasoningText: (v: string) => set({ reasoningText: v.slice(0, 280) }),
  setReflection: (i: 0 | 1, v: string) => set({ reflection: i === 0 ? [v.slice(0, 280), state.reflection[1]] : [state.reflection[0], v.slice(0, 280)] }),
  setTransferAnswer: (v: string) => {
    const text = v.slice(0, 280);
    if (state.activeScenarioId === food.id) set({ transferAnswer: text });
    else set({ transferByScenario: { ...state.transferByScenario, [state.activeScenarioId]: text } });
  },
  /** Seçmeden simülasyon başlatılamaz. Karar, açık senaryonun kendi başlangıcından hesaplanır. */
  evaluate() {
    const scenario = playableById(state.activeScenarioId);
    if (!state.pendingChoiceId || !scenario.choices.some((c) => c.id === state.pendingChoiceId)) return;
    const reasoning = state.reasoningText.trim() || state.reasoningOption || undefined;
    const result = runDecision(scenario, state.pendingChoiceId, reasoning);
    const choice = scenario.choices.find((c) => c.id === state.pendingChoiceId);
    const applied = { ...state.applied, [scenario.id]: result };
    const systems = systemsAfter(scenario, choice?.system, state);
    set({
      result,
      history: [...state.history, result],
      applied,
      ...systems,
      world: composeWorld(applied),
      tutor: { status: 'loading', outcome: null },
      reflection: ['', ''],
      canteenVisited: state.canteenVisited || scenario.id === food.id,
    });
    void getTutorFeedback(result).then((outcome) => {
      if (state.result === result) set({ tutor: { status: 'ready', outcome } });
    });
  },
  /** "Tekrar dene": bu modülün son kararını kaldırır; diğer modüller durur. */
  retry: () => {
    const applied = { ...state.applied };
    delete applied[state.activeScenarioId];
    set({
      tutor: { status: 'idle', outcome: null },
      reflection: ['', ''],
      result: null,
      pendingChoiceId: null,
      reasoningOption: null,
      reasoningText: '',
      applied,
      ...systemsReset(state.activeScenarioId, state),
      world: composeWorld(applied),
    });
  },
  openComparison() {
    const hist = state.history.filter((h) => h.scenarioId === state.activeScenarioId);
    const last = hist[hist.length - 1]?.choiceId ?? 'B';
    set({
      comparisonOpen: true,
      compareA: 'N',
      compareB: last,
      canteenVisited: state.canteenVisited || state.activeScenarioId === food.id,
    });
  },
  closeComparison: () => set({ comparisonOpen: false }),
  setCompare: (slot: 'A' | 'B', id: string) => set(slot === 'A' ? { compareA: id } : { compareB: id }),
  /** Kayıtlı oturumu yeniden okur (test ve yenileme). */
  reloadSession() {
    const ready = state.worldReady;
    state = { ...initial(), ...readSaved(), worldReady: ready };
    listeners.forEach((l) => l());
  },
  /** Yeni oturum: örnek öğrenci verisi sıfırlanır (T09). */
  resetSession: () => {
    try {
      storage()?.removeItem(SESSION_KEY);
    } catch {
      /* yoksay */
    }
    state = { ...initial(), worldReady: state.worldReady };
    listeners.forEach((l) => l());
  },
};

export function useGameState(): GameState {
  return useSyncExternalStore(gameStore.subscribe, gameStore.get);
}
