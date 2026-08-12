/**
 * End-to-end money loop of a ONE-MEMBER rikma, from an empty account to a
 * closed profit split. This is the path that docs/QA_SOLO_RIKMA_2026-08.md
 * found broken in two places, so it is the path worth re-running after a deploy.
 *
 *   node scripts/smoke/flows/solo-money.mjs --yes
 *
 * ⚠ THIS WRITES TO THE LIVE DATABASE. Every run creates a rikma, a mission, a
 * resource, a product and a sale on the test account. Nothing is deleted
 * afterwards — the app has no delete (see R6 in the report) — so the account
 * accumulates one throwaway rikma per run. Name prefix: "בדיקה אוטומטית".
 *
 * What each step asserts:
 *   2  createMission          — a mission can be created at all
 *   3  applyToMission solo    — B2: works even though the description carries
 *                               `style="text-align: right;"` (an unescaped
 *                               quote used to 500 here)
 *   4  completeMission solo   — R1: the server closes it outright
 *                               (createdType === 'finnishedMission')
 *   6  voteOnMaap consensus   — a self-assigned resource clears with one vote,
 *                               giving the rikma some accrued value
 *   8  createTosplit +        — B1: a balanced split (halukas: []) is accepted
 *      approveHaluka            and finalized instead of being rejected
 */

import { session, visit, shot, BASE } from '../lib.mjs';

const argv = process.argv.slice(2);
if (!argv.includes('--yes')) {
  console.error(
    'This flow writes to the live database: it creates a rikma, a mission, a\n' +
      'resource, a product and a sale on the test account, and nothing is\n' +
      'cleaned up afterwards.\n\n' +
      'Re-run with --yes if that is what you want.'
  );
  process.exit(2);
}

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const RIKMA_NAME = `בדיקה אוטומטית ${stamp}`;
/** The quote in `style="…"` is the whole point of step 3 — do not remove it. */
const MISSION_DESC = 'תיאור עם מרכאות שנוצר בעורך העשיר — זה מה ששבר את applyToMission.';

const steps = [];
const record = (name, ok, detail = '') => {
  steps.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/** Capture the response of one action call while `fn` runs. */
function catcher(page) {
  const seen = [];
  page.on('response', async (r) => {
    if (!r.url().includes('/api/action') || r.request().method() !== 'POST') return;
    let key = '';
    let body = '';
    try {
      body = r.request().postData() || '';
      key = JSON.parse(body).actionKey;
    } catch {
      return;
    }
    let json = null;
    try {
      json = JSON.parse(await r.text());
    } catch {
      /* non-JSON body */
    }
    seen.push({ key, status: r.status(), json, body });
  });
  return {
    /** Newest call for `key`, or null. */
    last: (key) => [...seen].reverse().find((s) => s.key === key) ?? null,
    clear: () => (seen.length = 0)
  };
}

const run = async () => {
  const { page, close } = await session();
  const api = catcher(page);

  // ── 1. create the rikma ────────────────────────────────────────────────────
  await visit(page, '/me');
  await page.getByRole('button', { name: /יצירת ריקמה חדשה/ }).first().click();
  await page.waitForTimeout(4000);
  await page.fill('input[name="des"]', RIKMA_NAME);
  const editors = page.locator('[contenteditable="true"]');
  for (let i = 0; i < Math.min(await editors.count(), 2); i++) {
    await editors.nth(i).click();
    await page.keyboard.type(i === 0 ? 'ריקמה שנוצרה על ידי בדיקה אוטומטית.' : 'תיאור פנימי.');
    await page.waitForTimeout(300);
  }
  await page.fill('input[name="de"]', 'https://example.com');
  const values = page.locator('input[placeholder*="ערכים"]');
  if (await values.count()) {
    await values.first().click();
    await page.waitForTimeout(800);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  await page.getByRole('button', { name: /ליצור ולפרסם/ }).first().click({ force: true });
  await page.waitForTimeout(18000);
  const projectId = page.url().match(/\/moach\/(\d+)/)?.[1];
  record('1. rikma created', Boolean(projectId), projectId ? `id ${projectId}` : page.url());
  if (!projectId) return finish(page, close);

  // ── 2. mission with a rich-text description ────────────────────────────────
  await visit(page, `/moach/${projectId}/create`);
  await page.locator('g#button').first().click({ force: true });
  await page.waitForTimeout(3500);
  await page.fill('#mission-name-input', 'משימת בדיקה');
  const descEdit = page.locator('h3:has-text("תיאור") button').first();
  if (await descEdit.count()) {
    await descEdit.click({ force: true });
    await page.waitForTimeout(1200);
  }
  const missionDesc = page.locator('[contenteditable="true"]');
  if (await missionDesc.count()) {
    await missionDesc.first().click();
    await page.keyboard.type(MISSION_DESC);
    await page.waitForTimeout(500);
  }
  api.clear();
  await page.getByRole('button', { name: /^פרסום$/ }).first().click({ force: true });
  await page.waitForTimeout(14000);
  const created = api.last('createMission');
  const openMissionId = created?.json?.data?.createdEntityId;
  record(
    '2. mission created',
    created?.status === 200 && Boolean(openMissionId),
    openMissionId ? `openMission ${openMissionId}` : JSON.stringify(created?.json ?? {}).slice(0, 160)
  );

  // ── 3. take it myself (B2) ────────────────────────────────────────────────
  let missionInProgress = false;
  if (openMissionId) {
    await visit(page, `/availableMission/${openMissionId}`);
    api.clear();
    await page.getByRole('button', { name: /אני אשמח לבצע/ }).first().click({ force: true });
    await page.waitForTimeout(12000);
    const applied = api.last('applyToMission');
    missionInProgress = applied?.status === 200 && applied?.json?.success === true;
    record(
      '3. applied to my own mission (B2 — quoted description)',
      missionInProgress,
      applied
        ? `${applied.status} ${JSON.stringify(applied.json?.data ?? applied.json?.error ?? {}).slice(0, 160)}`
        : 'no applyToMission call was made'
    );
  }

  // ── 4. finish it (R1) ─────────────────────────────────────────────────────
  if (missionInProgress) {
    await visit(page, `/moach/${projectId}/progress`);
    const done = page.locator('button.mc-done');
    if (await done.count()) {
      await done.first().click();
      await page.waitForTimeout(3500);
      const why = page.locator('.mc-dialog textarea');
      if (await why.count()) {
        await why.fill('הושלם על ידי בדיקה אוטומטית.');
        api.clear();
        await page.getByRole('button', { name: /שליחה לאישור/ }).click();
        await page.waitForTimeout(13000);
      }
    }
    const finished = api.last('completeMission');
    record(
      '4. mission closed outright, not "awaiting approval" (R1)',
      finished?.json?.data?.createdType === 'finnishedMission',
      `createdType=${finished?.json?.data?.createdType ?? 'none'}`
    );
  }

  // ── 5. resource assigned to myself ────────────────────────────────────────
  await visit(page, `/moach/${projectId}/create`);
  await page.evaluate(() =>
    document.querySelector('#newbutton')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  );
  await page.waitForTimeout(4000);
  const resInputs = page.locator('input[type="text"]');
  let resourceCreated = false;
  if (await resInputs.count()) {
    await resInputs.nth(0).fill('משאב בדיקה');
    await resInputs.nth(1).fill('2000');
    const notes = page.locator('textarea');
    if (await notes.count()) await notes.first().fill('משאב שנוצר על ידי בדיקה אוטומטית.');
    await page.getByRole('button', { name: /השמה לעצמי/ }).first().click({ force: true });
    await page.waitForTimeout(1500);
    api.clear();
    await page.getByRole('button', { name: /פרסום דרישת משאב/ }).click({ force: true });
    await page.waitForTimeout(13000);
    const res = api.last('createResource');
    resourceCreated = res?.status === 200 && res?.json?.success === true;
    record('5. resource created, assigned to me', resourceCreated);
  } else {
    record('5. resource created, assigned to me', false, 'resource form did not open');
  }

  // ── 6. approve its receipt — one vote is consensus here ───────────────────
  if (resourceCreated) {
    await visit(page, '/lev', { wait: 13000 });
    api.clear();
    // The lev deck streams its cards in, and the approve control is an icon
    // button at the end of the card's action row — so find the card by its
    // heading and click its last button rather than trusting a class name.
    const reachable = await page
      .locator('button')
      .last()
      .waitFor({ state: 'visible', timeout: 25000 })
      .then(() =>
        page.evaluate(() => {
          const holder = [...document.querySelectorAll('*')].filter(
            (el) => /אישור קבלת משאב/.test(el.textContent || '') && el.children.length < 40
          );
          let card = holder[holder.length - 1];
          if (!card) return false;
          for (let i = 0; i < 6 && card.parentElement; i++) card = card.parentElement;
          const actions = [...card.querySelectorAll('button')];
          const approve = actions[actions.length - 1];
          if (!approve) return false;
          approve.click();
          return true;
        })
      )
      .catch(() => false);
    if (reachable) await page.waitForTimeout(10000);
    const voted = api.last('voteOnMaap');
    record(
      '6. resource receipt approved (consensus of one)',
      voted?.json?.data?.consensus === true,
      voted
        ? JSON.stringify(voted.json?.data ?? {}).slice(0, 120)
        : reachable
          ? 'clicked, but no voteOnMaap call followed'
          : 'the approve button never appeared on the lev card'
    );
  }

  // ── 7. product + sale ─────────────────────────────────────────────────────
  await visit(page, `/moach/${projectId}/sales`);
  await page.getByRole('button', { name: /יצירת מוצר חדש/ }).first().click({ force: true });
  await page.waitForTimeout(4000);
  await page.fill('input[name="name"]', 'מוצר בדיקה');
  const prodText = page.locator('input[type="text"]');
  await prodText.nth(1).fill('500');
  await prodText.nth(2).fill('3');
  api.clear();
  await page.getByRole('button', { name: /הוספת מוצר/ }).click({ force: true });
  await page.waitForTimeout(13000);
  const product = api.last('createComplexMatanot');
  record('7a. product created', product?.status === 200 && product?.json?.success === true);

  // A fresh navigation, not a client-side one: the moach store caches the
  // product list per project, so the card of the product we just created only
  // shows up after a real page load.
  await visit(page, `/moach/${projectId}/sales`, { wait: 12000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);
  const reportSale = page.locator('.report-sale-btn').last();
  const sellable = await reportSale
    .waitFor({ state: 'visible', timeout: 25000 })
    .then(() => true)
    .catch(() => false);
  if (!sellable) {
    record('7b. sale recorded, held by me', false, 'the product card never rendered a report-sale button');
    console.log(`\nrikma left behind: ${BASE}/moach/${projectId}/main`);
    return finish(page, close);
  }
  await reportSale.click({ force: true });
  await page.waitForTimeout(3500);
  const holder = page.locator('input[placeholder*="אצל מי הכסף"]');
  if (await holder.count()) {
    await holder.first().click();
    await page.waitForTimeout(1500);
    // Do NOT press Escape here — it clears the selection, and the sale form
    // then refuses to submit with "שדה אצל מי הכסף נשאר ריק".
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  }
  const saleNote = page.locator('textarea');
  if (await saleNote.count()) await saleNote.last().fill('מכירה שנוצרה על ידי בדיקה אוטומטית.');
  await page.getByRole('button', { name: /הוספת מכירה/ }).click({ force: true });
  await page.waitForTimeout(15000);
  const saleListed = (await page.evaluate(() => document.body.innerText)).includes('סך הכל מכירות');
  record('7b. sale recorded, held by me', saleListed);

  // ── 8. close the split (B1) ───────────────────────────────────────────────
  const splitBtn = page.getByRole('button', { name: /צפיה בהצעת החלוקה|בקשת חלוקה/ });
  if (await splitBtn.count()) {
    await splitBtn.first().click({ force: true });
    await page.waitForTimeout(6000);
    api.clear();
    await page.getByRole('button', { name: /אישור ובקשת חלוקה/ }).first().click({ force: true });
    await page.waitForTimeout(18000);
    const tosplit = api.last('createTosplit');
    const approved = api.last('approveHaluka');
    record(
      '8a. split proposal accepted with no transfers (B1)',
      tosplit?.status === 200 && tosplit?.json?.success === true,
      tosplit
        ? `${tosplit.status} ${JSON.stringify(tosplit.json?.error ?? tosplit.json?.data ?? {}).slice(0, 160)}`
        : 'no createTosplit call was made'
    );
    record(
      '8b. split finalized immediately (solo rikma)',
      approved?.status === 200 && approved?.json?.success === true,
      approved ? String(approved.status) : 'no approveHaluka call — did the solo branch run?'
    );
    await shot(page, `solo-money-${projectId}-split`);
  } else {
    record('8a. split proposal accepted with no transfers (B1)', false, 'no split button on the sales page');
  }

  console.log(`\nrikma left behind: ${BASE}/moach/${projectId}/main`);
  return finish(page, close);
};

async function finish(page, close) {
  await close();
  const failed = steps.filter((s) => !s.ok);
  console.log(`\n${steps.length - failed.length}/${steps.length} steps passed.`);
  if (failed.length) {
    console.log('failed:');
    failed.forEach((s) => console.log(`  ${s.name}${s.detail ? ` — ${s.detail}` : ''}`));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
