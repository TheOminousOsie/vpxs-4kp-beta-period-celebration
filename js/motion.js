(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCount(el, delay) {
    const target = parseInt(el.dataset.countTarget, 10);
    const final = el.dataset.countFinal;
    if (reduced || isNaN(target)) { el.textContent = final; return; }
    setTimeout(() => {
      const duration = 1100;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const val = Math.round(target * easeOutCubic(t));
        el.textContent = val.toLocaleString("en-US");
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = final;
      }
      requestAnimationFrame(tick);
    }, delay);
  }

  function initKpiReveal() {
    const strips = document.querySelectorAll(".kpi-strip");
    if (!strips.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const nodes = entry.target.querySelectorAll("[data-count-target]:not([data-animated])");
        nodes.forEach((el, i) => {
          el.setAttribute("data-animated", "1");
          animateCount(el, i * 90);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    strips.forEach((el) => io.observe(el));
  }

  function initGrowReveal() {
    const containers = document.querySelectorAll(".bar-chart, .lb-rows, .busiest-days, .weekday-grid");
    if (!containers.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".grow-v, .grow-h").forEach((el) => {
          el.classList.add("in-view");
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    containers.forEach((el) => io.observe(el));
  }

  function initEventReveal() {
    const events = document.querySelectorAll(".event");
    if (!events.length) return;
    if (reduced) { events.forEach((e) => e.classList.add("in-view")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    events.forEach((el) => io.observe(el));
  }

  function initMilestoneBursts() {
    if (reduced) return;
    const targets = document.querySelectorAll(".event.featured, .cta-block");
    if (!targets.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const rect = entry.target.getBoundingClientRect();
        const x = rect.left + rect.width * (0.25 + Math.random() * 0.5);
        const y = rect.top + rect.height * 0.35;
        if (window.spawnBurst) {
          window.spawnBurst(x, y, null, 34);
          setTimeout(() => window.spawnBurst(x + (Math.random() - 0.5) * 120, y + 20, null, 26), 140);
        }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    targets.forEach((el) => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.initClickBurst) window.initClickBurst();
    initKpiReveal();
    initGrowReveal();
    initEventReveal();
    initMilestoneBursts();
  });
})();
