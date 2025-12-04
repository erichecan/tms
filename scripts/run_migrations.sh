#!/usr/bin/env bash
# 2025-11-11T15:09:32Z Added by Assistant: Automated migration runner

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/database_migrations"

usage() {
  cat <<'EOF'
Usage: run_migrations.sh [--database-url <url>] [--dry-run] [--ci]

Environment:
  DATABASE_URL   PostgreSQL connection string (required unless --dry-run)

Options:
  --database-url  Override DATABASE_URL via flag.
  --dry-run       List pending migrations without executing.
  --ci            Force non-interactive mode suitable for CI (no prompts).
EOF
}

DATABASE_URL_FLAG=""
DRY_RUN=false
CI_MODE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --database-url)
      DATABASE_URL_FLAG="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d "${MIGRATIONS_DIR}" ]]; then
  echo "Migration directory not found: ${MIGRATIONS_DIR}" >&2
  exit 1
fi

DATABASE_URL="${DATABASE_URL_FLAG:-${DATABASE_URL:-}}"

if [[ "${DRY_RUN}" == "false" && -z "${DATABASE_URL}" ]]; then
  echo "DATABASE_URL is required unless --dry-run is specified." >&2
  exit 1
fi

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log() {
  echo "$(timestamp) [run_migrations] $*"
}

psql_exec() {
  local sql="$1"
  if command -v psql >/dev/null 2>&1; then
    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -qAt -c "${sql}"
  else
    docker run --rm -e DATABASE_URL="${DATABASE_URL}" \
      -v "${MIGRATIONS_DIR}:/migrations:ro" postgres:15-alpine \
      psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -qAt -c "${sql}"
  fi
}

run_file() {
  local file="$1"
  if command -v psql >/dev/null 2>&1; then
    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${file}"
  else
    docker run --rm -e DATABASE_URL="${DATABASE_URL}" \
      -v "${MIGRATIONS_DIR}:/migrations:ro" postgres:15-alpine \
      psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "/migrations/$(basename "${file}")"
  fi
}

if [[ "${DRY_RUN}" == "true" ]]; then
  log "Dry run mode. Pending migrations:"
else
  log "Starting migrations"
fi

if [[ "${DRY_RUN}" == "false" ]]; then
  log "Ensuring schema_migrations table exists"
  psql_exec "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW());"
fi

PENDING=()

for file in "${MIGRATIONS_DIR}"/*.sql; do
  [[ -e "$file" ]] || continue
  filename="$(basename "${file}")"
  if [[ "${DRY_RUN}" == "false" ]]; then
    applied="$(psql_exec "SELECT 1 FROM schema_migrations WHERE filename='${filename}'" || true)"
    if [[ -n "${applied}" ]]; then
      log "Skipping already applied migration: ${filename}"
      continue
    fi
  fi
  PENDING+=("${file}")
done

if [[ ${#PENDING[@]} -eq 0 ]]; then
  log "No pending migrations."
  exit 0
fi

log "Found ${#PENDING[@]} pending migrations."

if [[ "${DRY_RUN}" == "true" ]]; then
  printf '%s\n' "${PENDING[@]}"
  exit 0
fi

if [[ "${CI_MODE}" == "false" ]]; then
  read -rp "Apply ${#PENDING[@]} migrations? [y/N] " confirm
  if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    log "Aborted by user."
    exit 1
  fi
fi

for file in "${PENDING[@]}"; do
  filename="$(basename "${file}")"
  log "Applying ${filename}"
  run_file "${file}"
  log "Recording ${filename}"
  psql_exec "INSERT INTO schema_migrations (filename) VALUES ('${filename}') ON CONFLICT (filename) DO NOTHING;"
done

log "All pending migrations applied successfully."

