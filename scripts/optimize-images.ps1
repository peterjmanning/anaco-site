# Resizes industry JPEGs for web:
#   images/grid/{name}.jpg       — grid tiles (~512px wide)
#   images/grid/{name}-wide.jpg  — expanded row (~1440px wide)
#   images/{name}.jpg            — detail pages (max 1920×1080, in place)
# Run: npm run optimize-images
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$imagesDir = Join-Path $root 'images'
$gridDir = Join-Path $imagesDir 'grid'
$heroDir = Join-Path $imagesDir 'hero'
New-Item -ItemType Directory -Force -Path $gridDir | Out-Null
New-Item -ItemType Directory -Force -Path $heroDir | Out-Null

function Save-ResizedJpeg {
  param([string]$InputPath, [string]$OutputPath, [int]$MaxWidth = 1920, [int]$MaxHeight = 1080)
  if (-not (Test-Path $InputPath)) {
    Write-Warning "skip (missing): $InputPath"
    return
  }
  $src = [System.Drawing.Image]::FromFile($InputPath)
  try {
    if ($src.Width -lt 1 -or $src.Height -lt 1) { return }
    $scale = [Math]::Min(1.0, [Math]::Min($MaxWidth / [double]$src.Width, $MaxHeight / [double]$src.Height))
    $w = [Math]::Max(1, [int][Math]::Round($src.Width * $scale))
    $h = [Math]::Max(1, [int][Math]::Round($src.Height * $scale))
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $kb = [Math]::Round((Get-Item $OutputPath).Length / 1KB, 1)
    Write-Host "wrote $(Split-Path $OutputPath -Leaf) ${kb} KB"
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
}

function Optimize-InPlace {
  param([string]$Path, [int]$MaxWidth = 1920, [int]$MaxHeight = 1080)
  if (-not (Test-Path $Path)) { return }
  $tmp = Join-Path $env:TEMP ("anaco-opt-" + [Guid]::NewGuid().ToString() + ".jpg")
  Save-ResizedJpeg -InputPath $Path -OutputPath $tmp -MaxWidth $MaxWidth -MaxHeight $MaxHeight
  Move-Item -Force $tmp $Path
}

$names = @(
  'winery','biomanufacturing','agriculture','chemicals','oilandgas','research',
  'defense','municipal','education','universityeducation','beverages','cpg',
  'supplementsnutrition','beautyfragrances','home'
)

foreach ($name in $names) {
  $src = Join-Path $imagesDir "$name.jpg"
  Save-ResizedJpeg -InputPath $src -OutputPath (Join-Path $gridDir "$name.jpg") -MaxWidth 512 -MaxHeight 910
  Save-ResizedJpeg -InputPath $src -OutputPath (Join-Path $gridDir "$name-wide.jpg") -MaxWidth 1440 -MaxHeight 2560
  Optimize-InPlace -Path $src
}

$gif = Join-Path $imagesDir 'tinylab-device.gif'
if (Test-Path $gif) {
  try {
    $gi = New-Object System.Drawing.Bitmap($gif)
    $dimension = [System.Drawing.Imaging.FrameDimension]::Time
    if ($gi.FrameDimensionsList -contains 'time') {
      $gi.SelectActiveFrame($dimension, 0) | Out-Null
    }
    $tmp = Join-Path $env:TEMP 'anaco-gif-frame.png'
    $gi.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
    $gi.Dispose()
    Save-ResizedJpeg -InputPath $tmp -OutputPath (Join-Path $heroDir 'tinylab-device-poster.jpg') -MaxWidth 1920 -MaxHeight 1080
    Remove-Item $tmp -ErrorAction SilentlyContinue
  } catch {
    Write-Warning "Could not build hero poster from GIF: $_"
  }
}

Write-Host 'Done.'
