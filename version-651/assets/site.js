(function () {
  'use strict';

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function starText(rating) {
    var full = Math.max(1, Math.min(5, Math.round(Number(rating || 0) / 2)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function setupMobileMenu() {
    var button = $('[data-menu-toggle]');
    var panel = $('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupBackTop() {
    var button = $('[data-back-top]');
    if (!button) {
      return;
    }
    function sync() {
      button.classList.toggle('is-visible', window.scrollY > 420);
    }
    window.addEventListener('scroll', sync, { passive: true });
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    sync();
  }

  function setupHeroCarousel() {
    var root = $('[data-hero-carousel]');
    if (!root) {
      return;
    }
    var slides = $all('[data-hero-slide]', root);
    var dots = $all('[data-hero-dot]', root);
    var prev = $('[data-hero-prev]', root);
    var next = $('[data-hero-next]', root);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
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
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupHorizontalScroll() {
    $all('[data-scroll-left], [data-scroll-right]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-scroll-left') || button.getAttribute('data-scroll-right');
        var row = document.getElementById(id);
        if (!row) {
          return;
        }
        var direction = button.hasAttribute('data-scroll-left') ? -1 : 1;
        row.scrollBy({ left: direction * 520, behavior: 'smooth' });
      });
    });
  }

  function setupCardFilters() {
    $all('[data-card-filter]').forEach(function (panel) {
      var input = $('[data-filter-input]', panel);
      var grid = panel.parentElement ? $('[data-card-grid]', panel.parentElement) : null;
      if (!input || !grid) {
        return;
      }
      var cards = $all('[data-search]', grid);
      input.addEventListener('input', function () {
        var query = input.value.trim().toLowerCase();
        cards.forEach(function (card) {
          var text = (card.getAttribute('data-search') || '').toLowerCase();
          card.classList.toggle('is-filtered-out', query && text.indexOf(query) === -1);
        });
      });
    });
  }

  function setupSearchForms() {
    $all('[data-site-search]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="q"]');
        if (!input || !input.value.trim()) {
          event.preventDefault();
          window.location.href = 'search.html';
        }
      });
    });
  }

  function renderSearchCard(movie) {
    var meta = [movie.region, movie.year, movie.type].filter(Boolean).map(escapeHtml).join('</span><span>');
    return [
      '<article class="movie-card" data-search="', escapeHtml(movie.search), '">',
      '<a href="', escapeHtml(movie.url), '" class="movie-card__cover" aria-label="查看 ', escapeHtml(movie.title), '">',
      '<img src="', escapeHtml(movie.cover), '" alt="', escapeHtml(movie.title), '" loading="lazy">',
      '<span class="play-dot">▶</span>',
      '</a>',
      '<div class="movie-card__body">',
      '<div class="movie-card__meta"><span>', meta, '</span></div>',
      '<h3><a href="', escapeHtml(movie.url), '">', escapeHtml(movie.title), '</a></h3>',
      '<p>', escapeHtml(movie.one_line), '</p>',
      '<div class="movie-card__footer">',
      '<span class="stars">', starText(movie.rating), '</span>',
      '<strong>', escapeHtml(movie.rating), '</strong>',
      '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function setupSearchPage() {
    var results = $('#search-results');
    var summary = $('#search-summary');
    if (!results || !summary || !window.MOVIE_SEARCH_DATA) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim().toLowerCase();
    var largeInput = $('.large-search input[name="q"]');
    if (largeInput) {
      largeInput.value = params.get('q') || '';
    }
    if (!query) {
      results.innerHTML = '';
      summary.textContent = '请输入关键词开始搜索。';
      return;
    }
    var matched = window.MOVIE_SEARCH_DATA.filter(function (movie) {
      return String(movie.search || '').toLowerCase().indexOf(query) !== -1;
    });
    summary.textContent = '关键词“' + (params.get('q') || '') + '”找到 ' + matched.length + ' 部影片。';
    results.innerHTML = matched.slice(0, 240).map(renderSearchCard).join('');
    if (matched.length > 240) {
      summary.textContent += ' 已显示前 240 条，请增加关键词继续筛选。';
    }
  }

  function getHlsConstructor() {
    if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
      return window.Hls;
    }
    if (window.LocalHls && window.LocalHls.isSupported && window.LocalHls.isSupported()) {
      return window.LocalHls;
    }
    return null;
  }

  function attachHls(video) {
    if (!video || video.dataset.hlsAttached === '1') {
      return;
    }
    var src = video.getAttribute('data-video-url');
    if (!src) {
      return;
    }
    var HlsConstructor = getHlsConstructor();
    if (HlsConstructor) {
      var hls = new HlsConstructor({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(HlsConstructor.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === HlsConstructor.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === HlsConstructor.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
      video.dataset.hlsAttached = '1';
      video._hlsInstance = hls;
      return;
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.dataset.hlsAttached = '1';
    } else {
      video.src = src;
      video.dataset.hlsAttached = '1';
    }
  }

  function setupPlayer() {
    var video = $('[data-video-player]');
    if (!video) {
      return;
    }
    var start = $('[data-player-start]');
    var play = function () {
      attachHls(video);
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
      if (start) {
        start.classList.add('is-hidden');
      }
    };
    attachHls(video);
    if (start) {
      start.addEventListener('click', play);
    }
    video.addEventListener('play', function () {
      if (start) {
        start.classList.add('is-hidden');
      }
    });
    video.addEventListener('pause', function () {
      if (start && video.currentTime < 0.5) {
        start.classList.remove('is-hidden');
      }
    });
    window.addEventListener('local-hls-ready', function () {
      if (video.dataset.hlsAttached !== '1') {
        attachHls(video);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupBackTop();
    setupHeroCarousel();
    setupHorizontalScroll();
    setupCardFilters();
    setupSearchForms();
    setupSearchPage();
    setupPlayer();
  });
}());
