import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { food } from '../data/scenarios';
import { hotspots } from '../game/tiles/hotspots';
import { gameStore, isTaskComplete, taskSteps } from '../state/gameStore';
import { AI_TIMEOUT_MS, getTutorFeedback } from '../ai/tutorClient';
import { runDecision } from '../game/systems/DecisionEngine';

beforeEach(() => gameStore.resetSession());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('T02 hotspot yönlendirme', () => {
  it('aktif hotspotlar kendi sahnesini açar, kilitliler "Henüz açılmadı" der', () => {
    for (const h of hotspots) {
      gameStore.resetSession();
      gameStore.selectHotspot(h.id);
      const s = gameStore.get();
      if (h.locked) {
        expect(s.selectedHotspotId, h.id).toBeNull();
        expect(s.notice, h.id).toMatch(/Henüz açılmadı/);
      } else {
        expect(s.selectedHotspotId, h.id).toBe(h.id);
        expect(s.decisionOpen, h.id).toBe(h.id === 'canteen');
      }
    }
  });
});

describe('T06 API bağlantısı kesik', () => {
  it(`uç nokta yanıt vermezse ${AI_TIMEOUT_MS} ms sonra yedeğe düşer`, async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_AI_ENDPOINT', 'https://example.test/api/tutor');
    // İptal sinyaline duyarlı, asla yanıtlamayan sahte ağ
    const hang = ((_: string, init: RequestInit) =>
      new Promise((_res, rej) => init.signal?.addEventListener('abort', () => rej(new Error('abort'))))) as never;
    const p = getTutorFeedback(runDecision(food, 'B'), hang);
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS + 10);
    expect((await p).source).toBe('fallback');
  });

  it('AI yokken görev uçtan uca tamamlanır', async () => {
    gameStore.openDecision();
    gameStore.pickChoice('A');
    gameStore.setReasoningOption(food.reasoningOptions[0]);
    gameStore.evaluate();
    await vi.waitFor(() => expect(gameStore.get().tutor.status).toBe('ready'));
    expect(gameStore.get().tutor.outcome?.source).toBe('fallback');
    gameStore.retry();
    gameStore.pickChoice('B');
    gameStore.evaluate();
    gameStore.setTransferAnswer('Simülasyon varsayımdır; gerçek ölçüm tartımla yapılır.');
    expect(isTaskComplete(gameStore.get())).toBe(true);
  });
});

describe('T12 jüri demosu akışı (mantık)', () => {
  it('harita → kantin → karar → sonuç → rehber → iki gelecek, hatasız', async () => {
    gameStore.selectHotspot('canteen');
    gameStore.pickChoice('B');
    gameStore.setReasoningOption(food.reasoningOptions[1]);
    gameStore.evaluate();
    await vi.waitFor(() => expect(gameStore.get().tutor.status).toBe('ready'));
    const r = gameStore.get().result!;
    expect(r.after.foodWasteKg).toBeLessThan(r.before.foodWasteKg);
    expect(gameStore.get().tutor.outcome?.response.question1).toBeTruthy();
    gameStore.openComparison();
    expect(gameStore.get().comparisonOpen).toBe(true);
    expect([gameStore.get().compareA, gameStore.get().compareB]).toEqual(['N', 'B']);
    expect(taskSteps(gameStore.get()).filter((t) => t.done).length).toBeGreaterThanOrEqual(3);
  });
});
