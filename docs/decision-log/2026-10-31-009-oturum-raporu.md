# 009 – Öğretmen için indirilebilir oturum raporu (2026-10-31)

**Neden:** Kılavuz §02 öğretmen ihtiyacı "ön/son ölçüm, görev raporu, rubrik, çıktılar" ve §16 "aynı seed ve koşullar saklanır". Rapor yalnızca ekrandaydı; öğretmen bir dosya alamıyordu.
**Karar:** Öğretmen panelinde "Oturum raporunu indir": **JSON** (tam kayıt) ve **CSV** (her deneme bir satır, UTF-8 BOM'lu, Excel için). Dosya tarayıcıda üretilip indirilir; sunucuya gönderilmez.
**İçerik:** anonim rastgele oturum kimliği, senaryo kimliği/sürümü, motor sürümü, her denemede önce/sonra değerler ve gerekçe, yansıtma ve fark sorusu cevapları, rehber kaynağı (AI/hazır), görev tamamlandı mı, öğretmenin girdiği okul ölçümü. **İçermez:** ad, e-posta, konum, fotoğraf. `demo: false` (DEMO kayıtları dışa aktarılmaz).
**Güvenlik:** CSV hücreleri formül enjeksiyonuna karşı (`= + - @ TAB CR` ile başlayan metin) tek tırnakla öneklenir; sayılar bozulmaz. Rapor notları "simülasyon göstergesi" ve "serbest metin, paylaşmadan önce gözden geçir" uyarısını taşır.
**Oturum kimliği:** `crypto.randomUUID`; "Yeni oturum"da yenilenir. Kişisel veri değildir, çift sayım kontrolü içindir.
**Test:** `sessionReport.test.ts` (alan listesi, boş oturum, CSV satırları/kaçış, enjeksiyon önekleri). Tarayıcıda: karar yokken düğmeler kapalı; karardan sonra iki dosya iniyor, JSON ve CSV içeriği doğru, BOM bayt düzeyinde doğrulandı.
**Sınır:** Dosyayı sınıf düzeyinde toplamak (birden çok öğrenci/cihaz) yapılmadı; bu, gerçek kurumsal kullanımda kurum kodu ve sunucu tarafı gerektirir (P1/P2) ve KVKK değerlendirmesi ayrıca yürütülür.
