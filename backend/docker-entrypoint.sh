#!/bin/sh
set -e

echo "🏍️  Habib Showroom backend starting…"
echo "   DB host: ${DB_HOST}:${DB_PORT}"
echo "   DB name: ${DB_NAME}"

# Optional auto-seed: only adds data on a fresh DB (idempotent — safe to run repeatedly).
# Set AUTO_SEED=false in compose to skip.
if [ "${AUTO_SEED:-false}" = "true" ]; then
  echo ""
  echo "📦 AUTO_SEED enabled — running seed (idempotent)…"
  node src/scripts/seed.js || echo "⚠️  Seed failed; continuing to start server anyway."
  echo ""
fi

echo "🚀 Starting API server on port ${PORT:-5050}…"
exec node server.js
