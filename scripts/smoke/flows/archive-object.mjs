/**
 * Object archival between two real members (docs/PLAN_OBJECT_ARCHIVAL.md).
 *
 *   node scripts/smoke/flows/two-member.mjs --yes    # once, builds the pair
 *   node scripts/smoke/flows/archive-object.mjs --yes
 *
 * ⚠ THIS WRITES TO THE LIVE DATABASE. It creates one open mission per run in
 * the paired rikma and then archives or edits it. Nothing is cleaned up.
 *
 * Archival is the first feature where the super-principles are the *whole*
 * feature: there is no reject button, a counter-proposal is how you say no,
 * and a counter in `keep` mode means the object survives with different terms
 * instead of being removed. None of that can be checked with one account —
 * a solo rikma applies everything immediately and never opens a Decision at
 * all — which is exactly why this flow drives both.
 *
 * What each step asserts:
 *   1  createMission           — in a rikma of two even *creating* a mission is
 *                                a vote: the answer is a `pendm`, not an object
 *   2  voteOnPendm             — the second member approves it into existence
 *   3  proposeObjectArchive    — with two members this OPENS A PROPOSAL
 *                                (`immediate: false`), it does not archive
 *   4  lifecycle visible       — the object wears "בדיון להסרה" on the board,
 *                                i.e. archiveProposed reached the reader
 *   5  the card, and its verbs — the other member sees the proposal, and is
 *                                offered approve · chat · counter and NO reject
 *   6  counterObjectChange     — countering in `keep` mode is how disagreement
 *                                is expressed; it resets the clock
 *   7  voteOnDecision          — the proposer signing the standing version
 *                                matures it
 *   8  the object survived     — a matured `keep` counter edits the object
 *                                instead of removing it (the whole point)
 *   9  previewArchiveMembership — releasing a member's only commitment warns,
 *                                *before* anyone signs, that it ends their
 *                                membership (read-only: nothing is submitted)
 */

import { session, visit, text, actionCatcher, clickText, shot } from '../lib.mjs';
import { loadPair } from './two-member.mjs';

const argv = process.argv.slice(2);
if (!argv.includes('--yes')) {
  console.error(
    'This flow writes to the live database: it creates an open mission in the\n' +
      'paired rikma and runs a real archive proposal over it. Nothing is cleaned\n' +
      'up afterwards.\n\nRe-run with --yes if that is what you want.'
  );
  process.exit(2);
}

const pair = loadPair();
if (!pair?.projectId || !pair.memberJoined) {
  console.error(
    'No two-member rikma to test in. Build one first:\n' +
      '  node scripts/smoke/flows/two-member.mjs --yes'
  );
  process.exit(2);
}

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const TARGET = `משימה לארכוב ${stamp}`;
const RENAMED = `נשארת, בתנאים אחרים ${stamp}`;

const steps = [];
const record = (name, ok, detail = '') => {
  steps.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/**
 * The visible text of the /lev card that mentions `name`, or ''.
 *
 * "The innermost element mentioning it" is the wrong pick — that is the title,
 * and a title has no verbs on it, so the card reads as if it offered nothing.
 * The card is the smallest ancestor that still carries its own controls.
 */
const cardText = (page, name) =>
  page.evaluate((needle) => {
    const card = [...document.querySelectorAll('article, section, div')]
      .filter(
        (el) =>
          (el.innerText || '').includes(needle) &&
          el.innerText.length < 2500 &&
          el.querySelectorAll('button').length >= 2
      )
      .sort((x, y) => x.innerText.length - y.innerText.length)[0];
    return card ? card.innerText.replace(/\n+/g, ' | ') : '';
  }, name);

/**
 * Click a control *inside* the card that carries `name`.
 *
 * The heart stacks a card per pending thing and every archive card has the
 * same three verbs, so an unscoped click lands on whichever proposal happens
 * to be first in the DOM — usually one from an earlier run.
 */
const clickInCard = (page, name, pattern) =>
  page.evaluate(
    ({ needle, src, fl }) => {
      const rx = new RegExp(src, fl);
      const card = [...document.querySelectorAll('article, section, div')]
        .filter(
          (el) =>
            (el.innerText || '').includes(needle) &&
            el.innerText.length < 2500 &&
            el.querySelectorAll('button').length >= 2
        )
        .sort((x, y) => x.innerText.length - y.innerText.length)[0];
      if (!card) return null;
      const btn = [...card.querySelectorAll('button')].find((x) => rx.test(x.innerText || ''));
      if (!btn) return null;
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return (btn.innerText || '').trim().slice(0, 40);
    },
    { needle: name, src: pattern.source, fl: pattern.flags }
  );

const run = async () => {
  const a = await session({ account: 1 });
  const b = await session({ account: 2 });
  const apiA = actionCatcher(a.page);
  const apiB = actionCatcher(b.page);
  const pid = pair.projectId;
  console.log(`rikma under test: ${pid} (${pair.rikmaName})\n`);

  // ── 1. something to archive ────────────────────────────────────────────────
  // In a rikma of two, publishing a mission is itself a shared decision: the
  // server answers with a `pendm` to vote on, not with an open mission. That
  // is the same principle archival rides on, so assert it rather than assume
  // the object exists.
  await visit(a.page, `/moach/${pid}/create`, { wait: 9000 });
  await a.page.locator('g#button').first().click({ force: true });
  await a.page.waitForTimeout(4000);
  await a.page.fill('#mission-name-input', TARGET);
  apiA.clear();
  await clickText(a.page, /^פרסום$/);
  await a.page.waitForTimeout(14000);
  const created = apiA.last('createMission');
  const pendmId = created?.json?.data?.createdEntityId;
  const isPendm = created?.json?.data?.createdEntityType === 'pendm';
  record(
    '1. a new mission in a two-member rikma opens a vote, not an object',
    created?.status === 200 && isPendm && Boolean(pendmId),
    created
      ? `${created.status} createdType=${created.json?.data?.createdEntityType} id=${pendmId}`
      : 'no createMission call'
  );
  if (!pendmId) {
    await a.close();
    await b.close();
    return finish();
  }

  // ── 2. the other member approves it into existence ─────────────────────────
  await visit(b.page, `/moach/${pid}/votes`, { wait: 11000 });
  await clickText(b.page, new RegExp(TARGET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await b.page.waitForTimeout(9000);
  apiB.clear();
  await clickText(b.page, /^אישור$/);
  await b.page.waitForTimeout(13000);
  const pendVote = apiB.last('voteOnPendm');
  await visit(a.page, `/moach/${pid}/open`, { wait: 11000 });
  const onBoard = (await text(a.page)).includes(TARGET);
  if (!onBoard) await shot(a.page, 'archive-2-approve-pendm');
  record(
    '2. approved by the second member — the open mission now exists',
    onBoard,
    pendVote
      ? `voteOnPendm ${pendVote.status}; on the board: ${onBoard}`
      : `no voteOnPendm call (saw: ${apiB.keys().join(', ') || 'nothing'})`
  );

  // ── 3. proposing, not archiving ────────────────────────────────────────────
  // The rikma has two members, so removal is a change to a shared contract:
  // the server must answer with a Decision, never with a done deed.
  await visit(a.page, `/moach/${pid}/open`, { wait: 10000 });
  const opened = await openArchiveDialog(a.page, TARGET);
  await a.page.waitForTimeout(2000);
  await fillFirstTextarea(a.page, 'המשימה כבר לא נחוצה בצורתה הנוכחית.');
  apiA.clear();
  await clickText(a.page, /לשלוח הצעה|לארכב עכשיו/);
  await a.page.waitForTimeout(12000);
  const proposed = apiA.last('proposeObjectArchive');
  const isProposal = proposed?.json?.success === true && proposed?.json?.data?.immediate === false;
  if (!isProposal) await shot(a.page, 'archive-2-propose');
  record(
    '3. two members ⇒ a proposal, not an immediate archive',
    isProposal,
    proposed
      ? `${proposed.status} ${JSON.stringify(proposed.json?.data ?? proposed.json?.error ?? {}).slice(0, 220)}`
      : `no proposeObjectArchive call (dialog: ${opened}; saw: ${apiA.keys().join(', ') || 'nothing'})`
  );

  // ── 4. the lifecycle reached the reader ────────────────────────────────────
  await visit(a.page, `/moach/${pid}/open`, { wait: 10000 });
  const board = await text(a.page);
  const chipped = board.includes(TARGET) && board.includes('בדיון להסרה');
  if (!chipped) await shot(a.page, 'archive-3-chip');
  record(
    '4. the object shows "בדיון להסרה" on the board',
    chipped,
    chipped ? '' : 'no archiveProposed chip next to the mission'
  );

  // ── 5. the other member's card, and the verbs on it ────────────────────────
  // "No absolute no" is not a slogan here — a reject button on this card would
  // be the bug. Approve, chat and counter are the only three.
  await visit(b.page, '/lev', { wait: 14000 });
  let card = await cardText(b.page, TARGET);
  if (!card) {
    await b.page.waitForTimeout(8000);
    card = await cardText(b.page, TARGET);
  }
  const hasVerbs =
    card.includes('הצעה להסרה') &&
    card.includes('מאשר') &&
    card.includes('לשיחה') &&
    card.includes('להציע אחרת');
  const hasReject = /דחייה|לדחות|התנגדות/.test(card);
  if (!hasVerbs || hasReject) await shot(b.page, 'archive-4-card');
  record(
    '5. the second member sees it, with approve · chat · counter and no reject',
    hasVerbs && !hasReject,
    card ? `${hasReject ? 'a reject-style control is on the card! ' : ''}${card.slice(0, 220)}` : 'no card mentions the mission on /lev'
  );

  // ── 6. countering in `keep` mode ───────────────────────────────────────────
  // Disagreement is a counter-proposal: the object stays, its terms change.
  let countered = null;
  if (card) {
    const negoOpened = await clickInCard(b.page, TARGET, /להציע אחרת/);
    await b.page.waitForTimeout(3000);
    await clickText(b.page, /להשאיר, עם שינויים/);
    await b.page.waitForTimeout(800);
    const named = await fillFirstTextInput(b.page, RENAMED);
    await fillFirstTextarea(b.page, 'לא צריך להסיר — מספיק לצמצם את ההיקף.', { last: true });
    apiB.clear();
    await clickText(b.page, /^לשלוח הצעה$/);
    await b.page.waitForTimeout(12000);
    countered = apiB.last('counterObjectChange');
    const ok = countered?.status === 200 && countered?.json?.success === true;
    if (!ok) await shot(b.page, 'archive-6-counter');
    record(
      '6. countered in `keep` mode — the object stays, the terms change',
      ok,
      countered
        ? `${countered.status} ${JSON.stringify(countered.json?.data ?? countered.json?.error ?? {}).slice(0, 220)}`
        : `no counterObjectChange call (nego dialog: ${negoOpened}; name field filled: ${named}; saw: ${apiB.keys().join(', ') || 'nothing'})`
    );
  } else {
    record('6. countered in `keep` mode — the object stays, the terms change', false, 'no card to counter from');
  }

  // ── 7. the proposer signs the standing version ─────────────────────────────
  let matured = false;
  if (countered?.json?.success) {
    await visit(a.page, '/lev', { wait: 14000 });
    const aCard = (await cardText(a.page, RENAMED)) || (await cardText(a.page, TARGET));
    apiA.clear();
    const clicked =
      (await clickInCard(a.page, RENAMED, /^מאשר/)) ?? (await clickInCard(a.page, TARGET, /^מאשר/));
    await a.page.waitForTimeout(14000);
    const vote = apiA.last('voteOnDecision');
    matured = vote?.status === 200 && vote?.json?.success === true;
    if (!matured) await shot(a.page, 'archive-7-approve');
    record(
      '7. the proposer signed the standing version',
      matured,
      vote
        ? `${vote.status} ${JSON.stringify(vote.json?.data ?? vote.json?.error ?? {}).slice(0, 220)}`
        : `no voteOnDecision call (clicked: ${clicked}; card: ${aCard.slice(0, 120)})`
    );
  } else {
    record('7. the proposer signed the standing version', false, 'nothing standing to sign');
  }

  // ── 8. a matured `keep` counter edits, it does not remove ──────────────────
  await visit(a.page, `/moach/${pid}/open`, { wait: 12000 });
  const after = await text(a.page);
  const survived = after.includes(RENAMED);
  const removed = !after.includes(RENAMED) && !after.includes(TARGET);
  if (!survived) await shot(a.page, 'archive-7-survived');
  record(
    '8. the object survived the archive proposal, under its new name',
    survived,
    survived
      ? ''
      : removed
        ? 'the object is gone from the board — a `keep` counter archived it anyway'
        : 'the object is there under its OLD name — the counter\'s terms were not applied'
  );

  // ── 9. the membership consequence, stated before anyone signs ──────────────
  // B's mission from the fixture is B's only tie to the rikma and has no hours
  // on it, so releasing it would end their membership. That has to be on the
  // screen *before* the signature, not discovered afterwards.
  await visit(b.page, `/moach/${pid}/progress`, { wait: 12000 });
  apiB.clear();
  const dialog = await openArchiveDialog(b.page, pair.missionNameTaken);
  await b.page.waitForTimeout(6000);
  const preview = apiB.last('previewArchiveMembership');
  const warned = await b.page.evaluate(() =>
    /יסיים גם את חברות/.test(document.body?.innerText ?? '')
  );
  // The assertion is the *agreement* between the two, in both directions: a
  // warning that fires when the tie is not the last one is as wrong as one
  // that stays silent when it is. Whether this particular member is down to
  // their last tie depends on what else the fixture left them holding.
  const consistent = preview?.status === 200 && warned === (preview.json?.data?.isLastTie === true);
  if (!consistent) await shot(b.page, 'archive-9-membership');
  record(
    '9. the membership consequence is previewed, and the screen agrees with it',
    consistent,
    preview
      ? `isLastTie=${preview.json?.data?.isLastTie}, warning on screen=${warned}`
      : `no previewArchiveMembership call (dialog: ${dialog})`
  );

  await a.close();
  await b.close();
  return finish();
};

/** Open the archive drawer on the card that carries `name`. */
async function openArchiveDialog(page, name) {
  return page.evaluate((needle) => {
    const cards = [...document.querySelectorAll('article, section, li, div')].filter(
      (el) => (el.innerText || '').includes(needle) && el.innerText.length < 2500
    );
    for (const card of cards.reverse()) {
      const btn = [...card.querySelectorAll('button')].find((x) =>
        /לארכב|לשחרר/.test(x.innerText || '')
      );
      if (btn) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return `opened via "${btn.innerText.trim()}"`;
      }
    }
    return `no archive button on any card carrying "${needle}"`;
  }, name);
}

/** Type into the drawer's reason box. Drawers stack, so `last` reaches the top one. */
async function fillFirstTextarea(page, value, { last = false } = {}) {
  return page.evaluate(
    ({ v, useLast }) => {
      const boxes = [...document.querySelectorAll('textarea')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const el = useLast ? boxes[boxes.length - 1] : boxes[0];
      if (!el) return false;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    { v: value, useLast: last }
  );
}

/** Same, for the counter dialog's "name" field. */
async function fillFirstTextInput(page, value) {
  return page.evaluate((v) => {
    const el = [...document.querySelectorAll('input[type="text"]')].find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, value);
}

function finish() {
  const ok = steps.filter((s) => s.ok).length;
  console.log(`\n${ok}/${steps.length} steps passed.`);
  return ok === steps.length;
}

const ok = await run();
process.exit(ok ? 0 : 1);
