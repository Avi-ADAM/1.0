# Windows Tauri — release runbook and acceptance evidence

**Status: v0.1.2 published as the public Latest release with the owner's approval
on 2026-10-14.** The owner confirmed that the startup fix works and reported that
all their checks work well. Detailed per-OS §10 evidence, the website/public
verification job, and the in-app update/Android APK records remain unrecorded;
publication is not a claim that those individual checks were independently verified.

Public release: https://github.com/Avi-ADAM/1.0/releases/tag/desktop-v0.1.2

- Installer CI: https://github.com/Avi-ADAM/1.0/actions/runs/38574741215
- Release source commit: `e61e3eabcd0077e6d0f022e7ca23891aa207905a` (window title `1💗1`).
- Windows/Android checks, installer build, and actual-asset signature/manifest
  verification all passed in that run.
- Published at `2026-10-14T14:04:06Z`; an unauthenticated GitHub API request
  confirmed v0.1.2 is Latest, non-draft and non-prerelease, with all five assets.
  Public binary downloads and the live website were not re-tested by that API check.
- v0.1.0 and v0.1.1 remain drafts. No old/known-broken build was published.

Owner confirmed that the permanent signing keys already exist and will trigger
installer CI, deploy the website environment variable, and test both Windows
versions. Their values/configuration have not been inspected by this session;
CI preflight remains the source of truth. Do not generate a replacement key.
Implementation is not evidence that an installer works. Never mark §10 of
[`PLAN_TAURI_WINDOWS.md`](../tbd/PLAN_TAURI_WINDOWS.md) complete from unit tests,
`cargo check`, or a build alone.

## Constraints preserved

- One `src-tauri`; identifier remains `world.onelev1.app`.
- `gen/android`, the Android shell, and the Android build scripts are not
  edited. The base Tauri config changes only its shared release version to
  `0.1.2`; the identifier and mobile window settings remain unchanged.
  Desktop plugins are target-scoped;
  native host registration and implementation are Windows/desktop-gated.
- The app still loads the live website. No SPA build, auth API changes, remote
  capabilities, or frontend IPC permissions.
- No certificate purchased, Authenticode signer configured, paid service
  provisioned, or billing settings changed. The repository is public; the
  workflow uses standard GitHub-hosted runners, not paid larger runners.
- Updater signatures are **not** Windows Authenticode signatures. SmartScreen
  can still warn. Azure Trusted Signing / OV remains an owner cost decision.

## Implementation notes

`tauri.windows.conf.json` replaces the complete window array; `create: false`
lets Rust attach handlers **before** creating the sole `main` window. The
initial `about:blank` is replaced with local `windows.html` after Rust reads
WebView2's actual User-Agent and appends `1lev1-desktop/<package version>` via
`ICoreWebView2Settings2`. There is deliberately no stale hardcoded Chromium
`userAgent` in JSON. Tauri is pinned to the 2.11 minor line to match its native
COM ABI. The mobile dependency versions in the lockfile must remain unchanged.

`windows.html`/`windows.js` preserve the Hebrew offline screen and add a bounded,
credential-free, no-cors connectivity probe, manual retry, and online retry.
They are separate from `shell/index.html` to leave Android's existing assets
and behavior untouched. This is startup recovery, **not** full offline support
for the remote website or a guarantee against the network failing after a probe.

Top-level navigation / new-window hooks allow the exact `1lev1.com` domain and
its subdomains, redirect internal popups into `main`, and open external
HTTP(S), `mailto:` and `tel:` links through Rust. Other custom schemes are denied.
This is not an iframe/resource filter, so it does not block YouTube embeds.
The opener plugin's default injected link interceptor is explicitly disabled:
it would otherwise attempt frontend IPC from remote pages.

Downloads go to the user's Downloads folder, with unique safe names to avoid
silently replacing an earlier export. A Hebrew native completion dialog offers
“show in folder”; downloaded files are never automatically executed.

The window-state plugin persists size, position and maximized state (not hidden
state). The single-instance plugin restores/focuses the existing window. A
native updater thread checks on startup and every six hours, requests consent
in Hebrew, saves window state, verifies/downloads the update, and restarts.
No forced install happens after “not now”. Update failures leave the app usable.

## Startup hang and logs (v0.1.0 → v0.1.1)

The owner installed the v0.1.0 CI artifact successfully but reported that its
first window remained unresponsive for several minutes. Windows version has
not yet been supplied. This is a failed startup acceptance check, not a pass.
The successful installer build/signature verification is run
https://github.com/Avi-ADAM/1.0/actions/runs/38562811086 (commit `55a23dc`).

In v0.1.0, logging was debug-only, so its Release installer does not produce
application log files. For that build use **Event Viewer → Windows Logs →
Application**, at the time of the hang: Application Hang (1002), Application
Error (1000), Windows Error Reporting (1001). A hang may only be recorded after
Windows detects it or the user closes the unresponsive application. Send only
matching app events, redact personal paths, and do not upload a memory dump or
the WebView profile (which can contain cookies and session data).

Code inspection identified a startup deadlock: `with_webview` in runtime-wry
2.11.5 executes synchronously on the UI thread while holding the dispatcher's
`window_id` mutex. Calling `ready_window.navigate` inside that callback attempts
to lock the same mutex again. v0.1.1 finishes the native User-Agent callback
**before** calling `window.navigate`, outside the callback. The identifier,
WebView profile path, keys, and remote IPC policy are unchanged. Confirmation
that this resolves the user's observed hang still requires their retest.

v0.1.1 also enables bounded Rust host logging in Windows Release builds before
creating the window. Press Win+R and enter:

```text
%LOCALAPPDATA%\world.onelev1.app\logs
```

The current file is `desktop.log`, with up to three archived files, about 1 MB
per file. Logging contains startup checkpoints, app version/process ID, native
errors and page-load categories (`local shell`/`live site`), not page paths,
queries or JavaScript console forwarding. Other libraries' HTTP/debug logging
is disabled. Review errors for personal paths before sharing. To read the last
100 lines without collecting the profile:

```powershell
Get-Content "$env:LOCALAPPDATA\world.onelev1.app\logs\desktop.log" -Tail 100
```

Expected checkpoints include `main window created`, `native WebView2 callback
returning`, `native callback returned; navigating to local shell`, and `setup
complete`. Missing/later checkpoints narrow down the hang. Keep old diagnostic
files; do not delete the data/profile directory or uninstall to troubleshoot.
After the new CI installer is built, close only the unresponsive 1lev1 process
via Task Manager and install v0.1.1 over it. Do not claim this startup defect is
fixed on Windows 10/11 until that CI build has actually been retested.

## One-time owner action: permanent updater key

The session's GitHub integration returned HTTP 403 for Secrets/Variables access
and Actions dispatch. This does **not** prove the secrets are absent. Reconnect
GitHub in Arena with the relevant repository permissions, or do the following
on the owner's trusted machine. Do not paste any private key, password, or
GitHub credentials into chat.

1. In a local checkout with `npm ci` already completed, generate **one permanent**
   updater signing key outside the repository (PowerShell):

   ```powershell
   npx tauri signer generate --write-keys "$HOME\1lev1-updater.key"
   ```

   Choose a password at the interactive prompt. The `.pub` file is public. Keep
   the private file and password in an encrypted backup **outside GitHub**.
   Do not regenerate a key when retrying CI; losing/changing it strands existing
   installations. If a production key already exists, use that key instead.

2. With the owner's existing authenticated `gh` session:

   ```powershell
   Get-Content -Raw "$HOME\1lev1-updater.key" | gh secret set TAURI_SIGNING_PRIVATE_KEY --repo Avi-ADAM/1.0
   gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --repo Avi-ADAM/1.0
   gh variable set TAURI_UPDATER_PUBLIC_KEY --repo Avi-ADAM/1.0 --body (Get-Content -Raw "$HOME\1lev1-updater.key.pub")
   ```

   The second command prompts for the signing-key password. GitHub **Secrets**
   must hold the private key and password. The public `.pub` contents can be
   stored either in a repository **Variable** or a repository **Secret** named
   `TAURI_UPDATER_PUBLIC_KEY`. Both installer builds and public verification
   prefer the Variable when nonempty, otherwise fall back to the Secret. The
   owner currently stores all three values as Repository Secrets, which is
   supported; no key needs to be moved or regenerated. Do not set conflicting
   values in the two locations. No private key is written into this checkout.

3. `prepare-release.mjs` validates the key format, immutable identifier, numeric
   MSI-compatible version, matching release tag, and public manifest URL. It
   writes only the public key into the ignored
   `scratch/desktop/signing.conf.json` overlay (`plugins.updater.pubkey`). CI
   passes this overlay to Tauri. The empty public-key slot in the checked-in
   Windows config is **not a production key**: installer CI fails closed if
   signing inputs are unavailable. Do not distribute an ad-hoc build that
   bypasses this preflight.

The workflow never creates signing keys automatically or uploads private keys
as artifacts. Test keys used by Node tests exist in memory only and never
enter an installer.

## Build and publication

After a workflow/code fix, trigger a **new** workflow dispatch on the work branch.
“Re-run failed jobs” uses the original run's commit and will not pick up a newer
workflow. Re-running is appropriate only for a secrets/variables-only fix with
no code changes. In particular, the public-key Secret fallback requires a new
run after the fix is pushed.

The workflow is `.github/workflows/desktop-windows.yml`. Node 22 follows the
Windows plan; the website's existing Node 24 engine setting is not changed
(`npm ci` emits a warning, not an error). The action explicitly sets
`tauriScript: npx --no-install tauri`: otherwise the existing `yarn.lock` makes
`tauri-action` select Yarn, whose strict Node engine check rejects Node 22.
`--no-install` uses the CLI from `npm ci` without fetching a different version.
Neither lockfile nor the website engine needs to change. The action's message
"Couldn't parse --config flag as inline JSON" is expected for a config file
path and is not the build failure.

- Branch pushes run Windows native/unit tests and Android-target `cargo check`.
- `workflow_dispatch` or `desktop-v<version>` builds NSIS + MSI with permanent
  updater signatures and `latest.json`, using `tauri-apps/tauri-action@v0`.
- The Windows config has no `beforeBuildCommand`; it bundles the local shell,
  not SvelteKit.
- Releases are created as **drafts**. The workflow downloads the actual Release
  assets again and verifies signatures cryptographically using the configured
  public key, sidecars, file magic, version, NSIS preference, and the existing
  download-page parser. It uploads `ci-evidence.json` with the commit and SHA256
  of each installer alongside the installers in a workflow artifact.
- Never overwrite an already published version. Increment the shared
  `src-tauri/tauri.conf.json` version (and package version in `Cargo.toml`), keep
  the identifier and signing key, and use the corresponding new tag.

Once Actions permission is available, run on the session branch:

```sh
gh workflow run desktop-windows.yml --ref arena/6127ca68-1-0
```

If GitHub refuses dispatch until the workflow exists on the default branch,
merge the reviewed PR through the repository's normal approval process first.
Do not move this session to another branch.

Download the `windows-installers-desktop-v<version>` workflow artifact or the
draft Release assets. On each test machine compare:

```powershell
Get-FileHash .\<the-CI-setup.exe> -Algorithm SHA256
```

against `ci-evidence.json`. Record the CI run URL, commit, filenames and hashes
below. A locally rebuilt installer is **not** interchangeable evidence.

After the baseline real-machine checks, the owner may publish the draft as the
latest release. A draft cannot be fetched anonymously by either the updater or
website. For the update acceptance check, publish the next patch version using
the **same** key; declining and then accepting the update both need testing.
Do not delete accepted releases or roll back their version numbers.

## Website contract / public verification

Set on the **existing website deployment**, then redeploy without changing its
hosting plan:

```dotenv
DESKTOP_RELEASE_MANIFEST_URL=https://github.com/Avi-ADAM/1.0/releases/latest/download/latest.json
```

No website code change is necessary. `ANDROID_DOWNLOAD_URL` is unrelated and
is left untouched. Until the release is public and this variable is deployed,
“coming soon” is expected. Allow the existing 10-minute server cache to expire.
Use `/download/windows` and `/download/windows-msi` in permanent links.

After publication/deployment, dispatch the public-only check:

```sh
gh workflow run desktop-windows.yml --ref arena/6127ca68-1-0 -f verify_public=true
```

This downloads the public assets **without an Authorization header**, verifies
both updater signatures and SHA256s, checks the live `/download` version/EXE
link and both stable redirects, and uploads `desktop-public-evidence`. It does
not build or publish another installer. Network access from this agent cannot
reach `www.1lev1.com`, so use the hosted CI check or the owner's machine.

## Microsoft Store (MSIX) track — implemented, not yet packaged or submitted

An additional MSIX distribution track exists alongside the existing
updater-signed EXE/MSI installers; it does not replace or alter them:

- Cargo feature `msix-store` (`src-tauri/Cargo.toml`): in the Store flavour
  the GitHub updater plugin is not registered and no update check runs —
  MSIX updates are delivered by the Microsoft Store. Default (EXE/MSI)
  builds do not enable the feature and keep the existing updater.
- `scripts/desktop/package-msix.mjs` stages the x64 package (executable,
  `AppxManifest.xml`, existing Square/Store tile assets), validates the
  manifest with the Windows SDK's MakeAppx, and verifies the packed file.
- Workflow: dispatching with `build_msix=true` produces only an Actions
  artifact and creates/changes no GitHub Release. In a future Release
  build, the MSIX is attached to the **draft** Release — only when the
  identity variables below are configured.
- The identifier stays `world.onelev1.app`; `src-tauri/gen/android` is
  untouched. No signing certificate was bought or configured: the built
  MSIX is unsigned, and Microsoft signs it after Store certification.
- No actual `.msix` file has been produced yet.

Prerequisite owner action: a Microsoft account alone does not provide the
package identity. Create the product in Partner Center and reserve its
name, then set these **repository variables** (GitHub → Settings → Secrets
and variables → Actions → Variables). They are public package identity
values, not secrets — do not store them as secrets:

```text
MSIX_PACKAGE_NAME
MSIX_PUBLISHER
MSIX_PUBLISHER_DISPLAY_NAME
MSIX_DISPLAY_NAME
```

After setting them, dispatch the workflow with `build_msix=true` to get
the `windows-msix-x64` artifact. Still outstanding before submission: a
real installation test and the Windows App Certification Kit; the
`runFullTrust` capability may also need a justification in the Store
review notes.

## Acceptance record — no boxes pre-checked

Fill **both** OS columns with PASS/FAIL, test date, tester, and evidence. Include
the Windows build number, WebView2 version, and standard-user account status.
CI Windows Server is not a substitute for Windows 10 and Windows 11.

- Public baseline release/tag: `desktop-v0.1.2`
- Baseline CI run / commit: `38574741215` / `e61e3eabcd0077e6d0f022e7ca23891aa207905a`
- NSIS filename / SHA256: `1lev1_0.1.2_x64-setup.exe` / `347e435dadeb31777b61dc359f8f695568e7cbf94d2c4b4aa11dfc2f03f2ebcf`
- MSI filename / SHA256: `1lev1_0.1.2_x64_en-US.msi` / `d2fdd7384feb355057e8cd1e917933113c31432f6f3eb6fb257c33e871ccd41a`
- Update release/tag, CI run, hashes: pending
- Public verification CI run / artifact: pending
- Windows 10 build / WebView2 / tester: pending
- Windows 11 build / WebView2 / tester: pending

| Plan §10 | Windows 10 | Windows 11 | Evidence required |
|---|---|---|---|
| 1. Hebrew installation without admin/UAC; Start shortcut | PENDING | PENDING | Install the CI NSIS as a standard user; test with WebView2 installed and absent; record any bootstrapper elevation |
| 2. Login, `/lev`, create task, chat, Kanban drag | PENDING | PENDING | Use an authorized test account/space; do not post test content to real users |
| 3. Reopen: login persists; size/position restored | PENDING | PENDING | Close/reopen normally, after reboot, and with a previously connected monitor absent |
| 4. Second icon launch focuses only one instance | PENDING | PENDING | Test minimized window and task manager process/window count |
| 5. External link in default browser; embedded YouTube works | PENDING | PENDING | Include `_blank`, `window.open`, internal popup, mailto/tel; export/invoice download saved and shown |
| 6. Offline startup and retry after network returns | PENDING | PENDING | Disconnect before launch; also simulate connected network without internet; reconnect and retry |
| 7. Next patch detected and installed in-app | PENDING | PENDING | Published next patch, same key; Hebrew consent, decline first, accept on next check/relaunch; session persists |
| 8. Public page/version/download and stable redirect | PENDING | PENDING | `desktop-public-evidence` for the actual release plus browser download/hash check |
| 9. Android APK build unchanged | PENDING | PENDING | `npm run android:apk` on existing SDK/NDK environment; CI `cargo check` alone is not an APK test |

Also test the MSI on a disposable managed machine; MSI is not the no-UAC promise
made for the primary NSIS installer. Record failures instead of weakening the
acceptance criteria.

## Evidence available so far

- Local `node --test scripts/desktop/desktop.test.mjs`: 24 passed for v0.1.2.
- Local `npx vitest run src/lib/download/release.test.ts`: 10 passed.
- Actual Tauri CLI test-only signature verified successfully by the Node crypto
  verifier (not merely a mock signature).
- `gen/android` and the Android shell have no diff; base `tauri.conf.json`
  differs only in the shared release version.
- Windows host compilation + 2 Rust policy tests and Android-target check passed:
  https://github.com/Avi-ADAM/1.0/actions/runs/38553924878
  (commit `67cb383bb10e0077e0cce6c53df7149180c35bcd`; 20 Node tests also passed).
  This is implementation validation, not a release/installer acceptance run.
- The CI-resolved Cargo.lock was imported in `ed84fff`; no existing dependency
  version was removed or upgraded. Subsequent checks/builds use `--locked`.
- The earlier run `38553044826` failed native compilation; the native dialog
  API calls were corrected before the successful run. Build logs/artifact
  downloads redirect to storage hosts unavailable in the agent's network;
  compiler failures are now also surfaced as GitHub check annotations.

**The release is public with the owner's approval.** Formal §10 evidence is
still incomplete until the live website/public check and both real-OS acceptance
records, including the update path and Android APK regression, are recorded.
