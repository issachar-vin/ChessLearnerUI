#!/bin/sh
# Replace the build-time sentinel with the runtime VITE_API_URL so a single
# published image can target any backend. Empty value falls back to the app
# default (see src/services/api.ts).
set -eu

api_url="${VITE_API_URL:-}"
# Escape characters that are special in the sed replacement (| is the delimiter).
escaped=$(printf '%s' "$api_url" | sed -e 's/[&|\\]/\\&/g')

find /usr/share/nginx/html/assets -type f -name '*.js' -exec \
    sed -i "s|__VITE_API_URL__|${escaped}|g" {} +
