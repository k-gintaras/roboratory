#!/usr/bin/env bash
set -e

echo "Bootstrapping Roboratory workspace..."

if [ -f package.json ]; then
  echo "Installing root dependencies..."
  npm install
fi

if [ -f .env.example ] && [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — update secrets before running apps."
fi

echo "Bootstrap complete."
