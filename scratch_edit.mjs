import fs from 'fs';
const p='src/lib/components/ui/RikmaLicenseBadge.svelte';
let s=fs.readFileSync(p,'utf8');
const rep=(a,b)=>{ if(!s.includes(a)) throw new Error('miss '+a.slice(0,60)); s=s.replace(a,b); };
rep(`   * actually permits (§2.1).
   *`,
`   * actually permits (§2.1).
   *
   * A shared license (\`rikmaShared*\`, §2.1.1) never reads as a prohibition:
   * it is an invitation, and with \`joinHref\` it links to the join page's two
   * tracks (open missions / needed resources, or propose your own).
   *`);
rep(`   * @property {string | null | undefined} [since]`,
`   * @property {string | null | undefined} [since]
   * @property {string | null | undefined} [joinHref] where "create with us" leads; omit for members`);
rep(`import { effectiveLicense, isRikmaLicense } from '$lib/codeLicense/codeLicense.js';`,
`import {
    effectiveLicense,
    isDelayedLicense,
    isRikmaLicense,
    isSharedLicense
  } from '$lib/codeLicense/codeLicense.js';`);
rep(`let { license, openYears = null, since = null } = $props();`,
`let { license, openYears = null, since = null, joinHref = null } = $props();`);
rep(`  let restrictive = $derived(isRikmaLicense(l));

  let label = $derived(
    l === 'rikmaDelayed'
      ? $t('ui.license.rikmaDelayed', { years: openYears ?? '' })
      : $t(\`ui.license.\${l}\`)
  );`,
`  let restrictive = $derived(isRikmaLicense(l));
  let shared = $derived(isSharedLicense(l));

  let label = $derived(
    isDelayedLicense(l)
      ? $t(\`ui.license.\${l}\`, { years: openYears ?? '' })
      : $t(\`ui.license.\${l}\`)
  );

  let hint = $derived(
    shared
      ? $t('ui.license.sharedHint')
      : restrictive
        ? $t('ui.license.rikmaHint')
        : $t('ui.license.openHint')
  );`);
rep(`  <div class="license" class:restrictive>`, `  <div class="license" class:restrictive class:shared>`);
rep(`        {#if restrictive}`, `        {#if shared}
          <circle cx="8" cy="9" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M3 20c0-3 2.2-5 5-5s5 2 5 5M11 20c0-3 2.2-5 5-5s5 2 5 5" />
        {:else if restrictive}`);
rep(`    <span class="license-hint">
      {restrictive ? $t('ui.license.rikmaHint') : $t('ui.license.openHint')}
    </span>`,
`    <span class="license-hint">{hint}</span>
    {#if shared && joinHref}
      <a class="license-join" href={joinHref}>{$t('ui.license.sharedJoin')}</a>
    {/if}`);
rep(`  .license-name {`,
`  .license.shared {
    border-color: rgba(238, 130, 238, 0.55);
  }
  .license-name {`);
rep(`  .license-hint {`,
`  .shared .license-name {
    color: #f5b8f5;
  }
  .license-join {
    margin-top: 0.15rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: #f0c040;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .license-join:hover {
    color: #ffd700;
  }
  .license-hint {`);
fs.writeFileSync(p,s);

const pp='src/routes/(regandnon)/project/[id]/+page.svelte';
let q=fs.readFileSync(pp,'utf8');
const a=`              since={project.attributes.codeLicenseSince}
            />`;
if(!q.includes(a)) throw new Error('page');
q=q.replace(a,`              since={project.attributes.codeLicenseSince}
              joinHref="/project/{projectId}/join"
            />`);
fs.writeFileSync(pp,q);

const ep='src/lib/components/prPr/EditProjectDetails.svelte';
let e=fs.readFileSync(ep,'utf8');
const r2=(x,y)=>{ if(!e.includes(x)) throw new Error('edit '+x.slice(0,50)); e=e.replace(x,y); };
r2(`      <option value="rikmaDelayed">{$t('project.editDetails.codeLicenseRikmaDelayed')}</option>
    </select>
    {#if codeLicense === 'rikmaDelayed'}`,
`      <option value="rikmaDelayed">{$t('project.editDetails.codeLicenseRikmaDelayed')}</option>
      <option value="rikmaShared">{$t('project.editDetails.codeLicenseRikmaShared')}</option>
      <option value="rikmaSharedDelayed">{$t('project.editDetails.codeLicenseRikmaSharedDelayed')}</option>
    </select>
    {#if isDelayedLicense(codeLicense)}`);
fs.writeFileSync(ep,e);
