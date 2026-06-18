(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function setupMenu() {
        var button = document.querySelector(".mobile-menu-button");
        var nav = document.querySelector(".mobile-nav");
        if (!button || !nav) {
            return;
        }
        button.addEventListener("click", function () {
            var open = nav.classList.toggle("is-open");
            button.classList.toggle("is-open", open);
            button.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    function setupHero() {
        var slider = document.querySelector(".hero-slider");
        if (!slider) {
            return;
        }
        var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
        var prev = slider.querySelector(".hero-prev");
        var next = slider.querySelector(".hero-next");
        if (slides.length < 2) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(target) {
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                start();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }
        slider.addEventListener("mouseenter", stop);
        slider.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function setupFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll(".filter-panel"));
        panels.forEach(function (panel) {
            var scope = panel.nextElementSibling;
            while (scope && !scope.querySelector(".filter-scope")) {
                scope = scope.nextElementSibling;
            }
            var container = scope ? scope.querySelector(".filter-scope") : document.querySelector(".filter-scope");
            if (!container) {
                return;
            }
            var cards = Array.prototype.slice.call(container.querySelectorAll(".movie-card"));
            var input = panel.querySelector(".search-input");
            var filters = Array.prototype.slice.call(panel.querySelectorAll(".movie-filter"));
            var reset = panel.querySelector(".filter-reset");
            var empty = scope ? scope.querySelector(".empty-state") : null;

            function apply() {
                var q = input ? input.value.trim().toLowerCase() : "";
                var selected = {};
                filters.forEach(function (select) {
                    selected[select.getAttribute("data-filter")] = select.value;
                });
                var shown = 0;
                cards.forEach(function (card) {
                    var match = true;
                    if (q && card.getAttribute("data-search").indexOf(q) === -1) {
                        match = false;
                    }
                    Object.keys(selected).forEach(function (key) {
                        if (selected[key] && card.getAttribute("data-" + key) !== selected[key]) {
                            match = false;
                        }
                    });
                    card.hidden = !match;
                    if (match) {
                        shown += 1;
                    }
                });
                if (empty) {
                    empty.hidden = shown !== 0;
                }
            }

            if (input) {
                input.addEventListener("input", apply);
            }
            filters.forEach(function (select) {
                select.addEventListener("change", apply);
            });
            if (reset) {
                reset.addEventListener("click", function () {
                    if (input) {
                        input.value = "";
                    }
                    filters.forEach(function (select) {
                        select.value = "";
                    });
                    apply();
                });
            }
            apply();
        });
    }

    window.setupMoviePlayer = function (streamUrl) {
        var shell = document.querySelector(".watch-player");
        if (!shell) {
            return;
        }
        var video = shell.querySelector("video");
        var overlay = shell.querySelector(".player-overlay");
        var hls = null;
        var attached = false;

        function attach() {
            if (attached || !video || !streamUrl) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false
                });
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
            } else {
                video.src = streamUrl;
            }
        }

        function play() {
            attach();
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener("click", play);
        }
        shell.addEventListener("click", function (event) {
            if (event.target === video && video.paused) {
                play();
            }
        });
        video.addEventListener("play", function () {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
        });
        video.addEventListener("pause", function () {
            if (overlay && video.currentTime === 0) {
                overlay.classList.remove("is-hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
    });
})();
