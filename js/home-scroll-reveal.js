(function () {
  'use strict';

  var observer = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var SELECTORS = [
    'main.home .hero .hero-content > *',
    'main.home .home-section:not(.legal-page) .sheet > *',
    'main.home .why-cascade-card',
    'main.home .lab-pipeline__step',
    'main.home .facility-card',
    'main.home .industry-grid-item',
    'footer.footer .footer-inner'
  ].join(', ');

  function shouldSkip(el) {
    if (!el || el.closest('.home-intro')) return true;
    if (el.hasAttribute('hidden')) return true;
    if (el.getAttribute('aria-hidden') === 'true') return true;
    if (
      el.classList.contains('why-cascade') ||
      el.classList.contains('lab-pipeline') ||
      el.classList.contains('facility-grid') ||
      el.classList.contains('industries-hub')
    ) {
      return true;
    }
    return false;
  }

  function staggerKey(el) {
    var parent = el.parentElement;
    if (!parent) return 'root';
    return parent.id || parent.className || parent.tagName;
  }

  function revealAll() {
    document.querySelectorAll('main.home .scroll-reveal, footer.footer .scroll-reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  function initScrollReveal() {
    if (reducedMotion.matches) {
      revealAll();
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
      );
    }

    var seen = new Set();
    var groupIndex = new Map();

    document.querySelectorAll(SELECTORS).forEach(function (el) {
      if (shouldSkip(el) || seen.has(el)) return;
      seen.add(el);

      var key = staggerKey(el);
      var index = groupIndex.get(key) || 0;
      groupIndex.set(key, index + 1);

      el.classList.add('scroll-reveal');
      el.style.setProperty('--scroll-reveal-delay', Math.min(index * 55, 280) + 'ms');

      if (!el.classList.contains('is-visible')) {
        observer.observe(el);
      }
    });
  }

  window.refreshScrollReveal = initScrollReveal;

  function boot() {
    initScrollReveal();

    var html = document.documentElement;
    if (html.classList.contains('intro-pending') && !html.classList.contains('intro-done')) {
      var introWatcher = new MutationObserver(function () {
        if (!html.classList.contains('intro-done')) return;
        introWatcher.disconnect();
        initScrollReveal();
      });
      introWatcher.observe(html, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('load', initScrollReveal);

  reducedMotion.addEventListener('change', function () {
    if (reducedMotion.matches) revealAll();
    else initScrollReveal();
  });
})();
