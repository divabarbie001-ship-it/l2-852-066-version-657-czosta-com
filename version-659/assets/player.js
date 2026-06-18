(function () {
  window.initMoviePlayer = function (videoId, overlayId, playbackUrl) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    if (!video || !playbackUrl) {
      return;
    }
    var attached = false;
    var hls = null;

    function attach() {
      if (attached) {
        return Promise.resolve();
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playbackUrl;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        return new Promise(function (resolve) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(playbackUrl);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            resolve();
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            }
          });
        });
      }
      video.src = playbackUrl;
      return Promise.resolve();
    }

    function start() {
      attach().then(function () {
        video.controls = true;
        if (overlay) {
          overlay.classList.add("is-hidden");
        }
        var action = video.play();
        if (action && action.catch) {
          action.catch(function () {});
        }
      });
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
  };
})();
