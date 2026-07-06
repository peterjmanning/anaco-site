(function () {
  'use strict';

  var PEEL_CLIP = 'polygon(0 0, 0 0, 100% 100%, 100% 100%)';
  var SCROLL_DOT_SIZE = 6;

  function initWhyProblemPeel() {
    var card = document.querySelector('.why-cascade-card--problem');
    if (!card) return;

    var peelStage = card.querySelector('.why-cascade-card__peel-stage');
    var handle = card.querySelector('.why-cascade-card__peel-handle');
    var curl = handle && handle.querySelector('.why-cascade-card__peel-curl');
    var closeBtn = card.querySelector('.why-cascade-card__peel-close');
    var page = card.querySelector('.why-cascade-card__page');
    var caseStudy = document.getElementById('whyProblemCase');
    var scrollDot = card.querySelector('.why-cascade-card__case-scroll-dot');
    if (!handle || !closeBtn || !page || !caseStudy || !peelStage || !scrollDot) return;

    var closing = false;

    function updateScrollDot() {
      var maxScroll = caseStudy.scrollHeight - caseStudy.clientHeight;
      var scrollable = maxScroll > 1 && card.classList.contains('is-peeled');

      card.classList.toggle('is-case-scrollable', scrollable);
      scrollDot.hidden = !scrollable;

      if (!scrollable) {
        scrollDot.style.removeProperty('top');
        return;
      }

      var stageRect = peelStage.getBoundingClientRect();
      var caseRect = caseStudy.getBoundingClientRect();
      var trackTop = caseRect.top - stageRect.top;
      var trackHeight = caseStudy.clientHeight;
      var progress = caseStudy.scrollTop / maxScroll;
      var peelEar =
        parseFloat(window.getComputedStyle(card).getPropertyValue('--why-peel-ear')) || 48;
      var topInset = 4;
      var bottomInset = peelEar * 0.4;
      var dotTravel = Math.max(0, trackHeight - SCROLL_DOT_SIZE - topInset - bottomInset);
      var top = trackTop + topInset + progress * dotTravel;

      scrollDot.style.top = top + 'px';
    }

    function scheduleScrollDotUpdate() {
      window.requestAnimationFrame(updateScrollDot);
    }

    function updateAria(open) {
      handle.setAttribute('aria-expanded', open ? 'true' : 'false');
      handle.setAttribute(
        'aria-label',
        open ? 'Fold page back' : 'Peel back page to read case study'
      );
      caseStudy.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    function openPeel() {
      if (closing) return;
      card.classList.add('is-peeled');
      updateAria(true);
      window.setTimeout(scheduleScrollDotUpdate, 180);
      scheduleScrollDotUpdate();
    }

    function closePeel() {
      if (closing || !card.classList.contains('is-peeled')) return;
      closing = true;
      updateAria(false);
      card.classList.remove('is-peeled');
      card.classList.remove('is-case-scrollable');
      scrollDot.hidden = true;
      scrollDot.style.removeProperty('top');

      page.style.transition = 'none';
      page.style.visibility = 'visible';
      page.style.opacity = '1';
      page.style.pointerEvents = 'none';
      page.style.clipPath = PEEL_CLIP;

      void page.offsetWidth;

      page.style.transition = '';
      page.style.pointerEvents = '';
      page.style.clipPath = '';

      page.addEventListener(
        'transitionend',
        function onCloseEnd(event) {
          if (event.propertyName !== 'clip-path') return;
          page.removeAttribute('style');
          closing = false;
        },
        { once: true }
      );
    }

    handle.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openPeel();
    });

    closeBtn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      closePeel();
    });

    caseStudy.addEventListener('scroll', scheduleScrollDotUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollDotUpdate, { passive: true });
    window.addEventListener('load', scheduleScrollDotUpdate, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      var observer = new ResizeObserver(scheduleScrollDotUpdate);
      observer.observe(caseStudy);
      observer.observe(peelStage);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleScrollDotUpdate);
    }

    if (curl) {
      handle.addEventListener('mouseenter', function () {
        if (card.classList.contains('is-peeled') || closing) return;
        curl.style.animation = 'none';
        void curl.offsetWidth;
        curl.style.removeProperty('animation');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhyProblemPeel);
  } else {
    initWhyProblemPeel();
  }
})();
