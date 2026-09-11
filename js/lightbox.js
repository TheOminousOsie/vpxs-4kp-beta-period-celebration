(function () {
  let overlay, scrollWrap, img, caption;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.innerHTML = `
      <button class="lightbox-close" aria-label="Close">×</button>
      <div class="lightbox-scroll"><img class="lightbox-img" alt=""></div>
      <div class="lightbox-caption"></div>
    `;
    document.body.appendChild(overlay);
    scrollWrap = overlay.querySelector(".lightbox-scroll");
    img = overlay.querySelector(".lightbox-img");
    caption = overlay.querySelector(".lightbox-caption");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".lightbox-close").addEventListener("click", close);
    img.addEventListener("click", () => {
      img.classList.toggle("zoomed");
      scrollWrap.classList.toggle("zoomed");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function open(src, alt) {
    if (!overlay) build();
    img.src = src;
    img.alt = alt || "";
    img.classList.remove("zoomed");
    scrollWrap.classList.remove("zoomed");
    caption.textContent = alt || "";
    overlay.classList.add("open");
    document.body.classList.add("lightbox-locked");
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.classList.remove("lightbox-locked");
  }

  document.addEventListener("click", (e) => {
    const target = e.target.closest("img.zoomable");
    if (!target) return;
    open(target.currentSrc || target.src, target.alt);
  });
})();
