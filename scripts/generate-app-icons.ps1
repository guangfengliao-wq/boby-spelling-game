$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path $PSScriptRoot -Parent
$source = [System.Drawing.Image]::FromFile((Join-Path $projectRoot 'assets/branding/app-icon.png'))
function Export-Icon([string]$relativePath, [int]$size, [double]$scale = 1) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#6863D9'))
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $extent = [int][Math]::Round($size * $scale)
        $offset = [int][Math]::Round(($size - $extent) / 2)
        $graphics.DrawImage($source, $offset, $offset, $extent, $extent)
        $bitmap.Save((Join-Path $projectRoot $relativePath), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}
try {
    Export-Icon 'public/icon-192x192.png' 192
    Export-Icon 'public/icon-512x512.png' 512
    Export-Icon 'public/icon-maskable-512x512.png' 512 0.78
    Export-Icon 'public/favicon.png' 48
    Export-Icon 'public/apple-touch-icon.png' 180
    foreach ($entry in @(@('mdpi',48,108), @('hdpi',72,162), @('xhdpi',96,216), @('xxhdpi',144,324), @('xxxhdpi',192,432))) {
        $directory = "android/app/src/main/res/mipmap-$($entry[0])"
        Export-Icon "$directory/ic_launcher.png" $entry[1]
        Export-Icon "$directory/ic_launcher_round.png" $entry[1] 0.88
        Export-Icon "$directory/ic_launcher_foreground.png" $entry[2] 0.78
    }
} finally { $source.Dispose() }
Write-Output 'Generated web and Android launcher icons.'
