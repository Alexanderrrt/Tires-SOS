$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source = Join-Path $root 'output\higgsfield-ad\premium-owner-interactive-source.mp4'
$graphic = Join-Path $root 'public\storefront-3-locations.png'
$logo = Join-Path $root 'public\logo.jpg'
$outDir = Join-Path $root 'output\higgsfield-ad\premium'
New-Item -ItemType Directory -Force $outDir | Out-Null

Copy-Item -LiteralPath 'C:\Windows\Fonts\arialbd.ttf' -Destination (Join-Path $PSScriptRoot 'arialbd.ttf') -Force
Copy-Item -LiteralPath 'C:\Windows\Fonts\arial.ttf' -Destination (Join-Path $PSScriptRoot 'arial.ttf') -Force
$bold = 'tmp/google-ads/arialbd.ttf'
$regular = 'tmp/google-ads/arial.ttf'

function Invoke-PremiumRender {
    param(
        [string]$Name,
        [int]$Width,
        [int]$Height,
        [string]$OwnerFit,
        [string]$GraphicFit,
        [int]$HookSize,
        [int]$HeadlineSize,
        [int]$BodySize,
        [int]$LogoWidth
    )

    $filters = @"
[0:v]trim=duration=6,setpts=PTS-STARTPTS,fps=30,split=2[ob][om];
[ob]scale=${Width}:${Height}:force_original_aspect_ratio=increase,crop=${Width}:${Height},boxblur=28:2[obg];
[om]${OwnerFit}[omain];
[obg][omain]overlay=(W-w)/2:(H-h)/2,drawbox=x=0:y=${Height}*0.73:w=iw:h=${Height}*0.27:color=black@0.72:t=fill,drawtext=fontfile=${bold}:text='¿VAS A SEGUIR MANEJANDO':fontcolor=white:fontsize=${HookSize}:x=(w-text_w)/2:y=${Height}*0.77:enable='between(t,0.2,3.1)',drawtext=fontfile=${bold}:text='CON ESAS LLANTAS?':fontcolor=#ff641f:fontsize=${HeadlineSize}:x=(w-text_w)/2:y=${Height}*0.84:enable='between(t,0.2,3.1)',drawtext=fontfile=${bold}:text='TENEMOS 3 TALLERES':fontcolor=#ff641f:fontsize=${HeadlineSize}:x=(w-text_w)/2:y=${Height}*0.79:enable='between(t,3.1,6)',drawtext=fontfile=${bold}:text='VEN HOY':fontcolor=white:fontsize=${HookSize}:x=(w-text_w)/2:y=${Height}*0.87:enable='between(t,3.1,6)',fade=t=in:st=0:d=0.15,fade=t=out:st=5.75:d=0.25,format=yuv420p[v0];
[1:v]${GraphicFit},pad=${Width}:${Height}:(ow-iw)/2:(oh-ih)/2:color=#050505,zoompan=z='min(zoom+0.0008,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=120:s=${Width}x${Height}:fps=30,trim=duration=4,setpts=PTS-STARTPTS,drawbox=x=0:y=0:w=iw:h=${Height}*0.17:color=black@0.78:t=fill,drawtext=fontfile=${bold}:text='3 UBICACIONES':fontcolor=#ff641f:fontsize=${HeadlineSize}:x=(w-text_w)/2:y=${Height}*0.035,drawtext=fontfile=${bold}:text='SAN JOSÉ + HAYWARD':fontcolor=white:fontsize=${BodySize}:x=(w-text_w)/2:y=${Height}*0.10,fade=t=in:st=0:d=0.18,fade=t=out:st=3.7:d=0.3,format=yuv420p[v1];
color=c=#040404:s=${Width}x${Height}:d=2:r=30[endbg];
[2:v]scale=${LogoWidth}:-2[logofit];
[endbg][logofit]overlay=(W-w)/2:${Height}*0.08:shortest=1,drawtext=fontfile=${bold}:text='ELIGE TU UBICACIÓN':fontcolor=white:fontsize=${HeadlineSize}:x=(w-text_w)/2:y=${Height}*0.56,drawtext=fontfile=${regular}:text='SAN JOSÉ  +  HAYWARD':fontcolor=#ff641f:fontsize=${BodySize}:x=(w-text_w)/2:y=${Height}*0.68,drawtext=fontfile=${bold}:text='tiressosrescue.com':fontcolor=white:fontsize=${BodySize}:x=(w-text_w)/2:y=${Height}*0.80,fade=t=in:st=0:d=0.18,format=yuv420p[v2];
[v0][v1][v2]concat=n=3:v=1:a=0[v];
[0:a]atrim=duration=6,asetpts=PTS-STARTPTS,apad=pad_dur=12[voice];
sine=frequency=98:duration=12:sample_rate=48000,volume=0.025,tremolo=f=2:d=0.85[m0];
sine=frequency=196:duration=12:sample_rate=48000,volume=0.012,tremolo=f=4:d=0.7[m1];
[m0][m1]amix=inputs=2:duration=longest,volume=10,afade=t=in:st=0:d=0.4,afade=t=out:st=11.2:d=0.8[music];
[voice][music]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]
"@

    $output = Join-Path $outDir $Name
    & ffmpeg -y -i $source -loop 1 -i $graphic -loop 1 -i $logo -filter_complex $filters -map '[v]' -map '[a]' -t 12 -c:v libx264 -preset medium -crf 17 -profile:v high -level 4.1 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart $output
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed for $Name" }
}

Invoke-PremiumRender -Name 'tires-sos-interactive-premium-16x9.mp4' -Width 1920 -Height 1080 -OwnerFit 'scale=1920:-2' -GraphicFit 'scale=1920:-2' -HookSize 54 -HeadlineSize 82 -BodySize 46 -LogoWidth 500
Invoke-PremiumRender -Name 'tires-sos-interactive-premium-1x1.mp4' -Width 1080 -Height 1080 -OwnerFit 'scale=1080:-2' -GraphicFit 'scale=1080:-2' -HookSize 44 -HeadlineSize 66 -BodySize 38 -LogoWidth 430
Invoke-PremiumRender -Name 'tires-sos-interactive-premium-9x16.mp4' -Width 1080 -Height 1920 -OwnerFit 'scale=1080:-2' -GraphicFit 'scale=1080:-2' -HookSize 48 -HeadlineSize 72 -BodySize 42 -LogoWidth 620
