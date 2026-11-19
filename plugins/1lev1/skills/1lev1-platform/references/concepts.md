# 1lev1 concepts

Use these words with the user, glossed once. Getting them wrong makes the agent
sound like it has never seen the platform.

## Entities

| Term | Meaning |
|---|---|
| **rikma** (רקמה) | A partnership. The unit of collaboration - members, missions, resources, money. Sometimes rendered "project" or "embroidery" in older strings. |
| **mission** (משימה) | A piece of committed work inside a rikma. Hours are logged against it. `mesimabetahalich` = a mission in progress. |
| **task / act** (מטלה) | A smaller item hanging off a mission. Can arrive from an external system through the tasks API. |
| **haluka** (חלוקה) | A profit-split agreement: who receives what share of a given income, signed by everyone affected. |
| **sale** | Income recorded for a rikma. Only counts toward balances once the person holding the money has confirmed they hold it. |
| **moach** (מוח, "brain") | A rikma's management area on the site: members, missions, votes, money. |
| **lev** (לב, "heart") | The user's personal home: everything waiting on them across all their rikmas. |
| **consensus** | The separate discussion space where a contested decision gets talked through rather than voted down. |

## The consent model

This is the part an agent most often gets wrong.

- **There is no unilateral "no".** A member facing a proposal may approve it,
  open a discussion, or counter-propose - but not veto. "I got nothing" is
  expressed as a counter-proposal of amount zero, not as a rejection.
- **Silence is consent, on a clock.** Every open proposal carries the rikma's
  response time. If nobody answers within it, the standing version is approved
  automatically. A counter-proposal restarts the clock.
- **Consent scope varies.** Most decisions are rikma-wide. Some are bilateral -
  only the two people actually affected sign. Do not tell a user that "everyone
  has to approve" without checking which kind of decision it is.
- **Hours are ownership.** Approved hours on a mission become the contributor's
  share of the rikma's value. This is why a mistyped timer entry is not a
  cosmetic error.
- **Money moves only when confirmed.** A sale whose holder has not confirmed, or
  a payment not yet marked confirmed, does not count in anyone's balance.

## What this means for you

When the user asks you to "just approve it", "vote yes for me", or "add Dana to
the split", you are being asked to act inside another person's consent. Prepare
it, show it, and let the human press the button on the site.
