/* ============================================================
   Compromiso TALANA · Consorcio Rovella – INMAC
   Lógica de la presentación (JavaScript puro, sin frameworks)
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Configuración de las diapositivas ----------
     Una entrada por lámina, en el mismo orden del HTML.
       audio -> archivo dentro de audio/  (null = lámina sin audio propio)
     El avance automático se dispara con el evento "ended" del audio:
     cada lámina dura exactamente lo que dure su MP3.
     Si un MP3 aún no existe, la lámina se muestra sin sonido y
     (en modo automático) avanza tras FALLBACK_MS.
  -------------------------------------------------------------- */

  var SLIDES = [
    { audio: "Audio01.mp3" },  // 01 Portada · inducción
    { audio: "Audio02.mp3" },  // 02 ¿Qué es TALANA?
    { audio: "Audio03.mp3" },  // 03 La cadena: marcación → valorización
    { audio: "Audio04.mp3" },  // 04 Marca ingreso y salida
    { audio: "Audio05.mp3" },  // 05 Lo que tu marcación respalda
    { audio: "Audio06.mp3" },  // 06 Caso 1 · sin marcación
    { audio: "Audio07.mp3" },  // 07 Qué puede pasar después
    { audio: "Audio08.mp3" },  // 08 Caso 2 · marcación incompleta
    { audio: "Audio09.mp3" },  // 09 Cómo se regulariza (24 h)
    { audio: "Audio10.mp3" },  // 10 Formato físico
    { audio: "Audio11.mp3" },  // 11 Renovaciones de contrato
    { audio: "Audio12.mp3" },  // 12 Boletas de pago (día 07)
    { audio: "Audio13.mp3" },  // 13 TALANA y correo personal
    { audio: "Audio14.mp3" },  // 14 Resumen de responsabilidades
    { audio: "Audio15.mp3" },  // 15 El documento y su base normativa
    { audio: "Audio16.mp3" }   // 16 Descarga, firma y entrega
  ];

  var AUDIO_DIR   = "audio/";
  var FALLBACK_MS = 9000;   // avance si la lámina no tiene audio disponible
  var SPEEDS      = [1, 1.25, 1.5, 0.75];

  /* ---------- Estado ---------- */
  var current    = 0;
  var autoplay   = true;
  var started    = false;
  var muted      = false;
  var volume     = 1;
  var speedIx    = 0;
  var fallbackT  = null;

  /* ---------- Elementos DOM ---------- */
  var sidebar    = document.getElementById("sidebar");
  var edgeReveal = document.getElementById("edgeReveal");
  var viewport   = document.getElementById("viewport");
  var canvas     = document.getElementById("canvas");
  var counterEl  = document.getElementById("counter");
  var progressEl = document.getElementById("progressBar");
  var audioTrack = document.getElementById("audioTrack");
  var audioBarEl = document.getElementById("audioBar");
  var timeEl     = document.getElementById("time");
  var modeBadge  = document.getElementById("modeBadge");
  var audioBadge = document.getElementById("audioBadge");
  var audioStat  = document.getElementById("audioStatus");
  var modeStat   = document.getElementById("modeStatus");
  var toastEl    = document.getElementById("toast");

  var slideEls = Array.prototype.slice.call(
    document.querySelectorAll("#canvas .slide")
  );

  /* ---------- Audio único reutilizado ---------- */
  var audio = new Audio();
  audio.preload = "auto";

  /* ============================================================
     Escalado del lienzo fijo 1600x900 al tamaño del viewport
     ============================================================ */
  function fitCanvas() {
    var r = viewport.getBoundingClientRect();
    canvas.style.transform = "scale(" + (r.width / 1600) + ")";
  }
  window.addEventListener("resize", fitCanvas);
  document.addEventListener("fullscreenchange", function () {
    setTimeout(fitCanvas, 60);
  });

  /* ============================================================
     Render / navegación
     ============================================================ */
  function render() {
    slideEls.forEach(function (el, i) {
      el.classList.toggle("active", i === current);
      var num = el.querySelector(".s-foot .num");
      if (num) {
        num.textContent = pad(i + 1) + " / " + pad(SLIDES.length);
      }
    });
    counterEl.textContent = (current + 1) + " / " + SLIDES.length;
    progressEl.style.width = ((current + 1) / SLIDES.length * 100) + "%";
    resetAudioBar();
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function playAudioForCurrent() {
    var s = SLIDES[current];
    stopAudio();

    if (!s.audio) { armFallback(); return; }

    audio.src = AUDIO_DIR + s.audio;
    audio.currentTime = 0;
    audio.volume = volume;
    audio.muted = muted;
    audio.playbackRate = SPEEDS[speedIx];

    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () {
        // MP3 ausente o autoplay bloqueado: no se corta la secuencia.
        setAudioBadge(false);
        armFallback();
      });
    }
    setAudioBadge(true);
  }

  function stopAudio() {
    clearFallback();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setAudioBadge(false);
    resetAudioBar();
  }

  /* Avance de respaldo cuando la lámina no tiene audio reproducible. */
  function armFallback() {
    clearFallback();
    if (!started || !autoplay) return;
    fallbackT = setTimeout(function () {
      if (current < SLIDES.length - 1) goTo(current + 1, true);
    }, FALLBACK_MS);
  }
  function clearFallback() {
    if (fallbackT) { clearTimeout(fallbackT); fallbackT = null; }
  }

  function goTo(index, autoStartAudio) {
    if (index < 0) index = 0;
    if (index >= SLIDES.length) index = SLIDES.length - 1;

    current = index;
    render();

    if (started && autoStartAudio) {
      playAudioForCurrent();
    } else {
      stopAudio();
    }
  }

  /* ============================================================
     Eventos del audio
     ============================================================ */
  audio.addEventListener("timeupdate", function () {
    if (!audio.duration || !isFinite(audio.duration)) return;
    audioBarEl.style.width = (audio.currentTime / audio.duration * 100) + "%";
    timeEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
  });

  audio.addEventListener("error", function () {
    if (!audio.src) return;
    setAudioBadge(false);
    toast("Falta el audio de esta lámina (" + (SLIDES[current].audio || "-") + ")");
    armFallback();
  });

  audio.addEventListener("ended", function () {
    setAudioBadge(false);
    if (!autoplay) return;                       // modo manual: espera al usuario
    if (current < SLIDES.length - 1) goTo(current + 1, true);
  });

  // Clic en la barra de audio: salto dentro de la narración.
  audioTrack.addEventListener("click", function (e) {
    if (!audio.duration || !isFinite(audio.duration)) return;
    var r = audioTrack.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }
  function resetAudioBar() {
    audioBarEl.style.width = "0%";
    timeEl.textContent = "0:00 / 0:00";
  }

  /* ---------- Aviso emergente ---------- */
  var toastT = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2600);
  }

  /* ============================================================
     Auto-ocultar barra lateral durante reproducción automática
     ============================================================ */
  var hoverNearEdge = false;
  var hideTimer = null;

  function refreshSidebar() {
    sidebar.classList.toggle("hidden", autoplay && started && !hoverNearEdge);
  }
  function revealSidebar() {
    hoverNearEdge = true;
    refreshSidebar();
    clearTimeout(hideTimer);
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      hoverNearEdge = false;
      refreshSidebar();
    }, 800);
  }

  edgeReveal.addEventListener("mouseenter", revealSidebar);
  sidebar.addEventListener("mouseenter", revealSidebar);
  sidebar.addEventListener("mouseleave", scheduleHide);
  edgeReveal.addEventListener("mouseleave", scheduleHide);

  /* ============================================================
     Indicadores de estado
     ============================================================ */
  function setAudioBadge(playing) {
    audioBadge.classList.toggle("playing", playing);
    audioStat.textContent = playing ? "Reproduciendo" : "Pausado";
    var btn = document.getElementById("btnPlay");
    if (btn) {
      btn.innerHTML = playing ? ICON.pause : ICON.play;
      btn.title = playing ? "Pausar" : "Reproducir";
    }
  }
  function setModeBadge() {
    modeBadge.classList.toggle("auto", autoplay);
    modeStat.textContent = autoplay ? "Automático" : "Manual";
  }

  /* ============================================================
     Controles
     ============================================================ */
  function play() {
    started = true;
    refreshSidebar();
    if (audio.src && audio.paused && audio.currentTime > 0) {
      audio.play();
      setAudioBadge(true);
    } else {
      playAudioForCurrent();
    }
  }

  function pause() {
    clearFallback();
    audio.pause();
    setAudioBadge(false);
  }

  function togglePlay() {
    var isPlaying = !audio.paused && audio.currentTime > 0;
    if (isPlaying) { pause(); } else { play(); }
  }

  function stop() {
    started = false;
    goTo(0, false);
    setAudioBadge(false);
    refreshSidebar();
  }

  function restartAudio() {
    if (!started) return;
    playAudioForCurrent();
  }

  function next() { goTo(current + 1, started); }
  function prev() { goTo(current - 1, started); }

  function toggleMute() {
    muted = !muted;
    audio.muted = muted;
    document.getElementById("btnMute").classList.toggle("on", muted);
    setIcon("btnMute", muted ? ICON.muted : ICON.sound);
  }

  function setVolume(v) {
    volume = v;
    audio.volume = v;
  }

  function cycleSpeed() {
    speedIx = (speedIx + 1) % SPEEDS.length;
    audio.playbackRate = SPEEDS[speedIx];
    var b = document.getElementById("btnSpeed");
    b.innerHTML = '<span style="font-size:13px;font-weight:800">' +
                  SPEEDS[speedIx] + "x</span>";
    b.classList.toggle("on", SPEEDS[speedIx] !== 1);
  }

  function toggleAutoplay() {
    autoplay = !autoplay;
    document.getElementById("btnAuto").classList.toggle("on", autoplay);
    setModeBadge();
    refreshSidebar();
    if (!autoplay) clearFallback();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen();
    }
  }

  /* ---------- Íconos SVG ---------- */
  var ICON = {
    sound: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4zM14 3.2v2.1a7 7 0 010 13.4v2.1a9 9 0 000-17.6z"/></svg>',
    muted: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm18.6.4l-1.4-1.4L17.8 10l-2.4-2.4-1.4 1.4L16.4 11l-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4L19.2 11l2.4-1.6z"/></svg>',
    play:  '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'
  };
  function setIcon(id, svg) { document.getElementById(id).innerHTML = svg; }

  /* ============================================================
     Enlazar botones
     ============================================================ */
  document.getElementById("btnPlay").addEventListener("click", togglePlay);
  document.getElementById("btnStop").addEventListener("click", stop);
  document.getElementById("btnRestart").addEventListener("click", restartAudio);
  document.getElementById("btnPrev").addEventListener("click", prev);
  document.getElementById("btnNext").addEventListener("click", next);
  document.getElementById("btnMute").addEventListener("click", toggleMute);
  document.getElementById("btnSpeed").addEventListener("click", cycleSpeed);
  document.getElementById("btnAuto").addEventListener("click", toggleAutoplay);
  document.getElementById("btnFull").addEventListener("click", toggleFullscreen);
  document.getElementById("volume").addEventListener("input", function (e) {
    setVolume(parseFloat(e.target.value));
  });

  // Atajos de teclado
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case " ":          e.preventDefault(); togglePlay(); break;
      case "ArrowRight": next(); break;
      case "ArrowLeft":  prev(); break;
      case "f": case "F": toggleFullscreen(); break;
      case "m": case "M": toggleMute(); break;
      case "a": case "A": toggleAutoplay(); break;
    }
  });

  /* ============================================================
     Arranque
     ============================================================ */
  function init() {
    fitCanvas();
    render();
    setModeBadge();
    setAudioBadge(false);
    document.getElementById("btnAuto").classList.toggle("on", autoplay);
    setVolume(1);
    // No se reproduce audio: se espera a que el usuario presione Reproducir.
  }

  init();
})();
