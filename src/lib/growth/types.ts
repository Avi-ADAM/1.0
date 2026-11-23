/**
 * Lev Growth Agent — the shapes of a prospect business and everything the
 * agent prepares for it (docs/inprogress/PLAN_GROWTH_AGENT.md §3).
 *
 * A prospect is a business the platform team MIGHT invite. It is not a member,
 * not a rikma and not a provider: nothing here exists on 1lev1 until its owner
 * claims the draft prepared for them through `prepareSignup` (§5).
 *
 * Two rules every shape below keeps:
 *  - every fact has a source (`SourceRef`) — nothing the agent cannot point at;
 *  - verified and suggested are different words (`FieldOrigin`), all the way
 *    to the profile preview.
 */

import type { Stage } from './stages';

export type GrowthLang = 'he' | 'en' | 'ar';
export const GROWTH_LANGS: readonly GrowthLang[] = ['he', 'en', 'ar'];

/** Where a fact came from. `url` is present whenever the source is a page. */
export type SourceKind = 'manual' | 'csv' | 'website' | 'network' | 'places' | 'directory' | 'social';
export const SOURCE_KINDS: readonly SourceKind[] = ['manual', 'csv', 'website', 'network', 'places', 'directory', 'social'];

export interface SourceRef {
  kind: SourceKind;
  /** Free text: the CSV file's name, the directory's name, "phone call". */
  label?: string | null;
  url?: string | null;
  at: string;
  /** The operator who recorded it, for manual and csv sources. */
  by?: string | null;
}

export type Confidence = 'high' | 'medium' | 'low';

/**
 * One statement the research makes about the business. `verified` is set by
 * the server, never by the model: it is true only when `evidence` was found,
 * word for word, in the page that was actually read.
 */
export interface Claim {
  text: string;
  evidence?: string | null;
  sourceUrl?: string | null;
  verified: boolean;
  confidence: Confidence;
}

/** Contact details found in a page — by pattern, never by a model. */
export interface FoundContact {
  kind: 'email' | 'phone';
  value: string;
  sourceUrl: string;
}

export interface Research {
  at: string;
  by: string;
  status: 'done' | 'partial' | 'failed';
  /** Why it is partial or failed, as a stable code (`site:timeout`, `model:unavailable`). */
  problems: string[];
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  contacts: FoundContact[];
  summary: Claim | null;
  services: Claim[];
  products: Claim[];
  coverage: Claim | null;
  categories: string[];
  customers: string[];
  keywords: string[];
  /** Interpretation, always shown as an AI suggestion. */
  whyJoin: string;
  requestsFulfilled: string[];
  collaboration: string;
  complementary: string[];
  missing: string[];
  confidence: Confidence;
}

/** `verified`: from a verified claim or the operator's own record. `suggested`: the model's. `edited`: an operator changed it. */
export type FieldOrigin = 'verified' | 'suggested' | 'edited';

export interface ProfileField<T> {
  value: T;
  origin: FieldOrigin;
}

export interface ProfileDraft {
  title: ProfileField<string>;
  description: ProfileField<string>;
  services: ProfileField<string[]>;
  products: ProfileField<string[]>;
  categories: ProfileField<string[]>;
  keywords: ProfileField<string[]>;
  coverage: ProfileField<string>;
  website: ProfileField<string>;
  social: ProfileField<string[]>;
  capabilities: ProfileField<string[]>;
  /** Operator approval of the draft as the one to show the owner. Not the owner's. */
  approvedAt?: string | null;
  approvedBy?: string | null;
  updatedAt: string;
}

export type OutreachKind = 'friendly' | 'professional' | 'whatsapp' | 'email';
export const OUTREACH_KINDS: readonly OutreachKind[] = ['friendly', 'professional', 'whatsapp', 'email'];

export interface OutreachVariant {
  kind: OutreachKind;
  lang: GrowthLang;
  subject?: string | null;
  body: string;
  origin: 'ai' | 'template' | 'edited';
}

export interface OutreachState {
  generatedAt: string;
  variants: OutreachVariant[];
  /** The one message the operator approved. Approval is not sending. */
  approved?: (OutreachVariant & { approvedAt: string; approvedBy: string }) | null;
}

export interface OnboardingLink {
  preparedAt: string;
  preparedBy: string;
  email: string;
  previewUrl?: string | null;
  manageUrl?: string | null;
  signupUrl?: string | null;
  receiveUrl?: string | null;
  expiresAt: string;
  /** The recipient already had an account: the link hands the draft to it. */
  hasAccount: boolean;
}

export type ContactChannel = 'whatsapp' | 'email' | 'phone' | 'inPerson' | 'other';
export const CONTACT_CHANNELS: readonly ContactChannel[] = ['whatsapp', 'email', 'phone', 'inPerson', 'other'];

export type ResponseKind = 'interested' | 'notNow' | 'declined' | 'doNotContact' | 'noAnswer' | 'question';
export const RESPONSE_KINDS: readonly ResponseKind[] = ['interested', 'notNow', 'declined', 'doNotContact', 'noAnswer', 'question'];

export type ActivityKind =
  | 'created'
  | 'imported'
  | 'edited'
  | 'stage'
  | 'note'
  | 'research'
  | 'profile'
  | 'profileApproved'
  | 'outreachDrafted'
  | 'outreachApproved'
  | 'contacted'
  | 'response'
  | 'followUp'
  | 'onboarding';

export interface Activity {
  id: string;
  at: string;
  by: string | null;
  kind: ActivityKind;
  text?: string | null;
  from?: Stage | null;
  to?: Stage | null;
  channel?: ContactChannel | null;
  response?: ResponseKind | null;
}

export interface Prospect {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  name: string;
  website: string | null;
  /** The business's PUBLIC contact details, each with its own source. */
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  category: string | null;
  services: string[];
  keywords: string[];
  size: string | null;
  notes: string | null;
  lang: GrowthLang;
  /** How the business entered the pipeline. */
  sources: SourceRef[];
  /** Provenance of each operator-entered field (`email`, `phone`, `website`, …). */
  fieldSources: Record<string, SourceRef>;
  /** Normalised identity keys (hashed on the server) — see dedupe.ts. */
  dedupeKeys: string[];
  stage: Stage;
  /** The furthest stage it ever reached, so a decline still counts in the funnel. */
  furthest: Stage;
  stageChangedAt: string;
  followUpAt: string | null;
  nextAction: string | null;
  research: Research | null;
  profile: ProfileDraft | null;
  outreach: OutreachState | null;
  onboarding: OnboardingLink | null;
  activity: Activity[];
}

/** What a list or the dashboard needs — no research body, no message text. */
export interface ProspectSummary {
  id: string;
  name: string;
  website: string | null;
  hasEmail: boolean;
  hasPhone: boolean;
  city: string | null;
  region: string | null;
  country: string | null;
  category: string | null;
  stage: Stage;
  furthest: Stage;
  stageChangedAt: string;
  followUpAt: string | null;
  nextAction: string | null;
  createdAt: string;
  updatedAt: string;
  sourceKinds: SourceKind[];
  researchStatus: Research['status'] | null;
  researchConfidence: Confidence | null;
  verifiedClaims: number;
  totalClaims: number;
  complementary: string[];
  profileApproved: boolean;
  hasProfile: boolean;
  hasOutreach: boolean;
  outreachApproved: boolean;
  hasOnboardingLink: boolean;
  lastActivity: Activity | null;
}

/** The fields an operator types or a CSV row carries. */
export interface ProspectInput {
  name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  category?: string | null;
  services?: string[] | string | null;
  keywords?: string[] | string | null;
  size?: string | null;
  notes?: string | null;
  lang?: string | null;
  sourceKind?: string | null;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
}
