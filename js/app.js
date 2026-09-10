(function () {
  let fireworks = null;
  let catalogInited = false;

  function setPage(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const target = document.getElementById("page-" + page);
    if (target) target.classList.add("active");
    document.querySelectorAll("#mainNav a").forEach(a => {
      a.classList.toggle("active", a.dataset.page === page);
    });
    window.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, "", "#" + page);

    if (page === "overview" && !fireworks) {
      const canvas = document.querySelector(".hero canvas.fireworks");
      if (canvas) fireworks = window.initFireworks(canvas);
    }
    if (page === "catalog" && !catalogInited) {
      window.initCatalog();
      catalogInited = true;
    }
  }

  function pageFromHash() {
    const h = (location.hash || "").replace("#", "");
    return ["overview", "catalog", "timeline"].includes(h) ? h : "overview";
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.renderAllCharts();

    document.querySelectorAll("#mainNav a").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        setPage(a.dataset.page);
      });
    });
    document.querySelectorAll("[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => setPage(btn.dataset.nav));
    });
    window.addEventListener("hashchange", () => setPage(pageFromHash()));

    setPage(pageFromHash());
  });
})();
