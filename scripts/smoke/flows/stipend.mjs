/**
 * Subsistence stipend between two real members (docs/PLAN_STIPEND.md).
 *
 *   node scripts/smoke/flows/two-member.mjs --yes   # once, builds the pair
 *   node scripts/smoke/flows/stipend.mjs --yes
 *
 * ⚠ THIS WRITES TO THE LIVE DATABASE — a real pledge and a real programme on
 * the paired rikma. Nothing is cleaned up.
 *
 * The whole design rests on one derived rule: **who has to sign is computed
 * from (k − α), not chosen.** While the rikma's total value does not move the
 * agreement is bilateral; the moment it grows, every member is diluted and it
 * needs a programme with a closed budget. A single account cannot test that —
 * it is a statement about *other people's* percentages — so this flow drives
 * both, and the interesting half is step 4: the same form, one slider moved,
 * must refuse to stay bilateral.
 *
 * What each step asserts:
 *   1  the bilateral case is named as such — the dialog says "אף אחד מלבד שני
 *      הצדדים לא מושפע" *before* anything is sent
 *   2  proposeStipendPledge  — α=1, k=1 opens a bilateral decision
 *   3  voteOnDecision (B)    — the recipient signing is enough; no other member
 *                              is asked
 *   4  the dilution gate     — moving the cost onto the rikma (α=0) stops being
 *                              a pledge: the form says it needs the rikma's
 *                              consent and offers the programme instead
 *   5  proposeStipendProgram — the escalation carries the terms over and opens
 *                              a rikma-wide decision with a closed budget
 *   6  voteOnDecision (B)     — the programme matures for the whole rikma. This
 *                              is where a programme used to die: applying it
 *                              sent the pledge's field list to StipendProgram
 *                              and Strapi rejected the whole mutation
 *   7  the stipend tab       — pledge, programme and the running dilution are
 *                              all on one screen, which is the only defence
 *                              against overlapping programmes adding up
 */

import { session, visit, text, actionCatcher, clickText, shot } from '../lib.mjs';
import { loadPair } from './two-member.mjs';

const argv = process.argv.slice(2);
if (!argv.includes('--yes')) {
  console.error(
    'This flow writes to the live database: it opens a real stipend pledge and\n' +
      'a real stipend programme on the paired rikma. Nothing is cleaned up.\n\n' +
      'Re-run with --yes if that is what you want.'
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

/** Below the mission's ₪50/h market rate — a stipend that exceeded it would
 *  make the recipient's equity negative, which the server refuses outright. */
const STIPEND_RATE = 20;
const TOTAL_CAP = 5000;

const steps = [];
const record = (name, ok, detail = '') => {
  steps.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// ── form helpers ─────────────────────────────────────────────────────────────
// Svelte's `bind:value` listens for the input event, and setting `.value`
// directly does not fire one — hence the native setter plus a dispatched event
// on every field below.

/** Pick the first option of a `<select>` whose label matches. */
const chooseOption = (page, selectIndex, pattern) =>
  page.evaluate(
    ({ idx, src, fl }) => {
      const proto = window.HTMLSelectElement.prototype;
      const rx = new RegExp(src, fl);
      const sel = [...document.querySelectorAll('select')].filter(
        (e) => e.getBoundingClientRect().width > 0
      )[idx];
      if (!sel) return null;
      const opt = [...sel.options].find((o) => rx.test(o.text));
      if (!opt) {
        return `no option matches (${[...sel.options].map((o) => o.text.slice(0, 25)).join(' | ')})`;
      }
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(sel, opt.value);
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return opt.text.slice(0, 60);
    },
    { idx: selectIndex, src: pattern.source, fl: pattern.flags }
  );

/** Set the nth visible `input[type=…]`. */
const setField = (page, type, index, value) =>
  page.evaluate(
    ({ t, i, v }) => {
      const el = [...document.querySelectorAll(`input[type="${t}"]`)].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })[i];
      if (!el) return false;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    { t: type, i: index, v: String(value) }
  );

const run = async () => {
  const a = await session({ account: 1 });
  const b = await session({ account: 2 });
  const apiA = actionCatcher(a.page);
  const apiB = actionCatcher(b.page);
  const pid = pair.projectId;
  console.log(`rikma under test: ${pid} (${pair.rikmaName})\n`);

  // ── 1 + 2. the bilateral pledge ────────────────────────────────────────────
  await visit(a.page, `/moach/${pid}/stipend`, { wait: 12000 });
  const offerOpened = await clickText(a.page, /להציע ל/);
  await a.page.waitForTimeout(4000);
  const mission = await chooseOption(a.page, 0, /·\s*₪\d+\/שעה/);
  await a.page.waitForTimeout(1500);
  await setField(a.page, 'number', 0, STIPEND_RATE);
  await a.page.waitForTimeout(2500);

  const dialog = await text(a.page);
  const saysBilateral =
    dialog.includes('בהסכמה דו-צדדית') && dialog.includes('ההצעה תישלח לצד השני בלבד');
  if (!saysBilateral) await shot(a.page, 'stipend-1-bilateral');
  record(
    '1. with the recipient bearing the cost, the form says nobody else is affected',
    saysBilateral,
    saysBilateral ? '' : `dialog opened: ${offerOpened}; mission: ${mission}`
  );

  apiA.clear();
  await clickText(a.page, /^לשלוח את ההצעה$/);
  await a.page.waitForTimeout(13000);
  const pledged = apiA.last('proposeStipendPledge');
  const pledgeOk = pledged?.status === 200 && pledged?.json?.success === true;
  if (!pledgeOk) await shot(a.page, 'stipend-2-propose');
  record(
    '2. a non-diluting pledge is opened bilaterally',
    pledgeOk,
    pledged
      ? `${pledged.status} ${JSON.stringify(pledged.json?.data ?? pledged.json?.error ?? {}).slice(0, 240)}`
      : `no proposeStipendPledge call (saw: ${apiA.keys().join(', ') || 'nothing'})`
  );

  // ── 3. the recipient alone signs it ────────────────────────────────────────
  let signed = false;
  if (pledgeOk) {
    await visit(b.page, '/lev', { wait: 15000 });
    const card = await stipendCard(b.page);
    apiB.clear();
    const clicked = await clickInStipendCard(b.page, /^מאשר|^לאשר|^אישור/);
    await b.page.waitForTimeout(14000);
    const vote = apiB.last('voteOnDecision');
    signed = vote?.status === 200 && vote?.json?.success === true;
    if (!signed) await shot(b.page, 'stipend-3-sign');
    record(
      '3. the recipient signs, and that is the whole quorum',
      signed && vote?.json?.data?.consensus !== false,
      vote
        ? `${vote.status} ${JSON.stringify(vote.json?.data ?? vote.json?.error ?? {}).slice(0, 240)}`
        : `no voteOnDecision call (clicked: ${clicked}; card: ${card.slice(0, 200)})`
    );
  } else {
    record('3. the recipient signs, and that is the whole quorum', false, 'nothing to sign');
  }

  // ── 4. the gate: the same form, one slider moved ───────────────────────────
  // α=0 means the rikma carries the stipend, which grows the rikma's total and
  // dilutes every member. The form must stop calling that a bilateral pledge.
  await visit(a.page, `/moach/${pid}/stipend`, { wait: 12000 });
  await clickText(a.page, /להציע ל/);
  await a.page.waitForTimeout(4000);
  await chooseOption(a.page, 0, /·\s*₪\d+\/שעה/);
  await a.page.waitForTimeout(1200);
  await setField(a.page, 'number', 0, STIPEND_RATE);
  await setField(a.page, 'range', 0, 0); // cost onto the rikma
  await a.page.waitForTimeout(3000);
  const escalated = await text(a.page);
  const gate =
    escalated.includes('התנאים האלה צריכים את הסכמת הריקמה') &&
    escalated.includes('לפתוח תוכנית מלגות');
  if (!gate) await shot(a.page, 'stipend-4-gate');
  record(
    '4. moving the cost onto the rikma stops being a bilateral pledge',
    gate,
    gate ? '' : 'the form still offers to send it to the other side alone'
  );

  // ── 5. the escalation opens a programme ────────────────────────────────────
  let programOk = false;
  if (gate) {
    await clickText(a.page, /לפתוח תוכנית מלגות/);
    await a.page.waitForTimeout(3500);
    // The budget is what makes the dilution votable: a closed number, not an
    // open-ended promise.
    await setField(a.page, 'number', 1, TOTAL_CAP);
    await a.page.waitForTimeout(1500);
    apiA.clear();
    await clickText(a.page, /^לשלוח את ההצעה$|^לשלוח לריקמה$|^לשלוח$/);
    await a.page.waitForTimeout(14000);
    const program = apiA.last('proposeStipendProgram');
    programOk = program?.status === 200 && program?.json?.success === true;
    if (!programOk) await shot(a.page, 'stipend-5-program');
    record(
      '5. the terms carry over into a rikma-wide programme with a closed budget',
      programOk,
      program
        ? `${program.status} ${JSON.stringify(program.json?.data ?? program.json?.error ?? {}).slice(0, 240)}`
        : `no proposeStipendProgram call (saw: ${apiA.keys().join(', ') || 'nothing'})`
    );
  } else {
    record('5. the terms carry over into a rikma-wide programme with a closed budget', false, 'the gate never appeared');
  }

  // ── 6. every member votes on it, seeing their own dilution ─────────────────
  if (programOk) {
    await visit(b.page, '/lev', { wait: 15000 });
    const card = await stipendCard(b.page);
    const showsShare = /%/.test(card);
    apiB.clear();
    const clicked = await clickInStipendCard(b.page, /^מאשר|^לאשר|^אישור/);
    await b.page.waitForTimeout(14000);
    const vote = apiB.last('voteOnDecision');
    const ok = vote?.status === 200 && vote?.json?.success === true;
    if (!ok) await shot(b.page, 'stipend-6-program-vote');
    record(
      '6. the other member votes the programme through, and it matures',
      ok && vote?.json?.data?.consensus === true,
      vote
        ? `${vote.status} ${JSON.stringify(vote.json?.data ?? vote.json?.error ?? {}).slice(0, 220)}`
        : `no voteOnDecision call (clicked: ${clicked}; card: ${card.slice(0, 200)})`
    );
    // Not an assertion: `dilutionForVoter` needs the rikma to already be worth
    // something (`rikmaTotal > 0`), and a fixture rikma with nothing finished
    // in it is worth nothing — so the before/after percentages the plan asks
    // for cannot be computed here. Reported, not failed, so a real regression
    // in a rikma that *does* have value still stands out.
    console.log(
      `  · dilution preview on the ballot: ${showsShare ? 'yes' : 'no — the rikma has no accrued value yet'}`
    );
  } else {
    record('6. the other member votes the programme through, and it matures', false, 'no programme to vote on');
  }

  // ── 7. one screen with everything on it ────────────────────────────────────
  await visit(a.page, `/moach/${pid}/stipend`, { wait: 13000 });
  const tab = await text(a.page);
  const hasPledge = !tab.includes('אין עדיין התחייבויות');
  const hasProgram = !tab.includes('אין עדיין תוכנית מלגות בריקמה');
  if (!hasPledge || !hasProgram) await shot(a.page, 'stipend-7-tab');
  record(
    '7. the stipend tab shows the pledge and the programme it needed',
    hasPledge && hasProgram,
    `pledge listed: ${hasPledge}, programme listed: ${hasProgram}`
  );

  await a.close();
  await b.close();
  return finish();
};

/** The heart card for a stipend decision, whichever kind it is. */
const stipendCard = (page) =>
  page.evaluate(() => {
    const card = [...document.querySelectorAll('article, section, div')]
      .filter(
        (el) =>
          /מלגת קיום|תוכנית מלגות/.test(el.innerText || '') &&
          el.innerText.length < 2500 &&
          el.querySelectorAll('button').length >= 1
      )
      .sort((x, y) => x.innerText.length - y.innerText.length)[0];
    return card ? card.innerText.replace(/\n+/g, ' | ') : '';
  });

/** Click a button inside that card — the heart holds other cards with the same verbs. */
const clickInStipendCard = (page, pattern) =>
  page.evaluate(
    ({ src, fl }) => {
      const rx = new RegExp(src, fl);
      const cards = [...document.querySelectorAll('article, section, div')]
        .filter(
          (el) =>
            /מלגת קיום|תוכנית מלגות/.test(el.innerText || '') &&
            el.innerText.length < 2500 &&
            el.querySelectorAll('button').length >= 1
        )
        .sort((x, y) => x.innerText.length - y.innerText.length);
      for (const card of cards) {
        const btn = [...card.querySelectorAll('button')].find((x) => rx.test((x.innerText || '').trim()));
        if (btn) {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return (btn.innerText || '').trim().slice(0, 40);
        }
      }
      return null;
    },
    { src: pattern.source, fl: pattern.flags }
  );

function finish() {
  const ok = steps.filter((s) => s.ok).length;
  console.log(`\n${ok}/${steps.length} steps passed.`);
  return ok === steps.length;
}

const ok = await run();
process.exit(ok ? 0 : 1);
