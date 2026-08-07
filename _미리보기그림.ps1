# 「road」 카톡·검색 미리보기 그림(og.png)에 한 줄 글을 얹는 도구
#
# [왜 파워셸인가]
# 한글은 곧은 막대로 그릴 수 없어서 진짜 글꼴이 필요합니다.
# 윈도우에 이미 들어 있는 글꼴(맑은 고딕)을 빌려 쓰려고 이 도구를 씁니다.
#
# [쓰는 법 — 순서가 중요합니다]
#   node _미리보기그림.js                 # (1) 바탕 · road 글자 · 차선을 그림
#   powershell -File _미리보기그림.ps1     # (2) 그 위에 한 줄 글을 얹음
#
# 글귀를 바꾸려면 아래 $Line 한 줄만 고치면 됩니다.
#
# [주의] 이 파일은 반드시 'BOM 붙은 UTF-8' 로 저장해야 합니다.
#        그 표시가 없으면 윈도우 파워셸이 한글을 깨뜨려 읽어 실행이 멈춥니다.

$Line = "광고 영상, 무료로 만들어 드립니다"
$File = Join-Path $PSScriptRoot "og.png"

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $File)) {
  Write-Host "og.png 가 없습니다. 먼저 'node _미리보기그림.js' 를 돌리세요."
  exit 1
}

# 그림을 통째로 메모리에 읽어 둡니다.
# 파일을 열어 둔 채로 덮어쓰면 '사용 중' 오류가 나기 때문입니다.
$Bytes  = [System.IO.File]::ReadAllBytes($File)
$Stream = New-Object System.IO.MemoryStream(,$Bytes)
$Src    = [System.Drawing.Image]::FromStream($Stream)
$Bmp    = New-Object System.Drawing.Bitmap($Src.Width, $Src.Height)
$G      = [System.Drawing.Graphics]::FromImage($Bmp)
$G.DrawImage($Src, 0, 0, $Src.Width, $Src.Height)
$Src.Dispose(); $Stream.Dispose()

# 글자 가장자리를 부드럽게 (안 하면 계단처럼 우툴두툴합니다)
$G.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$G.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$Cream = [System.Drawing.Color]::FromArgb(251, 244, 233)
$Brush = New-Object System.Drawing.SolidBrush($Cream)

# 글꼴은 컴퓨터마다 있는 것이 달라서, 있는 것부터 차례로 찾아 씁니다
$Names = @("Malgun Gothic", "Gulim", "Segoe UI", "Arial")
$Font = $null
$Used = ""
foreach ($n in $Names) {
  $try = New-Object System.Drawing.Font($n, 34, [System.Drawing.FontStyle]::Bold)
  if ($try.Name -eq $n) { $Font = $try; $Used = $n; break }
  $try.Dispose()
}
if ($null -eq $Font) {
  $Font = New-Object System.Drawing.Font("Arial", 34, [System.Drawing.FontStyle]::Bold)
  $Used = "Arial"
}

# 글자 폭을 재서 한가운데 놓습니다
$Size = $G.MeasureString($Line, $Font)
$X = ($Bmp.Width - $Size.Width) / 2
$Y = 470

$G.DrawString($Line, $Font, $Brush, $X, $Y)

$G.Dispose()
$Bmp.Save($File, [System.Drawing.Imaging.ImageFormat]::Png)
$Bmp.Dispose(); $Brush.Dispose(); $Font.Dispose()

$KB = [math]::Round((Get-Item $File).Length / 1KB, 1)
Write-Host "og.png 에 글을 얹었습니다 · 글꼴 $Used · $KB KB"
