(function () {
  const mobileButton = document.querySelector('[data-mobile-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (mobileButton && mobileMenu) {
    mobileButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero-slider]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    const dotsWrap = hero.querySelector('[data-hero-dots]');
    let activeIndex = 0;
    let timer = null;

    function renderDots() {
      if (!dotsWrap) {
        return;
      }

      dotsWrap.innerHTML = '';
      slides.forEach(function (_, index) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', '切换焦点影片');
        dot.addEventListener('click', function () {
          showSlide(index);
          restartTimer();
        });
        dotsWrap.appendChild(dot);
      });
    }

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });

      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach(function (dot, dotIndex) {
          dot.classList.toggle('is-active', dotIndex === activeIndex);
        });
      }
    }

    function restartTimer() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 5200);
    }

    renderDots();
    showSlide(0);
    restartTimer();

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(activeIndex - 1);
        restartTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(activeIndex + 1);
        restartTimer();
      });
    }
  }

  const searchIndex = window.siteSearchIndex || [];
  const searchBoxes = Array.from(document.querySelectorAll('[data-search-box]'));

  searchBoxes.forEach(function (box) {
    const input = box.querySelector('[data-search-input]');
    const panel = box.querySelector('[data-search-results]');

    if (!input || !panel) {
      return;
    }

    function closePanel() {
      panel.classList.remove('is-open');
    }

    function openPanel() {
      panel.classList.add('is-open');
    }

    input.addEventListener('input', function () {
      const query = input.value.trim().toLowerCase();

      if (!query) {
        panel.innerHTML = '';
        closePanel();
        return;
      }

      const result = searchIndex.filter(function (item) {
        return [item.title, item.region, item.type, item.year, item.genre, item.tags, item.category]
          .join(' ')
          .toLowerCase()
          .includes(query);
      }).slice(0, 10);

      if (!result.length) {
        panel.innerHTML = '<div class="search-result-item"><span></span><div><strong>暂无匹配影片</strong><span>换个关键词继续搜索</span></div></div>';
        openPanel();
        return;
      }

      panel.innerHTML = result.map(function (item) {
        return '<a class="search-result-item" href="' + item.url + '">' +
          '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '">' +
          '<div><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.region + ' · ' + item.year + ' · ' + item.category) + '</span></div>' +
          '</a>';
      }).join('');
      openPanel();
    });

    document.addEventListener('click', function (event) {
      if (!box.contains(event.target)) {
        closePanel();
      }
    });
  });

  const filterBlocks = Array.from(document.querySelectorAll('[data-catalog-filter]'));

  filterBlocks.forEach(function (panel) {
    const list = panel.parentElement.querySelector('[data-filter-list]');
    const empty = panel.parentElement.querySelector('[data-filter-empty]');
    const textInput = panel.querySelector('[data-filter-text]');
    const regionSelect = panel.querySelector('[data-filter-region]');
    const yearSelect = panel.querySelector('[data-filter-year]');
    const typeSelect = panel.querySelector('[data-filter-type]');

    if (!list) {
      return;
    }

    const cards = Array.from(list.querySelectorAll('.movie-card'));

    function applyFilter() {
      const text = (textInput ? textInput.value.trim().toLowerCase() : '');
      const region = regionSelect ? regionSelect.value : '';
      const year = yearSelect ? yearSelect.value : '';
      const type = typeSelect ? typeSelect.value : '';
      let visible = 0;

      cards.forEach(function (card) {
        const haystack = [
          card.dataset.title,
          card.dataset.genre,
          card.dataset.tags,
          card.dataset.region,
          card.dataset.year,
          card.dataset.type
        ].join(' ').toLowerCase();
        const matchedText = !text || haystack.includes(text);
        const matchedRegion = !region || card.dataset.region === region;
        const matchedYear = !year || card.dataset.year === year;
        const matchedType = !type || card.dataset.type === type;
        const shouldShow = matchedText && matchedRegion && matchedYear && matchedType;

        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [textInput, regionSelect, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
  });
})();

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initMoviePlayer(videoId, sourceUrl) {
  const video = document.getElementById(videoId);

  if (!video || !sourceUrl) {
    return;
  }

  const shell = video.closest('.player-shell');
  const overlay = shell ? shell.querySelector('.player-overlay') : null;
  let ready = false;
  let hls = null;

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
  }

  function showOverlay() {
    if (overlay && video.paused && !video.ended) {
      overlay.classList.remove('is-hidden');
    }
  }

  function playVideo() {
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        showOverlay();
      });
    }
  }

  function prepare() {
    if (ready) {
      return;
    }

    ready = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        playVideo();
      });
      hls.on(window.Hls.Events.ERROR, function (_, data) {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        }
      });
      return;
    }

    video.src = sourceUrl;
  }

  function start() {
    hideOverlay();
    prepare();
    playVideo();
  }

  if (overlay) {
    overlay.addEventListener('click', start);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      start();
    }
  });

  video.addEventListener('play', hideOverlay);
  video.addEventListener('pause', showOverlay);
  video.addEventListener('ended', showOverlay);

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}
