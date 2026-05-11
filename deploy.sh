#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Habib Bike Showroom — safe redeploy script
#
# What it does (in order):
#   1. Backs up the Postgres database to ./backups/
#   2. Pulls the latest code from git (skip with --no-pull)
#   3. Rebuilds the backend + frontend images
#   4. Recreates ONLY the backend + frontend containers
#      (postgres + its data volume are left completely alone)
#   5. Waits and runs a health check
#
# Usage:
#   ./deploy.sh                # full deploy
#   ./deploy.sh --no-pull      # skip "git pull" (use current checkout)
#   ./deploy.sh --no-backup    # skip DB backup (NOT recommended)
#
# Safety:
#   • Never runs `docker compose down -v` (which would wipe the DB volume).
#   • Uses `--no-deps` so the postgres container is never recreated.
#   • Aborts on any failure (`set -e`).
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

# Always run from the directory this script lives in, regardless of cwd.
cd "$(dirname "$(readlink -f "$0")")"

# ── flags ────────────────────────────────────────────────────────────
DO_PULL=1
DO_BACKUP=1
for arg in "$@"; do
  case "$arg" in
    --no-pull)   DO_PULL=0   ;;
    --no-backup) DO_BACKUP=0 ;;
    -h|--help)
      sed -n '2,22p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg" >&2
      exit 1
      ;;
  esac
done

# ── pick the right docker compose command ────────────────────────────
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "✗ Neither 'docker compose' nor 'docker-compose' is installed." >&2
  exit 1
fi

PG_CONTAINER="habib_postgres"
BACKEND_CONTAINER="habib_backend"
DB_USER="habib"
DB_NAME="habib_showroom"
BACKUP_DIR="./backups"

echo "──────────────────────────────────────────────"
echo " Habib Showroom — deploy"
echo " Time:   $(date '+%Y-%m-%d %H:%M:%S')"
echo " Using:  $DC"
echo "──────────────────────────────────────────────"

# ── 1. backup ────────────────────────────────────────────────────────
if [ "$DO_BACKUP" -eq 1 ]; then
  if docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    mkdir -p "$BACKUP_DIR"
    STAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/backup-${STAMP}.sql"
    echo "→ Backing up database to ${BACKUP_FILE}"
    docker exec "$PG_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  ✓ backup saved (${SIZE})"
  else
    echo "→ Postgres container '${PG_CONTAINER}' not running — skipping backup."
    echo "  (first-time deploy? that's fine — keep going.)"
  fi
else
  echo "→ Skipping DB backup (--no-backup)"
fi

# ── 2. pull ──────────────────────────────────────────────────────────
if [ "$DO_PULL" -eq 1 ]; then
  if [ -d .git ]; then
    echo "→ Pulling latest code"
    git pull --ff-only
  else
    echo "→ Not a git repo — skipping pull."
  fi
else
  echo "→ Skipping git pull (--no-pull)"
fi

# ── 3 + 4. build & recreate apps only ────────────────────────────────
echo "→ Building backend + frontend images"
$DC build backend frontend

echo "→ Recreating backend + frontend (postgres untouched)"
# --no-deps  : do NOT recreate the postgres dependency
# -d         : detached
$DC up -d --no-deps backend frontend

# ── 5. health check ──────────────────────────────────────────────────
echo "→ Waiting for backend to become healthy…"
HEALTHY=0
for i in $(seq 1 30); do
  if curl -fsS http://localhost:8088/api/health >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 1
done

if [ "$HEALTHY" -eq 1 ]; then
  echo "  ✓ backend healthy"
else
  echo "  ✗ backend did not become healthy in 30s" >&2
  echo "  Showing last 40 log lines for diagnosis:" >&2
  $DC logs --tail=40 backend >&2 || true
  exit 1
fi

if curl -fsS -o /dev/null http://localhost:5173; then
  echo "  ✓ frontend serving"
else
  echo "  ⚠ frontend not responding on :5173 (check logs)" >&2
fi

echo "──────────────────────────────────────────────"
echo " ✓ Deploy complete"
echo "   Frontend: http://<server-ip>:5173"
echo "   Backend:  http://<server-ip>:8088/api/health"
echo "──────────────────────────────────────────────"
