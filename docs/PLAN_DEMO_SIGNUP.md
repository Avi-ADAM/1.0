# PLAN — Personal demo (the third path off the home page)

## Why

The home page had two doors: **log in** and **agree & register**. Both assume a
decision has already been made — the first that you're in, the second that you
want to be. The largest group arriving on the page is neither: they've read
about a profit model they've never seen before and want to understand it before
they commit to anything.

"Contact us" is the usual answer and it's the wrong one. It promises nothing
specific, so it converts nobody and it tells us nothing about who wrote in. A
**personal demo** promises a defined thing in a defined amount of time, which is
why every entry point carries the same line next to it: *20 minutes, no
commitment*.

So: a third path, deliberately styled a step below registration — it is for
people who haven't decided, not competition for people who have.

## The flow

```
track  →  mode  →  (watch | form)  →  thanks
```

Two short questions before the form, on purpose. Opening a calendar on the
first click is the friction that kills a demo, and by the time we ask for
contact details the person has already told us what the demo should be about.

| step | question | why it's there |
|---|---|---|
| `track` | idea · existing partnership · service provider · just curious | makes the demo relevant, and segments the lead |
| `mode` | fix a time · **drop in when it suits me** · call me back · watch a recording first | four different levels of commitment, not one |
| `form` | name + (email **or** phone) + optional goal + optional preferred time | the minimum that makes the call happen |
| `thanks` | confirmation, meeting link, WhatsApp, "meanwhile, look at the active rikmot" | leaves them with something to do |

`recorded` reuses the existing home-page video (Hebrew only for now); where
there's no recording to show, the option isn't offered at all.

## Drop-in meetings — the magik-meetings tie-in

"Book a slot" is itself a commitment, and for someone still deciding it's the
one that loses them. The meetings app (`Avi-ADAM/magik-meetings`) already has
the missing piece: **guest mode**, reached through a signed invitation link,
with no account and no login.

So `mode: 'flexible'` opens a `Pgisha` for the lead up front and mints a guest
link to it (`src/lib/server/demo/demoMeeting.ts`). They walk in when they want;
the coordination task tells the team a room is waiting.

The token format is shared verbatim with the meetings app — `guestInvite.ts`
here already *verified* those tokens (for importing an invited meeting after
registration) and now **mints** them too. Nothing had to change in
magik-meetings: `/meeting/invite/[token]` verifies the signature, takes a
display name, sets the `guest_info` cookie and lets the guest into
`/meeting/[id]` without being a participant.

⚠️ `GUEST_INVITE_SECRET` **must be identical in both apps** or the link won't
verify.

## Follow-up is work, not a note in an inbox

Every demo request opens **two unassigned Acts in the central rikma**
(`src/lib/server/demo/centralRikmaTasks.ts`):

1. **coordinate** — reach the person, agree on a time. Due in 3 days: a
   coordination task with no due date is exactly the task that rots while the
   lead waits for a reply.
2. **the call** — hold the 20-minute demo. No due date; that's whatever the two
   of them agree on.

They're separate because they want different people: coordination is short and
anyone can take it, the call wants someone who can actually walk through the
system.

**Unassigned is the point.** With no `my`, no `assignedUserId` and no roles,
`createTask` returns an empty `notifyUserIds`, and its notification rule falls
back to the project's members — so every relevant member hears about the lead
on every channel they have set up, and whoever is free takes it. Nobody is
silently made responsible. (Promoting an Act into a full open mission is a
separate feature arriving shortly; this deliberately doesn't pre-empt it.)

Creation goes through `actionService.executeAction('createTask', …)` rather
than a raw mutation, precisely so the notification fan-out is the same one a
task created inside the app gets. `/api/demo` is anonymous, so the acting
member comes from `DEMO_HOST_USER_ID` with the admin token standing in for
their JWT — the same shape `/api/v1/actions` uses for API-key traffic. That
member **must belong to the central rikma**, since `createTask` enforces
`projectMember`.

## Storage

New Strapi collection **`demo-request`** (repo `1.0b`,
`src/api/demo-request/`), modelled on `site-report`:

| field | meaning |
|---|---|
| `name`, `email`, `phone` | contact. Name is required; **one** of email/phone is enough |
| `track` | `idea` \| `partnership` \| `provider` \| `curious` |
| `timeMode` | `scheduled` \| `flexible` \| `callback` \| `recorded` |
| `goal`, `preferredTime` | free text, both optional |
| `lang`, `page`, `source` | where they came from (`fpage` \| `bot`) |
| `status` | `new` → `contacted` → `scheduled` → `met` → `closed` |
| `meetingId`, `meetingLink` | the drop-in meeting, when one was opened |
| `coordActId`, `callActId` | the two unassigned central-rikma Acts |
| `userId`, `notes`, `scheduledAt` | admin-side |

One row shows the whole state of a lead.

## Entry points

| where | what |
|---|---|
| home audience strip | fourth chip — "I want to understand before I start" |
| home, right under the live demo (`#personal-demo`) | the panel with the main CTA |
| desktop float buttons | third button, below login and register |
| mobile CTA block, final CTA | third button, outlined rather than filled |
| the bot | three opening buttons: personal demo · start a rikma / sign up · I have a question |

Login stays out of the bot's opening buttons — it belongs in the header, where
someone who already has an account looks for it. It's offered as a follow-up
line after "start a rikma".

## Server

`POST /api/demo` — open, no auth, mirroring `/api/report` (an anonymous
visitor asking for a demo is exactly the intended caller):

1. for `flexible`, open the meeting and mint the guest link;
2. save the `demo-request` row;
3. open the two unassigned central-rikma Acts (which notify the rikma);
4. write the task ids back onto the row;
5. Telegram the team.

Only step 2 is fatal. The lead is the thing that must not be lost, so
everything else is best-effort and reports back in a `warnings` array.

The bot reaches the same endpoint through `requestDemoTool`
(`src/mastra/tools/requestDemoTool.ts`), with identical body and
`source: 'bot'` — so a lead filed in conversation is the same lead.

## Configuration

| env | effect when unset |
|---|---|
| `DEMO_CENTRAL_PROJECT_ID` | no central-rikma tasks are created (`warnings: ['tasks:not_configured']`); the lead is still saved |
| `DEMO_HOST_USER_ID` | same — no tasks, since `createTask` needs an acting member. Also leaves the drop-in meeting belonging to nobody, so it shows in no team member's meeting list. **Must be a member of the central rikma.** |
| `MEETINGS_URL` | no drop-in link is minted; the request falls back to a callback |
| `GUEST_INVITE_SECRET` | dev fallback is used — links won't verify against a production meetings app |
| `DEMO_MEETING_TTL_DAYS` | defaults to 14 |
| `VITE_WHATSAPP` | the WhatsApp shortcut on the thank-you screen isn't shown |

Everything degrades to "the lead was captured and the team was told", which is
the floor this feature must never fall below.

## Open follow-ups

- The thank-you copy says the meeting link is also on its way by email; wiring
  that email (via the existing `src/lib/components/mail/*` path) is not done yet.
- `status` transitions are admin-side only — there's no UI for the team to move
  a lead from `new` to `contacted`; the central-rikma tasks carry that state in
  practice.
- Promoting one of these Acts into a full open mission is a platform feature
  landing separately. When it does, nothing here needs to change — the tasks are
  ordinary Acts and will be promotable like any other.
- Recorded-demo option is Hebrew-only, following the existing home-page videos.
