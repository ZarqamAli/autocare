(function () {
  // Lazy-load images with data-src via IntersectionObserver
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('img[data-src]').forEach(function (img) {
        img.src = img.dataset.src;
      });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var img = e.target;
          if (img.dataset.src) img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    document.querySelectorAll('img[data-src]').forEach(function (img) { io.observe(img); });
  }

  // Defer non-critical tasks until after first paint
  function afterPaint(fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 200);
    }
  }

  // Add loading=lazy to any img missing it (runtime safety net)
  function patchMissingLazy() {
    document.querySelectorAll('img:not([loading])').forEach(function (img) {
      img.setAttribute('loading', 'lazy');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initLazyImages();
      afterPaint(patchMissingLazy);
    });
  } else {
    initLazyImages();
    afterPaint(patchMissingLazy);
  }

  window.AutoPerf = { initLazyImages: initLazyImages, afterPaint: afterPaint };
})();
