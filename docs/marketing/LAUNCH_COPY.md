# Launch copy — Show HN, Product Hunt, and ten posts

Companion to [PLAN_MARKETING_GLOBAL](../tbd/PLAN_MARKETING_GLOBAL.md) §2 (positioning),
§6.3 (build in public) and §6.6 (launch moments). Order of launches, from the plan:
**Show HN (the open consensus engine) → Product Hunt (the product, with real cases and a
video) → talks at co-op / new-economy conferences.** A launch multiplies loops that already
work; it does not replace them.

## 0. Do not launch before

- [ ] Loop 1 is live: a share card per pool (`/api/og/maagad/<id>.png`), the share prompt
      after a signature ("3 more and this happens"), the celebration at the threshold.
- [ ] `/demand` and the public pool/wish pages read naturally in English.
- [ ] Three real cases from the [outreach kit](./OUTREACH_KIT.md), with numbers you may
      publish (`needed / got / days`).
- [ ] The `consensus` repo has a README, a usage example and a licence — that is the
      Show HN.
- [ ] A 60–90 s Remotion video of one pool going from 0 to activated.
- [ ] Analytics that respect people (Plausible or equivalent); you will want the
      referrer breakdown on launch day.

All numbers below marked `{{N}}` are placeholders — publish only real ones.

## 1. Vocabulary (outside the code)

| Internal | Outside | One line |
| --- | --- | --- |
| maagad | **Pool** | People who want the same thing, counted. |
| הצעת סף | **Threshold Offer** | "This happens at 10 by Friday." Signed individually; activates atomically. |
| ratson | **Wish** | "Describe it. We assemble it from real people." |
| rikma | **Weave** | A group that shares decisions, work and returns by consent. |

Taglines, in order of use:

- **Group buying, without the group chat.**
- **We removed the group from group buying.**
- **Nobody pays until enough people say yes.**
- **An economy that runs on consent.** (layer 3 — for the people who stayed)

---

## 2. Show HN

HN rewards honesty and specifics, punishes marketing. The post is about the engine; the
product is mentioned once, as the thing the engine was extracted from.

**Title options** (pick one; ≤ 80 chars, no superlatives):

1. `Show HN: An open-source atomic group-commitment engine (sign solo, activate together)`
2. `Show HN: Consensus as a state machine – the engine behind a group-buying tool`
3. `Show HN: 1lev1 – group buying where nobody pays until the threshold is met`

**Body (draft):**

> Hi HN. I'm {{name}}, building 1lev1 (https://1lev1.com), a Hebrew-first, multilingual
> platform for things that only exist in volume: a weekly farm box, a workshop that needs
> eight people, a bulk order for a street.
>
> The part I'm showing today is the engine underneath it, now a standalone library:
> {{repo url}}.
>
> The problem it solves: group buying today is a WhatsApp group and one exhausted
> organiser. People argue, half-commit, and somebody ends up fronting the money. We tried
> to remove the *group* from group buying:
>
> - A supplier (or anyone) publishes a *threshold offer*: price, minimum, maximum,
>   deadline, cancellation terms.
> - Each person signs for themselves. There are no group decisions by design — no votes,
>   no polls, no "who's in?".
> - Activation is atomic: at the deadline, either the minimum is met and everybody is
>   in and charged, or nobody is. Over-subscription is capped at the maximum.
> - The same state machine handles the opposite case — a *weave*, where a group *does*
>   want shared decisions — with consent rather than majority: a decision stands when
>   nobody blocks it, and every state change is a reviewable event.
>
> Technical bits people here might find interesting:
>
> - The commitment/activation logic is a pure state machine with an exhaustive test suite;
>   the server is a thin wrapper. {{link to the file}}
> - Prices for pooled products are derived from a bill of materials as a curve over the
>   number of participants, so "the more who join, the cheaper" is computed, never typed.
> - Share cards are rendered server-side with satori + resvg, with proper RTL for Hebrew
>   and Arabic (harder than it sounds; bidi numbers inside RTL text are a trap).
> - There is an MCP server, so an agent can find a pool near you, join and sign on your
>   behalf — with the same consent checks as the UI.
>
> What's not solved: payments are {{status}}; the English surface is younger than the
> Hebrew one; discovery is a map, not a feed. Stack: SvelteKit 5, Strapi, Postgres,
> Node.
>
> Real numbers from the first pilots: {{case 1: needed N, got M, in D days}}; {{case 2}}.
>
> I'd love feedback on the state machine's edge cases (especially partial dropouts after
> activation) and on whether "no group decisions" holds up in your experience of
> organising anything.

**First comment (post it yourself, immediately):** the FAQ you expect —

- *Why not Kickstarter?* Kickstarter funds a creator's dream; here you sign a mutually
  binding deal with a supplier, and nobody is charged until the threshold.
- *Why not Groupon?* Groupon pushes discounts from the supply side and takes a heavy cut;
  here demand pulls the supplier in, and the pool belongs to the people in it.
- *What's open source?* The consensus/commitment engine (link). The platform is source-
  available at {{repo}}.
- *Who is this for first?* CSA farms, independent teachers, intentional communities —
  networks where one working case spreads on its own.

**Don'ts:** no emoji in the title, no "revolutionary", no asking friends to upvote, answer
every comment for the first 6 hours, concede valid criticism in plain words.

---

## 3. Product Hunt

**Name:** 1lev1

**Tagline (≤ 60 chars):** `Group buying, without the group chat`

Alternatives: `Nobody pays until enough people say yes` · `Threshold offers for real life`

**Description (≤ 260 chars):**

> Publish a threshold offer — "the farm box runs at 25 households by Friday". People sign
> individually; it activates only when enough did, atomically. No polls, no organiser
> burnout. Then describe any wish, and we assemble it from real people.

**Topics:** Marketplaces · Productivity · Open Source · Community · E-Commerce

**Maker's first comment:**

> Hi Product Hunt 👋 I'm {{name}}, and I built 1lev1 because every group purchase I've ever
> been part of died in a chat thread.
>
> The idea is small: things that only exist in volume — a weekly vegetable box, a workshop
> that needs eight people, a bulk order for the street — should not need a committee. So
> on 1lev1 there are no group decisions at all. Someone publishes a *threshold offer*
> (price, minimum, deadline), each person signs for themselves, and it activates only
> when enough people did — all in, or nobody charged.
>
> Three things I'm proud of:
> 1. **The share card.** Every pool link unfurls as "17 of 25 signed · 4 days left", so
>    sharing it *is* the recruiting. After you sign, the page hands you the message to send.
> 2. **The consensus engine is open source.** Co-ops and communities should never be
>    locked into a tool they can't take with them.
> 3. **It works in Hebrew, Arabic, English, Russian and Spanish** — right-to-left included,
>    which most tools in this space don't do.
>
> Real cases so far: {{case 1}}, {{case 2}}, {{case 3}}.
>
> What's next: {{payments / recurring boxes / supplier onboarding}}. I'll be here all day —
> tell me where the "no group decisions" rule breaks for you.

**Gallery (in order):**

1. The share card itself (1200×630) — a real pool, real numbers.
2. The pool page with the quorum bar at 7/10 and the share prompt open.
3. The celebration state at the threshold.
4. The demand map (`/demand`).
5. A wish page with Lev's breakdown into pieces.
6. The 60–90 s Remotion video: 0 → threshold → activated.

**Launch-day checklist:** post at 00:01 PT · maker comment within 2 minutes · the three
design partners each post their own comment with their numbers (ask them a week ahead) ·
reply to everything · one update at hour 12 with what you learned · no upvote asks.

---

## 4. Ten posts — X / LinkedIn / Mastodon

Rules from the plan: artifact-based (a screenshot, a real number, an architecture
decision), 2–3 a week, one main channel, mirrored to Mastodon and dev.to. Each post below
has an X-length version; the *LinkedIn* line says how to expand it. Attach the artifact
named in `[media]`.

**P1 — the hook**

> We removed the group from group buying.
>
> A pool on 1lev1 has no polls, no votes, no "who's in?". You publish a threshold offer,
> each person signs for themselves, and it only happens if enough did. Nobody pays before.
>
> `[media: share card of a real pool]`
>
> *LinkedIn:* add the story of the last group purchase that died in a chat thread, then the
> three rules (sign solo, activate together, nobody fronts money).

**P2 — the share card**

> Every pool link now unfurls like this in WhatsApp: "17 of 25 signed · 4 days left".
>
> Rendered on the server per language, right-to-left included. The link does the
> recruiting; the organiser does nothing.
>
> `[media: the card in a WhatsApp preview, Hebrew and English side by side]`

**P3 — the atomic rule**

> The one rule the whole engine is built on:
>
> At the deadline, either the minimum is met and everyone is in, or nobody is charged.
> Nothing in between. No "we're at 80%, let's go anyway".
>
> It makes signing a 10-second decision instead of a negotiation.
>
> `[media: the state machine diagram]`

**P4 — build in public: the number**

> First pilot: a {{farm / class / community}} needed {{N}} households for the season.
> Got {{M}} in {{D}} days, {{K}} of them from people sharing the link after they signed.
> Zero messages from the organiser. `[media: the pool page at activation]`
>
> *(Publish only with the partner's permission and real numbers.)*

**P5 — architecture decision**

> Prices for pooled products are never typed. The supplier describes the bill of
> materials; we derive price-per-participant as a curve. "The more who join, the cheaper"
> is computed, not promised.
>
> `[media: the price curve]`
>
> *LinkedIn:* explain why a typed price invites haggling and a derived one invites trust.

**P6 — RTL as an edge**

> Most group-buying tools cannot render Hebrew or Arabic. Ours started there.
>
> Lesson from this week: in RTL text "7/10" renders as "10/7". Numbers live in their own
> nodes now. Small thing, until it's your share card.
>
> `[media: before/after card]`

**P7 — the agent channel**

> "Find people near me who want a weekly vegetable box" → join → sign.
>
> 1lev1 has an MCP server, so your agent can do that with the same consent checks the UI
> has. Few tools in this space are there yet.
>
> `[media: 20 s screen recording]`

**P8 — the second layer (the wish)**

> After the pool, the wish: "A day off for my mum on her birthday." Lev breaks it into
> pieces — babysitter, lift, spa, dinner — and real people pick up a piece each.
>
> Describe it. We assemble it from real people.
>
> `[media: a public wish page]`

**P9 — open source as trust**

> The consensus engine behind 1lev1 is open source: {{repo}}.
>
> Because a co-op should never adopt a tool it can't take with it. State machine,
> exhaustive tests, no server required.
>
> *LinkedIn:* one paragraph on why lock-in is the wrong business model for the commons.

**P10 — the ask**

> We're setting up three real pools by hand this {{month}}: one farm, one teacher, one
> community. We do the setup and stay until it activates; you keep the numbers and the
> story.
>
> If you organise anything that needs a minimum number of people — reply.
>
> `[media: the empty pool page with "be the first"]`

**Mastodon notes:** same posts, no hashtags-in-sentence; add 2–3 hashtags at the end
(`#cooperatives #CSA #opensource`), alt text on every image (the card's text is the alt
text). The co-op fediverse (social.coop and friends) is the one place where P9 should go
first.

---

## 5. One-paragraph boilerplate (press / directories)

> 1lev1 is a platform for things that only exist in volume. A supplier or a neighbour
> publishes a threshold offer — a weekly farm box at 25 households, a workshop at eight —
> and people sign individually; it activates only when enough have, with nobody charged
> before. There are no group decisions by design. Behind it, an open-source consensus
> engine lets groups that *do* want shared decisions run them by consent. Built in
> Israel, Hebrew-first, available in English, Arabic, Russian and Spanish.
