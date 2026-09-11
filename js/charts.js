(function () {
  const D = window.SITE_DATA;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const fmt = (n) => n.toLocaleString("en-US");

  function monthLabel(ym, isFirst) {
    const [y, m] = ym.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const label = months[parseInt(m, 10) - 1];
    if (isFirst || m === "01") return `${label} ${y.slice(2)}`;
    return label;
  }

  function renderKpiStrip(el, items) {
    el.innerHTML = items.map(k => {
      const digits = String(k.value).replace(/[^0-9]/g, "");
      const canCount = digits.length > 0;
      return `
      <div class="kpi-cell">
        <div class="kpi-value mono"${canCount ? ` data-count-target="${digits}" data-count-final="${esc(k.value)}"` : ""}>${canCount ? "0" : esc(k.value)}</div>
        <div class="kpi-label">${esc(k.label)}</div>
      </div>`;
    }).join("");
  }

  function renderMonthlyChart() {
    const chartEl = document.getElementById("monthlyChart");
    const axisEl = document.getElementById("monthlyAxis");
    const { data, max } = D.monthlyCommits;
    chartEl.innerHTML = data.map(([ym, n], i) => {
      const h = Math.max(3, Math.round(n / 1125 * 200));
      const color = n > 700 ? "var(--cyan)" : n > 300 ? "var(--cyan-mid)" : "var(--cyan-deep)";
      const label = n >= 600 ? `<div class="bar-col-label">${fmt(n)}</div>` : "";
      return `<div class="bar-col">${label}<div class="bar grow-v" style="height:${h}px;background:${color};transition-delay:${i * 12}ms" title="${ym} · ${fmt(n)} commits"></div></div>`;
    }).join("");
    axisEl.innerHTML = data.map(([ym], i) => `<div class="axis-label">${monthLabel(ym, i === 0)}</div>`).join("");
  }

  function renderLeaderboard(el, data, max, colorFn, hasRank) {
    el.innerHTML = data.map(([name, n], i) => {
      const pct = Math.max(2, Math.round(n / max * 100));
      const rank = hasRank ? `<div class="lb-rank mono">${String(i + 1).padStart(2, "0")}</div>` : "";
      return `<div class="lb-row${hasRank ? "" : " no-rank"}">
        ${rank}
        <div class="lb-name" title="${esc(name)}">${esc(name)}</div>
        <div class="lb-track"><div class="lb-fill grow-h" style="width:${pct}%;background:${colorFn(i)};transition-delay:${i * 30}ms"></div></div>
        <div class="lb-count mono">${fmt(n)}</div>
      </div>`;
    }).join("");
  }

  function renderHourChart() {
    const chartEl = document.getElementById("hourChart");
    const axisEl = document.getElementById("hourAxis");
    const { data, max } = D.hourly;
    chartEl.innerHTML = data.map((n, h) => {
      const barH = Math.max(2, Math.round(n / 592 * 150));
      const color = n > 450 ? "var(--cyan)" : n > 250 ? "var(--cyan-mid)" : "var(--cyan-deep)";
      const label = (n >= 520 || n <= 25) ? `<div class="bar-col-label">${fmt(n)}</div>` : "";
      return `<div class="bar-col">${label}<div class="bar grow-v" style="height:${barH}px;background:${color};transition-delay:${h * 15}ms" title="${String(h).padStart(2,"0")}:00 · ${fmt(n)} commits"></div></div>`;
    }).join("");
    axisEl.innerHTML = data.map((_, h) => `<div class="axis-label">${h % 3 === 0 ? String(h).padStart(2, "0") : ""}</div>`).join("");
  }

  function renderWeekdayGrid() {
    const el = document.getElementById("weekdayGrid");
    const { data, max } = D.weekday;
    el.innerHTML = data.map(([day, n]) => {
      const pct = Math.round(n / 1350 * 100);
      return `<div class="weekday-card">
        <div class="weekday-day mono">${day.toUpperCase()}</div>
        <div class="weekday-count">${fmt(n)}</div>
        <div class="weekday-track"><div class="weekday-fill grow-h" style="width:${pct}%"></div></div>
      </div>`;
    }).join("");
  }

  function renderContributorWall() {
    const el = document.getElementById("contributorWall");
    el.innerHTML = D.contributorWall.map(([name, n]) => `
      <div class="chip"><span>${esc(name)}</span><span class="count mono">${fmt(n)}</span></div>
    `).join("");
  }

  function renderDiscordChart() {
    const chartEl = document.getElementById("discordChart");
    const axisEl = document.getElementById("discordAxis");
    const { data, labels } = D.discordJoins;
    chartEl.innerHTML = data.map(([ym, cumulative, joined], i) => {
      const h = Math.max(3, Math.round(cumulative / 250 * 150));
      const color = joined >= 13 ? "var(--cyan)" : joined >= 6 ? "var(--cyan-mid)" : "var(--cyan-deep)";
      const label = joined >= 13 ? `<div class="bar-col-label">+${joined}</div>` : "";
      return `<div class="bar-col">${label}<div class="bar grow-v" style="height:${h}px;background:${color};transition-delay:${i * 12}ms" title="${ym} · ${fmt(cumulative)} members · +${joined} that month"></div></div>`;
    }).join("");
    axisEl.innerHTML = data.map(([ym]) => `<div class="axis-label">${labels.includes(ym) ? ym : ""}</div>`).join("");
  }

  function renderDiscordChannels() {
    const el = document.getElementById("discordChannels");
    el.innerHTML = D.discordChannels.map(([ch, n]) => `
      <div class="msg-row"><span class="ch">${esc(ch)}</span><span class="cnt mono">${fmt(n)}</span></div>
    `).join("");
  }

  function renderReleaseChart() {
    const chartEl = document.getElementById("releaseChart");
    const axisEl = document.getElementById("releaseAxis");
    const zeroSet = new Set(["v0.1.5", "v0.1.6", "v0.1.7", "v1.0.2", "v2.0.2", "v2.0.4a"]);
    const releases = window.RELEASES || [];
    chartEl.innerHTML = releases.map((r, i) => {
      const added = (r.tables_added || []).length;
      const updated = (r.tables_updated || []).length;
      const isZero = added === 0 && updated === 0;
      const addH = added ? Math.max(3, Math.round(added / 83 * 150)) : 0;
      const updH = isZero ? 3 : (updated ? Math.max(3, Math.round(updated / 83 * 150)) : (added ? 0 : 3));
      const updColor = isZero ? "var(--bar-zero)" : "var(--bar-updates)";
      const dateStr = (r.date || "").slice(0, 10);
      return `<div class="bar-col" title="${esc(r.release)} · ${dateStr} · +${added} added, ${updated} updated">
        ${added ? `<div class="bar grow-v" style="height:${addH}px;background:var(--cyan);border-radius:2px 2px 0 0;transition-delay:${i * 8}ms"></div>` : ""}
        <div class="bar grow-v" style="height:${updH}px;background:${updColor};border-radius:${added ? "0" : "2px 2px 0 0"};transition-delay:${i * 8}ms"></div>
      </div>`;
    }).join("");
    axisEl.innerHTML = releases.map(r => {
      const major = /^v\d+\.\d+\.0$/.test(r.release);
      return `<div class="axis-label mono" style="color:var(--cyan)">${major ? r.release : ""}</div>`;
    }).join("");
  }

  function renderJoinsChart() {
    const chartEl = document.getElementById("joinsChart");
    const axisEl = document.getElementById("joinsAxis");
    const { data } = D.joinsByMonth;
    chartEl.innerHTML = data.map(([ym, n], i) => {
      const h = Math.max(4, Math.round(n / 16 * 120));
      const color = n >= 10 ? "var(--amber)" : n >= 5 ? "var(--cyan-mid)" : "var(--cyan-deep)";
      return `<div class="bar-col"><div class="bar-col-label">${n}</div><div class="bar grow-v" style="height:${h}px;background:${color};transition-delay:${i * 20}ms" title="${ym} · ${n} first commits"></div></div>`;
    }).join("");
    axisEl.innerHTML = data.map(([ym], i) => `<div class="axis-label">${monthLabel(ym, i === 0)}</div>`).join("");
  }

  function renderBusiestDays() {
    const el = document.getElementById("busiestDays");
    const { data, max } = D.busiestDays;
    el.innerHTML = data.map(([date, n], i) => {
      const pct = Math.round(n / 97 * 100);
      return `<div class="busiest-row">
        <div class="busiest-date mono">${date}</div>
        <div class="busiest-track"><div class="busiest-fill grow-h${i === 0 ? " top" : ""}" style="width:${pct}%;transition-delay:${i * 40}ms"></div></div>
        <div class="busiest-count mono">${n}</div>
      </div>`;
    }).join("");
  }

  function eventMeta(ev) {
    if (!ev.link) return esc(ev.meta);
    return `<a href="${esc(ev.link)}" target="_blank" rel="noopener">${esc(ev.meta)}</a>`;
  }

  function renderEventSpine() {
    const el = document.getElementById("eventSpine");
    el.innerHTML = D.timelineEvents.map(ev => {
      if (ev.featured) {
        return `<div class="event featured">
          <div class="event-left"><div class="event-date mono">${esc(ev.date)}</div><div class="event-who mono">${esc(ev.who)}</div></div>
          <div class="event-right">
            <div class="event-dot" style="background:${ev.color}"></div>
            <div class="event-eyebrow">★ MILESTONE</div>
            <div class="event-title">${esc(ev.title)}</div>
            <p class="event-body">${esc(ev.body)}</p>
            <div class="event-meta mono">${eventMeta(ev)}</div>
          </div>
        </div>`;
      }
      return `<div class="event">
        <div class="event-left"><div class="event-date mono">${esc(ev.date)}</div><div class="event-who mono">${esc(ev.who)}</div></div>
        <div class="event-right">
          <div class="event-dot" style="background:${ev.color}"></div>
          <div class="event-title">${esc(ev.title)}</div>
          <p class="event-body">${esc(ev.body)}</p>
          <div class="event-meta mono">${eventMeta(ev)}</div>
        </div>
      </div>`;
    }).join("");
  }

  function renderAllCharts() {
    renderKpiStrip(document.getElementById("kpiOverview"), D.kpiOverview);
    renderKpiStrip(document.getElementById("kpiTimeline"), D.kpiTimeline);
    renderMonthlyChart();
    renderLeaderboard(document.getElementById("contributorRows"), D.contributors.data, D.contributors.max,
      (i) => i < 2 ? "var(--pink)" : i < 5 ? "var(--pink-mid)" : "var(--pink-deep)", true);
    renderLeaderboard(document.getElementById("reviewerRows"), D.reviewers.data, D.reviewers.max,
      (i) => i === 0 ? "var(--amber)" : i < 3 ? "var(--amber-mid)" : "var(--amber-deep)", true);
    renderLeaderboard(document.getElementById("manufacturerRows"), D.manufacturerMix.data, D.manufacturerMix.max,
      (i) => i < 2 ? "var(--cyan)" : i < 5 ? "var(--cyan-mid)" : "var(--cyan-deeper)", false);
    renderLeaderboard(document.getElementById("eraRows"), D.eraMix.data, D.eraMix.max,
      (i) => i < 2 ? "var(--cyan)" : i < 5 ? "var(--cyan-mid)" : "var(--cyan-deeper)", false);
    renderLeaderboard(document.getElementById("revisedTableRows"), D.mostRevisedTables.data, D.mostRevisedTables.max,
      (i) => i === 0 ? "var(--amber)" : i < 3 ? "var(--amber-mid)" : "var(--amber-deep)", true);
    renderLeaderboard(document.getElementById("tableAuthorRows"), D.tableAuthors.data, D.tableAuthors.max,
      (i) => i === 0 ? "var(--amber)" : i < 3 ? "var(--amber-mid)" : "var(--amber-deep)", true);
    renderHourChart();
    renderWeekdayGrid();
    renderContributorWall();
    renderDiscordChart();
    renderDiscordChannels();
    renderLeaderboard(document.getElementById("discordPosters"), D.discordPosters.data, D.discordPosters.max,
      (i) => i < 2 ? "var(--cyan)" : i < 4 ? "var(--cyan-mid)" : "var(--cyan-deeper)", false);
    renderEventSpine();
    renderReleaseChart();
    renderJoinsChart();
    renderBusiestDays();
  }

  window.renderAllCharts = renderAllCharts;
})();
