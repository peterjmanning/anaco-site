(function () {
  'use strict';

  const STORAGE_KEY = 'anaco-intro-seen';
  const FLY_MS = 720;
  const FLY_EASE = 'cubic-bezier(0.55, 0.06, 0.22, 1)';
  const REVEAL_MS = 620;
  const LAB_BRING_MS = 720;
  const LAB_SETTLE_MS = 340;
  const LINE2_LAB_FLY_DELAY_MS = 420;
  const VANISH_MS = 380;
  const VANISH_EASE = 'ease-in';

  const PIECES = [
    { key: 'meet', fly: '.intro-fly--meet', target: 'main.home .hero-headline .headline-row:first-child' },
    { key: 'Tinylab', fly: '.intro-fly--Tinylab', target: 'main.home .hero-tinylab-wordmark' },
    { key: 'logo', fly: '.intro-fly--logo', target: 'nav.nav .nav-logo .brand-mark' },
  ];

  const TARGET_HIDE = 'main.home .intro-target, nav.nav .intro-target';
  const PAGE_FADE = [
    '.hero .sheet--hero',
    'main.home .home-section',
    'footer.footer',
    'nav.nav .nav-links',
  ];

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const nextFrame = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

  function buildFlyTransform(x, y, scaleX = 1, scaleY = 1) {
    const tx = Math.round(x);
    const ty = Math.round(y);
    if (scaleX === 1 && scaleY === 1) {
      return `translate3d(${tx}px,${ty}px,0)`;
    }
    return `translate3d(${tx}px,${ty}px,0) scale(${scaleX},${scaleY})`;
  }

  function onTransitionEnd(el, propertyName, ms, buffer = 80) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        el.removeEventListener('transitionend', onEnd);
        resolve();
      };
      const onEnd = (e) => {
        if (e.target !== el) return;
        if (e.propertyName !== propertyName) return;
        finish();
      };
      el.addEventListener('transitionend', onEnd);
      window.setTimeout(finish, ms + buffer);
    });
  }

  function finishImmediate() {
    const html = document.documentElement;
    html.classList.remove('intro-pending', 'intro-reveal');
    html.classList.add('intro-done');
    document.querySelectorAll(TARGET_HIDE).forEach((el) => {
      el.classList.remove('intro-target-hidden');
      el.style.opacity = '';
    });
    document.querySelectorAll('.intro-page-fade').forEach((el) => {
      el.classList.remove('intro-page-fade');
      el.style.opacity = '';
    });
    document.getElementById('home-intro')?.remove();
  }

  function markPageFadeTargets() {
    PAGE_FADE.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.classList.add('intro-page-fade'));
    });
  }

  function hideRealTargets() {
    document.querySelectorAll(TARGET_HIDE).forEach((el) => {
      el.classList.add('intro-target-hidden');
    });
  }

  function showRealTargets() {
    document.querySelectorAll(TARGET_HIDE).forEach((el) => {
      el.classList.remove('intro-target-hidden');
      el.style.opacity = '';
    });
  }

  function rectOf(el) {
    return el.getBoundingClientRect();
  }

  function isLogoPiece(el) {
    return el.classList.contains('intro-fly--logo');
  }

  function isMeetPiece(el) {
    return el.classList.contains('intro-fly--meet');
  }

  function meetFlyRect(el, targetRect) {
    const width = el.offsetWidth || rectOf(el).width;
    return {
      left: targetRect.left + (targetRect.width - width) / 2,
      top: targetRect.top,
      width,
      height: targetRect.height,
    };
  }

  function isTinylabPiece(el) {
    return el.classList.contains('intro-fly--Tinylab');
  }

  function tinylabWordmarkEl(flyEl) {
    return flyEl?.querySelector('.hero-tinylab-wordmark') || flyEl;
  }

  function syncTinylabFlyStyles(flyEl, targetEl) {
    const flyWordmark = tinylabWordmarkEl(flyEl);
    if (!flyWordmark || !targetEl) return;
    const cs = getComputedStyle(targetEl);
    // Keep flyer at its own display size; only normalize box model so scale math is clean.
    flyWordmark.style.padding = '0';
    flyWordmark.style.margin = '0';
    flyWordmark.style.display = 'block';
    flyWordmark.style.objectFit = 'contain';
    flyWordmark.style.maxWidth = cs.maxWidth;
  }

  function flyScale(el, from, to, innerFrom) {
    if (isLogoPiece(el)) {
      return { scaleX: to.width / from.width, scaleY: to.height / from.height };
    }
    if (isTinylabPiece(el)) {
      const inner = innerFrom || { width: from.width, height: from.height };
      const scale = to.width / Math.max(inner.width, 1);
      return { scaleX: scale, scaleY: scale };
    }
    return { scaleX: 1, scaleY: 1 };
  }

  function flyDestination(el, from, to, innerFrom, scaleX = 1, scaleY = 1) {
    if (isMeetPiece(el)) {
      const width = el.offsetWidth || from.width;
      return {
        left: to.left + (to.width - width) / 2,
        top: to.top,
      };
    }
    if (isTinylabPiece(el)) {
      const ox = (innerFrom?.left != null ? innerFrom.left : from.left) - from.left;
      const oy = (innerFrom?.top != null ? innerFrom.top : from.top) - from.top;
      return {
        left: to.left - ox * scaleX,
        top: to.top - oy * scaleY,
      };
    }
    return { left: to.left, top: to.top };
  }

  function placeFixedDivider(el, rect) {
    el.style.cssText = [
      'position:fixed',
      `left:${rect.left}px`,
      `top:${rect.top}px`,
      `width:${rect.width}px`,
      `height:${rect.height}px`,
      'margin:0',
      'z-index:10003',
      'visibility:visible',
      'pointer-events:none',
      'opacity:1',
      'transform:scaleX(1)',
      'transform-origin:center center',
      'transition:none',
      'box-sizing:border-box',
    ].join(';');
  }

  function spawnLabTrail(portal, box, strength, dirX) {
    const trail = document.createElement('span');
    trail.className = 'home-intro__lab-trail';
    trail.setAttribute('aria-hidden', 'true');
    const behind = dirX >= 0 ? -1 : 1;
    const width = 4 + strength * 5;
    const lag = 5 + strength * 7;
    trail.style.left = `${box.left + behind * lag}px`;
    trail.style.top = `${box.top + box.height * 0.68}px`;
    trail.style.width = `${width}px`;
    trail.style.setProperty('--trail-opacity', String(0.28 + strength * 0.42));
    trail.style.setProperty('--trail-drift', `${behind * (4 + strength * 5)}px`);
    portal.appendChild(trail);
    trail.addEventListener('animationend', () => trail.remove(), { once: true });
    window.setTimeout(() => trail.remove(), 480);
  }

  function runLabContrails(shell, portal, dirX) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => {};
    }

    let running = true;
    let lastX = null;
    let accum = 0;
    const baseDist = 9;

    function tick() {
      if (!running) return;
      const lab = shell.querySelector('.home-intro__lab');
      const box = lab ? rectOf(lab) : rectOf(shell);

      if (lastX !== null) {
        const step = Math.abs(box.left - lastX);
        accum += step;
        const strength = Math.min(1.35, 0.55 + step * 0.14);
        while (accum >= baseDist) {
          accum -= baseDist;
          spawnLabTrail(portal, box, strength, dirX);
        }
      }
      lastX = box.left;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    return () => {
      running = false;
    };
  }

  function shrinkDivider(el, ms, ease) {
    return new Promise((resolve) => {
      void el.offsetWidth;
      requestAnimationFrame(() => {
        el.style.transition = `transform ${ms}ms ${ease}, opacity ${ms}ms ${ease}`;
        el.style.transform = 'scaleX(0)';
        el.style.opacity = '0';
        onTransitionEnd(el, 'transform', ms).then(resolve);
      });
    });
  }

  function attachSampleToShell(shell, sampleEl) {
    const shellRect = rectOf(shell);
    const sampleRect = rectOf(sampleEl);
    const gap = Math.round(sampleRect.left - shellRect.right);

    const sampleHold = document.createElement('span');
    sampleHold.className = 'home-intro__sample-hold';
    sampleHold.setAttribute('aria-hidden', 'true');
    sampleHold.style.width = `${Math.round(sampleRect.width)}px`;
    sampleEl.parentNode.insertBefore(sampleHold, sampleEl);

    sampleEl.style.display = 'inline-block';
    sampleEl.style.verticalAlign = 'baseline';
    sampleEl.style.margin = '0';
    sampleEl.style.marginLeft = `${gap}px`;
    shell.appendChild(sampleEl);
    shell.classList.add('is-vanish-pair');
  }

  async function runPairVanish(shell, sampleEl, deltaX, question) {
    attachSampleToShell(shell, sampleEl);
    await nextFrame();

    const start = rectOf(shell);
    shell.style.transition = 'none';
    shell.style.transform = buildFlyTransform(start.left, start.top);
    void shell.offsetWidth;

    question.classList.add('is-vanish');

    return new Promise((resolve) => {
      void shell.offsetWidth;
      requestAnimationFrame(() => {
        shell.style.transition = `opacity ${VANISH_MS}ms ${VANISH_EASE}, transform ${VANISH_MS}ms ${VANISH_EASE}`;
        shell.style.transform = buildFlyTransform(start.left + deltaX, start.top + 10);
        shell.style.opacity = '0';
        onTransitionEnd(shell, 'transform', VANISH_MS, 80).then(resolve);
      });
    });
  }

  function flyLabHorizontal(labWrap, labEl, questionEl, portal, from, toLeft, flyTop, ms = FLY_MS) {
    const hold = document.createElement('span');
    hold.className = 'home-intro__lab-wrap home-intro__lab-wrap--hold';
    hold.style.minWidth = `${from.width}px`;
    labWrap.parentNode.insertBefore(hold, labWrap);

    const shell = document.createElement('span');
    shell.className = 'home-intro__lab-fly-shell';
    shell.appendChild(labWrap);
    portal.appendChild(shell);

    const qcs = getComputedStyle(questionEl);
    shell.style.left = '0';
    shell.style.top = '0';
    shell.style.transform = buildFlyTransform(from.left, flyTop);
    shell.style.transformOrigin = '0 0';
    shell.style.fontFamily = qcs.fontFamily;
    shell.style.fontSize = qcs.fontSize;
    shell.style.fontWeight = qcs.fontWeight;
    shell.style.fontStyle = qcs.fontStyle;
    shell.style.lineHeight = qcs.lineHeight;
    shell.style.letterSpacing = qcs.letterSpacing;

    labEl.style.cssText = '';

    const deltaX = toLeft - from.left;

    const dirX = Math.sign(deltaX) || 1;
    let stopContrails = () => {};

    return new Promise((resolve) => {
      void shell.offsetWidth;
      requestAnimationFrame(() => {
        stopContrails = runLabContrails(shell, portal, dirX);
        shell.style.transition = `transform ${ms}ms ${FLY_EASE}`;
        shell.style.transform = buildFlyTransform(from.left + deltaX, flyTop);
        onTransitionEnd(shell, 'transform', ms, 100).then(() => {
          stopContrails();
          resolve({ shell, hold, deltaX, stopContrails });
        });
      });
    });
  }

  function placeFixed(el, rect, scaleX = 1, scaleY = 1) {
    const rules = [
      'position:fixed',
      'left:0',
      'top:0',
      'margin:0',
      'z-index:10003',
      'visibility:visible',
      'pointer-events:none',
      'opacity:1',
      `transform:${buildFlyTransform(rect.left, rect.top, scaleX, scaleY)}`,
      'transform-origin:0 0',
      'animation:none',
      'transition:none',
      'box-sizing:border-box',
    ];
    if (isLogoPiece(el)) {
      rules.push(`width:${rect.width}px`, `height:${rect.height}px`);
    } else if (isTinylabPiece(el)) {
      // Keep natural image box; scale via transform so end size matches target without a jump.
      rules.push('width:auto', 'height:auto');
    } else {
      rules.push('width:auto', 'height:auto');
    }
    el.style.cssText = rules.join(';');
  }

  function slideTo(el, from, to, ms = FLY_MS, innerFromRect = null) {
    return new Promise((resolve) => {
      placeFixed(el, from);
      void el.offsetWidth;

      requestAnimationFrame(() => {
        const innerFrom = isTinylabPiece(el)
          ? innerFromRect || rectOf(tinylabWordmarkEl(el))
          : null;
        const { scaleX: endScaleX, scaleY: endScaleY } = flyScale(el, from, to, innerFrom);
        const dest = flyDestination(el, from, to, innerFrom, endScaleX, endScaleY);
        el.style.transition = `transform ${ms}ms ${FLY_EASE}`;
        el.style.transform = buildFlyTransform(dest.left, dest.top, endScaleX, endScaleY);
        onTransitionEnd(el, 'transform', ms, 100).then(resolve);
      });
    });
  }

  function warmupTinylabPaint(intro) {
    const flyWordmark = intro.querySelector('.intro-fly--Tinylab .hero-tinylab-wordmark');
    const heroWordmark = document.querySelector('main.home .hero-tinylab-wordmark');
    [flyWordmark, heroWordmark].forEach((el) => {
      if (!el) return;
      void el.offsetWidth;
      void el.getBoundingClientRect();
    });
  }

  function loadTinylabImage(intro) {
    const imgs = [
      intro?.querySelector('.intro-fly--Tinylab .hero-tinylab-wordmark'),
      document.querySelector('main.home .hero-tinylab-wordmark'),
    ].filter(Boolean);

    return Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          })
      )
    );
  }

  function captureFlyerAnchor(introEl, questionEl) {
    const stage = introEl?.querySelector('.home-intro__stage');
    if (!stage || !questionEl) return;
    const anchorTop = rectOf(questionEl).top - rectOf(stage).top;
    introEl.style.setProperty('--intro-flyer-anchor-top', `${Math.round(anchorTop)}px`);
  }

  async function runIntro() {
    const intro = document.getElementById('home-intro');
    const portal = intro?.querySelector('.home-intro__fly-portal');
    const line1 = intro?.querySelector('.home-intro__line--1');
    const line2 = intro?.querySelector('.home-intro__line--2');
    const labEl = intro?.querySelector('.home-intro__lab');
    const labSlot = intro?.querySelector('.home-intro__lab-slot');
    const sampleEl = intro?.querySelector('.home-intro__sample');
    const labWrap = intro?.querySelector('.home-intro__lab-wrap');
    const question = intro?.querySelector('.home-intro__question');
    const flyer = intro?.querySelector('.home-intro__flyer');

    const items = PIECES.map((p) => ({
      ...p,
      flyEl: intro?.querySelector(p.fly),
      targetEl: p.target ? document.querySelector(p.target) : null,
    }));

    if (
      !intro ||
      !portal ||
      !line1 ||
      !line2 ||
      !labEl ||
      !labSlot ||
      !sampleEl ||
      !flyer ||
      items.some((p) => !p.flyEl || (p.target && !p.targetEl))
    ) {
      finishImmediate();
      return;
    }

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        /* ignore */
      }
    }
    await loadTinylabImage(intro);
    warmupTinylabPaint(intro);
    await nextFrame();

    markPageFadeTargets();
    hideRealTargets();

    intro.classList.add('is-active');

    labSlot.style.width = `${rectOf(labEl).width}px`;

    line1.classList.add('is-visible');
    await wait(920);
    line2.classList.add('is-visible');
    await wait(LINE2_LAB_FLY_DELAY_MS);

    const labStart = rectOf(labEl);
    const sampleRect = rectOf(sampleEl);
    const slotRect = rectOf(labSlot);
    const labEndLeft = slotRect.left;
    const flyTop = sampleRect.top;

    let labFly = null;
    if (labWrap) {
      labFly = await flyLabHorizontal(
        labWrap,
        labEl,
        question,
        portal,
        labStart,
        labEndLeft,
        flyTop,
        LAB_BRING_MS
      );
    }
    await wait(LAB_SETTLE_MS);

    captureFlyerAnchor(intro, question);

    if (labFly?.shell) {
      await runPairVanish(labFly.shell, sampleEl, labFly.deltaX, question);
    } else {
      question.classList.add('is-vanish');
      await wait(VANISH_MS + 40);
    }
    await wait(40);

    labFly?.stopContrails?.();
    labFly?.hold?.remove();
    labFly?.shell?.remove();
    portal.querySelectorAll('.home-intro__lab-trail').forEach((el) => el.remove());
    question.hidden = true;
    flyer.hidden = false;
    void flyer.offsetWidth;
    flyer.classList.add('is-visible');

    const dividerEl = intro.querySelector('.intro-fly--divider');
    const meetEl = items.find((p) => p.key === 'meet').flyEl;
    const TinylabEl = items.find((p) => p.key === 'Tinylab').flyEl;
    const markEl = items.find((p) => p.key === 'logo').flyEl;

    meetEl.classList.add('is-flash');
    await wait(340);
    TinylabEl.classList.add('is-flash');
    void TinylabEl.offsetWidth;
    markEl.classList.add('is-flash');
    if (dividerEl) dividerEl.classList.add('is-flash');
    await wait(960);

    items.forEach((p) => {
      p.flyEl.classList.remove('is-flash');
      p.flyEl.style.opacity = '1';
    });

    if (dividerEl) {
      dividerEl.classList.remove('is-flash');
      dividerEl.style.removeProperty('animation');
      dividerEl.style.opacity = '1';
    }

    const tinylabPiece = items.find((p) => p.key === 'Tinylab');
    if (tinylabPiece?.flyEl && tinylabPiece?.targetEl) {
      syncTinylabFlyStyles(tinylabPiece.flyEl, tinylabPiece.targetEl);
    }

    const starts = items.map((p) => {
      const rect = rectOf(p.flyEl);
      const innerRect = isTinylabPiece(p.flyEl) ? rectOf(tinylabWordmarkEl(p.flyEl)) : null;
      return { piece: p, rect, innerRect };
    });
    const dividerStart = dividerEl ? rectOf(dividerEl) : null;

    portal.append(...items.map((p) => p.flyEl));
    if (dividerEl) portal.append(dividerEl);

    starts.forEach(({ piece, rect }) => placeFixed(piece.flyEl, rect));
    if (dividerEl && dividerStart) placeFixedDivider(dividerEl, dividerStart);

    intro.classList.add('is-flying');
    await nextFrame();

    const html = document.documentElement;
    html.classList.add('intro-reveal');
    await nextFrame();

    if (tinylabPiece?.flyEl && tinylabPiece?.targetEl) {
      syncTinylabFlyStyles(tinylabPiece.flyEl, tinylabPiece.targetEl);
      await nextFrame();
      const tinylabIndex = items.indexOf(tinylabPiece);
      if (tinylabIndex >= 0) {
        starts[tinylabIndex].rect = rectOf(tinylabPiece.flyEl);
        starts[tinylabIndex].innerRect = rectOf(tinylabWordmarkEl(tinylabPiece.flyEl));
        placeFixed(tinylabPiece.flyEl, starts[tinylabIndex].rect);
      }
    }

    const ends = items.map((p) => rectOf(p.targetEl));

    const flyTasks = [
      Promise.all(
        starts.map(({ piece, rect, innerRect }, i) =>
          slideTo(piece.flyEl, rect, ends[i], FLY_MS, innerRect)
        )
      ),
    ];
    if (dividerEl) flyTasks.push(shrinkDivider(dividerEl, FLY_MS, FLY_EASE));

    await Promise.all(flyTasks);

    items.forEach((p, i) => {
      const end = ends[i];
      const start = starts[i].rect;
      const innerStart = starts[i].innerRect;
      if (isMeetPiece(p.flyEl)) {
        placeFixed(p.flyEl, meetFlyRect(p.flyEl, end));
        return;
      }
      const { scaleX, scaleY } = flyScale(p.flyEl, start, end, innerStart);
      if (isTinylabPiece(p.flyEl)) {
        const ox = (innerStart?.left ?? start.left) - start.left;
        const oy = (innerStart?.top ?? start.top) - start.top;
        const dest = {
          left: end.left - ox * scaleX,
          top: end.top - oy * scaleY,
          width: start.width,
          height: start.height,
        };
        placeFixed(p.flyEl, dest, scaleX, scaleY);
        return;
      }
      placeFixed(p.flyEl, end, scaleX, scaleY);
    });

    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {
      /* ignore */
    }

    await wait(REVEAL_MS);

    showRealTargets();
    items.forEach((p) => p.flyEl.remove());
    dividerEl?.remove();

    html.classList.remove('intro-pending', 'intro-reveal');
    html.classList.add('intro-done');
    intro.remove();
  }

  function init() {
    const html = document.documentElement;
    if (!html.classList.contains('intro-pending')) {
      finishImmediate();
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishImmediate();
      return;
    }

    runIntro().catch(finishImmediate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
