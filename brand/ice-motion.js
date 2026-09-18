/* ==========================================================================
   IceMotion v0.2, 2026-09-13
   The behaviours behind ice.css: the 2D penguin, the snowball cursor while a
   transaction is pending, the penguin-on-a-slab loader, the fill (shatter),
   the failure (freeze), toasts that land, the confirm sheet, the payout
   clock, the tape, sparklines, cubes. Plain script, no build step.

     IceMotion.penguinSVG({ size, shades, idle })   inline 2D mascot markup
     IceMotion.slideLoader({ size, slab })          the loader markup
     IceMotion.cube(color, { size, initials })      cube icon markup
     IceMotion.sparkline(values, { w, h, tone })    sparkline svg markup
     IceMotion.cursor.start() .melt() .crack()      the snowball
     IceMotion.toasts.show({ title, text, cube, penguin, tone, duration })
     IceMotion.shatter(el)                          shards fly from an element
     IceMotion.runTrade(button, opts)               the whole lifecycle
     IceMotion.sheet(instrumentEl)                  { show(data), close() }
     IceMotion.clock(el, { onLand })                counts to the next :15
     IceMotion.tape(el, items)                      builds the marquee
     IceMotion.graduate(curveEl)                    curve fills, then shatters
   ========================================================================== */
(function (root) {
  'use strict';
  const doc = root.document;
  const reduced = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const finePointer = () => !!(root.matchMedia && root.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let uid = 0;

  const C = { navy: '#12203A', belly: '#F7FAFD', beak: '#F7A21E', beakLow: '#E08D14', gold: '#E9BA4E', lens: '#0B1A2E', pupil: '#0E1728', jacket: '#3B7DD8' };

  // ---------- the 2D penguin ----------
  function eye(id, cx) {
    return `<g class="pg-eye"><g clip-path="url(#${id})">` +
      `<circle cx="${cx}" cy="38" r="5.4" fill="#FFFFFF"/>` +
      `<circle class="pg-pupil" cx="${cx + 0.5}" cy="38.5" r="3.6" fill="${C.pupil}"/>` +
      `<circle cx="${cx - 1.2}" cy="37" r="1.1" fill="#FFFFFF"/>` +
      `<g class="pg-lid"><rect x="${cx - 7}" y="26" width="14" height="16" fill="${C.belly}"/><path d="M${cx - 5} 41 Q${cx} 43.6 ${cx + 5} 41" stroke="${C.navy}" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>` +
      `</g></g>`;
  }
  function penguinSVG(o) {
    o = Object.assign({ size: 84, shades: true, idle: false, cls: '' }, o || {});
    const id = 'pg' + (++uid);
    return `<svg class="ice-penguin${o.idle ? ' is-idle' : ''}${o.cls ? ' ' + o.cls : ''}" viewBox="0 0 100 110" width="${o.size}" height="${Math.round(o.size * 1.1)}" aria-hidden="true">` +
      `<defs><clipPath id="${id}l"><circle cx="39" cy="38" r="5.4"/></clipPath><clipPath id="${id}r"><circle cx="61" cy="38" r="5.4"/></clipPath></defs>` +
      `<ellipse cx="40" cy="105" rx="10" ry="3.6" fill="${C.beak}"/><ellipse cx="60" cy="105" rx="10" ry="3.6" fill="${C.beak}"/>` +
      `<g class="pg-flip pg-flip--l"><ellipse cx="18" cy="70" rx="7.5" ry="19" fill="${C.navy}" transform="rotate(18 18 70)"/></g>` +
      `<g class="pg-flip pg-flip--r"><ellipse cx="82" cy="70" rx="7.5" ry="19" fill="${C.navy}" transform="rotate(-18 82 70)"/></g>` +
      `<ellipse cx="50" cy="68" rx="34" ry="38" fill="${C.navy}"/><circle cx="50" cy="36" r="30" fill="${C.navy}"/>` +
      `<path d="M50 8 C52 2 58 0 63 3 C57 3 54 6 53 11 Z" fill="${C.navy}"/>` +
      `<ellipse cx="50" cy="76" rx="23" ry="27" fill="${C.belly}"/><ellipse cx="50" cy="42" rx="21" ry="17" fill="${C.belly}"/>` +
      eye(id + 'l', 39) + eye(id + 'r', 61) +
      `<polygon points="44,47 50,44 56,47 50,52" fill="${C.beak}"/><polygon points="46,49.5 54,49.5 50,54.5" fill="${C.beakLow}"/>` +
      (o.shades ? `<g class="pg-shades"><path d="M22 33.5 H78" stroke="${C.gold}" stroke-width="1.6" stroke-linecap="round"/>` +
        `<rect x="27" y="30" width="20" height="14" rx="6" fill="${C.lens}" fill-opacity="0.9" stroke="${C.gold}" stroke-width="1.6"/>` +
        `<rect x="53" y="30" width="20" height="14" rx="6" fill="${C.lens}" fill-opacity="0.9" stroke="${C.gold}" stroke-width="1.6"/>` +
        `<path d="M47 35 Q50 33.2 53 35" stroke="${C.gold}" stroke-width="1.4" fill="none"/>` +
        `<path d="M31 33.5 L36 33.5 M57 33.5 L62 33.5" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.2" stroke-linecap="round"/></g>` : '') +
      `</svg>`;
  }
  function slidingPenguinSVG() {
    return `<svg class="ice-slide__pg" viewBox="0 0 120 60" aria-hidden="true">` +
      `<ellipse cx="12" cy="38" rx="8" ry="3.4" fill="${C.beak}"/>` +
      `<ellipse cx="44" cy="18" rx="16" ry="5" fill="${C.navy}" transform="rotate(-18 44 18)"/>` +
      `<ellipse cx="56" cy="36" rx="38" ry="17" fill="${C.navy}"/>` +
      `<ellipse cx="50" cy="33" rx="29" ry="12.5" fill="${C.jacket}"/><path d="M28 31 Q50 23 72 29 M30 35 Q50 27.5 71 33" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="1.5" fill="none"/>` +
      `<ellipse cx="58" cy="43" rx="30" ry="9" fill="${C.belly}"/><path d="M73 36 q5 5 10 1.5" stroke="${C.gold}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
      `<circle cx="94" cy="28" r="17" fill="${C.navy}"/><ellipse cx="98" cy="33" rx="11" ry="9" fill="${C.belly}"/>` +
      `<path d="M84 13 C82 6 76 4 72 8 C77 8 80 10 81 15 Z" fill="${C.navy}"/>` +
      `<circle cx="100" cy="27" r="3.2" fill="#FFFFFF"/><circle cx="100.6" cy="27.2" r="2.1" fill="${C.pupil}"/>` +
      `<polygon points="108,30 116,33 108,36 105,33" fill="${C.beak}"/>` +
      `<rect x="93" y="22" width="12" height="9" rx="4" fill="${C.lens}" fill-opacity="0.92" stroke="${C.gold}" stroke-width="1.4"/><path d="M80 24 H93" stroke="${C.gold}" stroke-width="1.4"/>` +
      `</svg>`;
  }
  function slideLoader(o) {
    o = Object.assign({ size: 'md', slab: true, label: 'Sending' }, o || {});
    const id = 'slab' + (++uid);
    const slab = o.slab ? `<svg class="ice-slide__slab" viewBox="0 0 340 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#E4F3FC"/><stop offset="1" stop-color="#BFE0F2"/></linearGradient></defs><rect width="340" height="100" fill="url(#${id})"/><rect width="340" height="2" fill="#FFFFFF" fill-opacity="0.9"/><rect y="86" width="340" height="14" fill="#9FD6ED" fill-opacity="0.4"/><path d="M40 70 L120 20 M220 80 L300 30" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2"/></svg>` : '';
    return `<span class="ice-slide${o.size === 'lg' ? ' ice-slide--lg' : ''}" role="status">${slab}<span class="ice-slide__rider">${slidingPenguinSVG()}<i class="ice-slide__puff"></i><i class="ice-slide__puff"></i><i class="ice-slide__puff"></i></span><span class="ice-sr">${o.label}</span></span>`;
  }

  // ---------- cubes and sparklines ----------
  // The icon system: a rendered sprite per registry symbol (brand/assets/cubes/<SYMBOL>.webp),
  // falling back to the CSS cube in a symbol's colour until the sprite exists.
  const CUBES = { base: 'assets/cubes/', have: new Set(), colors: {
    GLD: '#F2C14E', SLV: '#C9CFD6', XPT: '#D7DCE2', XPD: '#9AA3AD', HG: '#C57A3A', ALI: '#B8C2CC', CL: '#2B2B2B', BZ: '#274B7A', OIL: '#1B1B1B', USO: '#3A3A3A', NG: '#3FA0F5', RB: '#5C6670', HO: '#C8301F',
    LBR: '#9C6A3C', ZW: '#E0B24B', ZC: '#F2C42B', ZS: '#8FBF4F', ZM: '#C9A464', ZL: '#E6B93A', ZR: '#D9C9A8', ZO: '#CDB27A', SB: '#F2F4F7', KC: '#5A3A22', CC: '#4A2A1A', CT: '#F4F1EA', OJ: '#F28C28', DC: '#F7F7F7',
    LE: '#8A5A3C', GF: '#3A3A3A', HE: '#F2A6B8', BURGER: '#F7A21E', NUGGETS: '#E39A3B', BIGBURGER: '#E4892C', CHIXSAND: '#E9A44A', TACO: '#F2C14E', BURRITO: '#D9C4A3', LATTE: '#C9A57A', PIZZA: '#F0A83A', DBLBURGER: '#D98A2C', BACONBRGR: '#C4602C', SPICYCHIX: '#D9532C', MEDCOFFEE: '#8A5A3C', FRIES: '#F2C14E',
    AKREDLINE: '#C8301F', AWPASIIMOV: '#F07C2C', DLORE: '#E0722B', HOWL: '#B22222', KARAMBIT: '#7A3FB5', BFLYFADE: '#E86AA6', DEAGLBLAZE: '#F0782C', GLOCKFADE: '#E056A3', PRNTSTREAM: '#B0B8C4', VICEGLOVES: '#F08CB8', BRAVOCASE: '#3A3A3A', VULCAN: '#2F6FD6', RSGP: '#E9BA4E',
    H2O: '#7CD4F5', LAMBO: '#F07C2C', SUBMARINER: '#2B2B2B', DAYTONA: '#E9BA4E', GMTMASTER: '#2F5FA8', DATEJUST: '#C9CFD6', ROYALOAK: '#9AA3AD', NAUTILUS: '#2F5FA8', SPEEDMSTR: '#2B2B2B', SANTOS: '#C9CFD6', GSHOCK: '#1B1B1B', TISSOTPRX: '#2F5FA8',
    PMX: '#E9BA4E', WATCHX: '#C9CFD6', CS2X: '#C8301F', ICE: '#7CD4F5', USDC: '#2775CA',
  } };
  function cubesConfig(o) { o = o || {}; if (o.base != null) CUBES.base = o.base; if (o.have) CUBES.have = new Set(o.have); }
  // static markup written as <span class="ice-cube" data-sym="GLD"> becomes the sprite once one exists
  function hydrateCubes(scope) {
    (scope || doc).querySelectorAll('.ice-cube[data-sym]:not(.ice-cube--img)').forEach((el) => {
      const sym = el.dataset.sym; if (!CUBES.have.has(sym)) return;
      const size = parseFloat(getComputedStyle(el).width) || 18;
      const img = doc.createElement('img'); img.className = 'ice-cube ice-cube--img' + (el.className.replace('ice-cube', '').trim() ? ' ' + el.className.replace('ice-cube', '').trim() : '');
      img.src = CUBES.base + sym + '.webp'; img.alt = ''; img.width = size; img.height = size; img.style.setProperty('--s', size + 'px'); img.loading = 'lazy'; img.decoding = 'async';
      el.replaceWith(img);
    });
  }
  function cube(symbolOrColor, o) {
    o = Object.assign({ size: 18, initials: null, color: null }, o || {});
    if (o.initials) return `<span class="ice-cube ice-cube--empty" style="--s:${o.size}px"><i>${o.initials}</i></span>`;
    const sym = /^[A-Z0-9]{2,12}$/.test(symbolOrColor || '') ? symbolOrColor : null;
    if (sym && CUBES.have.has(sym)) return `<img class="ice-cube ice-cube--img" src="${CUBES.base}${sym}.webp" alt="" width="${o.size}" height="${o.size}" style="--s:${o.size}px" loading="lazy" decoding="async">`;
    const color = o.color || (sym ? (CUBES.colors[sym] || '#7CD4F5') : (symbolOrColor || '#7CD4F5'));
    return `<span class="ice-cube" style="--c:${color};--s:${o.size}px"></span>`;
  }
  function sparkline(values, o) {
    o = Object.assign({ w: 72, h: 22, tone: null }, o || {});
    const n = values.length; if (n < 2) return '';
    const min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    const pad = 2, sx = (o.w - pad * 2) / (n - 1), sy = (o.h - pad * 2) / ((max - min) || 1);
    const pts = values.map((v, i) => [pad + i * sx, o.h - pad - (v - min) * sy]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ' L' + pts[n - 1][0].toFixed(1) + ' ' + o.h + ' L' + pts[0][0].toFixed(1) + ' ' + o.h + ' Z';
    const tone = o.tone || (values[n - 1] >= values[0] ? 'pos' : 'neg');
    return `<svg class="ice-spark ice-spark--${tone}" viewBox="0 0 ${o.w} ${o.h}" width="${o.w}" height="${o.h}" aria-hidden="true"><path class="a" d="${area}"/><path class="l" d="${d}"/><circle cx="${pts[n - 1][0].toFixed(1)}" cy="${pts[n - 1][1].toFixed(1)}" r="2"/></svg>`;
  }

  // ---------- label swap: opacity, blur, a little scale ----------
  function setLabel(btn, html) {
    const span = doc.createElement('span'); span.className = 'ice-btn__label'; span.innerHTML = html;
    const old = btn.querySelector('.ice-btn__label');
    if (old) old.replaceWith(span); else { btn.innerHTML = ''; btn.appendChild(span); }
    if (!reduced()) { void span.offsetWidth; span.classList.add('is-in'); }
  }

  // ---------- shards: fly out from an element's rect, in a fixed layer so nothing clips them ----------
  let shardLayer = null;
  function shatter(el, o) {
    if (reduced()) return;
    o = Object.assign({ count: 9 }, o || {});
    if (!shardLayer) { shardLayer = doc.createElement('div'); shardLayer.className = 'ice-shards'; doc.body.appendChild(shardLayer); }
    const r = el.getBoundingClientRect();
    const clips = ['polygon(0 0, 100% 0, 60% 100%)', 'polygon(0 0, 100% 30%, 40% 100%)', 'polygon(20% 0, 100% 0, 80% 100%, 0 70%)', 'polygon(0 20%, 100% 0, 100% 80%, 30% 100%)', 'polygon(0 0, 100% 50%, 0 100%)'];
    for (let i = 0; i < o.count; i++) {
      const s = doc.createElement('span'); s.className = 'ice-shard';
      const w = 6 + Math.random() * 12, h = 6 + Math.random() * 12;
      const x = r.left + Math.random() * r.width, y = r.top + Math.random() * r.height;
      const ang = (Math.random() - 0.5) * Math.PI * 1.2 - Math.PI / 2;          // mostly up and out
      const dist = 26 + Math.random() * 46;
      s.style.cssText = `--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--w:${w.toFixed(0)}px;--h:${h.toFixed(0)}px;--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist + 18).toFixed(0)}px;--rot:${((Math.random() - 0.5) * 180).toFixed(0)}deg;--clip:${clips[i % clips.length]}`;
      shardLayer.appendChild(s);
      setTimeout(() => s.remove(), 420);
    }
  }

  // ---------- the snowball cursor ----------
  const cursor = (function () {
    let el = null, active = false, x = 0, y = 0, rot = 0, travel = 0, raf = 0, dirty = false, alive = 0, ending = false;
    // measured from the rendered ball in start(), so --ice-cursor-size stays the one dial
    let degPerPx = 360 / (Math.PI * 34), trailGap = 39;
    root.addEventListener('pointermove', (e) => {
      const dx = e.clientX - x, dy = e.clientY - y;
      x = e.clientX; y = e.clientY;
      if (!active || ending) return;
      const d = Math.hypot(dx, dy);
      rot += d * degPerPx;       // one full turn per circumference of travel, so it rolls, not spins
      travel += d;
      if (travel > trailGap && alive < 12) { travel = 0; trail(x - dx * 0.4, y - dy * 0.4); }
      if (!dirty) { dirty = true; raf = requestAnimationFrame(paint); }
    }, { passive: true });
    function paint() { dirty = false; if (!el) return; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.setProperty('--r', rot.toFixed(0) + 'deg'); }
    function trail(tx, ty) {
      const t = doc.createElement('i'); t.className = 'ice-cursor__trail'; t.style.left = tx + 'px'; t.style.top = ty + 'px';
      doc.body.appendChild(t); alive++; setTimeout(() => { t.remove(); alive--; }, 560);
    }
    function start() {
      if (active || !finePointer() || reduced()) return false;
      el = doc.createElement('div'); el.className = 'ice-cursor'; el.setAttribute('aria-hidden', 'true');
      el.style.left = x + 'px'; el.style.top = y + 'px';
      doc.body.appendChild(el); doc.body.classList.add('ice-cursor-on'); active = true; ending = false;
      const dia = el.offsetWidth || 34;
      degPerPx = 360 / (Math.PI * dia);   // a rolling ball turns once per circumference
      trailGap = dia * 1.15;              // prints spaced with the ball, not a fixed 26px
      return true;
    }
    function end() { if (el) el.remove(); el = null; active = false; ending = false; doc.body.classList.remove('ice-cursor-on'); cancelAnimationFrame(raf); dirty = false; }
    function finish(cls, ms) { if (!active || ending) return; ending = true; el.classList.add(cls); doc.body.classList.remove('ice-cursor-on'); setTimeout(end, ms); }
    return { start, melt() { finish('is-melting', 260); }, crack() { finish('is-cracking', 320); }, stop: end, get active() { return active; } };
  })();

  // ---------- toasts ----------
  const toasts = (function () {
    let box = null;
    function container() { if (!box) { box = doc.createElement('div'); box.className = 'ice-toasts'; box.setAttribute('aria-live', 'polite'); doc.body.appendChild(box); } return box; }
    function show(o) {
      o = Object.assign({ title: '', text: '', cube: null, initials: null, penguin: false, tone: 'ok', duration: 4200 }, o || {});
      const el = doc.createElement('div'); el.className = 'ice-toast' + (o.tone === 'fail' ? ' ice-toast--fail' : ''); el.setAttribute('role', 'status');
      el.innerHTML = (o.cube || o.initials ? `<span class="ice-toast__cube">${cube(o.cube || '#7CD4F5', { size: 26, initials: o.initials })}</span>` : '') +
        `<div class="ice-toast__body"><div class="ice-toast__title">${o.title}</div>${o.text ? `<div class="ice-toast__text">${o.text}</div>` : ''}</div>` +
        (o.penguin ? penguinSVG({ size: 34, cls: 'ice-toast__pg' }) : '');
      container().appendChild(el);
      if (o.penguin && !reduced()) { const pg = el.querySelector('.ice-penguin'); setTimeout(() => pg.classList.add('is-flap'), 140); }
      let gone = false;
      const dismiss = () => { if (gone) return; gone = true; el.classList.add('is-out'); setTimeout(() => el.remove(), 190); };
      el.addEventListener('click', dismiss);
      let timer = setTimeout(dismiss, o.duration);
      el.addEventListener('mouseenter', () => clearTimeout(timer));
      el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1600); });
      return { el, dismiss };
    }
    return { show };
  })();

  // ---------- the trade lifecycle ----------
  // rest -> signing (wallet has it, light sweeps) -> sending (penguin on the slab)
  //      -> filled (shatter, green ice, toast lands) | frozen (frost, the reason) -> rest
  async function runTrade(btn, o) {
    o = Object.assign({
      fail: false, signMs: 900, sendMs: 1700, restMs: 1900, useCursor: true,
      signing: 'Signing', filled: 'Filled', failed: 'Rejected in wallet. Nothing was sent.',
      toast: {}, failToast: {}, onFilled: null, onFailed: null,
    }, o || {});
    if (btn.classList.contains('is-busy')) return false;
    const html = btn.innerHTML, cls = btn.className;
    btn.classList.add('is-busy', 'is-signing'); btn.setAttribute('aria-busy', 'true');
    setLabel(btn, o.signing);
    if (o.useCursor) cursor.start();
    await wait(o.signMs);
    btn.classList.remove('is-signing'); btn.classList.add('is-sending');
    btn.innerHTML = slideLoader({ slab: false });
    await wait(o.sendMs);
    btn.classList.remove('is-sending');
    if (o.fail) {
      btn.classList.add('is-frozen'); setLabel(btn, o.failed); cursor.crack();
      if (o.failToast !== false) toasts.show(Object.assign({ tone: 'fail', title: 'Nothing was sent', text: o.failed, duration: 5200 }, o.failToast));
      if (o.onFailed) o.onFailed();
    } else {
      btn.classList.add('is-filled'); setLabel(btn, o.filled); shatter(btn); cursor.melt();
      if (o.toast !== false) toasts.show(Object.assign({ title: 'Filled.', text: '', cube: '#F2C14E', penguin: true }, o.toast));
      if (o.onFilled) o.onFilled();
    }
    await wait(o.restMs);
    btn.className = cls; btn.innerHTML = html; btn.removeAttribute('aria-busy');
    return !o.fail;
  }

  // ---------- the confirm sheet, inside the instrument ----------
  function sheet(inst) {
    const el = doc.createElement('div'); el.className = 'ice-sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Confirm your trade');
    inst.appendChild(el);
    let open = false, opener = null, data = null;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    function close() {
      if (!open) return; open = false;
      el.classList.remove('is-open'); el.classList.add('is-closing');
      setTimeout(() => el.classList.remove('is-closing'), 200);
      doc.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus();
    }
    function show(d) {
      data = d; opener = doc.activeElement;
      el.innerHTML =
        `<div class="ice-sheet__head"><div class="ice-sheet__title">${d.title || 'Confirm your trade'}</div><button class="ice-sheet__close" type="button" aria-label="Close"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>` +
        `<div class="ice-sheet__big"><span class="ice-k">You pay</span><strong>${d.pay}</strong></div>` +
        `<div class="ice-sheet__big"><span class="ice-k">You get</span><strong>${d.get}</strong></div>` +
        `<dl class="ice-sheet__rows">${(d.rows || []).map((r) => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>` +
        (d.note ? `<p class="ice-sheet__note">${d.note}</p>` : '') +
        `<div class="ice-sheet__cta"><button class="ice-btn ice-btn--primary ice-btn--lg ice-btn--block ice-cta" type="button"><span class="ice-btn__label">${d.cta || 'Confirm in wallet'}</span></button></div>`;
      el.classList.add('is-open'); open = true;
      el.querySelector('.ice-sheet__close').addEventListener('click', close);
      const cta = el.querySelector('.ice-cta');
      cta.addEventListener('click', () => runTrade(cta, Object.assign({}, d.trade || {}, {
        onFilled: () => { setTimeout(close, 420); if (d.onFilled) d.onFilled(); },
        onFailed: () => { if (d.onFailed) d.onFailed(); },
      })));
      doc.addEventListener('keydown', onKey);
      setTimeout(() => cta.focus({ preventScroll: true }), 60);
    }
    return { el, show, close, get open() { return open; } };
  }

  // ---------- the payout clock ----------
  function mmss(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function clock(el, o) {
    o = o || {};
    const b = el.querySelector('b') || el;
    let last = null;
    function land() { el.classList.remove('is-landing'); void el.offsetWidth; el.classList.add('is-landing'); if (o.onLand) o.onLand(); }
    function tick() { const s = 900 - (Math.floor(Date.now() / 1000) % 900); b.textContent = mmss(s); if (last !== null && s > last) land(); last = s; }
    tick(); const id = setInterval(tick, 1000);
    return { land, stop() { clearInterval(id); }, secondsLeft() { return 900 - (Math.floor(Date.now() / 1000) % 900); } };
  }

  // ---------- the tape ----------
  function tape(el, items) {
    const twice = items.concat(items);
    el.innerHTML = `<div class="ice-tape__track">${twice.map((i) => `<span class="ice-tape__item">${i}</span>`).join('')}</div>`;
  }

  // ---------- graduation ----------
  function graduate(curveEl) {
    if (curveEl.classList.contains('is-grad')) return;
    curveEl.style.setProperty('--p', '1');
    const pct = curveEl.querySelector('.ice-curve__pct'); if (pct) pct.textContent = '100%';
    setTimeout(() => { const bar = curveEl.querySelector('.ice-curve__bar'); if (bar) shatter(bar, { count: 7 }); curveEl.classList.add('is-grad'); }, reduced() ? 0 : 380);
  }
  function resetCurve(curveEl, p) { curveEl.classList.remove('is-grad'); curveEl.style.setProperty('--p', String(p)); const pct = curveEl.querySelector('.ice-curve__pct'); if (pct) pct.textContent = Math.round(p * 100) + '%'; }

  root.IceMotion = { penguinSVG, slidingPenguinSVG, slideLoader, cube, cubesConfig, hydrateCubes, cubes: CUBES, sparkline, setLabel, shatter, cursor, toasts, runTrade, sheet, clock, tape, graduate, resetCurve, mmss, reduced, wait };
})(window);
