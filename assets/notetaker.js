/* ══ NOTETAKER — the Silk companion (AIMY-2684) ══════════════════════════════
   AiMY takes notes in a meeting. It is started from the live voice session
   (the "Take meeting notes" pill voice.js shows when this file is on the
   page), asks once for consent on the stage, and then the orb itself leaves
   the stage and floats in the corner, still listening.

   AIMY HEARS THE ROOM, NOT WHO IS IN IT. It is not a guest in the meeting:
   it listens through your microphone, so it hears everyone as one
   conversation and cannot tell voices apart. The transcript is every line
   with its time and no names. Who said what gets in through your notes, and
   the summary is written from both.

   ONE CONVERSATION, TWO PLACES. The orb opens into a card; the card opens into
   the AiMY canvas. Both are drawn from the one model below — the stream, the
   notes, the open tab, Note or Ask, and the draft being typed — so nothing is
   ever "sent" from one to the other: it is already in both.

     collapsed   the Silk orb, whether you are speaking, a count of new notes
     card        Transcription (one stream: what was said, your notes, your
                 questions and AiMY's answers) | Notes (yours, then the
                 summary); one bar that asks AiMY or adds a note
     canvas      the Console's own canvas: the meeting is a row under "Now" in
                 the conversations column, the same chat replaces the thread,
                 the same notes sit in a column on the right, the canvas bar
                 gets the Note / Ask switch

   AFTER END, THREE STEPS IN THE CHAT. Processing the recording, Analyzing
   what was said, Summarizing: each ticks off with what it found and sends a
   notification (a banner that stacks, and a row in the topnav bell). The
   final notes are then posted in the chat and in Notes.

   THE MEETING IS A FIXTURE. A recorded Upland check-in plays at
   the pace of speech, and the meeting's calendar slot ends it.
   Everything else — collapse, the canvas, notes, questions, the steps, the
   notifications — is real and works on whatever the fixture says.

   This file only touches the canvas through knowledge.js's AIMY_KNOW hooks
   (show, close, toast, bell, chats column) and the overlay's own elements. */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clock = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const K = () => window.AIMY_KNOW || null;

  /* Lucide 0.460, path data verbatim. */
  const I = {
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    square: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    max: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
    min: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/>',
    pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    todo: '<path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"/><path d="m9 11 3 3L22 4"/>',
    wait: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    retry: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    cal: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>'
  };
  const ic = (n, s, cls) => `<svg class="nt-ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="${s || 16}" height="${s || 16}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  /* The product's own mark, from the page's own symbol. */
  const MARK = (s) => `<svg class="nt-mk" width="${s || 16}" height="${Math.round((s || 16) * 1.11)}" viewBox="0 0 18 20" aria-hidden="true"><use href="#aimy-logo-small"/></svg>`;

  /* ── The meeting (fixture) ───────────────────────────────────────────── */
  const MEET = 'Upland weekly check-in';
  /* The whole meeting as AiMY hears it: one conversation, no speakers. `k`
     names the lines the answers below wait for. */
  const L = [
    { t: 12,  x: 'Morning, everyone. Let’s start with the sync, it’s what the agents keep asking about.' },
    { t: 29,  x: 'We counted last week’s Freshdesk tickets, and about half of them aren’t in AiMY.' },
    { t: 48,  x: 'Got it. So about half of last week’s tickets never came into AiMY.' },
    { t: 66,  x: 'It’s mostly parent tickets. The agents noticed when they searched for them and found nothing.' },
    { t: 96,  x: 'Right, the merge tag rule. It skips merged tickets, which is correct, but it catches the parent ticket too.', k: 'rule' },
    { t: 128, x: 'Can you fix it without bringing the merged ones back? Those are duplicates.' },
    { t: 151, x: 'We can split it: skip the merged ticket, keep the parent. I can have that ready by Thursday.', k: 'split' },
    { t: 178, x: 'And the tickets we already lost, do they come back on their own?' },
    { t: 205, x: 'Yes, once the rule is split I’ll re-sync the last two weeks. That’s about two thousand tickets, under an hour.', k: 'resync' },
    { t: 262, x: 'Next, the focus fields. We’d like Product and Plan on every answer.' },
    { t: 318, x: 'On the focus fields, Product is mapped already. Plan isn’t, because Freshdesk sends it as a code.' },
    { t: 352, x: 'I need the labels for those codes. Priya, could you send me the list?' },
    { t: 371, x: 'I can send it today. There are six plans, and two of them are retired.', k: 'labels' },
    { t: 401, x: 'Six plans and two retired. Thanks, I’ll map the four live ones.', k: 'map' },
    { t: 447, x: 'Last thing from us. The renewal is in November, and we need something that shows the value.' },
    { t: 478, x: 'Chats answered and tickets solved without an agent are the numbers that matter here.' },
    { t: 512, x: 'For the renewal note, Ahmed can pull it from the Usage page: chats answered, tickets solved without an agent, and time saved.', k: 'renew' },
    { t: 548, x: 'That works. Can we meet again next week to check on the re-sync?' },
    { t: 568, x: 'How about Tuesday?' },
    { t: 586, x: 'Tuesday works. Same time.', k: 'next' }
  ];
  /* Whether a line has been heard yet. */
  const heard = (k) => L.findIndex((l) => l.k === k) < S.n;
  /* The notes you typed as it went, for the states that start mid-meeting.
     AiMY can't tell voices apart, so this is where names come in. `after` is
     the line they follow. */
  const MINE = [
    { after: 4,  t: 110, x: 'Dana: agents noticed the parent tickets were missing' },
    { after: 13, t: 405, x: 'Priya sends the Plan labels today' },
    { after: 15, t: 498, x: 'Dana wants a value note before the November renewal' }
  ];
  /* What was decided and promised, keyed to the line it was said in. Not
     shown while the meeting runs: the analysis after it finds them. Kept for
     answering "Decided so far" mid-meeting. */
  const N = {
    6:  { k: 'act',  h: 'To do',      x: 'Split the merge tag rule by Thursday 22 Oct.' },
    8:  { k: 'dec',  h: 'Decided',    x: 'Re-sync the last 14 days once the rule is split.' },
    11: { k: 'wait', h: 'Waiting on', x: 'Labels for the Plan codes, from Priya.' },
    16: { k: 'act',  h: 'To do',      x: 'Ahmed writes the renewal note from the Usage page.' },
    19: { k: 'dec',  h: 'Decided',    x: 'Next meeting Tuesday 27 Oct, same time.' }
  };
  const SUMMARY = 'The Freshdesk sync dropped parent tickets because the merge tag rule matched them too. The rule gets split by Thursday, then 14 days are re-synced. Plan needs labels before it can be a focus field, and Upland wants a value note before the November renewal.';
  /* The summary's one line for a message that has room for one. */
  const GIST = 'The merge tag rule gets split by Thursday, then the last 14 days are re-synced.';
  const DECIDED = ['Split the merge tag rule: skip merged tickets, keep the parent.', 'Re-sync the last 14 days once the rule is split.', 'Next check-in Tuesday 27 Oct, same time.'];
  /* Yours only: AiMY heard what you took on, not what the others did. */
  const TODO = [
    { x: 'Split the merge tag rule',      m: 'Thursday 22 Oct' },
    { x: 'Re-sync the last 14 days',      m: 'Friday 23 Oct, after the split' },
    { x: 'Map the four live Plan codes',  m: 'When the Plan labels arrive' }
  ];
  /* What each step found depends on what there was: the lines heard, and
     how many notes you added. */
  const said = () => S.items.filter((i) => i.type === 'line').length;
  const noted = () => S.items.filter((i) => i.type === 'mine').length;
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const STEPS = [
    { run: 'Processing the recording', done: 'Recording processed',
      sub: () => Math.floor(S.clock / 60) + ' min ' + (S.clock % 60) + ' s, ' + plural(said(), 'line', 'lines') + ' heard',
      nf: () => 'Transcript ready: ' + plural(said(), 'line', 'lines') + ' heard.' },
    { run: 'Analyzing what was said',  done: 'Analysis done',
      sub: () => (noted() ? 'With your ' + plural(noted(), 'note', 'notes') + ': ' : '') + '3 decisions, ' + TODO.length + ' to-dos for you, 1 thing you’re waiting on',
      nf: () => 'Found 3 decisions and ' + TODO.length + ' to-dos for you.' },
    { run: 'Summarizing',              done: 'Summary written', sub: () => 'Posted below and in Notes', nf: () => 'Your meeting notes are ready.' }
  ];
  /* Speech pace, a breath between speakers, and how long each step takes. */
  const WORD_MS = 150, LINE_GAP = 1300, STEP_MS = 2600, SHORT_S = 30;
  const STATUS = { live: 'Taking notes', ended: 'Meeting ended', writing: 'Writing the notes', ready: 'Notes ready', short: 'Too short to summarise', failed: 'Notes not written' };
  /* One composer, and the tab says what it does. */
  const ASK = 'Ask AiMY about this meeting';
  const NOTE = 'Note who said or decided what';
  const hint = () => (S.tab === 'notes' ? NOTE : ASK);
  /* AiMY cannot hear the meeting end. The calendar slot ends it; here that
     comes this long after the fixture's last word. */
  const HANGUP_MS = 3500;

  /* ── The model ───────────────────────────────────────────────────────── */
  const S = { phase: 'off', view: 'fold', tab: 'chat', kind: 'note', draft: '', n: 0, clock: 0, unread: 0, speaking: false,
              items: [], steps: null, nfs: [], failNext: false, cvDraft: '' };
  let timers = [], tick = 0, nextT = 0, root = null, cvParts = null;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; clearInterval(tick); tick = 0; clearTimeout(nextT); };
  const isLive = () => S.phase === 'live';
  const on = () => S.phase !== 'off';

  /* ── Pieces ──────────────────────────────────────────────────────────── */
  const words = (x) => x.split(' ').map((w) => `<span class="nt-wd">${esc(w)}</span>`).join(' ');
  const rec = '<span class="nt-rec" aria-hidden="true"></span>';
  const only = `<span class="nt-only">${ic('lock', 11)}Only you</span>`;
  const status = `<span class="nt-st" data-nt="status">${STATUS.live}</span>`;
  const timer = '<span class="nt-tm nt-live-only" data-nt="timer">0:00</span>';
  /* AiMY is not in the meeting, so it cannot hear it end. You end notes
     here; if you forget, they end when the meeting's time on your calendar
     is up. */
  const ctl = () => '<span class="nt-ctl nt-live-only">' +
    `<button class="nt-pill nt-end" type="button" data-nt-act="stop" title="End notes now. Otherwise they end when the meeting’s time on your calendar is up.">${ic('square', 11)}End notes</button></span>`;
  const chips = () => '<div class="nt-chips">' +
    '<button type="button" class="nt-chip" data-nt-ask="catch">Recap so far</button>' +
    '<button type="button" class="nt-chip" data-nt-ask="mine">What did I promise?</button>' +
    '<button type="button" class="nt-chip" data-nt-ask="dec">Decided so far</button></div>';
  const notesPanel = () => `<div class="nt-np" data-nt-np data-done="false">
    <p class="nt-np-state" data-nt="np-state" hidden></p>
    <div class="nt-np-live"><p class="nt-np-wait">${MARK(14)}<span>AiMY hears the whole meeting but can’t tell who is speaking, so your notes are how names get in. Write down who said or decided what, and AiMY uses it in the summary when the meeting ends.</span></p></div>
    <div class="nt-np-final" data-nt="final"></div>
    <section><h5>${ic('pen', 14)}Your notes${only}</h5><ul data-nt="mine"><li class="is-none">Write one in the bar below. Only you see them.</li></ul></section>
  </div>`;
  function finalHTML() {
    return `<div class="nt-sum"><p>${SUMMARY}</p></div>
      <div class="nt-rs"><h6>Decided</h6><ul>${DECIDED.map((d) => `<li>${ic('check', 15)}<span>${d}</span></li>`).join('')}</ul>
      <h6>Your to-dos</h6><ul>${TODO.map((t) => `<li>${ic('square', 15, 'nt-i-todo')}<span>${t.x}<small>${t.m}</small></span></li>`).join('')}</ul>
      <div class="nt-btns"><button class="btn btn-brand btn-sm" type="button" data-nt-act="doc">${ic('file', 14)}Open as a document</button>` +
      `<button class="btn btn-ghost btn-sm" type="button" data-nt-act="tasks">${ic('todo', 14)}Make ${TODO.length} tasks</button></div></div>`;
  }

  /* ── The widget: the orb, and the card it opens into ─────────────────── */
  function mountWidget() {
    if (root) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="nt-w" id="ntWidget" data-view="fold" data-phase="live" data-tab="chat" hidden>
        <button class="nt-fold" type="button" data-nt-act="open" aria-label="Open the meeting notes" aria-expanded="false">
          <span class="nt-orb" data-nt-orb="fold"><canvas></canvas></span><span class="nt-badge" data-nt="count"></span>
          <span class="nt-who-pill">${rec}<span data-nt="who">Listening</span></span>
        </button>
        <button class="nt-x nt-after-only" type="button" data-nt-act="close" aria-label="Close the meeting notes" title="Close">${ic('x', 12)}</button>
        <div class="nt-card" role="dialog" aria-label="Meeting notes">
          <div class="nt-h"><span class="nt-orb is-sm" data-nt-orb="card"><canvas></canvas></span>
            <div class="nt-ht"><b>${MEET}</b><span class="nt-ps">${rec}${status}${timer}</span><span class="nt-who" data-nt="who"></span></div>
            <div class="nt-hb"><button class="nt-ib" type="button" data-nt-act="canvas" aria-label="Open in the canvas" title="Open in the canvas">${ic('max', 16)}</button>` +
            `<button class="nt-ib" type="button" data-nt-act="collapse" aria-label="Collapse to the orb" title="Collapse">${ic('min', 16)}</button>` +
            `<button class="nt-ib nt-after-only" type="button" data-nt-act="close" aria-label="Close the meeting notes" title="Close">${ic('x', 16)}</button></div>
          </div>
          <div class="nt-tabs" role="tablist"><button type="button" role="tab" data-nt-tab="chat" aria-selected="true">Transcription</button><button type="button" role="tab" data-nt-tab="notes" aria-selected="false">Notes</button>${ctl()}</div>
          <div class="nt-body"><div class="nt-stream" data-nt-stream></div>${notesPanel()}</div>
          <form class="nt-cz" data-nt-form>${chips()}
            <div class="overlay-input-bar nt-ask-bar"><span class="nt-ask-mark" aria-hidden="true">${MARK(16)}</span><input class="overlay-input nt-in" data-nt-draft placeholder="${ASK}" aria-label="${ASK}" autocomplete="off"><button class="overlay-send" aria-label="Ask">${ic('send', 14)}</button></div>
          </form>
        </div>
      </div>`);
    root = $('#ntWidget');
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    root.addEventListener('input', onDraft);
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || S.view !== 'card') return;
      e.stopPropagation(); setView('fold');
      $('.nt-fold', root).focus();
    });
    bindDrag();
    const silk = window.AIMY_VOICE && window.AIMY_VOICE.silk;
    $$('[data-nt-orb] canvas', root).forEach((c) => { if (silk) c._silk = silk(c); });
  }

  /* ── The canvas: injected once, shown only while the meeting is open ─── */
  function mountCanvas() {
    if (cvParts) return cvParts;
    const ov = $('#aimyOverlay'), main = ov && $('.overlay-main', ov), wrap = ov && $('.overlay-input-wrap', ov);
    if (!ov || !main || !wrap) return null;
    const input = $('#overlayInput', ov), bar = $('.overlay-input-bar', ov), sendBtn = $('#overlaySend', ov);
    wrap.insertAdjacentHTML('beforebegin', `<div class="nt-cv" data-nt-cv>
      <div class="nt-cv-h"><span class="nt-orb is-xs" data-nt-orb="canvas"><canvas></canvas></span>
        <div class="nt-ht"><b>${MEET}</b><span class="nt-ps">${rec}${status}${timer}</span><span class="nt-who" data-nt="who"></span></div>
        <div class="nt-tabs nt-cv-tabs" role="tablist"><button type="button" role="tab" data-nt-tab="chat" aria-selected="true">Transcription</button><button type="button" role="tab" data-nt-tab="notes" aria-selected="false">Notes</button></div>
        ${ctl()}<button class="btn btn-ghost btn-sm nt-back" type="button" data-nt-act="back">${ic('min', 14)}<span>Back to the meeting</span></button>
      </div>
      <div class="nt-stream nt-cv-stream" data-nt-stream></div>
      <div class="nt-cv-np">${notesPanel()}</div>
    </div>`);
    wrap.insertAdjacentHTML('afterbegin', chips().replace('nt-chips', 'nt-chips nt-cv-chips'));
    const silk = window.AIMY_VOICE && window.AIMY_VOICE.silk;
    const c = $('[data-nt-orb="canvas"] canvas', ov); if (silk) c._silk = silk(c);
    ov.addEventListener('click', (e) => {
      if (!ov.classList.contains('is-meeting')) return;
      if (e.target.closest('.nt-cv, .nt-cv-chips')) onClick(e);
    });
    /* The canvas bar's mark is the usage widget's everywhere else. In the
       meeting it is only the mark: its hover, focus and click stop here,
       before the usage popover's document listeners hear them. */
    const useMark = $('.overlay-input-bar > .aimy-float-icon', ov);
    if (useMark) ['mouseover', 'focusin', 'click'].forEach((t) => useMark.addEventListener(t, (e) => {
      if (ov.classList.contains('is-meeting')) { e.stopPropagation(); if (t === 'click') e.preventDefault(); }
    }));
    $('.nt-cv', ov).addEventListener('submit', onSubmit);
    $('.nt-cv', ov).addEventListener('input', onDraft);
    /* Every other conversation in the column is still a conversation: going
       to one leaves the meeting, and the orb comes back over the canvas. */
    $('#overlayChats').addEventListener('click', (e) => {
      if (e.target.closest('[data-nt-row]')) { e.stopPropagation(); toCanvas(); return; }
      if (ov.classList.contains('is-meeting') && e.target.closest('[data-chat], [data-newchat]')) leaveCanvas('fold');
    }, true);
    /* The canvas bar is the meeting's bar while the meeting is open. CAPTURE
       on its wrapper, so this runs before knowledge.js's send and voice.js's
       empty-bar voice button, and neither sees a note or a meeting question. */
    const take = (e) => {
      if (!ov.classList.contains('is-meeting')) return;
      e.preventDefault(); e.stopPropagation();
      S.draft = input.value; send();
    };
    wrap.addEventListener('keydown', (e) => { if (e.target === input && e.key === 'Enter' && !e.shiftKey) take(e); }, true);
    wrap.addEventListener('click', (e) => { if (sendBtn.contains(e.target)) take(e); }, true);
    input.addEventListener('input', () => { if (ov.classList.contains('is-meeting')) { S.draft = input.value; syncDraft(input); } });
    /* However the canvas closes — the ×, Escape, a click off it — the meeting
       goes back to being the card. */
    new MutationObserver(() => {
      if (!ov.classList.contains('open') && ov.classList.contains('is-meeting')) leaveCanvas('card');
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    cvParts = { ov, input, bar, placeholder: input.getAttribute('placeholder') };
    replayInto(ov);
    return cvParts;
  }

  /* ── Drawing ─────────────────────────────────────────────────────────── */
  const all = (sel) => $$(sel).filter((el) => root && (root.contains(el) || (cvParts && cvParts.ov.contains(el))));
  const slots = (n) => all(`[data-nt="${n}"]`);

  function paint() {
    if (!root) return;
    const live = isLive();
    root.hidden = !on() || S.closed;
    root.dataset.side = S.side; root.dataset.vert = S.vert;
    root.dataset.view = S.view; root.dataset.phase = S.phase; root.dataset.tab = S.tab;
    if (cvParts) { cvParts.ov.dataset.ntPhase = S.phase; cvParts.ov.dataset.ntTab = S.tab; }
    $('.nt-fold', root).setAttribute('aria-expanded', String(S.view !== 'fold'));
    all('[data-nt-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ntTab === S.tab)));
    all('[data-nt-draft]').forEach((i) => { i.placeholder = hint(); i.setAttribute('aria-label', hint()); });
    if (cvParts && cvParts.ov.classList.contains('is-meeting')) cvParts.input.setAttribute('placeholder', hint());
    slots('status').forEach((e) => { e.textContent = STATUS[S.phase] || ''; });
    if (cvParts) { const b = $('.nt-back span', cvParts.ov); if (b) b.textContent = live ? 'Back to the meeting' : 'Close'; }
    slots('chat-sub').forEach((e) => { e.textContent = 'Meeting, ' + (STATUS[S.phase] || '').toLowerCase(); });
    const who = live ? (S.speaking ? 'Someone is speaking' : 'Listening') : S.how === 'stopped' ? 'You ended notes' : 'The meeting has ended';
    slots('who').forEach((e) => { e.textContent = who; });
    slots('count').forEach((e) => {
      const show = S.view === 'fold' && (S.unread > 0 || S.phase === 'ready');
      e.classList.toggle('is-on', show); e.classList.toggle('is-ok', S.phase === 'ready' && !S.unread);
      e.innerHTML = S.unread ? String(S.unread) : S.phase === 'ready' ? ic('check', 11) : '';
    });
    all('[data-nt-np]').forEach((np) => { np.dataset.done = String(S.phase === 'ready'); });
    slots('final').forEach((f) => { if (S.phase === 'ready' && !f.innerHTML) f.innerHTML = finalHTML(); });
    const msg = { short: 'The meeting ran under 30 seconds, so there is nothing to summarise. The transcript is kept.',
                  failed: 'AiMY couldn’t write the summary. The recording and the transcript are safe. Try again from the chat.',
                  writing: 'Writing the notes. They show here when the summary is done.' }[S.phase];
    slots('np-state').forEach((e) => { e.hidden = !msg; e.textContent = msg || ''; });
    paintClock();
    /* One orb runs at a time: the one you can see. */
    const want = S.view;
    all('[data-nt-orb] canvas').forEach((c) => {
      if (!c._silk) return;
      c._silk.phase(S.phase === 'live' ? 'listening' : S.phase === 'writing' ? 'thinking' : 'muted');
      if (on() && c.closest('[data-nt-orb]').dataset.ntOrb === want) c._silk.start(); else c._silk.stop();
    });
    /* The column and the bell only when what they show has changed. */
    const k = K(), sig = S.phase + S.view + (cvParts && cvParts.ov.classList.contains('is-meeting'));
    if (k && k.paintChats && sig !== paint.sig) { paint.sig = sig; k.paintChats(); }
    if (k && k.bellSync && S.nfs.length !== paint.nf) { paint.nf = S.nfs.length; k.bellSync(); }
  }
  function paintClock() { const t = clock(S.clock); slots('timer').forEach((e) => { e.textContent = t; }); }

  function itemHTML(it) {
    /* AiMY can't tell voices apart, so no names and no bubbles: a
       transcript, with the time in the margin. */
    if (it.type === 'line') return `<div class="nt-cl"><time>${clock(it.t)}</time><p>${words(L[it.i].x)}</p></div>`;
    if (it.type === 'note') return `<div class="nt-an">${MARK(15)}<div><div class="nt-an-k">AiMY noted: ${it.n.h.toLowerCase()}</div><p>${it.n.x}</p></div></div>`;
    if (it.type === 'mine') return `<div class="nt-yn">${ic('pen', 14)}<div><div class="nt-yn-h">Your note, ${clock(it.t)} ${only}</div><p>${esc(it.x)}</p></div></div>`;
    if (it.type === 'ask') return `<div class="nt-q"><span>${esc(it.q)}</span>${only}</div><div class="nt-am">${MARK(15)}<div class="nt-am-b"><p>${words(it.a)}</p></div></div>`;
    if (it.type === 'steps') return stepsHTML();
    if (it.type === 'result') return `<div class="nt-am">${MARK(15)}<div class="nt-am-b"><p><b>Your notes for ${MEET}</b></p>${finalHTML()}</div></div>`;
    if (it.type === 'fail') return `<div class="nt-am">${MARK(15)}<div class="nt-am-b"><p class="nt-err">The summary didn’t finish.</p><p>The recording and the transcript are safe. Nothing was sent to anyone.</p><div class="nt-btns"><button class="btn btn-brand btn-sm" type="button" data-nt-act="retry">${ic('retry', 14)}Try again</button></div></div></div>`;
    if (it.type === 'short') return `<div class="nt-am">${MARK(15)}<div class="nt-am-b"><p>The meeting ran under 30 seconds, so there is nothing to summarise. The transcript is kept above.</p></div></div>`;
    return '';
  }
  function stepsHTML() {
    return `<div class="nt-am" data-nt-steps>${MARK(15)}<div class="nt-am-b"><p>${S.how === 'stopped' ? 'You ended notes' : 'The meeting’s time on your calendar is up, so notes ended'} at ${clock(S.clock)}. Writing them up now from what was said${noted() ? ' and your notes' : ''}. I’ll tell you when each part is done.</p><div class="nt-steps">` +
      STEPS.map((s, i) => {
        const st = S.steps[i];
        return `<div class="nt-step" data-s="${st}"><span class="nt-step-i">${ic('spin', 15, 'nt-i-run')}${ic('check', 15, 'nt-i-done')}${ic('alert', 15, 'nt-i-fail')}</span>` +
          `<span><b>${st === 'done' ? s.done : st === 'fail' ? 'Summary didn’t finish' : s.run}</b>${st === 'done' ? `<small>${s.sub()}</small>` : ''}</span></div>`;
      }).join('') + '</div></div></div>';
  }

  /* Everything said goes to every stream there is, the card's and the
     canvas's, and into every notes panel. */
  function put(it, animate, scope) {
    const html = itemHTML(it);
    $$('[data-nt-stream]', scope).forEach((box) => {
      const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      box.insertAdjacentHTML('beforeend', html);
      if (animate) stream(Array.from(box.lastElementChild.querySelectorAll('.nt-wd')));
      if (near || !animate) box.scrollTop = box.scrollHeight;
    });
    const sl = (n) => $$(`[data-nt="${n}"]`, scope);
    if (it.type === 'note') sl(it.n.k).forEach((ul) => { ul.querySelector('.is-none')?.remove(); ul.insertAdjacentHTML('beforeend', `<li>${it.n.x}</li>`); });
    if (it.type === 'mine') sl('mine').forEach((ul) => { ul.querySelector('.is-none')?.remove(); ul.insertAdjacentHTML('beforeend', `<li>${esc(it.x)}<small>${clock(it.t)}</small></li>`); });
  }
  function replayInto(scope) { S.items.forEach((it) => put(it, false, scope)); }
  function add(it, animate) {
    S.items.push(it);
    put(it, animate, document);
    if (animate && S.view === 'fold' && /^(result|fail)$/.test(it.type)) S.unread++;
    paint();
  }
  function stream(spans) {
    if (reduced() || !spans.length) return;
    spans.forEach((s) => s.classList.add('is-pre'));
    const orbs = all('[data-nt-orb] canvas').map((c) => c._silk).filter(Boolean);
    spans.forEach((s, i) => later(() => {
      s.classList.remove('is-pre');
      orbs.forEach((o) => o.level(0.35 + Math.random() * 0.45));
      if (i === spans.length - 1) later(() => orbs.forEach((o) => o.level(0)), 200);
      scrollAll();
    }, i * WORD_MS));
  }
  function scrollAll(force) {
    all('[data-nt-stream]').forEach((b) => { if (force || b.scrollHeight - b.scrollTop - b.clientHeight < 120) b.scrollTop = b.scrollHeight; });
  }
  function line(i, animate) {
    if (animate) {
      S.speaking = true;
      later(() => { S.speaking = false; paint(); }, (reduced() ? 1 : L[i].x.split(' ').length) * WORD_MS + 300);
    }
    add({ type: 'line', i, t: animate ? S.clock : L[i].t }, animate);
  }
  /* Answers come from what was said and your notes, and say so. AiMY can't
     tell who said a thing, so a promise is said as made, not as yours. */
  function answer(k, q) {
    const dec = Object.keys(N).filter((x) => x < S.n && N[x].k === 'dec').map((x) => N[x].x);
    const t = (q || '').toLowerCase();
    if (!k) k = /promis|i said|\bmy\b/.test(t) ? 'mine' : /decid|agree/.test(t) ? 'dec' : /renew/.test(t) ? 'renew' : 'catch';
    const from = 'From what was said' + (noted() ? ' and your notes' : '') + ': ';
    const a = {
      catch: !heard('rule') ? 'Not much yet. So far it’s about tickets missing from the Freshdesk sync.'
        : from + 'the merge tag rule drops parent tickets. ' + (heard('split') ? 'It gets split by Thursday' + (heard('resync') ? ', then the last 14 days are re-synced. ' : '. ') : '') + (heard('labels') ? 'Plan needs labels for its codes, and Priya is sending them.' : ''),
      mine: heard('split') ? 'I can’t tell voices apart, so this is everything promised so far: the merge tag rule split by Thursday 22 Oct' + (heard('resync') ? ', the last 14 days re-synced after it' : '') + (heard('map') ? ', and the four live Plan codes mapped' : '') + '. Add a note to mark which are yours.' : 'Nothing promised yet.',
      dec: dec.length ? from + dec.join(' ') : 'Nothing decided yet.',
      renew: heard('renew') ? 'Ahmed can write the renewal note from the Usage page: chats answered, tickets solved without an agent, and time saved.' : 'Renewal hasn’t come up yet.'
    }[k];
    return { type: 'ask', q: q || { catch: 'Recap so far', mine: 'What did I promise?', dec: 'Decided so far' }[k], a: a.trim() };
  }

  /* ── The meeting runs ────────────────────────────────────────────────── */
  function runClock() { clearInterval(tick); tick = setInterval(() => { if (S.phase === 'live') { S.clock++; paintClock(); } }, 1000); }
  function next(delay) {
    clearTimeout(nextT);
    if (S.n >= L.length) { nextT = later(() => { if (isLive()) stop('ended'); }, HANGUP_MS); return; }
    nextT = later(() => {
      if (S.phase !== 'live') return;
      const i = S.n++; line(i, true);
      next(L[i].x.split(' ').length * WORD_MS + LINE_GAP);
    }, delay);
  }
  /* Clears what is drawn and draws the model again, everywhere. */
  function redraw() {
    all('[data-nt-stream]').forEach((b) => { b.innerHTML = ''; });
    all('[data-nt-np]').forEach((np) => {
      const fresh = document.createElement('div'); fresh.innerHTML = notesPanel(); np.replaceWith(fresh.firstElementChild);
    });
    replayInto(document);
    paint(); scrollAll(true);
  }
  function begin(o) {
    clearAll();
    mountWidget();
    Object.assign(S, { phase: o.phase || 'live', view: o.view || 'fold', tab: o.tab || 'chat', draft: '', drafts: { chat: '', notes: '' }, how: '', clock: o.clock || 0,
                       unread: o.unread || 0, items: [], steps: null, nfs: [], failNext: false, closed: false, speaking: false });
    S.n = o.n || 0;
    for (let i = 0; i < S.n; i++) {
      S.items.push({ type: 'line', i, t: L[i].t });
      if (o.mine) MINE.filter((m) => m.after === i).forEach((m) => S.items.push({ type: 'mine', x: m.x, t: m.t }));
      if (o.mine && i === 10) { const keep = S.n; S.n = 11; S.items.push(answer('catch')); S.n = keep; }
    }
    if (o.after) o.after();
    all('[data-nt-draft]').forEach((i) => { i.value = ''; });
    redraw();
    if (isLive() && !o.still) { runClock(); next(o.first || 1800); }
  }

  /* ── Views ───────────────────────────────────────────────────────────── */
  /* ── Moving the orb ─────────────────────────────────────────────────────
     Collapsed, the orb can be dragged anywhere and settles on the nearer
     side, the way a Messenger chat head does. A press that does not move is
     still a press and opens the card. The card then opens from the orb:
     towards the middle of the screen, up from a low orb and down from a high
     one. */
  S.side = 'r'; S.vert = 'b'; S.y = null;
  function place() {
    if (!root) return;
    const m = 20;
    root.style.left = root.style.right = root.style.top = root.style.bottom = '';
    if (S.y == null) return;
    root.style[S.side === 'l' ? 'left' : 'right'] = m + 'px';
    root.style.top = S.y + 'px';
    root.style.bottom = 'auto';
  }
  function bindDrag() {
    const fold = $('.nt-fold', root);
    let start = null, moved = false;
    fold.addEventListener('pointerdown', (e) => {
      if (S.view !== 'fold' || e.button !== 0) return;
      const r = root.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, w: r.width, h: r.height };
      moved = false;
      fold.setPointerCapture(e.pointerId);
    });
    fold.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      root.classList.add('is-dragging');
      const x = Math.max(8, Math.min(innerWidth - start.w - 8, start.l + dx));
      const y = Math.max(8, Math.min(innerHeight - start.h - 8, start.t + dy));
      root.style.right = root.style.bottom = 'auto';
      root.style.left = x + 'px'; root.style.top = y + 'px';
    });
    const end = (e) => {
      if (!start) return;
      fold.releasePointerCapture(e.pointerId);
      if (moved) {
        const r = root.getBoundingClientRect();
        S.side = r.left + r.width / 2 < innerWidth / 2 ? 'l' : 'r';
        S.vert = r.top + r.height / 2 < innerHeight / 2 ? 't' : 'b';
        S.y = Math.round(r.top);
        root.classList.remove('is-dragging');
        place(); paint();
        fold.dataset.dragged = '1';
      }
      start = null;
    };
    fold.addEventListener('pointerup', end);
    fold.addEventListener('pointercancel', end);
    /* The click that ends a drag is not a press. */
    fold.addEventListener('click', (e) => { if (fold.dataset.dragged) { delete fold.dataset.dragged; e.stopImmediatePropagation(); } }, true);
    window.addEventListener('resize', () => { if (S.y != null) { S.y = Math.min(S.y, innerHeight - 140); place(); } });
  }
  /* Kept on screen: a card opened near an edge is nudged back inside. */
  function fitCard() {
    const card = $('.nt-card', root); if (!card) return;
    card.style.setProperty('--nt-dy', '0px');
    const r = card.getBoundingClientRect(), top = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-height')) || 56) + 8;
    let dy = 0;
    if (r.bottom > innerHeight - 8) dy = innerHeight - 8 - r.bottom;
    if (r.top + dy < top) dy = top - r.top;
    card.style.setProperty('--nt-dy', dy + 'px');
  }
  function closeWidget() {
    if (isLive()) return;
    S.closed = true; S.view = 'fold';
    paint();
    toast('Meeting notes closed', null, 'They are under the bell, and in the canvas under Today');
  }

  function setView(v) {
    if (v === 'canvas') return toCanvas();
    if (S.view === 'canvas') return leaveCanvas(v);
    S.view = v; if (v !== 'fold') S.unread = 0;
    paint();
    if (v === 'card') { fitCard(); later(() => scrollAll(true), 30); const i = $('.nt-in', root); if (i) i.focus({ preventScroll: true }); }
  }
  /* The canvas opens out of the card's own rectangle and closes back into
     it, so the two read as one surface changing size. */
  function cardClip(ov) {
    const card = $('.nt-card', root), r = card.getBoundingClientRect(), o = ov.getBoundingClientRect();
    return `inset(${Math.max(0, r.top - o.top)}px ${Math.max(0, o.right - r.right)}px ${Math.max(0, o.bottom - r.bottom)}px ${Math.max(0, r.left - o.left)}px round 16px)`;
  }
  function toCanvas() {
    const k = K(), parts = mountCanvas();
    if (!k || !parts || !on()) return;
    if (S.closed) { S.closed = false; S.view = 'card'; paint(); }
    if (S.view === 'fold') { S.view = 'card'; paint(); }
    const ov = parts.ov, from = cardClip(ov);
    parts.cvDraft = parts.input.value;
    ov.classList.add('is-meeting');
    S.view = 'canvas'; S.unread = 0;
    k.canvas.show(['Meeting notes']);
    requestAnimationFrame(() => { if (S.view === 'canvas' && !k.canvas.isOpen()) k.canvas.show(['Meeting notes']); });
    parts.input.value = S.draft;
    paint(); scrollAll(true); later(() => scrollAll(true), 60);
    if (!reduced()) ov.animate([{ clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    setTimeout(() => parts.input.focus({ preventScroll: true }), 60);
  }
  function leaveCanvas(to) {
    if (!cvParts) return;
    const ov = cvParts.ov;
    ov.classList.remove('is-meeting');
    cvParts.input.setAttribute('placeholder', cvParts.placeholder);
    cvParts.input.value = cvParts.cvDraft || '';
    S.view = to || 'card';
    paint();
    if (S.view === 'card') later(() => scrollAll(true), 30);
  }
  function backToCard() {
    if (!cvParts) return;
    const ov = cvParts.ov, k = K();
    S.view = 'card'; root.dataset.view = 'card';
    const to = cardClip(ov);
    const end = () => { leaveCanvas('card'); if (k) k.canvas.close({ quiet: true }); };
    if (reduced()) return end();
    ov.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: to }], { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' })
      .onfinish = (e) => { end(); e.target.cancel(); };
  }

  /* ── After End ───────────────────────────────────────────────────────── */
  function stop(how) {
    if (!isLive()) return;
    S.how = how === 'ended' ? 'ended' : 'stopped';
    all('.nt-wd.is-pre').forEach((w) => w.classList.remove('is-pre'));
    clearAll();
    if (S.clock < SHORT_S) {
      S.phase = 'short'; add({ type: 'short' }, true);
      notify({ k: 'short', t: 'Too short to summarise', x: MEET + ' ran under 30 seconds.' });
      return;
    }
    S.phase = 'writing'; S.steps = STEPS.map(() => 'wait'); S.steps[0] = 'run';
    if (S.view === 'fold') S.view = 'card';
    add({ type: 'steps' }, false); scrollAll(true);
    runSteps(0);
  }
  function runSteps(i) {
    later(() => {
      if (S.failNext && i === 2) {
        S.steps[i] = 'fail'; drawSteps(); S.phase = 'failed';
        add({ type: 'fail' }, true);
        notify({ k: 'fail', t: 'Notes not written', x: 'The summary didn’t finish. Your transcript is safe.', act: 'Try again', go: 'retry' });
        say('fail');
        return;
      }
      S.steps[i] = 'done'; drawSteps();
      notify({ k: 'ok', t: STEPS[i].done, x: STEPS[i].nf(), act: i === 2 ? 'Open the notes' : '', go: 'open-notes' });
      if (i < 2) { S.steps[i + 1] = 'run'; drawSteps(); runSteps(i + 1); return; }
      S.phase = 'ready'; add({ type: 'result' }, true);
      say('ready');
    }, STEP_MS);
  }
  /* What the three steps found, said by AiMY in the Console's own message
     card above the command bar: it reaches you with the orb collapsed or
     closed. Pressing it opens the notes. Built from the analysis (decisions,
     to-dos and whose they are) and the summary, not written separately. */
  /* Opening the notes from outside the widget (the message card, the bell)
     goes to the canvas: that is where a finished meeting is read. */
  function openInCanvas(tab) {
    S.closed = false;
    if (tab && tab !== S.tab) { S.drafts[S.tab] = S.draft; S.tab = tab; S.draft = S.drafts[tab] || ''; syncDraft(null); }
    if (S.view === 'canvas') { paint(); scrollAll(true); return; }
    toCanvas();
  }
  function say(kind) {
    const k = K(); if (!k || !k.say) return;
    const open = (tab) => () => openInCanvas(tab);
    if (kind === 'fail') {
      k.say(`The summary for <b>${MEET}</b> didn’t finish. The recording and the transcript are safe, and nothing was sent.`, open('chat'));
      return;
    }
    k.say(`Your notes for <b>${MEET}</b> are ready. ${GIST} <b>${DECIDED.length} decisions, ${TODO.length} to-dos for you.</b>`, open('notes'));
  }
  function drawSteps() {
    all('[data-nt-steps]').forEach((el) => {
      const f = document.createElement('div'); f.innerHTML = stepsHTML();
      el.querySelector('.nt-steps').replaceWith(f.querySelector('.nt-steps'));
    });
    scrollAll();
  }
  function retry() {
    S.items = S.items.filter((i) => i.type !== 'fail');
    S.steps[2] = 'run'; S.phase = 'writing'; S.failNext = false;
    redraw(); runSteps(2);
  }

  /* ── Notifications ───────────────────────────────────────────────────────
     Each finished step is a row in the topnav bell, nothing that floats over
     the work: the step itself already ticks off in the chat, and the bell's
     count is how you hear about it when the card is folded or closed. */
  let nfSeq = 0;
  function notify(n) {
    n.id = 'nt-' + (++nfSeq); n.at = clock(S.clock);
    S.nfs.unshift(n);
    paint();
    ring(n);
  }
  /* The bell says it, briefly: it rocks, and one line drops from it for
     about a second. Not while its panel is open (the row is already there),
     and only the latest when two arrive close together. */
  const PEEK_MS = 1400;
  let peekT = 0;
  function ring(n) {
    const bell = $('#ntfBell'), panel = $('#ntfPanel');
    if (!bell || (panel && !panel.hidden)) return;
    if (!reduced()) { bell.classList.remove('nt-ring'); void bell.offsetWidth; bell.classList.add('nt-ring'); }
    let peek = $('#ntPeek');
    if (!peek) { document.body.insertAdjacentHTML('beforeend', '<div class="nt-peek" id="ntPeek" role="status" aria-live="polite"></div>'); peek = $('#ntPeek'); }
    peek.innerHTML = `${n.k === 'fail' ? ic('alert', 13) : MARK(12)}<span><b>${n.t}</b></span>`;
    /* Centred under the bell, kept inside the window; the point stays aimed
       at the bell even when the line is pushed in from the edge. */
    const r = bell.getBoundingClientRect(), w = peek.offsetWidth, cx = r.left + r.width / 2;
    const left = Math.max(12, Math.min(innerWidth - w - 12, cx - w / 2));
    peek.style.top = Math.round(r.bottom + 10) + 'px';
    peek.style.left = Math.round(left) + 'px';
    peek.style.setProperty('--nt-peek-x', Math.round(cx - left) + 'px');
    peek.classList.toggle('is-fail', n.k === 'fail');
    peek.classList.remove('is-on'); void peek.offsetWidth; peek.classList.add('is-on');
    clearTimeout(peekT);
    peekT = setTimeout(() => peek.classList.remove('is-on'), PEEK_MS);
  }

  /* ── Doing things ────────────────────────────────────────────────────── */
  function send() {
    const x = S.draft.trim(); if (!x) return;
    S.draft = '';
    all('[data-nt-draft]').forEach((i) => { i.value = ''; });
    if (cvParts && cvParts.ov.classList.contains('is-meeting')) cvParts.input.value = '';
    if (S.tab === 'notes') add({ type: 'mine', x, t: S.clock }, true);
    else add(answer(null, x), true);
    scrollAll(true);
  }
  /* Each tab keeps what you were typing in it. */
  function setTab(t) {
    if (t === S.tab) return;
    S.drafts[S.tab] = S.draft;
    S.tab = t; S.draft = S.drafts[t] || '';
    syncDraft(null);
    paint(); scrollAll(true);
  }
  function syncDraft(from) {
    all('[data-nt-draft]').forEach((i) => { if (i !== from) i.value = S.draft; });
    if (cvParts && from !== cvParts.input && cvParts.ov.classList.contains('is-meeting')) cvParts.input.value = S.draft;
  }
  function onDraft(e) {
    if (e.target.matches('[data-nt-draft]')) { S.draft = e.target.value; syncDraft(e.target); }
  }
  function onSubmit(e) {
    e.preventDefault();
    send();
  }
  function toast(msg, undo, sub) { const k = K(); if (k && k.toast) k.toast(msg, undo, sub); }

  function onClick(e) {
    const a = e.target.closest('[data-nt-act], [data-nt-tab], [data-nt-ask]');
    if (!a) return;
    if (a.dataset.ntTab) { setTab(a.dataset.ntTab); return; }
    if (a.dataset.ntAsk) { add(answer(a.dataset.ntAsk), true); scrollAll(true); return; }
    const act = a.dataset.ntAct;
    if (act === 'open') setView('card');
    else if (act === 'collapse') setView('fold');
    /* The press that opens the canvas must not also reach the Console's
       click-off, which would close it again on the same click. */
    else if (act === 'canvas') { e.stopPropagation(); toCanvas(); }
    else if (act === 'back') backToCard();
    else if (act === 'stop') stop('stopped');
    else if (act === 'close') closeWidget();
    else if (act === 'retry') retry();
    else if (act === 'open-notes') { S.tab = 'notes'; if (S.view === 'fold') setView('card'); else paint(); }
    else if (act === 'tasks') toast(TODO.length + ' tasks made', 'Undo', 'Each with its date');
    else if (act === 'doc') toast('Saved as a Meeting notes document', null, 'Linked to Upland, with the full transcript');
  }

  /* ── From the voice session ──────────────────────────────────────────────
     voice.js hands over its stage. The consent is asked there, inline, in
     the line under the orb; on yes the orb's light flies to the corner where
     the companion will sit, and the voice session ends. */
  function fromVoice(o) {
    const stage = o.stage, center = $('.vx-center', stage);
    if (!center || $('.nt-cons', stage)) return;
    stage.classList.add('nt-asking');
    /* Part of the stage, not a box on it: the line under the orb becomes the
       question. Which meeting first (from your calendar), so you know what
       you are agreeing to, and then what AiMY hears and can't tell apart. Nothing
       is posted in the meeting: AiMY is not in it. */
    center.insertAdjacentHTML('beforeend', `<div class="nt-cons" role="group" aria-labelledby="ntConsH">
      <span class="nt-cons-meet">${ic('cal', 14)}${MEET}<span>Now, on your calendar</span></span>
      <p class="nt-cons-h" id="ntConsH">Take notes in this meeting?</p>
      <p class="nt-cons-p">AiMY hears the meeting through your microphone, but can’t tell who is speaking. Add notes for who said what, and AiMY sums it all up when the meeting ends. Only you see the notes.</p>
      <div class="nt-cons-go"><button class="btn btn-brand nt-cons-start" type="button" data-nt-go="start">${ic('pen', 15)}Start taking notes</button>` +
      `<button class="btn btn-ghost" type="button" data-nt-go="no">Not now</button></div></div>`);
    const cons = $('.nt-cons', stage);
    cons.querySelector('[data-nt-go="start"]').focus();
    cons.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); cons.querySelector('[data-nt-go="no"]').click(); } });
    cons.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nt-go]'); if (!b) return;
      const drop = () => { cons.remove(); stage.classList.remove('nt-asking'); };
      if (b.dataset.ntGo === 'no') { drop(); return; }
      const orbBox = (o.orb || center).getBoundingClientRect();
      drop();
      begin({ n: 0, clock: 0, view: 'fold' });
      root.classList.add('is-arriving');
      o.done();
      fly(orbBox, $('.nt-orb', root).getBoundingClientRect(), () => root.classList.remove('is-arriving'));
      toast('AiMY is taking notes', null, 'It hears everyone through your microphone. Let the others know it is on.');
    });
  }
  function fly(from, to, done) {
    if (reduced()) { done(); return; }
    const g = document.createElement('div'); g.className = 'nt-ghost'; document.body.appendChild(g);
    g.animate([{ left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' },
               { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' }],
      { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }).onfinish = () => { g.remove(); done(); };
  }

  /* ── What knowledge.js asks of this file ─────────────────────────────── */
  /* The meeting, as the first row of the conversations column while it runs. */
  function chatRow(host) {
    if (!on() || !host) return;
    const here = cvParts && cvParts.ov.classList.contains('is-meeting');
    if (here) $$('.ov-chat.is-here', host).forEach((b) => { b.classList.remove('is-here'); b.removeAttribute('aria-current'); });
    const find = $('.ov-chat-find', host); if (!find) return;
    const row = `<div class="ov-chat-row"><button class="ov-chat${here ? ' is-here' : ''}" type="button" data-nt-row ${here ? 'aria-current="true"' : ''}>
        <span class="ov-chat-lines"><span class="ov-chat-name">${isLive() ? rec : ''}${MEET}</span><span class="ov-chat-agent" data-nt="chat-sub">Meeting, ${(STATUS[S.phase] || '').toLowerCase()}</span></span>
      </button></div>`;
    /* Running, it is the only thing under Now. Over, it is one of today's
       conversations, first in the group the column already has. */
    const today = !isLive() && $$('.ov-chat-group', host).find((g) => /^today$/i.test(($('.ov-chat-cap', g) || {}).textContent || ''));
    if (today) { $('.ov-chat-cap', today).insertAdjacentHTML('afterend', row); return; }
    find.insertAdjacentHTML('afterend', `<div class="ov-chat-group nt-chat-now"><div class="ov-chat-cap">${isLive() ? 'Now' : 'Today'}</div>${row}</div>`);
  }
  /* Rows for the topnav bell, in its own shape. */
  function bellRows() {
    return S.nfs.map((n) => ({ id: n.id, type: 'Meeting notes', when: n.at, body: n.t + '. ' + n.x, cta: n.go === 'retry' ? 'Try again' : 'Open the notes',
      needs: 'canvas', nav: 'console.html', go: () => { if (n.go === 'retry' && S.phase === 'failed') { retry(); openInCanvas('chat'); } else openInCanvas('notes'); } }));
  }
  /* The prototype panel's "Meeting notes, each state". */
  const JUMPS = {
    collapsed: () => begin({ n: 14, clock: 412, view: 'fold', unread: 2, mine: true }),
    card:      () => begin({ n: 14, clock: 412, view: 'card', mine: true }),
    canvas:    () => { begin({ n: 14, clock: 412, view: 'card', mine: true }); later(toCanvas, 60); },
    after:     () => { begin({ n: L.length, clock: 592, view: 'card', still: true, mine: true }); stop('ended'); },
    ready:     () => begin({ n: L.length, clock: 592, view: 'card', phase: 'ready', mine: true, after: () => {
                   S.how = 'ended'; S.steps = ['done', 'done', 'done']; S.items.push({ type: 'steps' }, { type: 'result' });
                   STEPS.forEach((s, i) => S.nfs.unshift({ id: 'nt-' + (++nfSeq), k: 'ok', t: s.done, x: s.nf(), at: '9:41', go: 'open-notes', act: i === 2 ? 'Open the notes' : '' })); } }),
    short:     () => { begin({ n: 1, clock: 22, view: 'card', still: true }); stop('stopped'); },
    failed:    () => { begin({ n: L.length, clock: 592, view: 'card', still: true, mine: true }); S.failNext = true; stop('ended'); },
    off:       () => { clearAll(); if (cvParts && cvParts.ov.classList.contains('is-meeting')) backToCard(); S.phase = 'off'; S.nfs = []; paint(); }
  };
  function jump(k) {
    if (cvParts && cvParts.ov.classList.contains('is-meeting') && k !== 'canvas') { leaveCanvas('card'); const kn = K(); if (kn) kn.canvas.close({ quiet: true }); }
    (JUMPS[k] || JUMPS.card)();
  }

  window.AIMY_NOTES = { fromVoice, chatRow, bellRows, jump, isOn: on, _state: S };
})();
