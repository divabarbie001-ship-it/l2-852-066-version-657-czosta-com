(function () {
    var header = document.querySelector('[data-site-header]');
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');

    function onScroll() {
        if (!header) {
            return;
        }
        if (window.scrollY > 18) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && panel) {
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-hero-carousel]').forEach(function (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var prev = carousel.querySelector('[data-hero-prev]');
        var next = carousel.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(target) {
            if (!slides.length) {
                return;
            }
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                restart();
            });
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                restart();
            });
        });

        show(0);
        restart();
    });

    document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
        var scope = document.querySelector(panel.getAttribute('data-filter-panel')) || document;
        var input = panel.querySelector('[data-filter-input]');
        var region = panel.querySelector('[data-filter-region]');
        var type = panel.querySelector('[data-filter-type]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-title]'));
        var empty = scope.querySelector('[data-empty-state]');

        function includes(value, query) {
            return String(value || '').toLowerCase().indexOf(String(query || '').toLowerCase()) !== -1;
        }

        function apply() {
            var q = input ? input.value.trim() : '';
            var r = region ? region.value : '';
            var t = type ? type.value : '';
            var visible = 0;

            cards.forEach(function (card) {
                var hay = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-type')
                ].join(' ');
                var ok = true;

                if (q && !includes(hay, q)) {
                    ok = false;
                }
                if (r && card.getAttribute('data-region') !== r) {
                    ok = false;
                }
                if (t && card.getAttribute('data-type') !== t) {
                    ok = false;
                }

                card.style.display = ok ? '' : 'none';
                if (ok) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        }

        [input, region, type].forEach(function (node) {
            if (node) {
                node.addEventListener('input', apply);
                node.addEventListener('change', apply);
            }
        });

        var params = new URLSearchParams(window.location.search);
        if (input && params.get('q')) {
            input.value = params.get('q');
        }
        apply();
    });

    document.querySelectorAll('[data-search-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var input = form.querySelector('input[name="q"]');
            var q = input ? input.value.trim() : '';
            window.location.href = q ? 'search.html?q=' + encodeURIComponent(q) : 'search.html';
        });
    });
})();

function initMoviePlayer(videoId, coverId, buttonId, streamUrl) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    var button = document.getElementById(buttonId);
    var attached = false;
    var hls = null;

    if (!video || !streamUrl) {
        return;
    }

    function attach() {
        if (attached) {
            return;
        }
        attached = true;
        video.controls = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hls = new Hls({ enableWorker: true });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
        } else {
            video.src = streamUrl;
        }
    }

    function start() {
        attach();
        if (cover) {
            cover.classList.add('is-hidden');
        }
        var playTask = video.play();
        if (playTask && typeof playTask.catch === 'function') {
            playTask.catch(function () {});
        }
    }

    if (cover) {
        cover.addEventListener('click', start);
    }
    if (button) {
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            start();
        });
    }
    video.addEventListener('click', function () {
        if (video.paused) {
            start();
        }
    });
    window.addEventListener('beforeunload', function () {
        if (hls) {
            hls.destroy();
        }
    });
}
