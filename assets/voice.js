/* ══ VOICE — the composer, spoken to ═══════════════════════════════════════
   ONE COMPOSER, EVERYWHERE. The gate, the Console's canvas, the Console's
   command bar, and both of Sales' bars are the same control in different
   shells, so this file mounts the same arrangement into every one of them:

     [mark] [ field ..................... ] [clip] [mic] [ ◉ ]
                                              tools ──┘     └── voice / send

   THE CLIP IS IN EVERY BAR, and it is this file's in every bar (the one
   knowledge.js injects into the canvas is replaced, so there is one
   behaviour). It does the honest thing Knowledge's always did: accept a
   file, name it, let you take it back off — and say "not uploaded",
   because there is nowhere to upload to.

   THE MIC DICTATES. It is the Sales composer's "Say it instead of typing":
   the field gives way to a waveform and a clock, in the recording red Sales
   already uses. The way out is ChatGPT's, because it is the clearer one —
   the tools and send step aside for a cancel and a keep (✕ ✓), so the two
   outcomes are two buttons rather than one toggle you have to remember the
   meaning of. Keeping puts the words in the field to edit before sending;
   nothing is sent by dictating.

   THE ROUND BUTTON STARTS A CONVERSATION. Empty, the send slot is the voice
   button (Lucide `audio-lines`, the glyph ChatGPT uses for the same act);
   with text in the field it is send again.

   ══ A CONVERSATION IS A PLACE, NOT A ROW ══════════════════════════════════
   The session is ChatGPT's mobile voice mode: the page goes away and you are
   left with one orb, a line saying what it is doing, and two buttons — mute
   and end. No transcript on screen. You are talking, not reading; a thread
   scrolling behind the orb would pull your eyes to text you did not ask to
   see. The orb listens (it swells with your voice), thinks (it slows and
   turns), and answers (it breathes) — and tapping it while it answers cuts
   it off, the way you would interrupt a person.

   THE THREAD STILL KEEPS THE RECORD. Every spoken question and its answer
   are written into the conversation behind the stage, exactly as typed ones
   are, so ending the session lands you on what was said. Whichever bar you
   started from, the session speaks through the CONVERSATION's bar (the
   canvas, or the gate) — a command bar steers a surface, and a voice
   session is a conversation.

   ══ IT DRIVES THE COMPOSER, IT DOES NOT REPLACE IT ════════════════════════
   A spoken turn is asked exactly the way a typed one is: the words go into
   the field and the bar's send is clicked. Every route the product already
   has is therefore the same for a spoken question, and neither knowledge.js
   nor bdr.js knows this file exists. The answer being finished is read off
   the same fact the beam reads: `.is-generating` leaving the bar.

   ══ REAL, OR IT SAYS SO ═══════════════════════════════════════════════════
   This uses the browser's own speech recognition (Chrome, Edge, Safari) and
   speech synthesis. Where recognition is missing, or the microphone is
   refused, it says that in words and stops. It never makes up a sentence you
   did not say — the same rule the attachment chip follows by saying "not
   uploaded".

   The same file ships in AiMY/Knowledge and AiMY/Sales. Change both. */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  /* Looked up when needed, not at load, so a polyfill installed later counts. */
  const SRC = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const TTS = window.speechSynthesis;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lucide 1.52, path data verbatim. */
  const svg = (d, size, cls) =>
    `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" width="${size}" height="${size}" ` +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    `stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    mic:    '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
    micOff: '<path d="M12 19v3"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M16.95 16.95A7 7 0 0 1 5 12v-2"/><path d="M18.89 13.23A7 7 0 0 0 19 12v-2"/><path d="m2 2 20 20"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>',
    lines:  '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
    x:      '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check:  '<path d="M20 6 9 17l-5-5"/>',
    clip:   '<path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/>',
    file:   '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* What you are saying is read at its newest end, so a long sentence keeps
     its last words in view rather than its first. */
  const tail = (t) => (t.length > 120 ? '…' + t.slice(-120).replace(/^\S*\s/, '') : t);
  const clock = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

  /* What the stage and the bars say. One table, so the words can be read
     together. */
  const SAY = {
    connecting: 'Starting the microphone',
    listening:  'Listening',
    thinking:   'Thinking',
    speaking:   'Answering',
    muted:      'You’re muted',
    hintSpeak:  'Tap the circle to interrupt',
    hintMuted:  'AiMY can’t hear you until you unmute',
    noSR:       'Voice needs Chrome, Edge or Safari. This browser can’t turn speech into text.',
    blocked:    'The microphone is blocked. Allow it from the address bar, then try again.',
    noMic:      'No microphone was found.',
    network:    'Speech recognition couldn’t reach its service. Check the connection and try again.',
    failed:     'The microphone stopped unexpectedly. Try again.'
  };

  /* The waveform is a row of bars whose heights are re-written in place,
     newest on the right. As many as fill the field's width at 2px + 2px, so
     the dotted baseline runs edge to edge the way ChatGPT's does; counted
     when dictation starts, because every bar is a different width. */
  const BAR_PX = 4;
  const TICK_MS = 70;
  /* How long a pause has to be before a spoken turn is sent. Shorter cuts
     people off mid-thought; longer feels like the call dropped. */
  const SETTLE_MS = 900;
  /* The stage's own exit, matched to --t-base in voice.css. */
  const LEAVE_MS = 220;
  /* How long to wait for a spoken question to raise the beam before deciding
     it was answered without one (or not answered at all). */
  const BEAM_MS = 400;

  /* The composers this page has. Each entry: the bar, its field, its send,
     and what this file mounted into it. The conversation's bar is `ASK`. */
  const SHELLS = [
    { bar: '.overlay-input-bar', input: '.overlay-input', send: '.overlay-send' },
    { bar: '.aimy-float-bar',    input: '.aimy-float-input', send: '.aimy-float-send' }
  ];
  const BARS = [];
  let ASK = null;

  let stage, orb, state, heard, liveClock, mute, end;

  /* One thing at a time, page-wide. `mode` is '' | 'rec' | 'note' | 'live' |
     'error'; `bar` is the composer dictating or showing a note. */
  const S = {
    mode: '', phase: '', bar: null, from: null,
    stream: null, ctx: null, analyser: null, buf: null,
    rec: null, wantRec: false,
    finals: '', interim: '', prefix: '',
    secs: 0, clockT: 0, levelT: 0, settleT: 0, askT: 0, leaveT: 0,
    levels: [], asked: false, spoke: false, before: 0, inerted: []
  };

  /* ── Mount ───────────────────────────────────────────────────────────── */
  function mount() {
    SHELLS.forEach((sh) => {
      document.querySelectorAll(sh.bar).forEach((el) => {
        const b = mountBar(el, $(sh.input, el), $(sh.send, el));
        if (b) BARS.push(b);
      });
    });
    if (!BARS.length || stage) return;
    ASK = BARS.find((b) => b.el.matches('.overlay-input-bar')) || BARS[0];
    mountStage();
    document.addEventListener('keydown', onKey, true);
  }

  function mountBar(el, input, send) {
    if (!el || !input || !send || $('.vx-mic', el)) return null;
    const b = { el: el, input: input, send: send, wave: [] };

    /* The tools travel as a pair. A clip knowledge.js injected before send
       is MOVED into the group, not re-made, so its delegated handler
       (`closest('#clipBtn')`) still finds it. */
    send.insertAdjacentHTML('beforebegin',
      '<span class="vx-tools">' +
        `<button class="vx-mic" type="button" aria-pressed="false" aria-label="Dictate" title="Dictate">${svg(I.mic, 16)}</button>` +
      '</span>');
    b.tools = $('.vx-tools', el);
    b.mic = $('.vx-mic', el);
    /* knowledge.js injects a clip into the canvas bar, whose chip lands in
       a different place from this file's. Two clips that behave differently
       are two composers, so its button is taken out and every bar gets this
       one. Its handlers look the button up by id at click time and simply
       never find it. */
    el.querySelectorAll('#clipBtn, #clipIn').forEach((n) => n.remove());
    mountClip(b);

    /* Dictation's readout, and dictation's one failure line, both take the
       field's place in the bar. */
    input.insertAdjacentHTML('afterend',
      '<span class="vx-read" hidden>' +
        '<span class="vx-wave" aria-hidden="true"></span>' +
        '<span class="vx-clock" role="timer" aria-label="Dictating for">0:00</span>' +
        `<button class="vx-ctl vx-drop" type="button" aria-label="Cancel dictation" title="Cancel">${svg(I.x, 16)}</button>` +
        `<button class="vx-ctl vx-keep" type="button" aria-label="Use what I said" title="Done">${svg(I.check, 16)}</button>` +
      '</span>' +
      '<span class="vx-note" role="alert" hidden>' +
        '<span class="vx-note-t"></span>' +
        `<button class="vx-ctl vx-note-x" type="button" aria-label="Close this message" title="Close">${svg(I.x, 16)}</button>` +
      '</span>');
    b.read = $('.vx-read', el);
    b.recClock = $('.vx-clock', b.read);
    b.note = $('.vx-note', el);
    b.noteText = $('.vx-note-t', b.note);

    /* Send carries both faces; CSS shows one by whether the field is empty.
       Its own word is parked, because the shells do not agree on it — the
       command bar says Run, the canvas says Send. */
    const face = send.querySelector(':scope > svg');
    if (face) face.classList.add('vx-i-send');
    send.insertAdjacentHTML('beforeend', svg(I.lines, 18, 'vx-i-voice'));
    send.dataset.vxLabel = send.getAttribute('aria-label') || 'Send';

    watchValue(b);
    syncEmpty(b);

    /* CAPTURE, so this runs before the product's own send handler and can
       keep it from seeing a click that was not a send. */
    send.addEventListener('click', (e) => onSend(e, b), true);
    b.mic.addEventListener('click', () => startRec(b));
    $('.vx-keep', b.read).addEventListener('click', () => stopRec(true));
    $('.vx-drop', b.read).addEventListener('click', () => stopRec(false));
    $('.vx-note-x', b.note).addEventListener('click', closeNote);

    /* The answer finishing is `.is-generating` leaving the bar — and the
       product rewrites the send's label when it toggles, so the face is
       re-read after every change. */
    new MutationObserver(() => onBarClass(b)).observe(el, { attributes: true, attributeFilter: ['class'] });
    return b;
  }

  /* ── The clip ────────────────────────────────────────────────────────────
     ChatGPT's way: an attached file grows the composer by a row, with the
     file on top and the controls under it, and the row goes when you take
     it off. Not a chip floating over the bar — Sales keeps its peek card and
     the filter tray in exactly that strip, and a phone has no room beside
     the field for one. */
  function mountClip(b) {
    b.tools.insertAdjacentHTML('afterbegin',
      `<button class="clip-btn vx-clip" type="button" aria-label="Attach a file" title="Attach a file">${svg(I.clip, 16)}</button>` +
      '<input class="vx-clip-in" type="file" hidden />');
    const btn = $('.vx-clip', b.tools), file = $('.vx-clip-in', b.tools);
    btn.addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      dropChip(b);
      if (!f) return;
      const kb = Math.max(1, Math.round(f.size / 1024));
      b.el.insertAdjacentHTML('beforeend',
        '<div class="vx-att">' +
          `<span class="vx-chip">${svg(I.file, 14)}` +
            `<span class="vx-chip-n">${esc(f.name)}</span>` +
            `<span class="vx-chip-note">${kb} KB · not uploaded</span>` +
            `<button class="vx-chip-x" type="button" aria-label="Remove ${esc(f.name)}" title="Remove">${svg(I.x, 12)}</button>` +
          '</span>' +
        '</div>');
      b.chip = b.el.lastElementChild;
      b.el.classList.add('vx-has-file');
      $('.vx-chip-x', b.chip).addEventListener('click', () => {
        dropChip(b);
        file.value = '';
        b.input.focus();
      });
    });
  }

  function dropChip(b) {
    if (!b.chip) return;
    b.chip.remove();
    b.chip = null;
    b.el.classList.remove('vx-has-file');
  }

  /* The stage is the page's last child, so it covers everything the page
     has — rail, masthead, canvas, call panel — and `inert` takes the rest out
     of reach while it is open. */
  function mountStage() {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="vx-stage" id="vxStage" role="dialog" aria-modal="true" aria-label="Voice conversation with AiMY" hidden>' +
        '<div class="vx-top">' +
          /* The navbar's own logo, from the page's own symbol, where the
             navbar draws it — so opening the stage leaves it in place. */
          '<span class="vx-logo"><svg viewBox="0 0 418.18 147.66" role="img" aria-label="AiMY"><use href="#aimy-logo-full"/></svg></span>' +
          '<span class="vx-clock vx-live-clock" role="timer" aria-label="Session length">0:00</span>' +
        '</div>' +
        '<div class="vx-center">' +
          '<button class="vx-orb" type="button" aria-label="Interrupt AiMY" disabled>' +
            '<span class="vx-orb-body" aria-hidden="true">' +
              '<span class="vx-orb-a"></span><span class="vx-orb-b"></span><span class="vx-orb-c"></span>' +
            '</span>' +
          '</button>' +
          '<p class="vx-state" role="status" aria-live="polite">' +
            '<b class="vx-state-n"></b><span class="vx-heard"></span>' +
          '</p>' +
        '</div>' +
        '<div class="vx-dock">' +
          `<button class="vx-round vx-mute" type="button" aria-pressed="false" aria-label="Mute" title="Mute">${svg(I.mic, 22, 'vx-i-on')}${svg(I.micOff, 22, 'vx-i-off')}</button>` +
          `<button class="vx-round vx-end" type="button" aria-label="End the voice session" title="End">${svg(I.x, 22)}</button>` +
        '</div>' +
      '</div>');
    stage = $('#vxStage');
    orb = $('.vx-orb', stage);
    state = $('.vx-state-n', stage);
    heard = $('.vx-heard', stage);
    liveClock = $('.vx-live-clock', stage);
    mute = $('.vx-mute', stage);
    end = $('.vx-end', stage);
    mute.addEventListener('click', toggleMute);
    orb.addEventListener('click', interrupt);
    end.addEventListener('click', endSession);
  }

  /* ══ THE EMPTY BAR IS THE VOICE BAR ═════════════════════════════════════
     The products clear their fields by assigning `.value`, which fires no
     event, so listening for `input` alone would leave the send face showing
     on an empty bar after every question. The instance's own `value` is
     wrapped instead: every write, from any file, re-reads emptiness. */
  function watchValue(b) {
    const proto = b.input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const d = Object.getOwnPropertyDescriptor(proto, 'value');
    if (!d || !d.set) return;
    Object.defineProperty(b.input, 'value', {
      configurable: true,
      get() { return d.get.call(this); },
      set(v) { d.set.call(this, v); syncEmpty(b); }
    });
    b.input.addEventListener('input', () => syncEmpty(b));
  }
  function syncEmpty(b) {
    const empty = !b.input.value.trim();
    b.el.classList.toggle('vx-empty', empty);
    if (b.el.classList.contains('is-generating')) return;
    b.send.setAttribute('aria-label', empty ? 'Start a voice session' : b.send.dataset.vxLabel);
    b.send.title = empty ? 'Voice' : '';
  }

  function onSend(e, b) {
    if (b.el.classList.contains('is-generating') || S.mode) return;
    if (!b.input.value.trim()) { e.stopImmediatePropagation(); startLive(b); }
  }

  function onKey(e) {
    if (!S.mode) return;
    const onStage = S.mode === 'live' || S.mode === 'error';
    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (S.mode === 'rec') stopRec(false);
      else if (S.mode === 'note') closeNote();
      else endSession();
      return;
    }
    /* The stage is modal: Tab goes round its own controls and nowhere else.
       `inert` already takes the page out of the order; this closes the loop
       at the ends so focus does not fall out into the browser chrome. */
    if (e.key === 'Tab' && onStage) {
      const f = [orb, mute, end].filter((x) => !x.disabled && !x.hidden && x.offsetParent);
      if (f.length) {
        const i = f.indexOf(document.activeElement);
        const next = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
        e.preventDefault();
        f[next].focus();
      }
    }
    /* ══ OUR KEYS ARE OURS ═════════════════════════════════════════════════
       Sales reads Enter on any focused button as "the obvious next thing" —
       dial the next lead. With the keep button or the stage focused, Enter
       and Space mean THIS button, so the event is kept from the page's own
       shortcuts. Not prevented: the button still needs its default to
       activate. */
    if (onStage || (e.target.closest && e.target.closest('.vx-read, .vx-note'))) e.stopImmediatePropagation();
  }

  /* ── The microphone, shared by both ──────────────────────────────────── */
  async function openMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw { name: 'NotFoundError' };
    S.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      S.ctx = new AC();
      const src = S.ctx.createMediaStreamSource(S.stream);
      S.analyser = S.ctx.createAnalyser();
      S.analyser.fftSize = 512;
      S.buf = new Uint8Array(S.analyser.fftSize);
      src.connect(S.analyser);
    }
    S.levels = new Array(S.bar ? S.bar.wave.length : 0).fill(0);
    S.levelT = setInterval(sample, TICK_MS);
  }
  function closeMic() {
    clearInterval(S.levelT); S.levelT = 0;
    if (S.stream) S.stream.getTracks().forEach((t) => t.stop());
    if (S.ctx) S.ctx.close().catch(() => {});
    S.stream = S.ctx = S.analyser = S.buf = null;
    BARS.forEach((b) => b.el.style.removeProperty('--vx-lvl'));
    stage.style.removeProperty('--vx-lvl');
  }

  /* RMS of the last window, lifted so ordinary speech reaches the top third
     rather than hugging the floor. Written to a custom property and to the
     wave's transforms only: nothing here touches layout. The orb only hears
     you while it is listening — its own voice is not yours. */
  function sample() {
    let lvl = 0;
    if (S.analyser && !(S.mode === 'live' && S.phase !== 'listening')) {
      S.analyser.getByteTimeDomainData(S.buf);
      let sum = 0;
      for (let i = 0; i < S.buf.length; i++) { const v = (S.buf[i] - 128) / 128; sum += v * v; }
      lvl = Math.min(1, Math.sqrt(sum / S.buf.length) * 5.5);
    }
    if (S.mode === 'live') { stage.style.setProperty('--vx-lvl', lvl.toFixed(3)); return; }
    if (S.mode !== 'rec' || !S.bar || reduced()) return;
    const w = S.bar.wave;
    S.levels.push(lvl); S.levels.shift();
    for (let i = 0; i < w.length; i++) w[i].style.transform = 'scaleY(' + Math.max(0.12, S.levels[i]).toFixed(3) + ')';
  }

  function tickClock(el) {
    clearInterval(S.clockT);
    S.secs = 0; el.textContent = clock(0);
    S.clockT = setInterval(() => { S.secs++; el.textContent = clock(S.secs); }, 1000);
  }

  function micError(err) {
    const n = err && (err.name || err.error);
    if (n === 'NotAllowedError' || n === 'not-allowed' || n === 'service-not-allowed' || n === 'SecurityError') return SAY.blocked;
    if (n === 'NotFoundError' || n === 'audio-capture' || n === 'OverconstrainedError') return SAY.noMic;
    if (n === 'network') return SAY.network;
    return SAY.failed;
  }

  /* ── Recognition ─────────────────────────────────────────────────────── */
  /* ══ A LANGUAGE WITH A REGION, ALWAYS ═══════════════════════════════════
     Edge sends speech to Microsoft's service, and that service answers a
     bare `en` — which is what `<html lang="en">` gives — with the error
     `network`, every time, the moment the mic opens. Measured in Edge 154
     on this machine with a fake mic: `en` → network, `en-US` → a result.
     So the page's language only chooses WHICH language; the region comes
     from the person's own browser list, and English without one is en-US. */
  function speechLang() {
    const page = (document.documentElement.lang || '').trim();
    if (/^[a-z]{2,3}-[A-Za-z]{2,4}$/i.test(page)) return page;
    const mine = [].concat(navigator.languages || [], navigator.language || []);
    const base = (page || mine[0] || 'en').split('-')[0].toLowerCase();
    const near = mine.find((l) => l.toLowerCase().indexOf(base + '-') === 0);
    return near || ({ en: 'en-US', ar: 'ar-EG', fr: 'fr-FR', de: 'de-DE', es: 'es-ES' }[base] || base);
  }

  function makeRec() {
    const r = new (SRC())();
    r.lang = speechLang();
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) S.finals += (S.finals && !/\s$/.test(S.finals) ? ' ' : '') + t.trim();
        else interim += t;
      }
      S.interim = interim.trim();
      onWords();
    };
    r.onerror = (e) => {
      /* Silence and our own stops are not faults. */
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      fail(micError(e));
    };
    /* Chrome ends a continuous session on its own after a minute or a long
       silence. While we still want to hear, it is restarted. */
    r.onend = () => { if (S.wantRec && S.rec === r) { try { r.start(); } catch (_) {} } };
    return r;
  }
  function listen() {
    if (!SRC()) return;
    S.wantRec = true;
    if (!S.rec) S.rec = makeRec();
    try { S.rec.start(); } catch (_) { /* already running */ }
  }
  function deafen() {
    S.wantRec = false;
    if (S.rec) { try { S.rec.abort(); } catch (_) {} }
    S.rec = null;
  }

  /* ══ DICTATION ═══════════════════════════════════════════════════════════ */
  async function startRec(b) {
    if (S.mode) return;
    if (!SRC()) { showNote(b, SAY.noSR); return; }
    S.mode = 'rec';
    S.bar = b;
    S.finals = S.interim = '';
    S.prefix = b.input.value.replace(/\s+$/, '');
    b.el.dataset.vx = 'rec';
    b.read.hidden = false;
    b.mic.setAttribute('aria-pressed', 'true');
    const row = $('.vx-wave', b.read);
    row.innerHTML = '<i></i>'.repeat(Math.ceil(row.clientWidth / BAR_PX) + 1);
    b.wave = Array.from(row.children);
    tickClock(b.recClock);
    /* The field it replaced had focus; the keep button inherits it, so
       Enter accepts and Escape cancels without reaching for the mouse. */
    $('.vx-keep', b.read).focus();
    try {
      await openMic();
    } catch (err) {
      if (S.mode === 'rec') fail(micError(err));
      return;
    }
    if (S.mode !== 'rec') { closeMic(); return; }
    listen();
  }

  /* `keep` puts the words in the field. */
  function stopRec(keep) {
    if (S.mode !== 'rec') return;
    const b = S.bar;
    const said = (S.finals + (S.interim ? ' ' + S.interim : '')).trim();
    deafen();
    closeMic();
    clearInterval(S.clockT);
    S.mode = '';
    S.bar = null;
    delete b.el.dataset.vx;
    b.read.hidden = true;
    b.mic.setAttribute('aria-pressed', 'false');
    if (keep && said) b.input.value = (S.prefix ? S.prefix + ' ' : '') + said;
    syncEmpty(b);
    b.input.focus();
    const at = b.input.value.length;
    try { b.input.setSelectionRange(at, at); } catch (_) {}
    b.input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* A dictation that could not start says why in its bar, then gets out of
     the way. The field is untouched. */
  function showNote(b, msg) {
    S.mode = 'note';
    S.bar = b;
    b.el.dataset.vx = 'note';
    b.note.hidden = false;
    b.noteText.textContent = msg;
    $('.vx-note-x', b.note).focus();
  }
  function closeNote() {
    if (S.mode !== 'note') return;
    const b = S.bar;
    S.mode = '';
    S.bar = null;
    delete b.el.dataset.vx;
    b.note.hidden = true;
    b.input.focus();
  }

  /* ══ THE STAGE ═══════════════════════════════════════════════════════════
     Opening it takes the page out of reach — `inert` on everything else, so
     a screen reader and the Tab key both stay on the conversation — and
     closing it gives the page back exactly as it was. */
  function openStage() {
    clearTimeout(S.leaveT);
    S.inerted = Array.from(document.body.children).filter((el) => el !== stage && !el.inert);
    S.inerted.forEach((el) => { el.inert = true; });
    document.body.classList.add('vx-staged');
    stage.hidden = false;
    void stage.offsetWidth;          /* the entry transition needs a start */
    stage.classList.add('is-open');
  }
  function closeStage() {
    stage.classList.remove('is-open');
    S.inerted.forEach((el) => { el.inert = false; });
    S.inerted = [];
    document.body.classList.remove('vx-staged');
    delete stage.dataset.phase;
    S.leaveT = setTimeout(() => { stage.hidden = true; }, reduced() ? 0 : LEAVE_MS);
    /* Back to the conversation if anything was said — it now holds what
       was — and otherwise back to the bar the session was started from.
       Only a bar that is actually on screen: Sales answers into the peek
       above its command bar without opening the canvas, and a closed canvas
       is faded rather than removed, so `offsetParent` alone says yes. */
    const order = S.spoke ? [ASK, S.from] : [S.from, ASK];
    const back = order.find((b) => b && onScreen(b));
    if (back) back.input.focus();
  }
  function onScreen(b) {
    const r = b.el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && b.el.contains(hit);
  }

  /* ══ THE LIVE SESSION ════════════════════════════════════════════════════ */
  async function startLive(from) {
    if (S.mode) return;
    S.mode = 'live';
    S.from = from || ASK;
    S.finals = S.interim = '';
    S.asked = S.spoke = false;
    openStage();
    mute.hidden = false;
    liveClock.hidden = false;
    end.setAttribute('aria-label', 'End the voice session');
    end.title = 'End';
    if (!SRC()) { fail(SAY.noSR); return; }
    setPhase('connecting');
    tickClock(liveClock);
    end.focus();
    /* Speech synthesis in Chrome needs a user gesture to unlock; this click
       is the one. An empty utterance spends it without making a sound. */
    if (TTS) { try { TTS.cancel(); TTS.speak(new SpeechSynthesisUtterance('')); } catch (_) {} }
    try {
      await openMic();
    } catch (err) {
      if (S.mode === 'live') fail(micError(err));
      return;
    }
    if (S.mode !== 'live') { closeMic(); return; }
    setPhase('listening');
    listen();
  }

  function setPhase(p) {
    S.phase = p;
    stage.dataset.phase = p;
    state.textContent = SAY[p] || '';
    heard.textContent = p === 'speaking' ? SAY.hintSpeak : p === 'muted' ? SAY.hintMuted : '';
    /* The orb is a button only while there is something to interrupt. */
    orb.disabled = p !== 'speaking';
    const muted = p === 'muted';
    mute.setAttribute('aria-pressed', String(muted));
    mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    mute.title = muted ? 'Unmute' : 'Mute';
    mute.disabled = p === 'connecting';
  }

  /* Words arriving. Dictation only keeps them; a live turn shows them under
     the orb as they come — the one line of text the stage has, so you can see
     you were heard — and sends once you have paused. */
  function onWords() {
    if (S.mode !== 'live' || S.phase !== 'listening') return;
    heard.textContent = tail((S.finals + (S.interim ? ' ' + S.interim : '')).trim());
    clearTimeout(S.settleT);
    if (S.finals && !S.interim) S.settleT = setTimeout(askNow, SETTLE_MS);
  }

  const answers = () => document.querySelectorAll('#overlayThread .chat-msg.aimy .msg-bubble');

  function askNow() {
    if (S.mode !== 'live' || S.phase !== 'listening') return;
    const q = (S.finals + ' ' + S.interim).trim();
    S.finals = S.interim = '';
    if (!q) return;
    /* Not listening while AiMY answers: its own voice would be heard as
       yours. The mic stays open, so picking up again is instant. */
    deafen();
    setPhase('thinking');
    heard.textContent = tail(q);
    S.asked = S.spoke = true;
    S.before = answers().length;
    ASK.input.value = q;
    ASK.send.click();
    /* Not every sentence raises the beam. Some phrases steer the surface
       instead of answering (a filter, a record by name), and some answers
       land in one go without being typed in. So if no beam rose: speak the
       new answer if there is one, and otherwise go back to listening. */
    clearTimeout(S.askT);
    S.askT = setTimeout(() => {
      if (S.mode !== 'live' || S.phase !== 'thinking' || ASK.el.classList.contains('is-generating')) return;
      S.asked = false;
      if (answers().length > S.before) speak(lastAnswer());
      else resume();
    }, BEAM_MS);
  }

  function onBarClass(b) {
    syncEmpty(b);
    if (b !== ASK || S.mode !== 'live' || !S.asked) return;
    if (b.el.classList.contains('is-generating')) return;
    /* The run is over: answered, or stopped. */
    S.asked = false;
    speak(lastAnswer());
  }

  /* The answer as prose: the bubble without its disclosures, trace and
     follow-ups, cut at a sentence end so a long answer is summarised by its
     opening rather than read in full. The rest is in the thread. */
  function lastAnswer() {
    const all = answers();
    const b = all[all.length - 1];
    if (!b) return '';
    /* An answer that has a body is read from its body: the match cards, the
       trust row and the apply button above and below it are things to look
       at, and "Out of date · A. Mahfouz · Article" is not a sentence. */
    const whole = b.cloneNode(true);
    const c = whole.querySelector('.answer-body') || whole;
    c.querySelectorAll('.sk-used, .act-log, details, .msg-follow, .msg-acts, .rs-head, .rs-list, ' +
      '.type-card, .trust-disclosure, .answer-apply, button, script, style, ' +
      /* A citation is a number and a hover card, neither of them prose. */
      '.cite-wrap, [role="tooltip"], [hidden], [aria-hidden="true"], svg').forEach((n) => n.remove());
    /* Blocks meet without whitespace in textContent ("outright.They"). */
    c.querySelectorAll('p, li, div, h1, h2, h3, h4, td').forEach((n) => n.append(' '));
    let t = (c.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.length > 420) {
      const cut = t.slice(0, 420);
      const at = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
      t = (at > 120 ? cut.slice(0, at + 1) : cut + '…') + ' The rest is in the conversation.';
    }
    return t;
  }

  function speak(text) {
    if (S.mode !== 'live') return;
    if (!TTS || !text) { resume(); return; }
    setPhase('speaking');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang();
    u.rate = 1.04;
    u.onend = u.onerror = () => { if (S.mode === 'live' && S.phase === 'speaking') resume(); };
    TTS.cancel();
    TTS.speak(u);
  }

  /* Tapping the orb while it answers. */
  function interrupt() {
    if (S.mode !== 'live' || S.phase !== 'speaking') return;
    if (TTS) TTS.cancel();
    resume();
  }

  function resume() {
    if (S.mode !== 'live') return;
    setPhase('listening');
    listen();
  }

  function toggleMute() {
    if (S.mode !== 'live') return;
    if (S.phase === 'muted') { resume(); return; }
    clearTimeout(S.settleT);
    S.finals = S.interim = '';
    deafen();
    if (TTS) TTS.cancel();
    setPhase('muted');
  }

  function endSession() {
    if (S.mode !== 'live' && S.mode !== 'error') return;
    deafen();
    closeMic();
    clearTimeout(S.settleT);
    clearTimeout(S.askT);
    clearInterval(S.clockT);
    if (TTS) TTS.cancel();
    S.mode = S.phase = '';
    S.asked = false;
    closeStage();
  }

  /* ── When it cannot work ─────────────────────────────────────────────────
     Said in words, with one way out: in the bar for dictation, on the stage
     for a conversation. */
  function fail(msg) {
    if (S.mode === 'rec') { const b = S.bar; stopRec(false); showNote(b, msg); return; }
    deafen(); closeMic(); clearInterval(S.clockT); clearTimeout(S.settleT);
    if (TTS) TTS.cancel();
    S.mode = 'error';
    S.phase = '';
    stage.dataset.phase = 'error';
    state.textContent = msg;
    heard.textContent = '';
    orb.disabled = true;
    mute.hidden = true;
    liveClock.hidden = true;
    end.setAttribute('aria-label', 'Close');
    end.title = 'Close';
    end.focus();
  }

  /* The products build their composers' extras — the clip, the beam — when
     their own scripts run, which is before this file on every page. */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 0));
  else setTimeout(mount, 0);

  /* `_read` is exported so what gets spoken can be checked against a real
     answer without a speaker. */
  window.AIMY_VOICE = { mount: mount, _state: S, _bars: BARS, _read: lastAnswer };
})();
