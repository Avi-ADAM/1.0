# PLAN — Mission creation form redesign (`mission.svelte`)

**Status:** built, awaiting review (move to `docs/inprogress/`) · **Design:** Design canvas "טופס יצירת משימה — עיצוב חדש" (desktop + mobile artboards)
**Files:** `src/lib/components/prPr/mission.svelte`, `src/lib/components/prPr/choosMission.svelte`

## Goal

The create-mission form is one of the platform's core flows, but today it is a long vertical
list of yellow `<mark>` labels, each behind its own edit/done toggle (`descripE`, `valphE`,
`ske`, `roleE`, `wwe`, `locationE`, `assignE`, `publinkE`, `mislinkE`, `shiftE`), with four
unlabeled icon buttons at the bottom that open hidden options. Users don't know what is
required, what is optional, or what happens when they press "פרסום".

This is a **UI-only** change. Every prop, every `$state` field in `miData[0]`, every
handler (`increment`, `handleAiSuggest`, `applyAiSuggestions`, `handleAiImprove`,
`handleAiTranslate`, `hydrateFromMissionName`, `find_*_id`, `addnewrole`, `newnew`…) and the
`createMission` payload stay exactly as they are. Spec mode, publish mode, invite flow,
shift plan, stipend and multi-currency must all keep working.

## New structure

Built as the mock: form + sticky summary aside on `lg`, summary card + sticky publish bar
on smaller screens. `.moach-layout` went from `overflow-y-auto` to `overflow-x-clip` (it never
scrolled itself — the window does — and `overflow-y-auto` was what broke `position: sticky`).
A "full screen" toggle moves the form to `<body>` as a fixed overlay (Esc leaves). No more edit/done toggles: every field
is always editable in place.

| # | Section (heading) | Contents | Replaces |
|---|---|---|---|
| — | Header | Rikma chip (`pn`), title "משימה חדשה", one-line hint, close button (`onClose`) | `h2` from choosMission |
| 1 | מה צריך לעשות? | Name `<input>` + templates `<datalist>` + "מלא עם AI" button inline; AI suggestion card (chips + value + "החל הכל"/"התעלם"); description `RichText` always editable, with "שפר ניסוח" / "בטל" / "תרגם" in its toolbar row; translation preview below | `missionNameE`, `descripE` toggles |
| 2 | כמה זה שווה? | Segmented control חד-פעמית / חוזרת כל חודש (`iskvua`); grid of 3 number fields: שווי לשעה + `CurrencyPicker`, שעות לאדם, כמה אנשים (`howMeny`, hidden when `myM`); result strip "formula = total"; `MissionStipendSection` collapsed into one row "מלגת קיום · רשות · הוסף" | `valphE`, `Chooser`, headcount block, money row |
| 3 | מי מתאים? | Skills (`SkillSelector`), roles (`MultiSelect` + `Addnewro`), work ways (`MultiSelect` with create) — always-visible chip inputs, roles + work ways side by side on desktop | `ske`, `roleE`, `wwe` + `MobileModal` wrappers |
| 4 | מתי ואיפה? | Start/end (`Daterange`) side by side; location = segmented לא משנה / מקוון / במקום מסוים, then `LocationPicker` only for "במקום מסוים" | `dateE`, `locationE` |
| — | עוד אפשרויות | Accordion rows (icon, title, one-line status, chevron): רשימת מטלות (count), שיבוץ לחבר/ה, הזמנת שותף/ה חדש/ה (`canInvite` only), קישורים (public + private), תכנון משמרות (`shiftsOn && projectId` only). Opening a row reveals the existing UI in place | the 4 icon buttons + `assignE`/`publinkE`/`mislinkE`/`shiftE` |
| — | Summary aside / mobile bar | Mission name, type · seats, total big, formula, equity bar (data from `EquityPreview` — consider a `compact` prop), completeness checklist (name+desc, value, skills/role, when/where optional), publish `Button`, consent note with `restime` | `EquityPreview` block, publish button |

Hide in spec/publish mode exactly what is hidden today (headcount, stipend, equity, assign,
shifts, currency picker). In those modes the aside shows the total without the equity bar
and the button reads `common.buttons.publishToCommunity`, plus the existing cancel button.

## Visual tokens (1💗1)

- Page background: dark `#140b12` with faint gold/pink radial glows (unchanged app look).
- Section card: `#fff`, border `#efe6d3`, radius 18px (16 mobile), padding 28px (18 mobile), gap 20px.
- Step badge: 30px circle `#c8155f`, white 800 text. Section title 21px/800 `#2a1420`, subtitle 14px `#6b5560`.
- Inputs: height 52px, radius 12px, border 1.5px `#e4d9c4`, bg `#fffdf8`; focus border `#c8155f` + ring `rgba(200,21,95,.15)`.
- Chips: skills `#fdeef4`/`#a3124e`, roles `#e6f7f8`/`#0b6470`, work ways `#f6f0e4`/`#5a4a2a`; pill 34px.
- Primary button: gradient `#ff0092 → #c8155f`, white 800, radius 14px, height 56px.
- Value strip: bg `#fdf9ea`, border `#eee2a6`. Total 26px/800; aside total 40px `#c8155f`.
- Font: Heebo (UI). Icons: `@lucide/svelte` (sparkles, wand, globe, list-checks, user-plus, mail, link, clock, calendar, map-pin, heart, chevron-down, x) — replaces the emoji 🪄🌍↩️✅🖍️✖️ and the Cloudinary money/calendar images.
- Use `#c8155f` (not `#ff0092`) for text on white — `#ff0092` fails 4.5:1.
- Touch targets ≥ 44px. Use logical properties (`ms-`/`me-`, `text-start`) instead of `text-{$lang=='en'?'left':'right'}`.

## i18n

All new strings go into `src/lib/translations/<locale>/mission.json` (he, en, ar, ru, es) under
a new `mission.form2.*` block and are read with `$t()`. Remove the `missionByLang` import
dictionary only if every `mf.*` / `ml.*` usage is migrated to `$t('mission.form.*')` in the
same change. Keep the "rikma" terminology rules from CLAUDE.md. Run
`npm run check:i18n` and `npm run check:script` after.

Suggested keys: `title` (משימה חדשה), `intro`, `step1Title`/`step1Sub`, `step2Title`/`step2Sub`,
`step3Title`/`step3Sub`, `step4Title`/`step4Sub`, `moreTitle`/`moreSub`, `oneTime`,
`recurringMonthly`, `ratePerHour`, `hoursPerPerson`, `headcount`, `locAny`, `locOnline`,
`locPlace`, `summary`, `missionValue`, `shareOfRikma` (`≈ {{pct}}`), `optional`,
`consentNote` (with `{{restime}}`), `fillWithAi`, `tasksCount` (`{{count}}`), `notAssigned`.

## Suggested split

Create `src/lib/components/prPr/missionForm/` with `FormSection.svelte` (badge + title +
subtitle + slot), `ValueCalculator.svelte`, `OptionRow.svelte` (accordion row),
`MissionSummary.svelte` (aside + mobile bar). `mission.svelte` keeps all state and logic and
composes these. Do not touch `choosMission.svelte` beyond removing its duplicate `h2` when
the new header renders.

## Acceptance

- `npm run check` and `npm test` pass; `npm run check:i18n` clean.
- Create a mission in: a solo rikma (self-assign + invite), a multi-member rikma (assign
  member), from a template (name locks to template, fields hydrate), from `?action=createmission`
  prefill, in spec mode and publish mode — payloads identical to before.
- AI: suggest → apply all keeps typed money values; improve → undo; translate preview.
- Mobile 390px: no horizontal scroll, sticky bar visible, all options reachable.
- RTL and LTR (en) both mirror correctly.
