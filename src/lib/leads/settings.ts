/**
 * A rikma's lead settings (`Project.leadSettings`, json — null = defaults;
 * docs/inprogress/PLAN_LEADS.md §7.1). Read through `resolveLeadSettings`
 * only, so a half-filled or hand-edited object never reaches a caller.
 */

export interface LeadSettings {
  /** Roles whose holders are handed every new lead's task. Empty = the whole rikma. */
  leadRoleIds: string[];
  /** A running mission the lead tasks hang under, if the rikma counts this work. */
  leadMissionId: string | null;
  /** How soon somebody should get back to a new lead (speed-to-lead). */
  leadResponseHours: number;
  /** Days without activity before an open lead needs attention. */
  leadStaleDays: number;
  /** Months a paused/spam lead is kept before it is anonymised. */
  leadRetentionMonths: number;
  notifyTelegram: boolean;
}

export const DEFAULT_LEAD_SETTINGS: Readonly<LeadSettings> = Object.freeze({
  leadRoleIds: [],
  leadMissionId: null,
  leadResponseHours: 24,
  leadStaleDays: 7,
  leadRetentionMonths: 18,
  notifyTelegram: false
});

function positive(v: unknown, fallback: number, max: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
}

export function resolveLeadSettings(raw: unknown): LeadSettings {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_LEAD_SETTINGS;
  const roles = Array.isArray(r.leadRoleIds)
    ? r.leadRoleIds.filter((x) => x != null && String(x).trim() !== '').map(String)
    : [];
  const mission = r.leadMissionId != null && String(r.leadMissionId).trim() !== '' ? String(r.leadMissionId) : null;
  return {
    leadRoleIds: roles,
    leadMissionId: mission,
    leadResponseHours: positive(r.leadResponseHours, d.leadResponseHours, 24 * 30),
    leadStaleDays: positive(r.leadStaleDays, d.leadStaleDays, 365),
    leadRetentionMonths: positive(r.leadRetentionMonths, d.leadRetentionMonths, 120),
    notifyTelegram: r.notifyTelegram === true
  };
}
