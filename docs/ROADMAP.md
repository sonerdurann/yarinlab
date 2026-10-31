# Takvim ve ilerleme (kılavuz §22)

| Tarih | Yapılacak | Çıkış kontrolü | Durum |
|---|---|---|---|
| 31 Eki | Repo + şablon; Kenney asset; Tiled 32×32; temel harita | Ana dünya açılır, ≥1 hotspot tıklanır | tamamlandı (Kenney indirmesi bekliyor, geçici zemin) |
| 1 Kas | Kantin senaryosu; 3 karar; kaynak paneli; 2 gelecek | Karar değişince sonuç doğru güncellenir | – |
| 2 Kas | PDF başvuru; oyun tasarım görselleri; iddia doğrulama | Başvuru tamam (son: 23.59); hayalî pilot iddiası yok | – |
| 3-5 Kas | Karar motoru testleri; harita temizliği; responsive | Temel testler geçer, mobil açılır | – |
| 6-8 Kas | AI fallback; öğretmen raporu; gerçek kullanıcı denemesi | AI kapalıyken oyun bitirilebilir | – |
| 9-13 Kas | Mentor notları; sunum provaları; ölçüm planı | 5 dk sunum, 3 dk S/C prova | – |
| 14 Kas | Offline kopya, yedek cihaz, freeze | Prod ve yerel sürüm aynı | – |
| 15-16 Kas | Final geliştirmesi; 3 saha görüşmesi; 1 revizyon | Geliştirme kayıtları + canlı işlev | – |

Final: 15-16 Kas, 24 saat geliştirme, 5 dk sunum + 3 dk soru-cevap. Finalde 3 kurum/firma görüşmesi yapılıp en az bir geri bildirim uygulamaya/iş modeline yansıtılmalı; final sırasında yapılanlar ayrıca belirtilir [K1].

## Başlangıç kontrol listesi (§27)
- [x] 01 Proje ana klasörü `yarinlab`
- [x] 02 Phaser + React + TypeScript şablonu
- [x] 03 Kenney City, Buildings, Landscape, UI Pack indirildi + lisanslar doğrulandı
- [x] 04 Tiled 32×32 izometrik harita (JSON üretildi, Kenney 132×66 ölçüsüyle)
- [x] 05 Okul ve kantin binaları haritada (Kenney sprite)
- [x] 06 Kantin hotspot + React görev paneli
- [x] 07 3 seçenekli saf karar motoru
- [ ] 08 İki gelecek karşılaştırması
- [ ] 09 Fallback AI açıklaması + gerekçe alanı
- [ ] 10 Öğretmen özeti + kaynak/lisans sayfası
- [ ] 11 12 kabul testi + production build
- [ ] 12 Sunumda P0 ile P1-P2 yol haritası ayrımı

İlk görev dosyaları: `world_alpha.json`, `food_001.json`, `ClimateEngine.ts`, `WorldScene.ts`, `DecisionModal.tsx`, `aiFallback.tr.json`, `licenses.md`.
