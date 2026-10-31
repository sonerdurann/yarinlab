# 004 – Mobil düzen ve erişilebilirlik (2026-10-31)

**Karar:** 760 px altında yan paneller gizlenir; görevler alttan açılan sheet'e taşınır (kapalıyken 44 px+ CTA çubuğu: "Görevler" / sıradaki adım / "Göreve başla"). Karar, karşılaştırma, öğretmen ve kaynak pencereleri tam ekran olur. Üst durum çubuğu özeti mobilde gizlenir; değerler sheet içindeki "Dünya durumu"nda ve karar ekranındadır.
**Harita:** Dokunmatik sürükleme, +/− düğmeleri (her ekranda) ve klavye +/− ile yakınlaştırma; dar ekranda başlangıç zoom 0.8; kanvasta `touch-action: none`.
**Erişilebilirlik:** Ortak `Modal` (odak içeri, Tab içinde döner, Esc kapatır, kapanınca odak geri verilir; üst üste pencerede yalnızca en üstteki etkin), "Bölge listesine geç" atlama düğmesi, yazı boyutları rem, `prefers-reduced-motion`, bağlantı ve düğmeler ≥44 px, durum renkle birlikte ok/metinle verilir.
**Doğrulama (360×640, tarayıcı):** sayfa ve tüm pencerelerde yatay taşma yok; ≥44 px olmayan hedef yok (kaynak bağlantıları düzeltildi); masaüstü yerleşimi (260/290 px paneller) korunuyor.
**Bilinen sınır:** Pinch-zoom yok (+/− düğmeleri var); gerçek cihazda performans ölçülmedi (T07 yalnızca emülasyonla doğrulandı).
