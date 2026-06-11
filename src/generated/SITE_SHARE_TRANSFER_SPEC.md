# Site-Share Cross-Rikma Transfer — Strapi spec (for 106back)

> What the frontend already does, and the Strapi schema changes needed to make the
> cross-rikma money transfer + dual-project archive clean. Written for the backend
> repo (`106back`). Companion to [docs/PLAN_SITE_SHARE.md](../../docs/PLAN_SITE_SHARE.md).
> Nothing here is required for the current build to run — it degrades to the `note`
> field — but these fields turn the audit string into real, queryable relations.

---

## 0. The model in one paragraph

When a moach split is confirmed (`prPr/whowhat.svelte`), 1💗1 takes a **service
share** of the profit. That share is **deducted from what the partners split** and
routed to the **main rikma** (`Project.isPlatform = true`) two ways:

1. **Income (accounting), in the main rikma** — a `Sale` on the platform's main
   product. *Already implemented:* action `createPlatformSale` → qid
   `206createPlatformSale`.
2. **Physical transfer (tracking), in the giving rikma** — one or more `Haluka`
   records `giver → platform-member`, with both-sides confirmation + chat, exactly
   like `SheirutHalukaCard`. *Already implemented:* created in `whowhat.ask()` and
   **kept out of the Tosplit's `halukas`** so the platform member's confirmation
   never blocks the partners' split from finishing.

The two records are linked today only by a human-readable `Sale.note` string:
`site-share · more · proposed=50 · reason="..." · paid=70 · from_project=12 · halukas=88,89`.
The schema changes below replace that string with real relations.

---

## 1. `api::haluka.haluka` — adjustment + cross-rikma fields

Current fields (confirmed in `STRAPI_SCHEMA_REFERENCE.md`):
`amount, chatre, confirmed, forum, matbea, project, ratson_share, senderconf,
sheirut, tosplit, userrecive, usersend, ushar, want`.

Add:

| field | type | purpose |
|---|---|---|
| `proposedAmount` | Decimal (nullable) | what `computeSiteShare` suggested, before the payer adjusted |
| `adjustDirection` | Enum `['as_is','less','more']` default `as_is` | the payer's choice |
| `adjustReason` | Text (nullable) | required for `less`, optional for `more` (enforced client-side) |
| `autoApproved` | Boolean default `false` | the **adjustment** is accepted without negotiation (PLAN §5). NOT the same as `confirmed` — the physical money still needs both-sides confirmation. |
| `isSiteShare` | Boolean default `false` | marks this Haluka as a platform service-share transfer (so archives/queries can filter) |
| `recive_project` | relation → `api::project.project` (manyToOne) | the **receiving** rikma (the platform). Lets the same Haluka surface in the main rikma's archive without a second record. The existing `project` stays the **giving** rikma. |

> `amount` remains the **final** amount actually transferred; `proposedAmount`
> keeps the original suggestion for reports.

### Why `recive_project`
`Haluka` is `user → user` and has a single `project`. For "documentation in both
projects" we want the transfer visible in the giver's rikma **and** the platform
rikma. `recive_project` gives the second side a relation to query on, instead of
creating a mirror record. (PLAN §2.2 lists this as the future R4 "recive_project".)

---

## 2. `api::sale.sale` — link back to the transfer (optional but clean)

`Sale` already has `note` (used now). To make the income↔transfer link queryable:

| field | type | purpose |
|---|---|---|
| `siteShareHalukas` | relation → `api::haluka.haluka` (oneToMany / manyToMany) | the transfer Haluka(s) this income Sale corresponds to |
| `source_project` | relation → `api::project.project` (manyToOne) | the rikma the share came from (mirror of `Haluka.project`) |
| `isSiteShareIncome` | Boolean default `false` | marks the Sale as platform service-share income (vs. a normal product sale) |

If you'd rather not touch `Sale`, the `note` string already encodes
`from_project` and `halukas=` — keep parsing that and skip this section.

---

## 3. GraphQL the frontend will call once the fields exist

The client currently sends the audit data through `createPlatformSale` params
(`sourceProjectId`, `transferHalukaIds`, `adjustDirection`, `adjustReason`,
`proposedAmount`). When the fields above land, two small upgrades:

1. **Tag the transfer Haluka on creation.** Extend the `createHaluka` input
   (`HalukaInput`) so `whowhat.ask()` can pass, for platform `le` entries:
   ```graphql
   data: {
     usersend, userrecive, amount, matbea, project,        # giving rikma
     recive_project: <platformProjectId>,
     isSiteShare: true,
     proposedAmount: <computed>,
     adjustDirection: <as_is|less|more>,
     adjustReason: <string|null>,
     autoApproved: true,
     confirmed: false                                       # physical transfer still pending
   }
   ```
2. **Persist the link on the income Sale** in `206createPlatformSale` instead of
   stuffing it into `note`:
   ```graphql
   createSale(data: {
     project, users_permissions_user, in, publishedAt,
     isSiteShareIncome: true,
     source_project: <sourceProjectId>,
     siteShareHalukas: <transferHalukaIds>
   })
   ```

No client refactor needed beyond adding these keys — the values are already
computed and passed today.

---

## 4. Auto-approval of the adjustment (PLAN §5) — server note

The adjustment (less/more + reason) is accepted automatically: set
`autoApproved = true` on create. This is **independent** of `confirmed`:

- `autoApproved` = "1💗1 accepts paying this adjusted amount, no negotiation."
- `confirmed` / `senderconf` = "the money actually moved" — still set by the two
  humans via `confirmSheirutHaluka` (sender) and receiver confirmation, surfaced
  by `SheirutHalukaCard`.

So a discount never waits for a platform admin, but the physical transfer is still
tracked end-to-end. No change to `confirmHaluka.ts` is required for the partners'
split, because the site-share Haluka is **not** part of the Tosplit's `halukas`.

---

## 5. Archive display (both rikmot)

With §1–§2 in place, an archive can show the same transfer from both sides:

- **Giving rikma** (`Haluka.project = $idPr`): "שילמנו ל‑1💗1 ₪70 על שירות הניהול"
  → render with `SheirutHalukaCard` (sender = giver, receiver = platform member).
- **Main rikma** (`Haluka.recive_project = platform` **or** `Sale.source_project`):
  "התקבל ₪70 מ‑<rikma> — חלק האתר" → the income `Sale` + the linked Haluka status.

Until the fields land, the same view can be built by parsing `Sale.note`
(`from_project=`, `halukas=`) — functional, just not indexed.

---

## 6. Migration / safety

- All new fields are nullable / default-false ⇒ **zero impact** on existing data
  and on the current build (which uses `note`).
- One rikma has `isPlatform = true`; if none does, `getPlatformProject` returns
  `configured = false` and the whole site-share path is skipped (no transfer, no
  deduction) — verified in `whowhat.platformActive()`.
- Retroactive: applies only to Tosplits created after the flag is on; old splits
  are untouched (PLAN §11.7).

---

## 7. Read / display path — surface the share in the **proposal card** (`/lev`)

> §1–§5 cover *writing* the transfer + linking it to the income Sale. This section
> covers *reading* it back so the haluka **proposal card** (`lev/cards/haluka.svelte`,
> rendered in the `/lev` feed) can show the 1💗1 service line alongside the
> partners — the same way `prPr/whowhat.svelte` shows it in the moach table.
>
> The `/lev` feed is built from one big user query (`83levMainUserQuery`) →
> `extractHalukas` → `processHalukas` → the card. The site-share Haluka is
> deliberately **kept out of `tosplit.halukas`** (§0.2), so the feed currently
> can't see it. We need one relation to surface it under its tosplit **without**
> re-adding it to the gating `halukas` set.

### 7.1 `api::haluka.haluka` — link the transfer to its originating tosplit

The existing `tosplit` relation (whose inverse is `tosplit.halukas`) must **not**
be set on a site-share Haluka — that would put it back in the partners' gating
set. Add a **separate** relation instead:

| field | type | purpose |
|---|---|---|
| `source_tosplit` | relation → `api::tosplit.tosplit` (manyToOne) | the proposal this share was deducted from. Distinct from `tosplit`, so the share Haluka surfaces under the proposal **without** joining `tosplit.halukas` (which gates the partners' confirmation, §0.2). |

Inverse on the tosplit:

| field | type | purpose |
|---|---|---|
| `siteShareHalukas` | relation → `api::haluka.haluka` (oneToMany, inverse of `source_tosplit`) | the platform service-share transfer(s) deducted from this proposal. Read-only convenience for the feed; **not** the same as `halukas`. |

> With this, a proposal carries: `halukas` (partner↔partner, gate confirmation) +
> `siteShareHalukas` (giver→platform, informational). The card sums the latter to
> show "1💗1 — חלק האתר", and reads each one's `confirmed`/`senderconf` for status.

### 7.2 `83levMainUserQuery` — fetch the share under each tosplit

Inside the existing `tosplits(filters:{ finished:{ eq:false } }) { data { attributes { … } } }`
block (the partner `hervachti` is already there), add:

```graphql
siteShareHalukas {
  data {
    id
    attributes {
      amount
      confirmed
      senderconf
      proposedAmount          # §1 — original suggestion (reports)
      adjustDirection         # §1 — as_is | less | more
      adjustReason            # §1
      usersend   { data { id } }
      userrecive { data { id } }
      recive_project {        # §1 — the platform rikma (for logo/name/link)
        data { id attributes { projectName profilePic { data { attributes { url } } } } }
      }
    }
  }
}
```

Until §7.1 lands this selection is a GraphQL error, so it is **gated**: the
frontend only adds it to the query when `SITE_SHARE_FLAGS.crossRikmaFields` is on
(default **off**). With the flag off the feed is byte-for-byte unchanged and the
card shows no platform row (graceful no-op). See §9.

### 7.3 Platform identity for the card (logo + name + public link)

The card brands the share row with the **main rikma**'s real identity and links to
its public page `/project/<platformProjectId>`. Extend `205getPlatformProject` to
return the logo + name (it already returns `projectName` + `user_1s`):

```graphql
projects(filters: { isPlatform: { eq: true } }, pagination: { limit: 1 }) {
  data { id attributes {
    projectName
    profilePic { data { attributes { url } } }   # ← add
    user_1s { data { id } }
  } }
}
```

This query is **live today** (`isPlatform` already exists in main), so the
identity (id, name, logo, treasury member) resolves immediately — only the
per-proposal *amount* waits on §7.1/§7.2.

---

## 8. Frontend wiring summary (already in this repo, behind the flag)

| layer | file | change |
|---|---|---|
| identity resolve | `getPlatformProject.ts` / qid `205` | also returns `projectName`, `logoUrl` |
| identity store | `lib/stores/platformStore.ts` | one global `{ configured, projectId, projectName, logoUrl, treasuryUserId }`, resolved once on `/lev` init |
| store type | `levStores.ts` `HalukaData` | `siteShare?: { amount; confirmed; senderconf; … }` |
| extractor | `levDataExtractors.ts` `extractHalukas` | sums `tosplit.siteShareHalukas?.data ?? []` → `siteShare` (defensive: `undefined` when absent) |
| processor | `levProcessors.ts` `processHalukas` | passes `siteShare` through to the display item |
| card | `lev/cards/haluka.svelte` | renders the 1💗1 row (table + mobile) from `siteShare` + the platform store, linking `/project/<id>` |
| write tag | `prPr/whowhat.svelte` `ask()` | tags the platform transfer Halukas (`isSiteShare`, `recive_project`, `source_tosplit`, `proposedAmount`, `adjustDirection`, `adjustReason`, `autoApproved`) — gated by `SITE_SHARE_FLAGS.crossRikmaFields` |

## 9. The `crossRikmaFields` flag

`SITE_SHARE_FLAGS.crossRikmaFields` (config.ts, default **false**) is the single
switch for the §1/§7 schema. While **false**: no new fields are sent to
`createHaluka`, the lev query omits `siteShareHalukas`, and the card shows no
platform row — i.e. **zero regression** on a build whose Strapi lacks the fields.
Flip it to **true** once 106back ships §1 + §7.1. The platform *identity* (§7.3)
is independent of this flag and works now.
