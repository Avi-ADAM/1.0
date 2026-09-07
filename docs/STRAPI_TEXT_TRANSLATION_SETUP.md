# Strapi setup — the `text-translation` collection

This is the **backend half of P0** of [`PLAN_UGC_TRANSLATION.md`](./PLAN_UGC_TRANSLATION.md).
Everything else in P0 and P1 is merged and inert; the app renders exactly what
it rendered before, in every language, until this collection exists. Nothing
below is required for the site to keep working — it is required for the cache to
start hitting.

> ⚠️ From experience in this repo: a new Strapi collection needs **two**
> permission grants — the `Authenticated` role **and** the API token — and
> `npm run validate:qids` only checks mutations, so a bad field in a *query*
> ships silently. Grant both.

---

## 1. The collection

Name it **`text-translation`** (singular API id `text-translation`, plural
`text-translations`, GraphQL query `textTranslations`). The name matters: the
existing **`Translate`** collection is the *volunteer translator sign-up form*
(§9.3 of the plan) and must not be reused or renamed.

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

**`hash` must be indexed.** The read path filters `hash IN (…) AND tgtLang = …`
for up to 300 hashes on every list page; unindexed, that is a sequential scan on
the largest table on the site.

## 2. The two permission grants

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

## 4. What is still missing after this

`UsersPermissionsUser.autoTranslate` — an enum `off | onDemand | always`
(§4.4), so the reader's preference follows the account instead of the device.
Until it exists, `src/lib/stores/autoTranslate.js` keeps the preference in
`localStorage` only, and `mirrorToProfile()` is a documented no-op. When the
column lands, add it to the `updateUserBasic` action and call that from
`mirrorToProfile` — do not add a second write path.

## 5. How to tell it is working

Before the collection exists, the server log prints **once** per process:

```
[translation] cache read failed — rendering source text. …
```

That line is the expected state of P1, not an incident. After the collection
exists it stops, `readTranslationCache` starts returning `{ hits: {}, misses: […] }`
with a real (empty) result, and the misses are what P2's warm endpoint and P3's
backfill worker consume.
