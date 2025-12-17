#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/web"
python -m http.server 8000 --bind 0.0.0.0
