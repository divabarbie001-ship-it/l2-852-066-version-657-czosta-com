(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return (value || "").toString().toLowerCase().trim();
    }

    function setupMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("open");
        });
    }

    function setupHero() {
        var slider = document.querySelector("[data-hero-slider]");
        if (!slider) {
            return;
        }
        var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
        var prev = slider.querySelector("[data-hero-prev]");
        var next = slider.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, position) {
                slide.classList.toggle("active", position === index);
            });
            dots.forEach(function (dot, position) {
                dot.classList.toggle("active", position === index);
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
        dots.forEach(function (dot, position) {
            dot.addEventListener("click", function () {
                show(position);
                start();
            });
        });
        slider.addEventListener("mouseenter", stop);
        slider.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function setupFilters() {
        var groups = Array.prototype.slice.call(document.querySelectorAll("[data-filter-group]"));
        groups.forEach(function (group) {
            var input = group.querySelector("[data-search-input]");
            var buttons = Array.prototype.slice.call(group.querySelectorAll("[data-filter-button]"));
            var cards = Array.prototype.slice.call(group.querySelectorAll(".filter-card"));
            var empty = group.querySelector("[data-empty]");
            var activeFilter = "all";

            function apply() {
                var query = normalize(input ? input.value : "");
                var visible = 0;
                cards.forEach(function (card) {
                    var text = normalize([
                        card.getAttribute("data-title"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-genre"),
                        card.getAttribute("data-type"),
                        card.getAttribute("data-tags")
                    ].join(" "));
                    var type = normalize(card.getAttribute("data-type"));
                    var genre = normalize(card.getAttribute("data-genre"));
                    var matchesQuery = !query || text.indexOf(query) !== -1;
                    var matchesFilter = activeFilter === "all" || type.indexOf(activeFilter) !== -1 || genre.indexOf(activeFilter) !== -1 || text.indexOf(activeFilter) !== -1;
                    var shouldShow = matchesQuery && matchesFilter;
                    card.style.display = shouldShow ? "" : "none";
                    if (shouldShow) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("show", visible === 0);
                }
            }

            if (input) {
                input.addEventListener("input", apply);
            }
            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    activeFilter = normalize(button.getAttribute("data-filter-button") || "all");
                    buttons.forEach(function (item) {
                        item.classList.toggle("active", item === button);
                    });
                    apply();
                });
            });
            apply();
        });
    }

    function setupSearchPage() {
        var page = document.querySelector("[data-search-page]");
        if (!page) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        var input = page.querySelector("[data-search-input]");
        var title = page.querySelector("[data-search-title]");
        if (input && query) {
            input.value = query;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (title && query) {
            title.textContent = "搜索：" + query;
        }
    }

    window.initMoviePlayer = function (sourceUrl) {
        var video = document.querySelector("[data-movie-video]");
        var overlay = document.querySelector("[data-play-overlay]");
        var trigger = document.querySelector("[data-play-trigger]");
        var message = document.querySelector("[data-player-message]");
        var hls = null;
        var attached = false;

        if (!video || !sourceUrl) {
            return;
        }

        function showMessage(text) {
            if (message) {
                message.textContent = text;
                message.classList.add("show");
            }
        }

        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = sourceUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(sourceUrl);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        showMessage("播放暂时不可用，请稍后再试");
                        if (hls) {
                            hls.destroy();
                            hls = null;
                        }
                    }
                });
            } else {
                video.src = sourceUrl;
            }
        }

        function play() {
            attach();
            if (overlay) {
                overlay.classList.add("hidden");
            }
            video.controls = true;
            var result = video.play();
            if (result && typeof result.catch === "function") {
                result.catch(function () {
                    showMessage("请再次点击播放");
                    if (overlay) {
                        overlay.classList.remove("hidden");
                    }
                });
            }
        }

        function toggleVideo() {
            if (video.paused) {
                play();
            } else {
                video.pause();
            }
        }

        if (overlay) {
            overlay.addEventListener("click", play);
        }
        if (trigger) {
            trigger.addEventListener("click", function (event) {
                event.stopPropagation();
                play();
            });
        }
        video.addEventListener("click", toggleVideo);
        video.addEventListener("play", function () {
            if (overlay) {
                overlay.classList.add("hidden");
            }
        });
        video.addEventListener("pause", function () {
            if (video.currentTime === 0 && overlay) {
                overlay.classList.remove("hidden");
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
        setupSearchPage();
    });
})();
