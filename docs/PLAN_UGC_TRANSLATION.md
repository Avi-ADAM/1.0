# PLAN — Translating user-generated content (תרגום תוכן משתמשים)

Status: **P0 + P1 shipped (app side); P2–P5 not started.**

The manifest, the glossary, normalization/detection, the batched cache read, the
`<Translated>` component, the `translated` namespace in all five locales, the
`/me` preference and `npm run check:translatable` are all in the codebase and
tested. **No translation engine exists**, so every string is a cache miss and
the site renders exactly what it rendered before, in every language, at zero API
cost — which is the shape P1 was designed to have.

One piece of P0 is *not* code and is therefore still open: the Strapi
`text-translation` collection and its two permission grants. See
[`STRAPI_TEXT_TRANSLATION_SETUP.md`](./STRAPI_TEXT_TRANSLATION_SETUP.md). Until
it exists the read path fails soft, logs once, and reports every string as a
miss.

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

`src/lib/jobs/backfill-translations.ts`, run as `npx tsx`, deliberately in the
same shape as the existing `src/lib/jobs/sync-vocabulary.ts` (standalone,
`dotenv/config`, `process.env`, resumable local cache).

```bash
npx tsx src/lib/jobs/backfill-translations.ts --status       # what's left, what it'd cost
npx tsx src/lib/jobs/backfill-translations.ts --dry          # decide out loud, spend nothing
npx tsx src/lib/jobs/backfill-translations.ts --budget 400   # spend at most 400 requests, then stop clean
npx tsx src/lib/jobs/backfill-translations.ts --only project,openMission
npx tsx src/lib/jobs/backfill-translations.ts --locales ru,es
```

### 8.1 Resumable, budget-bounded, idempotent

A state file (`.translate-state/cursor.json`, same spirit as `.embed-cache/`)
holds a per-entity cursor and the day's spend. The run stops **cleanly** the
moment the budget is exhausted — that is the point. Tomorrow's run picks up the
cursor and continues. Weeks of free quota, one quantum a day, and the corpus is
covered without a single paid call.

Everything is idempotent: a string already in the cache is skipped before the
governor is consulted, so re-running costs nothing.

### 8.2 Priority queue

1. **`hits > 0` misses** — somebody actually asked for this and got source text.
   Always first; this is the only class with a real reader waiting.
2. **Public / SEO surfaces** — `project.publicDescription`, open-mission
   `name`/`descrip`, product names. Reaches anonymous readers.
3. **Recently active rikmot** — recency of `updatedAt` on the parent entity.
4. **Everything else**, oldest first.

Within a tier, pack `TRANSLATE_BATCH` strings per request and always fill all
five locales (§5.1).

### 8.3 Scheduling it

Once it is proven by hand, it becomes a fourth job in `scripts/scheduler/` next
to `timegrama`, `monthi` and `maagad` — daily, budget-bounded, safe to run more
often than needed (it self-skips). Add it there, do not invent a second clock.

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
| **P2** | Write path: `gemini.ts`, `governor.ts`, `validate.ts`, `/api/translate/warm`, `cacheTranslations`. Enable on **one** surface (`/availableMission`) behind an env flag | bounded by `TRANSLATE_RPD` | measurable on one route before it is everywhere |
| **P3** | `backfill-translations.ts` + state file + priority queue; run by hand for a week; then add it to `scripts/scheduler/` | free quota only | it is budget-bounded and idempotent |
| **P4** | Surface rollout in the order of §7 (chat last, on-demand only) | cache hits, mostly | |
| **P5** | Human loop: review queue, `reviewTranslation`, wire the `Translate` volunteers in; revisit the SEO decision in §9.2 | human time | |

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
| `src/lib/stores/autoTranslate.js` | the reader preference and the show-original toggle (§4.4) |
| `src/routes/api/send/qids.js` | `312translationsByHash` — the one query the read path may make |
| `scripts/check-translatable.mjs` | `npm run check:translatable` |

Nothing yet **calls** `translateFor()` from a loader: P2 enables the read on one
surface (`/availableMission`) behind an env flag, which is where the first real
cache read belongs. Until then the whole read path is exercised by its tests and
by nothing else, which is exactly the zero-risk shape P1 asked for.

---

## 12. Open questions

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
