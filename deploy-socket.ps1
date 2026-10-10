<#
.SYNOPSIS
    Deploy socket-server/ from THIS working tree to the VPS and restart the
    unified-action-socket-server container there.

.DESCRIPTION
    1. local: socket-server tests + tsc --noEmit                (skip: -SkipTests)
    2. local: pack the sources (src/, package*.json, tsconfig, Dockerfile, compose)
    3. scp the tarball to $DeployDir on the VPS
    4. ssh: unpack into $DeployDir/app, keep the current image as :rollback,
       docker-compose build, replace the container, health check, verify that
       the running build is the one just shipped
    5. -Rollback: put the :rollback image back, without building anything

    Why it builds ON the server, unlike deploy-api.ps1: the image is a plain
    tsc build (no vite), the VPS already built it this way, and it needs no
    registry package or PAT. Why it ships the working tree instead of
    'git pull' on the server: every push to main deploys the app on Vercel,
    and the socket server has to go out BEFORE the app relies on it
    (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.3 — 'rt:changed').

    Layout on the VPS (ubuntu@18.159.130.31):
      /home/ubuntu/socket/1.0/socket-server  legacy git clone the container was
                                             built from until now. Never touched
                                             here: its .env is copied ONCE, on the
                                             server, into $DeployDir/app/.env.
      /home/ubuntu/socket/deploy/app         what this script ships and builds.
    Both use compose project 'socket-server', so the same container
    (unified-action-socket-server, host port 3001, network app_app-network)
    is replaced — nginx in front of socket.1lev1.com does not change.

    The runtime .env stays on the server; this script never uploads, prints
    or overwrites it.

.EXAMPLE
    .\deploy-socket.ps1              # test, ship, build, restart, verify

.EXAMPLE
    .\deploy-socket.ps1 -Check       # local tests + tsc + pack only, nothing sent

.EXAMPLE
    .\deploy-socket.ps1 -Rollback    # back to the image that ran before the last deploy

.EXAMPLE
    .\deploy-socket.ps1 -Logs        # deploy, then tail the container logs
#>
param(
    [string]$Server = $(if ($env:DEPLOY_SERVER) { $env:DEPLOY_SERVER } else { "18.159.130.31" }),
    [string]$User = $(if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { "ubuntu" }),
    [string]$SshKey = "$env:USERPROFILE\Downloads\sail.pem",
    [string]$DeployDir = "/home/ubuntu/socket/deploy",
    [string]$LegacyDir = "/home/ubuntu/socket/1.0/socket-server",   # source of the .env on first deploy
    [string]$Project = "socket-server",                             # compose project of the running container
    [string]$Container = "unified-action-socket-server",
    [int]$Port = 3001,
    [switch]$Check,
    [switch]$SkipTests,
    [switch]$Rollback,
    [switch]$Logs
)

# Not "Stop": in Windows PowerShell 5.1 every line a native command writes to
# stderr becomes a terminating error, and docker-compose / npm / ssh print
# ordinary progress there ("Building socket-server"). It killed the first real
# run mid-build. Every native call below checks $LASTEXITCODE instead.
$ErrorActionPreference = "Continue"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

$RepoRoot = $PSScriptRoot
$SocketDir = Join-Path $RepoRoot "socket-server"
if (-not (Test-Path "$SocketDir\package.json")) { Fail "socket-server/ not found next to this script" }

$sshArgs = @("-o", "ConnectTimeout=20")
if ($SshKey) { $sshArgs += @("-i", $SshKey) }

# Run a bash script on the server. Written to a temp file with LF endings and
# sent with scp: a CRLF piped from PowerShell breaks bash on the first line.
function Invoke-RemoteScript([string]$name, [string]$body) {
    $local = Join-Path $env:TEMP "socket-deploy-$name.sh"
    [IO.File]::WriteAllText($local, ($body -replace "`r", ""), (New-Object Text.UTF8Encoding($false)))
    & scp @sshArgs $local "$User@${Server}:$DeployDir/$name.sh" | Out-Host
    if ($LASTEXITCODE -ne 0) { Remove-Item $local -Force; Fail "scp of $name.sh failed" }
    Remove-Item $local -Force
    # Out-Host: inside a function, native output would otherwise become the
    # return value, and the caller would get text instead of the exit code.
    # 2>&1 + "$_": stderr lines print as plain text, not as red ErrorRecords.
    & ssh @sshArgs "$User@$Server" "bash $DeployDir/$name.sh 2>&1; rc=`$?; rm -f $DeployDir/$name.sh; exit `$rc" 2>&1 |
        ForEach-Object { "$_" } | Out-Host
    return $LASTEXITCODE
}

# Shared header of every remote script: the knobs, and compose v1 / v2.
$RemoteHeader = @"
set -euo pipefail
DEPLOY_DIR='$DeployDir'
LEGACY_DIR='$LegacyDir'
PROJECT='$Project'
CONTAINER='$Container'
PORT='$Port'
DC=`$(docker compose version >/dev/null 2>&1 && echo 'docker compose' || echo docker-compose)

health() {
  for i in `$(seq 1 15); do
    if curl -sf "http://127.0.0.1:`$PORT/health" >/dev/null; then return 0; fi
    sleep 2
  done
  return 1
}
"@

# ---------- rollback ----------
if ($Rollback) {
    Step "Rolling back $Container on $Server to the image that ran before the last deploy"
    $body = $RemoteHeader + @'

cd "$DEPLOY_DIR/app"
CUR=$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)
REPO="${CUR%%:*}"
if [ -z "$REPO" ] || ! docker image inspect "$REPO:rollback" >/dev/null 2>&1; then
  echo "no $REPO:rollback image - nothing to roll back to"; exit 1
fi
docker tag "$REPO:rollback" "$REPO:latest"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
$DC -p "$PROJECT" up -d --no-build
if ! health; then docker logs --tail 50 "$CONTAINER"; echo "rolled back, but unhealthy"; exit 1; fi
echo "rolled back to $(docker image inspect -f '{{.Created}}' "$REPO:latest")"
'@
    $rc = Invoke-RemoteScript "rollback" $body
    if ($rc -ne 0) { Fail "rollback failed (exit $rc)" }
    Ok "rolled back"
    exit 0
}

# ---------- 1. local checks ----------
Push-Location $SocketDir
try {
    if (-not $SkipTests) {
        if (-not (Test-Path "node_modules")) { Fail "socket-server/node_modules missing - run 'npm ci' in socket-server first" }
        Step "socket-server tests"
        npm test --silent
        if ($LASTEXITCODE -ne 0) { Fail "socket-server tests failed - nothing was sent" }
        Step "TypeScript (tsc --noEmit)"
        npx tsc --noEmit
        if ($LASTEXITCODE -ne 0) { Fail "tsc failed - nothing was sent" }
        Ok "tests and types pass"
    }
}
finally { Pop-Location }

# ---------- 2. pack ----------
$Sha = "nogit"
try { $Sha = (git -C $RepoRoot rev-parse --short HEAD).Trim() } catch {}
$Dirty = (git -C $RepoRoot status --porcelain -- socket-server) | Where-Object { $_ }
$Tag = if ($Dirty) { "$Sha-dirty" } else { $Sha }
if ($Dirty) { Warn "socket-server/ has uncommitted changes - shipping the working tree as $Tag" }

$Files = @("Dockerfile", ".dockerignore", "package.json", "package-lock.json", "tsconfig.json", "docker-compose.yml", "src")
foreach ($f in $Files) { if (-not (Test-Path (Join-Path $SocketDir $f))) { Fail "socket-server/$f missing" } }

# What the running container has to contain for this deploy to count. The
# realtime event is the reason this script exists; extend the list when a
# deploy adds something the app will depend on.
$Expect = @(
    @{ File = "dist/broadcast-event.js"; Text = "rt:changed" },
    # A polling request used to crash the process (socket-path.ts).
    @{ File = "dist/socket-path.js"; Text = "isSocketIoRequest" }
)

$Tarball = Join-Path $env:TEMP "socket-server-$Tag.tgz"
Step "Packing socket-server ($Tag)"
# Windows' own bsdtar; GNU tar on the server reads it.
& "$env:SystemRoot\System32\tar.exe" -czf $Tarball -C $SocketDir @Files
if ($LASTEXITCODE -ne 0) { Fail "tar failed" }
Ok ("{0:N0} KB" -f ((Get-Item $Tarball).Length / 1KB))

# ---------- 3. the script the server runs ----------
$ExpectLines = ($Expect | ForEach-Object { "  check '$($_.File)' '$($_.Text)'" }) -join "`n"
$body = $RemoteHeader + @"

TAG='$Tag'
"@ + @'

cd "$DEPLOY_DIR"
# Fresh sources every time: a file deleted locally must not survive here.
rm -rf app/src
tar -xzf "socket-server-$TAG.tgz" -C app
rm -f "socket-server-$TAG.tgz"
cd app
printf '%s\n' "$TAG" > DEPLOYED_TAG

if [ ! -f .env ]; then
  if [ -f "$LEGACY_DIR/.env" ]; then
    cp "$LEGACY_DIR/.env" .env && chmod 600 .env
    echo "first deploy: .env copied from $LEGACY_DIR"
  else
    echo "MISSING $DEPLOY_DIR/app/.env (JWT_SECRET, SOCKET_BROADCAST_SECRET, ...) - create it first"; exit 1
  fi
fi
for v in JWT_SECRET SOCKET_BROADCAST_SECRET; do
  grep -q "^$v=." .env || { echo "$v is empty in .env - the server would refuse every request"; exit 1; }
done

echo "--- building (compose: $DC)"
$DC -p "$PROJECT" build

# Keep what runs now, so -Rollback has somewhere to go.
CUR=$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)
if [ -n "$CUR" ]; then
  OLD_ID=$(docker inspect -f '{{.Image}}' "$CONTAINER")
  docker tag "$OLD_ID" "${CUR%%:*}:rollback" && echo "previous image kept as ${CUR%%:*}:rollback"
fi

# compose v1 (this VPS) can crash RECREATING a container (KeyError:
# 'ContainerConfig', see deploy-api.ps1). Removing it first takes the create
# path instead; clients reconnect on their own and resync (bus.ts).
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
$DC -p "$PROJECT" up -d

if ! health; then
  echo "--- unhealthy, recent logs:"; docker logs --tail 50 "$CONTAINER" || true
  echo "roll back with: .\\deploy-socket.ps1 -Rollback"; exit 1
fi

check() {
  if docker exec "$CONTAINER" grep -q "$2" "/app/$1"; then echo "ok: $1 has '$2'"
  else echo "the running build lacks '$2' in $1 - is this the image that was just built?"; exit 1; fi
}
'@ + "`n$ExpectLines`n" + @'

docker image prune -f >/dev/null
echo "deployed $TAG - $(curl -s "http://127.0.0.1:$PORT/health")"
'@

if ($Check) {
    Remove-Item $Tarball -Force
    # The script the server would run, for review — and a syntax check when a
    # local bash exists (Git for Windows).
    $Preview = Join-Path $env:TEMP "socket-deploy-preview.sh"
    [IO.File]::WriteAllText($Preview, ($body -replace "`r", ""), (New-Object Text.UTF8Encoding($false)))
    # Git Bash specifically: a bare `bash` on Windows is often WSL's, which
    # cannot read a Windows temp path.
    $bash = @("$env:ProgramFiles\Git\bin\bash.exe", "${env:ProgramFiles(x86)}\Git\bin\bash.exe") |
        Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
    if ($bash) {
        & $bash -n $Preview
        if ($LASTEXITCODE -ne 0) { Fail "the remote script does not parse: $Preview" }
        Ok "remote script parses (bash -n)"
    }
    Ok "remote script: $Preview"
    Ok "Check only - nothing was sent."
    exit 0
}

# ---------- 4. ship ----------
Step "Uploading to $Server`:$DeployDir"
& ssh @sshArgs "$User@$Server" "mkdir -p $DeployDir/app"
if ($LASTEXITCODE -ne 0) { Fail "cannot reach $User@$Server" }
& scp @sshArgs $Tarball "$User@${Server}:$DeployDir/socket-server-$Tag.tgz"
if ($LASTEXITCODE -ne 0) { Remove-Item $Tarball -Force; Fail "scp of the tarball failed" }
Remove-Item $Tarball -Force

# ---------- 5. run it ----------
Step "Building and restarting $Container on $Server"
$rc = Invoke-RemoteScript "deploy" $body
if ($rc -ne 0) { Fail "deploy failed on the server (exit $rc) - see the output above" }

Write-Host ""
Ok "socket-server $Tag is live on $Server (container $Container, port $Port)"

if ($Logs) {
    Step "Tailing logs (Ctrl+C to stop)"
    & ssh @sshArgs "$User@$Server" "docker logs -f --tail 20 $Container"
}
