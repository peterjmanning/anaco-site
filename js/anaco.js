(function () {
  'use strict';

  const nav = document.querySelector('.nav');
  if (nav) {
    const toggle = nav.querySelector('.nav-toggle');
    const links = nav.querySelector('.nav-links');
    const getScrollY = () =>
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const onScroll = () => {
      const scrolled = getScrollY() > 16;
      nav.classList.toggle('scrolled', scrolled);
      if (scrolled) links?.classList.remove('open');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }

    initNavScrollWithoutHash(nav, links);
    initNavSectionHighlight(nav);
  }

  function stripUrlHash() {
    if (!window.location.hash) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  function scrollToSection(id) {
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initNavScrollWithoutHash(nav, links) {
    if (window.location.hash && document.querySelector('main.home')) {
      const id = window.location.hash.slice(1);
      requestAnimationFrame(function () {
        scrollToSection(id);
        stripUrlHash();
      });
    }

    nav.addEventListener('click', function (event) {
      const link = event.target.closest('.nav-links a.nav-link, .nav-links a[data-nav-home]');
      if (!link) return;

      const href = link.getAttribute('href') || '';

      if (link.hasAttribute('data-nav-home') || href === './' || href === '/' || href === '') {
        event.preventDefault();
        scrollToSection(null);
        stripUrlHash();
        links?.classList.remove('open');
        return;
      }

      if (href.charAt(0) === '#') {
        event.preventDefault();
        scrollToSection(href.slice(1));
        stripUrlHash();
        links?.classList.remove('open');
      }
    });
  }

  function initNavSectionHighlight(nav) {
    const homeLink = nav.querySelector('[data-nav-home]');
    const sectionLinks = [...nav.querySelectorAll('.nav-links a:not(.nav-cta)[href^="#"]')];
    if (!sectionLinks.length && !homeLink) return;

    const sections = sectionLinks
      .map((link) => {
        const id = link.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        return el ? { id, el, link } : null;
      })
      .filter(Boolean);

    const setActive = (id) => {
      sectionLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
      if (homeLink) homeLink.classList.toggle('active', !id);
    };

    if (sections.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible.length) {
            setActive(visible[0].target.id);
          }
        },
        { rootMargin: '-42% 0px -50% 0px', threshold: [0, 0.15, 0.35] }
      );
      sections.forEach(({ el }) => observer.observe(el));
    }

    if (homeLink) {
      const getScrollY = () =>
        window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const onHomeScroll = () => {
        if (getScrollY() < 120 && !sections.some(({ el }) => {
          const rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.2;
        })) {
          setActive(null);
        }
      };
      window.addEventListener('scroll', onHomeScroll, { passive: true });
      onHomeScroll();
    }
  }

  document.querySelectorAll('[data-rotate]').forEach((el) => {
    const words = el.dataset.rotate.split('|').map((s) => s.trim());
    if (words.length < 2) return;
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'text-rotator-word' + (i === 0 ? ' active' : '');
      span.textContent = word;
      el.appendChild(span);
    });
    let idx = 0;
    const spans = el.querySelectorAll('.text-rotator-word');
    setInterval(() => {
      spans[idx].classList.remove('active');
      idx = (idx + 1) % spans.length;
      spans[idx].classList.add('active');
    }, 3200);
  });

  function prefersLiteReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    const cores = navigator.hardwareConcurrency || 8;
    const mem = navigator.deviceMemory;
    if (cores <= 4) return true;
    if (mem !== undefined && mem < 4) return true;
    return false;
  }

  function initScrollReveal() {
    const lite = prefersLiteReveal();
    if (lite) document.documentElement.classList.add('reveal-lite');

    const STAGGER_MS = lite ? 110 : 85;
    const targets = [];
    const seen = new Set();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function mark(el, delayMs) {
      if (!el || seen.has(el)) return;
      seen.add(el);
      if (!reduced && !el.classList.contains('blur-in')) el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', `${delayMs}ms`);
      targets.push(el);
    }

    function collectSection(section) {
      let i = 0;
      const header = section.querySelector(':scope .layer-float');
      if (header) {
        mark(header, i * STAGGER_MS);
        i += 1;
      }

      if (section.id === 'specs') {
        section.querySelectorAll('.spec-card').forEach((card) => {
          mark(card, i * STAGGER_MS);
          i += 1;
        });
        return;
      }

      if (section.id === 'industries') {
        section.querySelectorAll('.carousel-item').forEach((item) => {
          mark(item, i * STAGGER_MS);
          i += 1;
        });
        return;
      }

      const sheet = section.querySelector(':scope .sheet');
      if (!sheet) return;
      [...sheet.children].forEach((child) => {
        if (child.classList.contains('sheet-hatch')) return;
        if (child.classList.contains('layer-float')) return;
        mark(child, i * STAGGER_MS);
        i += 1;
      });
    }

    let revealObs;
    let flushInView = () => {};

    function settleStatic(el) {
      if (!el || seen.has(el)) return;
      seen.add(el);
      el.classList.add('is-visible', 'visible');
      targets.push(el);
    }

    function markHeroInner() {
      document.querySelectorAll('.home .hero-inner > *').forEach((el, i) => mark(el, i * STAGGER_MS));
    }

    const html = document.documentElement;
    if (html.classList.contains('intro-pending')) {
      document.addEventListener(
        'anaco-intro-complete',
        () => {
          document.querySelectorAll('.home .hero-inner > *').forEach((el, i) => {
            if (el.classList.contains('hero-headline') || el.classList.contains('intro-page-fade')) {
              seen.add(el);
              el.classList.add('is-visible', 'visible');
              return;
            }
            mark(el, i * STAGGER_MS);
          });
          document.querySelectorAll('.intro-page-fade, footer.footer').forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);
            el.classList.add('is-visible', 'visible');
          });
          targets.forEach((el) => revealObs.observe(el));
          flushInView();
        },
        { once: true }
      );
    } else if (html.classList.contains('intro-done')) {
      document
        .querySelectorAll('.home .hero-inner > *, nav.nav .nav-logo, nav.nav .intro-target')
        .forEach(settleStatic);
    } else {
      markHeroInner();
    }
    document.querySelectorAll('.home .home-section:not(.legal-page)').forEach(collectSection);

    const footer = document.querySelector('.footer');
    if (footer) mark(footer, 0);

    document.querySelectorAll('.site-page .fade-in, .site-page .blur-in').forEach((el, idx) => {
      mark(el, (idx % 6) * STAGGER_MS);
    });

    document.querySelectorAll('.site-page-main > *').forEach((el, idx) => {
      if (el.classList.contains('fade-in') || el.classList.contains('blur-in')) return;
      mark(el, idx * STAGGER_MS);
    });

    document.querySelectorAll('.fade-in:not(.reveal), .blur-in').forEach((el) => {
      if (!seen.has(el)) targets.push(el);
    });

    function clearRevealWillChange(el) {
      el.classList.remove('is-revealing');
      el.style.willChange = '';
    }

    function armReveal(el) {
      el.classList.add('is-revealing');
      const onEnd = (e) => {
        if (e.target !== el || e.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', onEnd);
        clearRevealWillChange(el);
      };
      el.addEventListener('transitionend', onEnd);
      window.setTimeout(() => clearRevealWillChange(el), 1600);
    }

    function show(el) {
      if (el.classList.contains('is-visible')) return;
      if (!reduced) armReveal(el);
      el.classList.add('is-visible', 'visible');
      revealObs?.unobserve(el);
    }

    if (reduced) {
      targets.forEach(show);
      return;
    }

    if (targets.length > 28 && !lite) {
      document.documentElement.classList.add('reveal-lite');
    }

    revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) show(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px 12% 0px' }
    );

    targets.forEach((el) => revealObs.observe(el));

    flushInView = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      targets.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.94 && rect.bottom > 0) show(el);
      });
    };

    requestAnimationFrame(flushInView);

    let resizeTick = 0;
    window.addEventListener(
      'resize',
      () => {
        window.clearTimeout(resizeTick);
        resizeTick = window.setTimeout(() => {
          targets.forEach((el) => {
            if (!el.classList.contains('is-visible') && revealObs) revealObs.observe(el);
          });
        }, 200);
      },
      { passive: true }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }

  window.scrollCarousel = function (dir) {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const items = track.querySelectorAll('.carousel-item');
    if (!items.length) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 12;
    const step = items[0].offsetWidth + gap;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  function loadHeroAnimatedGif() {
    const img = document.querySelector('.hero-visual img[data-animated-src]');
    if (!img || img.dataset.animatedLoaded === '1') return;
    const gif = img.getAttribute('data-animated-src');
    if (!gif) return;

    const apply = function () {
      img.src = gif;
      img.dataset.animatedLoaded = '1';
    };

    const probe = new Image();
    probe.onload = apply;
    probe.onerror = apply;
    probe.src = gif;
  }

  function scheduleHeroGif() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const start = function () {
      window.setTimeout(loadHeroAnimatedGif, 350);
    };

    const html = document.documentElement;
    if (html.classList.contains('intro-done')) {
      start();
      return;
    }

    document.addEventListener('anaco-intro-complete', start, { once: true });
    window.setTimeout(function () {
      const img = document.querySelector('.hero-visual img[data-animated-src]');
      if (img && img.dataset.animatedLoaded !== '1') loadHeroAnimatedGif();
    }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleHeroGif);
  } else {
    scheduleHeroGif();
  }

})();
