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
  type EnergySystem,
  type WasteSystem,
  type CitySystem,
  type CarbonSystem,
  type OceanSystem,
  type CouncilSystem,
} from '../game/systems/ClimateEngine';
import type { DecisionResult, Resources } from './types';
import { getTutorFeedback, type TutorOutcome } from '../ai/tutorClient';
import { composeWorld } from './composeWorld';
import {
  advanceDay, build as buildOn, demolish as demolishOn, earnedBadges, newSeed, newSim, scoreAttempt, upgrade as upgradeOn, xpForScore,
  BADGES, type AttemptScore, type LogEntry, type SimState,
} from '@yarinlab/shared';
import { cityOf, completedTaskIds, deriveSystems, literacyOf, progressFacts, systemsOf, unlockCtx } from './city';
import { nextTaskOf, moduleById, taskStatus } from '@yarinlab/shared';

export type Overlay = 'none' | 'menu' | 'build' | 'log' | 'progress' | 'help' | 'tasks' | 'assessment' | 'ending';
export type ScoreRecord = AttemptScore & { scenarioId: string; choiceId: string; day: number };

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
  /** Ortak şehir simülasyonu: tohum, gün, binalar, olay günlüğü */
  sim: SimState;
  xp: number;
  scores: ScoreRecord[];
  /** Kazanılmış rozet anahtarları (bildirim için) */
  badges: string[];
  greenEnergyDays: number;
  realWorldCount: number;
  assessmentsPost: number;
  assessments: { moduleId: string; kind: 'PRE' | 'POST'; pct: number; day: number }[];
  overlay: Overlay;
  /** İnşa panelinde seçili alan */
  buildZone: string | null;
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
  sim: newSim(newSeed()),
  xp: 0,
  scores: [],
  badges: [],
  greenEnergyDays: 0,
  realWorldCount: 0,
  assessmentsPost: 0,
  assessments: [],
  overlay: 'none',
  buildZone: null,
});

const isSim = (x: unknown): x is SimState => {
  if (!x || typeof x !== 'object') return false;
  const o = x as SimState;
  return Number.isInteger(o.seed) && Number.isInteger(o.day) && o.day >= 0 && typeof o.treasury === 'number' && Number.isFinite(o.treasury)
    && Array.isArray(o.buildings) && o.buildings.every((b) => typeof b?.id === 'string' && typeof b.type === 'string' && typeof b.slot === 'string' && [1, 2, 3].includes(b.level))
    && Array.isArray(o.log) && !!o.shock && typeof o.shock === 'object';
};

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
      ...deriveSystems(applied),
      transferAnswer: typeof p.transferAnswer === 'string' ? p.transferAnswer.slice(0, 280) : '',
      transferByScenario: notes,
      period: isPeriod(p.period) ? p.period : 'today',
      canteenVisited: p.canteenVisited === true || history.some((h) => h.scenarioId === food.id),
      reflection: [String(reflection[0] ?? '').slice(0, 280), String(reflection[1] ?? '').slice(0, 280)],
      introOpen: history.length === 0,
      overlay: history.length > 0 ? 'menu' : 'none',
      world: composeWorld(applied),
    };
    if (isSim(p.sim)) patch.sim = { ...p.sim, log: p.sim.log.filter((e) => typeof e?.message === 'string').slice(-200) };
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    patch.xp = num(p.xp);
    patch.greenEnergyDays = num(p.greenEnergyDays);
    patch.realWorldCount = num(p.realWorldCount);
    patch.assessmentsPost = num(p.assessmentsPost);
    if (Array.isArray(p.scores)) patch.scores = (p.scores as ScoreRecord[]).filter((x) => typeof x?.scenarioId === 'string' && typeof x.total === 'number').slice(-500);
    if (Array.isArray(p.assessments)) patch.assessments = (p.assessments as GameState['assessments']).filter((a) => typeof a?.moduleId === 'string' && (a.kind === 'PRE' || a.kind === 'POST') && typeof a.pct === 'number').slice(-200);
    if (Array.isArray(p.badges)) patch.badges = (p.badges as unknown[]).filter((x): x is string => typeof x === 'string');
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
        sim: state.sim,
        xp: state.xp,
        scores: state.scores,
        badges: state.badges,
        greenEnergyDays: state.greenEnergyDays,
        realWorldCount: state.realWorldCount,
        assessmentsPost: state.assessmentsPost,
        assessments: state.assessments,
      }),
    );
  } catch {
    /* depolama yok veya dolu */
  }
}

const withWorld = (s: GameState): GameState => ({ ...s, world: cityOf(s).resources });
let state: GameState = withWorld({ ...initial(), ...readSaved() });
const listeners = new Set<() => void>();
const persistListeners = new Set<() => void>();
export type AttemptEvent = { scenarioId: string; choiceId: string; reasoning?: string; before: Resources; after: Resources; score: { outcome: number; reasoning: number; balance: number; total: number }; day: number };
const attemptListeners = new Set<(a: AttemptEvent) => void>();
const set = (patch: Partial<GameState>) => {
  state = withWorld({ ...state, ...patch });
  persist();
  persistListeners.forEach((l) => l());
  listeners.forEach((l) => l());
};

const logEntry = (kind: LogEntry['kind'], message: string, why?: string): LogEntry => ({ day: state.sim.day, kind, message, why });
const appendLog = (sim: SimState, entries: LogEntry[]): SimState => ({ ...sim, log: [...sim.log, ...entries].slice(-200) });

/** Yeni kazanılan rozetleri günlüğe ve bildirime ekler (baskısız: yalnızca bilgi). */
function checkBadges() {
  const now = earnedBadges(progressFacts(state));
  const fresh = now.filter((k) => !state.badges.includes(k));
  if (!fresh.length) return;
  const names = fresh.map((k) => BADGES.find((b) => b.key === k)?.name ?? k);
  set({
    badges: [...state.badges, ...fresh],
    sim: appendLog(state.sim, names.map((n) => logEntry('badge', `Rozet kazanıldı: ${n}`))),
    notice: `Yeni rozet: ${names.join(', ')}`,
  });
}

const foodActs = (s: GameState) => s.history.filter((h) => h.scenarioId === food.id);

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
    if (scenarioId) openScenario(nextTaskOf(scenarioId.split('_')[0], completedTaskIds(state)).id, id);
  },
  setPeriod: (p: Period) => set({ period: p }),
  closeIntro: () => set({ introOpen: false }),
  openIntro: () => set({ introOpen: true }),
  setWorldReady: () => set({ worldReady: true }),
  closePanel: () => set({ selectedHotspotId: null, schoolOpen: false }),
  clearNotice: () => set({ notice: null }),
  openDecision: () => openScenario(nextTaskOf('food', completedTaskIds(state)).id, 'canteen'),
  /** Görev Merkezi: kilitli görev açılmaz, nedeni bildirilir. */
  openTask(taskId: string) {
    const st = taskStatus(taskId, completedTaskIds(state));
    if (st.status === 'locked') return set({ notice: st.reason ?? 'Bu görev henüz kilitli.' });
    const m = moduleById(taskId.split('_')[0]);
    openScenario(taskId, m?.hotspot ?? 'school');
  },
  /** Meclisin harita pini yok; okul ve görev listesinden açılır. */
  openCouncil: () => openScenario(nextTaskOf('council', completedTaskIds(state)).id, 'school'),
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
    const systems = deriveSystems({ ...state.applied, [scenario.id]: result });
    const score = scoreAttempt(result.before as unknown as Record<string, number>, result.after as unknown as Record<string, number>, scenario.rows, reasoning);
    const tried = state.history.some((h) => h.scenarioId === scenario.id && h.choiceId !== result.choiceId);
    const before = unlockCtx(state).completedTasks;
    set({
      scores: [...state.scores, { ...score, scenarioId: scenario.id, choiceId: result.choiceId, day: state.sim.day }].slice(-500),
      xp: state.xp + xpForScore(score.total, tried),
      sim: appendLog(state.sim, [logEntry('decision', `${scenario.title}: “${choice?.label ?? result.choiceId}” seçildi (puan ${score.total}).`, choice?.tradeoff)]),
      result,
      history: [...state.history, result],
      applied,
      ...systems,
      world: composeWorld(applied),
      tutor: { status: 'loading', outcome: null },
      reflection: ['', ''],
      canteenVisited: state.canteenVisited || scenario.id === food.id,
    });
    attemptListeners.forEach((l) => l({ scenarioId: scenario.id, choiceId: result.choiceId, reasoning, before: result.before, after: result.after, score: { outcome: score.outcome, reasoning: score.reasoning, balance: score.balance, total: score.total }, day: state.sim.day }));
    const after = unlockCtx(state).completedTasks;
    if (after > before) set({ sim: appendLog(state.sim, [logEntry('unlock', `Tamamlanan görev: ${after}. Yeni yapılar açılmış olabilir (İnşa paneli).`)]) });
    checkBadges();
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
      ...deriveSystems(applied),
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
  openOverlay: (overlay: Overlay, buildZone: string | null = null) => set({ overlay, buildZone: buildZone ?? state.buildZone }),
  closeOverlay: () => set({ overlay: 'none' }),
  setBuildZone: (z: string | null) => set({ buildZone: z }),
  /** Günü bitir: tohumlu hava, saatlik enerji, olaylar, gelir/bakım. */
  endDay() {
    const out = advanceDay(composeWorld(state.applied), systemsOf(state), state.sim, literacyOf(state));
    const e = out.city.indicators.energy;
    const green = e.outageHours === 0 && e.renewableSharePct >= 50;
    const events = out.entries.filter((x) => x.kind === 'event');
    set({ sim: out.sim, greenEnergyDays: state.greenEnergyDays + (green ? 1 : 0), notice: events.length ? events.map((x) => x.message).join(' ') : `Yeni gün: ${out.city.indicators.weatherTr}.` });
    checkBadges();
    return out;
  },
  build(type: string, slotId: string) {
    const r = buildOn(state.sim.buildings, type, slotId, state.world.budget, state.sim.day, unlockCtx(state));
    if (!r.ok) { set({ notice: r.message }); return r; }
    set({ sim: appendLog({ ...state.sim, buildings: r.buildings, treasury: state.sim.treasury - r.cost }, [logEntry('build', r.message)]), notice: r.message });
    checkBadges();
    return r;
  },
  upgrade(id: string) {
    const r = upgradeOn(state.sim.buildings, id, state.world.budget);
    if (!r.ok) { set({ notice: r.message }); return r; }
    set({ sim: appendLog({ ...state.sim, buildings: r.buildings, treasury: state.sim.treasury - r.cost }, [logEntry('upgrade', r.message)]), notice: r.message });
    checkBadges();
    return r;
  },
  demolish(id: string) {
    const r = demolishOn(state.sim.buildings, id);
    if (r.buildings.length === state.sim.buildings.length) return;
    set({ sim: appendLog({ ...state.sim, buildings: r.buildings, treasury: state.sim.treasury + r.refund }, [logEntry('demolish', `Yapı kaldırıldı (+${r.refund} puan iade).`)]) });
  },
  recordRealWorld: () => { set({ realWorldCount: state.realWorldCount + 1 }); checkBadges(); },
  recordAssessment(moduleId: string, kind: 'PRE' | 'POST', pct: number) {
    set({
      assessments: [...state.assessments, { moduleId, kind, pct, day: state.sim.day }],
      assessmentsPost: state.assessmentsPost + (kind === 'POST' ? 1 : 0),
      sim: appendLog(state.sim, [logEntry('system', `${kind === 'PRE' ? 'Ön' : 'Son'} değerlendirme (${moduleId}): %${pct}`)]),
    });
    checkBadges();
  },
  /** Kayıt dışa/içe aktarma (sunucu eşitlemesi için). */
  exportSave(): unknown {
    try { return JSON.parse(storage()?.getItem(SESSION_KEY) ?? 'null'); } catch { return null; }
  },
  importSave(payload: unknown) {
    try { storage()?.setItem(SESSION_KEY, JSON.stringify(payload)); } catch { return; }
    gameStore.reloadSession();
  },
  hasSave: () => state.history.length > 0 || state.sim.day > 0 || state.sim.buildings.length > 0,
  onAttempt(l: (a: AttemptEvent) => void) { attemptListeners.add(l); return () => { attemptListeners.delete(l); }; },
  onPersist(l: () => void) { persistListeners.add(l); return () => { persistListeners.delete(l); }; },
  setCompare: (slot: 'A' | 'B', id: string) => set(slot === 'A' ? { compareA: id } : { compareB: id }),
  /** Kayıtlı oturumu yeniden okur (test ve yenileme). */
  reloadSession() {
    const ready = state.worldReady;
    state = withWorld({ ...initial(), ...readSaved(), worldReady: ready });
    listeners.forEach((l) => l());
  },
  /** Yeni oturum: örnek öğrenci verisi sıfırlanır (T09). */
  resetSession: () => {
    try {
      storage()?.removeItem(SESSION_KEY);
    } catch {
      /* yoksay */
    }
    state = withWorld({ ...initial(), worldReady: state.worldReady });
    persistListeners.forEach((l) => l());
    listeners.forEach((l) => l());
  },
};

export function useGameState(): GameState {
  return useSyncExternalStore(gameStore.subscribe, gameStore.get);
}
