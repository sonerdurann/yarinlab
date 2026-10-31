# 007 – Dönem görünümü: haritanın iki renk varyasyonu (2026-10-31)

**Neden:** Kılavuz §04 "haritanın dönemler arası değişimini gösterecek iki renklendirme/tasarım varyasyonu", §09 üst çubukta "dönem".
**Karar:** Haritanın üstüne tıklamayı engellemeyen bir renk katmanı (`.period-tint`) ve "Dönem" seçici: **Bugün** (katman yok), **2040 · Kararsız** (toprak tonu, `multiply` 0.42: soluk/kuru görünüm), **2040 · Kararlarınla** (`saturation` karışımı: canlı yeşil). Altında tek satırlık açıklama: kararsız gelecekte "temsili" metin; kararlarınla görünümünde yalnızca motor sonucundaki değerler (son karar, atık kg, memnuniyet), karar yoksa "önce Kantin'de karar ver".
**Dürüstlük:** Her 2040 görünümünde "Görsel yorumdur; ölçüm değildir." yazar (mobilde de gizlenmez). Renk katmanı hesaplama yapmaz; sayısal sonuçlar yalnızca kural motorundan gelir.
**Erişilebilirlik:** Düğmeler `aria-pressed`, ≥44 px; renk tek başına anlam taşımaz (açıklama metni var). Katman `aria-hidden`, `pointer-events: none`.
**Test:** `period.test.ts` (açıklamalar farklı, sayılar motor sonucundan, karbon ifadesi yok), `store.test.ts` (varsayılan ve sıfırlama).
**Sınır:** Karışım modları (`multiply`, `saturation`) tarayıcı desteğine bağlıdır; görünüm yalnızca yerleşik tarayıcıda gözle doğrulandı, gerçek cihazlarda bakılmalı.
