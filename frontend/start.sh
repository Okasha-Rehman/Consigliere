#!/bin/sh

if [ "$ENV" = "dev" ]; then
  npm run dev -- --host 0.0.0.0
else
  # Production: nginx already started in CMD
  echo "Production mode: nginx serving static files"
fi