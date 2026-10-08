/**
 * "Paid" means every provider has their part (QA_CONCIERGE_E2E C-19).
 *
 * A wish deal is paid by its customer and split between its providers — directly, part
 * by part, or through one receiver and the rikma's split (C-17). Either way, the money
 * having left her account is not the end of it: a provider who has not received their
 * part has not been paid. So the deal reads "paid" (`Sheirut.moneyTransfered`) only once
 * **each provider** has confirmed, themselves, that they received their part in full —
 * a sovereign self-report, like "the money is with me" on a sale. Nobody confirms it for
 * them, and a provider still waiting simply does not confirm yet (and says so in the
 * deal's chat): there is no "no" to cast.
 *
 * Per deal, never per rikma: the providers are the deal's own BOM line holders (their
 * part = Σ `due` of their lines, `$lib/sheirut/dealDue`), so a rikma selling several
 * products to several customers settles each deal on its own.
 *
 * The confirmations live on the deal itself, `Sheirut.iGotMoney` — one entry per user
 * (`{ users_permissions_user, iGotMoney }`), the component the schema already carried for
 * exactly this and that nothing wrote until now.
 */

export interface PartLineLike {
  providerId: string | null;
  providerName?: string | null;
  due?: number;
  cap?: number;
}

export interface ProviderPart {
  providerId: string;
  name: string;
  /** What the provider is owed on this deal (Σ `due` of their lines). */
  due: number;
  /** What was agreed with them at most (Σ `cap`). */
  cap: number;
}

export interface PartEntry {
  /** The component row's id — kept so a rewrite updates rows instead of replacing them. */
  id?: string;
  userId: string;
  iGotMoney: boolean;
}

export interface PartsState {
  parts: ProviderPart[];
  confirmed: string[];
  pending: string[];
  /** Every provider confirmed — the only state in which the deal reads "paid". */
  allConfirmed: boolean;
}

/** What the deal page shows: each provider's part and who has confirmed it. */
export interface PartsView extends PartsState {
  /** The customer's side is done — her payments cover what she owes (`iTransferMoney`). */
  customerPaid: boolean;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** One row per provider, their lines summed. Lines nobody holds (open gaps) are no one's part yet. */
export function providerParts(lines: PartLineLike[]): ProviderPart[] {
  const by = new Map<string, ProviderPart>();
  for (const l of lines ?? []) {
    if (!l?.providerId) continue;
    const id = String(l.providerId);
    const p = by.get(id) ?? { providerId: id, name: l.providerName ?? '', due: 0, cap: 0 };
    p.due = r2(p.due + (Number(l.due) || 0));
    p.cap = r2(p.cap + (Number(l.cap) || 0));
    if (!p.name && l.providerName) p.name = l.providerName;
    by.set(id, p);
  }
  return [...by.values()];
}

/** `Sheirut.iGotMoney` as Strapi returns it → plain entries. */
export function readPartEntries(raw: any[] | null | undefined): PartEntry[] {
  return (raw ?? [])
    .map((e) => ({
      id: e?.id != null ? String(e.id) : undefined,
      userId: String(e?.users_permissions_user?.data?.id ?? e?.users_permissions_user?.id ?? e?.users_permissions_user ?? ''),
      iGotMoney: e?.iGotMoney === true
    }))
    .filter((e) => e.userId !== '');
}

export function partsState(parts: ProviderPart[], entries: PartEntry[]): PartsState {
  const yes = new Set(entries.filter((e) => e.iGotMoney).map((e) => e.userId));
  const confirmed = parts.filter((p) => yes.has(p.providerId)).map((p) => p.providerId);
  const pending = parts.filter((p) => !yes.has(p.providerId)).map((p) => p.providerId);
  return { parts, confirmed, pending, allConfirmed: parts.length > 0 && pending.length === 0 };
}

/** The entries with `userId`'s confirmation set — one entry per user, other rows untouched. */
export function withPartReceived(entries: PartEntry[], userId: string): PartEntry[] {
  const uid = String(userId);
  const others = entries.filter((e) => e.userId !== uid);
  const mine = entries.find((e) => e.userId === uid);
  return [...others, { ...(mine?.id ? { id: mine.id } : {}), userId: uid, iGotMoney: true }];
}

/** Entries → `ComponentProjectsIGotMoneyInput[]`. */
export function toPartInputs(entries: PartEntry[]) {
  return entries.map((e) => ({
    ...(e.id ? { id: e.id } : {}),
    iGotMoney: e.iGotMoney,
    users_permissions_user: e.userId
  }));
}
