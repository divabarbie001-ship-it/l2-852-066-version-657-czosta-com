(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function text(value) {
    return (value || "").toString().toLowerCase();
  }

  ready(function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        mobileNav.classList.toggle("is-open");
      });
    }

    document.querySelectorAll("img[data-cover]").forEach(function (img) {
      img.addEventListener("error", function () {
        var shell = img.closest(".poster-shell, .rank-poster, .category-poster, .hero-bg, .detail-backdrop");
        if (shell) {
          shell.classList.add("no-img");
        }
        img.remove();
      }, { once: true });
    });

    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var current = 0;
      var timer = null;

      function show(index) {
        if (!slides.length) {
          return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("is-active", i === current);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("active", i === current);
        });
      }

      function start() {
        stop();
        timer = window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          show(parseInt(dot.getAttribute("data-hero-dot"), 10));
          start();
        });
      });

      var prev = hero.querySelector("[data-hero-prev]");
      var next = hero.querySelector("[data-hero-next]");

      if (prev) {
        prev.addEventListener("click", function () {
          show(current - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(current + 1);
          start();
        });
      }

      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
      show(0);
      start();
    }

    document.querySelectorAll("[data-filter-root]").forEach(function (panel) {
      var scope = panel.parentElement || document;
      var input = panel.querySelector("[data-search-input]");
      var genre = panel.querySelector("[data-genre-filter]");
      var year = panel.querySelector("[data-year-filter]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".filter-card"));

      function apply() {
        var q = text(input && input.value).trim();
        var g = text(genre && genre.value).trim();
        var y = text(year && year.value).trim();

        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-category"),
            card.getAttribute("data-year")
          ].map(text).join(" ");
          var ok = true;

          if (q && haystack.indexOf(q) === -1) {
            ok = false;
          }
          if (g && text(card.getAttribute("data-genre")).indexOf(g) === -1) {
            ok = false;
          }
          if (y && text(card.getAttribute("data-year")) !== y) {
            ok = false;
          }

          card.classList.toggle("is-hidden-by-filter", !ok);
        });
      }

      [input, genre, year].forEach(function (el) {
        if (el) {
          el.addEventListener("input", apply);
          el.addEventListener("change", apply);
        }
      });

      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q && input) {
        input.value = q;
      }
      apply();
    });

    document.querySelectorAll("[data-player]").forEach(function (player) {
      var video = player.querySelector("video");
      var trigger = player.querySelector(".play-trigger");
      var stream = player.getAttribute("data-stream");
      var attached = false;
      var hls = null;

      function attach() {
        if (!video || !stream || attached) {
          return;
        }
        attached = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else {
          video.src = stream;
        }

        video.setAttribute("controls", "controls");
      }

      function play() {
        attach();
        if (trigger) {
          trigger.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && promise.catch) {
          promise.catch(function () {
            if (trigger) {
              trigger.classList.remove("is-hidden");
            }
          });
        }
      }

      if (trigger) {
        trigger.addEventListener("click", play);
      }

      if (video) {
        video.addEventListener("click", function () {
          if (video.paused) {
            play();
          }
        });
      }

      window.addEventListener("pagehide", function () {
        if (hls && hls.destroy) {
          hls.destroy();
        }
      });
    });
  });
})();
