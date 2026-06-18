import { H as Hls } from "./hls-dru42stk.js";

const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, "");

function setupHeader() {
  const header = document.querySelector("[data-site-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-site-nav]");

  const updateHeader = () => {
    if (!header) {
      return;
    }
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("is-open");
    });
  }
}

function setupHeroSlider() {
  const slider = document.querySelector("[data-hero-slider]");
  if (!slider) {
    return;
  }

  const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"));
  if (slides.length <= 1) {
    return;
  }

  let activeIndex = 0;
  let timer = null;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === activeIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === activeIndex);
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => showSlide(activeIndex + 1), 5200);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      start();
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  showSlide(0);
  start();
}

function setupFilters() {
  const panels = Array.from(document.querySelectorAll("[data-filter-panel]"));
  panels.forEach((panel) => {
    const input = panel.querySelector("[data-filter-input]");
    const select = panel.querySelector("[data-filter-type]");
    const clear = panel.querySelector("[data-filter-clear]");
    const count = panel.querySelector("[data-filter-count]");
    const cards = Array.from(document.querySelectorAll("[data-card]"));

    if (!cards.length) {
      return;
    }

    const apply = () => {
      const keyword = normalize(input ? input.value : "");
      const type = normalize(select ? select.value : "");
      let visible = 0;

      cards.forEach((card) => {
        const haystack = normalize(card.dataset.index || card.textContent);
        const cardType = normalize(card.dataset.type || "");
        const matchesKeyword = !keyword || haystack.includes(keyword);
        const matchesType = !type || cardType.includes(type);
        const shouldShow = matchesKeyword && matchesType;
        card.classList.toggle("is-hidden", !shouldShow);
        if (shouldShow) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = `当前显示 ${visible} / ${cards.length} 部影片`;
      }
    };

    if (input) {
      input.addEventListener("input", apply);
    }
    if (select) {
      select.addEventListener("change", apply);
    }
    if (clear) {
      clear.addEventListener("click", () => {
        if (input) {
          input.value = "";
        }
        if (select) {
          select.value = "";
        }
        apply();
      });
    }

    apply();
  });
}

function setupPlayers() {
  const players = Array.from(document.querySelectorAll("[data-player]"));
  players.forEach((player) => {
    const video = player.querySelector("video");
    const button = player.querySelector("[data-play-button]");
    const status = player.querySelector("[data-player-status]");
    const source = player.dataset.source;
    let hls = null;
    let loaded = false;

    if (!video || !button || !source) {
      return;
    }

    const setStatus = (message) => {
      if (status) {
        status.textContent = message;
      }
    };

    const load = () => {
      if (loaded) {
        return;
      }
      loaded = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        setStatus("正在使用浏览器原生 HLS 播放。");
        return;
      }

      if (Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 60
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data && data.fatal) {
            setStatus("播放源暂时无法加载，请稍后重试或更换播放线路。");
          }
        });
        setStatus("HLS 播放器已初始化，正在加载播放源。");
        return;
      }

      setStatus("当前浏览器不支持 HLS 播放。");
    };

    button.addEventListener("click", async () => {
      load();
      button.classList.add("is-hidden");
      video.controls = true;
      try {
        await video.play();
      } catch (error) {
        setStatus("已加载播放源，请再次点击视频播放按钮。");
      }
    });

    video.addEventListener("play", () => button.classList.add("is-hidden"));
    video.addEventListener("pause", () => {
      if (video.currentTime === 0 || video.ended) {
        button.classList.remove("is-hidden");
      }
    });

    window.addEventListener("beforeunload", () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
}

ready(() => {
  setupHeader();
  setupHeroSlider();
  setupFilters();
  setupPlayers();
});
