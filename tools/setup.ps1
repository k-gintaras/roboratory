Write-Host "Bootstrapping Roboratory workspace..."

if (Test-Path package.json) {
  Write-Host "Installing root dependencies..."
  npm install
}

if ((Test-Path .env.example) -and -not (Test-Path .env)) {
  Copy-Item -Path .env.example -Destination .env
  Write-Host "Created .env from .env.example — update secrets before running apps."
}

Write-Host "Bootstrap complete."
