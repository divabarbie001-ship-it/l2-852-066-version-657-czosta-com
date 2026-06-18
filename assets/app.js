(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupNavigation() {
        var toggle = document.querySelector("[data-nav-toggle]");
        var menu = document.querySelector("[data-mobile-nav]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

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
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function setupFilters() {
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
        var search = document.querySelector("[data-filter-search]");
        var type = document.querySelector("[data-filter-type]");
        var region = document.querySelector("[data-filter-region]");
        var counter = document.querySelector("[data-result-count]");
        if (!cards.length || (!search && !type && !region)) {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q");
        if (initial && search) {
            search.value = initial;
        }

        function normal(value) {
            return String(value || "").toLowerCase().trim();
        }

        function cardText(card) {
            return [
                card.getAttribute("data-title"),
                card.getAttribute("data-region"),
                card.getAttribute("data-type"),
                card.getAttribute("data-year"),
                card.getAttribute("data-genre"),
                card.getAttribute("data-tags")
            ].join(" ").toLowerCase();
        }

        function apply() {
            var query = normal(search && search.value);
            var selectedType = normal(type && type.value);
            var selectedRegion = normal(region && region.value);
            var visible = 0;

            cards.forEach(function (card) {
                var text = cardText(card);
                var typeValue = normal(card.getAttribute("data-type"));
                var regionValue = normal(card.getAttribute("data-region"));
                var ok = true;

                if (query && text.indexOf(query) === -1) {
                    ok = false;
                }
                if (selectedType && typeValue.indexOf(selectedType) === -1 && text.indexOf(selectedType) === -1) {
                    ok = false;
                }
                if (selectedRegion && regionValue.indexOf(selectedRegion) === -1 && text.indexOf(selectedRegion) === -1) {
                    ok = false;
                }

                card.hidden = !ok;
                if (ok) {
                    visible += 1;
                }
            });

            if (counter) {
                counter.textContent = visible + " 部作品";
            }
        }

        [search, type, region].forEach(function (control) {
            if (control) {
                control.addEventListener("input", apply);
                control.addEventListener("change", apply);
            }
        });
        apply();
    }

    function loadHls(callback) {
        if (window.Hls) {
            callback();
            return;
        }
        var existing = document.querySelector("script[data-hls-loader]");
        if (existing) {
            existing.addEventListener("load", callback, { once: true });
            return;
        }
        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1";
        script.setAttribute("data-hls-loader", "1");
        script.onload = callback;
        document.head.appendChild(script);
    }

    window.initPlayer = function (config) {
        ready(function () {
            var video = document.getElementById(config.videoId);
            var trigger = document.getElementById(config.triggerId);
            var source = config.source;
            var hlsInstance;
            var attached = false;

            if (!video || !trigger || !source) {
                return;
            }

            function begin() {
                trigger.classList.add("is-hidden");
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {});
                }
            }

            function attach() {
                if (attached) {
                    begin();
                    return;
                }
                attached = true;

                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                    begin();
                    return;
                }

                loadHls(function () {
                    if (window.Hls && window.Hls.isSupported()) {
                        hlsInstance = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: true
                        });
                        hlsInstance.loadSource(source);
                        hlsInstance.attachMedia(video);
                        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, begin);
                    } else {
                        video.src = source;
                        begin();
                    }
                });
            }

            trigger.addEventListener("click", attach);
            video.addEventListener("click", function () {
                if (!attached) {
                    attach();
                }
            });
            window.addEventListener("beforeunload", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    };

    ready(function () {
        setupNavigation();
        setupHero();
        setupFilters();
    });
})();
