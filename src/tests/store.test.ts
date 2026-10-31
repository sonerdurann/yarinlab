import { beforeEach, describe, expect, it } from 'vitest';
import { gameStore, isTaskComplete, taskSteps } from '../state/gameStore';
import { food } from '../data/scenarios';

beforeEach(() => gameStore.resetSession());

describe('kantin görev akışı', () => {
  it('seçim yapmadan simülasyon başlamaz', () => {
    gameStore.evaluate();
    expect(gameStore.get().result).toBeNull();
    expect(gameStore.get().history).toHaveLength(0);
  });

  it('kantin hotspotu paneli açar; kilitli bölge açmaz', () => {
    gameStore.selectHotspot('canteen');
    expect(gameStore.get().decisionOpen).toBe(true);
    gameStore.closeDecision();
    gameStore.selectHotspot('city');
    expect(gameStore.get().decisionOpen).toBe(false);
    expect(gameStore.get().notice).toMatch(/Henüz açılmadı/);
  });

  it('T04: tekrar dene ilk durumu korur ve dünya durumunu sıfırlar', () => {
    gameStore.pickChoice('B');
    gameStore.evaluate();
    expect(gameStore.get().world.foodWasteKg).toBe(20);
    gameStore.retry();
    expect(gameStore.get().world).toEqual(food.baseline);
    gameStore.pickChoice('C');
    gameStore.evaluate();
    expect(gameStore.get().result?.before).toEqual(food.baseline);
    expect(gameStore.get().world.foodWasteKg).toBe(18);
  });

  it('görev yalnızca 4+1 şart sağlanınca tamamlanır', () => {
    gameStore.openDecision();
    gameStore.pickChoice('A');
    gameStore.setReasoningOption(food.reasoningOptions[0]);
    gameStore.evaluate();
    expect(isTaskComplete(gameStore.get())).toBe(false);
    gameStore.retry();
    gameStore.pickChoice('B');
    gameStore.evaluate();
    expect(taskSteps(gameStore.get()).find((t) => t.id === 'compare')?.done).toBe(true);
    expect(isTaskComplete(gameStore.get())).toBe(false);
    gameStore.setTransferAnswer('Simülasyon varsayım, gerçek ölçüm tartımla yapılır.');
    expect(isTaskComplete(gameStore.get())).toBe(true);
  });

  it('T09: yeni oturum örnek veriyi sıfırlar', () => {
    gameStore.pickChoice('A');
    gameStore.evaluate();
    gameStore.resetSession();
    expect(gameStore.get().history).toHaveLength(0);
    expect(gameStore.get().world).toEqual(food.baseline);
  });
});

describe('açılış ve yükleme', () => {
  it('açılış mesajı başta açıktır, kapatılır, yeni oturumda tekrar açılır', () => {
    expect(gameStore.get().introOpen).toBe(true);
    gameStore.closeIntro();
    expect(gameStore.get().introOpen).toBe(false);
    gameStore.resetSession();
    expect(gameStore.get().introOpen).toBe(true);
  });
  it('harita hazır bilgisi yeni oturumda korunur', () => {
    gameStore.setWorldReady();
    gameStore.resetSession();
    expect(gameStore.get().worldReady).toBe(true);
  });
});


describe('dönem görünümü', () => {
  it('varsayılan bugün; seçilir; yeni oturumda bugüne döner', () => {
    expect(gameStore.get().period).toBe('today');
    gameStore.setPeriod('future-none');
    expect(gameStore.get().period).toBe('future-none');
    gameStore.resetSession();
    expect(gameStore.get().period).toBe('today');
  });
});
