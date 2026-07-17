<#
.SYNOPSIS
    Build the SvelteKit API docker image locally, ship it to the Linux VPS via
    GHCR (ghcr.io) and restart the container there.

.DESCRIPTION
    1. docker build (multi-stage, .env passed as a BuildKit secret)
    2. docker push ghcr.io/<owner>/<image>:<sha> + :latest   (or -Tarball: save+scp)
    3. ssh: docker compose pull + up -d + health check         (or -Tarball: docker load)

    The runtime .env (STRAPI_URL, ORIGIN, secrets...) lives ONLY on the server
    in $RemoteDir/.env — this script never uploads or overwrites it.

    Auth (private GHCR package): 'docker login ghcr.io' with a PAT that has
    write:packages here on the dev box, and read:packages once on the server.

    Defaults target the existing VPS (ubuntu@18.159.130.31, key ~/Downloads/sail.pem,
    remote dir /home/ubuntu/api) — the same box that runs Strapi + socket-server.
    Build stays LOCAL: the VPS has 1.9 GB RAM / no swap and would OOM a vite build.

.EXAMPLE
    # full deploy with the baked-in defaults (build -> push GHCR -> pull on VPS)
    .\deploy-api.ps1

.EXAMPLE
    # build only, no deploy (sanity check of the Dockerfile)
    .\deploy-api.ps1 -BuildOnly

.EXAMPLE
    # redeploy the image that was already built (skip the build stage)
    .\deploy-api.ps1 -SkipBuild

.EXAMPLE
    # ship via docker save/scp tarball instead of GHCR (e.g. registry unreachable)
    .\deploy-api.ps1 -Tarball
#>
param(
    [string]$Server = $(if ($env:DEPLOY_SERVER) { $env:DEPLOY_SERVER } else { "18.159.130.31" }),
    [string]$User = $(if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { "ubuntu" }),
    [string]$SshKey = "$env:USERPROFILE\Downloads\sail.pem",   # private key for the VPS
    [string]$RemoteDir = "/home/ubuntu/api",       # ubuntu-owned; /opt needs root
    [string]$Registry = "ghcr.io",                 # container registry host
    [string]$Owner = "avi-adam",                   # GHCR namespace (must be lowercase)
    [string]$ImageName = "1lev1-sveltekit-api",    # image repo name
    [string]$Tag = "",                             # default: git short sha
    [switch]$BuildOnly,
    [switch]$SkipBuild,
    [switch]$Tarball,                              # ship via docker save/scp/load instead of GHCR push/pull
    [switch]$Logs                                  # tail container logs at the end
)

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# ---------- resolve parameters ----------
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

if (-not $Tag) {
    try { $Tag = (git rev-parse --short HEAD).Trim() } catch { $Tag = Get-Date -Format "yyyyMMdd-HHmmss" }
}
$ImageRepo   = "${Registry}/${Owner}/${ImageName}".ToLower()   # GHCR requires lowercase
$FullImage   = "${ImageRepo}:${Tag}"
$LatestImage = "${ImageRepo}:latest"

$sshArgs = @()
if ($SshKey) { $sshArgs += @("-i", $SshKey) }

function Invoke-Remote([string]$cmd) {
    & ssh @sshArgs "$User@$Server" $cmd
    if ($LASTEXITCODE -ne 0) { Fail "remote command failed: $cmd" }
}

# ---------- 1. local build ----------
if (-not $SkipBuild) {
    if (-not (Test-Path "$RepoRoot\.env")) {
        Fail ".env not found in repo root — vite build needs it (VITE_* / `$env/static). Aborting."
    }

    Step "Building image $FullImage (BuildKit, .env as secret)"
    $env:DOCKER_BUILDKIT = "1"
    docker build --secret id=envfile,src=.env -t $FullImage -t $LatestImage .
    if ($LASTEXITCODE -ne 0) { Fail "docker build failed" }
    Ok "image built: $FullImage"
}

if ($BuildOnly) {
    Ok "BuildOnly — done."
    exit 0
}

if (-not $Server -or -not $User) {
    Fail "missing -Server / -User (or set DEPLOY_SERVER / DEPLOY_USER env vars)"
}

# ---------- 2. ship the image ----------
Step "Preparing $RemoteDir on $Server"
Invoke-Remote "mkdir -p $RemoteDir && docker network inspect app_app-network >/dev/null 2>&1 || docker network create app_app-network"

Step "Uploading compose file"
& scp @sshArgs "$RepoRoot\docker-compose.api.yml" "$User@${Server}:$RemoteDir/docker-compose.api.yml"
if ($LASTEXITCODE -ne 0) { Fail "scp of compose file failed" }

Invoke-Remote "cd $RemoteDir && test -f .env || { echo 'MISSING $RemoteDir/.env on server (STRAPI_URL, ORIGIN, secrets) — create it first'; exit 1; }"

# ---------- 3. deliver + restart on the server ----------
if (-not $Tarball) {
    # ---- default: push to GHCR, pull on the server ----
    Step "Pushing $FullImage to $Registry"
    docker push $FullImage
    if ($LASTEXITCODE -ne 0) { Fail "docker push failed — run 'docker login $Registry -u <github-user>' locally first (PAT needs write:packages)" }
    docker push $LatestImage
    if ($LASTEXITCODE -ne 0) { Fail "docker push (latest) failed" }
    Ok "pushed $FullImage and :latest"

    Step "Pulling image and restarting container"
    # compose 'pull' always fetches the current :latest (server must be logged in for a private package).
    # This VPS has compose v1 (`docker-compose`); fall back to the v2 plugin if present.
    # The old container is force-removed AFTER the pull (minimal downtime) and
    # before 'up' — compose v1 fails with a name conflict when the running
    # container wasn't created by this exact compose project.
    Invoke-Remote "cd $RemoteDir && DC=`$(docker compose version >/dev/null 2>&1 && echo 'docker compose' || echo docker-compose) && `$DC -f docker-compose.api.yml pull && (docker rm -f sveltekit-api >/dev/null 2>&1 || true) && `$DC -f docker-compose.api.yml up -d && docker image prune -f"
}
else {
    # ---- fallback: docker save -> scp tarball -> docker load ----
    # (piping binary through PowerShell corrupts it, so save to a file and scp)
    $TarFile = Join-Path $env:TEMP "sveltekit-api-$Tag.tar"

    Step "Saving image to $TarFile"
    docker save -o $TarFile $FullImage $LatestImage
    if ($LASTEXITCODE -ne 0) { Fail "docker save failed" }
    Ok ("size: {0:N0} MB" -f ((Get-Item $TarFile).Length / 1MB))

    Step "Uploading image tarball"
    & scp @sshArgs $TarFile "$User@${Server}:$RemoteDir/sveltekit-api.tar"
    if ($LASTEXITCODE -ne 0) { Fail "scp of image tar failed" }
    Remove-Item $TarFile -Force

    Step "Loading image and restarting container"
    Invoke-Remote "cd $RemoteDir && DC=`$(docker compose version >/dev/null 2>&1 && echo 'docker compose' || echo docker-compose) && docker load -i sveltekit-api.tar && rm -f sveltekit-api.tar && (docker rm -f sveltekit-api >/dev/null 2>&1 || true) && `$DC -f docker-compose.api.yml up -d && docker image prune -f"
}

# ---------- 4. health check ----------
Step "Health check"
Start-Sleep -Seconds 5
& ssh @sshArgs "$User@$Server" "curl -sf http://127.0.0.1:3000/api/health"
if ($LASTEXITCODE -ne 0) {
    Write-Host "health check failed — recent logs:" -ForegroundColor Yellow
    & ssh @sshArgs "$User@$Server" "docker logs --tail 50 sveltekit-api"
    Fail "container is not healthy"
}
Write-Host ""
Ok "deployed $FullImage to $Server ($RemoteDir)"

if ($Logs) {
    Step "Tailing logs (Ctrl+C to stop)"
    & ssh @sshArgs "$User@$Server" "docker logs -f --tail 20 sveltekit-api"
}
