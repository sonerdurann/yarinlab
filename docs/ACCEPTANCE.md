# Kabul testleri (kılavuz §23)

Son çalıştırma: 2026-10-31 · `npm run test` 35/35 · `npm run build` başarılı · tarayıcı: yerleşik pane, Chromium, 1440×900 ve 360×640 emülasyon.
Durum: ☑ geçti · ◐ kısmen (açıklama) · ☐ yapılmadı.

| ID | Test | Beklenen | Durum | Kanıt / yöntem |
|---|---|---|---|---|
| T01 | Oyun URL tarayıcıda açılır | Başlangıç, dünya ve görev yüklenir | ☑ | Dev (5173) ve `dist` (4173): canvas 1440×900, 5 görev adımı, konsol hatasız, 404 yok. Üretimde ilk yükleme 185 ms (yerel, ölçülmüş tek örnek) |
| T02 | Tüm aktif hotspotlara tıkla | Doğru sahne açılır; kilitli sahne yönlendirilir | ☑ | Gerçek fare tıklaması: Okul/Enerji/Atık paneli, Kantin karar penceresi; Şehir/Tarım/Kıyı "Henüz açılmadı". + `acceptance.test.ts` |
| T03 | Aynı karar aynı başlangıçta 3× çalışır | Aynı ölçülebilir sonuç | ☑ | `engine.test.ts` (otomatik) |
| T04 | Karar A B C | Farklı sonuçlar; ilk state her seferinde korunur | ☑ | `scenario.test.ts`, `store.test.ts`; arayüzde A→Tekrar dene→B denendi |
| T05 | Yüksek/negatif değer girdisi | 0 altı atık yok; 0-100 puan sınırı | ☑ | `engine.test.ts` (uç değerler), `teacher.test.ts` (ölçüm girişi doğrulama) |
| T06 | API bağlantısını kes | Yedek açıklama; görev tamamlanabilir | ☑ | Uç nokta erişilemez adrese yönlendirildi: 2 istek denendi, 62 ms'de hazır geri bildirim, görev "tamamlandı". 6 sn zaman aşımı birim testiyle (sahte zamanlayıcı) |
| T07 | Ekran 360 px genişlik | Taşma veya gizli eylem yok | ◐ | 360×640 emülasyonda yatay taşma yok, hedefler ≥44 px. **Gerçek telefonda denenmedi** |
| T08 | Klavyeyle gezin | Temel işlemler erişilebilir | ◐ | Statik tarama: tüm `onClick` yerel `button`, pozitif `tabindex` yok; Bölge Listesi harita alternatifi; Modal Tab tuzağı ve Esc doğrulandı. **Test aracı Tab ile odağı ilerletemediği için gerçek Tab turu yapılmadı: elle yapılmalı** |
| T09 | Yeni oturum aç | Örnek öğrenci verisi sıfırlanabilir | ☑ | "Yeni oturum": atık 18→30, tamamlanan adım 2→0; öğretmen panelinde "Örnek veriyi sıfırla" |
| T10 | Kaynak listesi görüntüle | Lisans ve kaynak bağlantıları açık | ☑ | Kaynaklar penceresi; 15 bağlantının 14'ü 200; UNEP script'e 403 verdi ama tarayıcıda açıldı. Kenney paketleri CC0 |
| T11 | Build al | `npm run build` başarılı; `dist` üretilir | ☑ | `dist` 3,3 MB (JS 1,63 MB / 439 KB gzip); dev kancası (`__yarinlab`) ve AI adresi pakette yok; `vite preview` ile çalıştı |
| T12 | Jüri demosu | 90 sn içinde karar ve sonuç gösterilir | ◐ | Akış betikle hatasız bitti (harita → kantin → karar → rehber → iki gelecek → görev tamamlandı, ~1,4 sn). **İnsan eliyle süreli prova yapılmadı** |

## Açık işler
- T07: gerçek telefonda (iOS Safari / Android Chrome) deneme.
- T08: gerçek klavye turu (Tab/Shift+Tab/Enter/Space/Esc) ve ekran okuyucu denemesi.
- T12: 90 sn'lik canlı prova + yedek ekran kaydı.
- Performans: FPS ve ilk yükleme hedef cihazda ölçülmedi (yalnızca yerel tek ölçüm).
- JS paketi 1,63 MB: Phaser ayrı parçaya bölünebilir (kod bölme) – kararlılıktan sonra.

Performans (hedef, ölçülmüş sonuç değil): masaüstü Chrome/Edge'de akıcı; FPS ve ilk yükleme cihazda ölçülür; atlas birleştirme, yalnızca gereken asset ön yüklenir; büyük modüller sahne açılınca yüklenir; internet yokken çekirdek çalışır (PWA ileri faz); jüri için ekran paylaşımı, tam ekran, ekran görüntüsü testleri.
