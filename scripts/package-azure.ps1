$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build falhou.' }
$stage = Join-Path $root ('.azure/package-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force "$stage/backend/dist", "$stage/frontend/dist" | Out-Null
Get-ChildItem backend/src -Filter '*.ts' | ForEach-Object { Copy-Item (Join-Path "$root/backend/dist" ($_.BaseName + '.js')) "$stage/backend/dist" -Force }
Copy-Item frontend/dist/* "$stage/frontend/dist" -Recurse -Force
$backendPackage = Get-Content backend/package.json -Raw | ConvertFrom-Json
$manifest = @{ name='avaliatech-azure'; version='1.0.0'; private=$true; type='module'; engines=@{node='24.x'}; scripts=@{start='node backend/dist/server.js'}; dependencies=$backendPackage.dependencies }
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText("$stage/package.json", ($manifest | ConvertTo-Json -Depth 5), $utf8)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [IO.File]::Open("$root/.azure/deploy.zip", [IO.FileMode]::Create)
$archive = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $stage -Recurse -File | ForEach-Object {
    $entry = $_.FullName.Substring($stage.Length + 1).Replace('\', '/')
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entry) | Out-Null
  }
} finally { $archive.Dispose(); $stream.Dispose() }
Write-Output 'Pacote criado: .azure/deploy.zip (sem .env e credenciais).'
