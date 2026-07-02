(function () {
  'use strict';

  var FADE_MS = 600;
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

  function buildSlide(slide, index, total, isActive) {
    return (
      '<figure class="product-carousel__slide' +
      (isActive ? ' is-active' : '') +
      '" id="productCarouselSlide-' +
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
      '" width="1920" height="1080" loading="' +
      (index <= 1 ? 'eager' : 'lazy') +
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
        return buildSlide(slide, index, slides.length, index === 0);
      })
      .join('');

    var slideEls = Array.prototype.slice.call(
      track.querySelectorAll('.product-carousel__slide')
    );
    var index = 0;
    var transitioning = false;

    if (slides.length <= 1) {
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
    }

    root.style.setProperty('--product-carousel-fade-ms', FADE_MS + 'ms');

    function setSlideMotion(enabled) {
      slideEls.forEach(function (slide) {
        slide.style.transition = enabled
          ? 'opacity ' + FADE_MS + 'ms cubic-bezier(0.4, 0, 0.2, 1)'
          : 'none';
      });
    }

    function applyIndex(nextIndex) {
      slideEls.forEach(function (slide, slideIndex) {
        var active = slideIndex === nextIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      root.setAttribute(
        'aria-label',
        'Tinylab gallery, slide ' + (nextIndex + 1) + ' of ' + slides.length
      );
      preloadAround(slides, nextIndex);
    }

    function goTo(nextIndex) {
      if (!slides.length || nextIndex === index) return;
      if (transitioning) return;

      var reduced = prefersReducedMotion();
      transitioning = !reduced;

      setSlideMotion(!reduced);
      index = (nextIndex + slides.length) % slides.length;
      applyIndex(index);

      if (reduced) {
        transitioning = false;
        return;
      }

      window.setTimeout(function () {
        transitioning = false;
      }, FADE_MS);
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

    slides.forEach(function (slide) {
      preloadSrc(slide.src);
    });
    setSlideMotion(false);
    applyIndex(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCarousel);
  } else {
    initProductCarousel();
  }
})();
