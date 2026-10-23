param([ValidateSet('run', 'test', 'build')][string]$Action = 'run')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$readyJar = Join-Path $projectRoot 'backend/target/backend-0.0.1-SNAPSHOT.jar'
function Test-BuiltJarCurrent {
  if (-not (Test-Path -LiteralPath $readyJar)) {
    return $false
  }
  $builtAt = (Get-Item -LiteralPath $readyJar).LastWriteTime
  $inputs = @((Get-Item -LiteralPath "$projectRoot/backend/pom.xml"))
  $inputs += Get-ChildItem -LiteralPath "$projectRoot/backend/src/main" -Recurse -File
  return -not ($inputs | Where-Object LastWriteTime -gt $builtAt | Select-Object -First 1)
}
$portableJava = Get-ChildItem -LiteralPath "$projectRoot/.local/tools" -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending |
  Select-Object -First 1
$candidates = @()
if ($portableJava) {
  $candidates += $portableJava.FullName
}
if ($env:JAVA_HOME) {
  $candidates += $env:JAVA_HOME
}
if ($env:ProgramFiles) {
  $installedJdks = Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'Java') -Directory -Filter 'jdk-*' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending
  foreach ($installedJdk in $installedJdks) {
    $candidates += $installedJdk.FullName
  }
}

# O instalador do Java no Windows pode disponibilizar java/javac no PATH sem
# preencher JAVA_HOME. Lemos java.home para aproveitar esse JDK instalado.
$systemJava = Get-Command java -ErrorAction SilentlyContinue
if ($systemJava) {
  # Java escreve -XshowSettings em stderr mesmo quando termina com sucesso.
  # No Windows PowerShell 5, ErrorActionPreference=Stop trataria isso como falha.
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $javaProperties = & $systemJava.Source -XshowSettings:properties -version 2>&1 | Out-String
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($javaProperties -match '(?m)^\s*java\.home\s*=\s*(.+)\s*$') {
    $candidates += $Matches[1].Trim()
  }
}
$javaHome = $null
foreach ($candidate in $candidates) {
  $javac = Join-Path $candidate 'bin/javac.exe'
  $java = Join-Path $candidate 'bin/java.exe'
  if (-not (Test-Path -LiteralPath $javac) -or -not (Test-Path -LiteralPath $java)) {
    continue
  }
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $version = & $javac -version 2>&1 | Out-String
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($LASTEXITCODE -eq 0 -and $version.Trim() -match '^javac (\d+)' -and [int]$Matches[1] -ge 21) {
    $javaHome = $candidate
    break
  }
}
if (-not $javaHome) {
  $availableJava = Get-Command java -ErrorAction SilentlyContinue
  if ($Action -eq 'run' -and (Test-BuiltJarCurrent) -and $availableJava) {
    Write-Host 'JDK 21 não encontrado. Iniciando o backend compilado em target.'
    Push-Location "$projectRoot/backend"
    try {
      & $availableJava.Source -jar $readyJar
      if ($LASTEXITCODE -ne 0) {
        throw "Backend terminou com código $LASTEXITCODE."
      }
    } finally {
      Pop-Location
    }
    return
  }
  throw 'JDK 21 não encontrado. Coloque-o em .local/tools/jdk-21* ou configure JAVA_HOME para um JDK 21.'
}
$env:JAVA_HOME = $javaHome
$env:PATH = "$(Join-Path $javaHome 'bin');$env:PATH"
$env:MAVEN_USER_HOME = "$projectRoot/.local/maven"
$repoPath = "$projectRoot/.local/maven/repository"
if ($Action -eq 'run' -and (Test-BuiltJarCurrent)) {
  Write-Host 'Iniciando o backend compilado incluído no projeto.'
  Push-Location "$projectRoot/backend"
  try {
    & (Join-Path $javaHome 'bin/java.exe') -jar $readyJar
    if ($LASTEXITCODE -ne 0) {
      throw "Backend terminou com código $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
  return
}
Push-Location "$projectRoot/backend"
try {
  $goal = switch ($Action) {
    'run' { 'spring-boot:run' }
    'test' { 'test' }
    'build' { 'package' }
  }
  & ./mvnw.cmd "-Dmaven.repo.local=$repoPath" $goal
  if ($LASTEXITCODE -ne 0) {
    throw "Backend terminou com código $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
