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

Cut and still cut: sequences. Those are at `/old/` and none of it was
deleted.

**The manager's, the stakeholder's and the client's desks are not cut, and
this section used to say all three were.** `?as=` is still described below as
a prototype control, and it is the switch between four desks that all render
in full:

| desk | `?as=` | what it opens |
|---|---|---|
| Engy Saleh, BDR | default | the queue, campaigns, lists — the surfaces above |
| Lina Haddad, sales manager | `?as=lina` | Today and the diary, the deals board, the customer book, Financials |
| Sherif Amin, stakeholder | `?as=sherif` | the same, bounded by the product a campaign sells |
| Marit Okonjo, client | `?as=kestrel` | the same shell — Today, their diary with us, the campaigns we run for them — with their year a press away; `?eng=` picks which of the three they bought, and adds People where that one is a floor |

Financials, the odds ladder, funnel analytics, the campaign builder and the
meetings calendar are live behind `onBook()`, not `isMgr()` — a stakeholder
and a client answer yes to the first and no to the second. A caller reaching
one of them gets an honest answer rather than the manager's figures:
Financials says a caller has no book and points back, and `?on=deals`
resolves to the caller's own reading of the same tab.

**The client's desk subtracts rather than adds**, and two predicates carry
it. `seesCost()` refuses what the work cost us and who else pays us;
`seesGrade()` refuses how we rank an account and what else we would sell into
it. They are separate because they are two different rules, so a figure that
forgets one is a grep rather than a reading. The lists and the builder are
not narrowed but cut — their whole narrative is which supplier we asked and
what each one charges us in hit rate — and so are the notes, which are
authored-by-me and would ship empty.

**One of the four is a client, and they bought three things.** There were
three client desks for a while — one per thing bought — and the margin on
`DESKS` is why there is one now: three client desks are three FACES of one
reading. What differs between them was never the reading, it was the book.
So it is `?eng=` and a row of chips on the report, and `engagements` on the
deal carries the kind, the fee, the line, the floor and the promises, while
the deal itself carries only what is true of the relationship — a client does
not sign three different years.

`bookKind` is the split: `outbound` reads a pipeline and gets every surface
the manager works; `software` and `service` read a floor — people, scored
conversations, and no campaign anywhere; `all` is the overview, which has
the one pipeline this client has and both floors underneath it. So the
attainment bar, three of the four tiles, both cuts and the losses draw only
where there is a pipeline, and what stands in their place is the promise
ledger, which every book has, plus the twelve weeks or the three
engagements side by side.

**THE REPORT WAS THE WHOLE DESK, AND IT IS NOT ANY MORE.** Contacts, the
Diary and Campaigns read a pipeline and two of the three books have none, so
this desk drew three tabs reading zero and the repair was to give it the
report instead — no Today, no switcher, no rail door, and the only way to
re-scope it was the page you were already standing on. Three empty tabs is
an argument against those three tabs. It is not an argument for the one desk
belonging to somebody outside the company being the one desk that works
differently.

A client opens on a briefing now, like everybody else, and the row under it
is Today, the Diary and Campaigns on every book — plus People where the
chosen engagement has a floor. **The book ADDS a tab; it never takes one
away.** For one commit it did: a floor drew Today and People alone, on the
argument that the rest read a pipeline a floor has not got. `bookIds` is
keyed by the CLIENT, so there is one diary and one set of campaigns however
many things were bought, and the person reading the quality tool is the
same person with the same meetings in it. A chip that removes a control has
taken away a capability rather than narrowed a reading, which is the thing
this build does not do to a breakpoint and must not do to a scope.

**THE CLIENT IS IN NONE OF THE ROOMS WE BOOKED, AND SEES NONE OF THE
PEOPLE IN THEM.** Two readings that survived from the desks either side of
this one and were wrong on both counts.

Her diary held thirty-one prospect meetings and the page offered to brief
her for an eleven o'clock she was never going to — the engagement's own
line is "we find them and put them in a room with you, what happens in the
room is yours", and it is her sales people in the room. `clientMeets`
derives what she IS in: a kickoff at `since`, a check-in every month with
quarterly reviews on the third, each floor's go-live at `team.deployedAt`
weeks, and the conversation about next year five days before the term
ends. Nothing written down — move `since` or `term` and all of it moves —
and marked `free`, which is what keeps `unrecorded` off it: a review with
an account manager is not a meeting somebody here forgot to write up.
`hala` is the one row on `REPS` who holds the last of them, with a function
nothing filters on, so no count in the corpus moved.

And Contacts went with it. Fifteen named prospects, their call histories,
the stage each is at and a verb on every card: none of them is hers to
warm-call, and how many times we tried somebody before they answered is our
operation rather than her delivery. What she bought is answered in the
aggregate, on the report. So the campaign page drops the people on it, the
day-by-day of our calls and the button that starts the next one — the
brief, where it stands and what is in the way are the campaign; the rest is
the floor — and `parse` refuses `con` and `acc` the way it already refuses
the lists and the notes. The check is a sweep of every client surface
against the whole contact corpus: the only names left are the client's own
people on their own floor.

**AND THE SECOND PERSON ON THIS DESK IS NOT THE ONE DIALLING.** Taking the
people off a page does not take the voice off it. Every beat in What is in
the way was a move for whoever is about to call — ask for the job rather
than a name, this campaign gets through around two, say the same thing
twice and tell Lina what worked — with doors under two of them onto a board
this desk no longer draws. The measurement stays, which is what the block
is for; `gap` stays with it, because "Nothing agreed" is a finding and the
lead sentence reads the same list, so stripping it made the lead announce
that every reason had an answer agreed when three did not.

**AND A BLOCK THAT ONLY SAYS WHAT IS WRONG IS NOT A STATUS.** Taking the
beats out left four counts and four sentences about what is going wrong,
which reads as nobody doing anything on the one surface a client opens to
find out whether anybody is. `OURS` is `ANSWERS` said as a thing we do
rather than as an instruction to whoever is about to say it — a second
table, not a regex over the first — and every named reason carries one.
`gap` is not drawn on this desk: it means the campaign never wrote down
its own wording, not that nobody has an answer, and drawn it produced rows
reading "Open. We price it against what the work costs them today".

`wayLead` is the summary that replaces the claim: what stops a call and how
much of it, what comes back once one connects, whether we have an answer to
each, and whose campaign it is. It NAMES and never counts — three kinds
across four mentions is two denominators one word apart, which is the
mismatch `blockersOf` spends a paragraph on.

And `other` — "Something else", the bucket a reason lands in when nobody
filed it — is dropped from the client's copy of both the block and the card
that opens it, denominator included. On Kestrel's first campaign it is the
largest of the seven, so keeping the count and dropping the row would have
put "of 7 reasons" over a list adding to four.

The rest of the same sweep: the group captions, `campLead`'s deck (which is
`t.by === me().id`, so on this desk it always resolved to "you have not
called anyone on this campaign yet"), the card's three queue counts and its
Work it, the campaigns tab ranking by how much work is left, the pitch,
which ends on what to open on, the notes, which hold what went wrong last
time, the fifth-attempt rule, and a sentence pointing at cuts that are not
below. The check is the same shape as the names one — a regex of caller
verbs over every client surface — and it is worth re-running after anything
that touches campaign copy, because all of it is still drawn, unchanged,
one `?as=` away.

So `onFloor` — a team on the engagement, which `myDeal` nulls on the
overview, so there is no list of kinds to keep in step with the seed — adds
three things and subtracts nothing: the People tab, a clause in the day's
paragraph, and a block under the diary holding the three worst. The Start
strip follows the SURFACE rather than the book, the way Campaigns and Lists
already do: Today keeps the client's four verbs, and the floor's drill — a
person, a scored conversation, the goal costing the most — is on the People
tab's own strip.

The engagement chips live in `switcher` above the row, because they change
what the briefing and the year SAY rather than which tabs exist.
`floorPage` is a tab rather than a page with a way back on it, and the
report keeps every word it had, reached from the rail and the Start strip
and called Your year on the desk whose year it is.

`myYear` is the one derivation behind all of it, memoised per paint and
cleared with the rest of the money. The rail used to answer this question
with a stub — correct for a floor, silently zero for the six funnel
promises on the overview — and said 8 behind of 14 four hundred pixels from
a report saying 5.

**AND A LEDGER THAT ONLY MARKS THINGS BEHIND IS NOT A STATUS EITHER.** The
same repair as the campaign's obstacle block, on the page its owner opens
next: fourteen promises, five wearing a BEHIND pill, and not a word about
what is being done about any of them. `promDoing` is the line — how far
short (or OVER, where the promise runs down; `was` is the only field that
knows which way it runs), how long is left, and what is holding it where
the corpus produces a cause. Only on the ones we answer for: where a
promise moves at their end the group's heading says so, and a line from us
would be us taking credit for their afternoon.

**AND A CALENDAR CANNOT SAY WHETHER ANYBODY IS TURNING UP.** It draws one
month, and that is a question about a year: eleven months of this account
are eleven dots and September holds two. `diaryLead` reads `clientMeets`
over the whole term — the derivation the grid itself draws, so the count
and the dots cannot disagree — and says how many times we have sat down,
when the last was, and what the next one is about. What is coming said WHO,
which on this desk is our own account manager on every entry in the book;
it says what now, and `calNext` rows with no record behind them carry
`data-calpick` so pressing one opens the day it is on.

**AND THE FLOOR WAS A ROSTER.** Eighteen names in three rules with nothing
over them, which is the same shape again. The lead names the goal costing
the floor most and — the sharp half — how many of the people under the line
it is the SAME goal for: one goal under every one of the eight is an
afternoon with a trainer, eight different ones are eight conversations.

**The rows carry what breaks the pattern, not the pattern.** Drawn on every
row the per-person reading said "Survey promotion is costing them the most"
eight times under a lead that had just said it; a row speaks only where
that person's worst goal is not the floor's. On the quality tool that is
four of eleven. The person's page opens on the comparison its table cannot
hold — their lowest goal against the same goal across the floor — and a
conversation that lost its points on one or two goals names them rather
than counting them. `goalsFor` is the single sweep behind all four.

Who owns them is said ONCE, in the summary at the top. Three behind rows
each ending "and Lina Haddad owns it" is one name down one column. And the
cause has to belong to the promise it sits under: keyed on `team.` the
weakest goal landed beneath "sixteen hundred contacts a week", so the
volume promise was short because survey promotion passes on 59% of
conversations. One is how many we answer, the other is how well.
`weakestGoal` is the single spelling of that sweep, which three surfaces
were each doing their own way.

A promise on a floor is a promise to MOVE a number rather than reach one, so
it carries `was` — the baseline, set at signing — and reads down as often as
up. `promKept` is the one place that knows which.

`CLIENTS` HAS A LENGTH THAT IS LOAD BEARING. The seed deals a client onto
four campaigns in ten by picking out of it, so appending a row re-deals every
campaign and moves every figure on every client's desk. `CAMP_CLIENTS` is the
guard; the check is `BDR.db.camp.map(c => [c.id, c.client])` in the console,
and it is the one thing to run before and after touching that list.

Three client kinds, and `bookKind` is the only thing that knows: `outbound`
reads a pipeline, `software` and `service` read a floor. A floor's metrics say
which field on a scored conversation they average — `from` — and that is also
what the generator ramps by, because a second client is where a metric's NAME
used as a key stops being a name.

**Lambourne's claim is capacity, not a smaller payroll, and that is a decision
rather than a softening.** Knowledge's own account of the Nordwind rollout
sets the standard: reviewer headcount was unchanged, nobody was replaced, and
the story should never be told as though anybody was. So the fee sits beside
what the desk cost them to run themselves, the two numbers are nearly the
same, and there is no figure anywhere on that desk for a person who is no
longer there. It also keeps the build out of cost per ticket, headcount
avoided and FTE saved — unmodelled everywhere in this ecosystem, and not
things to invent for a customer's screen.

Four desks and three books means every question about a figure has six
answers. Check all of them, and on the client's check what is NOT there: a
sweep over 45 of its surfaces, one per engagement, is the only reason to
believe it.

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
