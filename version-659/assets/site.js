(function () {
  var base = window.SITE_BASE || "";

  function byAttr(name) {
    return document.querySelector("[" + name + "]");
  }

  function allByAttr(name) {
    return Array.prototype.slice.call(document.querySelectorAll("[" + name + "]"));
  }

  function withBase(url) {
    if (!url) {
      return base || "./";
    }
    if (/^(https?:|mailto:|tel:|#)/.test(url)) {
      return url;
    }
    return base + url;
  }

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/\s+/g, "");
  }

  function initMenu() {
    var toggle = byAttr("data-menu-toggle");
    var menu = byAttr("data-mobile-menu");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", menu.classList.contains("is-open") ? "true" : "false");
    });
  }

  function initSearch() {
    var panel = byAttr("data-search-panel");
    var toggle = byAttr("data-search-toggle");
    var input = byAttr("data-site-search");
    var results = byAttr("data-site-results");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        panel.classList.toggle("is-open");
        if (panel.classList.contains("is-open") && input) {
          setTimeout(function () {
            input.focus();
          }, 30);
        }
      });
    }
    if (!input || !results || !window.SITE_SEARCH_DATA) {
      return;
    }
    input.addEventListener("input", function () {
      var q = normalize(input.value);
      if (!q) {
        results.classList.remove("is-open");
        results.innerHTML = "";
        return;
      }
      var matches = window.SITE_SEARCH_DATA.filter(function (item) {
        return normalize(item.t + item.c + item.y + item.r + item.g).indexOf(q) !== -1;
      }).slice(0, 10);
      results.innerHTML = matches.map(function (item) {
        return '<a href="' + withBase(item.u) + '"><span>' + escapeHtml(item.t) + '</span><small>' + escapeHtml(item.c + ' · ' + item.y) + '</small></a>';
      }).join("");
      results.classList.toggle("is-open", matches.length > 0);
    });
  }

  function escapeHtml(text) {
    return String(text || "").replace(/[&<>\"]/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[ch];
    });
  }

  function initHero() {
    var stage = document.querySelector("[data-hero-stage]");
    if (!stage) {
      return;
    }
    var slides = Array.prototype.slice.call(stage.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(stage.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }
    show(0);
    restart();
  }

  function initCardFilter() {
    var input = byAttr("data-card-filter");
    if (!input) {
      return;
    }
    var cards = allByAttr("data-card");
    input.addEventListener("input", function () {
      var q = normalize(input.value);
      cards.forEach(function (card) {
        card.classList.toggle("hidden-card", q && normalize(card.getAttribute("data-card")).indexOf(q) === -1);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initSearch();
    initHero();
    initCardFilter();
  });
})();
