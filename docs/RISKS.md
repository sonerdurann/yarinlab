# Risk tablosu ve durum (kılavuz §26)

| Risk | Olasılık / etki | Çözüm | Güncel durum |
|---|---|---|---|
| Tiled asset uyumsuzluğu | Orta / yüksek | Tek atlas, manifest | Çözüldü: Kenney atlasları + manifest testi |
| Phaser 4 API farkı | Orta / orta | 4.2.1 sabit | Çözüldü |
| AI servis hatası | Yüksek / orta | Kural tabanlı yedek, fail-open | Çözüldü, test edildi (zaman aşımı, ret, kota) |
| Çok fazla modül | Yüksek / yüksek | Veri güdümlü içerik | 7 modül × 5 görev test edildi |
| Gerçek veri bulunmaması | Yüksek / yüksek | Simülasyon etiketi, ölçüm planı | Ölçülmüş/simülasyon ayrımı; saha verisi okul pilotu gerektirir |
| Görsel stil çakışması | Orta / orta | Tek Kenney ailesi, özel parçalar aynı dilde | Kenney destek paketleri indirilemedi; kodla üretilen parçalar kullanıldı |
| Mobil performans | Orta / orta | Küçük harita, düşük grafik modu | Gerçek cihazda ölçülmedi |
| Sunum interneti | Orta / yüksek | Yerel çalıştırma, service worker | Çevrim dışı çekirdek eklendi |
| Çocuk verisi / KVKK | Orta / yüksek | Takma ad, izin akışı, silme | Hukuk incelemesi bekliyor |

## GO / NO-GO
**GO şartları:** harita tıklanır, karar motoru çalışır, iki gelecek karşılaştırılır, yedek açıklama gelir, 90 saniyelik demo hatasız biter. İlk dördü otomatik testlerle doğrulandı; 90 saniyelik insan provası ekip tarafından yapılmalı.
