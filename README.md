# AiMY Sales — the BDR build

One role, one job. A BDR opens this and sees two things: **people to call**, and
**the campaigns they are on**. Everything else was cut, and comes back when the
role that needs it does.

The previous build is at **`/old/`** and still runs. Nothing here edits it.

```bash
python devserver.py 8098      # then open http://localhost:8098/
node assets/audit.js          # before every commit
```

Do not serve this with `python -m http.server`. The cache-busting stamp lives
inside `index.html`, so a cached document asks for the old assets for ever;
`devserver.py` exists to send `no-store` on HTML and nothing else.

---

## What a BDR does here

**The heading is the switcher.** The block title reads Calls · Campaigns ·
Lists — the one you are on at heading weight, the other two quiet beside it and
pressable. There is no navigation column and no control above the heading: a
product with three surfaces does not need a row of chrome to say which one you
are on. The rail carries the AiMY reading and nothing else.

| surface | url | what it is |
|---|---|---|
| Calls | `/` | the ranked queue, cut six ways, paged |
| Campaigns | `?on=camps` | the ones you are on, paged |
| Lists | `?on=lists` | the ones you built, and the way to build another |

Under those sit the three records: one campaign (`?camp=`), one person
(`?con=`), one list (`?list=`).

**A cut is a step.** The queue is cut four ways and every one of them is a
place on the ladder, so there is no second vocabulary to learn. They sum to the
whole, because a person stands on exactly one step.

| cut | the step it is |
|---|---|
| Callbacks | they asked to be called back, and the date has come |
| New | nobody has called them |
| No answer | called, nobody picked up |
| Answered | you got them, and there is no meeting yet |

Once a meeting is booked they leave the queue — the BDR's part is done until it
happens, and a caller working a list does not want the people they have already
closed in it.

**The queue is cards, three across.** A row held a name, a line and a button —
enough to be ranked by and not enough to prepare with, so every call began by
opening the record to find out who this was. A card carries the step and the
campaign, who they are and where they sit, how big the company is, why they are
on this step, what was said last time in the words it was written in, and the
number. Every card does the same thing, because on this surface there is only
one thing to do, and it says **Call**. It briefly said "Say what happened" on people whose
meeting had passed: a second verb, for a second job, in the middle of a list you
are dialling down. The call logs the touchpoint; a separate step to report the
same call is the step this build exists to remove.

**One worklist per surface, paged. Everything else is context, capped.** Fifteen
is a screenful: call through it, press once for the next fifteen. A thousand
people behind a scrollbar is not scale, it is an endless list — you cannot tell
where you are in it, cannot come back to the same place, and never finish
anything.

The worklist/context split is not cosmetic. Two pagers on one page either share
a page number or need two, and both are worse than deciding which of the two
lists is the reason you came. So a campaign pages its queue and shows the last
eight things that happened; a person shows their last eight calls; the builder
shows the first eight matches. Every one says what it is showing of what:

```
1–15 of 1,015 people · page 1 of 68
14 campaigns, all of them here
The last 8 of 436 calls
The first 8 of 3,000 matches
```

"The last 8" and "the first 8" are different claims — a feed is newest-first, a
search result is not ordered at all — so the footer is told which end it shows
rather than guessing.

**A call** is a shell region beside the page, not a modal, so you can open the
person or read the campaign's pitch while it runs. Four states: `ready` shows
three lines of preparation and waits, **Start** begins `connecting`, the clock
starts at `live`, and `logging` is where AiMY says what it heard. Telephony is
fixture — a transcript grows a line at a time from a script chosen by the
person's own hidden `fate`, so a demo walked twice tells the same story twice.
The one real handoff is the `tel:` link on the record.

**Logging is a sentence, not a form.** Seven outcomes on one always-visible row
with the one AiMY read already lit, a line to type underneath, and a sentence
saying what pressing Log will do. The note is read as you type and **overrides
the transcript per axis** — read together, a gatekeeper heard on the call would
outrank *"actually I spoke to her"* for ever, because the lexicon ranks by
specificity and not by recency.

**A list** is how anyone new reaches the queue. Describe who to look for, the
sources answer, and what comes back is the list. Two presses to a list, a third
to put it on a campaign.

---

## The ladder

Where one lead stands with this BDR. **It is a stored field**, moved only by
`moveFor` (a call) or `setCheckpoint` (a one-press control).

```
not-called → no-answer → callback → answered → meeting-set → showed-up → interested → handed-over
                                    exits: declined · wrong-number · do-not-call
```

The V3 build derived every status from the touchpoints, which made status
uncontradictable and unsettable. A BDR ladder cannot work that way: *showed up*
and *interested* are things a person observed, and no call record implies them.
Those four steps are one press each on the record, always visible, and every one
is undoable.

A call never moves a lead **backwards**, and never climbs out of an exit — only
Undo does that. Past `handed-over` it stops being a BDR lead, which is why the
ladder ends there.

**One write, two places it shows.** A touchpoint and a step are the whole of it;
everything a campaign reports — how many are left to call, callbacks due,
meetings set, its called tally, its feed — is derived from those two, so a person's
record and the campaign they are on cannot disagree about what just happened.

---

## How it is built

`index.html` is the V3 document with four asset paths changed. `assets/sales.css`
is copied across whole. **The shell, the components, the background, the rail,
the briefing card, the queue row, the toast and the canvas are the ones that
already existed** — this is a new process over the existing design, not a new
design.

| file | what it is |
|---|---|
| `assets/bdr.js` | the whole product: corpus, store, derivations, surfaces, call flow |
| `assets/bdr.css` | an **appendix**, not a stylesheet — only what did not exist before |
| `assets/sales.css` | the V3 stylesheet, copied, unedited |
| `assets/aimy-ds.css` | the design system, copied, never edited |
| `assets/audit.js` | eight checks over what breaks silently here |

If `bdr.css` starts redefining what `sales.css` already says, that is the
mistake: delete the rule and use the one that is there.

### The store holds the delta, not the corpus

Six thousand people and twenty-one thousand calls serialise past the ~5MB
localStorage quota, so a full save would fail and fail late. The corpus is
regenerated from one seed on every load (about 390ms for the whole navigation),
and only **what you changed** is persisted. A moved checkpoint costs 147 bytes.
Reset is one `removeItem`.

Seed dates are relative to the real clock, so a link opened next month still
shows callbacks due today. Ids come from indices and never from dates, which is
what lets a stored delta survive the corpus being rebuilt on a different day.

Keys: `aimy-sales-bdr:db:v1`, `aimy-sales-bdr:ui`. The theme is the shared
library's `aimy-ds-theme`.

### The windowed list

Every list is a `vlist`: the host is as tall as the whole list, the rows inside
it are positioned by arithmetic, and about thirty exist at a time. Measured on
six thousand rows: 362 DOM nodes against 36,176.

**It measures in layout pixels, not visual ones.** The shell carries `zoom` on
`<body>`, so `getBoundingClientRect` returns layout pixels times the UI scale
while a row height in CSS does not. Mixing them puts the window wrong by a
*factor* on every screen that is not exactly the 1536 anchor. `offsetTop`,
`scrollTop` and `clientHeight` are all layout pixels — which is why
`.page-scroll` is positioned: it is the terminus of the `offsetParent` walk.

### Keys

`Enter` means the obvious next thing at every state — dial the next one, start
this one, hang up, log it and move on. `1`–`7` pick an outcome and end the call
if it is still running. `N` jumps to the note, `S` skips, `Esc` closes the
innermost thing that is open, `/` puts the cursor in the composer, `j`/`k`/`o`
move through the list and open a row.

---

## What is cut, and what came back

Cut and still cut: exec, client and stakeholder surfaces; sequences. Those
are at `/old/` and none of it was deleted.

**The manager's desk is not cut, and this section used to say it was.**
`?as=` is still described below as a prototype control, and it is the switch
between two desks that both render in full:

| desk | `?as=` | what it opens |
|---|---|---|
| Engy Saleh, BDR | default | the queue, campaigns, lists — the surfaces above |
| Lina Haddad, sales manager | `?as=lina` | Today and the diary, the deals board, the customer book, Financials |

Financials, the odds ladder, funnel analytics, the campaign builder and the
meetings calendar are all live behind `isMgr()`. A caller reaching one of
them gets an honest answer rather than the manager's figures: Financials
says a caller has no book and points back, and `?on=deals` resolves to the
caller's own reading of the same tab.

Two desks means every question about a figure has two answers. Check both.

## The customer book

`?on=deals&q=won`. A deal that closed used to fall out of the product — the
Won chip held the three that happened to close inside this quarter, every
card in it read "Signed. Nothing else in the range fits them yet", and it was
the one chip in the row that led nowhere.

**A subscription is a fact on the account, not a deal.** A deal is something
you are trying to close and a subscription is something already running, and
filing the second as the first makes the forecast count money it banked two
years ago. Nothing in Financials reads them and attainment does not move. One
account in six carries one, fitted to sector off `IND_FIT`, dated up to three
years back, priced off the rate card the pipeline uses — 31 customers, €1.9m
a year, a quarter of them already on a second thing. `subsAt` unions those
with the won deals at the same company, so nothing downstream has to ask
which kind of customer it got.

**The cut is not windowed.** It showed this quarter because won deals were
all the product remembered. A company that signed three years ago is exactly
as much a customer as one that signed in March.

**Every event carries its own consequence, and the offer falls out of it.**
`a.signal` — "raised a Series B" — argues for nothing in particular, which is
why the thing beside it had to be a ninety-day clock: a calendar reminder
wearing the costume of an insight. The twenty-four events in `NEWS` each say
what happened, what that means for them, and which of the eight it therefore
makes a case for. €40m to open in Germany and Poland means a second language
and a second time zone on a desk they staff themselves, which means managed
support. `openingAt` joins that against the book and has three answers, two
of which are not a sale: if the news points at something we already run for
them it says so, and if nothing fits it says that too.

The book is ranked by what moved rather than by what it pays — a list ranked
by revenue has a top that never changes.

**The chip is not one of the six.** The other cuts narrow the 48 deals and
sum to All; this one is 31 companies that are not among the 48 at all, so it
sits past the run button behind a rule, carries the company glyph, and is a
step up in ink and weight. Its badge is how many customers moved, and it
draws only when there are any. On a campaign the seventh chip is still Won
and still means the deals that campaign closed.

A row on it is a **company**, because three people at one customer do not
have three contracts. That is the only thing that differs: the switcher, the
search box, the chips and the pager are the same components in the same
places, and only the body swaps.

## Known, and not this build's

`aimy-ds.css:627` sets `.evidence-pill .val { color: #fff }` — a hard-coded
white the design system's own Level 1 gate bans. In light mode the pill's ground
is near-white, so the number on every rail card is white on white. The V3 build
has the same line. It is overridden in `bdr.css` §9 rather than edited in the
library, and it belongs in the library's gap register.

## Traps this repo has already sprung

- **The shell eats backslashes**, quoted heredocs included. `commas` lost the
  escapes out of its regular expression twice; the damaged form is still *valid*
  and matches nothing, so every number silently lost its separators with no
  error anywhere. Use the editor, not the shell, for anything with a backslash.
- **The `?v=` stamp makes assets immutable.** Change a file without bumping it
  and the browser keeps serving the old one. Force a revalidation, or bump.
- **A hidden browser pane reports a zero viewport**, which collapses the height
  chain and leaves the scroller unbounded — a windowed list then measures as
  broken when the measurement is what is broken.
- **`.s-home` is a two-column grid** above the anchor width. A block without
  `.s-block-wide` lands in one column and leaves a hole where the other should
  be, which reads as a layout bug rather than a missing class.
- **The audit checks whether an attribute is drawn, not whether a value is.** A
  `data-start="lists"` branch sat in the router with nothing rendering that
  value, and the whole Lists surface was unreachable, with the audit green.
