# Kenney destek paketlerini (CC0) indirir ve oyuna baglar: Isometric Vehicles, Interface Sounds, Game Icons.
# Kilavuz 05-06. Kullanim (depo kokunde, Windows PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\scripts\fetch-kenney-extras.ps1
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Set-Location (Join-Path $PSScriptRoot '..')
$dest = 'design/third_party/kenney'
$pub = 'apps/web/public/assets/kenney'
New-Item -ItemType Directory -Force -Path $dest, "$pub/sounds", "$pub/vehicles", "$pub/icons" | Out-Null

function Get-Pack([string]$slug) {
  $zip = Join-Path $dest "$slug.zip"
  if (Test-Path $zip) { Write-Host "Zaten var: $zip"; return }
  Write-Host "Sayfa okunuyor: https://kenney.nl/assets/$slug"
  $html = (Invoke-WebRequest -UseBasicParsing "https://kenney.nl/assets/$slug").Content
  $m = [regex]::Match($html, 'https://kenney\.nl/media/pages/assets/[^"'' ]+\.zip')
  if (-not $m.Success) { throw "Indirme baglantisi bulunamadi: https://kenney.nl/assets/$slug - tarayicidan indirip $zip olarak kaydedin ve betigi tekrar calistirin." }
  Write-Host "Indiriliyor: $($m.Value)"
  Invoke-WebRequest -UseBasicParsing $m.Value -OutFile $zip
}
function Get-License([string]$dir) { Get-ChildItem -Recurse -Path $dir -Filter 'license*.txt' | Select-Object -First 1 }

foreach ($slug in 'isometric-tiles-vehicles', 'interface-sounds', 'game-icons') {
  Get-Pack $slug
  $out = Join-Path $dest $slug
  if (Test-Path $out) { Remove-Item -Recurse -Force $out }
  Expand-Archive -Force -Path (Join-Path $dest "$slug.zip") -DestinationPath $out
}

# Sesler: oyundaki 5 olay icin secilen dosyalar (yoksa oyun kodla uretilen sesi calar)
foreach ($f in 'confirmation_002', 'maximize_006', 'pluck_002', 'confirmation_004', 'error_004') {
  $src = Get-ChildItem -Recurse -Path "$dest/interface-sounds" -Filter "$f.ogg" | Select-Object -First 1
  if ($src) { Copy-Item $src.FullName "$pub/sounds/" } else { Write-Warning "$f.ogg pakette yok (kod sesi kullanilacak)" }
}
Copy-Item (Get-License "$dest/interface-sounds").FullName "$pub/sounds/License.txt"

# Araclar ve simgeler: PNG dosyalari
Get-ChildItem -Recurse -Path "$dest/isometric-tiles-vehicles" -Filter '*.png' | Where-Object { $_.FullName -match '[\\/]PNG[\\/]' } | Copy-Item -Destination "$pub/vehicles/"
Copy-Item (Get-License "$dest/isometric-tiles-vehicles").FullName "$pub/vehicles/License.txt"
Get-ChildItem -Recurse -Path "$dest/game-icons" -Filter '*.png' | Where-Object { $_.FullName -match '[\\/]PNG[\\/]' } | Copy-Item -Destination "$pub/icons/"
Copy-Item (Get-License "$dest/game-icons").FullName "$pub/icons/License.txt"

node scripts/kenney-manifest.mjs
Write-Host ''
Write-Host 'Bitti. Lisans ilk satiri:' (Get-Content "$pub/sounds/License.txt" -TotalCount 1)
Write-Host 'Sonra: git add -A ; git commit -m "assets: Kenney destek paketleri" ; git push origin main'
