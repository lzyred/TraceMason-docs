/* TraceMason homepage cinematic scene.
 * Original Canvas 2D procedural graphics: starfield, evidence signal core,
 * tracing beams and perspective wireframe landscape.
 * No network calls, WebGL, third-party assets or runtime dependencies.
 */
(function () {
  "use strict";

  var sceneInstance = null;
  var isListening = false;

  function createScene(section, canvas) {
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return { dispose: function () {} };

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var button = section.querySelector("#tm-motion-toggle");
    var label = button && button.querySelector(".tm-motion-label");
    var symbol = button && button.querySelector(".tm-motion-icon");
    var paused = false;
    var visible = true;
    var disposed = false;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var rafId = 0;
    var lastFrame = 0;
    var stars = [];
    var dots = [];
    var resizeObserver = null;
    var visibilityObserver = null;
    var pointer = { x: 0, y: 0 };

    // Seeded noise keeps decorative stars stable through normal redraws.
    function randFactory(seed) {
      return function () {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        var v = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
        return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
      };
    }

    function configureStars() {
      var random = randFactory(31207);
      var count = Math.max(65, Math.min(235, Math.round(width * height / 6400)));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: random(), y: random() * 0.93,
          radius: 0.42 + random() * (random() > 0.92 ? 1.5 : .9),
          alpha: 0.28 + random() * .65, phase: random() * 6.283,
          cyan: random() > .36
        });
      }
      dots = [];
      for (var j = 0; j < 30; j++) {
        dots.push({
          orbit: .45 + random() * .92,
          phase: random() * Math.PI * 2,
          speed: .16 + random() * .41,
          alpha: .25 + random() * .6,
          size: .8 + random() * 1.3
        });
      }
    }

    function size() {
      if (disposed) return;
      var box = section.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var newWidth = Math.round(box.width);
      var newHeight = Math.round(box.height);
      if (newWidth === width && newHeight === height) return;
      width = newWidth;
      height = newHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      // Avoid giant backing stores on ultra-wide screens.
      var cap = Math.min(1, 2400 / Math.max(width, height));
      dpr *= cap;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      configureStars();
      render(reducedMotion.matches ? 0 : performance.now() / 1000);
    }

    function glow(x, y, radius, rgb, strength) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, "rgba(" + rgb + "," + strength + ")");
      g.addColorStop(.36, "rgba(" + rgb + "," + (strength * .32) + ")");
      g.addColorStop(1, "rgba(" + rgb + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawStars(t) {
      ctx.save();
      stars.forEach(function (star, i) {
        var twinkle = reducedMotion.matches ? 1 : .78 + Math.sin(t * (0.54 + i % 4 * .15) + star.phase) * .22;
        var px = star.x * width + pointer.x * ((i % 3) + 1) * 3.5;
        var py = star.y * height + pointer.y * ((i % 4) + 1) * 1.8;
        ctx.fillStyle = star.cyan
          ? "rgba(65,226,247," + (star.alpha * twinkle) + ")"
          : "rgba(238,249,255," + (star.alpha * twinkle) + ")";
        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function terrainPoint(u, depth, t) {
      // The center is a valley; ridges rise towards both sides.
      // Depth 0 is far horizon, depth 1 is near foreground.
      var widen = .40 + depth * 1.08;
      var x = width * (.5 + u * .38 * widen);
      var outer = Math.max(0, Math.abs(u) - .27);
      var mountain = Math.pow(outer, 1.54) *
        (u > 0 ? .49 : .32);
      var localWave = (Math.sin(u * 12.5 + depth * 5.5 + t * .15) +
        Math.sin(u * 22.7 - depth * 8.1 - t * .10) * .46) * .022;
      var low = Math.cos(u * 4.3 + depth * 3.1) * .016;
      var elevation = mountain + localWave + low;
      var y = height * (.78 + depth * .39 - elevation * (.76 - .19 * depth));
      return { x: x, y: y };
    }

    function drawTerrain(t) {
      var lines = width < 650 ? 25 : width < 1100 ? 36 : 51;
      var rows = width < 650 ? 12 : 19;
      var umin = -1.58, umax = 1.58;
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // Distance lines have stronger foreground glow.
      for (var r = 0; r <= rows; r++) {
        var d = r / rows;
        ctx.beginPath();
        for (var c = 0; c <= lines; c++) {
          var u = umin + (umax - umin) * c / lines;
          var p = terrainPoint(u, d, t);
          if (c === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.lineWidth = .55 + d * .52;
        ctx.strokeStyle = "rgba(26,226,216," + (.16 + d * .44) + ")";
        ctx.stroke();
      }
      for (var col = 0; col <= lines; col++) {
        var ucol = umin + (umax - umin) * col / lines;
        ctx.beginPath();
        for (var row = 0; row <= rows; row++) {
          var depth = row / rows;
          var pt = terrainPoint(ucol, depth, t);
          if (row === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = "rgba(28,216,217," +
          (.15 + Math.max(0, 1 - Math.abs(ucol) / 1.8) * .17) + ")";
        ctx.lineWidth = .65;
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBeam(from, to, t, index) {
      var shimmer = .65 + .35 * Math.sin(t * .83 + index * 1.7);
      var gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, "rgba(37,113,214,.18)");
      gradient.addColorStop(.6, "rgba(45,156,241,.37)");
      gradient.addColorStop(1, "rgba(56,218,246," + (.37 + shimmer * .21) + ")");

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = width < 650 ? 1.15 : 1.7;
      ctx.stroke();

      // Signal travels from observed evidence towards the verified core.
      for (var k = 0; k < 2; k++) {
        var progress = reducedMotion.matches
          ? .36 + k * .28
          : ((t * (.12 + index * .013) + k * .47 + index * .19) % 1);
        var px = from.x + (to.x - from.x) * progress;
        var py = from.y + (to.y - from.y) * progress;
        glow(px, py, width < 700 ? 13 : 23, "55,222,250", .12 + shimmer * .15);
        ctx.beginPath();
        ctx.arc(px, py, 1.3 + progress * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(131,247,255," + (.6 + .32 * shimmer) + ")";
        ctx.fill();
      }
    }

    function drawNetwork(t, core) {
      var targets = [
        { x: -width * .03, y: height * .78 },
        { x: width * .21, y: height * .92 },
        { x: width * .47, y: height * .82 },
        { x: width * .66, y: height * .86 },
        { x: width * .91, y: height * .76 },
        { x: width * 1.04, y: height * .59 }
      ];
      ctx.save();
      targets.forEach(function (from, index) {
        drawBeam(from, core, t, index);
        if (index > 0 && index < 5) {
          glow(from.x, from.y, 19, "25,220,222", .14);
          ctx.beginPath();
          ctx.arc(from.x, from.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(122,246,232,.75)";
          ctx.fill();
        }
      });
      ctx.restore();
    }

    function drawCore(t) {
      var desktop = width > 900;
      var core = {
        x: width * (desktop ? .845 : .79) + pointer.x * 10,
        y: height * (desktop ? .255 : .265) + pointer.y * 6
      };
      var radius = Math.min(desktop ? 126 : 84, Math.max(48, width * (desktop ? .081 : .102)));
      var pulse = reducedMotion.matches ? 0 : Math.sin(t * 1.15) * 2.1;
      drawNetwork(t, core);

      glow(core.x, core.y, radius * 2.3, "0,170,250", .17);
      glow(core.x, core.y, radius * 1.4, "6,242,221", .24);

      // Translucent inner sphere carries a cyan lower glow.
      var sphere = ctx.createRadialGradient(
        core.x - radius * .22, core.y + radius * .26, radius * .13,
        core.x, core.y, radius * 1.06
      );
      sphere.addColorStop(0, "#0a9f9b");
      sphere.addColorStop(.38, "#075c78");
      sphere.addColorStop(.78, "#062c51");
      sphere.addColorStop(1, "#06112f");
      ctx.beginPath();
      ctx.arc(core.x, core.y, radius + pulse, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      // Distinctive evidence orbit/latitude grid, unlike Trivy's artwork.
      ctx.save();
      ctx.translate(core.x, core.y);
      ctx.rotate(-.23 + (reducedMotion.matches ? 0 : Math.sin(t * .20) * .045));
      ctx.strokeStyle = "rgba(63,228,232,.27)";
      ctx.lineWidth = 1;
      [-.52, -.20, .18, .52].forEach(function (lat) {
        ctx.beginPath();
        ctx.ellipse(0, lat * radius, radius * Math.sqrt(1 - lat * lat) * .86,
          radius * .13, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * .29, radius * .9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * .65, radius * .94, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Vertical cyan scan sweeping the interior.
      ctx.save();
      ctx.beginPath();
      ctx.arc(core.x, core.y, radius - 2, 0, Math.PI * 2);
      ctx.clip();
      var scanY = core.y + (reducedMotion.matches ? -.13 :
        Math.sin(t * .52) * .69) * radius;
      var lineGlow = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
      lineGlow.addColorStop(0, "rgba(68,245,230,0)");
      lineGlow.addColorStop(.5, "rgba(52,251,237,.28)");
      lineGlow.addColorStop(1, "rgba(68,245,230,0)");
      ctx.fillStyle = lineGlow;
      ctx.fillRect(core.x - radius, scanY - 15, radius * 2, 30);
      ctx.restore();

      // Outer ring and rotating dashed orbit.
      ctx.beginPath();
      ctx.arc(core.x, core.y, radius + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(35,221,238,.63)";
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.save();
      ctx.translate(core.x, core.y);
      ctx.rotate(reducedMotion.matches ? .22 : t * .065);
      ctx.setLineDash([radius * .41, radius * .21]);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.2, radius * .75, -.37, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(64,217,248,.48)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Satellite observation points around the core.
      dots.forEach(function (dot, index) {
        var angle = dot.phase + (reducedMotion.matches ? 0 : t * dot.speed * .11);
        var x = core.x + Math.cos(angle) * radius * (1.22 + dot.orbit * .34);
        var y = core.y + Math.sin(angle) * radius * (.89 + dot.orbit * .18);
        if (index % 5 === 0) glow(x, y, 10, "68,232,246", .15);
        ctx.fillStyle = "rgba(110,240,242," + dot.alpha + ")";
        ctx.beginPath();
        ctx.arc(x, y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Center mark = corroborated evidence, not a mascot or scanner eye.
      ctx.save();
      ctx.translate(core.x, core.y + radius * .12);
      ctx.shadowBlur = 22;
      ctx.shadowColor = "rgba(92,251,232,.75)";
      ctx.strokeStyle = "#84fff0";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(2.3, radius * .034);
      ctx.beginPath();
      ctx.moveTo(-radius * .25, 0);
      ctx.lineTo(-radius * .065, radius * .17);
      ctx.lineTo(radius * .27, -radius * .19);
      ctx.stroke();
      ctx.restore();
    }

    function render(t) {
      if (disposed || width < 1 || height < 1) return;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      drawStars(t);
      drawTerrain(t);
      drawCore(t);
      ctx.restore();
    }

    function isActive() {
      return !disposed && visible && !document.hidden &&
        !reducedMotion.matches && !paused;
    }

    function tick(timestamp) {
      rafId = 0;
      if (!isActive()) return;
      if (timestamp - lastFrame >= 33) {
        lastFrame = timestamp;
        render(timestamp / 1000);
      }
      rafId = window.requestAnimationFrame(tick);
    }

    function start() {
      if (isActive() && !rafId) {
        lastFrame = 0;
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function stop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function updateControls() {
      if (!button) return;
      var effectivePause = paused || reducedMotion.matches;
      button.setAttribute("aria-pressed", effectivePause ? "true" : "false");
      button.setAttribute("aria-label",
        reducedMotion.matches ? "Reduced motion enabled by system preference" :
        paused ? "Resume background animation" : "Pause background animation");
      if (label) label.textContent = reducedMotion.matches ? "REDUCED MOTION" :
        paused ? "RESUME MOTION" : "PAUSE MOTION";
      if (symbol) symbol.textContent = paused || reducedMotion.matches ? "▶" : "Ⅱ";
      button.disabled = reducedMotion.matches;
    }

    function onToggle() {
      paused = !paused;
      updateControls();
      if (paused) {
        stop();
        render(0);
      } else start();
    }

    function onPreferenceChange() {
      updateControls();
      if (reducedMotion.matches) {
        stop();
        render(0);
      } else start();
    }

    function onVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }

    function onPointerMove(event) {
      if (reducedMotion.matches || paused || width < 850) return;
      var r = section.getBoundingClientRect();
      pointer.x = Math.max(-1, Math.min(1,
        ((event.clientX - r.left) / Math.max(r.width, 1) - .5) * 2));
      pointer.y = Math.max(-1, Math.min(1,
        ((event.clientY - r.top) / Math.max(r.height, 1) - .5) * 2));
    }

    function onPointerLeave() {
      pointer.x = 0;
      pointer.y = 0;
    }

    function dispose() {
      disposed = true;
      stop();
      if (resizeObserver) resizeObserver.disconnect();
      if (visibilityObserver) visibilityObserver.disconnect();
      else window.removeEventListener("resize", size);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (button) button.removeEventListener("click", onToggle);
      if (reducedMotion.removeEventListener)
        reducedMotion.removeEventListener("change", onPreferenceChange);
      else if (reducedMotion.removeListener)
        reducedMotion.removeListener(onPreferenceChange);
    }

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(size);
      resizeObserver.observe(section);
    } else {
      window.addEventListener("resize", size, { passive: true });
    }
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(function (entries) {
        visible = entries[0] ? entries[0].isIntersecting : true;
        if (visible) start();
        else stop();
      }, { threshold: 0.01 });
      visibilityObserver.observe(section);
    }
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (button) button.addEventListener("click", onToggle);
    if (reducedMotion.addEventListener)
      reducedMotion.addEventListener("change", onPreferenceChange);
    else if (reducedMotion.addListener)
      reducedMotion.addListener(onPreferenceChange);

    size();
    updateControls();
    start();

    return { dispose: dispose, canvas: canvas };
  }

  function setupCopy(root) {
    var button = root.querySelector("#tm-copy-command");
    if (!button || button.dataset.tmBound) return;
    button.dataset.tmBound = "true";
    var commands = [
      "git clone https://github.com/lzyred/TraceMason-docs.git",
      "cd TraceMason-docs",
      "python3 prototype/tracemason.py"
    ].join("\n");

    button.addEventListener("click", function () {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        button.textContent = "SELECT COMMANDS";
        var pre = root.querySelector(".tm-terminal-code");
        if (pre && window.getSelection) {
          var sel = window.getSelection();
          if (sel && document.createRange) {
            var range = document.createRange();
            range.selectNodeContents(pre);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        return;
      }
      navigator.clipboard.writeText(commands).then(function () {
        button.textContent = "COPIED ✓";
        window.setTimeout(function () {
          if (button.isConnected) button.textContent = "COPY ⧉";
        }, 1800);
      }).catch(function () {
        button.textContent = "COPY FAILED";
      });
    });
  }

  function initialize() {
    var section = document.querySelector(".tm-landing .tm-universe");
    var canvas = section && section.querySelector("#tm-scene");

    if (sceneInstance && sceneInstance.canvas !== canvas) {
      sceneInstance.dispose();
      sceneInstance = null;
    }
    if (!section || !canvas) return;

    if (!sceneInstance) sceneInstance = createScene(section, canvas);
    setupCopy(document.querySelector(".tm-landing"));
  }

  if (!isListening) {
    isListening = true;
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();

    // Material for MkDocs may replace pages using instant navigation.
    // This subscription is intentionally initialized only once.
    if (typeof document$ !== "undefined" && document$ &&
        typeof document$.subscribe === "function") {
      document$.subscribe(initialize);
    }
  }
})();
