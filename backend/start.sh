#!/bin/sh

if [ "$ENV" = "dev" ]; then
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
  uvicorn main:app --host 0.0.0.0 --port 8000
fi