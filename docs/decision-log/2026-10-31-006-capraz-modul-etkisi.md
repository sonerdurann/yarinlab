# 006 – Çapraz modül etkisi arayüze alındı (2026-10-31)

**Sorun:** Kılavuz §01 P0 şartı "gıda israfı ile atık yönetimi arasında en az bir çapraz-modül etkileşimi" ve §03/§19 kuralı (`wasteLoadKg = foodWasteKg + otherSchoolWasteKg; collectionNeed = ceil(wasteLoadKg / assumedCollectionCapacityKg)`) motorda ve birim testinde vardı ama ekranda görünmüyordu.
**Karar:** Etki dört yerde gösterilir: (1) sağ "Dünya durumu"nda "Toplama ihtiyacı (Atık)", (2) karar sonucunda "Atık modülüne etkisi" notu, (3) iki gelecek karşılaştırmasında hesaplanan satır, (4) Atık bölgesi paneli.
**Varsayımlar (simülasyon, gerçek veri değil, ekranda dipnot):** diğer okul atığı 20 kg/gün, toplama kapasitesi 10 kg/sefer (`src/data/constants`). Önceki değerler (40 kg, 25 kg) üç seçeneğin de ihtiyacı 3'te bırakıp etkiyi göstermiyordu; yeni değerlerle başlangıç 5, A: 5, B: 4, C: 4, "Kararlar yok": 6 sefer/gün.
**Test:** `engine.test.ts` – hiçbir karar ihtiyacı artırmaz, en az bir seçenek azaltır; negatif girdi 0 sayılır.
**Sınır:** Etki bir oyun kuralıdır; ölçülmüş atık toplama verisi veya emisyon iddiası değildir. Enerji ↔ depolama çapraz kuralı (kılavuz §03) P1'dir ve yapılmadı.
