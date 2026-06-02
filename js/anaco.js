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
})();
