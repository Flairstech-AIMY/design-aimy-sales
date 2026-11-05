/* ═══════════════════════════════════════════════════════════════════════════
   SALES: THE SCROLL DOT ON TWO AREAS ONLY (Nour, 5 Nov 2026)
   QA's aimy-scroll.js (origin/main 9911c5e), the UI library's Scroll dot,
   ported as it is with three changes:
   1. OPT-IN. QA finds every scroller by itself; here only the main page
      (#pageScroll) and the chat thread (#overlayThread, with the clickable
      track and the Latest pill, as the library's thread demo has it) get the
      dot. Rails, navs, menus and every other scroller keep the build's own
      bar (aimy-ds.css). Nothing is attached on scroll, click or mutation;
      those only re-measure.
   2. ZOOM. Sales zooms <body> by --ui-scale (aimy-responsive.css). Rects come
      back in visual px while the rail's left, top and height are CSS px the
      engine then scales, so every length written is the visual one divided
      by the zoom, and a drag's pointer travel is divided the same way.
   3. CRLF, like every file here.
   ═══════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
   AIMY SCROLL DOT — ONE SCROLL INDICATOR, EVERY VERTICAL SCROLLER

   Replaces the native vertical scrollbar with a translucent accent dot (styles
   in assets/aimy-scroll.css). While a surface scrolls the dot trails a flame
   sized by speed; when it stops the flame pulls in and the dot lands with a
   squash-and-settle. Drag the dot to scroll.

   FOUND, NOT REMEMBERED. Like the shared scrollbar in aimy-responsive.css §9,
   a surface gets this by existing: the document is scanned on load, after
   DOM insertions, after clicks and transitions (which is how drawers and
   overlays open), and any element that scrolls is picked up on its first
   scroll event regardless. Opt a subtree out with data-scroll-dot="off".

   NOT COVERED, ON PURPOSE: surfaces that scroll on both axes (tables) keep
   the native bars, because a dot cannot say where you are horizontally; and
   text fields, which have their own caret-driven scrolling.

   PLACEMENT. The rail is an absolutely positioned sibling in the scroller's
   offsetParent, never a child of the scroller: a child would scroll with the
   content, take a flex/grid slot in some layouts and be counted by page code
   that reads `childElementCount`. Positioned from rect differences so a
   transformed overlay mid-slide still lands it in the right place. A
   scroller that is itself `position: fixed` gets a fixed rail on <body>.

   Driven by scroll events and timers, not rAF: rAF does not fire while the
   page is not compositing (see aimy-canvas.js initTrayHint).

   API — window.AimyScroll
     attach(el, opts)  pick up el now, or update its options
       opts.track     true: clicking the empty rail jumps there
       opts.latest     true: show a "Latest" pill once scrolled up
     refresh()         re-measure every rail
     scan()            look for new scrollers now
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.AimyScroll) return;

  var DOT = 10;                 /* px, matches .aimy-scroll-head */
  var RAIL_W = 16;              /* px, matches .aimy-scroll */
  /* Rail right edge to the surface edge. The dot ends 3px inside the rail and
     its 4px halo reaches past it, so 3 here leaves the halo 2px clear of the
     edge instead of clipped by it. */
  var EDGE_GAP = 3;
  var MIN_H = 60;               /* shorter scrollers keep no indicator */
  var MIN_ROOM = 8;             /* px of overflow worth indicating; less is rounding */
  var EDGE = 6;                 /* default inset from the scroller's top/bottom */
  var PAD_RESPECT = 40;         /* padding at least this large is chrome, not content */
  var FLAME_MIN = 12, FLAME_MAX = 64;
  var LATEST_AFTER = 120;       /* px from the bottom before the pill shows */
  var ARROW_DOWN = '<svg class="lucide lucide-arrow-down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>';

  var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var RAILS = [];
  var BY_EL = typeof WeakMap === "function" ? new WeakMap() : null;
  var ro = window.ResizeObserver ? new ResizeObserver(function () { soon(refresh); }) : null;

  /* The zoom on <body>: rects are visual px, written lengths are CSS px. */
  function zk() { return parseFloat(getComputedStyle(document.body).zoom) || 1; }
  function rootEl() { return document.scrollingElement || document.documentElement; }
  function isRoot(el) { return el === rootEl() || el === document.documentElement || el === document.body; }
  function railOf(el) { return BY_EL ? BY_EL.get(el) : null; }

  /* ── WHICH ELEMENTS QUALIFY ── */
  function scrollsY(el) {
    if (isRoot(el)) {
      var o = getComputedStyle(document.documentElement).overflowY;
      var b = getComputedStyle(document.body).overflowY;
      return o !== "hidden" && o !== "clip" && b !== "hidden" && b !== "clip";
    }
    var y = getComputedStyle(el).overflowY;
    return y === "auto" || y === "scroll" || y === "overlay";
  }
  function scrollsBothWays(el) {
    if (el.scrollWidth <= el.clientWidth + 1) return false;
    var x = getComputedStyle(el).overflowX;
    return x === "auto" || x === "scroll" || x === "overlay";
  }
  function eligible(el) {
    if (!el || el.nodeType !== 1 || railOf(el)) return false;
    if (/^(TEXTAREA|SELECT|INPUT|IFRAME|HEAD|SCRIPT|STYLE)$/.test(el.tagName)) return false;
    if (el.classList.contains("aimy-scroll")) return false;
    if (el.clientHeight < MIN_H || el.scrollHeight - el.clientHeight < MIN_ROOM) return false;
    if (el.closest && el.closest('[data-scroll-dot="off"]')) return false;
    if (!scrollsY(el) || scrollsBothWays(el)) return false;
    return true;
  }

  /* ── ONE RAIL ── */
  function attach(el, opts) {
    if (el === document || el === document.body || el === document.documentElement) el = rootEl();
    var r = railOf(el);
    if (r) {
      if (opts) { Object.keys(opts).forEach(function (k) { r.opts[k] = opts[k]; }); build(r); layout(r); }
      return r;
    }
    r = { el: el, opts: opts || {}, flame: 0, lastY: null, lastT: 0, y: 0, stop: 0, drag: null };
    RAILS.push(r);
    if (BY_EL) BY_EL.set(el, r);
    el.classList.add("has-scroll-dot");
    build(r);
    if (ro && !isRoot(el)) ro.observe(el);
    layout(r);
    return r;
  }

  function build(r) {
    if (!r.rail) {
      var rail = document.createElement("div");
      rail.className = "aimy-scroll is-idle";
      rail.setAttribute("aria-hidden", "true");
      rail.innerHTML = '<div class="aimy-scroll-head"><span class="aimy-scroll-tail"></span><span class="aimy-scroll-dot"></span></div>';
      r.rail = rail;
      r.head = rail.firstChild;
      r.tail = r.head.firstChild;
      wire(r);
    }
    r.rail.classList.toggle("has-track", !!r.opts.track);
    if (r.opts.latest && !r.latest) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "aimy-scroll-latest";
      b.innerHTML = ARROW_DOWN + "<span>Latest</span>";
      b.setAttribute("aria-label", "Jump to the latest message");
      b.tabIndex = -1;
      b.addEventListener("click", function () {
        r.el.scrollTo({ top: r.el.scrollHeight, behavior: calm ? "auto" : "smooth" });
      });
      r.latest = b;
    }
  }

  function wire(r) {
    var head = r.head, rail = r.rail;
    rail.addEventListener("animationend", function () { rail.classList.remove("is-landing"); });
    head.addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      r.drag = { y: e.clientY, top: r.el.scrollTop };
      rail.classList.add("is-dragging");
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener("pointermove", function (e) {
      if (!r.drag) return;
      var room = r.el.scrollHeight - r.el.clientHeight;
      r.el.scrollTop = r.drag.top + (e.clientY - r.drag.y) / zk() * room / Math.max(1, r.railH - DOT);
    });
    function end() { r.drag = null; rail.classList.remove("is-dragging"); }
    head.addEventListener("pointerup", end);
    head.addEventListener("pointercancel", end);
    head.addEventListener("lostpointercapture", end);
    rail.addEventListener("pointerdown", function (e) {
      if (e.target !== rail || !r.opts.track) return;
      var at = (e.clientY - rail.getBoundingClientRect().top) / zk() / Math.max(1, r.railH);
      r.el.scrollTo({ top: at * r.el.scrollHeight - r.el.clientHeight / 2, behavior: calm ? "auto" : "smooth" });
    });
  }

  function destroy(r) {
    if (r.rail && r.rail.parentNode) r.rail.parentNode.removeChild(r.rail);
    if (r.latest && r.latest.parentNode) r.latest.parentNode.removeChild(r.latest);
    if (ro && !isRoot(r.el)) ro.unobserve(r.el);
    r.el.classList.remove("has-scroll-dot");
    if (BY_EL) BY_EL.delete(r.el);
    RAILS.splice(RAILS.indexOf(r), 1);
  }

  function rendered(el) {
    if (isRoot(el)) return true;
    if (!el.getClientRects().length) return false;
    if (el.checkVisibility) return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    return true;
  }

  /* Where the rail lives and which coordinate space it is written in. */
  function hostOf(el) {
    if (isRoot(el)) return { node: document.body, fixed: true };
    var op = el.offsetParent;
    if (!op) return getComputedStyle(el).position === "fixed" ? { node: document.body, fixed: true } : null;
    return { node: op, fixed: false };
  }

  /* The rail must paint exactly where its scroller paints in the host's
     stacking order: above a drawer it belongs to, below a drawer that covers
     its page. That level is set by the outermost z-indexed ancestor between
     the scroller and the host, so the rail takes that z-index; being appended
     last in the host, it then paints just above its own scroller. */
  function zOf(el, host) {
    var z = null;
    for (var a = el; a && a !== host && a !== document.body; a = a.parentElement) {
      var cs = getComputedStyle(a);
      if (cs.zIndex !== "auto" && cs.position !== "static") z = cs.zIndex;
    }
    return z;
  }

  /* The part of el that is actually on screen: ancestors between el and its
     host that clip (a page scroller, a collapsed panel) are not ancestors of
     the rail, so they cannot clip it for us. */
  function visibleBox(el, host) {
    if (isRoot(el)) return { top: 0, left: 0, right: document.documentElement.clientWidth, bottom: window.innerHeight };
    var b = el.getBoundingClientRect();
    var box = { top: b.top + el.clientTop, left: b.left + el.clientLeft, bottom: b.top + el.clientTop + el.clientHeight, right: Math.min(b.left + el.clientLeft + el.clientWidth, b.right), full: b };
    var clip = { top: -Infinity, bottom: Infinity };
    for (var a = el.parentElement; a && a !== host && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).overflowY === "visible") continue;
      var ab = a.getBoundingClientRect();
      clip.top = Math.max(clip.top, ab.top + a.clientTop);
      clip.bottom = Math.min(clip.bottom, ab.top + a.clientTop + a.clientHeight);
    }
    box.clipTop = clip.top; box.clipBottom = clip.bottom;
    return box;
  }

  /* The right edge the dot sits on: where the native bar was. For a reading
     column centred in a wider panel (the chat thread, the full email thread,
     both max-width columns) that is the panel's edge, not the column's —
     a dot floating beside the text reads as part of the content. */
  function columnEdge(el, box) {
    var p = el.parentElement;
    if (!p || p === document.body) return box.right;
    var pb = p.getBoundingClientRect();
    /* clientWidth is rounded to a whole pixel; on a fractional-width panel it
       overshoots the real edge, so clamp to the rect. */
    var inL = pb.left + p.clientLeft, inR = Math.min(inL + p.clientWidth, pb.right);
    var gapL = box.full.left - inL, gapR = inR - box.full.right;
    /* 12px, not more: the email thread's margins shrink to ~37px at laptop
       widths, and it is still a centred column there. */
    return gapR >= 12 && Math.abs(gapL - gapR) <= 24 ? inR : box.right;
  }

  function layout(r) {
    var el = r.el;
    if (!el.isConnected) { destroy(r); return; }
    var room = el.scrollHeight - el.clientHeight;
    var host = rendered(el) ? hostOf(el) : null;
    var root = isRoot(el);
    var height = root ? window.innerHeight : el.clientHeight;
    if (!host || room < MIN_ROOM || height < MIN_H) { hide(r); return; }

    var cs = root ? null : getComputedStyle(el);
    var padT = cs ? parseFloat(cs.paddingTop) || 0 : 0;
    var padB = cs ? parseFloat(cs.paddingBottom) || 0 : 0;
    var insT = padT >= PAD_RESPECT ? padT - 12 : EDGE;
    var insB = padB >= PAD_RESPECT ? padB - 12 : EDGE;

    var box = visibleBox(el, host.node);
    var top = box.top + insT, bottom = box.bottom - insB;
    if (box.clipTop != null) { top = Math.max(top, box.clipTop + EDGE); bottom = Math.min(bottom, box.clipBottom - EDGE); }
    var left = (root ? box.right : columnEdge(el, box)) - RAIL_W - EDGE_GAP;
    var railH = bottom - top;
    if (railH < DOT * 3) { hide(r); return; }

    var rail = r.rail;
    if (rail.parentNode !== host.node) host.node.appendChild(rail);
    if (r.latest && r.latest.parentNode !== host.node) host.node.appendChild(r.latest);

    var dx = 0, dy = 0, K = zk(), X, Y;
    var z = root ? "5" : zOf(el, host.node);
    rail.style.zIndex = z == null ? "auto" : z;
    if (r.latest) r.latest.style.zIndex = z == null ? "3" : z;
    /* X and Y turn a visual x and y into the rail's own CSS px. */
    if (host.fixed) {
      rail.style.position = "fixed";
      if (r.latest) r.latest.style.position = "fixed";
      X = function (v) { return v / K; };
      Y = function (v) { return v / K; };
    } else {
      rail.style.position = "";
      var h = host.node;
      if (h === document.body && getComputedStyle(h).position === "static") {
        dx = window.scrollX; dy = window.scrollY;
        X = function (v) { return (v + dx) / K; };
        Y = function (v) { return (v + dy) / K; };
      } else {
        var hb = h.getBoundingClientRect();
        X = function (v) { return (v - hb.left) / K - h.clientLeft + h.scrollLeft; };
        Y = function (v) { return (v - hb.top) / K - h.clientTop + h.scrollTop; };
      }
      var maxLeft = (h === document.body ? document.documentElement.clientWidth : h.clientWidth) - RAIL_W - EDGE_GAP;
      if (X(left) > maxLeft) left = left - (X(left) - maxLeft) * K;
    }
    rail.style.left = X(left) + "px";
    rail.style.top = Y(top) + "px";
    rail.style.height = (railH / K) + "px";
    r.railH = railH / K;

    if (r.latest) {
      var mid = box.full ? box.full.left + box.full.width / 2 : (box.left + box.right) / 2;
      r.latest.style.left = X(mid) + "px";
      r.latest.style.top = Y(box.bottom - (Math.max(padB, EDGE) + 44) * K) + "px";
    }
    place(r);
  }

  function hide(r) {
    r.rail.classList.add("is-idle");
    if (r.latest) { r.latest.classList.remove("is-visible"); r.latest.tabIndex = -1; }
    r.lastY = null;
  }

  function place(r) {
    var el = r.el, room = el.scrollHeight - el.clientHeight;
    if (room < MIN_ROOM || !r.railH) { hide(r); return null; }
    r.rail.classList.remove("is-idle");
    if (r.latest) {
      var show = room - el.scrollTop > LATEST_AFTER;
      r.latest.classList.toggle("is-visible", show);
      r.latest.tabIndex = show ? 0 : -1;
    }
    r.y = Math.max(0, Math.min(1, el.scrollTop / room)) * (r.railH - DOT);
    r.head.style.transform = "translateY(" + r.y + "px)";
    return r.y;
  }

  function land(r) {
    r.rail.classList.remove("is-moving");
    r.flame = 0;
    r.tail.style.transform = "scaleY(0)";
    if (calm) return;
    r.rail.classList.remove("is-landing");
    void r.rail.offsetWidth;  /* restart the bounce if it is still playing */
    r.rail.classList.add("is-landing");
  }

  /* The flame follows how fast the CONTENT moves, not the dot: on a long
     email thread the dot crawls a pixel per wheel step, and a flame sized by
     that would never show on exactly the surfaces that scroll the most. */
  function onScroll(r) {
    var prev = r.lastY, now = Date.now();
    if (r.rail.classList.contains("is-idle") || r.railH == null) layout(r);
    if (place(r) == null) { r.lastY = null; return; }
    var top = r.el.scrollTop;
    if (prev != null && !calm) {
      var d = top - r.lastTop, dt = Math.max(16, now - r.lastT);
      if (Math.abs(d) > 0.5) {
        r.rail.classList.toggle("is-down", d > 0);
        r.rail.style.setProperty("--land", d > 0 ? 1 : -1);
        r.rail.classList.remove("is-landing");
        r.rail.classList.add("is-moving");
        var want = Math.min(FLAME_MAX, FLAME_MIN + Math.abs(d / dt) * 24);
        r.flame = r.flame ? r.flame * 0.55 + want * 0.45 : want;
        r.tail.style.transform = "scaleY(" + (r.flame / FLAME_MAX).toFixed(3) + ")";
      }
    }
    r.lastY = r.y; r.lastTop = top; r.lastT = now;
    clearTimeout(r.stop);
    r.stop = setTimeout(function () { land(r); }, 130);
  }

  /* ── THE WHOLE DOCUMENT ── */
  function refresh() { RAILS.slice().forEach(layout); }

  function scanIn(node) {
    if (!node || node.nodeType !== 1) return;
    if (eligible(node)) attach(node);
    var all = node.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) if (eligible(all[i])) attach(all[i]);
  }
  function scan() {
    var root = rootEl();
    if (eligible(root)) attach(root);
    scanIn(document.body);
    refresh();
  }

  var timers = {};
  function soon(fn, ms) {
    var k = fn === scan ? "scan" : "refresh";
    clearTimeout(timers[k]);
    timers[k] = setTimeout(fn, ms || 60);
  }

  document.addEventListener("scroll", function (e) {
    var el = e.target === document ? rootEl() : e.target;
    if (!el || el.nodeType !== 1) return;
    var r = railOf(el);
    if (r) onScroll(r);
    /* A scroller inside this one moved with it; its rail lives outside. */
    if (RAILS.length > 1) RAILS.forEach(function (o) {
      if (o !== r && o.el !== el && el.contains(o.el)) layout(o);
    });
  }, true);

  window.addEventListener("resize", function () { soon(refresh); });
  document.addEventListener("click", function () { soon(refresh, 120); }, true);
  document.addEventListener("transitionend", function () { soon(refresh, 30); }, true);
  document.addEventListener("animationend", function (e) {
    if (e.target && e.target.closest && e.target.closest(".aimy-scroll")) return;
    soon(refresh, 30);
  }, true);

  /* The two areas (Nour): the page, and the chat thread. */
  function boot() {
    var page = document.getElementById("pageScroll");
    var thread = document.getElementById("overlayThread");
    if (page) attach(page);
    if (thread) attach(thread, { track: true, latest: true });
    refresh();
    if (window.MutationObserver) {
      new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) {
          var t = list[i].target;
          if (t.nodeType === 1 && t.closest && t.closest(".aimy-scroll, .aimy-scroll-latest")) continue;
          soon(refresh, 150);
          return;
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
    /* Pages finish rendering after their own boot; look again once they have. */
    setTimeout(refresh, 400);
    window.addEventListener("load", function () { soon(refresh, 50); });
  }

  window.AimyScroll = { attach: attach, refresh: refresh, scan: scan };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
