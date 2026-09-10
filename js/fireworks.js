(function () {
  const PALETTE = ["#4de3ff", "#ffb84d", "#ffffff", "#7bf0d0", "#ff8fb1"];

  function initFireworks(canvas) {
    const ctx = canvas.getContext("2d");
    const state = {
      on: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      rate: 2,
      rockets: [],
      particles: [],
      launchCounter: 0,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      raf: null
    };

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * state.dpr;
      canvas.height = rect.height * state.dpr;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      state.w = rect.width;
      state.h = rect.height;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

    function spawnRocket() {
      const w = state.w, h = state.h;
      state.rockets.push({
        x: rand(w * 0.08, w * 0.92),
        y: h + 8,
        vy: -(h * 0.0095 + Math.random() * h * 0.004),
        vx: (Math.random() - 0.5) * 0.5,
        target: h * rand(0.12, 0.52),
        color: pick(PALETTE)
      });
    }

    function burst(x, y, color) {
      const count = (46 + Math.random() * 34) | 0;
      const isRing = Math.random() < 0.45;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
        const speed = isRing ? (1.9 + Math.random() * 0.3) : (1.9 + Math.random() * 1.9) * Math.random();
        const c = Math.random() < 0.14 ? "#ffffff" : color;
        state.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: rand(0.008, 0.02),
          radius: 1 + Math.random() * 1.3,
          color: c
        });
      }
    }

    let last = performance.now();
    function frame(now) {
      state.raf = requestAnimationFrame(frame);
      let dt = (now - last) / 16.67;
      dt = Math.min(dt, 3);
      last = now;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(10,14,17,0.20)";
      ctx.fillRect(0, 0, state.w, state.h);
      ctx.globalCompositeOperation = "lighter";

      if (state.on) {
        state.launchCounter -= dt;
        if (state.launchCounter <= 0) {
          spawnRocket();
          if (Math.random() < 0.3) spawnRocket();
          state.launchCounter = (46 + Math.random() * 60) / state.rate;
        }
      }

      for (let i = state.rockets.length - 1; i >= 0; i--) {
        const r = state.rockets[i];
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.vy += 0.052 * dt;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
        if (r.vy >= -0.6 || r.y <= r.target) {
          burst(r.x, r.y, r.color);
          state.rockets.splice(i, 1);
        }
      }

      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.vy += 0.022 * dt;
        p.vx *= Math.pow(0.988, dt);
        p.vy *= Math.pow(0.988, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) { state.particles.splice(i, 1); continue; }
        let alpha = Math.min(1, p.life + 0.15);
        if (p.life < 0.35) alpha = p.life * 2.4;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    state.raf = requestAnimationFrame(frame);

    return {
      setOn(v) { state.on = v; },
      setRate(v) { state.rate = v; },
      destroy() {
        cancelAnimationFrame(state.raf);
        ro.disconnect();
      }
    };
  }

  window.initFireworks = initFireworks;
})();
