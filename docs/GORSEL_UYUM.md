# Görsel tasarım ve UI/UX promptu: uyum tablosu

Her satır promptun bir bölümünü uygulamadaki karşılığına ve doğrulama yoluna bağlar. “Kısmen” ve “Yapılmadı” durumları gerekçesiyle yazılmıştır; ayrıntı [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

| § | İstek | Uygulama | Durum | Doğrulama |
|---|---|---|---|---|
| 1 | Palet ve görsel kimlik | `design/tokens.css` (9 renk, kontrast kuralı), Nunito/Baloo 2 | Tamam | axe AA (E2E) |
| 2 | Tek yaşayan şehir, pusula yerleşimi | `world_v2.json` 40×40; merkez kampüs, K enerji, D şehir, B tarım, G döngü, GD kıyı kapısı | Tamam | `map.test.ts` (yön, yol ağı bağlantısı) |
| 2 | Ayrı kıyı haritası | `CoastScene` 24×24: kumsal, iskele, şamandıra, istasyon, su altı katmanı | Tamam | E2E harita senaryosu |
| 3 | Binalar, 4 seviye, durumlar, büyük etiket yok | `game/art/isoArt.ts`; kampüs 4 seviye (etkiler simülasyonla aynı); hover/seçili/geliştirilebilir/iskele/ışıltı/uyarı | Tamam (kod sanatı) | `guide.test.ts` (kampüs), E2E kart + geliştirme |
| 3 | Bina bilgi kartı | `ui/City/BuildingCard.tsx` (Göreve git, Geliştir, İnşa, Kapat) | Tamam | E2E (kanvas fare/dokunma tıklaması, klavye listesi) |
| 4 | Oyuncu avatarı | Karakter oluşturucu + haritada yürüyen karakter (duruş, yürüme, düşünme, sevinç) | Tamam | `worldv2.test.ts` (profil), E2E |
| 4 | 2040 öğrencisi Ada | Hologram SVG; giriş, bölüm geçişleri, final | Tamam | Görsel inceleme |
| 4 | Yan karakterler | `Character` sistemi (10 kişi, rol eşyası, ifadeler); görev ekranlarında | Tamam | Görsel inceleme |
| 5 | HUD: üst, sol, sağ, alt dock | `ui/hud/*` | Tamam | E2E (dock, çekmeceler, katmanlar) |
| 6 | Ana menü, canlı şehir arka planı | `TitleScreen` + kamera turu | Tamam | E2E (başlangıç akışı) |
| 7 | Görev ekranları ve 7 modül sahnesi | `ui/scenes/ModuleScene.tsx`; seçim/sonuca göre değişir; karar sonrası kamera ilgili bölgeye gider | Tamam | E2E (7 modül) |
| 8 | İki gelecek, sürüklenebilir çizgi | `FutureDiorama` + `FutureSlider` (fare, dokunma, ok tuşları) | Tamam | Görsel inceleme |
| 9 | AI rehberi düğmeleri | 6 niyet + geri bildirim; sunucu `mode`; doğrulanmış yedek | Tamam | `guide.test.ts` (35 görev × seçenek × mod), `aimode.test.ts`, E2E |
| 10 | Öğretmen paneli 9 ekran | Sol gezinme; ayarlar (ad/parola ucu) | Tamam | `account.test.ts`, E2E sınıf senaryosu |
| 11 | Animasyonlar | Ortam, inşa, ışıltı, karakter, sahne animasyonları; hareket azaltmada durur | Tamam | Ayarlar testi |
| 12 | Müzik, ortam, efekt ayrı | `audio/ambience.ts` (kod), Kenney Interface Sounds | Kısmen: müzik ve ortam kodla üretilir, besteci işi değil | Ayarlar paneli |
| 13 | 1920×1080 öncelikli, 1366×768, tablet pinch | Duyarlı HUD; iki parmak yakınlaştırma | Kısmen: pinch kodu var, gerçek tablette denenmedi | E2E üç çözünürlük (1920, 1366, 1024 dokunmatik) |
| 14–17 | Asset standartları, tasarım sistemi, envanter | `DESIGN_SYSTEM.md`, `ASSET_INVENTORY.md`, `manifest.json` | Tamam | `assets.test.ts` |
| 20 | “Premium el çizimi” kalite | Kod sanatı (kullanıcı kararı) | Kısmen: profesyonel illüstratör geçişi yapılmadı | — |
