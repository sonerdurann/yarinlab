#!/usr/bin/env bash
# Kenney destek paketlerini (CC0) indirir ve oyuna bağlar: Isometric Vehicles, Interface Sounds, Game Icons.
# Kılavuz §05-06. Kullanım (depo kökünde, internete açık bir bilgisayarda):
#   ./scripts/fetch-kenney-extras.sh && git add -A && git commit -m "assets: Kenney destek paketleri" && git push
set -euo pipefail
cd "$(dirname "$0")/.."
DEST=design/third_party/kenney
PUB=apps/web/public/assets/kenney
mkdir -p "$DEST" "$PUB/sounds" "$PUB/vehicles" "$PUB/icons"

fetch() { # $1 = kenney.nl/assets/<slug>, $2 = hedef zip adı
  local page="https://kenney.nl/assets/$1" url
  url=$(curl -fsSL "$page" | grep -oE 'https://kenney\.nl/media/pages/assets/[^"]+\.zip' | head -1 || true)
  if [ -z "$url" ]; then echo "HATA: $page sayfasında indirme bağlantısı bulunamadı. Tarayıcıdan indirip $DEST/$2 olarak kaydedin."; exit 1; fi
  echo "İndiriliyor: $url"
  curl -fSL "$url" -o "$DEST/$2"
}
[ -f "$DEST/isometric-tiles-vehicles.zip" ] || fetch isometric-tiles-vehicles isometric-tiles-vehicles.zip
[ -f "$DEST/interface-sounds.zip" ] || fetch interface-sounds interface-sounds.zip
[ -f "$DEST/game-icons.zip" ] || fetch game-icons game-icons.zip

for p in isometric-tiles-vehicles interface-sounds game-icons; do rm -rf "$DEST/$p"; unzip -oq "$DEST/$p.zip" -d "$DEST/$p"; done
lic() { find "$1" -iname 'license*.txt' | head -1; }

# Sesler: oyundaki 5 olay için seçilen dosyalar (yoksa oyun kodla üretilen sese döner)
for f in confirmation_002 maximize_006 pluck_002 confirmation_004 error_004; do
  src=$(find "$DEST/interface-sounds" -name "$f.ogg" | head -1 || true)
  [ -n "$src" ] && cp "$src" "$PUB/sounds/" || echo "UYARI: $f.ogg pakette yok (kod sesi kullanılacak)"
done
cp "$(lic "$DEST/interface-sounds")" "$PUB/sounds/License.txt"

# Araçlar ve simgeler: PNG'ler (araç dokuları sonraki adımda haritaya bağlanabilir)
find "$DEST/isometric-tiles-vehicles" -path '*PNG*' -name '*.png' -exec cp {} "$PUB/vehicles/" \; 2>/dev/null || true
cp "$(lic "$DEST/isometric-tiles-vehicles")" "$PUB/vehicles/License.txt"
find "$DEST/game-icons" -path '*PNG*' -name '*.png' -exec cp {} "$PUB/icons/" \; 2>/dev/null || true
cp "$(lic "$DEST/game-icons")" "$PUB/icons/License.txt"

# Manifeste ekle (kılavuz §06)
node scripts/kenney-manifest.mjs
echo "Bitti. Lisanslar doğrulandı mı: $(head -2 "$PUB/sounds/License.txt" | tr '\n' ' ')"
echo "Sonra: git add -A && git commit -m 'assets: Kenney destek paketleri' && git push"
