<#
.SYNOPSIS
    Build the SvelteKit API docker image locally, push it to the Linux VPS
    and restart the container there — same flow as the Strapi deploy script.

.DESCRIPTION
    1. docker build (multi-stage, .env passed as a BuildKit secret)
    2. docker save -> scp the image tarball to the server
    3. ssh: docker load + docker compose up -d + health check

    The runtime .env (STRAPI_URL, ORIGIN, secrets...) lives ONLY on the server
    in $RemoteDir/.env — this script never uploads or overwrites it.

.EXAMPLE
    .\deploy-api.ps1 -Server 1lev1.com -User root

.EXAMPLE
    # build only, no deploy (sanity check of the Dockerfile)
    .\deploy-api.ps1 -BuildOnly

.EXAMPLE
    # redeploy the image that was already built (skip the build stage)
    .\deploy-api.ps1 -Server 1lev1.com -User root -SkipBuild
#>
param(
    [string]$Server = $env:DEPLOY_SERVER,          # e.g. 1lev1.com / IP
    [string]$User = $env:DEPLOY_USER,              # e.g. root
    [string]$SshKey = "",                          # optional path to private key
    [string]$RemoteDir = "/opt/1lev1/api",
    [string]$ImageName = "1lev1/sveltekit-api",
    [string]$Tag = "",                             # default: git short sha
    [switch]$BuildOnly,
    [switch]$SkipBuild,
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
$FullImage   = "${ImageName}:${Tag}"
$LatestImage = "${ImageName}:latest"

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
# docker save to a file + scp (piping binary through PowerShell corrupts it)
$TarFile = Join-Path $env:TEMP "sveltekit-api-$Tag.tar"

Step "Saving image to $TarFile"
docker save -o $TarFile $FullImage $LatestImage
if ($LASTEXITCODE -ne 0) { Fail "docker save failed" }
Ok ("size: {0:N0} MB" -f ((Get-Item $TarFile).Length / 1MB))

Step "Preparing $RemoteDir on $Server"
Invoke-Remote "mkdir -p $RemoteDir && docker network inspect app_app-network >/dev/null 2>&1 || docker network create app_app-network"

Step "Uploading image + compose file"
& scp @sshArgs $TarFile "$User@${Server}:$RemoteDir/sveltekit-api.tar"
if ($LASTEXITCODE -ne 0) { Fail "scp of image tar failed" }
& scp @sshArgs "$RepoRoot\docker-compose.api.yml" "$User@${Server}:$RemoteDir/docker-compose.api.yml"
if ($LASTEXITCODE -ne 0) { Fail "scp of compose file failed" }
Remove-Item $TarFile -Force

# ---------- 3. load + restart on the server ----------
Step "Loading image and restarting container"
Invoke-Remote "cd $RemoteDir && test -f .env || { echo 'MISSING $RemoteDir/.env on server (STRAPI_URL, ORIGIN, secrets) — create it first'; exit 1; }"
Invoke-Remote "cd $RemoteDir && docker load -i sveltekit-api.tar && rm -f sveltekit-api.tar && docker compose -f docker-compose.api.yml up -d && docker image prune -f"

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
