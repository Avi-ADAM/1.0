# PLAN — Translating user-generated content (תרגום תוכן משתמשים)

Status: **P0 complete (app *and* backend); P1 shipped; P2 shipped, off by
default; P3 shipped, off by default; P4 — §7.1's public surfaces are in
(missions, resources, rikmot, products: every directory and every entity page
except `/gift/[id]`), each with its backfill walker; `/demand` and §7.2–7.6 are
not; P5 and P6 not started.**

> **P3 — §15, "guests read translations" — is in.** A guest still cannot *buy*
> a translation, deliberately (§15.2: an anonymous public page is what a
> crawler walks). What changed is that the cache is now filled before they
> arrive: `/api/cron/translate-backfill` walks the public corpus a page at a
> time, spends only what the governor allows, stops clean when the budget is
> gone and resumes from its cursor tomorrow — and a fourth scheduler job runs
> it daily. Its free half, identity rows, needs no API key and no request at
> all.
>
> It is **inert until an operator turns it on**, and the switches are the ones
> P2 already had plus one: `TRANSLATE_SURFACES` (which surfaces read the cache
> at all), `TRANSLATE_WRITE` + a Gemini key (whether anything may be bought),
> and `TRANSLATE_STATE_DIR` (where the cursor, the day counter and the guest
> demand log live). With `TRANSLATE_STATE_DIR` unset the worker still runs, it
> just starts from page 1 every time and cannot see guest demand. See §13.

The manifest, the glossary, normalization/detection, the batched cache read, the
`<Translated>` component, the `translated` namespace in all five locales, the
`/me` preference and `npm run check:translatable` are all in the codebase and
tested.

The backend half of P0 is done too, as of 2026-09-08. The Strapi
`text-translation` collection (source in `1.0b` on `shabab`,
`src/api/text-translation/`, with the `hash` index declared in its schema) is
deployed, both permission grants are in place, `UsersPermissionsUser.autoTranslate`
exists, and the frontend types are regenerated. Qid `312translationsByHash`
returns a real, empty cache read against the live instance instead of failing
soft — so the "[translation] cache read failed" line is gone and every string is
now an honest **miss** rather than an error. See
[`STRAPI_TEXT_TRANSLATION_SETUP.md`](./STRAPI_TEXT_TRANSLATION_SETUP.md) for what
was checked.

**As of 2026-09-09 the write path exists too** — the engine adapter, the quota
governor, the output validator, `/api/translate/warm`, the `cacheTranslations`
action, and the read wired into `/availableMission`. All of it is **inert until
two environment variables are set**, and with them unset the site behaves
exactly as it did before P2: no query, no request, no spend, the author's own
words in every language. See §13 for how to turn it on and what to watch.

**As of 2026-09-10 the cache fills itself** — the backfill worker, its cursor,
the guest demand log and the daily scheduler job. §15 records what shipped and
the three places it deviates from §8. **No backend change was needed**: the
demand log is a file beside the governor's day counter, not the new Strapi
collection §15.3 was leaning toward, and §15.3 says why that turned out to be
the better answer rather than the cheaper one.

Where the shipped code deviates from what is written below, the deviation is
noted inline as **shipped as:**.

---

## 1. Why

The site speaks five languages (`he · en · ar · ru · es`) at two of the three
layers it needs to:

| layer | what it is | state |
|---|---|---|
| **T1 — UI chrome** | every `$t('ns.key')` string | **done.** `src/lib/translations/<locale>/<ns>.json`, generated loader table, `npm run check:i18n` |
| **T2 — shared catalog** | skills, values, roles, work-ways, missions, countries | **done.** Strapi i18n `localizations`, read through `oneLangAdj` / `langAdjast` and the `localizations { … }` sub-selections already baked into the qids |
| **T3 — user content** | project names and descriptions, open-mission names/`descrip`/`hearotMeyuchadot`, user `bio`/`city`, product names and descriptions, forum messages, negotiation claims | **nothing.** Rendered raw, in whatever language the author typed |

> **Do not confuse the two endpoints.** `/api/translations` already exists and
> belongs to **T2**: it auto-localizes a *catalog* row (a skill, a role) through
> Strapi's own `localizations`, with Groq. It is not the T3 path and must not be
> extended into one — a `Skill` is a curated row we own, a member's project
> description is not.

The consequence today: a Spanish speaker lands on `/availableMission` and sees a
wall of Hebrew. Every marketing, SEO and onboarding investment stops at the
first row of real content. T3 is now the whole gap.

**What "solved" looks like**, and it is the convention every large platform
converged on for a reason — it is honest about provenance and it is cheap:

```
Development of a booking site for a community clinic
תורגם מעברית · הצג מקור            ← muted, small, one line
```

The translation is what you read; the fact that it *is* a translation is stated;
the original is one tap away and never destroyed.

**The cost constraint is the design constraint.** Translating everything, up
front, on every write, into five languages, through a paid API, is not on the
table. So:

1. translate **when a human is actually about to read it** in a language that
   is not the author's;
2. **store the result** so the same sentence is never bought twice;
3. run a **budgeted backfill worker** against a free Gemini key that eats the
   quota quantum by quantum, day after day, until everything worth translating
   is already in the cache before anyone asks for it.

(3) is what eventually makes (1) almost never fire.

---

## 2. Storage — a content-addressed cache, *not* Strapi localizations

### 2.1 Why not reuse `localizations`

T2 uses Strapi's own i18n and it is right for T2: a `Skill` is a small, curated
row with few relations, edited by us, and its Hebrew and English versions are
genuinely two first-class rows.

Applying the same mechanism to T3 breaks in four ways:

- **The relation graph forks.** `OpenMission` has ~45 relations. A localized
  copy is a *separate entity with its own id*; five locales means five rows that
  each need `project`, `skills`, `asks`, `timegrama`… wired up, and every write
  path in the app would have to keep all five in sync. That is not a translation
  feature, it is a fork of the data model.
- **Staleness is silent.** A user edits `publicDescription`; the four
  localizations keep serving the old text with no signal that they are stale.
- **No reuse.** "פיתוח אתר" as a mission name in 400 rikmot would be translated
  and stored 400 times.
- **Write amplification.** Every UGC create becomes 1 + 5 Strapi writes, on the
  critical path of a user action.

### 2.2 The cache

One new Strapi collection, **`text-translation`** (named to not collide with the
existing `Translate` collection, which is the *volunteer translator sign-up
form* — §9.3). It is keyed by the **content of the source string**, not by the
entity it came from:

| field | type | meaning |
|---|---|---|
| `key` | `String` (uid, unique) | `${srcLang}.${tgtLang}.${hash}` — the only lookup key |
| `hash` | `String` (indexed) | first 32 hex of `sha256(normalized source)` — **the column the read path actually filters on**, because the reader does not know the source language; `key` stays the unique constraint |
| `srcLang` | Enum `he\|en\|ar\|ru\|es` | detected or declared source language |
| `tgtLang` | Enum `he\|en\|ar\|ru\|es` | |
| `source` | `Text` | the original — for debugging, human repair, and so backfill never needs the entity again |
| `text` | `Text` | the translation |
| `mode` | Enum `translate\|transliterate` | §4.3 |
| `engine` | Enum `gemini\|human\|identity\|glossary` | |
| `model` | `String` | e.g. `gemini-2.5-flash-lite`, for later re-runs |
| `quality` | Enum `machine\|reviewed` | a human can promote a row; §9.3 |
| `hits` | `Int` | bumped on every miss that was *asked for*; drives backfill priority (§8.2) |
| `firstSeenOn` | `String` (nullable) | `openMission.descrip` — **telemetry only, never a key** |
| `createdAt` / `updatedAt` | | |

Content addressing buys, for free, every property the naive design has to
implement by hand:

- **Reuse across entities.** One row serves every occurrence of that sentence,
  anywhere on the site, forever.
- **Invalidation, by not existing.** Editing the source text changes the hash,
  so the edit *misses the cache* and the stale row is simply never looked up
  again. There is no invalidation code to get wrong. (A GC job can drop rows
  with `hits = 0` and `updatedAt` older than a year — optional, §8.4.)
- **The entity graph is untouched.** No new relations, no forked rows, no
  migration of existing content. Deleting the whole collection returns the site
  to exactly today's behaviour.

**Identity rows matter.** When the detected source language equals the target,
store a row with `engine:'identity'` and `text = source`. That is the *most
common case on the site* (an English project description shown to an English
reader), and without it every such render is a permanent cache miss that keeps
re-asking the quota governor forever.

> ⚠️ From experience in this repo: a new Strapi collection needs **two**
> permission grants — the `Authenticated` role *and* the API token — and
> `npm run validate:qids` only checks mutations, so a bad field in a *query*
> ships silently. Grant both, and add the new qids to the validator's path.

### 2.3 Normalization (pure, tested)

`normalizeForHash(s)` — trim, collapse internal whitespace, NFC-normalize
Unicode, strip a trailing period-only difference? **No**: keep it minimal and
*idempotent*, because two different normalizations mean two cache rows.

```
trim → NFC → collapse /\s+/ to a single space
```

That is all. Property test: `normalize(normalize(x)) === normalize(x)`, and
`hash` is stable across Node versions and platforms.

---

## 3. What is translatable — one manifest, three consumers

`src/lib/translation/fields.js` is the single source of truth:

> **shipped as:** `fields.js`, not `.ts`. `scripts/check-translatable.mjs` is a
> dependency-free node script and imports the real module rather than re-parsing
> it — which is the only way a manifest and its checker cannot drift — exactly
> as `check-i18n-routes.mjs` imports `translations/routes.js`. JSDoc carries the
> same types into app code.


```ts
export const TRANSLATABLE = {
  project: {
    entity: 'Project',
    fields: {
      projectName:       { mode: 'translate',      max: 120 },
      publicDescription: { mode: 'translate',      max: 1200 },
      // githublink / twiterlink / linkToWebsite: never
    }
  },
  openMission: {
    entity: 'OpenMission',
    fields: {
      name:              { mode: 'translate', max: 160 },
      descrip:           { mode: 'translate', max: 1200 },
      hearotMeyuchadot:  { mode: 'translate', max: 600 }
    }
  },
  user: {
    entity: 'UsersPermissionsUser',
    fields: {
      username: { mode: 'transliterate', max: 60 },   // §4.3 — a name is not translated
      bio:      { mode: 'translate',     max: 800 },
      city:     { mode: 'transliterate', max: 60 }
    }
  },
  // openMashaabim, matanot (products), forum message, decision claim, ratson…
} as const;
```

Three consumers, one manifest:

1. **the runtime collector** — what a loader hands to the cache reader;
2. **the backfill walker** — what it enumerates (§8);
3. **`npm run check:translatable`** — asserts every `entity.field` named here
   still exists in `src/generated/STRAPI_SCHEMA_REFERENCE.md`, so a Strapi
   rename fails CI instead of silently disabling a surface. Same discipline as
   `validate:qids` and `check:i18n`.

**Never translatable, enforced in code, not by convention:** URLs, emails, phone
numbers, currency amounts, ids, `note` strings with machine structure (the
site-share `note` — parse it with `parseSiteShareNote`, then translate the
*rendered* label through `$t()`, never the raw string), and any field already
covered by `$t()`.

> **The inverse regression to watch for:** a developer routing UI text through
> the UGC translator to avoid adding a JSON key. That would make chrome text
> non-deterministic, unreviewable, and billed. `$t()` remains the only path for
> anything the platform itself says.

---

## 4. The read path

### 4.1 Never on the SSR critical path

Hard rule: **a page load never waits on a translation API.** A cold page must
not be slower because it is being read in Russian, and a crawler must not be
able to burn the day's quota by walking `/availableMission`.

```
load()
  ├─ collect translatable strings from the data it already fetched
  ├─ hash them, one batched cache read  (qid, ~1 query, no LLM)
  ├─ hits    → attach translations to the payload
  └─ misses  → render the SOURCE, and hand the client the miss list
```

The client then fires one fire-and-forget `POST /api/translate/warm` with the
miss hashes. The queue (§5) fills them; the reader sees them on the next
navigation, or the component swaps them in when the warm call resolves.

**One exception, deliberately narrow:** the *focused* object — the single
project / mission / product whose own page the user opened — may `await` the
translation with a hard timeout (~1.5 s) and fall back to source on timeout.
That is the one string where waiting is better than not reading it. Lists never
await.

### 4.2 `<Translated>` — the component

```svelte
<Translated text={project.publicDescription} from={t.srcLang} translated={t.text} />
```

renders:

- the translation when there is one and the user's preference allows it;
- the source otherwise;
- beneath it, when it *is* a translation, one muted line:
  `$t('translated.from', { lang: $t('lang.' + srcLang) })` · a `הצג מקור` /
  `Show original` toggle;
- `dir="auto"` on the text node — an LTR translation inside an RTL page (and
  vice versa) reorders the whole run without it;
- the toggle choice is remembered per user (localStorage; §4.4).

New namespace `src/lib/translations/<locale>/translated.json` — five keys
(`from`, `showOriginal`, `showTranslation`, `machineNotice`, `pending`). It is
used on nearly every route, so it loads **globally** (not in `ROUTED`).

### 4.3 Translate vs transliterate — names are not sentences

`בָּרוּךְ` must not become `Blessed`. `Хлеб` must not become `Bread`. A display
name, a city, and a brand are **transliterated** (rendered in the reader's
script so they can pronounce it), never semantically translated, and the
convention should be `Baruch (בָּרוּךְ)` — the transliteration with the original
in parentheses on first display — so a name stays findable.

This is why `mode` is a field on both the manifest and the cache row: the same
source string can legitimately have two different outputs.

Anything the user did not choose to write as prose — a project *name* is a
borderline case. Recommendation: `projectName` is **translated**, because on
this site it is usually descriptive Hebrew prose ("רקמת פיתוח קהילתי"), not a
brand. Make it configurable per project later if brands complain (`Project.
nameIsBrand: boolean`), not now.

### 4.4 The user preference

`off | onDemand (default) | always` — stored in localStorage immediately, and
mirrored to a new `UsersPermissionsUser.autoTranslate` enum so it follows the
account across devices. Exposed in `/me`.

`off` means the read path skips the cache read entirely — zero added queries for
users who do not want it.

> **shipped as:** localStorage is read synchronously at import (the first paint
> must not render the wrong text and then swap it), and the account copy is a
> debounced, silent mirror through `updateUserBasic` — not a second write path
> of its own. On a device that has never chosen, `adoptFromProfile()` takes the
> account's answer; on a device that has, the local choice wins. Which way that
> conflict resolves is a real decision, not an accident: a preference the reader
> set on the phone in their hand should not be silently reversed by a profile
> they changed on a laptop last month.

---

## 5. The write path — the Gemini adapter and the quota governor

### 5.1 One call fills **all five locales**

The free tier's binding constraint is **requests per minute and per day**, not
tokens. Therefore:

> A single request translates *N source strings* into *all target locales at
> once* and returns strict JSON.

Filling five locales in one request instead of five costs ~5× output tokens and
saves 5× the scarce resource. This applies to the on-demand path too, not just
the backfill — when a Spanish reader triggers a miss, we buy Arabic, Russian,
English and Hebrew in the same breath, because the request has already been
spent.

Request shape (one call, `responseMimeType: 'application/json'`, a response
schema so the model cannot free-form):

```jsonc
// in
{ "srcHint": "auto", "targets": ["he","en","ar","ru","es"],
  "glossary": [...],                       // §6
  "items": [ { "id": "a1f0…", "mode": "translate", "text": "…" }, … ] }
// out
{ "items": [ { "id": "a1f0…", "detected": "he",
               "out": { "en": "…", "ar": "…", "ru": "…", "es": "…" } } ] }
```

`detected` is stored as `srcLang` — that is what powers the honest "תורגם
מעברית" label. When `detected` is in `targets`, an `identity` row is written for
that pair (§2.2).

### 5.2 Pacing — reuse what is already proven here

`src/lib/embed/gemini-embeddings.ts` already solved this for embeddings:
`CONCURRENT`, `DELAY_MS`, `RATE_LIMIT`, `RATE_LIMIT_MS`, with a 61 s pause every
`RATE_LIMIT` requests. `src/lib/server/translation/gemini.ts` follows the same
shape rather than inventing a second pacing strategy, and both get their numbers
from env instead of literals:

| env | default | meaning |
|---|---|---|
| `TRANSLATE_MODEL` | `gemini-2.5-flash-lite` | cheapest model that handles he/ar reliably |
| `TRANSLATE_RPM` | conservative | requests per minute ceiling |
| `TRANSLATE_RPD` | conservative | requests per day ceiling (the governor's budget) |
| `TRANSLATE_BATCH` | 25 | source strings per request |
| `GEMINI_API_KEY` / `GOOGLE_API` | — | already read this way by the embeddings module |

Free-tier RPM/RPD numbers drift; **do not hardcode them.** Ship conservative
defaults, log the 429s, tune the env.

### 5.3 The governor

`src/lib/server/translation/governor.ts` — pure, tested, and the only thing
allowed to say "yes, spend a request":

- a rolling per-minute window and a per-day counter (persisted, so a restart
  does not reset the day);
- on-demand traffic gets a reserved slice of the daily budget (say 30 %) that
  backfill can never eat — otherwise a backfill run makes the live site's misses
  un-fillable all day;
- per-user rate limit on `/api/translate/warm`, so one client cannot drain it;
- when the budget is gone, the answer is "no" and the site simply renders
  source. Degradation is invisible, never an error.

### 5.4 Writes go through the Action System

Per `CLAUDE.md`, all writes go through the Unified Action System. Two configs in
`src/lib/server/actions/configs/`:

- **`cacheTranslations`** — upsert a batch of rows. `access` restricted to the
  service principal; an API key must not be able to write the cache.
- **`reviewTranslation`** — promote a row to `quality:'reviewed'` with human
  text (§9.3).

`/api/translate/warm` is a thin endpoint that validates, consults the governor,
calls Gemini, and executes `cacheTranslations` with `isSer:true` — the same
shape `/api/cron/maagad/+server.js` already uses.

### 5.5 Validate before you store

A model response is untrusted input. Before a row is written:

1. **JSON-schema shape check** — reject the whole batch on a malformed response
   rather than storing half of it;
2. **mixed-script check** — reuse the logic in `scripts/check-mixed-script.mjs`
   as a runtime validator. A Cyrillic `г` inside a Hebrew word is exactly the
   failure mode LLM output produces, it renders as garbage, it reorders the RTL
   run, and nothing else on the site would catch it;
3. **glossary enforcement** (§6);
4. **length sanity** — an output more than ~3× the source length is a
   hallucination, not a translation;
5. **no markup injection** — the source is plain text; strip anything that came
   back with tags.

A row that fails validation is not stored and not retried in the same run. The
site renders source. That is the whole failure mode.

---

## 6. The glossary — the thing that makes this not embarrassing

Machine-translating this site without a glossary turns **רקמה** into *tissue*,
**מוח** into *brain*, **לב** into *heart*, and **חלוקה** into *division*. Those
are the platform's core nouns; getting them wrong is worse than not translating.

`src/lib/translation/glossary.ts` holds the canonical rendering of each domain
term per locale:

| he | en | ar | ru | es |
|---|---|---|---|---|
| רקמה | rikma (partnership) | … | … | … |
| מוח | moach (project hub) | … | … | … |
| לב | lev (heart / feed) | … | … | … |
| חלוקה | haluka (profit split) | … | … | … |
| משאב | resource | … | … | … |
| 1lev1 | 1lev1 *(never translated)* | 1lev1 | 1lev1 | 1lev1 |

It is used twice: injected into the prompt as a constraint, **and** checked
post-hoc — if a source contained a glossary term and the output does not contain
its canonical rendering, the row is rejected. Prompts suggest; the check decides.

Because it is a table of canonical renderings, it doubles as the reference for
human translators and for T1 JSON authors. It should be the same file both read.

---

## 7. Where it shows up — surface rollout order

Ordered by (readers reached) ÷ (integration cost):

1. **Public discovery** — `/availableMission`, `/availiableResorce`, `/project`,
   `/demand`, `/gift`. Highest reader count, all anonymous, all SEO-adjacent.
2. **Lev cards** — the feed a logged-in user reads every day. Note the card
   conventions in `docs/LEV_CARD_CONVENTIONS.md`; `<Translated>` must not break
   the coins/list/cards view modes (`levView`).
3. **Project / moach pages** — descriptions, mission names, product names.
4. **Profiles** — `bio`, `city`, `username` (transliterated).
5. **Forum / chat messages** — highest volume, lowest value per string.
   Deliberately last, and probably **on-demand only, never backfilled**, with a
   per-message "translate" button rather than automatic translation.
6. **Outgoing mail** (`src/lib/components/mail/*`) — the builders already
   assemble per-recipient-language payloads, but the UGC inside them (a project
   name, a mission description) goes out raw today. The mail path reads the
   cache **only** — a send never blocks on and never triggers a Gemini call.

---

## 8. The backfill worker — "quantum after quantum"

> **This is P3, and §15 is the version of it that shipped.** The worker
> described here is the mechanism; §15 states what it is *for* — a guest, who
> cannot warm the cache and never will — and what that added to it:
> public-surface-first ordering, a demand log that can see guest misses, and
> free identity rows first. **Read §15 alongside this section**, and the
> "shipped as" notes under §11 for the three places the implementation
> deliberately differs from the sketch below.

The flags are as promised, on
`src/lib/jobs/backfill-translations.ts`; the work itself runs in
`/api/cron/translate-backfill` (§11's deviation 1 — one governor, one write
path), and this drives it the way the scheduler drives `/api/monthi`.

```bash
npx tsx src/lib/jobs/backfill-translations.ts --status       # what's left, what it'd cost
npx tsx src/lib/jobs/backfill-translations.ts --dry          # decide out loud, spend nothing
npx tsx src/lib/jobs/backfill-translations.ts --budget 400   # spend at most 400 requests, then stop clean
npx tsx src/lib/jobs/backfill-translations.ts --only openMission
npx tsx src/lib/jobs/backfill-translations.ts --locales ru,es
```

### 8.1 Resumable, budget-bounded, idempotent

`cursor.json` in `TRANSLATE_STATE_DIR` (same spirit as `.embed-cache/`, and the
same directory the governor's day counter already uses) holds a per-source
cursor. The run stops **cleanly** the moment the budget is exhausted — that is
the point. Tomorrow's run picks up the cursor and continues. Weeks of free
quota, one quantum a day, and the corpus is covered without a single paid call.

Everything is idempotent: a string already in the cache is skipped before the
governor is consulted, so re-running costs nothing.

**The cursor wraps rather than finishing.** A walk that reached the end of the
corpus starts again at page 1 and counts a pass. That is not busywork: the
corpus grows, and an *edited* description is a new string (content addressing,
§2.2), so a worker that finished once and never looked again would leave every
future mission untranslated until somebody remembered to reset it. A wrapped
pass over a covered corpus costs one query per page and no quota.

### 8.2 Priority queue

1. **Guest demand** — somebody actually asked for this and got source text.
   Always first; this is the only class with a real reader waiting. §15.3.3 is
   what makes this tier able to see an anonymous reader at all.
2. **Public / SEO surfaces** — promoted to tier 1 of the *walk* and defined in
   `backfillSources.ts` (§15.3.2). Everything a signed-in reader sees waits.
3. **Recently active rikmot** — the corpus query sorts `createdAt:desc`, so a
   fresh pass reaches new rows first. Recency of the parent entity's
   `updatedAt` is a refinement nobody has needed yet.
4. **Everything else**, as the walk reaches it.

Within a tier, pack `TRANSLATE_BATCH` strings per request and always fill all
five locales (§5.1).

### 8.3 Scheduling it

It is a fourth job in `scripts/scheduler/` next to `timegrama`, `monthi` and
`maagad` — daily at 05:00, budget-bounded, safe to run more often than needed
(it self-skips). One clock; do not invent a second.

### 8.4 Optional GC

A monthly pass dropping `quality:'machine'` rows with `hits = 0` and
`updatedAt` older than a year keeps the collection from growing without bound
after years of edits. Never touches `quality:'reviewed'`.

---

## 9. Quality, honesty, and the human loop

### 9.1 Always label it

Machine translation is never presented as the author's words. The provenance
line is not optional and not behind a setting. `quality:'reviewed'` rows may
drop the "machine" wording but still say what language they came from.

### 9.2 SEO — be careful here

Machine-translated content emitted as indexable page content is a real
duplicate-content and quality risk, and this repo already has a carefully
ordered head (`docs`/`src/app.html`, see the SEO head-order note: fallbacks go
**after** `%sveltekit.head%`, canonical is the bare path for `he` and `?lang=xx`
otherwise).

Recommendation:

- **Do** render translations in the visible page for the reader.
- **Do not** emit machine-translated `<title>` / `<meta description>` /
  JSON-LD (`src/lib/seo/jsonLd.js`) unless `quality:'reviewed'`. Keep the
  source-language metadata and let `hreflang` do its job.
- Revisit once there is a meaningful body of reviewed rows.

### 9.3 The human loop — and the collection that was already waiting for it

The existing **`Translate`** collection (`amort`, `amorts`, `amortt`, `amortf`,
`amorth`, `lang`, `from`, `name`, `email`, `notes`, created via qid
`282createTranslate`) is a *volunteer translator sign-up form*. It has been
sitting there without a pipeline to feed.

This is that pipeline: volunteers who signed up there become the reviewers who
promote `machine` rows to `reviewed` through `reviewTranslation`, in their own
language. An admin surface listing the highest-`hits` machine rows per locale is
the minimum viable review queue. A reviewed row is never overwritten by a
machine run.

---

## 10. Modules and tests

```
src/lib/translation/            # pure, shared client+server
  fields.ts                     # the manifest (§3)
  glossary.ts                   # canonical domain terms (§6)
  normalize.ts                  # normalizeForHash + hashSource
  detect.ts                     # cheap script-based language guess
  types.ts
src/lib/server/translation/
  gemini.ts                     # the adapter — batch, all-locales, JSON schema
  governor.ts                   # RPM/RPD budget, reserved on-demand slice
  validate.ts                   # shape, mixed-script, glossary, length
  store.ts                      # cache read (qid) + write (action)
src/lib/components/ui/Translated.svelte
src/routes/api/translate/warm/+server.js
src/lib/server/actions/configs/cacheTranslations.ts
src/lib/server/actions/configs/reviewTranslation.ts
src/lib/jobs/backfill-translations.ts
scripts/check-translatable.mjs
```

Everything above the adapter is pure and unit-tested. Specifically:

- `normalize.test.ts` + a **pbt** (`fast-check`): idempotence, hash stability,
  and "different visible text ⇒ different hash".
- `detect.test.ts` — Hebrew/Arabic/Cyrillic/Latin blocks, mixed strings, and the
  strings that must return `unknown` rather than guess.
- `governor.test.ts` — the day boundary, the reserved slice, restart
  persistence, and that "budget gone" returns *no* rather than throwing.
- `validate.test.ts` — a real mixed-script sample (`מפгש`), a glossary
  violation, a 5× length hallucination.
- `gemini.test.ts` — against a fake transport; never hits the network.
- `check-translatable.mjs` — asserts the manifest against the generated schema.

---

## 11. Phases

Each phase is shippable and reversible on its own.

| phase | scope | cost | risk |
|---|---|---|---|
| **P0** ✅ | Strapi `text-translation` collection (+ **both** permission grants), qids, `fields.js`, `glossary.ts`, `normalize`/`detect`, `check:translatable`, tests | zero | none — nothing reads it yet |
| **P1** ✅ | Read path only: batched cache read, `<Translated>`, `translated` namespace ×5, the `/me` preference. **No Gemini adapter at all** — every string is a miss and renders source, exactly as today | zero | zero API spend by construction; the component is provably correct before a single request is bought |
| **P2** ✅ | Write path: `gemini.ts`, `governor.ts`, `validate.ts`, `/api/translate/warm`, `cacheTranslations`. Enable on **one** surface (`/availableMission`) behind an env flag | bounded by `TRANSLATE_RPD` | measurable on one route before it is everywhere |
| **P3 — guests read translations** ✅ | The whole point of the feature, and the one class of reader it did not serve. The backfill worker + cursor file + priority queue, driven **public-surface-first**, plus the guest demand log that makes its priority queue work at all, plus the daily scheduler job. See §15 | free quota only | budget-bounded and idempotent; identity rows cost nothing at all |
| **P4** ◐ | Surface rollout in the order of §7 (chat last, on-demand only). **§7.1 is in except `/demand` and `/gift/[id]`** — seven surfaces, each fed by a backfill walker; `missionDetail` was the first to translate a *rich-text* field (§12), `projectDetail` the second. §7.2–7.6 are not. See §17 | cache hits, mostly | |
| **P5** | Human loop: review queue, `reviewTranslation`, wire the `Translate` volunteers in; revisit the SEO decision in §9.2 | human time | |
| **P6** | Block-by-block rich text: keep bold, links and lists through a translation instead of flattening them. See §16 | one row per block instead of one per field | contained — the flat path stays the fallback |

Suggested first commit: **P0 + P1 together.** It makes the whole site
translation-aware, with the provenance UI in place, at literally zero API cost —
and if the answer to "is this worth it" turns out to be no, deleting one
component and one collection undoes it completely.

### What P0 + P1 actually put in the tree

| file | what it is |
|---|---|
| `src/lib/translation/fields.js` | the manifest (§3), 11 fields across 5 entities |
| `src/lib/translation/glossary.ts` | canonical renderings of the domain nouns (§6), plus the post-hoc violation check P2 will use |
| `src/lib/translation/normalize.ts` | `normalizeForHash`, `hashSource`, `cacheKey`, `isWorthTranslating` (§2.3) |
| `src/lib/translation/sha256.ts` | a synchronous SHA-256 — the loader and the browser must compute the same key, and `crypto.subtle` is async |
| `src/lib/translation/detect.ts` | the cheap script/stop-word guess that makes identity rows possible (§2.2) |
| `src/lib/translation/collect.ts` | the runtime collector — turns already-fetched data into deduplicated hashes (§4.1) |
| `src/lib/server/translation/store.ts` | the batched, fail-soft cache read. Read only |
| `src/lib/components/ui/Translated.svelte` | the provenance UI (§4.2) |
| `src/lib/translations/<locale>/translated.json` | the new namespace, ×5, loaded globally |
| `src/lib/stores/autoTranslate.js` | the reader preference and the show-original toggle (§4.4), plus the debounced mirror to the account |
| `src/routes/api/send/qids.js` | `312translationsByHash` — the one query the read path may make; `meProfile` also selects `autoTranslate` |
| `src/lib/server/actions/configs/updateUserBasic.ts` | the single write path for `autoTranslate` (§4.4) |
| `scripts/check-translatable.mjs` | `npm run check:translatable` |
| `1.0b`: `src/api/text-translation/` | the cache collection itself (§2.2), `hash` index declared in its schema |

### What P2 added

| file | what it is |
|---|---|
| `src/lib/translation/mixedScript.js` | the corrupted-word rule (§5.5), **shared** with `npm run check:script` rather than copied — the walker stayed in `scripts/`, the rule moved here |
| `src/lib/server/translation/config.ts` | every dial, read from `$env/dynamic/private`, defaulting to **off** (§13) |
| `src/lib/server/translation/governor.ts` | the RPM/RPD budget and the reserved on-demand slice (§5.3) |
| `src/lib/server/translation/governorStore.ts` | its optional file-backed day counter — opt-in via `TRANSLATE_STATE_DIR` |
| `src/lib/server/translation/validate.ts` | shape, mixed-script, glossary, length, markup, target-script (§5.5) |
| `src/lib/server/translation/gemini.ts` | the adapter: one request, all five locales, strict JSON schema (§5.1) |
| `src/lib/server/translation/fill.ts` | engine answer → cache rows, including the identity rows (§2.2) |
| `src/lib/server/translation/rateLimit.ts` | the per-caller limiter on the warm endpoint (§5.3) |
| `src/lib/server/translation/surfaces.ts` | the per-surface read wiring, and the one place P4 grows |
| `src/lib/server/actions/configs/cacheTranslations.ts` | the only door into the cache; `access: ['serviceAdmin']` |
| `src/routes/api/translate/warm/+server.ts` | the on-demand fill endpoint |
| `src/lib/translation/warm.js` | the client's fire-and-forget call |
| `src/lib/components/ui/TranslatedNote.svelte` | the provenance line, split out of `<Translated>` |
| `src/routes/api/send/qids.js` | `313translationsByKeys`, `314createTextTranslation` — both `serviceAdmin`-only in `qidsAccess.js` |
| `src/routes/(regandnon)/availableMission/` | the first surface actually reading the cache |

### What P4 has added so far

| file | what it is |
|---|---|
| `src/lib/translation/richText.js` | `plainForTranslation` — the one flattening of a tiptap field both the loader and the page hash (§12) |
| `src/lib/translation/hits.js` | `isRealTranslation` — an identity row is a cache hit but **not** a translation, and saying otherwise breaks §9.1 (see §15.3) |
| `src/lib/server/translation/surfaces.ts` | `missionDetailGroups` — the mission's own page, full description rather than the card excerpt; then `resourceCardGroups`, `resourceDetailGroups`, `projectCardGroups`, `projectDetailGroups`, `productCardGroups` (§17) |
| `src/routes/(regandnon)/availableMission/[id]/` | the surface: `<Translated>` on the name and the rikma name, the flat-translation / formatted-original swap on `descrip` and `hearotMeyuchadot` |
| `src/lib/translation/pageTranslations.svelte.ts` | the page half of the read path, shared by all seven surfaces: resolve a row, warm for an `always` reader, pick a group's provenance row, decide which text shows (§17.2) |
| `src/routes/(regandnon)/{availiableResorce,project,gift}/` and the `[id]` pages of the first two | the surfaces themselves (§17.1) |
| `src/lib/server/translation/backfillSources.ts` | three more walkers — `openMashaabim`, `project`, `matanot` — each built from the directory's own card normalizer and the loader's own builder; hidden rikmot dropped from all four (§17.3) |
| `src/routes/api/send/qids.js` | `317backfillResources`, `318backfillProjects`, `319backfillProducts` — serviceAdmin-only, each filtered exactly as its public directory is |

### What P3 added

| file | what it is |
|---|---|
| `src/lib/server/translation/demand.ts` | the guest demand log (§15.3.3) — an in-process buffer that spills to `TRANSLATE_STATE_DIR/demand.jsonl`, plus its reader, its per-locale roll-up and its compaction |
| `src/lib/server/translation/backfillSources.ts` | **what a guest can reach**, derived from the loaders rather than guessed (§15.3.2). Every string it produces comes out of the same function the surface uses, which is the only way the walker and the page can hash the same bytes |
| `src/lib/server/translation/backfill.ts` | the worker's decisions — the queue, idempotence, the identity pass, the budget, the cursor. All I/O injected, all of it tested against a fake |
| `src/lib/server/translation/backfillStore.ts` | the cursor on disk, written through a temp file (§8.1) |
| `src/routes/api/cron/translate-backfill/+server.js` | the worker's entry point, and where the I/O is real |
| `src/lib/jobs/backfill-translations.ts` | the hand-run driver §8 asked for: `--status` / `--dry` / `--budget` / `--only` / `--locales` |
| `scripts/scheduler/scheduler.mjs` | the fourth job (§8.3), daily at 05:00, self-skipping |
| `src/routes/api/send/qids.js` | `315backfillMissions` (the corpus, paged, filtered exactly as the public directory filters it) and `316translationCoverage` (which of the five locales each hash already has) — both `serviceAdmin`-only |
| `src/lib/server/translation/surfaces.ts` | records every miss into the demand log — the one place on the site that can see what an anonymous reader wanted and did not get |
| `src/lib/server/actions/configs/cacheTranslations.ts` | identity rows no longer run through the model-output validator; see the deviations below |
| `src/lib/server/discovery/normalizeCards.ts` | `excerptOf` exported, so the walker and the card cannot drift |

Five new test files, 72 new tests; the whole feature is 283 tests across 21
files, and the repo's own checkers (`check:script`, `check:translatable`,
`check:i18n`, `validate:qids`) pass.

**shipped as** — three deviations from §8, each deliberate:

1. **The worker is an endpoint, not `npx tsx`.** §8 sketched a standalone job
   in the shape of `sync-vocabulary.ts`. Two things moved it into the server,
   and both are correctness rather than convenience. **One governor:** §5.3's
   reserved on-demand slice — the thing that stops a backfill run from making
   every live miss un-fillable until midnight — means nothing unless backfill
   and the warm endpoint count against the *same* counter, and a second process
   has a second counter. **One write path:** per CLAUDE.md every write goes
   through the Action System, and `cacheTranslations` is deliberately the only
   door into the cache; a standalone worker would have to duplicate it or route
   around it. `backfill-translations.ts` is still the hand-run driver, with
   every flag §8 promised — it just drives the endpoint, exactly as the
   scheduler already drives `/api/timegrama` and `/api/monthi`.
2. **The demand log is a file, not a collection.** §15.3 left it open between a
   `translation-demand` collection and a placeholder row in `text-translation`,
   leaning toward the collection. It is neither, and the third option is
   strictly better than both: a placeholder row would have to be filtered out
   of every cache read (and a read path that ignores some of its own rows is
   how a half-translated page ships), while a new collection means a Strapi
   deploy and two permission grants before a line of this phase can run — and
   would put a *write* in front of a page render, which §4.1 forbids outright.
   The file sits beside the governor's day counter and accepts exactly the
   limit the governor already accepts: per-instance, opt-in, honest about it.
   Losing a demand line loses *ordering*, never correctness — the string is
   still walked and still filled, just later.
3. **Identity rows skip the output validator.** They have to. There is no model
   in an identity row: the text stored *is* the author's, against the author's
   own language. Running `validateTranslation` over one rejects perfectly good
   rows — a Hebrew source containing an inflected glossary term (`רקמות`,
   `רקמת`) fails the glossary check against the canonical `רקמה` — so exactly
   the corpus that is free to fill would be the corpus that could not be
   stored. What replaces it is a check on the *claim*: an `identity` row whose
   text is not its source, or whose languages differ, is refused, and a
   same-language row that does not declare itself an identity row is refused
   too.

**shipped as** — five deviations from what §§4–8 say above, each deliberate:

1. **`Decision` is a flat interface, not a discriminated union.** The repo
   compiles with `strict: false`, and without `strictNullChecks` TypeScript
   will not narrow a union by a boolean discriminant — `if (!d.ok) d.reason`
   would be an error at every call site. A union nobody can narrow is worse
   than no union: it pushes casts outward.
2. **Only `always` warms.** §4.1 has the client post its miss list
   unconditionally; §4.4 says `onDemand` "never asks for one that does not
   exist". The second is the one that was implemented, because it is the one
   that bounds cost: a reader who has not asked for translations to be *bought*
   does not spend the day's budget by scrolling a public page.
3. **The mission cards hash the rendered `excerpt`, not the raw `descrip`.**
   See the header of `surfaces.ts`. The full description gets its own row on
   the mission's own page in P4; content addressing lets the two coexist at the
   cost of one extra row, and the excerpt row is the one anonymous readers need.
4. **`hits` is 1 or 0, not a counter.** A miss has no row to bump, so §2.2's
   "bumped on every miss that was *asked for*" cannot be implemented without
   inventing a placeholder row. Instead the warm path stamps `hits: 1` on the
   rows it creates and backfill stamps 0, which is the same signal §8.2's first
   tier wants — "somebody actually asked for this" — at zero extra writes. A
   true counter, or a demand log for strings the budget refused, is P3's call.
5. **The preference reaches the server as a plain cookie.** `off` is supposed
   to mean *no query at all*, and that decision is made in `load()`, where
   `localStorage` is invisible. `autoTranslate` is mirrored to a non-httpOnly
   cookie carrying one of three known words; the account field stays the
   durable copy.

---

## 12. Rich text — what the `missionDetail` surface had to decide

The directory translates a *card excerpt*: plain text, already flattened by
`normalizeMissionCard` before the payload leaves the server. A mission's own
page renders `descrip` and `hearotMeyuchadot` as **tiptap HTML**, and that
forced the first real decision about markup.

**The cache stores plain text, so the source has to be flat too.** The output
validator strips markup on purpose (§5.5) — a model handed tags invents more of
them. If the *source* kept its tags, the same sentence would hash differently
depending on whether the author happened to bold a word, and the row the model
returned could never match it. So `src/lib/translation/richText.js` exports one
`plainForTranslation(html)`, imported by **both** the loader (to look the row
up) and the page (to find the row it was handed) — two hashes that have to be
identical byte for byte, from one function that cannot drift.

**The consequence, stated rather than hidden: a translated description is
flat.** Paragraph breaks survive, bold and links do not. The original is one tap
away and comes back as the untouched formatted HTML — `<TranslatedNote>` renders
under the RichText block in both directions — so nothing is destroyed, and a
wall of Hebrew is the worse default for a reader who cannot read it. Preserving
the structure means translating block by block and re-injecting, which is a
bigger feature than this surface needed — **it is now P6, written up in §16**,
and it also lifts the length ceiling below.

**No truncation.** `htmlExcerpt`'s ellipsis is right for a card and wrong here:
a truncated translation beside an untruncated original is a lie about the
author's words. A description longer than the manifest's `max` (1200 for
`descrip`) is simply not translated — `collect()` drops it and the reader sees
the source. Raising that number is the knob until P6 (§16) removes the ceiling
altogether by making a block, not a field, the unit.

**The card row and the page row coexist.** They are different strings, so
different hashes, so two rows for one description. That is content addressing
working as designed, at the cost of one extra row, and it is why opening a
mission from the directory already shows a translated *title* for free: the
directory bought that string, and the name is the same name.

---

## 13. Turning it on

Nothing spends until these are set. Two switches, deliberately separate —
reading a cache someone else filled costs nothing, and it is worth running the
read path for a week before allowing it to buy anything.

| env | default | what it does |
|---|---|---|
| `TRANSLATE_SURFACES` | *(empty — off)* | comma-separated surface keys, or `*`. Today the keys are `availableMission`, `missionDetail`, `availableResource`, `resourceDetail`, `projectDirectory`, `projectDetail` and `productDirectory` (`SURFACE_KEYS` in `config.ts`). Empty ⇒ the read path never runs and the loader returns nothing |
| `TRANSLATE_WRITE` | *(off)* | `1` lets `/api/translate/warm` spend. Also requires `GEMINI_API_KEY` (or `GOOGLE_API`), which is already in `.env` |
| `TRANSLATE_MODEL` | `gemini-2.5-flash-lite` | |
| `TRANSLATE_RPM` | `10` | conservative; these are not Google's numbers, they are numbers that cannot get the key throttled while the feature is proven |
| `TRANSLATE_RPD` | `200` | the day's whole budget |
| `TRANSLATE_BATCH` | `25` | source strings per request |
| `TRANSLATE_ONDEMAND_SHARE` | `0.3` | the slice of `RPD` backfill may never eat |
| `TRANSLATE_WARM_RPM_USER` / `_ANON` | `6` / `2` | per-caller ceiling per minute |
| `TRANSLATE_WARM_MAX_ITEMS` | `25` | strings accepted in one warm call |
| `TRANSLATE_STATE_DIR` | *(empty)* | where the governor's day counter, the backfill cursor and the guest demand log live. Unset ⇒ the counter is per-process, the walk restarts at page 1 every run, and guest demand is not recorded at all |
| `SCHEDULER_BACKFILL_HOUR` | `5` | earliest in the day the scheduler may run the backfill |
| `CRON_SECRET` | *(empty)* | when set, `/api/cron/translate-backfill` requires `?key=` — the same guard `/api/cron/maagad` has |

**The suggested order.** Set `TRANSLATE_SURFACES=availableMission` alone first:
that turns on one extra query per page load and nothing else, and every string
is a miss rendering source text — the page is identical, and the only thing to
watch is the query's latency. Then set `TRANSLATE_STATE_DIR` and run

```bash
npx tsx src/lib/jobs/backfill-translations.ts --status   # changes nothing
npx tsx src/lib/jobs/backfill-translations.ts            # identity rows only
```

With no `TRANSLATE_WRITE` and no key this buys nothing and cannot: it writes
only identity rows, which need no request at all (§15.3.5), and on a
Hebrew-majority corpus that is already most of the misses on the site turning
into hits for free. Only then set `TRANSLATE_WRITE=1` with a low
`TRANSLATE_RPD`, try `--dry`, then `--budget 10`, and read the logs for
`[translation]` and `[translation:backfill]` lines. The daily scheduler job is
the last step, and it is the same endpoint on a clock.

**Three limits to know before turning it on**, all stated rather than hidden:

- **The governor is per-process.** A multi-instance deploy governs per
  instance, so the effective ceiling is `TRANSLATE_RPD × instances`. Set the
  budget accordingly, or move the counter into Strapi when it starts to matter.
- **The warm endpoint accepts text from the client.** It has to: the cache is
  content-addressed, and nothing can turn a hash back into the string it was
  made from. A hostile caller can therefore submit text nobody wrote — what
  that buys them is a translation of their own sentence, stored under its own
  hash, which no page will ever look up. The real cost is quota, and the
  per-caller limiter and the daily budget are what bound it.
- **The backfill is only as useful as `TRANSLATE_SURFACES`.** It fills what the
  enabled surfaces look up and nothing else, because a row no loader will ever
  query is spend with no reader. Turning a new surface on in P4 is therefore
  also what puts its strings in the walker's corpus — the two are one switch on
  purpose, and `--status` prints which surfaces are on and which sources are
  active because of them.

---

## 14. Open questions

1. **`projectName`** — translate as prose, or treat as a brand and only
   transliterate? §4.3 recommends translating, with a per-project override
   deferred. **Shipped as `translate`** (the recommendation), reversible by one
   line in `fields.js`. Still worth confirming before P2 spends anything on it.
2. **Chat / forum messages** — on-demand button only (recommended), or
   automatic like everything else? Volume is high and value per string is low.
3. **Default preference** — `onDemand` for everyone, or `always` for users whose
   `lang` differs from the site's most common content language (Hebrew)?
4. **Reserved on-demand budget share** — 30 % is a guess; it should be tuned once
   there is real miss traffic.
5. **A second engine** — the repo already has `@ai-sdk/google`, `@ai-sdk/groq`
   and `@ai-sdk/openai`. Should the adapter be written against the AI SDK from
   the start (so a Groq free tier can be a second daily quota bucket), or stay a
   direct `fetch` to Gemini like `gemini-embeddings.ts`? Direct fetch is simpler
   and matches what is already proven here; the AI SDK is one abstraction that
   buys a second free quota. Leaning: **direct fetch now, one narrow interface**
   (`translateBatch(items, targets) → results`) so a second engine is a new file
   rather than a refactor.

---

## 15. P3 — guests read translations *(shipped)*

This is the phase the whole feature was justified by. §1 opens on it: *"a
Spanish speaker lands on `/availableMission` and sees a wall of Hebrew."* That
reader is **not signed in**, and before this phase they were the one class of
reader who could never see a translation, on any page, in any language.

### 15.1 Why a guest saw nothing — three facts that composed

1. A guest has no account and no stored preference, so they get the default,
   **`onDemand`**: read the cache, never buy.
2. **Only `always` warms** (§11's deviation 2). That is deliberate and it
   stays, unchanged by this phase: an anonymous public page is exactly what a
   crawler walks, and letting an anonymous caller spend is how a day's budget
   disappears in one crawl of `/availableMission`.
3. Nothing else filled the cache. There was no backfill worker.

So a guest's cache read was a miss, every time, forever. A signed-in reader can
switch to `always` and buy their own way out; a guest has no such lever, and
guests are the majority of readers on precisely the surfaces §7.1 ranked first.
**Fact 3 is the one this phase removed.** Facts 1 and 2 are load-bearing and
were left exactly as they were.

### 15.2 The answer is not to let guests spend

Stated plainly so it is not re-litigated at implementation time: a bounded
"guests may warm a little" would be spent by crawlers, not readers. There is no
per-user key to meter, IPs rotate, and the hard rule in §4.1 — *a page load
never waits on a translation API, and a crawler must not be able to burn the
day's quota* — is the rule that keeps this feature affordable. Guest warming is
refused.

**The answer is to have already paid, before the guest arrives.** That is the
backfill worker of §8, and this phase is that worker with its priority queue
pointed at guests.

### 15.3 What P3 contains

1. **The worker**, with everything §8 specifies: resumable cursor,
   `--status` / `--dry` / `--budget` / `--only` / `--locales`, idempotent,
   stops clean when the budget is gone. It lives in
   `/api/cron/translate-backfill` with `src/lib/jobs/backfill-translations.ts`
   as its driver, and the "shipped as" note under §11 says why that split
   rather than one standalone script.

   **Idempotence is checked before the governor is asked anything.** A string
   already covered in all five locales is dropped from the queue before a
   single request is contemplated, so re-running a covered corpus costs one
   corpus query and zero quota — even on a day the budget is already gone.
2. **Public-surface-first ordering.** §8.2 had "public / SEO surfaces" as tier
   2; this phase promotes it to tier 1 and *defines* it —
   `src/lib/server/translation/backfillSources.ts`. "Reachable with no session"
   is not guessed there: the corpus query carries **the same filter the public
   directory uses**, and every string comes out of **the same function the
   loader uses** (`excerptOf` for a card, `plainForTranslation` for the page,
   `collect()` for the field filter and the hash).

   That last part is the whole file's reason to exist. The cache is
   content-addressed, so a row is only ever found by a page that hashes byte
   for byte the same string; a walker that flattened `descrip` even slightly
   differently would spend the entire free quota filling rows no page can look
   up — and it would *look* like it worked, because nothing errors and every
   page simply renders source text. `backfillSources.test.ts` asserts the
   walker's hashes equal the loaders' hashes, for both surfaces.

   A source whose every surface is off is skipped entirely. Everything a
   signed-in reader sees waits, and P4 adds a row here as it turns each
   surface on.
3. **The guest demand log** — the piece without which the priority queue is
   blind to exactly the readers this phase is for. `hits` is stamped only by
   the warm path (§11's deviation 4), which a guest never calls, so §8.2's
   first tier — *"somebody actually asked for this"* — could not see guest
   demand at all. The read path already knows its misses (`payload.misses`) and
   its target locale; those two are the whole signal, and `translateSurface`
   now records them.

   It is never a write on the page's critical path: an in-process buffer,
   deferred flush, capped so a crawler cannot grow it without bound.

   **Decided:** neither a `translation-demand` collection nor a placeholder row
   in `text-translation` — a JSONL file in `TRANSLATE_STATE_DIR`, beside the
   governor's day counter. A placeholder row would have to be filtered out of
   every cache read, and a read path that has to ignore some of its own rows is
   how a half-translated page ships. A new collection would mean a Strapi
   deploy and two permission grants before a line of this phase could run, and
   would put a write in front of a page render, which §4.1 forbids. The file
   accepts exactly the limit the governor already accepts and documents:
   per-instance, opt-in, honest about it. Demand seen on an instance the worker
   does not run on is lost — which loses *ordering*, never correctness, because
   the string is still walked and still filled, just later. A collection is the
   upgrade when that starts to matter, and `readDemand` is the only thing that
   would change.
4. **Target locales follow real guest traffic**, not a fixed order. The locale
   is logged with the miss, and `--status` prints the roll-up — which language
   this corpus is actually failing right now. (One request buys all five
   either way (§5.1), so this does not change what a request costs; it changes
   which *strings* are worth one, and it is what `--locales` is steered by.)
5. **Identity rows are the cheapest win and go first.** A Hebrew guest reading
   Hebrew content needs an `identity` row (§2.2), not a translation, and
   `detect.ts` produces those with **no engine request at all** — so the worker
   writes them before it looks at the engine, and does so even with no Gemini
   key configured. On a Hebrew-majority corpus read by a Hebrew-majority
   audience this alone turns the single most common render on the site from a
   permanent miss into a hit, for free.

   Two things had to be true for that to be safe, and the second was found
   while building it: the display layer must not call an identity row a
   translation (fixed in P4, below), and `cacheTranslations` must not run the
   *model-output* validator over a row that contains no model output — see
   deviation 3 under §11, and `cacheTranslations.test.ts`.

   > ✅ **Prerequisite bug — fixed.** The display layer's only test was
   > `!!hit.text`, and an identity row's `text` *is* the source, so a Hebrew
   > reader was told "תורגם מעברית · תרגום מכונה" underneath text nobody
   > translated — and on `/availableMission/[id]` the formatted description was
   > silently replaced by the same words as flat text. Both were already
   > reachable. `src/lib/translation/hits.js` now holds the single predicate,
   > `isRealTranslation`, and its four call sites (`<Translated>`,
   > `<TranslatedNote>`, the mission cards' `cardHit`, the detail page's
   > rich-text swap) all go through it. The cards pick the first *real*
   > translation of their three fields rather than the first row, so an
   > identity title can no longer swallow a translated excerpt's provenance
   > line. Backfill may now write identity rows in bulk.
6. **Scheduling** (§8.3): a fourth job in `scripts/scheduler/`, next to
   `timegrama`, `monthi` and `maagad`. Daily at 05:00, budget-bounded,
   self-skipping, and cheap when there is nothing to do.

### 15.4 What does *not* change

**No preference change was needed.** `onDemand` is already the right default
for a guest — read what exists, never buy — and this phase is what makes it
*sufficient*. §14.3 stays open for signed-in readers; it was not on this
phase's path.

**Guests still cannot spend.** §15.2 is not softened anywhere: the warm
endpoint's rules are untouched, and the backfill is the only thing that fills
the cache on a guest's behalf.

### 15.5 Done means

On a browser with no `autoTranslate` value and no session, `?lang=es` on
`/availableMission` renders Spanish on the **first** load, and the server buys
**nothing** during that load. Then the same for `/availableMission/[id]`,
`/availiableResorce`, `/project`, `/demand`, `/gift`, in that order.

**Where that stands.** Five of the six routes read the cache and have a walker
filling it — `/availableMission`, `/availableMission/[id]`, `/availiableResorce`,
`/project` and `/gift`, plus two pages the list did not name
(`/availiableResorce/[id]`, `/project/[id]`). The criterion is met for each of
them once an operator names it in `TRANSLATE_SURFACES` and lets one backfill
run finish. **`/demand` is the one left**, and it is a different shape — a map
whose strings live in popups and in `loadDiscoveryMapData`, not in cards; §17.4
says what it needs.

Once all six are true, revisit §9.2: machine-translated `<title>` / `<meta
description>` / JSON-LD stay off until there are reviewed rows, and that reason
gets sharper, not weaker, when guests can finally read the page body.

---

## 16. P6 — block-by-block rich text

Replaces the compromise §12 had to make: today a translated `descrip` is flat
text, and bold, links and lists survive only in the original.

### 16.1 The unit becomes a block, not a field

Parse the tiptap HTML into an ordered list of block-level nodes (`p`, `li`,
`h1`–`h6`, `blockquote`), take each block's text, and make **each block one
cache row**. Rendering re-emits *our* structure with *their* text: the tag comes
from the parsed original, only the text content is substituted. A model that
returns markup is still rejected — the invariant that the cache holds plain
strings does not move, it just applies per block.

What that buys: paragraphs, lists and headings survive a translation. Reuse goes
*up*, because a paragraph repeated across rikmot is now one row rather than part
of five different long ones. Row count goes up; request count roughly tracks
total text either way.

### 16.2 It also removes the length ceiling

§12's "no truncation, so a description over `max` is simply not translated"
stops binding: a 4 000-character description is forty blocks of a hundred
characters, each comfortably under the manifest's cap. Long descriptions — the
ones a reader most needs translated — become translatable for the first time.

### 16.3 Inline marks, second and separately

Blocks do not recover a **bold word mid-sentence**: the model reorders words and
nothing can map a span back. The technique that does is placeholder sentinels —
inline marks become numbered tokens, the prompt requires them back untouched,
and `validate.ts` gains a rule: *every sentinel that went in comes back, exactly
once, balanced, or the row is discarded*.

Ship blocks first and sentinels second. Sentinels multiply the ways a batch gets
rejected, and a rejected batch is a page rendering source text — the failure is
soft, but it is also invisible, and it is not worth stacking two new failure
modes into one phase.

### 16.4 Nothing to migrate, and a safe fallback

Content addressing again: the field-level flat rows written by P4 stay valid and
stay the fallback. A page prefers block rows when it has **all** of them, falls
back to the flat row when any block is a miss, and falls back to the source when
there is neither. It never renders a half-translated document — a paragraph in
Spanish followed by a paragraph in Hebrew is worse than either language alone.

### 16.5 Where the code goes

| file | what it is |
|---|---|
| `src/lib/translation/blocks.js` | pure: html → blocks, and blocks + hits → html |
| `src/lib/translation/blocks.test.ts` | incl. a pbt: re-emitting an untranslated document round-trips |
| `src/lib/server/translation/surfaces.ts` | a group per block |
| `src/lib/server/translation/validate.ts` | the sentinel rule (§16.3) |

`blocks.js` is pure and shared for the same reason `richText.js` is (§12): the
loader hashes the blocks to look them up and the page hashes them again to find
what it was handed. One parser, imported by both, is the only way those two
cannot drift.

---

## 17. P4 — the rest of §7.1 *(shipped, off by default)*

The two mission surfaces proved the shape; this step applies it to every other
public directory and entity page. Nothing new was invented — the point of the
step is that nothing *had* to be: a surface is a builder in `surfaces.ts`, a
loader call, a page wiring, and a walker row.

### 17.1 The surfaces

| key | route | strings | notes |
|---|---|---|---|
| `availableResource` | `/availiableResorce` | resource name, 220-char excerpt, rikma name | mirrors the missions directory |
| `resourceDetail` | `/availiableResorce/[id]` | name, `descrip`, rikma name | `descrip` is **plain text** on this page (a `<p>`, not RichText), so it is hashed raw; below the card's cut it is the same row as the card's |
| `projectDirectory` | `/project` | rikma name, excerpt of `publicDescription` | |
| `projectDetail` | `/project/[id]` | flattened `publicDescription`, open-mission names, product names | the second rich-text surface — same flat-translation / formatted-original swap as §12 |
| `productDirectory` | `/gift` | product name, rikma name on a rikma product | |

**shipped as** — three deliberate omissions, each a string that is *shown* but
not *looked up*:

1. **The rikma name on `/project/[id]`.** It is drawn by `AuthorityBadge` on an
   SVG path — a seal, an identity mark — and a string looked up but never
   rendered is a query for nothing. It is translated everywhere else it
   appears (every card, every entity page's header).
2. **A personal product's seller on `/gift`.** A person's name is
   transliterated, not translated (§4.3); that belongs to §7.4's profile
   surfaces, and `productCardGroups` leaves it out rather than route a name
   through a `translate`-mode field.
3. **The concierge / maagad label on a resource page.** When a need has no
   rikma, the header shows a label the page builds (`קונסיירז' · …`). That is
   chrome, and chrome goes through `$t()` — not through the UGC cache.

`/gift/[id]` is not a surface yet: a product's `desc` is a JSON block column
(`fields.js` explains why it is not in the manifest), and without it the page
has one translatable string. It waits for P6's block model.

### 17.2 `pageTranslations` — the page half, once

The first two surfaces wrote the page's half of the read path inline: a merged
hit map, a `hitFor`, a `firstReal` for the card's one provenance line, and a
warm effect. By the third page it was a pattern, so it is now
`src/lib/translation/pageTranslations.svelte.ts`, used by all seven pages
(the two mission pages were moved onto it too). It adds the one thing the
inline copies each re-derived: `showsTranslation` / `textFor`, for a string
that goes where `<Translated>` cannot — a `Tile`'s `word`, or a rich-text
field whose translation is flat.

**Fixed on the way:** the mission page's provenance line spoke only for
`descrip`, so a translated *name* above an untranslated (e.g. over-`max`)
description rendered with no note at all — a §9.1 breach. The line now sits
outside the description block and is about the first real translation among
description, name and rikma name.

### 17.3 The walkers

Three new sources in `backfillSources.ts`, each with its own corpus qid, each
filtered exactly as its public directory is:

| source | qid | feeds |
|---|---|---|
| `openMashaabim` | `317backfillResources` | `availableResource`, `resourceDetail` |
| `project` | `318backfillProjects` | `projectDirectory`, `projectDetail` |
| `matanot` | `319backfillProducts` | `productDirectory` |

Two changes to how *every* walker works:

- **Cards are made the way the loader makes them.** The walker no longer calls
  `excerptOf` itself; it runs the directory's own normalizer
  (`normalizeMissionCard`, `…ResourceCard`, `…ProjectCard`, `…ProductCard`) and
  hands the card to the loader's own builder. The walker therefore cannot even
  pick a different field, which is a stronger form of §15.3.2's rule than
  "call the same flattener".
- **Hidden rikmot are not walked.** Every directory loader drops the ids in
  `hiddenProjects.ts`; the mission walker did not, and spent on test rikmot no
  directory shows. All four drop them now.

A test asserts that every `SurfaceKey` has a walker, so a surface can no longer
be turned on with nothing to fill it — which, for a guest, would mean it can
never be translated at all.

### 17.4 What is left of P4

- **`/demand`** — the map. Its strings are `MapItem.title` in popups, built by
  `loadDiscoveryMapData` from several qids (wishes, missions, resources,
  maagadim, products). Missions', resources' and products' names are already
  rows (same string, same hash), so the surface is mostly a matter of handing
  the map layer a hit map; wishes and maagadim need manifest entries first.
- **§7.2 Lev cards**, **§7.3 moach pages**, **§7.4 profiles**, **§7.5 chat
  (on-demand button only)**, **§7.6 mail (cache read only)** — unchanged from
  §7. Everything a signed-in reader sees is tier 2 and waits behind the public
  corpus, as §15 intends.

### 17.5 Turning it on

Nothing changed in §13's order. Add the new keys to `TRANSLATE_SURFACES` one
at a time (or `*`), run `--status` to see the new sources go active, and let
the identity pass run before any key is set — on a Hebrew-majority corpus it
turns most of these pages' misses into free hits too.
