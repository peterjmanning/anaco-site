(function () {
  'use strict';

  var SLIDE_MS = 420;
  var preloaded = Object.create(null);

  function getSlides() {
    return (window.PRODUCT_CAROUSEL && window.PRODUCT_CAROUSEL.slides) || [];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function preloadSrc(src) {
    if (!src || preloaded[src]) return;
    preloaded[src] = true;
    var img = new Image();
    img.decoding = 'async';
    img.src = src;
  }

  function slideExists(slide) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        resolve(true);
      };
      img.onerror = function () {
        resolve(false);
      };
      img.src = slide.src;
    });
  }

  function filterExistingSlides(slides) {
    return Promise.all(
      slides.map(function (slide) {
        return slideExists(slide).then(function (exists) {
          return exists ? slide : null;
        });
      })
    ).then(function (results) {
      return results.filter(Boolean);
    });
  }

  function preloadAround(slides, centerIndex) {
    if (!slides.length) return;
    preloadSrc(slides[centerIndex].src);
    preloadSrc(slides[(centerIndex + 1) % slides.length].src);
    preloadSrc(slides[(centerIndex - 1 + slides.length) % slides.length].src);
  }

  function buildSlide(slide, index, total) {
    return (
      '<figure class="product-carousel__slide" id="productCarouselSlide-' +
      index +
      '" role="group" aria-roledescription="slide" aria-label="' +
      (index + 1) +
      ' of ' +
      total +
      '" data-index="' +
      index +
      '">' +
      '<img src="' +
      escapeHtml(slide.src) +
      '" alt="' +
      escapeHtml(slide.alt || 'Tinylab render') +
      '" width="1080" height="1080" loading="' +
      (index <= 2 ? 'eager' : 'lazy') +
      '" decoding="async" draggable="false">' +
      '</figure>'
    );
  }

  function initProductCarousel() {
    var root = document.getElementById('productCarousel');
    var track = document.getElementById('productCarouselTrack');
    var prevBtn = root && root.querySelector('.product-carousel__nav--prev');
    var nextBtn = root && root.querySelector('.product-carousel__nav--next');
    if (!root || !track) return;

    filterExistingSlides(getSlides()).then(function (slides) {
      mountCarousel(root, track, prevBtn, nextBtn, slides);
    });
  }

  function mountCarousel(root, track, prevBtn, nextBtn, slides) {
    if (!slides.length) {
      track.innerHTML =
        '<div class="product-carousel__empty">' +
        '<p>Add images in <code>js/product-carousel-data.js</code>.</p>' +
        '</div>';
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      return;
    }

    track.innerHTML = slides
      .map(function (slide, index) {
        return buildSlide(slide, index, slides.length);
      })
      .join('');

    var slideEls = Array.prototype.slice.call(
      track.querySelectorAll('.product-carousel__slide')
    );
    var index = 0;
    var transitioning = false;

    root.style.setProperty('--product-carousel-slide-ms', SLIDE_MS + 'ms');

    function getVisibleCount() {
      var raw = getComputedStyle(root)
        .getPropertyValue('--product-carousel-visible')
        .trim();
      var count = parseInt(raw, 10);
      return count > 0 ? count : 3;
    }

    function getMaxIndex() {
      return Math.max(0, slides.length - getVisibleCount());
    }

    function updateNavVisibility() {
      var hide = getMaxIndex() === 0;
      if (prevBtn) prevBtn.hidden = hide;
      if (nextBtn) nextBtn.hidden = hide;
    }

    updateNavVisibility();

    function setTrackMotion(enabled) {
      track.style.transition = enabled
        ? 'transform ' + SLIDE_MS + 'ms cubic-bezier(0.4, 0, 0.2, 1)'
        : 'none';
    }

    function applyIndex(nextIndex) {
      var maxIndex = getMaxIndex();
      if (nextIndex > maxIndex) nextIndex = 0;
      if (nextIndex < 0) nextIndex = maxIndex;

      index = nextIndex;
      var offset = slideEls[index] ? -slideEls[index].offsetLeft : 0;
      track.style.transform = 'translate3d(' + offset + 'px, 0, 0)';

      slideEls.forEach(function (slide, slideIndex) {
        var inView =
          slideIndex >= index && slideIndex < index + getVisibleCount();
        slide.setAttribute('aria-hidden', inView ? 'false' : 'true');
      });

      root.setAttribute(
        'aria-label',
        'Tinylab gallery, showing images ' +
          (index + 1) +
          '–' +
          Math.min(index + getVisibleCount(), slides.length) +
          ' of ' +
          slides.length
      );
      preloadAround(slides, index);
    }

    function goTo(nextIndex) {
      if (!slides.length) return;
      var maxIndex = getMaxIndex();
      var target = nextIndex;
      if (target > maxIndex) target = 0;
      if (target < 0) target = maxIndex;
      if (target === index) return;
      if (transitioning) return;

      var reduced = prefersReducedMotion();
      transitioning = !reduced;

      setTrackMotion(!reduced);
      applyIndex(target);

      if (reduced) {
        transitioning = false;
        return;
      }

      window.setTimeout(function () {
        transitioning = false;
      }, SLIDE_MS);
    }

    function step(delta) {
      goTo(index + delta);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        step(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        step(1);
      });
    }

    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        setTrackMotion(false);
        updateNavVisibility();
        applyIndex(Math.min(index, getMaxIndex()));
      }, 100);
    });

    slides.forEach(function (slide) {
      preloadSrc(slide.src);
    });
    setTrackMotion(false);
    applyIndex(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCarousel);
  } else {
    initProductCarousel();
  }
})();
