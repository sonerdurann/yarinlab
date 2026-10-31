# 005 – Açılış mesajı, yükleme ekranı ve marka (2026-10-31)

**Karar:** Kılavuz §20 (00:00-00:45 "Giriş: 2040 mesajını açar; hedef ve kontrol anlatımı") karşılığı olarak sayfa açılınca "2040'tan bir mesaj var" penceresi çıkar: kısa hikâye, hedef ("tek sayıya değil gerekçeli dengeye bak"), kontroller ve "bunlar simülasyondur" uyarısı. "Başla" veya `Esc` ile kapanır; üst bardaki "?" ile yeniden açılır; "Yeni oturum" da yeniden gösterir. Hikâye kurgusal çerçevedir; gerçek bir kişiye/kuruma atfedilmez.
**Yükleme:** Harita sahnesi hazır olana kadar "Harita yükleniyor…" ekranı (hareket azaltma açıkken dönen simge yok). `worldReady` yeni oturumda korunur (harita yeniden yüklenmez).
**Marka:** Ekip yapımı SVG logo (`Logo.tsx`) ve `favicon.svg`; `description` ve `theme-color` meta etiketleri. Lisans: `team-owned`.
**Test notu:** Betikli kabul akışlarında önce "Başla" ile açılış kapatılmalıdır (`docs/ACCEPTANCE.md` T12).
**Araç notu:** Yerleşik tarayıcı panosu görünür olmadığında `requestAnimationFrame` durur ve Phaser döngüsü ilerlemez (`game.loop.frame` sabit kalır); bu bir uygulama hatası değildir, ekran görüntüsü alınca döngü devam eder. Gerçek tarayıcıda gözlenmedi.
