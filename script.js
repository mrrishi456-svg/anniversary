/* Photo album: one photo per page. Tap the page (or swipe, or use the arrows) and the page turns.
   The photo list is the hidden <div id="pages"> in index.html. */
(function () {
  var book = document.getElementById("book");
  var pool = document.getElementById("pages");
  var pageA = document.getElementById("page-a");
  var pageB = document.getElementById("page-b");
  var count = document.getElementById("acount");
  var prevBtn = document.getElementById("aprev");
  var nextBtn = document.getElementById("anext");
  if (!book || !pool || !pageA || !pageB) return;

  var photos = Array.prototype.map.call(pool.querySelectorAll("img"), function (im) {
    return { src: im.src, alt: im.alt, pos: im.getAttribute("data-pos") || "50% 25%" };
  });
  var n = photos.length;
  if (!n) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = 0;
  var busy = false;
  var top = pageA;
  var under = pageB;

  function wrap(i) { return ((i % n) + n) % n; }

  function setPage(page, i) {
    var p = photos[wrap(i)];
    var img = page.querySelector("img");
    img.src = p.src;
    img.alt = p.alt;
    img.style.objectPosition = p.pos;
    page.setAttribute("data-cap", "Page " + (wrap(i) + 1));
  }

  function role(el, name) {
    el.classList.remove("is-top", "is-under", "is-lift", "turn-next");
    el.classList.add(name);
  }

  function label() {
    count.textContent = (cur + 1) + " / " + n;
    var warm = new Image();
    warm.src = photos[wrap(cur + 2)].src;
  }

  function show() {
    setPage(top, cur);
    setPage(under, cur + 1);
    label();
  }

  function turn(dir) {
    if (busy) return;
    if (reduce) { cur = wrap(cur + dir); show(); return; }
    busy = true;
    var mover = dir === 1 ? top : under;
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      mover.removeEventListener("animationend", finish);
      if (dir === 1) {
        cur = wrap(cur + 1);
        var old = top;
        role(under, "is-top");
        role(old, "is-under");
        top = under;
        under = old;
        setPage(under, cur + 1);
      } else {
        cur = wrap(cur - 1);
        var gone = top;
        role(mover, "is-top");
        role(gone, "is-under");
        top = mover;
        under = gone;
      }
      label();
      busy = false;
    }

    if (dir === 1) {
      mover.classList.add("turn-next");
    } else {
      setPage(mover, cur - 1);
      mover.classList.add("is-lift");
    }
    mover.addEventListener("animationend", finish);
    setTimeout(finish, 1200);
  }

  var startX = null;
  book.addEventListener("pointerdown", function (e) { startX = e.clientX; });
  book.addEventListener("pointercancel", function () { startX = null; });
  book.addEventListener("pointerup", function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 14) turn(1);
    else turn(dx < 0 ? 1 : -1);
  });
  book.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); turn(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
  });
  prevBtn.addEventListener("click", function () { turn(-1); });
  nextBtn.addEventListener("click", function () { turn(1); });

  show();
})();

/* Password screen: enter the code, watch the 10 second countdown, then the page opens.
   This is a surprise screen, not real security. Change CODE or SECONDS here. */
(function () {
  var CODE = "1217";
  var SECONDS = 10;

  var gate = document.getElementById("gate");
  if (!gate) return;

  var form = document.getElementById("gate-form");
  var input = document.getElementById("code");
  var msg = document.getElementById("gate-msg");
  var stageLock = document.getElementById("stage-lock");
  var stageCount = document.getElementById("stage-count");
  var num = document.getElementById("count-num");
  var bar = document.getElementById("bar");
  var label = document.getElementById("count-label");
  var line = document.getElementById("count-line");
  var hearts = document.getElementById("gate-hearts");
  var root = document.documentElement;

  var others = Array.prototype.filter.call(document.body.children, function (el) {
    return el !== gate && el.tagName !== "SCRIPT" && el.tagName !== "NOSCRIPT";
  });
  others.forEach(function (el) { el.setAttribute("inert", ""); });
  root.style.overflow = "hidden";

  function floaters(n, burst) {
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.textContent = "♥";
      s.style.setProperty("--x", Math.round(Math.random() * 96) + "%");
      s.style.setProperty("--s", (0.8 + Math.random() * 1.4).toFixed(2) + "rem");
      s.style.setProperty("--d", (burst ? Math.random() * 1.2 : Math.random() * 8).toFixed(2) + "s");
      s.style.setProperty("--t", (burst ? 3 + Math.random() * 2 : 9 + Math.random() * 6).toFixed(1) + "s");
      if (burst) {
        s.className = "pop";
        s.addEventListener("animationend", function (e) { e.target.remove(); });
      }
      hearts.appendChild(s);
    }
  }
  floaters(8, false);

  function open() {
    gate.classList.add("done");
    if (window.LoveSound) window.LoveSound.ready();
    others.forEach(function (el) { el.removeAttribute("inert"); });
    root.style.overflow = "";
    window.scrollTo(0, 0);
    setTimeout(function () { gate.hidden = true; }, 1000);
  }

  function finish() {
    num.textContent = "0";
    bar.style.width = "100%";
    gate.classList.add("flipped");
    label.textContent = "Happy 4th Anniversary";
    line.textContent = "Our day is here, my love.";
    floaters(30, true);
    setTimeout(open, 3600);
  }

  function start() {
    stageLock.hidden = true;
    stageCount.hidden = false;
    var t0 = Date.now();
    var last = SECONDS + 1;
    var timer = setInterval(tick, 100);
    function tick() {
      var left = SECONDS * 1000 - (Date.now() - t0);
      if (left <= 0) { clearInterval(timer); finish(); return; }
      var sec = Math.ceil(left / 1000);
      if (sec !== last) {
        last = sec;
        num.textContent = sec;
        num.classList.remove("tick");
        void num.offsetWidth;
        num.classList.add("tick");
      }
      bar.style.width = (100 - left / (SECONDS * 10)) + "%";
    }
    tick();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (input.value.replace(/\s/g, "") === CODE) {
      msg.textContent = "";
      if (window.LoveSound) window.LoveSound.start();
      start();
    } else {
      msg.textContent = "That code is not right. Try again.";
      input.value = "";
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      input.focus();
    }
  });

  input.focus();
})();

/* Video pages: each page has a card. Tap the card, the doors swing open and the video plays (with sound, since she tapped).
   If the phone blocks sound, it plays muted and the video controls let her turn it on.
   The arrows (or a swipe) turn to the other page and pause the video that was playing. */
(function () {
  var films = document.querySelectorAll(".film");
  if (!films.length) return;
  Array.prototype.forEach.call(films, function (film) {
    var card = film.querySelector(".film-card");
    var video = film.querySelector("video");
    if (!card || !video) return;
    card.addEventListener("click", function () {
      film.classList.add("open");
      video.setAttribute("controls", "");
      video.muted = false;
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {
          video.muted = true;
          var q = video.play();
          if (q && q.catch) q.catch(function () {});
        });
      }
      setTimeout(function () { card.hidden = true; }, 1500);
    });
  });

  var pages = document.querySelectorAll(".film-page");
  var pager = document.getElementById("film-pager");
  var dots = document.querySelectorAll(".fn-dots i");
  var count = document.getElementById("film-count");
  var cur = 0;
  function show(n, back) {
    if (n < 0) n = pages.length - 1;
    if (n >= pages.length) n = 0;
    var v = pages[cur].querySelector("video");
    if (v) v.pause();
    Array.prototype.forEach.call(pages, function (pg, i) {
      pg.classList.toggle("on", i === n);
      pg.classList.toggle("back", !!back);
    });
    Array.prototype.forEach.call(dots, function (d, i) { d.classList.toggle("on", i === n); });
    if (count) count.textContent = "Page " + (n + 1) + " of " + pages.length;
    cur = n;
  }
  var prev = document.getElementById("film-prev"), next = document.getElementById("film-next");
  if (prev) prev.addEventListener("click", function () { show(cur - 1, true); });
  if (next) next.addEventListener("click", function () { show(cur + 1, false); });
  if (pager) {
    var sx = null, sy = 0;
    pager.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    pager.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(dx < 0 ? cur + 1 : cur - 1, dx > 0);
    }, { passive: true });
  }
})();

/* "No reason" section: the lines appear one by one the first time it scrolls into view, then
   kisses float up. Tap the heart for a burst of kisses. */
(function () {
  var sec = document.getElementById("noreason");
  var heart = document.getElementById("nr-heart");
  var field = document.getElementById("kiss-field");
  if (!sec || !heart || !field) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var faces = ["\uD83D\uDC8B", "\uD83D\uDC8B", "\uD83D\uDE18", "\uD83D\uDC8B", "\uD83D\uDC8B", "\u2665"];

  for (var i = 0; i < 18; i++) {
    var k = document.createElement("span");
    k.textContent = faces[i % faces.length];
    k.style.setProperty("--x", (3 + Math.random() * 90).toFixed(1) + "%");
    k.style.setProperty("--s", (1.1 + Math.random() * 1.4).toFixed(2) + "rem");
    k.style.setProperty("--d", (Math.random() * 6).toFixed(2) + "s");
    k.style.setProperty("--t", (7 + Math.random() * 5).toFixed(1) + "s");
    k.style.setProperty("--r", Math.round(Math.random() * 50 - 25) + "deg");
    field.appendChild(k);
  }

  function burst() {
    for (var j = 0; j < 16; j++) {
      var b = document.createElement("span");
      var a = (Math.PI * 2 * j) / 16 + Math.random() * 0.4;
      var d = 80 + Math.random() * 110;
      b.className = "burst-heart";
      b.textContent = faces[j % faces.length];
      b.setAttribute("aria-hidden", "true");
      b.style.setProperty("--dx", Math.round(Math.cos(a) * d) + "px");
      b.style.setProperty("--dy", Math.round(Math.sin(a) * d) + "px");
      b.style.setProperty("--r", Math.round(Math.random() * 60 - 30) + "deg");
      b.style.setProperty("--s", (1.3 + Math.random() * 1.0).toFixed(2) + "rem");
      b.addEventListener("animationend", function (e) { e.target.remove(); });
      heart.appendChild(b);
    }
  }
  heart.addEventListener("click", burst);

  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        sec.classList.add("play");
        io.disconnect();
        setTimeout(burst, 5600);
      }
    });
  }, { threshold: 0.4 });
  io.observe(sec);
})();

/* Finale: tap the kiss seal, kisses burst, the video appears and plays.
   When the video ends, a shower of kisses falls and the message shows. */
(function () {
  var card = document.getElementById("finale-card");
  var seal = document.getElementById("kiss-seal");
  var film = document.getElementById("kiss-film");
  var video = document.getElementById("kiss-video");
  var fx = document.getElementById("finale-fx");
  var end = document.getElementById("finale-end");
  var again = document.getElementById("kiss-again");
  if (!card || !seal || !film || !video || !fx || !end || !again) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var faces = ["💋", "💋", "😘", "💋", "💋", "♥"];
  var disc = seal.querySelector(".seal-disc");

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function floaters(n) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      var k = document.createElement("span");
      k.textContent = faces[i % faces.length];
      k.style.setProperty("--x", rnd(3, 93).toFixed(1) + "%");
      k.style.setProperty("--s", rnd(1.1, 2.4).toFixed(2) + "rem");
      k.style.setProperty("--d", rnd(0, 6).toFixed(2) + "s");
      k.style.setProperty("--t", rnd(7, 12).toFixed(1) + "s");
      k.style.setProperty("--r", Math.round(rnd(-25, 25)) + "deg");
      fx.appendChild(k);
    }
  }

  function shower(n) {
    if (reduce) return;
    var h = card.offsetHeight + 60;
    for (var i = 0; i < n; i++) {
      var k = document.createElement("span");
      k.className = "fall";
      k.textContent = faces[i % faces.length];
      k.style.setProperty("--x", rnd(2, 94).toFixed(1) + "%");
      k.style.setProperty("--s", rnd(1.3, 2.6).toFixed(2) + "rem");
      k.style.setProperty("--d", rnd(0, 2.2).toFixed(2) + "s");
      k.style.setProperty("--t", rnd(2.6, 4.4).toFixed(1) + "s");
      k.style.setProperty("--r", Math.round(rnd(-40, 40)) + "deg");
      k.style.setProperty("--h", h + "px");
      k.addEventListener("animationend", function (e) { e.target.remove(); });
      fx.appendChild(k);
    }
  }

  function burst() {
    if (reduce) return;
    for (var j = 0; j < 18; j++) {
      var b = document.createElement("span");
      var a = (Math.PI * 2 * j) / 18 + Math.random() * 0.4;
      var d = rnd(90, 190);
      b.className = "burst-heart";
      b.textContent = faces[j % faces.length];
      b.setAttribute("aria-hidden", "true");
      b.style.setProperty("--dx", Math.round(Math.cos(a) * d) + "px");
      b.style.setProperty("--dy", Math.round(Math.sin(a) * d) + "px");
      b.style.setProperty("--r", Math.round(rnd(-30, 30)) + "deg");
      b.style.setProperty("--s", rnd(1.3, 2.3).toFixed(2) + "rem");
      b.addEventListener("animationend", function (e) { e.target.remove(); });
      disc.appendChild(b);
    }
  }

  function play() {
    video.currentTime = 0;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function reveal() {
    seal.hidden = true;
    film.hidden = false;
    floaters(16);
    play();
    film.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  seal.addEventListener("click", function () {
    if (card.classList.contains("go")) return;
    card.classList.add("go");
    burst();
    setTimeout(reveal, reduce ? 0 : 1150);
  });

  film.addEventListener("click", function () {
    if (video.ended) return;
    if (video.paused) video.play(); else video.pause();
  });

  video.addEventListener("ended", function () {
    end.hidden = false;
    shower(48);
  });

  again.addEventListener("click", function () {
    end.hidden = true;
    play();
  });
})();

/* Tap (or press Enter on) the hero photo to release a burst of hearts. */
(function () {
  var portrait = document.querySelector(".portrait");
  if (!portrait) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var glyphs = ["♥", "♥", "♥", "✦"];

  function burst() {
    if (reduce) return;
    for (var i = 0; i < 12; i++) {
      var h = document.createElement("span");
      var angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      var dist = 90 + Math.random() * 90;
      h.className = "burst-heart";
      h.textContent = glyphs[i % glyphs.length];
      h.setAttribute("aria-hidden", "true");
      h.style.setProperty("--dx", Math.round(Math.cos(angle) * dist) + "px");
      h.style.setProperty("--dy", Math.round(Math.sin(angle) * dist) + "px");
      h.style.setProperty("--r", Math.round(Math.random() * 60 - 30) + "deg");
      h.style.setProperty("--s", (0.9 + Math.random() * 1.1).toFixed(2) + "rem");
      h.addEventListener("animationend", function (e) { e.target.remove(); });
      portrait.appendChild(h);
    }
  }

  portrait.addEventListener("click", burst);
  portrait.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); burst(); }
  });
})();

/* Hug scene: starts when it scrolls into view. The words are split into letters so they pop in one by one. */
(function () {
  var sec = document.getElementById("hug");
  if (!sec) return;
  function fill(el, text, start) {
    var n = start;
    text.split("").forEach(function (c) {
      var s = document.createElement("span");
      if (c === " ") { s.className = "sp"; }
      else { s.className = "ch"; s.textContent = c; s.style.setProperty("--n", n); n++; }
      el.appendChild(s);
    });
    return n;
  }
  var n = fill(sec.querySelector(".hug-l1"), "I love you darling", 0);
  fill(sec.querySelector(".hug-l2"), "Meri jaan \u2665", n);
  if (!("IntersectionObserver" in window)) { sec.classList.add("play"); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { sec.classList.add("play"); io.disconnect(); } });
  }, { threshold: 0.35 });
  io.observe(sec);
})();

/* Hug photo: drag or touch it and it tilts toward your finger, then settles back when you let go. */
(function () {
  var el = document.getElementById("hug-photo");
  if (!el) return;
  function aim(e) {
    var r = el.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    x = Math.max(-0.7, Math.min(0.7, x)); y = Math.max(-0.7, Math.min(0.7, y));
    el.style.setProperty("--ry", (x * 26).toFixed(1) + "deg");
    el.style.setProperty("--rx", (-y * 26).toFixed(1) + "deg");
    el.style.setProperty("--ty", (y * 10).toFixed(1) + "px");
  }
  function rest() {
    el.classList.remove("drag");
    el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ty", "0px");
  }
  el.addEventListener("pointerdown", function (e) { el.classList.add("drag"); try { el.setPointerCapture(e.pointerId); } catch (x) {} aim(e); });
  el.addEventListener("pointermove", function (e) { if (el.classList.contains("drag")) aim(e); });
  el.addEventListener("pointerup", rest);
  el.addEventListener("pointercancel", rest);
})();

/* Sound: a background song.
   The song starts when the right code is entered (a tap is needed before browsers allow sound).
   While ANY video plays, the song and the chimes stop so only the video's own sound is heard. */
(function () {
  var bgm = document.getElementById("bgm");
  var btn = document.getElementById("music-btn");
  var VOL = 0.55;
  var wanted = false;      // the song has been started by her
  var userOff = false;     // she turned it off with the button
  var playing = 0;         // how many videos are playing right now
  var fade = null;

  function fadeTo(v, done) {
    if (!bgm) return;
    clearInterval(fade);
    fade = setInterval(function () {
      var d = v - bgm.volume;
      if (Math.abs(d) < 0.05) { bgm.volume = v; clearInterval(fade); if (done) done(); return; }
      bgm.volume = Math.max(0, Math.min(1, bgm.volume + (d > 0 ? 0.05 : -0.05)));
    }, 40);
  }
  function shouldPlay() { return wanted && !userOff && playing === 0 && !document.hidden; }
  function sync() {
    if (!bgm) return;
    if (shouldPlay()) {
      if (bgm.paused) { bgm.volume = 0; var p = bgm.play(); if (p && p.catch) p.catch(function () {}); }
      fadeTo(VOL);
    } else if (!bgm.paused) {
      fadeTo(0, function () { if (!shouldPlay()) bgm.pause(); });
    }
  }

  // Every video: when it plays, the song stops; when it pauses or ends, the song comes back.
  Array.prototype.forEach.call(document.querySelectorAll("video"), function (v) {
    var on = false;
    function set(x) { if (on === x) return; on = x; playing += x ? 1 : -1; sync(); }
    v.addEventListener("play", function () { set(true); });
    v.addEventListener("playing", function () { set(true); });
    v.addEventListener("pause", function () { set(false); });
    v.addEventListener("ended", function () { set(false); });
  });
  document.addEventListener("visibilitychange", sync);

  function paint() {
    if (!btn) return;
    btn.classList.toggle("on", !userOff);
    btn.classList.toggle("off", userOff);
    btn.setAttribute("aria-pressed", userOff ? "false" : "true");
    btn.setAttribute("aria-label", userOff ? "Turn the song on" : "Turn the song off");
  }
  if (btn) btn.addEventListener("click", function () { userOff = !userOff; paint(); sync(); });

  window.LoveSound = {
    start: function () { wanted = true; sync(); paint(); },
    ready: function () { if (btn) { btn.hidden = false; paint(); } }
  };
})();
