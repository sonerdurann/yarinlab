# Sistem mimarisi

```
packages/shared   TypeScript ortak çekirdek (istemci + sunucu)
  src/sim/        deterministik şehir simülasyonu: PRNG, takvim/hava, saatlik enerji, riskler, binalar, gün döngüsü, puan/rozet
  src/content/    35 görev (JSON), 7 modül, kazanımlar, bilimsel kaynaklar, ön/son test, gerçek dünya etkinlikleri, final sonları
  src/ai/         doğrulanmış kural tabanlı geri bildirim + yapay zekâ yanıt doğrulayıcı
apps/web          Vite + React 19 (arayüz) + Phaser 4 (izometrik dünya)
  src/game/art/   kod sanatı: parametrik izometrik bina üretici, doğa, durum rozetleri (isoArt.ts)
  src/game/scenes BootScene (doku), WorldScene (Yarın Şehri 40x40), CoastScene (kıyı 24x24), iso.ts (geometri, kamera, pinch)
  src/ui/hud/     üst/sol/sağ HUD, alt dock ve çekmeceler; ui/menu: başlık ekranı, karakter oluşturucu
  src/ui/         görev ekranı + modül sahneleri (scenes/), iki gelecek dioraması, rehber Yarı (guide/), karakterler, öğretmen paneli
  src/design/     tasarım belirteçleri ve oyun arayüzü stilleri (docs/DESIGN_SYSTEM.md)
apps/server       Fastify 5 + Prisma 6 + PostgreSQL 16 (hesaplar, kayıt, öğretmen, rapor, AI)
```

## Veri akışı
1. Öğrenci bir görevde seçenek ve gerekçe girer → `runDecision` (saf) önce/sonra değerlerini üretir.
2. Store, uygulanan kararlardan **modül sistemlerini türetir** (`system` mutlak, `systemAdd` birikimli) ve `computeCity` ile ortak şehir durumunu (10 gösterge) hesaplar. Böylece bir modüldeki karar diğerlerini etkiler: gıda atığı, atık yükünü ve kıyı riskini; yenilenebilir kurulum, şebeke çekişini ve emisyon endeksini; yeşil alan, sıcak ve sel riskini değiştirir.
3. “Günü bitir”: `advanceDay` tohum ve gün ile havayı belirler, saatlik enerjiyi simüle eder, olayları (sıcak dalga, fırtına, kuraklık, kesinti) azaltıcı önlemlerle uygular, gelir ve bakımı işler. Her etkinin nedeni olay günlüğüne yazılır.
4. Puan = sonuç %40 + gerekçe %35 + denge %25. XP, seviye ve rozet bu puandan gelir; baskı unsuru (süre, sıralama, ücretli ödül) yoktur.
5. Kayıt: localStorage (misafir ve çevrim dışı) + girişli kullanıcıda `/api/save` (optimistik sürüm kilidi). Denemeler ve değerlendirmeler kuyrukla `/api/attempts` ve `/api/assessments` uçlarına gider; ağ kesilince bekler, bağlantı gelince gönderilir.

## Belirlenimcilik
Simülasyon saf fonksiyonlardan oluşur; rastgelelik yalnızca `rngFor(seed, day)` ile yapılır ve tohum kayıtta saklanır. Aynı tohum ve aynı kararlar aynı şehri üretir (test: `packages/shared/src/tests/sim.test.ts`).

## Yapay zekâ
- `LlmProvider` arayüzü: `NullProvider` (varsayılan), `AnthropicProvider` (resmî SDK, yapılandırılmış JSON çıktı, sunucu taraflı ret yedeği), `MockProvider` (test).
- `AiService` üç rol sunar: **İklim Öğretmeni / Rehber Yarı** (sokratik ipucu, kavram yanılgısı; 7 niyet modu: geri bildirim, ipucu, neden, alternatif, açıkla, tekrar öğren, değerlendir), **Senaryo Yönetmeni** (yalnızca açık görevler arasından seçim, sayı/kural değiştiremez), **Öğretmen Asistanı** (anonim sınıf özeti).
- Her yanıt şema, sayı (yalnızca motor sonucu), kaynak (görevin kanıtları), çocuk güvenliği ve sayısal karbon iddiası yasağı açısından doğrulanır; geçmezse doğrulanmış yedek döner. Zaman aşımı, kullanıcı başına günlük kota, günlük token bütçesi, önbellek ve hız sınırı vardır. Öğrenci metni kişisel veriden temizlenir; istem enjeksiyonu için sistem kuralı vardır.
- Hesaplama motoru ile dil modeli ayrıdır: model şehir durumunu değiştiremez.

## Güvenlik
- Parola: scrypt (tuzlu); oturum: rastgele belirteç, veri tabanında SHA-256 özeti, httpOnly + SameSite=Lax çerez (`COOKIE_SECURE` ile Secure).
- Rol denetimi (`requireRole`) ve sınıf sahipliği (`ownClass`, yabancı sınıf için 404). IDOR testleri `apps/server/src/tests/teacher.test.ts`.
- Zod ile tüm girdiler doğrulanır; gövde boyutu sınırı; giriş uçlarında sıkı hız sınırı; Helmet + sıkı CSP; CSV formül enjeksiyonu koruması.
- KVKK: öğrenciden yalnızca takma ad + parola; okul onayı ve veli bilgilendirmesi kaydı olmadan sınıfa katılım yok; öğretmen öğrenci/sınıf verisini silebilir; AI'ye öğrenci kimliği gitmez.

## Veri modeli (Prisma)
`User`, `Session`, `Classroom`, `StudentGroup`, `Enrollment`, `ConsentRecord`, `SaveGame`, `TaskAttempt`, `DecisionLog`, `Assessment`, `Assignment`, `RealWorldMeasurement`, `Badge`, `AiInteraction`. Migration'lar: `apps/server/prisma/migrations/`.
