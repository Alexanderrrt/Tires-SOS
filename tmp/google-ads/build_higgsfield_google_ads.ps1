$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source = Join-Path $root 'output\higgsfield-ad\higgsfield-source-vertical.mp4'
$graphic = Join-Path $root 'public\storefront-3-locations.png'
$logo = Join-Path $root 'public\logo.jpg'
$outDir = Join-Path $root 'output\higgsfield-ad'
$fontBold = 'Arial Bold'
$fontRegular = 'Arial'

function Invoke-AdRender {
    param(
        [string]$Name,
        [int]$Width,
        [int]$Height,
        [string]$SourceFit,
        [string]$GraphicFit,
        [int]$HeadlineSize,
        [int]$BodySize,
        [int]$SmallSize,
        [int]$LogoWidth
    )

    $filters = @"
[0:v]trim=duration=4.2,setpts=PTS-STARTPTS,fps=30,split=2[srcblur][srcmain];
[srcblur]scale=${Width}:${Height}:force_original_aspect_ratio=increase,crop=${Width}:${Height},boxblur=24:2[srcbg];
[srcmain]${SourceFit}[srcfit];
[srcbg][srcfit]overlay=(W-w)/2:(H-h)/2,drawbox=x=0:y=0:w=iw:h=220:color=black@0.68:t=fill,drawtext=font='${fontBold}':text='3 UBICACIONES':fontcolor=#ff641f:fontsize=${HeadlineSize}:x=(w-text_w)/2:y=48,drawtext=font='${fontBold}':text='SAN JOSÉ + HAYWARD':fontcolor=white:fontsize=${BodySize}:x=(w-text_w)/2:y=132,fade=t=in:st=0:d=0.25,fade=t=out:st=3.9:d=0.3,format=yuv420p[v0];
[1:v]${GraphicFit},setsar=1[graphic];
color=c=#070707:s=${Width}x${Height}:d=4.6:r=30[gbg];
[gbg][graphic]overlay=(W-w)/2:(H-h)/2:shortest=1,drawbox=x=0:y=0:w=iw:h=150:color=black@0.72:t=fill,drawtext=font='${fontBold}':text='TRES TALLERES. UNA SOLA CONFIANZA.':fontcolor=white:fontsize=${BodySize}:x=(w-text_w)/2:y=48,fade=t=in:st=0:d=0.25,fade=t=out:st=4.3:d=0.3,format=yuv420p[v1];
color=c=#050505:s=${Width}x${Height}:d=2.7:r=30[endbg];
[2:v]scale=${LogoWidth}:-2[logofit];
[endbg][logofit]overlay=(W-w)/2:${Height}*0.10:shortest=1,drawtext=font='${fontBold}':text='LLANTAS  FRENOS  RINES':fontcolor=#ff641f:fontsize=${BodySize}:x=(w-text_w)/2:y=${Height}*0.48,drawtext=font='${fontRegular}':text='CAMBIO DE ACEITE':fontcolor=white:fontsize=${BodySize}:x=(w-text_w)/2:y=${Height}*0.57,drawtext=font='${fontBold}':text='ENCUENTRA TU TALLER MÁS CERCANO':fontcolor=white:fontsize=${SmallSize}:x=(w-text_w)/2:y=${Height}*0.70,drawtext=font='${fontBold}':text='tiressosrescue.com':fontcolor=#ff641f:fontsize=${BodySize}:x=(w-text_w)/2:y=${Height}*0.80,fade=t=in:st=0:d=0.25,format=yuv420p[v2];
[v0][v1][v2]concat=n=3:v=1:a=0[v];
sine=frequency=98:duration=11.5:sample_rate=48000,volume=0.035,tremolo=f=2:d=0.85[a0];
sine=frequency=196:duration=11.5:sample_rate=48000,volume=0.018,tremolo=f=4:d=0.7[a1];
[a0][a1]amix=inputs=2:duration=longest,volume=35,afade=t=in:st=0:d=0.4,afade=t=out:st=10.7:d=0.8[a]
"@

    $output = Join-Path $outDir $Name
    & ffmpeg -y -i $source -loop 1 -i $graphic -loop 1 -i $logo -filter_complex $filters -map '[v]' -map '[a]' -t 11.5 -c:v libx264 -preset medium -crf 18 -profile:v high -level 4.1 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart $output
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed for $Name" }
}

Invoke-AdRender -Name 'tires-sos-3-locations-vertical-9x16.mp4' -Width 1080 -Height 1920 -SourceFit 'scale=1080:-2' -GraphicFit 'scale=1080:-2' -HeadlineSize 92 -BodySize 54 -SmallSize 38 -LogoWidth 620
Invoke-AdRender -Name 'tires-sos-3-locations-square-1x1.mp4' -Width 1080 -Height 1080 -SourceFit 'scale=1080:-2' -GraphicFit 'scale=1080:-2' -HeadlineSize 76 -BodySize 44 -SmallSize 32 -LogoWidth 430
Invoke-AdRender -Name 'tires-sos-3-locations-landscape-16x9.mp4' -Width 1920 -Height 1080 -SourceFit 'scale=1440:-2' -GraphicFit 'scale=1920:-2' -HeadlineSize 78 -BodySize 48 -SmallSize 36 -LogoWidth 440
