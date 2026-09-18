/* ==========================================================================
   IcePenguin2D v0.1, 2026-09-13
   The landing-page mascot built from the rendered portrait as layers:
   base (shades off, eye whites), two irises that follow the cursor, lids
   that blink, and the aviators cut out as their own layer that slides down
   the beak when you come close. Everything is positioned in percentages of
   the source image, so it scales with the container.

     const p = IcePenguin2D.mount(container, rig, { base, irisL, irisR, shades, poster });
     p.setPointer(x, y)   p.setShades('auto'|'down'|'up')   p.hop()   p.blink()
     p.setReducedMotion(bool)   p.destroy()
   ========================================================================== */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));
  const reducedMQ = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function pct(v, of) { return (v / of * 100).toFixed(3) + '%'; }

  function mount(container, rig, a) {
    const W = rig.w, H = rig.h;
    container.classList.add('pg2');
    container.innerHTML = '';
    const body = el('div', 'pg2__body'); container.appendChild(body);
    const base = el('img', 'pg2__base'); base.src = a.base; base.alt = ''; base.draggable = false; body.appendChild(base);
    const eyes = {};
    for (const k of ['l', 'r']) {
      const e = rig.eyes[k], ir = rig.iris[k];
      const eye = el('div', 'pg2__eye');
      eye.style.left = pct(e.cx - e.rx, W); eye.style.top = pct(e.cy - e.ry, H); eye.style.width = pct(2 * e.rx, W); eye.style.height = pct(2 * e.ry, H);
      const iris = el('img', 'pg2__iris'); iris.src = k === 'l' ? a.irisL : a.irisR; iris.alt = ''; iris.draggable = false;
      iris.style.left = pct(ir.x - (e.cx - e.rx), 2 * e.rx); iris.style.top = pct(ir.y - (e.cy - e.ry), 2 * e.ry); iris.style.width = pct(ir.size, 2 * e.rx); iris.style.height = pct(ir.size, 2 * e.ry);
      const lid = el('div', 'pg2__lid');
      eye.appendChild(iris); eye.appendChild(lid); body.appendChild(eye);
      eyes[k] = { eye, iris, lid, maxX: e.rx - e.r - 4, maxY: e.ry - e.r - 4 };
    }
    const sh = el('img', 'pg2__shades'); sh.src = a.shades; sh.alt = ''; sh.draggable = false;
    sh.style.left = pct(rig.shades.x, W); sh.style.top = pct(rig.shades.y, H); sh.style.width = pct(rig.shades.w, W); sh.style.height = pct(rig.shades.h, H);
    body.appendChild(sh);
    // The glint. A highlight that travels across the glass as the pointer crosses it, masked
    // to the lens so it can never spill onto the gold. It rides the same transform as the
    // frames, so it stays put when they slide down the beak.
    const glint = el('div', 'pg2__glint');
    glint.style.left = sh.style.left; glint.style.top = sh.style.top;
    glint.style.width = sh.style.width; glint.style.height = sh.style.height;
    if (a.lensMask) { glint.style.webkitMaskImage = `url(${a.lensMask})`; glint.style.maskImage = `url(${a.lensMask})`; }
    body.appendChild(glint);

    const S = { pointer: null, pointerT: -10, t: 0, last: 0, gx: 0, gy: 0, lean: 0, tilt: 0, shadesMode: 'auto', shadesV: 0, blinkT: -1, nextBlink: 2.8, hopT: -1, reduced: false, idle: { x: 0, y: 0, next: 0 }, glint: 0, glx: 0.5, gly: 0.5, nx: 0, ny: 0 };
    let raf = 0, alive = true;

    function eyeCenter() {
      // the midpoint between the eyes, in page pixels
      const r = base.getBoundingClientRect();
      const l = rig.eyes.l, rr = rig.eyes.r;
      return { x: r.left + ((l.cx + rr.cx) / 2 / W) * r.width, y: r.top + ((l.cy + rr.cy) / 2 / H) * r.height, h: r.height };
    }

    function update(dt) {
      S.t += dt;
      let tx = 0, ty = 0, near = false;
      if (S.pointer) {
        const c = eyeCenter();
        tx = clamp((S.pointer.x - c.x) / (c.h * 0.35), -1, 1); ty = clamp((S.pointer.y - c.y) / (c.h * 0.35), -1, 1);
        near = Math.hypot(S.pointer.x - c.x, S.pointer.y - c.y) < c.h * 0.22;
      } else if (S.t - S.pointerT > 3) {
        if (S.t > S.idle.next) { S.idle.x = (Math.random() - 0.5) * 1.4; S.idle.y = (Math.random() - 0.5) * 0.6; S.idle.next = S.t + 1.6 + Math.random() * 2.4; }
        tx = S.idle.x; ty = S.idle.y;
      }
      S.gx = damp(S.gx, tx, 12, dt); S.gy = damp(S.gy, ty, 12, dt);
      S.lean = damp(S.lean, tx, 4, dt); S.tilt = damp(S.tilt, ty, 4, dt);
      for (const k in eyes) { const e = eyes[k]; e.iris.style.transform = `translate(${(S.gx * e.maxX / (2 * rig.eyes[k].rx) * 100).toFixed(2)}%, ${(S.gy * e.maxY / (2 * rig.eyes[k].ry) * 100).toFixed(2)}%)`; }
      // ---- light travelling across the glass as the pointer moves over the face ----
      // Deliberately NOT gated on the pointer being literally inside the lens: coming that
      // close also triggers the beak drop, which slides the glass out from under the pointer,
      // so the highlight would die the instant it appeared. Instead it lives whenever the
      // pointer is over the head, and its position on the glass is measured against the
      // frames' CURRENT rect, so it keeps tracking while they slide.
      const LB = rig.lensBox;
      let overLens = false, lx = S.glx, ly = S.gly;
      if (S.pointer && LB) {
        const r = sh.getBoundingClientRect();      // includes the live transform
        const c = eyeCenter();
        if (r.width) {
          const u = (S.pointer.x - r.left) / r.width, v = (S.pointer.y - r.top) / r.height;
          lx = clamp((u - LB.x) / LB.w, 0, 1);
          ly = clamp((v - LB.y) / LB.h, 0, 1);
          overLens = Math.hypot(S.pointer.x - c.x, S.pointer.y - c.y) < c.h * 0.46;
        }
      }
      // the highlight tracks with a little lag, the way a reflection lags the light source
      S.glx = damp(S.glx, lx, 14, dt); S.gly = damp(S.gly, ly, 14, dt);
      S.glint = damp(S.glint, overLens ? 1 : 0, overLens ? 9 : 5, dt);
      glint.style.setProperty('--gx', (S.glx * 100).toFixed(1) + '%');
      glint.style.setProperty('--gy', (S.gly * 100).toFixed(1) + '%');
      glint.style.opacity = S.glint.toFixed(3);
      // and the frames give a little, as though the pointer were resting on them
      // the frames give a little only when the pointer is actually on them
      let onFrames = false;
      if (S.pointer) {
        const r2 = sh.getBoundingClientRect();
        onFrames = S.pointer.x > r2.left && S.pointer.x < r2.right && S.pointer.y > r2.top && S.pointer.y < r2.bottom;
      }
      S.nx = damp(S.nx, onFrames ? (S.glx - 0.5) * 5 : 0, 8, dt);
      S.ny = damp(S.ny, onFrames ? (S.gly - 0.5) * 3 : 0, 8, dt);

      // Shades slide DOWN THE BEAK when you come close, and are pushed back up when you leave.
      // The distance comes from the rig (measured so the frame tops clear both eyes), not a
      // guess. Down is faster than up: gravity does the first, a penguin has to do the second.
      const want = S.shadesMode === 'down' ? 1 : S.shadesMode === 'up' ? 0 : (near ? 1 : 0);
      S.shadesV = damp(S.shadesV, want, want > S.shadesV ? 11 : 7, dt);
      const v = S.shadesV;
      // a small settle at the bottom of the slide, so they land rather than stop
      const settle = v > 0.92 ? Math.sin((v - 0.92) / 0.08 * Math.PI) * 0.9 : 0;
      const drop = (rig.shadesDropPct || 34) * v + settle;
      // down the beak, a hair forward, and very slightly larger: the beak tip is nearer the eye
      const tf = `translate(calc(${(v * 0.7).toFixed(2)}% + ${S.nx.toFixed(2)}px), calc(${drop.toFixed(2)}% + ${S.ny.toFixed(2)}px)) rotate(${(v * 1.1 + S.nx * 0.12).toFixed(2)}deg) scale(${(1 + v * 0.025).toFixed(4)})`;
      sh.style.transform = tf; glint.style.transform = tf;
      sh.style.filter = `drop-shadow(0 ${(3 + v * 5).toFixed(1)}px ${(4 + v * 5).toFixed(1)}px rgba(10, 30, 50, ${(0.2 + v * 0.14).toFixed(3)}))`;
      // blink
      if (S.blinkT < 0 && S.t > S.nextBlink) { S.blinkT = S.t; S.nextBlink = S.t + 2.6 + Math.random() * 3.6; }
      let lid = 0;
      if (S.blinkT >= 0) { const u = S.t - S.blinkT; lid = u < 0.08 ? u / 0.08 : u < 0.12 ? 1 : Math.max(0, 1 - (u - 0.12) / 0.11); if (u > 0.24) S.blinkT = -1; }
      for (const k in eyes) eyes[k].lid.style.transform = `translateY(${(-104 + lid * 104).toFixed(1)}%)`;
      // hop and lean
      let hop = 0, squash = 0;
      if (S.hopT >= 0) { const u = (S.t - S.hopT) / 0.55; if (u >= 1) S.hopT = -1; else { hop = Math.sin(Math.PI * u) * 18; squash = u > 0.8 ? (1 - u) * 0.04 : 0; } }
      const breathe = Math.sin(S.t * Math.PI * 2 / 4.2);
      body.style.transform = `translate(${(S.lean * 10).toFixed(1)}px, ${(-hop + breathe * 2.5).toFixed(1)}px) rotate(${(S.lean * 1.4).toFixed(2)}deg) scale(${(1 + breathe * 0.006 + squash).toFixed(4)}, ${(1 - breathe * 0.004 - squash * 1.5).toFixed(4)})`;
    }
    function loop(now) {
      if (!alive) return; raf = requestAnimationFrame(loop);
      const dt = S.last ? clamp((now - S.last) / 1000, 0, 0.05) : 1 / 60; S.last = now;
      if (!S.reduced) update(dt);
    }
    function setReducedMotion(on) {
      S.reduced = !!on;
      if (S.reduced) { for (const k in eyes) { eyes[k].iris.style.transform = ''; eyes[k].lid.style.transform = 'translateY(-104%)'; } sh.style.transform = ''; sh.style.filter = ''; glint.style.transform = ''; glint.style.opacity = '0'; body.style.transform = ''; }
    }
    setReducedMotion(reducedMQ && reducedMQ.matches);
    if (reducedMQ && reducedMQ.addEventListener) reducedMQ.addEventListener('change', (e) => setReducedMotion(e.matches));
    raf = requestAnimationFrame(loop);

    return {
      setPointer(x, y) { if (x == null) { S.pointer = null; S.pointerT = S.t; } else { S.pointer = { x, y }; S.pointerT = S.t; } },
      setShades(m) { S.shadesMode = m; },
      hop() { if (S.hopT < 0) S.hopT = S.t; },
      blink() { if (S.blinkT < 0) S.blinkT = S.t; },
      setReducedMotion,
      destroy() { alive = false; cancelAnimationFrame(raf); },
      _: { S, eyes, sh, glint, body },
    };
  }
  function el(tag, cls) { const e = document.createElement(tag); e.className = cls; return e; }

  root.IcePenguin2D = { mount };
})(window);
