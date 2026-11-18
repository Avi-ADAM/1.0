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

    Defaults target the existing VPS (ubuntu@91.90.82.93, key ~/.ssh/lev1-vps2,
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
    [string]$Server = $(if ($env:DEPLOY_SERVER) { $env:DEPLOY_SERVER } else { "91.90.82.93" }),
    [string]$User = $(if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { "ubuntu" }),
    [string]$SshKey = "$env:USERPROFILE\.ssh\lev1-vps2",   # private key for the VPS
    [string]$RemoteDir = "/home/ubuntu/api",       # ubuntu-owned; /opt needs root
    [string]$Registry = "ghcr.io",                 # container registry host
    [string]$Owner = "avi-adam",                   # GHCR namespace (must be lowercase)
    [string]$ImageName = "1lev1-sveltekit-api",    # image repo name
    [string]$Tag = "",                             # default: git short sha
    [switch]$BuildOnly,
    [switch]$SkipBuild,
    [switch]$SkipPreflight,                        # build even if memory/disk look too low (it may crash Docker's VM)
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

# Docker's VM dies mid-build (rpc EOF, then a long wait for Docker to recover)
# when Windows runs out of commit: the VM can claim half the RAM, ~12 GB here,
# and the box is often near its limit before the build even starts. Refusing up
# front costs seconds; crashing costs the build plus the recovery.
function Test-BuildResources {
    param(
        [double]$MinCommitFreeGB = 14,
        [double]$MinDockerDiskFreeGB = 5
    )

    $problems = @()

    # A VM that is already up has already charged part of what the build needs.
    $vmGB = (Get-Process vmmemWSL -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum / 1GB
    $neededGB = [math]::Max(2, $MinCommitFreeGB - $vmGB)
    $commitFreeGB = (Get-CimInstance Win32_OperatingSystem).FreeVirtualMemory / 1MB
    Ok ("virtual memory free: {0:N1} GB (need {1:N1} GB)" -f $commitFreeGB, $neededGB)
    if ($commitFreeGB -lt $neededGB) {
        $problems += ("Windows has {0:N1} GB of virtual memory free, the build needs {1:N1} GB. Close IDEs, agent sessions and browser tabs." -f $commitFreeGB, $neededGB)
    }

    # The VM's disk grows into this drive while the build writes its layers.
    $dockerDir = $env:LOCALAPPDATA
    $settingsFile = "$env:APPDATA\Docker\settings-store.json"
    if (Test-Path $settingsFile) {
        $customDir = (Get-Content $settingsFile -Raw | ConvertFrom-Json).CustomWslDistroDir
        if ($customDir) { $dockerDir = $customDir }
    }
    $drive = (Split-Path $dockerDir -Qualifier).TrimEnd(':')
    $diskFreeGB = (Get-PSDrive $drive).Free / 1GB
    Ok ("Docker disk (${drive}:) free: {0:N1} GB (need {1:N1} GB)" -f $diskFreeGB, $MinDockerDiskFreeGB)
    if ($diskFreeGB -lt $MinDockerDiskFreeGB) {
        $problems += ("Drive ${drive}: has {0:N1} GB free, Docker's disk needs at least {1:N1} GB to grow into. Free space on that drive; 'docker builder prune' does not shrink the disk file." -f $diskFreeGB, $MinDockerDiskFreeGB)
    }

    if ($problems) {
        Fail (($problems -join "`n       ") + "`n       Use -SkipPreflight to build anyway.")
    }
}

# ---------- 1. local build ----------
if (-not $SkipBuild) {
    if (-not (Test-Path "$RepoRoot\.env")) {
        Fail ".env not found in repo root — vite build needs it (VITE_* / `$env/static). Aborting."
    }

    if (-not $SkipPreflight) {
        Step "Checking memory and disk before building"
        Test-BuildResources
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

# The vector service bind-mounts this next to the compose file, so it has to
# land before 'up -d' or the container starts with an empty config.
Step "Uploading vector.toml (log shipper config)"
& scp @sshArgs "$RepoRoot\vector.toml" "$User@${Server}:$RemoteDir/vector.toml"
if ($LASTEXITCODE -ne 0) { Fail "scp of vector.toml failed" }

# The scheduler service bind-mounts this next to the compose file, the same way
# vector does. It has to land before 'up -d' or the container starts with
# nothing to run. Changing a schedule is this upload plus a restart — no rebuild.
Step "Uploading scheduler.mjs (maturation clock + monthly close)"
& scp @sshArgs "$RepoRoot\scripts\scheduler\scheduler.mjs" "$User@${Server}:$RemoteDir/scheduler.mjs"
if ($LASTEXITCODE -ne 0) { Fail "scp of scheduler.mjs failed" }

Invoke-Remote "cd $RemoteDir && test -f .env || { echo 'MISSING $RemoteDir/.env on server (STRAPI_URL, ORIGIN, secrets) — create it first'; exit 1; }"


# The switch itself runs on the server (scripts/deploy/api-switch.sh), so the
# whole start-wait-retire sequence survives a dropped ssh session halfway.
Step "Uploading api-switch.sh (zero-downtime colour switch)"
& scp @sshArgs "$RepoRoot\scripts\deploy\api-switch.sh" "$User@${Server}:$RemoteDir/api-switch.sh"
if ($LASTEXITCODE -ne 0) { Fail "scp of api-switch.sh failed" }
# A Windows checkout may hand it over with CRLF, which bash reads as part of each command.
Invoke-Remote "sed -i 's/\r`$//' $RemoteDir/api-switch.sh"
Invoke-Remote "docker compose version >/dev/null 2>&1 || { echo 'compose v2 plugin (docker compose) missing on the server'; exit 1; }"

# ---------- 3. deliver the image ----------
if (-not $Tarball) {
    # ---- default: push to GHCR; the server pulls the exact tag ----
    # A rollback (-SkipBuild -Tag <older sha>) usually has no local copy of
    # that image any more; it is on GHCR already, so there is nothing to push.
    $haveLocal = $true
    docker image inspect $FullImage *> $null
    if ($LASTEXITCODE -ne 0) { $haveLocal = $false }

    if ($haveLocal) {
        Step "Pushing $FullImage to $Registry"
        docker push $FullImage
        if ($LASTEXITCODE -ne 0) { Fail "docker push failed — run 'docker login $Registry -u <github-user>' locally first (PAT needs write:packages)" }
        if (-not $SkipBuild) {
            # :latest only moves on a fresh build, never on a rollback.
            docker push $LatestImage
            if ($LASTEXITCODE -ne 0) { Fail "docker push (latest) failed" }
        }
        Ok "pushed $FullImage"
    }
    elseif ($SkipBuild) {
        Ok "$FullImage is not local — the server will pull it from $Registry"
    }
    else {
        Fail "built image $FullImage is missing locally"
    }
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

    Step "Loading image on the server"
    Invoke-Remote "cd $RemoteDir && docker load -i sveltekit-api.tar && rm -f sveltekit-api.tar"
}

# ---------- 4. switch colours (no downtime) + health through nginx ----------
# Starts the idle colour on $Tag, waits for healthy, lets nginx see both,
# retires the old one, then checks https://api.1lev1.com/api/health via nginx.
# On failure the new colour is removed and the old one keeps serving.
Step "Switching to $Tag"
# 2>&1 on the far side: compose writes warnings to stderr, and Windows PowerShell
# 5.1 with ErrorActionPreference=Stop turns any native stderr line into a
# terminating error — which killed the ssh session halfway through a switch.
& ssh @sshArgs "$User@$Server" "bash $RemoteDir/api-switch.sh $Tag 2>&1"
$switchExit = $LASTEXITCODE
if ($switchExit -eq 2) {
    Fail "the API is deployed and live, but the SCHEDULER check failed — see above (manual check: docker exec 1lev1-scheduler node /app/scheduler.mjs --check)"
}
if ($switchExit -ne 0) { Fail "switch failed — see the output above; the previous container is still serving unless it says otherwise" }
Write-Host ""
Ok "deployed $FullImage to $Server ($RemoteDir)"

if ($Logs) {
    Step "Tailing logs (Ctrl+C to stop)"
    & ssh @sshArgs "$User@$Server" "docker logs -f --tail 20 `$(docker ps --format '{{.Names}}' --filter name=^sveltekit-api- | head -1)"
}
