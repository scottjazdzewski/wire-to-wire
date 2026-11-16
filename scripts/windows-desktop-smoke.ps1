param(
 [Parameter(Mandatory=$true)][string]$Executable,
 [Parameter(Mandatory=$true)][string]$EvidenceDir,
 [string]$TargetLabel = "unpacked"
)
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
if(!(Test-Path -LiteralPath $Executable)){ throw "Missing packaged Windows EXE: $Executable" }
$statePath=Join-Path $EvidenceDir "shared-user-data"
$writeReport=Join-Path $EvidenceDir "$TargetLabel-write.json"
$readReport=Join-Path $EvidenceDir "$TargetLabel-read.json"
New-Item -ItemType Directory -Force -Path $statePath | Out-Null

foreach($step in @(@("write",$writeReport),@("read",$readReport))){
 $phase=$step[0];$report=$step[1]
 $arguments=@(
   "--wtw-smoke=$phase",
   "--wtw-smoke-report=$report",
   "--wtw-smoke-user-data=$statePath"
 )
 Write-Host "Starting $TargetLabel $phase desktop run: $Executable"
 # The electron-builder portable wrapper sometimes consumes CLI args. Environment
 # settings are inherited by its extracted child; set them for either target.
 $env:WTW_SMOKE_PHASE=$phase
 $env:WTW_SMOKE_REPORT=$report
 $env:WTW_SMOKE_USER_DATA=$statePath
 $launcherStartedAtUtc=Get-Date
 $launcherTimer=[Diagnostics.Stopwatch]::StartNew()
 try{
   $process=Start-Process -FilePath $Executable -ArgumentList $arguments -PassThru
   # Some portable wrappers exit before their extracted Electron child and
   # some wait for it. The child's authenticated JSON handshake is definitive,
   # not the wrapper's PID or command-line forwarding.
   $deadline=(Get-Date).AddMinutes(3)
   while(!(Test-Path -LiteralPath $report) -and (Get-Date) -lt $deadline){
     Start-Sleep -Milliseconds 750
     $process.Refresh()
     if($process.HasExited -and $process.ExitCode -ne 0){
       throw "Packaged desktop wrapper failed: $phase exit=$($process.ExitCode)"
     }
   }
   if(!(Test-Path -LiteralPath $report)){
     if(!$process.HasExited){Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue}
     throw "Desktop process did not report an offline startup/save result for $phase"
   }
   # The main Electron child terminates immediately after writing the report.
   # A brief drain avoids a profile lock before the second launch.
   try{Wait-Process -Id $process.Id -Timeout 15 -ErrorAction Stop}catch{}
 }finally{
   Remove-Item Env:WTW_SMOKE_PHASE -ErrorAction SilentlyContinue
   Remove-Item Env:WTW_SMOKE_REPORT -ErrorAction SilentlyContinue
   Remove-Item Env:WTW_SMOKE_USER_DATA -ErrorAction SilentlyContinue
 }
 $launcherTimer.Stop()
 $proof=Get-Content -Raw $report|ConvertFrom-Json
 if(!$proof.startup -or $proof.startup.totalMs -le 0 -or
    $proof.startup.gameUIReady -le 0 -or
    $proof.startup.gameUIReady -gt $proof.startup.totalMs){
  throw "Packaged desktop startup timing evidence is missing or inconsistent: $(Get-Content -Raw $report)"
 }
 $proof | Add-Member -Force -NotePropertyName launcherToGameReadyMs -NotePropertyValue $launcherTimer.ElapsedMilliseconds
 $proof | Add-Member -Force -NotePropertyName launcherStartedAtUtc -NotePropertyValue $launcherStartedAtUtc.ToUniversalTime().ToString('o')
 [IO.File]::WriteAllText($report,($proof|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
 if($proof.bundledOrigin -ne "wtw://game" -or
    $proof.gameDate -ne "1999-01-01" -or
    $proof.gameInterface -ne "ONE_APPROVED_UI"){
  throw "Wrong game UI/clock/origin in packaged $phase proof: $(Get-Content -Raw $report)"
 }
 if($phase -eq "read" -and $proof.appLocalStorageReopen -ne "VERIFIED"){
  throw "Per-user local origin did not survive process exit/restart"
 }
 if($phase -eq "read" -and $proof.desktopCompactCareerStoreReopen -ne "VERIFIED"){
  throw "Desktop-owned compact career data did not survive process exit/restart"
 }
 Write-Host "WTW_WINDOWS_DESKTOP_PROCESS_$($phase.ToUpperInvariant())_PASS"
 Write-Host "WTW_WINDOWS_LAUNCH_TO_GAME_READY_MS $($proof.launcherToGameReadyMs)"
 Write-Host "WTW_ELECTRON_PROCESS_TO_GAME_READY_MS $([Math]::Round($proof.startup.gameUIReady))"
}
Write-Host "WTW_WINDOWS_DESKTOP_REOPEN_PASS $TargetLabel"
