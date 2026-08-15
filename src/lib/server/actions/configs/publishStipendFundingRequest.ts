/**
 * Action: publishStipendFundingRequest (docs/PLAN_STIPEND.md §12.2).
 *
 * The open question the plan leaves for later, answered the way the rest of the
 * system already answers "we need something we do not have": publish it as an
 * **open resource request**.
 *
 * A stipend needs a funder, and a rikma whose income is two years away often
 * has none among its members. Rather than invent a donor flow, the need is
 * posted as an ordinary `open-mashaabim` — money, monthly, for N months —
 * carrying `source: stipend` and a link to the program it would fund. From
 * there everything already built applies: it shows up in search, the matching
 * engine suggests it to people who offer that kind of resource, and whoever
 * takes it goes through the normal joining flow and becomes a partner of the
 * rikma. Their money then buys equity under the program's own `k`, which is
 * exactly what a risk premium is for.
 *
 * The rikma must already have agreed to the program: this publishes what was
 * decided, it does not decide anything.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { dateField, enumField, fields, gqlStr, numField, run, strField } from '$lib/server/archive/gql.js';
import { fetchProgram, fetchProjectContext } from '$lib/server/stipend/read.js';
import { matchOpenMashaabimToUsers } from '$lib/server/matching/engine.js';

const KIND_OFS = ['total', 'perUnit', 'rent', 'monthly', 'yearly'] as const;

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const programId = String(params.programId ?? '');
  if (!programId) throw new Error('programId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const program = await fetchProgram(exec, programId);
  if (!program) throw new Error(`Stipend program ${programId} not found`);
  if (!program.projectId) throw new Error('This program is not attached to a rikma');
  if (program.status === 'closed' || program.status === 'exhausted') {
    throw new Error('This program is already finished — nothing left to fund');
  }

  const project = await fetchProjectContext(exec, program.projectId);
  if (!project) throw new Error('The rikma could not be read');
  if (!project.memberIds.includes(userId)) {
    throw new Error('Only a member of the rikma may publish its funding request');
  }
  if (program.status === 'proposed') {
    throw new Error(
      'The rikma has not approved this program yet — a funder should not be recruited to something still under discussion'
    );
  }

  const months = params.months != null ? Math.max(1, Math.round(Number(params.months))) : 12;
  const budget = Number(program.totalCap ?? 0);
  const monthly =
    params.monthlyAmount != null
      ? Number(params.monthlyAmount)
      : budget > 0
        ? Math.round((budget / months) * 100) / 100
        : Number(program.monthlyCap ?? 0);

  const name = params.name
    ? String(params.name)
    : `מימון מלגות קיום לחברי ${project.projectName}`;
  const descrip = params.descrip
    ? String(params.descrip)
    : [
        `הריקמה מחפשת שותף שיממן מלגות קיום לחברים שעובדים בה.`,
        `תעריף המלגה: ₪${program.stipendRate} לשעה שאושרה. תקציב התוכנית: ₪${budget}.`,
        program.mode === 'equity'
          ? `הכסף נספר כתרומה לריקמה ומזכה בחלק בה (מקדם ${program.equityMultiplier}).`
          : program.mode === 'advance'
            ? `הכסף נרשם כמקדמה שנפרעת מחלוקות רווח בלבד.`
            : `הכסף נרשם כתרומה — בלי חלק בריקמה.`,
        `מי שייקח את המשאב הזה מצטרף לריקמה כשותף.`
      ].join(' ');

  const nowISO = new Date().toISOString();
  const created = await run(
    exec,
    `mutation { createOpenMashaabim(data: { ${fields(
      strField('name', name),
      strField('descrip', descrip),
      strField('spnot', params.spnot ? String(params.spnot) : null),
      strField('project', program.projectId),
      strField('stipend_program', programId),
      enumField('kindOf', String(params.kindOf ?? 'monthly'), KIND_OFS),
      numField('hm', months),
      numField('price', monthly),
      numField('easy', budget > 0 ? budget : monthly * months),
      numField('howMeny', 1),
      'source: stipend',
      'recurring: true',
      'lifecycle: active',
      numField('cycleSize', 1),
      params.mashaabimId ? strField('mashaabim', String(params.mashaabimId)) : null,
      dateField('sqadualed', params.startDate ?? nowISO),
      dateField('sqadualedf', params.endDate ?? null),
      dateField('publishedAt', nowISO)
    )} }) { data { id } } }`,
    'publishStipendFundingRequest'
  );

  const openMashaabimId = created?.createOpenMashaabim?.data?.id
    ? String(created.createOpenMashaabim.data.id)
    : null;
  if (!openMashaabimId) throw new Error('Failed to publish the funding request');

  await run(
    exec,
    `mutation { updateStipendProgram(id: ${gqlStr(programId)}, data: { seekingFunder: true }) { data { id } } }`,
    'publishStipendFundingRequest:flag'
  ).catch((e) => console.warn('[publishStipendFundingRequest] flagging the program failed:', e));

  // Suggest it to people who already offer this kind of resource. Only possible
  // when the request is filed under a mashaabim template — without one it still
  // lives in search and on the rikma's page, it just isn't pushed to anyone.
  let suggested = 0;
  if (params.mashaabimId) {
    const res = await matchOpenMashaabimToUsers(openMashaabimId, 'resourceCreated', {
      strapi,
      fetch: context.fetch,
      lang: context.lang
    }).catch((e: unknown) => {
      console.warn('[publishStipendFundingRequest] matching failed (non-fatal):', e);
      return { created: 0 };
    });
    suggested = res?.created ?? 0;
  }

  return {
    data: { openMashaabimId, programId, monthly, months, suggested },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const publishStipendFundingRequestConfig: ActionConfig = {
  key: 'publishStipendFundingRequest',
  description:
    'Publish an approved stipend program as an open resource request, so someone outside the rikma can join it as the funding partner. Uses the ordinary open-mashaabim + matching path.',
  graphqlOperation: handler,

  paramSchema: {
    programId: { type: 'string', required: true, description: 'The approved stipend program to fund' },
    months: { type: 'number', required: false, description: 'How many months of funding are being asked for (default 12)' },
    monthlyAmount: { type: 'number', required: false, description: '₪ per month (defaults to budget ÷ months)' },
    mashaabimId: { type: 'string', required: false, description: 'Resource template to file it under — enables match suggestions' },
    name: { type: 'string', required: false, description: 'Title of the request' },
    descrip: { type: 'string', required: false, description: 'Body of the request' },
    spnot: { type: 'string', required: false, description: 'Extra notes' },
    kindOf: { type: 'string', required: false, description: 'monthly (default) | total | yearly | perUnit | rent' },
    startDate: { type: 'string', required: false, description: 'ISO start date' },
    endDate: { type: 'string', required: false, description: 'ISO end date' }
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to publish a funding request' }],

  updateStrategy: { type: 'fullRefresh' }
};
