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
a prototype control, and it is the switch between five desks that all render
in full:

| desk | `?as=` | what it opens |
|---|---|---|
| Engy Saleh, BDR | default | the queue, campaigns, lists — the surfaces above |
| Lina Haddad, sales manager | `?as=lina` | Today and the diary, the deals board, the customer book, Financials |
| Sherif Amin, stakeholder | `?as=sherif` | the manager's reading bounded by the product a campaign sells — read, not worked: request a campaign, pass on a lead, join a deal, and what buyers say about the product |
| Marit Okonjo, client | `?as=kestrel` | the same shell — Today, their diary with us, the campaigns we run for them — with their year a press away; `?eng=` picks which of the three they bought, and every figure on the desk is read out of that one |
| Rami Fahim, CEO | `?as=rami` | every desk's figures at once, read across the three managers — Today, Contacts, the diary of the deals he sits on, Campaigns, Lists, and Financials with a Managers cut — and four verbs: assign to a manager, assign a campaign, join a deal, ask AiMY |

**The CEO's desk reads all of it and operates none of it.** `isWhole()` is the
reading: the book is `DB.byMgr` read whole, the same index the managers read,
so the company's total and the sum of its managers cannot disagree, and the
target is the eight product lines added up, €900k a quarter (the audit checks
that it is still three managers at `TARGET_QUARTER`). `works()` is the
refusal: no phone, no stage moves, no closing, no running or editing a
campaign, no crews, no sourcing — gated where each verb is drawn and again at
its handler.

His one verb is **Assign**, on a campaign request, a connection of his, a
contact nobody holds yet, and a deal another manager holds — that manager is
told in their bell. It is a menu of every manager with what they already
carry, and beside it AiMY's suggestion as a fact the reader can check with
its own press: "Lina holds the most QA and test automation deals, 4 of them.
Assign to Lina". Every assignment is undone from the toast. Managers still take unassigned requests
themselves. **Join it** puts him on a deal (`c.joined`, not the crew): its
meetings land in his diary with Prepare me, the manager is told, and "Where
you are needed" suggests at most three and stops at eight open ones. The
stage stays the manager's.

**What he sends out comes back, in his bell.** A line when something he
assigned moved this week, one when something has sat three days untouched or
was handed back, and one when a deal he sits on moves, wins or loses. There
is no block for it on his Today. AiMY's pick passes over a
manager carrying more than twice the average open deals, and when two thirds
of his last five on a line went to one manager it suggests that manager and
says it is his own pattern. When he takes the pick, the reason travels with
the item (`givenWhy`) and the manager reads it: "The reason: you hold the
most QA and test automation deals, 4 of them." Two assignments are dealt into
the seed (`seedGives`) so the follow-up has something to show.

Everything on the desk is said in words he would say out loud — "€612k of
€900k", "AiMY expects €57k more" — and where a shared sentence failed that
rule it changed on every desk rather than growing a CEO dialect. What he does
not get is somebody else's product: how each person performs is AiMY QA's,
delivery cost per client is AiMY Finance's, and targets stay finance's.

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
is Today, the Diary and Campaigns on every book. **The book ADDS a tab; it
never takes one away.** For one commit it did: a floor drew Today and People
alone, on the argument that the rest read a pipeline a floor has not got.
`bookIds` is keyed by the CLIENT, so there is one diary and one set of
campaigns however many things were bought, and the person reading the
quality tool is the same person with the same meetings in it. A chip that
removes a control has taken away a capability rather than narrowed a
reading, which is the thing this build does not do to a breakpoint and must
not do to a scope.

**THE CALLER HEARS WHAT BECAME OF HER HAND-OVERS.** A lead she handed over
left her queue, her cuts and her day, and only a decision ever came back.
Her bell now says when one moves, and where it stands, per lead and never as
a score (`myHandovers`, `handoverNow`): met and at which step, a meeting
booked or gone unwritten. There is no block for them on her Today — the page
she opens is the queue. The manager's "New to you" now includes her
hand-over the day it lands. After the hand-over the phone is the manager's:
the quiet Call on a handed-over record is gone, and `startCall` refuses it.
And a list put on a campaign is put on one she works, with the menu saying
how many of the people fit its market (`putFit`) and the campaign's owner
told in their bell.

**THE MANAGER HEARS WHAT ARRIVES, AND SEES THE CLIENT SHE ANSWERS FOR.**
Every other desk sends work to the sales manager, and none of it rang when
it landed. "New to you" in her bell says who sent what since yesterday — an
assignment from the CEO with its reason, a lead a client or a stakeholder
passed on, a request somebody sent. The clients she is account manager for
are read as their own desk (`asClient`, cached until the book changes): their
meetings are in her diary at the hour theirs gives, the promises we answer
for ring when they are behind, and Prepare me on a client meeting is the
client's brief said from our side of the table. **Hand it back** is her
answer to an assignment she cannot carry: a request goes back to waiting, a
lead stays with her flagged until the CEO moves it, and his bell says why,
in her figures. And a lead with a meeting booked is no longer counted as
never warm-called (`unwarmed`).

**THE STAKEHOLDER READS HIS PRODUCT AND WORKS NONE OF IT.** His desk was
the manager's narrowed to AiMY QA, verbs and all: he could call Hazem's deal,
close it as won or lost, write up a meeting he was not in, build lists and
spend enrichment on them, with nobody told. `reads()` is what he shares with
the CEO — `works()` is its refusal, and every sentence that says whose a
deal is, or that the caller's part ends, reads it — while `isWhole()` stays
the CEO's for the company, the managers and Assign. His verbs are Request a
campaign, Add a lead, Write the ask, **Join it** on a deal for his product
(the manager is told, the meeting lands in his diary with Prepare me), and
Ask AiMY. And his Today has the reading only his desk exists for: **what
buyers say about AiMY QA** — the reasons given on calls across every campaign
selling it (`lineVoice`), which campaign raises each most, and what was lost
on it this period.

**WHAT THE CLIENT GIVES US COMES BACK TO THEM.** A lead they add goes to
the manager on their own campaign that fits, on that campaign (a
stakeholder's goes to AiMY's pick); it used to be saved with the client as
its manager, where no desk showed it. `givenBy` marks it, and "People you
passed on" on Today says whether the manager has been in touch — never the
stage, which is our pipeline — with a bell line at three days untouched.
Their requests ring when one is assigned, when it starts, and when nobody has
picked it up in three days (`askNow`). And their meetings get a brief:
`clientPrep` is their side of the table — the year, whose each miss is, what
they asked for, and the questions worth putting — reached from Today, the
bell, and the year page, which now names the renewal meeting it asks for.

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

So a floor book adds nothing to the row either, and for a while it added
four: a People tab over a roster of named agents, a person's page under
that, one scored conversation under THAT, and a block on Today holding the
three worst. **SEE "WHERE THE PRODUCT ENDS" BELOW.** All of it is AiMY QA's
and all of it has gone there. `onFloor` went with it; the engagement is
still folded over the deal by `myDeal`, which is what every figure on this
desk is read through.

The engagement picker lives in `switcher` beside the row, because it changes
what the briefing and the year SAY rather than which tabs exist. The report
keeps every word it had, reached from the rail and the Start strip and
called Your year on the desk whose year it is.

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
knows which way it runs) and how long is left. Only on the ones we answer
for: where a promise moves at their end the group's heading says so, and a
line from us would be us taking credit for their afternoon.

It carried a cause too, and only one survives — an outbound promise short
because some of the people we found were never called, which is our own
queue unworked. A floor promise got "survey promotion passes on 60% of
conversations", the best sentence this block ever produced, and it reads a
breakdown OF the quality score out of a library of seven CR-codes. See
below.

**AND THREE CARDS ARE NOT AN ANSWER TO "ARE THESE WORKING".** The grid says
where each campaign is one card at a time and leaves the reader to hold
three of them in their head. `campsLead` is two aggregate sentences off
derivations the cards already draw: how many are behind the pace they need
and what the worst wants a week, and the one thing most in the way across
all of them — aggregated by NAME, because a stop is the same stop on three
campaigns and the denominators add. What we do about it stays on the cards
and the campaign pages, where the persona it turns on is the right one:
three campaigns ask reception for three different job titles.

**AND A CALENDAR CANNOT SAY WHETHER ANYBODY IS TURNING UP.** It draws one
month, and that is a question about a year: eleven months of this account
are eleven dots and September holds two. `diaryLead` reads `clientMeets`
over the whole term — the derivation the grid itself draws, so the count
and the dots cannot disagree — and says how many times we have sat down,
when the last was, and what the next one is about. What is coming said WHO,
which on this desk is our own account manager on every entry in the book;
it says what now, and `calNext` rows with no record behind them carry
`data-calpick` so pressing one opens the day it is on.

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

**KESTREL'S PIPELINE BOOK IS AiMY TALENT, AND A HIRING PIPELINE IS A
PIPELINE.** It was "Outbound", which names the direction we dial in on the
desk of somebody who does not dial, and then "Managed lead generation",
which is worse: finding and qualifying people is what AiMY Sales IS, so a
contract listing it put the product the reader is standing in on the
invoice beside two others. Kestrel sell test automation and engineering
teams — people are the thing they ship, and hiring them is the constraint
on the rest of the contract.

`kind` stays `outbound` and `k` stays `reach`: the first is what
`onPipeline` reads, which is what gives the book a ladder, campaigns and a
board, and the second is what `?eng=` keys off. Neither is a word anybody
sees. The ladder's words come off the engagement beside `metrics`, as
`fn: { contacted: 'Approached', met: 'Interviewed', won: 'Hired' }`, folded
over `BUYER_FN` so naming three stages leaves the other four alone — and
`buyerBrief` and `promDoing` read the same table, so the sentence and the
picture cannot come to different words for one stage.

New promise keys where the SHORT name had to change, because `PROM_SAY` is
keyed by `k` and three other clients read `met`, `found` and `arr` out of
it. `found` keeps its key: "people we could reach" is the same sentence
about a candidate as about a prospect.

**AND `arr` WAS HOLDING UP THE WHOLE MONEY APPARATUS.** `targetFor` reads
that promise, and a hiring engagement has none — nobody signs revenue off a
hire — so the attainment bar drew booked against zero: "€65k of €0 — 0% of
target", both markers at `left: 0%`, one tile saying the target was already
met and the next saying 0% of it with 98% of the time gone. One zero, four
voices. The margin over that bar was already right — *a bar with no target
is a bar with nothing to say* — it just tested for a PIPELINE instead of for
a target. It asks `a.target` now, which is the number it would print.
`floorFigs` sorts on what the book HAS for the same reason: its three-tile
branch says "was X at signing", and `was` is a baseline only a floor promise
carries.

**AND A CLIENT DOES NOT SCOPE TWICE.** `by` switches the money between what
spent it and what earned it, which is right on the desk it was built for,
where nothing else scopes the page. This desk has the engagement picker in
its header and that rescopes every figure rather than one section, so two
controls answering "which slice am I reading" is the reader holding two
axes at once. Refused in `parse` beside `deals` and the lists, so a
bookmarked `?by=svc` cannot reach it either.

**The `svc` half was also putting our cost on their screen** — its campaign
rows read "86 days left · €881 cost", which is what running that campaign
costs US, on the desk whose whole line is that a client pays a fee and not
a floor. **THE SWEEP THAT CHECKED THIS WENT OVER SURFACES, AND A FIGURE TWO
PRESSES INSIDE A CUT OF A SECTION WAS NEVER ON THE LIST.** That is the
lesson worth keeping: a client-scoping check has to enumerate the STATES of
a surface, not the surfaces. The figure is gated behind `seesCost` at its
own site as well.

**Lambourne's claim is capacity, not a smaller payroll, and that is a decision
rather than a softening.** Knowledge's own account of the Nordwind rollout
sets the standard: reviewer headcount was unchanged, nobody was replaced, and
the story should never be told as though anybody was. So the fee sits beside
what the desk cost them to run themselves, the two numbers are nearly the
same, and there is no figure anywhere on that desk for a person who is no
longer there. It also keeps the build out of cost per ticket, headcount
avoided and FTE saved — unmodelled everywhere in this ecosystem, and not
things to invent for a customer's screen.

Five desks and three books means every question about a figure has seven
answers. Check all of them, and on the client's check what is NOT there: a
sweep over 45 of its surfaces, one per engagement, is the only reason to
believe it.

## Where the product ends

**A ROSTER OF NAMED AGENTS IS THE QA PRODUCT.** For several commits this
desk drew one and got better and better at it: twenty-four people in three
rules worst first, a lead naming the goal costing the floor most and how
many of the people under the line shared it, rows that spoke only where
somebody's worst goal broke that pattern, a person's page comparing their
lowest goal against the same goal across the floor, and under that one
conversation with a verdict and a reason per goal. Every one of those was a
good reading. None of them was this product's.

AiMY QA already held all three levels — `agent-scorecards.html`,
`goal-browser.html`, `manual-audit.html` — and its own README reserves the
word "goal" for exactly these evaluation goals and forbids a blended metric
with no provenance. So nothing here was a capability to lose. It was one to
stop having twice, in two places that would drift.

**THE LINE IS THE VERB, AND ON THIS DESK THE VERB IS BUYING.** Sales answers
what the year cost and whether the promises held. QA answers how a
conversation went and what to say to the person who had it. A client
standing in Sales asking which CR-code is costing them the most is asking a
question this surface cannot follow up: there is nothing here to open, no
record to show the working, and a cause with no evidence under it is the
one thing this desk exists not to do. The same test the client shell was
drawn by — a surface belongs to whoever does the verb on it — and it cuts
the other way as well as towards.

**WHAT STAYS IS THE CORPUS, BECAUSE IT IS THE EVIDENCE.** `floorOf` still
generates a year of scored conversations on a stream of its own, still
ramps from `deployedAt` towards the number the contract promised, and is
still the only thing any floor figure is read out of: `floorSeries` means it
week by week, `floorNow` takes the last four of those weeks so one quiet
week cannot flip a verdict, and `promiseGot` puts the result beside what was
written down. The report shows four metrics across forty-eight weeks against
their value at signing. A scored conversation is still what the coverage
promise is a promise ABOUT — it is just not this product's job to open one.

**SO THE REPORT SAYS WHERE THE OTHER HALF IS.** An average stated with no
way down to the conversation it came from is making a claim it cannot
support, and that argument did not go away with the roster — it moved.
`qaLine` carries it in one sentence, with the door at the end of it:
*which goal each agent is losing, and the reason under every verdict, is
in AiMY QA*, linking `agent-scorecards.html?tbl=agents`.

**ON THE DESK WE STAFF, AND NOT ON THE TOOL.** `myDeal().team` was the
guard and it is true of both floors — but one of them IS AiMY QA. The
client bought it, their eight hundred seats are on it, and they are in it
every day; a door from our invoice to the product they already use is a
link back to where the reader came from, on the one page that is about
what it cost. `whose` knows the difference: `ours` is a team we staff,
`yours` is a floor they run. The desk is the engagement with a team in it
to keep track of — eighteen people the client never sees, and "scored not
sampled" is a promise on their contract with nothing on this desk behind
it.

**In the block that already speaks, not a second one.** It was an AiMY
card under the four metrics for one commit. The report already has an AiMY
block at the top with the mark on it, so a second card in the same voice
eight hundred pixels below the first is the page speaking twice — and
`.slv`'s own stylesheet had made that call before, when `.slv-signals` put
four buttons under that paragraph and lost them for repeating what the
sentence already linked. So it is a second `.slv-line`, and the NAME is
the mark: in this paragraph weight plus underline means pressable and
weight alone means important, so a phrase built to be pressed would be a
second way of saying it.

**And this one is blue, because it leaves.** Every other mark in the
paragraph is accent-coloured and lands somewhere on this desk. `--info`
is not a new colour — the design system contrast-checked it in both
themes, and both were measured here: #7ea7ff on the dark card, #067dc2 on
the light one. `external` joins `ICONS` for it, Lucide's arrow leaving a
frame, where the frame is the half that stops it reading as `fwd` at an
angle. Sized in `em`, because a mark inside a sentence is type and moves
with the type. `nowrap` on the link, because it broke away from the name
and stood alone at the start of the next line, which reads as a bullet.
The mark is `aria-hidden`, so the anchor says "opens in a new tab" in
words.

**A door does not need an argument.** Three sentences stood here for two
commits: this page is what the scoring came to, the scoring is AiMY QA,
and a chip under it saying keep track of the desk. All three said one
thing at descending volume, in a block whose other lines are one verdict
each.

`.slv-line` carried `margin: 0`, which was right for the one-line case it
was built for and wrong the moment a block holds two: "What we think
should change" draws one line per engagement, so the overview stood four
verdicts about four different things 0.0px apart. 8 now, under the 12
`.slv-head` keeps above the body, so the lines group beneath the heading
as one answer and each verdict is still its own.

**AND THE HEDGING WENT WITH THEM.** That wording existed to avoid
promising that the figures on this page decompose on the other side of
the link, because the two BUILDS do not share a corpus — this floor is
seeded by `floorOf` on a stream of its own and QA has its own records.
That is a fact about the prototype, and it was answering a question
nobody reading this page is asking. In the PRODUCT, this client bought
AiMY QA: `sell: 'qa'`, which is why the ledger three blocks up already
says "AiMY QA is behind on average quality". What that product shows them
is a plain statement of something they own.

Not the topnav, which already has a QA tab: that is the product switcher
and the wrong weight. It says the product exists, not that it holds the
half of this report that is missing. And not the front door either —
`tbl=agents` lands a reader sent from a sentence about people ON the
people. QA reads that param once and drops it from the URL, under a margin
giving the rule both builds keep: context is passed, never reconstructed.
`QA_HOME` holds the address once, the way `SELL` and `REPS` hold theirs.

`FLOOR_SUBJ` and `FLOOR_CHAN` are drawn and no longer read. `pick` walks
this floor's stream in order, so removing two draws re-deals every score,
lag and minute after them and moves every figure on the report — the same
property that makes `SELLS` unable to take a ninth row. Load bearing on the
stream rather than on the page, which is worth a margin, because a field
nothing reads is normally a field to delete.

Who owns the behind promises is said ONCE, in the summary at the top. Three
behind rows each ending "and Lina Haddad owns it" is one name down one
column.

And one fault the cut exposed rather than caused: the client's Start strip
read "1 of your 4 promises are behind". `plural` inflects the noun it is
handed and the verb beside it was a literal, so the clause agreed with
"promises" instead of with its own subject — the same fault as "1 of the 3
have ground to make up". It stood unread because a floor book drew four
other verbs until the People tab went, which is the argument for one desk
rather than a desk per book.

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
