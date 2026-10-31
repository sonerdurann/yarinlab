# Çalışma kuralları (kılavuz §21)

Roller yetkinliğe göre: **Eğitim/AI lideri** (öğrenme hedefi, görev metni, AI geri bildirimi, rubrik) · **Oyun/ürün lideri** (Phaser sahneleri, React ekranları, mobil) · **Altyapı/veri lideri** (Tiled export, durum motoru, build, kayıt, yayın).

Kurallar:
- Her iş bir kart: amaç, kabul ölçütü, ekran görüntüsü/test, tahmini bağımlılık.
- Her gün çalışan `main`; kırık derleme ile gün bitmez.
- Her geliştirme adımından sonra commit; commit öncesi `typecheck` + `test` + `build` yeşil.
- Kararlar `docs/decision-log/` altında tarih ve gerekçeyle.
- AI üretimi kod merge edilmeden insan tarafından okunur, lint/typecheck/test yapılır.
- Son saatlerde yeni özellik yerine kararlılık ve jüri akışı.

## İş kartı şablonu
```
Başlık:
Amaç:
Kabul ölçütü:
Kanıt (ekran görüntüsü / test):
Bağımlılık:
```

## Yayın (Cloudflare Pages)
GitHub `main` hazır → Pages'te depoyu bağla → build `npm run build`, output `dist` → üretim URL'sini gizli pencerede test et → ileride AI endpoint için Pages Functions/Workers, API anahtarı secret olarak.
