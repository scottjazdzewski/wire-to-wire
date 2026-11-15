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
 $process=Start-Process -FilePath $Executable -ArgumentList $arguments -PassThru -Wait
 if($process.ExitCode -ne 0){ throw "Packaged desktop run failed: $phase exit=$($process.ExitCode)" }
 if(!(Test-Path -LiteralPath $report)){throw "Missing smoke evidence for $phase"}
 $proof=Get-Content -Raw $report|ConvertFrom-Json
 if($proof.bundledOrigin -ne "wtw://game" -or
    $proof.gameDate -ne "1999-01-01" -or
    $proof.gameInterface -ne "ONE_APPROVED_UI"){
  throw "Wrong game UI/clock/origin in packaged $phase proof: $(Get-Content -Raw $report)"
 }
 if($phase -eq "read" -and $proof.appLocalStorageReopen -ne "VERIFIED"){
  throw "Per-user local origin did not survive process exit/restart"
 }
 Write-Host "WTW_WINDOWS_DESKTOP_PROCESS_$($phase.ToUpperInvariant())_PASS"
}
Write-Host "WTW_WINDOWS_DESKTOP_REOPEN_PASS $TargetLabel"
