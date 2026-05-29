/**
 * Action: getDecisionDetails
 *
 * Read-only action for the decision card display.
 * Fetches Decision new-value fields AND the project's current values for that
 * field in a single server round-trip, then returns a structured
 * { kind, fieldLabel, currentValue, newValue } object for the UI.
 *
 * Supported kinds (from updateProjectDetails multi-user flow):
 *   name, pubdes, prides, newFlink, newWlink, timtoM, vallueadd, vallueles, pic
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const RESTIME_LABELS: Record<string, { he: string; en: string }> = {
  feh:    { he: '48 שעות', en: '48 hours' },
  sth:    { he: '72 שעות', en: '72 hours' },
  nsh:    { he: '96 שעות', en: '96 hours' },
  sevend: { he: 'שבוע', en: '1 week' },
};

const KIND_LABELS: Record<string, { he: string; en: string }> = {
  name:      { he: 'שינוי שם הפרויקט', en: 'Project name change' },
  pubdes:    { he: 'שינוי תיאור ציבורי', en: 'Public description change' },
  prides:    { he: 'שינוי תיאור פנימי', en: 'Private description change' },
  newFlink:  { he: 'שינוי קישור פייסבוק', en: 'Facebook link change' },
  newWlink:  { he: 'שינוי אתר הפרויקט', en: 'Website change' },
  timtoM:    { he: 'שינוי זמן הצבעה', en: 'Voting duration change' },
  vallueadd: { he: 'הוספת ערכים', en: 'Adding values' },
  vallueles: { he: 'הסרת ערכים', en: 'Removing values' },
  pic:       { he: 'שינוי לוגו הפרויקט', en: 'Project logo change' },
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { decisionId, projectId } = params;

  const combined = await strapi.execute(
    '161getDecisionDisplayInfo',
    { id: decisionId, pid: projectId },
    context.jwt,
    context.fetch,
  );

  const decAttrs = combined?.data?.decision?.data?.attributes;
  const projAttrs = combined?.data?.project?.data?.attributes;

  if (!decAttrs) throw new Error(`Decision ${decisionId} not found`);

  const kind: string = decAttrs.kind ?? 'unknown';
  const fieldLabel = KIND_LABELS[kind] ?? { he: kind, en: kind };

  let currentValue = '';
  let newValue = '';

  switch (kind) {
    case 'name':
      currentValue = projAttrs?.projectName ?? '';
      newValue = decAttrs.newname ?? '';
      break;

    case 'pubdes':
      currentValue = projAttrs?.publicDescription ?? '';
      newValue = decAttrs.newpubdes ?? '';
      break;

    case 'prides':
      currentValue = projAttrs?.descripFor ?? '';
      newValue = decAttrs.newprides ?? '';
      break;

    case 'newFlink':
      currentValue = projAttrs?.fblink ?? '';
      newValue = decAttrs.newFlink ?? '';
      break;

    case 'newWlink':
      currentValue = projAttrs?.linkToWebsite ?? '';
      newValue = decAttrs.newWlink ?? '';
      break;

    case 'timtoM': {
      const cur: string = projAttrs?.restime ?? '';
      const nxt: string = decAttrs.timtoM ?? '';
      currentValue = RESTIME_LABELS[cur]?.he ?? cur;
      newValue = RESTIME_LABELS[nxt]?.he ?? nxt;
      break;
    }

    case 'vallueadd': {
      const adding: any[] = decAttrs.valluesadd?.data ?? [];
      newValue = adding.map((v: any) => v.attributes?.valueName ?? v.id).join(', ');
      currentValue = '';
      break;
    }

    case 'vallueles': {
      const removing: any[] = decAttrs.valluesles?.data ?? [];
      const removing_names = removing.map((v: any) => v.attributes?.valueName ?? v.id).join(', ');
      currentValue = removing_names;
      newValue = '';  // removing → no "new" value
      break;
    }

    case 'pic':
      // pic handled separately in decisionMaking via src/src2 props
      currentValue = '';
      newValue = '';
      break;

    default:
      currentValue = '';
      newValue = '';
  }

  return {
    data: { kind, fieldLabel, currentValue, newValue },
    updateStrategy: { type: 'none' },
  };
};

export const getDecisionDetailsConfig: ActionConfig = {
  key: 'getDecisionDetails',
  description:
    'Read-only: fetch Decision new-value fields + project current values. Returns { kind, fieldLabel, currentValue, newValue } for the decision vote card display.',
  graphqlOperation: handler,

  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'Decision entity ID' },
    projectId:  { type: 'string', required: true, description: 'Project ID (for current field values)' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to view decision details',
    },
  ],

  updateStrategy: { type: 'none' },
};
