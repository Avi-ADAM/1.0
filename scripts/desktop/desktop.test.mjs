import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { canReachSite, mountShell } from '../../src-tauri/shell/windows.js';
import { prepareRelease, manifestUrl } from './prepare-release.mjs';
import { verifyRelease } from './verify-release.mjs';
import { verifyUpdaterSignature } from './verify-signature.mjs';
import { parseReleaseManifest } from '../../src/lib/download/release.js';
import { msixIdentity, toMsixVersion, buildAppxManifest, createPackageLayout, MSIX_EXECUTABLE } from './package-msix.mjs';

const read = (path) => readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const base = json('src-tauri/tauri.conf.json');
const windows = json('src-tauri/tauri.windows.conf.json');
const merged = { ...base, ...windows, app: { ...base.app, ...windows.app }, bundle: { ...base.bundle, ...windows.bundle } };

// Ephemeral keys are exclusively test fixtures. They are never written to the
// repository, CI signing configuration, or a distributable installer.
const pair = generateKeyPairSync('ed25519');
const id = Buffer.from('0102030405060708', 'hex');
const rawPublic = pair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
const publicKey = Buffer.from(`untrusted comment: test key\n${Buffer.concat([Buffer.from('Ed'), id, rawPublic]).toString('base64')}\n`).toString('base64');
function signature(bytes, algorithm = 'ED') {
  const digest = algorithm === 'ED' ? createHash('blake2b512').update(bytes).digest() : bytes;
  const sig = sign(null, digest, pair.privateKey);
  const packet = Buffer.concat([Buffer.from(algorithm), id, sig]);
  const comment = 'timestamp:1';
  const global = sign(null, Buffer.concat([sig, Buffer.from(comment)]), pair.privateKey);
  return Buffer.from(`untrusted comment: test signature\n${packet.toString('base64')}\ntrusted comment: ${comment}\n${global.toString('base64')}\n`).toString('base64');
}

test('Windows merged config validates against the installed Tauri schema', () => {
  const require = createRequire(import.meta.url);
  const Ajv = require('ajv');
  const ajv = new Ajv({ strict: false, validateFormats: false, unicodeRegExp: false });
  const validate = ajv.compile(json('node_modules/@tauri-apps/cli/config.schema.json'));
  assert.ok(validate(merged), JSON.stringify(validate.errors));
});

test('Mobile defaults, identifier, and shell remain unchanged; no SPA build', () => {
  assert.equal(base.identifier, 'world.onelev1.app');
  assert.equal(windows.identifier, undefined);
  assert.equal(base.app.windows[0].url, 'https://www.1lev1.com/?app=1');
  assert.equal(base.app.windows[0].width, 420);
  assert.equal(base.app.windows[0].height, 900);
  assert.equal(base.build.frontendDist, './shell');
  assert.equal(merged.build.beforeBuildCommand, undefined);
  assert.equal(base.plugins, undefined);
  assert.ok(!read('src-tauri/shell/index.html').includes('windows.js'));
  assert.equal(json('package.json').scripts['android:apk'], 'tauri android build --debug --apk --target aarch64');
});

test('Windows replaces the entire window array without losing the local URL or label', () => {
  assert.equal(merged.app.windows.length, 1);
  const w = merged.app.windows[0];
  assert.equal(w.label, 'main');
  assert.equal(w.title, '1💗1');
  assert.equal(base.app.windows[0].title, '1לב1', 'Windows branding must not change the Android title');
  assert.equal(w.url, 'windows.html');
  assert.equal(w.create, false);
  assert.deepEqual([w.width, w.height, w.minWidth, w.minHeight], [1280, 820, 380, 600]);
  assert.equal(w.center, true);
  assert.equal(w.dragDropEnabled, false);
  assert.ok(merged.bundle.icon.includes('icons/icon.ico'));
});

test('No remote IPC grants, global Tauri API, or frontend plugin permissions', () => {
  for (const name of readdirSync('src-tauri/capabilities').filter((name) => name.endsWith('.json'))) {
    const capability = json(`src-tauri/capabilities/${name}`);
    assert.equal(capability.remote, undefined);
    assert.ok(!capability.permissions.some((p) => /^(updater|opener|process|dialog|window-state):/.test(p)));
  }
  assert.notEqual(merged.app.withGlobalTauri, true);
  assert.ok(read('src-tauri/src/desktop.rs').includes('open_js_links_on_click(false)'));
  assert.ok(read('src-tauri/src/lib.rs').includes('#[cfg(all(desktop, target_os = "windows"))]'));
});

test('Installers remain per-user, bilingual, updater-signed, with no paid signing config', () => {
  assert.deepEqual(windows.bundle.targets, ['nsis', 'msi']);
  assert.equal(windows.bundle.windows.nsis.installMode, 'currentUser');
  assert.deepEqual(windows.bundle.windows.nsis.languages, ['Hebrew', 'English']);
  assert.equal(windows.bundle.windows.nsis.displayLanguageSelector, true);
  assert.equal(windows.bundle.windows.webviewInstallMode.type, 'downloadBootstrapper');
  assert.equal(windows.bundle.windows.signCommand, undefined);
  assert.equal(windows.bundle.windows.certificateThumbprint, undefined);
  assert.equal(windows.bundle.createUpdaterArtifacts, true);
  assert.equal(windows.plugins.updater.windows.installMode, 'passive');
  assert.deepEqual(windows.plugins.updater.endpoints, [manifestUrl]);
});

test('Offline detection never fetches when navigator reports offline', async () => {
  assert.equal(await canReachSite({ online: false, fetchFn: () => { throw new Error('must not fetch'); } }), false);
});

test('Opaque no-cors response is online; credentials are never sent', async () => {
  assert.equal(await canReachSite({ online: true, fetchFn: async (url, options) => {
    assert.ok(url.startsWith('https://www.1lev1.com/favicon.ico?'));
    assert.equal(options.mode, 'no-cors');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.credentials, 'omit');
    return { status: 0, ok: false };
  } }), true);
});

test('Offline network errors and timed-out probes stay in the local shell', async () => {
  assert.equal(await canReachSite({ online: true, fetchFn: async () => { throw new TypeError('network'); } }), false);
  assert.equal(await canReachSite({ online: true, timeout: 5, fetchFn: (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('timeout')));
  }) }), false);
});

test('Retry after reconnection navigates to the live site without IPC', async () => {
  const events = {};
  const retry = { disabled: false, addEventListener: (event, cb) => { events[event] = cb; } };
  const status = {};
  const navigator = { onLine: false };
  const destinations = [];
  const connect = mountShell({
    document: { getElementById: (id) => id === 'retry' ? retry : status }, navigator,
    window: { addEventListener: (event, cb) => { events[event] = cb; }, location: { replace: (url) => destinations.push(url) } },
    fetchFn: async () => ({ status: 0 })
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(status.textContent, /לא הצלחנו/);
  assert.equal(destinations.length, 0);
  assert.equal(retry.disabled, false);
  navigator.onLine = true;
  await events.click();
  assert.deepEqual(destinations, ['https://www.1lev1.com/']);
  assert.equal(events.online, connect);
});

test('Startup does not re-enter Tauri dispatch while with_webview holds its mutex', () => {
  const source = read('src-tauri/src/desktop.rs');
  const begin = source.indexOf('window.with_webview(move |webview| {');
  const end = source.indexOf('\n    })?;', begin);
  assert.ok(begin >= 0 && end > begin);
  const callback = source.slice(begin, end);
  assert.doesNotMatch(callback, /\b(?:window|ready_window|app)\.(?:navigate|url|show|set_title|set_focus|run_on_main_thread)\s*\(/);
  assert.ok(callback.includes('settings.SetUserAgent'));
  assert.ok(source.indexOf('window.navigate(Url::parse(LOCAL_SHELL)?)?;', end) > end);
});

test('Windows release logging is bounded, host-only, and installed before creating the window', () => {
  const source = read('src-tauri/src/desktop.rs');
  const setup = source.slice(source.indexOf('pub fn setup('), source.indexOf('let navigation_app'));
  assert.ok(setup.includes('tauri_plugin_log::Builder::new()'));
  assert.ok(setup.includes('TargetKind::LogDir'));
  assert.ok(setup.includes('Some("desktop".into())'));
  assert.ok(setup.includes('.max_file_size(1_000_000)'));
  assert.ok(setup.includes('RotationStrategy::KeepSome(3)'));
  assert.ok(setup.includes('.level(log::LevelFilter::Off)'));
  assert.ok(setup.includes('.level_for("app_lib", log::LevelFilter::Info)'));
  assert.ok(!setup.includes('debug_assertions'));
  assert.ok(!source.includes('TargetKind::Webview'));
  assert.ok(source.includes('startup_stage("setup complete")'));
  assert.ok(read('src-tauri/src/lib.rs').includes('#[cfg(not(all(desktop, target_os = "windows")))]'));
});

test('Installer action explicitly uses the npm-installed CLI instead of auto-detecting Yarn', () => {
  const workflow = read('.github/workflows/desktop-windows.yml');
  const action = workflow.split('uses: tauri-apps/tauri-action@v0')[1]?.split('      - name:')[0];
  assert.ok(action, 'Installer action must exist');
  assert.match(action, /^          tauriScript: npx --no-install tauri$/m);
  assert.match(action, /^          args: --config scratch\/desktop\/signing\.conf\.json --target x86_64-pc-windows-msvc -- --locked$/m);
  assert.equal(json('package.json').engines.node, '24.x', 'The website Node engine must not be weakened for desktop CI');
});

test('Both installer and public verification jobs accept a public-key variable or secret', () => {
  const workflow = read('.github/workflows/desktop-windows.yml');
  const publicKeyInputs = [...workflow.matchAll(/TAURI_UPDATER_PUBLIC_KEY: (.+)/g)].map((match) => match[1]);
  assert.deepEqual(publicKeyInputs, Array(2).fill('${{ vars.TAURI_UPDATER_PUBLIC_KEY || secrets.TAURI_UPDATER_PUBLIC_KEY }}'));
  assert.ok(workflow.includes('TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}'));
  assert.ok(workflow.includes('TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}'));
});

const valid = { base, windows, publicKey, privateKey: 'only-a-test-presence-marker', tag: `desktop-v${base.version}` };
test('Release overlay contains only a validated public key, never secrets', () => {
  assert.deepEqual(prepareRelease(valid), { plugins: { updater: { pubkey: publicKey } } });
});
for (const [name, overrides] of [
  ['missing private key', { privateKey: '' }],
  ['missing public key', { publicKey: '' }],
  ['malformed public key', { publicKey: 'dGVzdA==' }],
  ['mismatched tag', { tag: 'desktop-v99.0.0' }],
  ['changed identifier', { base: { ...base, identifier: 'invalid.changed' } }],
  ['prerelease version', { base: { ...base, version: '0.1.0-beta' } }],
  ['out-of-range MSI version', { base: { ...base, version: '256.1.0' } }]
]) test(`Release fails closed: ${name}`, () => assert.throws(() => prepareRelease({ ...valid, ...overrides })));

for (const algorithm of ['ED', 'Ed']) test(`Real ${algorithm} signature verification rejects tampered bytes`, () => {
  const bytes = Buffer.from('test installer contents');
  const sig = signature(bytes, algorithm);
  verifyUpdaterSignature(bytes, sig, publicKey);
  assert.throws(() => verifyUpdaterSignature(Buffer.from('tampered'), sig, publicKey));
  const changedComment = Buffer.from(Buffer.from(sig, 'base64').toString().replace('timestamp:1', 'timestamp:2')).toString('base64');
  assert.throws(() => verifyUpdaterSignature(bytes, changedComment, publicKey));
});

test('Actual-asset verifier connects download-page parser, hashes, sidecars and signing key', () => {
  const directory = mkdtempSync(join(tmpdir(), 'desktop-release-test-'));
  try {
    const manifest = { version: base.version, notes: 'בדיקה', pub_date: '2026-10-14T00:00:00Z', platforms: {} };
    for (const [kind, ext, magic] of [['nsis', 'exe', Buffer.from('MZ')], ['msi', 'msi', Buffer.from('d0cf11e0a1b11ae1', 'hex')]]) {
      const name = `1lev1_${base.version}_x64.${ext}`;
      const bytes = Buffer.concat([magic, Buffer.alloc(2048)]);
      const sig = signature(bytes);
      writeFileSync(join(directory, name), bytes);
      writeFileSync(join(directory, `${name}.sig`), sig);
      manifest.platforms[`windows-x86_64-${kind}`] = {
        url: `https://github.com/Avi-ADAM/1.0/releases/download/desktop-v${base.version}/${name}`, signature: sig
      };
    }
    manifest.platforms['windows-x86_64'] = manifest.platforms['windows-x86_64-nsis'];
    writeFileSync(join(directory, 'latest.json'), JSON.stringify(manifest));
    const evidence = verifyRelease(directory, base.version, publicKey);
    assert.equal(Object.keys(evidence.hashes).length, 2);
    assert.ok(parseReleaseManifest(manifest).windowsExe.endsWith('.exe'));
    writeFileSync(join(directory, `1lev1_${base.version}_x64.exe`), Buffer.from('not an installer'));
    assert.throws(() => verifyRelease(directory, base.version, publicKey));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('MSIX Store flavour disables the GitHub updater while EXE/MSI keep it', () => {
  const cargo = read('src-tauri/Cargo.toml');
  assert.match(cargo, /\[features\][\s\S]*msix-store = \[\]/);
  const source = read('src-tauri/src/desktop.rs');
  assert.ok(source.includes('GITHUB_UPDATER_ENABLED: bool = !cfg!(feature = "msix-store")'));
  assert.ok(source.includes('#[cfg(not(feature = "msix-store"))]\n    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());'));
  assert.ok(source.includes('updater: disabled in the Microsoft Store (MSIX) build; the Store delivers updates'));
  // The direct-download flavour is untouched: same bundle targets and updater.
  assert.deepEqual(windows.bundle.targets, ['nsis', 'msi']);
  const workflow = read('.github/workflows/desktop-windows.yml');
  assert.ok(workflow.includes('build_msix:'));
  assert.ok(workflow.includes('--features msix-store'));
});

test('MSIX identity comes only from the four Partner Center repository variables', () => {
  assert.equal(msixIdentity({}), null);
  assert.throws(() => msixIdentity({ MSIX_PACKAGE_NAME: 'Example.1lev1' }), /Incomplete MSIX identity/);
  const env = {
    MSIX_PACKAGE_NAME: 'ExamplePublisher.1lev1',
    MSIX_PUBLISHER: 'CN=11111111-2222-3333-4444-555555555555',
    MSIX_PUBLISHER_DISPLAY_NAME: 'Example Publisher',
    MSIX_DISPLAY_NAME: '1lev1'
  };
  assert.deepEqual(msixIdentity(env), {
    packageName: 'ExamplePublisher.1lev1',
    publisher: 'CN=11111111-2222-3333-4444-555555555555',
    publisherDisplayName: 'Example Publisher',
    displayName: '1lev1'
  });
  assert.throws(() => msixIdentity({ ...env, MSIX_PUBLISHER: 'Example Publisher' }), /CN=/);
  assert.throws(() => msixIdentity({ ...env, MSIX_PACKAGE_NAME: 'bad name!' }), /identity name/);
});

test('MSIX manifest and staged layout describe an unsigned x64 full-trust package', () => {
  assert.equal(toMsixVersion('0.1.2'), '0.1.2.0');
  assert.throws(() => toMsixVersion('0.1'), /major\.minor\.patch/);
  const identity = {
    packageName: 'ExamplePublisher.1lev1',
    publisher: 'CN=11111111-2222-3333-4444-555555555555',
    publisherDisplayName: 'Example & Sons',
    displayName: '1lev1'
  };
  const manifest = buildAppxManifest({ identity, version: base.version });
  assert.ok(manifest.includes('Name="ExamplePublisher.1lev1"'));
  assert.ok(manifest.includes(`Version="${base.version}.0" ProcessorArchitecture="x64"`));
  assert.ok(manifest.includes(`Executable="${MSIX_EXECUTABLE}" EntryPoint="Windows.FullTrustApplication"`));
  assert.ok(manifest.includes('<rescap:Capability Name="runFullTrust" />'));
  assert.ok(manifest.includes('<Capability Name="internetClient" />'));
  assert.ok(manifest.includes('Example &amp; Sons'), 'Manifest values must be XML-escaped');
  assert.ok(!manifest.includes('Sign'), 'No signing certificate is configured; the Store signs the package');

  const directory = mkdtempSync(join(tmpdir(), 'desktop-msix-test-'));
  try {
    const executablePath = join(directory, 'app.exe');
    writeFileSync(executablePath, Buffer.concat([Buffer.from('MZ'), Buffer.alloc(2048)]));
    const layout = createPackageLayout({
      stagingDir: join(directory, 'staging'),
      executablePath,
      identity,
      version: base.version,
      iconsDir: 'src-tauri/icons'
    });
    assert.ok(readFileSync(layout.manifestPath, 'utf8').includes('Windows.FullTrustApplication'));
    assert.ok(readFileSync(layout.executable).length > 1024);
    assert.ok(readFileSync(join(layout.assetsDir, 'Square150x150Logo.png')).length > 0);
    assert.ok(readFileSync(join(layout.assetsDir, 'StoreLogo.png')).length > 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
