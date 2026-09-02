#!/usr/bin/env bash
#
# Install the 1lev1 scheduler on an Ubuntu box, checking as it goes.
#
# Run it ON the server, as root:
#     sudo bash install-remote.sh
#
# It is safe to re-run: every step is idempotent, and it deliberately stops
# short of starting the service — the last line tells you how, once you have
# read the checks above it.
#
# Nothing here ever prints a secret. Where a key has to be proved present, it
# is shown as a length and a short hash, never as itself.

set -uo pipefail

INSTALL_DIR=${INSTALL_DIR:-/opt/1lev1-scheduler}
STATE_DIR=${STATE_DIR:-/var/lib/1lev1-scheduler}
UNIT=/etc/systemd/system/1lev1-scheduler.service
BASE_URL=${SCHEDULER_BASE_URL:-http://127.0.0.1:3000}
TZ_WANT=${TZ_WANT:-Asia/Jerusalem}

SRC_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

ok()   { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$*"; }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; FAILED=1; }
step() { printf '\n\033[36m==> %s\033[0m\n' "$*"; }
FAILED=0

step "Who and where"
echo "  host   : $(hostname)"
echo "  os     : $(. /etc/os-release && echo "$PRETTY_NAME")"
echo "  time   : $(date -Is)  (tz $(timedatectl show -p Timezone --value 2>/dev/null || echo unknown))"
if [ "$(timedatectl show -p Timezone --value 2>/dev/null)" != "$TZ_WANT" ]; then
  warn "system timezone is not $TZ_WANT — the unit sets TZ for the scheduler itself, so this is fine, but keep it in mind when reading logs"
fi

step "Node on the host"
NODE_BIN=$(command -v node 2>/dev/null || true)
HOST_NODE=0
if [ -n "$NODE_BIN" ]; then
  NODE_V=$(node --version)
  NODE_MAJOR=${NODE_V#v}; NODE_MAJOR=${NODE_MAJOR%%.*}
  if [ "$NODE_MAJOR" -ge 18 ]; then
    HOST_NODE=1
    ok "node $NODE_V at $NODE_BIN"
  else
    warn "node $NODE_V is too old for the systemd unit (needs 18+ for built-in fetch)"
  fi
else
  warn "no node on the host — the systemd unit cannot run here"
fi

if [ "$HOST_NODE" = 0 ]; then
  # A box that runs everything in docker has no business growing a host node
  # just for this. The compose service is the better home there anyway: it
  # travels with docker-compose.api.yml, so moving servers stays a copy.
  if command -v docker >/dev/null 2>&1; then
    ok "docker is present — use the compose service instead of systemd (see below)"
    DOCKER_MODE=1
  else
    bad "neither node 18+ nor docker is available — nothing here can run the scheduler"
  fi
fi

step "The API's .env (where the secrets come from)"
ENV_FILE=""
for c in /home/ubuntu/api/.env /opt/1lev1/api/.env /opt/1lev1/.env /home/ubuntu/.env; do
  [ -f "$c" ] && { ENV_FILE=$c; break; }
done
if [ -z "$ENV_FILE" ]; then
  bad "no .env found in the usual places — set ENV_FILE=/path/to/.env and re-run"
else
  ok "using $ENV_FILE"
  # Proof of presence only: a length and a short hash, never the value.
  for var in ADMINMONTHER STRAPI_URL; do
    line=$(grep -E "^\s*(export\s+)?$var\s*=" "$ENV_FILE" | head -1 || true)
    val=${line#*=}; val=$(printf '%s' "$val" | tr -d '\r' | sed -e 's/^ *//' -e 's/ *$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
    if [ -z "$val" ]; then
      if [ "$var" = ADMINMONTHER ]; then bad "$var is missing — the monthly close cannot authenticate without it"
      else warn "$var is missing"; fi
    elif [ "$var" = STRAPI_URL ]; then
      ok "$var = $val"
    else
      ok "$var present (${#val} chars, sha256 $(printf '%s' "$val" | sha256sum | cut -c1-12))"
    fi
  done
  CRON_LINE=$(grep -E "^\s*(export\s+)?CRON_SECRET\s*=" "$ENV_FILE" | head -1 || true)
  [ -n "$CRON_LINE" ] && ok "CRON_SECRET present (the maagad job will send it)" || warn "CRON_SECRET not set — fine unless the maagad endpoint requires it"
fi

step "Is the API answering on $BASE_URL ?"
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$BASE_URL/api/health" || echo 000)
if [ "$HEALTH" = 200 ]; then ok "GET /api/health -> 200"
else bad "GET /api/health -> $HEALTH (is the sveltekit-api container up? docker ps)"; fi

step "Does the monthly close actually require its key?"
NOKEY=$(curl -s -o /dev/null -w '%{http_code}' -m 30 "$BASE_URL/api/monthi?dry=1" || echo 000)
if [ "$NOKEY" = 401 ]; then
  ok "without a key -> 401 (the endpoint is closed)"
elif [ "$NOKEY" = 200 ]; then
  bad "without a key -> 200. The deployed API predates the key check, which also means it predates the ledger rewrite this scheduler relies on. Deploy the current image first (deploy-api.ps1), then re-run this."
else
  warn "without a key -> $NOKEY (unexpected; check the API logs)"
fi

if [ -n "${ENV_FILE:-}" ]; then
  KEY=$(grep -E "^\s*(export\s+)?ADMINMONTHER\s*=" "$ENV_FILE" | head -1 | sed -e 's/^[^=]*=//' -e 's/\r//' -e 's/^ *//' -e 's/ *$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
  if [ -n "$KEY" ]; then
    BODY=$(curl -s -m 300 -H "x-monthi-key: $KEY" "$BASE_URL/api/monthi?dry=1" || echo '')
    if printf '%s' "$BODY" | grep -q '"dry":true'; then
      ok "with the key -> a dry run came back:"
      printf '        %s\n' "$BODY"
    else
      bad "with the key -> unexpected answer: ${BODY:-<empty>}"
    fi
  fi
fi

if [ "${DOCKER_MODE:-0}" = 1 ]; then
  step "Timezone of the API container (this is the one that decides months)"
  API_TZ=$(docker exec sveltekit-api sh -c 'echo -n "$TZ"' 2>/dev/null || echo '')
  if [ "$API_TZ" = "$TZ_WANT" ]; then
    ok "sveltekit-api runs in $API_TZ"
  else
    bad "sveltekit-api runs in ${API_TZ:-UTC (no TZ set)}, not $TZ_WANT. Every month boundary in the app is computed in LOCAL time, so this shifts them by the UTC offset: work logged late on the 1st is filed to the previous month, and a recurring cycle opened at 00:00 local reads as the previous month — so the monthly close opens a SECOND cycle for a month that already has one. docker-compose.api.yml now sets TZ; redeploy before starting the scheduler."
  fi

  echo ""
  if [ "$FAILED" = 1 ]; then
    printf '\033[31m==> Something above failed. Fix it before starting the scheduler.\033[0m\n'
    exit 1
  fi
  printf '\033[32m==> Everything checks out. The scheduler is a compose service here, not systemd.\033[0m\n'
  cat <<EOF

This box has no host node, so the scheduler runs as a container beside the API.
It ships with the deploy: docker-compose.api.yml declares it and deploy-api.ps1
uploads scheduler.mjs next to the compose file. So from your machine:

    .\\deploy-api.ps1

Then, on the server:

    cd /home/ubuntu/api
    docker compose -f docker-compose.api.yml up -d scheduler
    docker logs -f 1lev1-scheduler

Before letting it loose, one dry pass in the same container:

    docker compose -f docker-compose.api.yml run --rm scheduler node /app/scheduler.mjs --status
    docker compose -f docker-compose.api.yml run --rm scheduler node /app/scheduler.mjs --once --dry
EOF
  exit 0
fi

step "Installing to $INSTALL_DIR"
install -d -m 755 "$INSTALL_DIR"
install -d -m 755 "$STATE_DIR"
install -m 755 "$SRC_DIR/scheduler.mjs" "$INSTALL_DIR/scheduler.mjs" && ok "scheduler.mjs"
[ -f "$SRC_DIR/README.md" ] && install -m 644 "$SRC_DIR/README.md" "$INSTALL_DIR/README.md" && ok "README.md"

# The unit is written here rather than copied, so the paths it points at are the
# ones actually found above — a unit with a wrong path fails silently at 03:00
# on the 1st, which is the worst possible time to find out. Refusing to write it
# at all beats writing one with an empty ExecStart that systemd will reject.
step "Writing $UNIT"
if [ -z "$NODE_BIN" ]; then
  bad "no node binary to point ExecStart at — not writing the unit"
else
  sed -e "s#^Environment=SCHEDULER_ENV_FILE=.*#Environment=SCHEDULER_ENV_FILE=${ENV_FILE}#" \
      -e "s#^Environment=SCHEDULER_BASE_URL=.*#Environment=SCHEDULER_BASE_URL=${BASE_URL}#" \
      -e "s#^Environment=SCHEDULER_STATE_FILE=.*#Environment=SCHEDULER_STATE_FILE=${STATE_DIR}/state.json#" \
      -e "s#^Environment=TZ=.*#Environment=TZ=${TZ_WANT}#" \
      -e "s#^WorkingDirectory=.*#WorkingDirectory=${INSTALL_DIR}#" \
      -e "s#^ExecStart=.*#ExecStart=${NODE_BIN} ${INSTALL_DIR}/scheduler.mjs#" \
      -e "s#^ReadWritePaths=.*#ReadWritePaths=${STATE_DIR}#" \
      "$SRC_DIR/1lev1-scheduler.service" > "$UNIT"
  ok "unit written, pointing at $ENV_FILE"
  grep -E '^(Environment|ExecStart|WorkingDirectory)=' "$UNIT" | sed 's/^/        /'
  systemctl daemon-reload && ok "systemd reloaded"

  step "What the scheduler thinks right now"
  env SCHEDULER_ENV_FILE="$ENV_FILE" SCHEDULER_BASE_URL="$BASE_URL" \
      SCHEDULER_STATE_FILE="$STATE_DIR/state.json" TZ="$TZ_WANT" \
      "$NODE_BIN" "$INSTALL_DIR/scheduler.mjs" --status | sed 's/^/  /'

  step "A dry pass — nothing is written, nothing matures"
  env SCHEDULER_ENV_FILE="$ENV_FILE" SCHEDULER_BASE_URL="$BASE_URL" \
      SCHEDULER_STATE_FILE="$STATE_DIR/state.json" TZ="$TZ_WANT" \
      "$NODE_BIN" "$INSTALL_DIR/scheduler.mjs" --once --dry | sed 's/^/  /'
fi

echo ""
if [ "$FAILED" = 1 ]; then
  printf '\033[31m==> Something above failed. Fix it before starting the service.\033[0m\n'
  exit 1
fi

printf '\033[32m==> Installed and checked. Nothing is running yet.\033[0m\n'
cat <<EOF

To start it:
    sudo systemctl enable --now 1lev1-scheduler
    journalctl -u 1lev1-scheduler -f

The first pass runs timegrama immediately (it has never run on this box), then
monthi if this month is not closed yet, then maagad. If you would rather see
the maturation clock on its own first:

    sudo env SCHEDULER_ENV_FILE=$ENV_FILE SCHEDULER_BASE_URL=$BASE_URL \\
        SCHEDULER_STATE_FILE=$STATE_DIR/state.json TZ=$TZ_WANT \\
        $NODE_BIN $INSTALL_DIR/scheduler.mjs --run timegrama
EOF
