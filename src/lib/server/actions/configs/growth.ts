/**
 * Lev Growth Agent actions (docs/inprogress/PLAN_GROWTH_AGENT.md §8).
 *
 * Every write of the module goes through here: an operator records, imports,
 * researches, prepares and logs outreach for prospect businesses. Rules shared
 * by all of them:
 *
 *  - only a growth operator (`checkGrowthOperator`) — a member of the growth
 *    rikma, under their own JWT — passes the auth rule;
 *  - nothing here contacts a business. Messages are drafted and approved;
 *    "contacted" is recorded only when the operator says so (§6.3);
 *  - a business that declined or asked not to be contacted refuses every
 *    outreach step (`CLOSED_DOOR`), and "do not contact" forgets its contact
 *    details while keeping its hashed identity so it is never re-imported;
 *  - the onboarding link is the platform's own `prepareSignup` hand-off: the
 *    owner reviews, corrects and creates — the agent never acts for them.
 */

import type { ActionConfig, ActionExecutionHandler, AuthRule } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { csvToInputs, MAX_IMPORT_BYTES } from '$lib/growth/csv';
import { dedupeBatch } from '$lib/growth/dedupe';
import { draftProfile, editProfile, profileToBlueprint } from '$lib/growth/profile';
import {
  advance,
  applyEdit,
  asLang,
  cleanInput,
  forgetContact,
  keysOf,
  newProspect,
  setStage,
  withActivity
} from '$lib/growth/prospect';
import { isClosed, isStage, manualStageChange } from '$lib/growth/stages';
import {
  CONTACT_CHANNELS,
  OUTREACH_KINDS,
  RESPONSE_KINDS,
  type ContactChannel,
  type OutreachKind,
  type Prospect,
  type ProspectInput,
  type ResponseKind
} from '$lib/growth/types';
import { checkGrowthOperator } from '$lib/server/growth/operator';
import { growthProjectId } from '$lib/server/growth/config';
import { growthRepository, hashKeys, type ProspectRepository } from '$lib/server/growth/repo';
import { draftOutreach, platformGenerate, researchProspect } from '$lib/server/growth/agent';

const operatorRule: AuthRule = {
  type: 'custom',
  config: {
    checkFunction: async (userId: string, _params: Record<string, any>, context: any) => {
      const { strapiClient } = await import('../index.js');
      const r = await checkGrowthOperator(userId, context?.jwt, context?.fetch, strapiClient);
      if (r.ok) return { authorized: true };
      const refusal = r as Extract<typeof r, { ok: false }>;
      return { authorized: false, reason: `GROWTH_${refusal.reason.toUpperCase()}` };
    }
  },
  errorMessage: 'Only the platform team operates the Growth Agent'
};

const authRules: AuthRule[] = [{ type: 'jwt', errorMessage: 'You must be logged in' }, operatorRule];

/** Every operator's screen refreshes; nobody else is in the growth scope. */
const realtime = { scopes: () => scopeList([scope('project', growthProjectId())]) };

function repo(): ProspectRepository {
  const r = growthRepository();
  if (!r) throw new ActionError('NOT_CONFIGURED', 'The Growth Agent is not configured (GROWTH_STORE / GROWTH_STATE_DIR)');
  return r;
}

async function load(id: unknown): Promise<Prospect> {
  const p = await repo().get(String(id ?? ''));
  if (!p) throw new ActionError('NOT_FOUND', 'No such business in the pipeline');
  return p;
}

async function save(id: string, fn: (p: Prospect) => Prospect): Promise<Prospect> {
  const next = await repo().update(id, fn);
  if (!next) throw new ActionError('NOT_FOUND', 'No such business in the pipeline');
  return next;
}

function openDoor(p: Prospect) {
  if (isClosed(p.stage)) {
    throw new ActionError('CLOSED_DOOR', 'This business declined or asked not to be contacted', { stage: p.stage });
  }
}

const now = () => new Date().toISOString();

// ─── record / edit ───────────────────────────────────────────────────────────

const saveProspect: ActionExecutionHandler = async (params, context) => {
  const at = now();
  const c = cleanInput((params.prospect ?? {}) as ProspectInput, context.userId, at);
  if (c.ok === false) {
    const refusal = c as Extract<typeof c, { ok: false }>;
    throw new ActionError('VALIDATION_FAILED', refusal.code, { field: refusal.field });
  }
  const keys = hashKeys(keysOf(c.value));
  const store = repo();

  if (params.id) {
    const current = await load(params.id);
    // Another record already holds one of the new keys: the edit would merge two businesses silently.
    const others = (await store.list()).filter((p) => p.id !== current.id);
    const taken = others.find((p) => p.dedupeKeys.some((k) => keys.includes(k)));
    if (taken) throw new ActionError('DUPLICATE', 'Another business in the pipeline has these details', { id: taken.id, name: taken.name });
    const next = await save(current.id, (p) => applyEdit(p, c.value, keys, context.userId, at));
    return { id: next.id };
  }

  const all = await store.list();
  const same = all.find((p) => p.dedupeKeys.some((k) => keys.includes(k)));
  if (same) return { id: same.id, duplicated: true, stage: same.stage };
  const p = newProspect(c.value, keys, context.userId, at);
  await store.insert([p]);
  return { id: p.id, duplicated: false };
};

const importProspects: ActionExecutionHandler = async (params, context) => {
  const text = String(params.csv ?? '');
  if (!text.trim()) throw new ActionError('VALIDATION_FAILED', 'EMPTY_FILE');
  if (text.length > MAX_IMPORT_BYTES) throw new ActionError('VALIDATION_FAILED', 'FILE_TOO_LARGE');
  const fileName = params.fileName ? String(params.fileName).slice(0, 120) : null;
  const preview = csvToInputs(text, fileName);
  if (preview.noNameColumn) throw new ActionError('VALIDATION_FAILED', 'NO_NAME_COLUMN');

  const at = now();
  const invalid: { line: number; code: string; field: string }[] = preview.missingName.map((line) => ({
    line,
    code: 'NAME_REQUIRED',
    field: 'name'
  }));
  const clean: { c: Extract<ReturnType<typeof cleanInput>, { ok: true }>['value']; line: number }[] = [];
  preview.rows.forEach((row, i) => {
    const r = cleanInput(row, context.userId, at, 'csv');
    if (r.ok) clean.push({ c: r.value, line: i + 2 });
    else {
      const refusal = r as Extract<typeof r, { ok: false }>;
      invalid.push({ line: i + 2, code: refusal.code, field: refusal.field });
    }
  });

  const store = repo();
  const known = await store.knownKeys();
  const { fresh, repeats } = dedupeBatch(clean, (x) => hashKeys(keysOf(x.c)), known);
  const rows = fresh.map(({ row, keys }) => newProspect(row.c, keys, context.userId, at));
  if (rows.length) await store.insert(rows);
  return {
    imported: rows.length,
    duplicates: repeats.map((r) => ({ line: r.row.line, name: r.row.c.name, inFile: r.inBatch })),
    invalid,
    truncated: preview.tooMany
  };
};

// ─── stage & log ─────────────────────────────────────────────────────────────

const setStageHandler: ActionExecutionHandler = async (params, context) => {
  const to = params.stage;
  if (!isStage(to)) throw new ActionError('VALIDATION_FAILED', 'BAD_STAGE');
  const p = await load(params.id);
  const reason = params.reason ? String(params.reason).trim().slice(0, 500) : null;
  const ok = manualStageChange(p.stage, to, reason);
  if (ok.ok === false) {
    const refusal = ok as Extract<typeof ok, { ok: false }>;
    throw new ActionError('VALIDATION_FAILED', refusal.code);
  }
  const at = now();
  const next = await save(p.id, (cur) => {
    const moved = setStage(cur, to, context.userId, at, reason);
    return to === 'doNotContact' ? forgetContact(moved) : moved;
  });
  return { id: next.id, stage: next.stage };
};

const FOLLOW_UP_MAX_DAYS = 366;

const logActivity: ActionExecutionHandler = async (params, context) => {
  const kind = String(params.kind ?? '');
  const p = await load(params.id);
  const at = now();
  const text = params.text ? String(params.text).trim().slice(0, 2000) : null;

  if (kind === 'note') {
    if (!text) throw new ActionError('VALIDATION_FAILED', 'TEXT_REQUIRED');
    await save(p.id, (cur) => withActivity(cur, { at, by: context.userId, kind: 'note', text }));
    return { id: p.id };
  }

  if (kind === 'followUp') {
    openDoor(p);
    const raw = params.followUpAt ? String(params.followUpAt) : '';
    let followUpAt: string | null = null;
    if (raw) {
      const t = Date.parse(raw);
      if (!Number.isFinite(t) || t > Date.now() + FOLLOW_UP_MAX_DAYS * 86400_000) {
        throw new ActionError('VALIDATION_FAILED', 'BAD_DATE');
      }
      followUpAt = new Date(t).toISOString();
    }
    const nextAction = params.nextAction != null ? String(params.nextAction).trim().slice(0, 300) || null : p.nextAction;
    await save(p.id, (cur) =>
      withActivity({ ...cur, followUpAt, nextAction }, { at, by: context.userId, kind: 'followUp', text: [followUpAt, nextAction].filter(Boolean).join(' · ') || null })
    );
    return { id: p.id, followUpAt };
  }

  if (kind === 'contacted') {
    // The operator's word that a message went out. Opening WhatsApp or a mail
    // draft is not that — the screen asks only after they come back (§6.3).
    openDoor(p);
    const channel = (CONTACT_CHANNELS as readonly string[]).includes(params.channel) ? (params.channel as ContactChannel) : 'other';
    await save(p.id, (cur) =>
      advance(withActivity(cur, { at, by: context.userId, kind: 'contacted', channel, text }), 'invitationSent', context.userId, at)
    );
    return { id: p.id };
  }

  if (kind === 'response') {
    const response = String(params.response ?? '') as ResponseKind;
    if (!RESPONSE_KINDS.includes(response)) throw new ActionError('VALIDATION_FAILED', 'BAD_RESPONSE');
    const next = await save(p.id, (cur) => {
      let n = withActivity(cur, { at, by: context.userId, kind: 'response', response, text });
      if (response === 'interested') n = advance(n, 'interested', context.userId, at);
      if (response === 'declined') n = setStage(n, 'declined', context.userId, at);
      if (response === 'doNotContact') n = forgetContact(setStage(n, 'doNotContact', context.userId, at));
      return n;
    });
    return { id: next.id, stage: next.stage };
  }

  throw new ActionError('VALIDATION_FAILED', 'BAD_KIND');
};

// ─── agent steps ─────────────────────────────────────────────────────────────

const research: ActionExecutionHandler = async (params, context) => {
  const p = await load(params.id);
  if (p.stage === 'doNotContact') throw new ActionError('CLOSED_DOOR', 'This business asked not to be contacted');
  const lang = asLang(params.lang ?? context.lang, p.lang);
  const report = await researchProspect(p, context.userId, lang, { generate: await platformGenerate() });
  const at = now();
  const next = await save(p.id, (cur) => {
    let n = withActivity(
      { ...cur, research: report },
      { at, by: context.userId, kind: 'research', text: `${report.status} · ${report.confidence}${report.problems.length ? ` · ${report.problems.join(', ')}` : ''}` }
    );
    if (report.status !== 'failed') n = advance(n, 'researched', context.userId, at);
    return n;
  });
  return { id: next.id, status: report.status, problems: report.problems };
};

const profile: ActionExecutionHandler = async (params, context) => {
  const mode = String(params.mode ?? '');
  const p = await load(params.id);
  if (p.stage === 'doNotContact') throw new ActionError('CLOSED_DOOR', 'This business asked not to be contacted');
  const at = now();

  if (mode === 'generate') {
    await save(p.id, (cur) =>
      advance(withActivity({ ...cur, profile: draftProfile(cur, at) }, { at, by: context.userId, kind: 'profile' }), 'profilePrepared', context.userId, at)
    );
    return { id: p.id };
  }
  if (!p.profile) throw new ActionError('VALIDATION_FAILED', 'NO_PROFILE');

  if (mode === 'edit') {
    const r = editProfile(p.profile, (params.patch ?? {}) as Record<string, unknown>, at);
    if (r.ok === false) {
      const refusal = r as Extract<typeof r, { ok: false }>;
      throw new ActionError('VALIDATION_FAILED', 'BAD_FIELD', { field: refusal.field });
    }
    await save(p.id, (cur) => withActivity({ ...cur, profile: r.value }, { at, by: context.userId, kind: 'edited', text: 'profile' }));
    return { id: p.id };
  }

  if (mode === 'approve') {
    await save(p.id, (cur) =>
      withActivity({ ...cur, profile: { ...cur.profile!, approvedAt: at, approvedBy: context.userId } }, { at, by: context.userId, kind: 'profileApproved' })
    );
    return { id: p.id };
  }
  throw new ActionError('VALIDATION_FAILED', 'BAD_MODE');
};

const outreach: ActionExecutionHandler = async (params, context) => {
  const mode = String(params.mode ?? '');
  const p = await load(params.id);
  openDoor(p);
  const at = now();

  if (mode === 'generate') {
    const lang = asLang(params.lang, p.lang);
    const { variants, usedModel } = await draftOutreach(p, lang, await platformGenerate());
    await save(p.id, (cur) =>
      advance(
        withActivity(
          { ...cur, outreach: { generatedAt: at, variants, approved: null } },
          { at, by: context.userId, kind: 'outreachDrafted', text: `${lang} · ${usedModel ? 'ai' : 'template'}` }
        ),
        'awaitingApproval',
        context.userId,
        at
      )
    );
    return { id: p.id, usedModel };
  }

  if (mode === 'approve') {
    if (!p.profile?.approvedAt) throw new ActionError('VALIDATION_FAILED', 'PROFILE_NOT_APPROVED');
    const kind = String(params.kind ?? '') as OutreachKind;
    if (!OUTREACH_KINDS.includes(kind)) throw new ActionError('VALIDATION_FAILED', 'BAD_KIND');
    const body = String(params.body ?? '').trim().slice(0, 3000);
    if (!body) throw new ActionError('VALIDATION_FAILED', 'TEXT_REQUIRED');
    const subject = params.subject ? String(params.subject).trim().slice(0, 200) : null;
    const lang = asLang(params.lang, p.lang);
    await save(p.id, (cur) => {
      const variants = cur.outreach?.variants ?? [];
      const original = variants.find((v) => v.kind === kind && v.lang === lang);
      const edited = !original || original.body !== body || (original.subject ?? null) !== subject;
      const approved = { kind, lang, subject, body, origin: edited ? ('edited' as const) : original!.origin, approvedAt: at, approvedBy: context.userId };
      return advance(
        withActivity(
          { ...cur, outreach: { generatedAt: cur.outreach?.generatedAt ?? at, variants, approved } },
          { at, by: context.userId, kind: 'outreachApproved', text: `${kind} · ${lang}` }
        ),
        'invitationReady',
        context.userId,
        at
      );
    });
    return { id: p.id };
  }
  throw new ActionError('VALIDATION_FAILED', 'BAD_MODE');
};

const prepareOnboarding: ActionExecutionHandler = async (params, context) => {
  const p = await load(params.id);
  openDoor(p);
  if (!p.profile?.approvedAt) throw new ActionError('VALIDATION_FAILED', 'PROFILE_NOT_APPROVED');
  if (!p.email) throw new ActionError('VALIDATION_FAILED', 'EMAIL_REQUIRED');

  const [{ takePrepareFor }, { prepareSignup }, { checkSignupRecipient }, { HANDOFF_TOKEN_TTL_MS }, { strapiClient }] =
    await Promise.all([
      import('$lib/server/assistant/publicQuota.js'),
      import('$lib/server/assistant/prepareSignup.js'),
      import('$lib/server/assistant/signupRecipient.js'),
      import('$lib/server/assistant/signupToken.js'),
      import('../index.js')
    ]);
  const deps = { strapi: strapiClient, fetch: context.fetch };
  const who = await checkSignupRecipient(p.email, String(context.userId), deps);
  if ('reason' in who) throw new ActionError('VALIDATION_FAILED', String(who.reason), { message: who.message });
  const quota = takePrepareFor(String(context.userId));
  if (!quota.ok) throw new ActionError('RATE_LIMITED', 'Too many prepared', { retryAfterSeconds: quota.retryAfterSeconds });

  const r = await prepareSignup(
    { name: p.name.slice(0, 80), email: p.email, lang: p.lang, intent: 'business', blueprint: profileToBlueprint(p.profile) },
    deps,
    { tokenTtlMs: HANDOFF_TOKEN_TTL_MS, receive: who.hasAccount }
  );
  const at = now();
  await save(p.id, (cur) =>
    withActivity(
      {
        ...cur,
        onboarding: {
          preparedAt: at,
          preparedBy: context.userId,
          email: p.email!,
          previewUrl: r.previewUrl ?? null,
          manageUrl: r.manageUrl ?? null,
          signupUrl: r.signupUrl ?? null,
          receiveUrl: r.receiveUrl ?? null,
          expiresAt: r.expiresAt,
          hasAccount: who.hasAccount,
          // How the owner's claim is recognised later (ownerEvents.ts, §10.2).
          sessionId: r.sessionId ?? null
        }
      },
      { at, by: context.userId, kind: 'onboarding', text: r.expiresAt }
    )
  );
  return { id: p.id, expiresAt: r.expiresAt };
};

// ─── active providers (§10.4) ────────────────────────────────────────────────

const checkActive: ActionExecutionHandler = async (params, context) => {
  const [{ checkActiveProviders }, { strapiClient }] = await Promise.all([
    import('$lib/server/growth/activeProviders'),
    import('../index.js')
  ]);
  const id = params.id ? String(params.id) : undefined;
  if (id) await load(id);
  // The operator asked: re-read now, even if the daily run already did.
  return checkActiveProviders(repo(), strapiClient, { fetch: context.fetch, id, force: true });
};

// ─── configs ─────────────────────────────────────────────────────────────────

const base = { authRules, access: ['user' as const], realtime };

export const growthConfigs: ActionConfig[] = [
  {
    ...base,
    key: 'growthSaveProspect',
    description: 'Growth Agent: record a business by hand, or edit one',
    graphqlOperation: saveProspect,
    paramSchema: {
      id: { type: 'string', required: false, description: 'Edit this prospect; omit to add one' },
      prospect: { type: 'object', required: true, description: 'name, website, email, phone, city, region, country, category, services, keywords, size, notes, lang, sourceKind, sourceLabel, sourceUrl' }
    }
  },
  {
    ...base,
    key: 'growthImportProspects',
    description: 'Growth Agent: import businesses from a CSV file (deduplicated)',
    graphqlOperation: importProspects,
    paramSchema: {
      csv: { type: 'string', required: true, description: 'The file text' },
      fileName: { type: 'string', required: false, description: 'Recorded as the source label' }
    }
  },
  {
    ...base,
    key: 'growthSetStage',
    description: "Growth Agent: set a business's pipeline stage by hand",
    graphqlOperation: setStageHandler,
    paramSchema: {
      id: { type: 'string', required: true, description: 'The prospect' },
      stage: { type: 'string', required: true, description: 'The new stage' },
      reason: { type: 'string', required: false, description: 'Why — required to leave "do not contact"' }
    }
  },
  {
    ...base,
    key: 'growthLogActivity',
    description: 'Growth Agent: a note, a contact the operator made, a response, or a follow-up date',
    graphqlOperation: logActivity,
    paramSchema: {
      id: { type: 'string', required: true, description: 'The prospect' },
      kind: { type: 'string', required: true, description: 'note · contacted · response · followUp' },
      text: { type: 'string', required: false, description: 'What happened' },
      channel: { type: 'string', required: false, description: 'whatsapp · email · phone · inPerson · other' },
      response: { type: 'string', required: false, description: RESPONSE_KINDS.join(' · ') },
      followUpAt: { type: 'string', required: false, description: 'ISO date ("" clears it)' },
      nextAction: { type: 'string', required: false, description: 'The next step in words' }
    }
  },
  {
    ...base,
    key: 'growthResearch',
    description: "Growth Agent: research a business from its public website",
    graphqlOperation: research,
    paramSchema: {
      id: { type: 'string', required: true, description: 'The prospect' },
      lang: { type: 'string', required: false, description: 'Report language: he · en · ar' }
    }
  },
  {
    ...base,
    key: 'growthProfile',
    description: 'Growth Agent: draft, edit or approve the proposed 1💗1 profile',
    graphqlOperation: profile,
    paramSchema: {
      id: { type: 'string', required: true, description: 'The prospect' },
      mode: { type: 'string', required: true, description: 'generate · edit · approve' },
      patch: { type: 'object', required: false, description: 'Fields to change (edit)' }
    }
  },
  {
    ...base,
    key: 'growthOutreach',
    description: 'Growth Agent: draft invitation variants, or approve one (approval is not sending)',
    graphqlOperation: outreach,
    paramSchema: {
      id: { type: 'string', required: true, description: 'The prospect' },
      mode: { type: 'string', required: true, description: 'generate · approve' },
      lang: { type: 'string', required: false, description: 'he · en · ar' },
      kind: { type: 'string', required: false, description: OUTREACH_KINDS.join(' · ') },
      subject: { type: 'string', required: false, description: 'Email subject' },
      body: { type: 'string', required: false, description: 'The approved text' }
    }
  },
  {
    ...base,
    key: 'growthCheckActive',
    description: "Growth Agent: check whether joined businesses' rikmas are active (products + recent sales or proposals)",
    graphqlOperation: checkActive,
    paramSchema: {
      id: { type: 'string', required: false, description: 'One business; omit for every business that created a rikma' }
    }
  },
  {
    ...base,
    key: 'growthPrepareOnboarding',
    description: "Growth Agent: prepare the owner's review-and-join link (prepareSignup, business track)",
    graphqlOperation: prepareOnboarding,
    paramSchema: {
      id: { type: 'string', required: true, description: 'The prospect' }
    }
  }
];
