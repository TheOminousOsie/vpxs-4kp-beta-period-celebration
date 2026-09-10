(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");

  let INDEX = [];
  let query = "";
  let letter = "all";
  let openTable = null;
  let historyOpen = false;
  const openCommits = new Set();
  const tableDataCache = new Map();

  function letterOf(entry) {
    const base = (entry.name || entry.slug).replace(/^vpx[-_]/, "").trim();
    const ch = (base[0] || "#").toLowerCase();
    if (/[0-9]/.test(ch)) return "0-9";
    if (/[a-z]/.test(ch)) return ch;
    return "0-9";
  }

  function buildLetterFilter() {
    const present = new Set(INDEX.map(letterOf));
    const letters = [];
    for (let c = 97; c <= 122; c++) {
      const l = String.fromCharCode(c);
      if (present.has(l)) letters.push(l);
    }
    const options = ["all", ...(present.has("0-9") ? ["0-9"] : []), ...letters];
    const el = document.getElementById("letterFilter");
    el.innerHTML = options.map(opt => {
      const label = opt === "all" ? "All" : (opt === "0-9" ? "0–9" : opt);
      return `<button class="letter-btn${opt === letter ? " selected" : ""}" data-letter="${opt}">${label}</button>`;
    }).join("");
    el.querySelectorAll(".letter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        letter = btn.dataset.letter;
        query = "";
        document.getElementById("catalogSearch").value = "";
        renderList();
      });
    });
  }

  function filteredEntries() {
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return INDEX.filter(e => (e.slug + " " + e.name).toLowerCase().includes(q));
    }
    if (letter !== "all") {
      return INDEX.filter(e => letterOf(e) === letter);
    }
    return INDEX;
  }

  function updateResultCount(list) {
    const el = document.getElementById("resultCount");
    const n = list.length;
    const noun = n === 1 ? "TABLE" : "TABLES";
    let suffix = "";
    if (query.trim()) suffix = ` MATCHING “${query.trim()}”`;
    else if (letter !== "all") suffix = ` UNDER ${letter === "0-9" ? "0–9" : letter.toUpperCase()}`;
    el.textContent = `${fmt(n)} ${noun}${suffix}`;
  }

  function subtitleFor(entry) {
    if (entry.manufacturer && entry.year) return `${entry.manufacturer} · ${entry.year}`;
    if (entry.manufacturer) return entry.manufacturer;
    if (!entry.commits) return "Record not yet imported";
    return `${fmt(entry.commits)} commit${entry.commits === 1 ? "" : "s"} · ${entry.first || "?"} → ${entry.last || "?"}`;
  }

  function badgeFor(entry) {
    if (!entry.commits) return entry.slug;
    return `${fmt(entry.commits)} COMMITS`;
  }

  function renderList() {
    const list = filteredEntries();
    updateResultCount(list);
    const el = document.getElementById("tableList");
    if (list.length === 0) {
      el.innerHTML = `<div class="empty-state">No tables match “${esc(query.trim())}”.</div>`;
      return;
    }
    el.innerHTML = list.map(entry => rowTemplate(entry)).join("");
    el.querySelectorAll(".table-row").forEach(row => {
      row.addEventListener("click", () => toggleTable(row.dataset.slug));
    });
    if (openTable && list.some(e => e.slug === openTable)) {
      const body = document.getElementById("body-" + openTable);
      if (body) renderTableBody(openTable);
    }
  }

  function rowTemplate(entry) {
    const isOpen = entry.slug === openTable;
    const thumb = entry.art
      ? `<img src="assets/launchers/${entry.slug}.png" alt="" loading="lazy">`
      : "";
    return `
      <div class="table-row-wrap">
        <button class="table-row${isOpen ? " open" : ""}" data-slug="${entry.slug}" aria-expanded="${isOpen}">
          <span class="expand-btn">${isOpen ? "−" : "+"}</span>
          <span class="thumb">${thumb}</span>
          <span class="name-block">
            <div class="name">${esc(entry.name)}</div>
            <div class="subtitle">${esc(subtitleFor(entry))}</div>
          </span>
          <span class="row-badge mono">${esc(badgeFor(entry))}</span>
          <span class="row-cta mono">${isOpen ? "HIDE HISTORY" : "SHOW TABLE HISTORY"}</span>
        </button>
        <div class="table-body" id="body-${entry.slug}" ${isOpen ? "" : "hidden"}></div>
      </div>`;
  }

  function toggleTable(slug) {
    if (openTable === slug) {
      openTable = null;
    } else {
      openTable = slug;
      historyOpen = false;
      openCommits.clear();
    }
    renderList();
  }

  function entryBySlug(slug) { return INDEX.find(e => e.slug === slug); }

  function renderTableBody(slug) {
    const el = document.getElementById("body-" + slug);
    if (!el) return;
    const entry = entryBySlug(slug);
    const m = window.TABLE_META && window.TABLE_META[slug];
    const artHtml = entry.art
      ? `<img class="launcher-art" src="assets/launchers/${slug}.png" alt="${esc(entry.name)} launcher art">`
      : `<div class="thumb" style="width:100%;max-width:300px;height:300px"></div>`;

    let metaHtml;
    if (m && m.meta && m.meta.length) {
      const taglineHtml = m.tagline ? `<div class="tagline">“${esc(m.tagline)}”</div>` : "";
      metaHtml = `
        <div>
          ${taglineHtml}
          <div class="meta-grid">
            ${m.meta.map(([k, v]) => `<div class="meta-pair"><span class="k mono">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join("")}
          </div>
        </div>`;
    } else {
      metaHtml = `
        <div>
          <div class="note-card">
            <div class="eyebrow-warn">METADATA PENDING</div>
            <p>Table metadata for <strong>${esc(entry.name)}</strong> hasn't been imported into this build yet. Full commit history below is real.</p>
          </div>
        </div>`;
    }

    const historyHtml = entry.history ? `
      <div class="history-block">
        <h4>launcher.png history</h4>
        <p class="desc">Every launcher art revision for this table, side by side.</p>
        <div class="history-frame"><img src="assets/launcher-history/${slug}.png" alt="${esc(entry.name)} launcher history"></div>
      </div>` : "";

    el.innerHTML = `
      <div class="art-meta">
        <div>${artHtml}</div>
        ${metaHtml}
      </div>
      ${historyHtml}
      <div id="commit-section-${slug}"></div>
    `;
    renderCommitSection(slug);
  }

  function renderCommitSection(slug) {
    const el = document.getElementById("commit-section-" + slug);
    if (!el) return;
    const entry = entryBySlug(slug);
    if (!entry.commits) {
      el.innerHTML = `<div class="note-card">
        <div class="eyebrow-warn">NOT YET IMPORTED</div>
        <p>Commit history for <code>${esc(entry.slug)}</code> isn't in this build yet.</p>
      </div>`;
      return;
    }
    const rangeStr = `${fmt(entry.commits)} COMMITS · ${entry.first || "?"} → ${entry.last || "?"}`;
    el.innerHTML = `
      <button class="commit-history-header" id="commit-toggle-${slug}">
        <span class="chh-left">
          <span class="expand-btn">${historyOpen ? "−" : "+"}</span>
          <span>
            <h4>Commit history</h4>
            <div class="hint">${historyOpen ? "Newest first. Open a commit to see what changed." : "Every commit that touched this table — tap to expand."}</div>
          </span>
        </span>
        <span class="chh-right mono">${rangeStr}</span>
      </button>
      <div id="commit-list-${slug}"></div>
    `;
    document.getElementById("commit-toggle-" + slug).addEventListener("click", () => {
      historyOpen = !historyOpen;
      renderCommitSection(slug);
    });
    if (historyOpen) loadAndRenderCommits(slug);
  }

  function loadAndRenderCommits(slug) {
    const listEl = document.getElementById("commit-list-" + slug);
    if (!listEl) return;
    if (tableDataCache.has(slug)) {
      renderCommitList(slug, tableDataCache.get(slug));
      return;
    }
    listEl.innerHTML = `<div class="loading-note mono">LOADING COMMIT HISTORY…</div>`;
    fetch(`data/tables/${slug}.json`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        tableDataCache.set(slug, data);
        if (openTable === slug && historyOpen) renderCommitList(slug, data);
      })
      .catch(() => {
        listEl.innerHTML = `<div class="loading-note mono">COULDN'T LOAD COMMIT DATA. IF YOU OPENED THIS FILE DIRECTLY (file://), SERVE IT OVER HTTP INSTEAD.</div>`;
      });
  }

  function shortHash(h) { return (h || "").slice(0, 7); }

  function renderCommitList(slug, data) {
    const listEl = document.getElementById("commit-list-" + slug);
    if (!listEl) return;
    const commits = data.commits || [];
    listEl.innerHTML = commits.map(c => commitRowTemplate(slug, c)).join("");
    commits.forEach(c => {
      const key = slug + ":" + c.hash;
      const rowEl = listEl.querySelector(`[data-commit-key="${cssEscape(key)}"]`);
      if (rowEl) rowEl.addEventListener("click", () => toggleCommit(slug, c.hash));
    });
  }

  function cssEscape(s) {
    return s.replace(/[^a-zA-Z0-9_-]/g, (c) => "\\" + c);
  }

  function commitRowTemplate(slug, c) {
    const key = slug + ":" + c.hash;
    const isOpen = openCommits.has(key);
    const dateStr = (c.date || "").replace(/:\d{2}([-+]\d{2}:?\d{2})?$/, "").replace("T", " ").slice(0, 16);
    const expandedHtml = isOpen ? commitExpandedTemplate(c) : "";
    return `
      <div class="commit-row-wrap">
        <button class="commit-row${isOpen ? " open" : ""}" data-commit-key="${esc(key)}">
          <span class="commit-btn">${isOpen ? "−" : "+"}</span>
          <span class="commit-date mono">${esc(dateStr)}</span>
          <span class="commit-msg">${esc((c.message || "").split("\n")[0])}</span>
          <span class="commit-author">${esc(c.author)}</span>
          <span class="commit-hash mono">${esc(shortHash(c.hash))}</span>
        </button>
        <div class="commit-expanded" ${isOpen ? "" : "hidden"}>${expandedHtml}</div>
      </div>`;
  }

  function toggleCommit(slug, hash) {
    const key = slug + ":" + hash;
    if (openCommits.has(key)) openCommits.delete(key);
    else openCommits.add(key);
    renderCommitList(slug, tableDataCache.get(slug));
  }

  function commitExpandedTemplate(c) {
    const bodyLines = (c.message || "").split("\n").slice(1).join("\n").trim();
    const bodyHtml = bodyLines ? `<div class="commit-body-text">${esc(bodyLines)}</div>` : "";
    const files = (c.files || []).map(f => fileCardTemplate(f)).join("");
    return `${bodyHtml}<div class="file-list">${files}</div>`;
  }

  function fileCardTemplate(f) {
    const status = f.status || "M";
    let body;
    if (f.bin || (!f.diff && /\.(png|jpg|jpeg|gif|webp|zip|vpx|ogg|mp3|wav)$/i.test(f.path || ""))) {
      body = `<div class="file-binary mono">Binary file — no text diff</div>`;
    } else if (f.diff) {
      body = `<div class="diff-body">${diffToHtml(f.diff)}</div>`;
    } else {
      body = "";
    }
    return `
      <div class="file-card">
        <div class="file-header">
          <span class="status-badge s-${esc(status)} mono">${esc(status)}</span>
          <span class="file-path">${esc(f.path)}</span>
        </div>
        ${body}
      </div>`;
  }

  const MAX_DIFF_LINES = 400;
  function diffToHtml(diff) {
    const allLines = diff.split("\n");
    const truncated = allLines.length > MAX_DIFF_LINES;
    const lines = truncated ? allLines.slice(0, MAX_DIFF_LINES) : allLines;
    const rendered = lines.map(line => {
      let cls = "diff-context";
      if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff --git") || line.startsWith("index ")) {
        cls = "diff-context";
      } else if (line.startsWith("+")) cls = "diff-add";
      else if (line.startsWith("-")) cls = "diff-remove";
      else if (line.startsWith("\\")) cls = "diff-noeol";
      const content = line.length ? line : " ";
      return `<div class="diff-line ${cls}">${esc(content)}</div>`;
    }).join("");
    const trunc = truncated ? `<div class="diff-trunc">… ${fmt(allLines.length - MAX_DIFF_LINES)} more lines in the full diff</div>` : "";
    return rendered + trunc;
  }

  function initCatalog() {
    INDEX = (window.TABLE_INDEX || []).slice();
    buildLetterFilter();
    renderList();
    document.getElementById("catalogSearch").addEventListener("input", (e) => {
      query = e.target.value;
      letter = "all";
      buildLetterFilter();
      renderList();
    });
  }

  window.initCatalog = initCatalog;
})();
