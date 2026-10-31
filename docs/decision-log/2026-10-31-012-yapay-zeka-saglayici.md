# 012 · Sağlayıcıdan bağımsız yapay zekâ (31 Ekim 2026)
**Karar:** `LlmProvider` arayüzü; varsayılan `NullProvider`, isteğe bağlı Anthropic adaptörü (resmî SDK, yapılandırılmış JSON). Tüm yanıtlar ortak doğrulayıcıdan geçer; başarısızlıkta doğrulanmış kural tabanlı geri bildirim döner.
**Gerekçe:** §18: sayılar yalnızca motordan, ≤2 soru, kaynak zorunlu, 5-8 sn yedek, hız ve maliyet sınırı. Oyun model servisi olmadan da bitmeli.
