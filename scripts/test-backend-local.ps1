param([string]$JdkHome = $env:JAVA_HOME)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $JdkHome) {
  $available = Get-ChildItem -LiteralPath (Join-Path $env:ProgramFiles 'Java') -Directory -Filter 'jdk-*' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
  if ($available) {
    $JdkHome = $available.FullName
  }
}
if (-not $JdkHome -or -not (Test-Path -LiteralPath (Join-Path $JdkHome 'bin/javac.exe'))) {
  throw 'Informe um JDK 21 ou superior em JAVA_HOME ou -JdkHome.'
}
$testRoot = Join-Path $projectRoot ('work/backend-local-' + [guid]::NewGuid().ToString('N'))
$deps = Join-Path $testRoot 'deps'
$classes = Join-Path $testRoot 'classes'
New-Item -ItemType Directory -Path $deps -Force | Out-Null
New-Item -ItemType Directory -Path $classes -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead((Join-Path $projectRoot 'backend/target/backend-0.0.1-SNAPSHOT.jar'))
try {
  foreach ($entry in $archive.Entries) {
    if ($entry.FullName.StartsWith('BOOT-INF/lib/') -and $entry.FullName.EndsWith('.jar')) {
      $dest = Join-Path $deps ([IO.Path]::GetFileName($entry.FullName))
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
    }
  }
} finally {
  $archive.Dispose()
}
$sources = @(
  Get-ChildItem -LiteralPath (Join-Path $projectRoot 'backend/src/main/java') -Recurse -Filter '*.java' |
    ForEach-Object FullName
)
$sources += Join-Path $PSScriptRoot 'tests/TesteBackendLocal.java'
& (Join-Path $JdkHome 'bin/javac.exe') --release 21 -encoding UTF-8 -cp "$deps/*" -d $classes @sources
if ($LASTEXITCODE -ne 0) {
  throw 'Falha na compilação do teste local.'
}
& (Join-Path $JdkHome 'bin/java.exe') -cp "$classes;$deps/*" TesteBackendLocal $testRoot
if ($LASTEXITCODE -ne 0) {
  throw 'Falha no teste local do backend.'
}
