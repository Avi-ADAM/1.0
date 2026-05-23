/**
 * Action: getMissionForEdit
 *
 * Read-only action. Fetches an existing Mission entity's editable fields
 * for the mission creation form (when id !== 0).
 *
 * Returns skill names, role names, workway names already resolved to the
 * requested language (falls back to default locale if no localization).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { missionId, lang = 'en' } = params;

  const res = await strapi.execute(
    '162getMissionForEdit',
    { id: missionId },
    context.jwt,
    context.fetch,
  );

  const data = res?.data?.mission?.data;
  if (!data) throw new Error(`Mission ${missionId} not found`);

  const attrs = data.attributes;

  /**
   * Resolve a localized name: prefer the localization matching `lang` if
   * available, otherwise use the default-locale value.
   */
  function resolveLocalized(
    defaultName: string,
    localizations: Array<{ attributes: { [key: string]: string } }> | undefined,
    field: string,
  ): string {
    if (lang === 'he' && localizations && localizations.length > 0) {
      return localizations[0].attributes[field] ?? defaultName;
    }
    return defaultName;
  }

  const skillNames: string[] = (attrs.skills?.data ?? []).map((s: any) =>
    resolveLocalized(
      s.attributes.skillName,
      s.attributes.localizations?.data,
      'skillName',
    ),
  );

  const roleNames: string[] = (attrs.tafkidims?.data ?? []).map((r: any) =>
    resolveLocalized(
      r.attributes.roleDescription,
      r.attributes.localizations?.data,
      'roleDescription',
    ),
  );

  const workwayNames: string[] = (attrs.work_ways?.data ?? []).map((w: any) =>
    resolveLocalized(
      w.attributes.workWayName,
      w.attributes.localizations?.data,
      'workWayName',
    ),
  );

  return {
    data: {
      missionId: data.id,
      missionName: attrs.missionName ?? '',
      descrip: attrs.descrip ?? '',
      skillNames,
      roleNames,
      workwayNames,
    },
    updateStrategy: { type: 'none' },
  };
};

export const getMissionForEditConfig: ActionConfig = {
  key: 'getMissionForEdit',
  description:
    'Read mission entity fields for the edit form: name, description, skills, roles, workways (already resolved to requested language).',
  graphqlOperation: handler,

  paramSchema: {
    missionId: { type: 'string', required: true, description: 'Mission entity ID' },
    lang:      { type: 'string', required: false, description: 'Language code for localization (he/en)' },
  },

  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' },
};
