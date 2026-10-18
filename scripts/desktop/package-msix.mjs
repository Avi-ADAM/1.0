// Package the Windows desktop app as an unsigned x64 MSIX for the
// Microsoft Store, alongside — never instead of — the existing
// updater-signed EXE/MSI installers.
//
// The package identity does NOT come from a Microsoft account alone: the
// product must first be created in Partner Center and its name reserved.
// Partner Center then shows the exact identity values, which are stored as
// *repository variables* (they are public package metadata, not secrets):
//
//   MSIX_PACKAGE_NAME           e.g. <publisher-id>.1lev1 (Identity Name)
//   MSIX_PUBLISHER              e.g. CN=<guid>            (Identity Publisher)
//   MSIX_PUBLISHER_DISPLAY_NAME Partner Center publisher display name
//   MSIX_DISPLAY_NAME           Reserved product name shown in the Store
//
// No code-signing certificate is bought or configured here: MakeAppx
// produces an UNSIGNED package and Microsoft signs it after Store
// certification. A real install test and the Windows App Certification
// Kit still have to pass before submission; the `runFullTrust` capability
// may also need a justification in the Store review notes.
//
// Usage (on Windows, with the Windows 10/11 SDK installed):
//   node scripts/desktop/package-msix.mjs --check
//   node scripts/desktop/package-msix.mjs --exe <app.exe> --out <file.msix>
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const MSIX_ENV_VARS = [
  'MSIX_PACKAGE_NAME',
  'MSIX_PUBLISHER',
  'MSIX_PUBLISHER_DISPLAY_NAME',
  'MSIX_DISPLAY_NAME'
];

// The executable name inside the package. The Cargo/Tauri binary is staged
// under this name so the manifest does not depend on the crate name.
export const MSIX_EXECUTABLE = '1lev1.exe';

// Store tile assets that already ship in src-tauri/icons (generated for the
// Tauri bundle); they are copied into the package's Assets folder as-is.
export const MSIX_ASSETS = [
  'Square150x150Logo.png',
  'Square44x44Logo.png',
  'StoreLogo.png',
  'Square310x310Logo.png',
  'Square71x71Logo.png',
  'Square107x107Logo.png',
  'Square142x142Logo.png',
  'Square284x284Logo.png',
  'Square89x89Logo.png',
  'Square30x30Logo.png'
];

function cleanDisplayName(value, variable) {
  const name = value?.trim();
  if (!name) throw new Error(`${variable} must not be empty`);
  if (name.length > 256 || /[\u0000-\u001f<>]/.test(name)) {
    throw new Error(`${variable} must be 1-256 printable characters without angle brackets`);
  }
  return name;
}

/**
 * Read the Partner Center identity from the environment.
 * Returns null when none of the variables is set (MSIX is simply not
 * configured yet), and throws when only some of them are set — a partial
 * identity would produce a package the Store rejects.
 */
export function msixIdentity(env = process.env) {
  const values = Object.fromEntries(MSIX_ENV_VARS.map((name) => [name, env[name]?.trim() ?? '']));
  if (MSIX_ENV_VARS.every((name) => !values[name])) return null;
  const missing = MSIX_ENV_VARS.filter((name) => !values[name]);
  if (missing.length) {
    throw new Error(
      `Incomplete MSIX identity: set ${missing.join(', ')} in GitHub repository variables ` +
      `(Partner Center product identity), or unset all ${MSIX_ENV_VARS.join('/')}`
    );
  }
  const packageName = values.MSIX_PACKAGE_NAME;
  // Partner Center identity names: 3-50 chars, letters/digits/hyphen/period.
  if (!/^[A-Za-z0-9][A-Za-z0-9.-]{1,48}[A-Za-z0-9]$/.test(packageName)) {
    throw new Error('MSIX_PACKAGE_NAME must be the 3-50 character Partner Center identity name (letters, digits, hyphen, period)');
  }
  const publisher = values.MSIX_PUBLISHER;
  if (!/^CN=[^,<>"]+(,\s*(O|OU|L|S|C|STREET)=[^,<>"]+)*$/i.test(publisher)) {
    throw new Error('MSIX_PUBLISHER must be the Partner Center publisher distinguished name, starting with CN=');
  }
  return {
    packageName,
    publisher,
    publisherDisplayName: cleanDisplayName(values.MSIX_PUBLISHER_DISPLAY_NAME, 'MSIX_PUBLISHER_DISPLAY_NAME'),
    displayName: cleanDisplayName(values.MSIX_DISPLAY_NAME, 'MSIX_DISPLAY_NAME')
  };
}

export function requireMsixIdentity(env = process.env) {
  const identity = msixIdentity(env);
  if (!identity) {
    throw new Error(
      `MSIX identity is not configured: create the product in Partner Center, reserve its name, ` +
      `then set repository variables ${MSIX_ENV_VARS.join(', ')} (public identity values, not secrets)`
    );
  }
  return identity;
}

/** MSIX versions are four numeric parts; the revision stays 0 for the Store. */
export function toMsixVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
    throw new Error(`MSIX packaging requires a major.minor.patch version, got: ${version}`);
  }
  const parts = version.split('.').map(Number);
  if (parts.some((part) => part > 65535)) throw new Error('Version parts must each fit in 16 bits for MSIX');
  return `${version}.0`;
}

export function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * AppxManifest for a full-trust desktop app wrapping the Tauri binary.
 * `runFullTrust` is required because this is a Win32 app, and
 * `internetClient` because it loads the live site; both are declared, none
 * are broadened beyond that.
 */
export function buildAppxManifest({ identity, version, executable = MSIX_EXECUTABLE }) {
  assert.ok(identity, 'An MSIX identity is required');
  const msixVersion = toMsixVersion(version);
  return `<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">
  <Identity Name="${escapeXml(identity.packageName)}" Publisher="${escapeXml(identity.publisher)}" Version="${msixVersion}" ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>${escapeXml(identity.displayName)}</DisplayName>
    <PublisherDisplayName>${escapeXml(identity.publisherDisplayName)}</PublisherDisplayName>
    <Logo>Assets\\StoreLogo.png</Logo>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Resources>
    <Resource Language="he-IL" />
    <Resource Language="en-US" />
  </Resources>
  <Applications>
    <Application Id="OneLev1" Executable="${escapeXml(executable)}" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="${escapeXml(identity.displayName)}"
        Description="${escapeXml(identity.displayName)}"
        Square150x150Logo="Assets\\Square150x150Logo.png"
        Square44x44Logo="Assets\\Square44x44Logo.png"
        BackgroundColor="transparent" />
    </Application>
  </Applications>
  <Capabilities>
    <Capability Name="internetClient" />
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
`;
}

/**
 * Stage the package layout (executable + manifest + tile assets) that
 * MakeAppx packs. Pure file copying, so it is testable off Windows; only
 * the actual MakeAppx invocation requires Windows.
 */
export function createPackageLayout({ stagingDir, executablePath, identity, version, iconsDir }) {
  assert.ok(existsSync(executablePath), `Desktop executable not found: ${executablePath}`);
  rmSync(stagingDir, { recursive: true, force: true });
  const assetsDir = join(stagingDir, 'Assets');
  mkdirSync(assetsDir, { recursive: true });
  copyFileSync(executablePath, join(stagingDir, MSIX_EXECUTABLE));
  for (const asset of MSIX_ASSETS) {
    const source = join(iconsDir, asset);
    assert.ok(existsSync(source), `MSIX tile asset missing: ${source}`);
    copyFileSync(source, join(assetsDir, asset));
  }
  const manifestPath = join(stagingDir, 'AppxManifest.xml');
  writeFileSync(manifestPath, buildAppxManifest({ identity, version }));
  return { stagingDir, manifestPath, executable: join(stagingDir, MSIX_EXECUTABLE), assetsDir };
}

export function makeAppxCandidates(env = process.env) {
  if (env.MAKEAPPX_PATH?.trim()) return [env.MAKEAPPX_PATH.trim()];
  const kitsRoot = join(env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Windows Kits', '10', 'bin');
  if (!existsSync(kitsRoot)) return [];
  return readdirSync(kitsRoot)
    .filter((name) => /^\d+\.\d+\.\d+\.\d+$/.test(name))
    .sort()
    .reverse()
    .map((sdkVersion) => join(kitsRoot, sdkVersion, 'x64', 'makeappx.exe'));
}

export function findMakeAppx(env = process.env) {
  return makeAppxCandidates(env).find((candidate) => existsSync(candidate)) ?? null;
}

/** An .msix is a ZIP container: verify the packed file is really one. */
export function assertMsixPackage(packagePath) {
  const bytes = readFileSync(packagePath);
  assert.ok(bytes.length > 1024, 'MSIX package is suspiciously small');
  assert.ok(bytes.subarray(0, 2).equals(Buffer.from('PK')), 'MSIX package must be a ZIP (PK) container');
  return {
    path: packagePath,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
}

export function packageMsix({ executablePath, outputPath, identity, version, iconsDir, stagingDir, makeAppxPath }) {
  const layout = createPackageLayout({ stagingDir, executablePath, identity, version, iconsDir });
  mkdirSync(dirname(outputPath), { recursive: true });
  // MakeAppx validates the manifest while packing. No /sign flags are ever
  // passed: the package stays unsigned and Microsoft signs it for the Store.
  const result = spawnSync(makeAppxPath, ['pack', '/d', layout.stagingDir, '/p', outputPath, '/o', '/v'], {
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `MakeAppx failed with exit code ${result.status}`);
  return { ...assertMsixPackage(outputPath), manifestPath: layout.manifestPath };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const identity = requireMsixIdentity();
  const version = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version;
  if (process.argv.includes('--check')) {
    // Fail fast in CI before a long Rust build: identity + version only.
    console.log(`MSIX identity configured for ${identity.packageName}; package version ${toMsixVersion(version)}`);
  } else {
    if (process.platform !== 'win32') {
      throw new Error('MSIX packaging requires Windows with the Windows SDK (MakeAppx) installed');
    }
    const executablePath = argument('--exe');
    const outputPath = argument('--out');
    assert.ok(executablePath && outputPath, 'Usage: node scripts/desktop/package-msix.mjs --exe <app.exe> --out <file.msix>');
    const makeAppxPath = findMakeAppx();
    assert.ok(makeAppxPath, 'MakeAppx.exe not found; install the Windows 10/11 SDK or set MAKEAPPX_PATH');
    const evidence = packageMsix({
      executablePath,
      outputPath,
      identity,
      version,
      iconsDir: 'src-tauri/icons',
      stagingDir: 'scratch/desktop/msix/staging',
      makeAppxPath
    });
    writeFileSync(`${outputPath}.json`, `${JSON.stringify({ ...evidence, version: toMsixVersion(version), packageName: identity.packageName, architecture: 'x64', signed: false }, null, 2)}\n`);
    console.log(JSON.stringify(evidence, null, 2));
  }
}
