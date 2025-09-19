#!/usr/bin/env bash
set -Eeuo pipefail

# ========================
# Codehire - Deploy Script
# ========================
# Opções:
#   --pull                 Faz git fetch/checkout/pull do branch (padrão: off)
#   --branch=<nome>        Branch a usar com --pull (padrão: main)
#   --pm2-restart          Tenta restart ao invés de recriar processo (padrão: recriar)
#   -h|--help              Mostra ajuda
#
# Requisitos:
#   - pm2, node, git e pnpm/yarn/npm instalados
#   - backend/.env presente (com DATABASE_URL, AUTH_ACCESS_SECRET, AUTH_REFRESH_SECRET, COOKIE_SECRET etc.)
#
# Observação:
#   Se quiser ativar o frontend depois, descomente o bloco marcado como "FRONTEND".

BRANCH="main"
DO_GIT_PULL=false
PM2_RESTART=false

# ---- parse args ----
while (( "$#" )); do
  case "$1" in
    --branch)
      BRANCH="$2"; shift 2;;
    --branch=*)
      BRANCH="${1#*=}"; shift 1;;
    --pull)
      DO_GIT_PULL=true; shift 1;;
    --seed)
      RUN_SEEDS=true; shift 1;;
    --pm2-restart)
      PM2_RESTART=true; shift 1;;
    -h|--help)
      cat <<EOF

Codehire - Deploy Script

Uso:
  $(basename "$0") [--pull] [--branch=<nome>] [--seed] [--pm2-restart]

Opções:
  --pull             Faz git fetch/checkout/pull do branch (default: off)
  --branch=<nome>    Branch a usar com --pull (default: main)
  --pm2-restart      Tenta restart ao invés de recriar processo PM2 (default: recriar)
  -h, --help         Mostra esta ajuda

EOF
      exit 0;;
    *)
      shift 1;;
  esac
done

# ---- helpers ----
log()  { printf "\n\033[1;36m[deploy]\033[0m %s\n" "$*"; }
warn() { printf "\n\033[1;33m[warn]\033[0m %s\n" "$*"; }
err()  { printf "\n\033[1;31m[error]\033[0m %s\n" "$*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Missing command: $1"
    return 1
  fi
}

detect_pkg_mgr() {
  if [[ -f "pnpm-lock.yaml" ]]; then echo "pnpm"; return 0; fi
  if [[ -f "yarn.lock" ]]; then echo "yarn"; return 0; fi
  echo "npm"
}

pkg_install() {
  local mgr="$1"
  case "$mgr" in
    pnpm) pnpm install ;;
    yarn) yarn install ;;
    npm)  npm ci || npm install ;;
  esac
}

pkg_run() {
  local mgr="$1" script="$2"
  case "$mgr" in
    pnpm) pnpm run "$script" ;;
    yarn) yarn "$script" ;;
    npm)  npm run "$script" ;;
  esac
}

pkg_cmd() {
  # devolve a string para pm2 rodar
  local mgr="$1" script="$2"
  case "$mgr" in
    pnpm) echo "pnpm run $script" ;;
    yarn) echo "yarn $script" ;;
    npm)  echo "npm run $script" ;;
  esac
}

# ---- sanity: commands ----
require_cmd node
require_cmd pm2
require_cmd git || true

log "Iniciando deploy"

# ---- git pull (opcional) ----
if $DO_GIT_PULL; then
  if ! command -v git >/dev/null 2>&1; then
    err "git não encontrado; não posso fazer --pull"
    exit 1
  fi
  log "Atualizando código (branch: $BRANCH)"
  git fetch --all
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  log "Ignorando git pull"
fi

# ---- paths do projeto ----
BACKEND_DIR="backend"
# FRONTEND_DIR="app"   # (FRONTEND) 

if [[ ! -d "$BACKEND_DIR" ]]; then
  err "Pasta backend não encontrada em: $BACKEND_DIR"
  exit 1
fi

log "Backend dir: $BACKEND_DIR"
# log "Frontend dir: $FRONTEND_DIR"  # (FRONTEND)

# =========================
# Backend: deps + migrate
# =========================
pushd "$BACKEND_DIR" >/dev/null

BACK_MGR=$(detect_pkg_mgr)
log "Gerenciador de pacotes (backend): $BACK_MGR"

if [[ ! -f ".env" ]]; then
  warn "backend/.env não encontrado — garanta que a aplicação carregue variáveis corretamente em produção."
fi

log "Instalando dependências do backend"
pkg_install "$BACK_MGR"

log "Executando migrações"
pkg_run "$BACK_MGR" "db:migrate"

# Determina comando de start do backend
BACK_START_SCRIPT="start"
BACK_START_CMD=$(pkg_cmd "$BACK_MGR" "$BACK_START_SCRIPT")
BACK_CWD="$(pwd)"
popd >/dev/null

# =========================
# (FRONTEND) build e start
# =========================
# pushd "$FRONTEND_DIR" >/dev/null
# FRONT_MGR=$(detect_pkg_mgr)
# log "Gerenciador de pacotes (frontend): $FRONT_MGR"
# pkg_install "$FRONT_MGR"
# export NODE_ENV=production
# log "Build frontend"
# pkg_run "$FRONT_MGR" "build"
# FRONT_START_SCRIPT="start"
# FRONT_START_CMD=$(pkg_cmd "$FRONT_MGR" "$FRONT_START_SCRIPT")
# FRONT_CWD="$(pwd)"
# popd >/dev/null

# =========================
# PM2: API (e Web comentado)
# =========================
API_NAME="codehire-api"
# WEB_NAME="codehire-web"   # (FRONTEND)

API_PORT="${CODEHIRE_API_PORT:-3002}"
# WEB_PORT="${CODEHIRE_WEB_PORT:-3000}"  # (FRONTEND)

log "Configurando processo PM2"

if $PM2_RESTART; then
  # Tenta restart mantendo o processo
  pm2 restart "$API_NAME" --update-env || pm2 start bash --name "$API_NAME" -- -lc "cd '$BACK_CWD' && PORT=$API_PORT NODE_ENV=production $BACK_START_CMD"
else
  # Recria processo
  pm2 delete "$API_NAME" >/dev/null 2>&1 || true
  pm2 start bash --name "$API_NAME" -- -lc "cd '$BACK_CWD' && PORT=$API_PORT NODE_ENV=production $BACK_START_CMD"
fi

# (FRONTEND)
# if $PM2_RESTART; then
#   pm2 restart "$WEB_NAME" --update-env || pm2 start bash --name "$WEB_NAME" -- -lc "cd '$FRONT_CWD' && PORT=$WEB_PORT NODE_ENV=production $FRONT_START_CMD"
# else
#   pm2 delete "$WEB_NAME" >/dev/null 2>&1 || true
#   pm2 start bash --name "$WEB_NAME" -- -lc "cd '$FRONT_CWD' && PORT=$WEB_PORT NODE_ENV=production $FRONT_START_CMD"
# fi

pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 | bash || true

log "Deploy finalizado com sucesso ✅"
echo "API: http://localhost:$API_PORT"
# echo "WEB: http://localhost:$WEB_PORT"  # (FRONTEND)

