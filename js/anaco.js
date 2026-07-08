(function () {
  'use strict';

  const nav = document.querySelector('.nav');
  const navLinks = nav?.querySelector('.nav-links');

  if (nav) {
    const toggle = nav.querySelector('.nav-toggle');
    const getScrollY = () =>
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const onScroll = () => {
      const scrolled = getScrollY() > 16;
      nav.classList.toggle('scrolled', scrolled);
      if (scrolled) {
        navLinks?.classList.remove('open');
        nav.classList.remove('is-menu-open');
        document.documentElement.classList.remove('nav-menu-open');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && navLinks) {
      const setMenuOpen = (open) => {
        nav.classList.toggle('is-menu-open', open);
        navLinks.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.documentElement.classList.toggle('nav-menu-open', open);
      };

      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        setMenuOpen(!navLinks.classList.contains('open'));
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
      });

      document.addEventListener('click', (event) => {
        if (!navLinks.classList.contains('open')) return;
        if (toggle.contains(event.target) || navLinks.contains(event.target)) return;
        setMenuOpen(false);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navLinks.classList.contains('open')) {
          setMenuOpen(false);
        }
      });
    }

    initNavSectionHighlight(nav);
  }

  initHomeScroll(navLinks);
  initMobileSectionTitleSplit();

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

  function initHomeScroll(links) {
    if (!document.querySelector('main.home')) return;

    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      requestAnimationFrame(function () {
        scrollToSection(id);
        stripUrlHash();
      });
    }

    document.addEventListener(
      'click',
      function (event) {
        const homeLink = event.target.closest('.nav-links a[data-nav-home]');
        if (homeLink) {
          event.preventDefault();
          scrollToSection(null);
          stripUrlHash();
          links?.classList.remove('open');
          return;
        }

        const scrollTrigger = event.target.closest('[data-scroll-to]');
        if (!scrollTrigger) return;

        event.preventDefault();
        const id = scrollTrigger.getAttribute('data-scroll-to');
        if (id && document.getElementById(id)) {
          scrollToSection(id);
        }
        stripUrlHash();
        links?.classList.remove('open');
      },
      true
    );
  }

  function initMobileSectionTitleSplit() {
    if (!document.querySelector('main.home')) return;

    const mq = window.matchMedia('(max-width: 900px)');
    const titles = document.querySelectorAll('main.home .home-section .sheet > .home-section-title');

    function bestBalancedSplit(words) {
      const lengths = words.map((word) => word.length);
      let bestIdx = 1;
      let bestScore = Infinity;

      for (let i = 1; i < words.length; i += 1) {
        const left = lengths.slice(0, i).reduce((sum, n) => sum + n, 0) + (i - 1);
        const rightCount = words.length - i;
        const right = lengths.slice(i).reduce((sum, n) => sum + n, 0) + (rightCount - 1);
        const score = Math.abs(left - right);
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      return bestIdx;
    }

    function applySplit() {
      const isMobile = mq.matches;

      titles.forEach((title) => {
        const original = title.dataset.originalTitle || title.textContent.trim().replace(/\s+/g, ' ');
        title.dataset.originalTitle = original;

        const words = original.split(' ').filter(Boolean);
        if (!isMobile || words.length < 3) {
          title.textContent = original;
          return;
        }

        const splitIdx = bestBalancedSplit(words);
        const firstLine = words.slice(0, splitIdx).join(' ');
        const secondLine = words.slice(splitIdx).join(' ');

        title.textContent = '';
        title.append(firstLine, document.createElement('br'), secondLine);
      });
    }

    applySplit();
    window.addEventListener('resize', applySplit, { passive: true });
  }

  function initNavSectionHighlight(nav) {
    const homeLink = nav.querySelector('[data-nav-home]');
    const sectionLinks = [...nav.querySelectorAll('.nav-links a[data-scroll-to]')];
    if (!sectionLinks.length && !homeLink) return;

    const sections = sectionLinks
      .map((link) => {
        const id = link.getAttribute('data-scroll-to');
        const el = document.getElementById(id);
        return el ? { id, el, link } : null;
      })
      .filter(Boolean);

    const setActive = (id) => {
      sectionLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('data-scroll-to') === id);
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

  initScrollProgress();

  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar || !document.querySelector('main.home')) return;

    const update = () => {
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      bar.style.width = pct + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }
})();
