param([ValidateSet('run','test','build')][string]$Action = 'run')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$portableJava = Get-ChildItem -LiteralPath "$projectRoot/.local/tools" -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
$candidates = @()
if ($portableJava) { $candidates += $portableJava.FullName }
if ($env:JAVA_HOME) { $candidates += $env:JAVA_HOME }
$javaHome = $null
foreach ($candidate in $candidates) {
  $javac = Join-Path $candidate 'bin/javac.exe'
  $java = Join-Path $candidate 'bin/java.exe'
  if (-not (Test-Path -LiteralPath $javac) -or -not (Test-Path -LiteralPath $java)) { continue }
  $version = & $javac -version 2>&1 | Out-String
  if ($LASTEXITCODE -eq 0 -and $version.Trim() -match '^javac 21(\.|$)') {
    $javaHome = $candidate
    break
  }
}
if (-not $javaHome) { throw 'JDK 21 não encontrado. Coloque-o em .local/tools/jdk-21* ou configure JAVA_HOME para um JDK 21.' }
$env:JAVA_HOME = $javaHome
$env:PATH = "$(Join-Path $javaHome 'bin');$env:PATH"
$env:MAVEN_USER_HOME = "$projectRoot/.local/maven"
$repoPath = "$projectRoot/.local/maven/repository"
Push-Location "$projectRoot/backend"
try {
  $goal = switch ($Action) { 'run' { 'spring-boot:run' } 'test' { 'test' } 'build' { 'package' } }
  & ./mvnw.cmd "-Dmaven.repo.local=$repoPath" $goal
  if ($LASTEXITCODE -ne 0) { throw "Backend terminou com código $LASTEXITCODE." }
} finally { Pop-Location }
