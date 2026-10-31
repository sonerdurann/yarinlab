# Kabul testleri (kılavuz §23)

| ID | Test | Beklenen | Durum |
|---|---|---|---|
| T01 | Oyun URL tarayıcıda açılır | Başlangıç, dünya ve görev yüklenir | ☐ |
| T02 | Tüm aktif hotspotlara tıkla | Doğru sahne açılır; kilitli sahne yönlendirilir | ☐ |
| T03 | Aynı karar aynı başlangıçta 3× çalışır | Aynı ölçülebilir sonuç | ☐ (otomatik) |
| T04 | Karar A B C | Farklı sonuçlar; ilk state her seferinde korunur | ☐ |
| T05 | Yüksek/negatif değer girdisi | 0 altı atık yok; 0-100 puan sınırı | ☐ (otomatik) |
| T06 | API bağlantısını kes | Yedek açıklama; görev tamamlanabilir | ☐ |
| T07 | Ekran 360 px genişlik | Taşma veya gizli eylem yok | ☐ |
| T08 | Klavyeyle gezin | Temel işlemler erişilebilir | ☐ |
| T09 | Yeni oturum aç | Örnek öğrenci verisi sıfırlanabilir | ☐ |
| T10 | Kaynak listesi görüntüle | Lisans ve kaynak bağlantıları açık | ☐ |
| T11 | Build al | `npm run build` başarılı; `dist` üretilir | ☐ |
| T12 | Jüri demosu | 90 sn içinde karar ve sonuç gösterilir | ☐ |

Performans (hedef, ölçülmüş sonuç değil): masaüstü Chrome/Edge'de akıcı; FPS ve ilk yükleme cihazda ölçülür; atlas birleştirme, yalnızca gereken asset ön yüklenir; büyük modüller sahne açılınca yüklenir; internet yokken çekirdek çalışır (PWA ileri faz); jüri için ekran paylaşımı, tam ekran, ekran görüntüsü testleri.
