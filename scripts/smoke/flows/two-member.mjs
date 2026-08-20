/**
 * The two-member fixture: a rikma that both test accounts actually belong to.
 *
 *   node scripts/smoke/flows/two-member.mjs --yes
 *   node scripts/smoke/flows/two-member.mjs --yes --fresh   # ignore the cache
 *   node scripts/smoke/flows/two-member.mjs --show          # print the cached pair
 *
 * ⚠ THIS WRITES TO THE LIVE DATABASE. Nothing is cleaned up.
 *
 * Every consent flow worth testing — archival, a stipend, a negotiation, a
 * split — needs two people, and slot 2 starts out belonging to no rikma at
 * all. Standing one up is not a single call: the second member has to *join*,
 * which means an open mission, an application, and the first member approving
 * it. That is four steps of somebody else's feature before the feature under
 * test gets a chance to run, so it lives here once and the result is cached in
 * `$TMPDIR/1lev1-smoke-pair.json` for the flows that need it.
 *
 * What each step asserts:
 *   1  createProject          — the rikma exists and we know its id
 *   2  createMission          — an open mission for the second member to take
 *   3  createMission          — a second one, kept open, for archive/stipend to aim at
 *   4  applyToMission (B)     — a NON-member application opens an Ask + a vote
 *                               rather than assigning the mission outright
 *   5  finalizeAskAcceptance  — A approving that Ask makes B a member
 *   6  membership visible     — B's own /moach lists the rikma
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { session, visit, text, actionCatcher, clickText, shot } from '../lib.mjs';

const argv = process.argv.slice(2);
export const PAIR_FILE =
  process.env.SMOKE_PAIR || path.join(os.tmpdir(), '1lev1-smoke-pair.json');

/** The cached fixture, or null when there is none. */
export function loadPair() {
  try {
    return JSON.parse(fs.readFileSync(PAIR_FILE, 'utf8'));
  } catch {
    return null;
  }
}

const savePair = (pair) => {
  fs.writeFileSync(PAIR_FILE, JSON.stringify(pair, null, 2));
  console.log(`\npair saved to ${PAIR_FILE}`);
};

// Running this file directly is what builds the fixture; importing it only
// gives another flow `loadPair()`.
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('two-member.mjs');

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
// Rebuilt below when resuming, so the later steps address the rikma that is
// actually half-built rather than the one this run would have named.
let RIKMA_NAME = `בדיקת שניים ${stamp}`;
let M1_NAME = `משימה לחבר השני ${stamp}`;
let M2_NAME = `משימה שתישאר פתוחה ${stamp}`;

const steps = [];
const record = (name, ok, detail = '') => {
  steps.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const summarize = () => {
  const ok = steps.filter((s) => s.ok).length;
  console.log(`\n${ok}/${steps.length} steps passed.`);
  return ok === steps.length;
};

/** Fill the mission form that `g#button` opens on /moach/<id>/create. */
async function createOpenMission(page, api, projectId, name) {
  await visit(page, `/moach/${projectId}/create`, { wait: 9000 });
  await page.locator('g#button').first().click({ force: true });
  await page.waitForTimeout(4000);
  await page.fill('#mission-name-input', name);
  const descEdit = page.locator('h3:has-text("תיאור") button').first();
  if (await descEdit.count()) {
    await descEdit.click({ force: true });
    await page.waitForTimeout(1200);
  }
  const desc = page.locator('[contenteditable="true"]');
  if (await desc.count()) {
    await desc.first().click();
    await page.keyboard.type('נוצרה על ידי בדיקת שני משתמשים.');
    await page.waitForTimeout(400);
  }
  api.clear();
  await page.getByRole('button', { name: /^פרסום$/ }).first().click({ force: true });
  await page.waitForTimeout(14000);
  const created = api.last('createMission');
  return {
    id: created?.json?.data?.createdEntityId,
    status: created?.status,
    json: created?.json
  };
}

const run = async () => {
  if (!argv.includes('--yes')) {
    console.error(
      'This flow writes to the live database: it creates a rikma and two\n' +
        'missions on account 1, and makes account 2 a member of it. Nothing is\n' +
        'cleaned up afterwards.\n\nRe-run with --yes if that is what you want.'
    );
    process.exit(2);
  }

  const cached = loadPair();
  // A pair whose join never went through is worth finishing, not rebuilding:
  // the rikma and both missions are already there and each rebuild leaves
  // another one behind that nothing can delete.
  const resuming = Boolean(cached) && !argv.includes('--fresh') && !cached.memberJoined;
  if (cached && !argv.includes('--fresh') && cached.memberJoined) {
    console.log('a pair already exists — reusing it (pass --fresh to build another):');
    console.log(JSON.stringify(cached, null, 2));
    return true;
  }
  if (resuming) {
    ({ rikmaName: RIKMA_NAME, missionNameTaken: M1_NAME, missionNameFree: M2_NAME } = cached);
    console.log(`resuming the half-built pair in rikma ${cached.projectId} — the join never completed`);
  }

  const a = await session({ account: 1 });
  const apiA = actionCatcher(a.page);

  // ── 1. the rikma ───────────────────────────────────────────────────────────
  if (resuming) return await finishJoin(a, apiA, cached);

  await visit(a.page, '/me');
  await a.page.getByRole('button', { name: /יצירת ריקמה חדשה/ }).first().click();
  await a.page.waitForTimeout(4000);
  await a.page.fill('input[name="des"]', RIKMA_NAME);
  const editors = a.page.locator('[contenteditable="true"]');
  for (let i = 0; i < Math.min(await editors.count(), 2); i++) {
    await editors.nth(i).click();
    await a.page.keyboard.type(i === 0 ? 'ריקמה לבדיקת הסכמה בין שני חברים.' : 'תיאור פנימי.');
    await a.page.waitForTimeout(300);
  }
  await a.page.fill('input[name="de"]', 'https://example.com');
  const values = a.page.locator('input[placeholder*="ערכים"]');
  if (await values.count()) {
    await values.first().click();
    await a.page.waitForTimeout(800);
    await a.page.keyboard.press('ArrowDown');
    await a.page.keyboard.press('Enter');
    await a.page.waitForTimeout(500);
    await a.page.keyboard.press('Escape');
    await a.page.waitForTimeout(500);
  }
  await a.page.getByRole('button', { name: /ליצור ולפרסם/ }).first().click({ force: true });
  await a.page.waitForTimeout(18000);
  const projectId = a.page.url().match(/\/moach\/(\d+)/)?.[1];
  record('1. rikma created', Boolean(projectId), projectId ? `id ${projectId}` : a.page.url());
  if (!projectId) {
    await shot(a.page, 'two-member-1-rikma');
    await a.close();
    return summarize();
  }

  // ── 2 + 3. two open missions ───────────────────────────────────────────────
  const m1 = await createOpenMission(a.page, apiA, projectId, M1_NAME);
  record(
    '2. open mission for the second member',
    m1.status === 200 && Boolean(m1.id),
    m1.id ? `openMission ${m1.id}` : JSON.stringify(m1.json ?? {}).slice(0, 160)
  );

  const m2 = await createOpenMission(a.page, apiA, projectId, M2_NAME);
  record(
    '3. second open mission, left untouched',
    m2.status === 200 && Boolean(m2.id),
    m2.id ? `openMission ${m2.id}` : JSON.stringify(m2.json ?? {}).slice(0, 160)
  );

  // ── 4. the second member applies ───────────────────────────────────────────
  // A non-member application must NOT assign the mission: it opens an Ask the
  // existing members vote on. `createdType` is the tell — a solo rikma answers
  // `mesimabetahalich` here, a multi-member one an ask.
  const b = await session({ account: 2 });
  const apiB = actionCatcher(b.page);
  let applied = null;
  if (m1.id) {
    await visit(b.page, `/availableMission/${m1.id}`, { wait: 9000 });
    apiB.clear();
    const clicked = await clickText(b.page, /אני אשמח לבצע/);
    await b.page.waitForTimeout(14000);
    applied = apiB.last('applyToMission');
    const ok = applied?.status === 200 && applied?.json?.success === true;
    if (!ok) await shot(b.page, 'two-member-4-apply');
    record(
      '4. second member applied — an Ask, not an assignment',
      ok,
      applied
        ? `${applied.status} ${JSON.stringify(applied.json?.data ?? applied.json?.error ?? {}).slice(0, 200)}`
        : `no applyToMission call (clicked: ${clicked ?? 'nothing'}; saw: ${apiB.keys().join(', ') || 'nothing'})`
    );
  } else {
    record('4. second member applied — an Ask, not an assignment', false, 'no mission to apply to');
  }

  // ── 5 + 6. approval and the membership it creates ──────────────────────────
  const bSees = applied?.json?.success
    ? await approveAndVerify(a, apiA, b)
    : (record('5. first member approved the application', false, 'nothing to approve'), false);

  savePair({
    createdAt: new Date().toISOString(),
    projectId,
    rikmaName: RIKMA_NAME,
    openMissionTaken: m1.id ?? null,
    openMissionFree: m2.id ?? null,
    missionNameTaken: M1_NAME,
    missionNameFree: M2_NAME,
    memberJoined: bSees
  });

  await a.close();
  await b.close();
  return summarize();
};

/**
 * Steps 5 and 6 — the half that actually creates the membership.
 *
 * The application lands on A's heart page as a card; approving it is what
 * makes B a member, and B's own /moach is the only place that proves it
 * (the approving side would show a membership that the other account cannot
 * see just as happily).
 */
async function approveAndVerify(a, apiA, b) {
  await visit(a.page, '/lev', { wait: 12000 });
  apiA.clear();
  const approved = await approveOnLev(a.page, RIKMA_NAME);
  await a.page.waitForTimeout(12000);
  // Which action closes the application depends on how it was opened — a join
  // request and a service request finalize through different configs, and with
  // only one existing member either one matures on the first vote.
  const fin =
    apiA.last('finalizeJoinAcceptance') ??
    apiA.last('finalizeAskAcceptance') ??
    apiA.last('voteOnPendm');
  const joined = fin?.status === 200 && fin?.json?.success === true;
  if (!joined) await shot(a.page, 'two-member-5-approve');
  record(
    '5. first member approved the application',
    joined,
    fin
      ? `${fin.status} ${JSON.stringify(fin.json?.data ?? fin.json?.error ?? {}).slice(0, 200)}`
      : `no finalize call (clicked: ${approved}; saw: ${apiA.keys().join(', ') || 'nothing'})`
  );

  await visit(b.page, '/moach', { wait: 9000 });
  const bSees = (await text(b.page)).includes(RIKMA_NAME);
  if (!bSees) await shot(b.page, 'two-member-6-membership');
  record('6. the second member sees the rikma as theirs', bSees, bSees ? '' : 'not in /moach');
  return bSees;
}

/** Resume path: everything but the approval already exists. */
async function finishJoin(a, apiA, cached) {
  const b = await session({ account: 2 });
  const bSees = await approveAndVerify(a, apiA, b);
  savePair({ ...cached, memberJoined: bSees });
  await a.close();
  await b.close();
  return summarize();
}

/**
 * Approve the card on /lev that carries `name`.
 *
 * The heart is a swiper of cards, one per pending thing, and the approve
 * control is not the same element on every card kind — so match on the card
 * that mentions the mission and click whichever affirmative button it has.
 */
async function approveOnLev(page, name, { tries = 6 } = {}) {
  for (let i = 0; i < tries; i++) {
    const result = await page.evaluate((rikmaName) => {
      // The join card names its own control (`requestToJoin`), which is far
      // more stable than the label — the heart holds several card kinds and
      // "אישור" appears on most of them.
      const joins = [...document.querySelectorAll('button[name="requestToJoin"]')];
      if (!joins.length) return null;
      const belongs = (btn) => {
        for (let el = btn; el; el = el.parentElement) {
          const txt = el.innerText || '';
          if (txt.length > 4000) break;
          if (txt.includes(rikmaName)) return true;
        }
        return false;
      };
      // Never approve a card we cannot attribute. The heart shows every rikma
      // the account belongs to, so "click the first join request" quietly
      // approves somebody else's — the run then passes while the rikma under
      // test still has nobody in it.
      const btn = joins.find(belongs);
      if (!btn) return null; // keep waiting — the right card may still be streaming in
      btn.click();
      return `approved this rikma's join request (of ${joins.length} on the page)`;
    }, name);
    if (result) return result;
    // The heart streams its cards in; a missing card early on is not a missing card.
    await page.waitForTimeout(5000);
  }
  return 'no join approval for this rikma appeared on /lev';
}

if (invokedDirectly) {
  const ok = await run();
  process.exit(ok ? 0 : 1);
}
