(function () {
    var toggle = document.querySelector('.mobile-toggle');
    var mobileNav = document.querySelector('.mobile-nav');

    if (toggle && mobileNav) {
        toggle.addEventListener('click', function () {
            var isOpen = mobileNav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var prev = document.querySelector('.hero-control.prev');
    var next = document.querySelector('.hero-control.next');
    var current = 0;
    var timer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.classList.toggle('active', i === current);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === current);
        });
    }

    function startCarousel() {
        if (slides.length < 2) {
            return;
        }
        timer = window.setInterval(function () {
            showSlide(current + 1);
        }, 5000);
    }

    function resetCarousel() {
        if (timer) {
            window.clearInterval(timer);
        }
        startCarousel();
    }

    if (next) {
        next.addEventListener('click', function () {
            showSlide(current + 1);
            resetCarousel();
        });
    }

    if (prev) {
        prev.addEventListener('click', function () {
            showSlide(current - 1);
            resetCarousel();
        });
    }

    dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            showSlide(Number(dot.getAttribute('data-slide')) || 0);
            resetCarousel();
        });
    });

    startCarousel();

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function filterCards() {
        var q = normalize((document.querySelector('.js-search') || {}).value);
        var region = normalize((document.querySelector('.js-filter-region') || {}).value);
        var type = normalize((document.querySelector('.js-filter-type') || {}).value);
        var year = normalize((document.querySelector('.js-filter-year') || {}).value);
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-title]'));

        cards.forEach(function (card) {
            var haystack = normalize([
                card.getAttribute('data-title'),
                card.getAttribute('data-tags'),
                card.getAttribute('data-region'),
                card.getAttribute('data-type'),
                card.getAttribute('data-year'),
                card.textContent
            ].join(' '));
            var ok = true;

            if (q && haystack.indexOf(q) === -1) {
                ok = false;
            }
            if (region && normalize(card.getAttribute('data-region')).indexOf(region) === -1) {
                ok = false;
            }
            if (type && normalize(card.getAttribute('data-type')).indexOf(type) === -1) {
                ok = false;
            }
            if (year && normalize(card.getAttribute('data-year')) !== year) {
                ok = false;
            }

            card.style.display = ok ? '' : 'none';
        });
    }

    Array.prototype.slice.call(document.querySelectorAll('.js-search, .js-filter-region, .js-filter-type, .js-filter-year')).forEach(function (field) {
        field.addEventListener('input', filterCards);
        field.addEventListener('change', filterCards);
    });

    Array.prototype.slice.call(document.querySelectorAll('.player-shell')).forEach(function (shell) {
        var video = shell.querySelector('video');
        var overlay = shell.querySelector('.player-overlay');
        var stream = shell.getAttribute('data-stream');
        var prepared = false;
        var hls = null;

        function prepare() {
            if (prepared || !video || !stream) {
                return;
            }
            prepared = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
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
        }

        function play() {
            prepare();
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
            var started = video.play();
            if (started && typeof started.catch === 'function') {
                started.catch(function () {
                    if (overlay) {
                        overlay.classList.remove('is-hidden');
                    }
                });
            }
        }

        if (overlay && video) {
            overlay.addEventListener('click', play);
        }

        if (video) {
            video.addEventListener('play', function () {
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
            });
            video.addEventListener('pause', function () {
                if (overlay && video.currentTime === 0) {
                    overlay.classList.remove('is-hidden');
                }
            });
            video.addEventListener('emptied', function () {
                if (hls) {
                    hls.destroy();
                    hls = null;
                    prepared = false;
                }
            });
        }
    });
})();
