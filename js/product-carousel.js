(function () {
  'use strict';

  var TRANSITION_MS = 450;

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

  function buildSlide(slide, index, total) {
    var caption = slide.caption
      ? '<figcaption class="product-carousel__caption">' +
        escapeHtml(slide.caption) +
        '</figcaption>'
      : '';

    return (
      '<figure class="product-carousel__slide" id="productCarouselSlide-' +
      index +
      '" role="group" aria-roledescription="slide" aria-label="' +
      (index + 1) +
      ' of ' +
      total +
      '">' +
      '<img src="' +
      escapeHtml(slide.src) +
      '" alt="' +
      escapeHtml(slide.alt || '') +
      '" loading="' +
      (index === 0 ? 'eager' : 'lazy') +
      '" decoding="async">' +
      caption +
      '</figure>'
    );
  }

  function initProductCarousel() {
    var root = document.getElementById('productCarousel');
    var track = document.getElementById('productCarouselTrack');
    var dotsRoot = document.getElementById('productCarouselDots');
    var prevBtn = root && root.querySelector('.product-carousel__nav--prev');
    var nextBtn = root && root.querySelector('.product-carousel__nav--next');
    if (!root || !track || !dotsRoot) return;

    var slides = getSlides();
    if (!slides.length) {
      track.innerHTML =
        '<div class="product-carousel__empty">' +
        '<p>Add images in <code>js/product-carousel-data.js</code>.</p>' +
        '</div>';
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      return;
    }

    track.innerHTML = slides.map(function (slide, index) {
      return buildSlide(slide, index, slides.length);
    }).join('');

    dotsRoot.innerHTML = slides
      .map(function (slide, index) {
        return (
          '<button type="button" class="product-carousel__dot' +
          (index === 0 ? ' is-active' : '') +
          '" role="tab" aria-selected="' +
          (index === 0 ? 'true' : 'false') +
          '" aria-controls="productCarouselSlide-' +
          index +
          '" data-index="' +
          index +
          '" aria-label="Go to slide ' +
          (index + 1) +
          '"></button>'
        );
      })
      .join('');

    var index = 0;
    var dots = Array.prototype.slice.call(
      dotsRoot.querySelectorAll('.product-carousel__dot')
    );

    if (slides.length <= 1) {
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      dotsRoot.hidden = true;
    }

    function setTransition(enabled) {
      track.style.transition = enabled
        ? 'transform ' + TRANSITION_MS + 'ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none';
    }

    function update() {
      track.style.transform = 'translate3d(' + -index * 100 + '%, 0, 0)';
      dots.forEach(function (dot, dotIndex) {
        var active = dotIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      root.setAttribute('aria-label', 'Tinylab gallery, slide ' + (index + 1) + ' of ' + slides.length);
    }

    function goTo(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      update();
    }

    function step(delta) {
      setTransition(!prefersReducedMotion());
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

    dotsRoot.addEventListener('click', function (event) {
      var dot = event.target.closest('.product-carousel__dot');
      if (!dot) return;
      var nextIndex = Number(dot.dataset.index);
      if (Number.isNaN(nextIndex) || nextIndex === index) return;
      setTransition(!prefersReducedMotion());
      goTo(nextIndex);
    });

    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    });

    setTransition(false);
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCarousel);
  } else {
    initProductCarousel();
  }
})();
