param(
 [Parameter(Mandatory=$true)][string]$Executable,
 [Parameter(Mandatory=$true)][string]$EvidenceDir
)
$ErrorActionPreference="Stop"
if(!(Test-Path -LiteralPath $Executable)){throw "Missing packaged desktop EXE"}
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
$report=Join-Path $EvidenceDir "visible-window.json"
$profile=Join-Path $EvidenceDir "visible-window-profile"
New-Item -ItemType Directory -Force -Path $profile | Out-Null
$env:WTW_SMOKE_PHASE="visible"
$env:WTW_SMOKE_REPORT=$report
$env:WTW_SMOKE_USER_DATA=$profile
try{
 Write-Host "Checking that the actual Wire to Wire desktop WINDOW opens and renders"
 $process=Start-Process -FilePath $Executable -PassThru
 $deadline=(Get-Date).AddMinutes(2)
 while(!(Test-Path -LiteralPath $report) -and (Get-Date) -lt $deadline){
  Start-Sleep -Milliseconds 600
  $process.Refresh()
  if($process.HasExited -and $process.ExitCode -ne 0){
   throw "Visible Windows desktop process exited with code $($process.ExitCode)"
  }
 }
 if(!(Test-Path -LiteralPath $report)){
  if(!$process.HasExited){Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue}
  throw "Game did not display a usable window; Windows screenshot proof is missing"
 }
 $data=Get-Content -Raw $report | ConvertFrom-Json
 if($data.phase -ne "visible" -or !$data.windowVisible -or
    $data.bundledOrigin -ne "wtw://game" -or
    $data.gameInterface -ne "ONE_APPROVED_UI" -or
    $data.screenshotBytes -lt 25000 -or
    !(Test-Path (Join-Path $EvidenceDir "wtw-visible-desktop.png"))){
  throw "The desktop window failed visual verification: $(Get-Content -Raw $report)"
 }
 Write-Host "WTW_WINDOWS_ACTUAL_VISIBLE_GAME_WINDOW_PASS"
 try{Wait-Process -Id $process.Id -Timeout 15 -ErrorAction Stop}catch{}
}finally{
 Remove-Item Env:WTW_SMOKE_PHASE -ErrorAction SilentlyContinue
 Remove-Item Env:WTW_SMOKE_REPORT -ErrorAction SilentlyContinue
 Remove-Item Env:WTW_SMOKE_USER_DATA -ErrorAction SilentlyContinue
}
