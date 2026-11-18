#!/usr/bin/env bash
# api-switch.sh <image-tag>
#
# Zero-downtime replacement of the SvelteKit API on the VPS
# (docs/inprogress/PLAN_VPS_ONLY.md V2). deploy-api.ps1 uploads this next to
# docker-compose.api.yml and runs it after the image is on GHCR (or loaded
# from a tarball).
#
# The API has two colours, sveltekit-api-a and sveltekit-api-b; only one runs
# between deploys. Both carry the network alias `sveltekit-api`, which is the
# only name nginx and the scheduler use. So the switch is:
#
#   1. start the idle colour on the new tag      (old one keeps serving)
#   2. wait until its healthcheck says healthy   (failure: remove it, stop here,
#                                                 the old one never stopped)
#   3. wait out nginx's resolver cache (10s)     (both colours answer)
#   4. stop the old colour, gracefully           (adapter-node drains on SIGTERM)
#   5. check api.1lev1.com through nginx
#   6. check the scheduler: up, on the uploaded scheduler.mjs, reaching the
#      API, and every job on time (scheduler.mjs --check). Exit 2 if not.
#
# For a few seconds both processes serve. That is the price of no gap: the
# relay log, OAuth codes and the MCP rate limit are per process, and each of
# them already starts empty on every restart, which is what this replaces.
#
# Rollback = run it again with the previous tag (deploy-api.ps1 -SkipBuild -Tag <sha>).

set -euo pipefail

TAG="${1:?usage: api-switch.sh <image-tag>}"
cd "$(dirname "$0")"

export API_TAG="$TAG"
IMAGE="ghcr.io/avi-adam/1lev1-sveltekit-api:$TAG"
DC=(docker compose -f docker-compose.api.yml)
HEALTH_WAIT=120     # seconds for the new colour to turn healthy
RESOLVER_WAIT=12    # nginx: resolver 127.0.0.11 valid=10s (1.0b nginx/nginx.conf)

running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }

# ---- which colour is live? -------------------------------------------------
# `sveltekit-api` is the single container from before V2; the first V2 deploy
# retires it exactly like a colour.
if running sveltekit-api-a; then
    LIVE=sveltekit-api-a; NEXT=b
elif running sveltekit-api-b; then
    LIVE=sveltekit-api-b; NEXT=a
elif running sveltekit-api; then
    LIVE=sveltekit-api; NEXT=a
else
    LIVE=""; NEXT=a
fi
NEW="sveltekit-api-$NEXT"
echo "live: ${LIVE:-none}   new: $NEW   image: $IMAGE"

# ---- image -----------------------------------------------------------------
# A -Tarball deploy has already loaded it; otherwise pull from GHCR.
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    docker pull "$IMAGE"
fi

# ---- the services beside the API -------------------------------------------
# No-op unless their definition changed (compose v2 only recreates what did).
"${DC[@]}" up -d --no-deps postgres vector scheduler

# ---- 1. start the idle colour ----------------------------------------------
"${DC[@]}" --profile "$NEXT" up -d --no-deps --force-recreate "$NEW"

# ---- 2. wait for it ----------------------------------------------------------
deadline=$(( $(date +%s) + HEALTH_WAIT ))
status=starting
while [ "$(date +%s)" -lt "$deadline" ]; do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$NEW" 2>/dev/null || echo missing)
    [ "$status" = "healthy" ] && break
    if [ "$status" = "unhealthy" ] || [ "$status" = "missing" ]; then break; fi
    sleep 2
done

if [ "$status" != "healthy" ]; then
    echo "ERROR: $NEW is '$status' after ${HEALTH_WAIT}s — recent logs:"
    docker logs --tail 60 "$NEW" 2>&1 || true
    docker rm -f "$NEW" >/dev/null 2>&1 || true
    echo "removed $NEW; ${LIVE:-nothing} is still serving, untouched."
    exit 1
fi
echo "$NEW is healthy"

# ---- 3. let nginx see it ---------------------------------------------------
if [ -n "$LIVE" ]; then
    echo "both colours up; waiting ${RESOLVER_WAIT}s for nginx's DNS cache"
    sleep "$RESOLVER_WAIT"

    # ---- 4. retire the old one ---------------------------------------------
    # docker stop sends SIGTERM and waits stop_grace_period; adapter-node stops
    # accepting, finishes what is in flight, and exits. rm so that a reboot
    # (restart: unless-stopped) cannot bring it back next to the new one.
    docker stop -t 35 "$LIVE" >/dev/null
    docker rm "$LIVE" >/dev/null
    echo "retired $LIVE"
fi

docker image prune -f >/dev/null

# ---- 5. through nginx, the way the world sees it -----------------------------
ok=0
for i in 1 2 3 4 5; do
    code=$(curl -sk -o /dev/null -w '%{http_code}' -H 'Host: api.1lev1.com' https://127.0.0.1/api/health || echo 000)
    echo "  [$i/5] https://api.1lev1.com/api/health via nginx -> $code"
    [ "$code" = "200" ] && ok=$((ok + 1))
    sleep 1
done
if [ "$ok" -lt 5 ]; then
    echo "ERROR: nginx did not answer 200 every time ($ok/5)"
    exit 1
fi
echo "deployed $IMAGE as $NEW"

# ---- 6. the scheduler: running, on the current code, and on time -------------
# The platform's clock (timegrama, monthi, the crons) lives in this container.
# Nothing else notices if it stops, so every deploy checks it. Exit 2 = the API
# is deployed and live, but the scheduler needs attention.
SCHED=1lev1-scheduler
sched_fail() {
    echo "ERROR: scheduler — $1"
    docker logs --tail 40 "$SCHED" 2>&1 || true
    echo "The API is deployed and serving; the SCHEDULER is not healthy (see above)."
    exit 2
}

# scheduler.mjs is bind-mounted, so an upload changes the file under a running
# process that has already loaded the old code. Restart only when it changed.
sum=$(sha256sum scheduler.mjs | cut -d' ' -f1)
if [ "$sum" != "$(cat .scheduler.sha256 2>/dev/null || true)" ] && running "$SCHED"; then
    echo "scheduler.mjs changed — restarting the scheduler on the new code"
    docker restart -t 60 "$SCHED" >/dev/null
fi
echo "$sum" > .scheduler.sha256

if ! running "$SCHED"; then
    echo "scheduler was not running — starting it"
    "${DC[@]}" up -d --no-deps scheduler
    sleep 5
fi
running "$SCHED" || sched_fail "container does not stay up"
[ "$(docker inspect -f '{{.State.Restarting}}' "$SCHED")" = "false" ] || sched_fail "container is restart-looping"

# Its jobs go to http://sveltekit-api:3000 — the alias that just moved.
docker exec "$SCHED" node -e "fetch('http://sveltekit-api:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    || sched_fail "cannot reach http://sveltekit-api:3000 from inside the scheduler"
echo "scheduler reaches the API"

# Loop alive (state file fresh), no job failing, none overdue.
echo "scheduler jobs:"
docker exec "$SCHED" node /app/scheduler.mjs --check || sched_fail "jobs are not on time (list above)"
