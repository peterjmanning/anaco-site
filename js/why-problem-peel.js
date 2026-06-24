(function () {
  'use strict';

  var PEEL_CLIP = 'polygon(0 0, 0 0, 100% 100%, 100% 100%)';

  function initWhyProblemPeel() {
    var card = document.querySelector('.why-cascade-card--problem');
    if (!card) return;

    var handle = card.querySelector('.why-cascade-card__peel-handle');
    var curl = handle && handle.querySelector('.why-cascade-card__peel-curl');
    var closeBtn = card.querySelector('.why-cascade-card__peel-close');
    var page = card.querySelector('.why-cascade-card__page');
    var caseStudy = document.getElementById('whyProblemCase');
    if (!handle || !closeBtn || !page || !caseStudy) return;

    var closing = false;

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
    }

    function closePeel() {
      if (closing || !card.classList.contains('is-peeled')) return;
      closing = true;
      updateAria(false);
      card.classList.remove('is-peeled');

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
