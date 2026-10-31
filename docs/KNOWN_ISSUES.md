# Bilinen sorunlar ve yapılmayanlar (dürüstlük kaydı)

Bu liste, test edilmemiş veya bu ortamda yapılamamış işleri açıkça bildirir. Burada yer alan hiçbir madde “tamamlandı” sayılmaz.

## Yapılamadı / doğrulanmadı
- **Canlı yayın yok:** Ürün HTTPS'li bir sunucuda yayımlanmadı. Doğrulanmış canlı adres yok. Docker, compose ve CI dosyaları hazır; gerçek dağıtım ortamınızda çalıştırılmalı.
- **Canlı dil modeli çağrısı test edilmedi:** Bu ortamda API anahtarı yok. Anthropic adaptörü yalnızca sahte istemciyle (istek biçimi ve yanıt ayrıştırma) test edildi. Anahtarsız durumda doğrulanmış yedek geri bildirim çalışır ve test edildi.
- **Gerçek cihaz ve performans ölçümü yapılmadı:** Masaüstü (1366×768) ve tablet (1024×768, dokunmatik) görünümleri yalnızca headless Chromium'da Playwright ile test edildi. Gerçek iPad/Android tabletlerde FPS ve yükleme süresi ölçülmedi. Hedefler: ilk etkileşim < 3 sn (okul Wi-Fi), harita ≥ 30 FPS (orta seviye tablet), sunucu yanıtı p95 < 300 ms.
- **KVKK hukuki incelemesi yapılmadı:** İzin akışı ve bilgilendirme metni bir taslaktır. Okul ve veli izin süreçleri, veri saklama süresi ve aydınlatma metni hukuk birimince onaylanmalıdır.
- **Gerçek kullanıcı (öğrenci/öğretmen) testi yapılmadı.** Pedagojik etkililik ölçülmedi.
- **Ekran okuyucu ile manuel tur yapılmadı:** Klavye akışı ve axe (WCAG 2 A/AA, kritik ve ciddi ihlaller) otomatik test edildi; NVDA/VoiceOver ile insan testi yapılmadı.
- **Uzak dallar silinemedi:** `feat/p1-p2-moduller` ve `claude/magical-gauss-g5xgy5` dalları GitHub'dan silinemedi (ortam izni yok). İçerikleri `main`'de.

## Bilinen sınırlamalar
- Yarın Şehri 40×40 karodur ve ayrı bir 24×24 kıyı haritası vardır. Harita görev ilerledikçe fiziksel olarak büyümez; bölgeler görev kilitleri ve yapı alanlarıyla açılır.
- **Binalar ve karakterler kodla üretilmiştir** (Phaser Graphics + SVG; tek ışık yönü ve palet). Bu bir “el çizimi premium sanat” değildir; kalite tavanı profesyonel illüstrasyonun altındadır. Zemin karoları Kenney'dir (CC0). Profesyonel sanatçı geçişi yapılmadı.
- Görsel kalite yalnızca headless Chromium ekran görüntüleriyle (1920×1080, 1366×768) gözden geçirildi; gerçek ekranlarda ve çocuklarla kullanılabilirlik testi yapılmadı.
- Harita katmanları (sıcaklık, sel, enerji ve atık akışı) bölge düzeyinde göstergelerden çizilir; karo düzeyinde fiziksel bir model değildir.
- Kenney destek paketleri kullanıcı tarafından indirildi (CC0). Araç atlası trafikte, Interface Sounds efektlerde kullanılıyor; Game Icons henüz kullanılmıyor. Sivil araç renk atlasları (16 yön, numaralı kareler) eklenmedi.
- Efektler Kenney Interface Sounds'tur (dosya yoksa kod sesi). Müzik ve ortam sesi kodla üretilir; profesyonel besteci işi değildir.
- Gerekçe puanı sezgisel bir dil ölçüsüdür (bağlaç ve kanıt sözcükleri). Gerekçenin bilimsel doğruluğunu değerlendirmez; öğretmenin okuması gerekir.
- Görev başlangıç değerleri her görevin kendi tabanından ölçülür. Ortak şehir durumu ise kararların toplamından hesaplanır, dolayısıyla “önce” sütunu şehir durumunu değil görev tabanını gösterir.
- Çok sayıda karar bütçeyi negatife düşürebilir. Günlük gelir (“Günü bitir”) bütçeyi toparlar; denge ayarı gerçek kullanıcı verisiyle yapılmalı.
- Yerel geliştirmede sunucu `tsx` ile TypeScript'i doğrudan çalıştırır (ayrı derleme adımı yok).
- E2E testleri tek işçiyle (sıralı) çalışır; süre ~10 dk.
- Bildirimler 8 sn sonra kendiliğinden kapanır; olay günlüğünde kalıcıdır.
- Service worker yalnızca HTTPS (veya localhost) üretim derlemesinde etkindir; ilk ziyaretten sonra çevrim dışı açılır.
