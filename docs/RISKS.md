> **Tarihsel kayıt (Creathon P0 dönemi, 31 Ekim 2026 sabahı).** Güncel durum için README.md, docs/ARCHITECTURE.md ve docs/KNOWN_ISSUES.md belgelerine bakın.

# Riskler ve GO / NO-GO (kılavuz §26, §18)

| Risk | Olasılık / etki | Çözüm / geri çekilme |
|---|---|---|
| Tiled asset uyumsuzluğu | Orta / yüksek | Tek atlasla bağla; olmazsa sabit sahne sprite tabanlı harita |
| Phaser 4 API farkı | Orta / orta | Resmî React TS şablonu ve 4.2.1 pin; küçük spike |
| AI servis hatası | Yüksek / orta | Rule-based fallback, fail-open oyun akışı |
| Çok fazla modül | Yüksek / yüksek | P0 dondur; diğerlerini poster/harita seviyesinde göster |
| Gerçek veri bulunmaması | Yüksek / yüksek | Simülasyon etiketi; ölçüm planı ve dürüst etki sınırı |
| Görsel stil çakışması | Orta / orta | Tek Kenney ailesi; özel objeleri stil rehberine göre üret |
| Mobil performans | Orta / orta | Küçük harita, sınırlı efekt, atlas ve önbellek |
| Sunum interneti | Orta / yüksek | Yerel çalıştırma; ekran kaydı yedeği |

AI riskleri: yanlış iklim iddiası → katsayılar kural motorunda, kaynak+sürüm zorunlu · çocuk verisi → anonim oturum, minimizasyon · uygunsuz sohbet → serbest sohbet yok · API kesintisi → hazır pedagojik geri bildirim · model maliyeti → istek sınırı, max token, önbellek.

## GO / NO-GO
**GO:** ana harita tıklanır, karar motoru çalışır, iki gelecek karşılaştırılır, fallback açıklama gelir ve 90 saniyelik demo bir kez baştan sona hatasız tamamlanır.
**NO-GO:** bunlardan biri kırıkken yeni modüle geçilmez.
