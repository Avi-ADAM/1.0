# Strapi setup — the `text-translation` collection

This is the **backend half of P0** of [`PLAN_UGC_TRANSLATION.md`](./PLAN_UGC_TRANSLATION.md).
It is now complete. Keep this file as the record of *what* was built and *why*
each part is shaped the way it is — the index, the two grants, and the enum
typing are each a trap that costs an afternoon to rediscover.

> **State: done and verified live** (2026-09-08). The collection is deployed,
> both grants are in place, and the frontend types are regenerated. Qid
> `312translationsByHash` answers `{"data":{"textTranslations":{"data":[]}}}`
> against the live instance with the service token — a real, empty cache read.
> The only thing not verified from here is the `hash` index (§1.1), which needs
> DB access; one statement confirms it.

> ⚠️ From experience in this repo: a new Strapi collection needs **two**
> permission grants — the `Authenticated` role **and** the API token — and
> `npm run validate:qids` only checks mutations, so a bad field in a *query*
> ships silently. Grant both.

---

## 1. The collection — **deployed; source in `1.0b` on `shabab`**

```
src/api/text-translation/
  content-types/text-translation/schema.json
  controllers/text-translation.ts        # factories.createCoreController
  routes/text-translation.ts             # factories.createCoreRouter
  services/text-translation.ts           # factories.createCoreService
```

Name **`text-translation`** (singular API id `text-translation`, plural
`text-translations`, table `text_translations`, GraphQL query
`textTranslations`). The name matters: the existing **`Translate`** collection
is the *volunteer translator sign-up form* (§9.3 of the plan) and must not be
reused or renamed.

Draft & publish: **off**. These rows are cache entries, not editorial content;
a row that needs publishing is a row the read path cannot see.

| field | type | settings |
|---|---|---|
| `key` | Text (short) | **required**, **unique**. `${srcLang}.${tgtLang}.${hash}` |
| `hash` | Text (short) | **required**, **indexed** — this is what the read path filters on |
| `srcLang` | Enumeration | `he, en, ar, ru, es` — required |
| `tgtLang` | Enumeration | `he, en, ar, ru, es` — required |
| `source` | Text (long) | the original, for the backfill worker and for human repair |
| `text` | Text (long) | the translation |
| `mode` | Enumeration | `translate, transliterate` — default `translate` |
| `engine` | Enumeration | `gemini, human, identity, glossary` |
| `model` | Text (short) | e.g. `gemini-2.5-flash-lite`, so a row can be re-run later |
| `quality` | Enumeration | `machine, reviewed` — default `machine` |
| `hits` | Integer | default `0`; bumped on a miss somebody actually asked for |
| `firstSeenOn` | Text (short) | `openMission.descrip` — **telemetry only, never a key** |

No relations. That is the whole point of §2.1: the cache is keyed by the content
of the string, so it touches nothing in the entity graph and deleting the
collection returns the site to exactly today's behaviour.

### 1.1 The `hash` index

**`hash` must be indexed.** The read path filters `hash IN (…) AND tgtLang = …`
for up to 300 hashes on every list page; unindexed, that is a sequential scan on
the largest table on the site.

The Content-Type Builder cannot express a non-unique index, so it is declared as
a **top-level `indexes` key** in `schema.json` — a `@strapi/database` model
feature that survives the content-type loader (`createContentType` clones the
whole schema; `transformContentTypes` spreads it; `createTable` reads
`meta.indexes`), so `strapi.db.schema.sync()` creates it with the table:

```json
"indexes": [
  { "name": "text_translations_hash_index", "columns": ["hash"] }
]
```

Two things to know about it:

- It is **not** written by the admin UI. If anyone ever edits this collection in
  the Content-Type Builder, the CTB rewrites `schema.json` from its own
  serializer and **drops the `indexes` key**; the next sync then drops the index
  (`forceMigration: true` is on in `config/database.js`). Re-add it by hand.
- If the index is ever missing on a live instance, it is one idempotent
  statement away and needs no deploy:
  ```sql
  CREATE INDEX IF NOT EXISTS text_translations_hash_index ON text_translations (hash);
  ```

## 2. The two permission grants — **granted**

1. **Settings → Users & Permissions → Roles → Authenticated** → `text-translation`:
   `find` only. Not `create`, not `update`, not `delete` — writes go through the
   `cacheTranslations` action with the service token (P2), never from a browser.
2. **Settings → API Tokens → the app's token** → `text-translation`: `find`,
   and (for P2) `create` / `update`.

Grant only `find` to `Authenticated`. A reader who could write the cache could
put any text on the site under another member's name with a provenance line
that says it was translated.

## 3. Then regenerate the types

```bash
npm run types:update       # codegen + types:extract, against a running Strapi
npm run check:translatable # the manifest still matches the schema
npm run validate:qids
```

> **The enum, and the one query that reads it.** `srcLang`/`tgtLang` are
> enumerations, and Strapi v4 types them two different ways depending on where
> they appear: the **output** field and `TextTranslationInput` get the real enum
> (`ENUM_TEXTTRANSLATION_TGTLANG`), but `TextTranslationFiltersInput.tgtLang` is
> a plain **`StringFilterInput`**. So qid `312translationsByHash` filters with
> `$tgt: String!` and that is correct — declaring the enum type there is
> rejected with *"used in position expecting type String"*. Verified against the
> live instance, not inferred.

## 4. The reader preference follows the account

`UsersPermissionsUser.autoTranslate` (`off | onDemand | always`, §4.4) exists
and is wired end to end:

- `updateUserBasic` accepts it — whitelisted as an enum and emitted unquoted,
  like `lang` and `frd`. It is the **only** write path, as §4 always asked.
- `meProfile` selects it, so `/me` and `/me/settings` load it.
- `mirrorToProfile()` in `src/lib/stores/autoTranslate.js` calls that action,
  debounced 700 ms and silent on failure: the reader's choice was already
  honoured on this device by the `localStorage` write, and a toast about a
  failed *preference sync* is noise about something nobody asked for.
- `adoptFromProfile(meData.autoTranslate)` fills in the value on a device that
  has never chosen one. **Local wins when it exists** — the choice a reader made
  on the device in their hand is not overruled by a profile written elsewhere.

> The subtle part, and the reason the store skips its subscriber's first run:
> a Svelte store fires the subscriber immediately on attach, so persisting that
> call would write the *default* into `localStorage` at import time. A stored
> default is indistinguishable from a real choice, and `adoptFromProfile` would
> then never adopt anything on any device. The key now appears only once the
> reader has actually picked something.

## 5. How to tell it is working

Before the collection exists, the server log prints **once** per process:

```
[translation] cache read failed — rendering source text. …
```

That line is the expected state of P1, not an incident. After the collection
exists it stops, `readTranslationCache` starts returning `{ hits: {}, misses: […] }`
with a real (empty) result, and the misses are what P2's warm endpoint and P3's
backfill worker consume.

A grant that was missed shows up as **403** rather than as that line — the
collection is demonstrably deployed and the query still fails. That is §2, not a
bug in the qid.

### What was actually checked on 2026-09-08

| check | result |
|---|---|
| `textTranslations` read, service token (`ADMINMONTHER`) | HTTP 200, `{"textTranslations":{"data":[]}}` |
| API-token `create` grant | present — `createTextTranslation(data: {})` reaches **validation**, not "Forbidden access" |
| the four `required` fields | enforced: `key`, `hash`, `srcLang`, `tgtLang` each rejected as "must be defined" |
| `npm run check:translatable` | ✓ 11 fields across 5 entities |
| `npm run validate:qids` | 0 syntax errors, 0 field errors |
| `UsersPermissionsUser.autoTranslate` | selectable on a live user (reads `null` = legacy = no account choice) |
| the unquoted-enum emission in `updateUserBasic` | correct — a deliberately bad value is refused by `ENUM_USERSPERMISSIONSUSER_AUTOTRANSLATE`, so the field and its type are both real |
| `npm run check:i18n` / `check:script` | ✓ (the reworded `translated.pref.saved` in all five locales) |
| the `hash` index | **not verified** — needs DB access. `select indexname from pg_indexes where tablename = 'text_translations';` |

The `create` probe wrote nothing: an empty `data: {}` fails validation after the
permission check, which is exactly what makes it a safe probe to re-run.
