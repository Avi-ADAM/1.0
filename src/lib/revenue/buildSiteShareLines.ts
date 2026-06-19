/**
 * buildSiteShareLines — turns a computed site share into the extra Tosplit lines
 * (one Haluka + one Hervachti entry) that add the platform as a recipient.
 *
 * Pure: it does NOT create records — it returns the data the caller should send
 * to `createHaluka` and append to the `hervachti` array. This keeps the money-
 * moving side effects in the existing flow while the math stays testable.
 *
 * Returns null whenever injection must be skipped (disabled, no treasury, zero
 * amount, or payer === treasury), so callers can guard with a simple `if`.
 * See PLAN §4, §6.1.
 */

import type { PayerRole, SiteShareConfig } from './types.js';
import { computeSiteShare } from './computeSiteShare.js';

export interface SiteShareLinesInput {
  /** Feature flag for this path. When false → null. */
  enabled: boolean;
  payerRole: PayerRole;
  /** provider → earnings being split; customer → spend. */
  baseAmount: number;
  /** Recipient of the site-share Haluka. Empty/missing → null. */
  treasuryUserId?: string | null;
  /** Who sends the site-share Haluka. */
  payerUserId: string;
  projectId: string;
  /** Currency id. Defaults to '2' to match the existing manual-split flow. */
  matbea?: string;
  config?: Partial<SiteShareConfig>;
}

export interface SiteShareHalukaData {
  project: string;
  usersend: string;
  userrecive: string;
  amount: number;
  matbea: string;
  confirmed: boolean;
  /** Suggested amount before any payer adjustment (R2). */
  proposedAmount: number;
}

export interface SiteShareHervachtiEntry {
  users_permissions_user: number;
  amount: number;
  mekabel: true;
  noten: false;
  nirsham: false;
}

export interface SiteShareLines {
  siteAmount: number;
  halukaData: SiteShareHalukaData;
  hervachtiEntry: SiteShareHervachtiEntry;
}

export function buildSiteShareLines(input: SiteShareLinesInput): SiteShareLines | null {
  if (!input.enabled) return null;

  const treasuryUserId = (input.treasuryUserId ?? '').toString().trim();
  if (!treasuryUserId) return null;
  if (treasuryUserId === String(input.payerUserId)) return null;

  const matbea = input.matbea ?? '2';
  const { siteAmount } = computeSiteShare({
    payerRole: input.payerRole,
    baseAmount: input.baseAmount,
    matbea,
    config: input.config
  });

  if (!(siteAmount > 0)) return null;

  return {
    siteAmount,
    halukaData: {
      project: String(input.projectId),
      usersend: String(input.payerUserId),
      userrecive: treasuryUserId,
      amount: siteAmount,
      matbea,
      confirmed: false,
      proposedAmount: siteAmount
    },
    hervachtiEntry: {
      users_permissions_user: parseInt(treasuryUserId, 10),
      amount: siteAmount,
      mekabel: true,
      noten: false,
      nirsham: false
    }
  };
}
