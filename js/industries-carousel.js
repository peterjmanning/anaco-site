(function () {
  'use strict';

  var EXPAND_MS = 520;
  var DETAIL_MS = 320;
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var TILE_RATIO = 9 / 16;
  var EXPAND_RATIO = 21 / 9;

  function getIndustriesRoot() {
    return document.querySelector('.home #industries');
  }

  function getTileAspectRatioCss() {
    var root = getIndustriesRoot();
    if (!root) return '9 / 16';
    var ratio = getComputedStyle(root).getPropertyValue('--industry-tile-ratio').trim();
    return ratio || '9 / 16';
  }

  function getTileRatio() {
    var css = getTileAspectRatioCss();
    var parts = css.split('/').map(function (part) {
      return parseFloat(part.trim());
    });
    if (parts.length === 2 && parts[0] && parts[1]) {
      return parts[0] / parts[1];
    }
    return TILE_RATIO;
  }

  function getGridCols(grid) {
    var template = window.getComputedStyle(grid).gridTemplateColumns;
    var cols = template.split(' ').filter(function (part) {
      return part && part !== '0px';
    }).length;
    return cols || 4;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initIndustriesGrid() {
    var data = window.INDUSTRIES_DATA;
    var grid = document.getElementById('industriesGrid');
    if (!data || !grid) return;

    data.forEach(function (item, index) {
      grid.appendChild(buildIndustryTile(item, index));
    });

    grid.addEventListener('click', onGridClick);
    document.addEventListener('keydown', onDocumentKeydown);
    bindIndustryTitleFitting(grid);
    if (typeof window.refreshScrollReveal === 'function') {
      window.refreshScrollReveal();
    }
  }

  var titleFitTimer;
  function scheduleIndustryTitleFit() {
    window.clearTimeout(titleFitTimer);
    titleFitTimer = window.setTimeout(fitAllIndustryTitles, 50);
  }

  function fitIndustryTitle(title) {
    var tile = title.closest('.industry-grid-item');
    if (!tile || tile.classList.contains('is-expanded') || tile.classList.contains('is-flight')) {
      title.style.removeProperty('font-size');
      return;
    }

    var overlay = title.closest('.industry-grid-item__overlay');
    if (!overlay) return;

    title.style.removeProperty('font-size');
    var size = parseFloat(window.getComputedStyle(title).fontSize);
    var minSize = 10;
    var overlayStyle = window.getComputedStyle(overlay);
    var padLeft = parseFloat(overlayStyle.paddingLeft);
    var padRight = parseFloat(overlayStyle.paddingRight);
    var padBottom = parseFloat(overlayStyle.paddingBottom);
    var maxWidth = overlay.clientWidth - padLeft - padRight;

    function overflows() {
      var overlayRect = overlay.getBoundingClientRect();
      var titleRect = title.getBoundingClientRect();
      return (
        title.scrollWidth > maxWidth + 1 ||
        titleRect.bottom > overlayRect.bottom - padBottom + 0.5 ||
        titleRect.left < overlayRect.left + padLeft - 0.5
      );
    }

    var guard = 0;
    while (size > minSize && overflows() && guard < 140) {
      size -= 0.5;
      title.style.fontSize = size + 'px';
      guard += 1;
    }
  }

  function fitAllIndustryTitles() {
    document.querySelectorAll('#industries .industry-grid-item__title').forEach(fitIndustryTitle);
  }

  function bindIndustryTitleFitting(grid) {
    scheduleIndustryTitleFit();

    window.addEventListener('resize', scheduleIndustryTitleFit, { passive: true });
    window.addEventListener('load', scheduleIndustryTitleFit, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleIndustryTitleFit, { passive: true });
    }

    if (typeof ResizeObserver !== 'undefined') {
      var observer = new ResizeObserver(function () {
        scheduleIndustryTitleFit();
        var expanded = grid.querySelector('.industry-grid-item.is-expanded.is-detail-visible');
        if (expanded) syncDetailScrollMode(expanded);
      });
      observer.observe(grid);
      grid.querySelectorAll('.industry-grid-item').forEach(function (tile) {
        observer.observe(tile);
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleIndustryTitleFit);
    }
  }

  function formatIndustryTitle(title) {
    var amp = title.indexOf('&');
    if (amp !== -1) {
      var before = title.slice(0, amp).trim();
      var after = title.slice(amp + 1).trim();
      if (before && after) {
        return before + ' &\n' + after;
      }
    }
    return title.split(/\s+/).join('\n');
  }

  function buildIndustryTile(item, index) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'industry-grid-item';
    btn.dataset.index = String(index);
    btn.dataset.industryId = item.id;
    btn.dataset.imgPath = item.img;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', item.title);

    var media = document.createElement('div');
    media.className = 'industry-grid-item__media';

    var img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.src = item.img;
    media.appendChild(img);

    var overlay = document.createElement('div');
    overlay.className = 'industry-grid-item__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var hint = document.createElement('p');
    hint.className = 'industry-grid-item__hint';
    hint.textContent = 'Click to learn more \u2192';
    overlay.appendChild(hint);

    var title = document.createElement('span');
    title.className = 'industry-grid-item__title';
    title.textContent = item.tileTitle || formatIndustryTitle(item.title);
    overlay.appendChild(title);

    var detail = document.createElement('div');
    detail.className = 'industry-grid-item__detail';
    detail.hidden = true;
    detail.innerHTML = buildDetailHtml(item);

    btn.appendChild(media);
    btn.appendChild(overlay);
    btn.appendChild(detail);
    return btn;
  }

  function caseParagraphsHtml(caseItem) {
    var paragraphs = caseItem.paragraphs;
    if (!paragraphs || !paragraphs.length) {
      if (caseItem.text) {
        paragraphs = [caseItem.text];
      } else {
        return '';
      }
    }

    return (
      '<ul class="industry-case__list">' +
      paragraphs
        .map(function (paragraph) {
          return '<li class="industry-case__text">' + escapeHtml(paragraph) + '</li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function buildDetailHtml(item) {
    var caseCount = (item.cases || []).length;
    var casesHtml = (item.cases || [])
      .map(function (c) {
        return (
          '<article class="industry-case">' +
          (c.label
            ? '<div class="industry-case__label">' + escapeHtml(c.label) + '</div>'
            : '') +
          '<h4 class="industry-case__head">' +
          escapeHtml(c.head) +
          '</h4>' +
          '<div class="industry-case__body">' +
          caseParagraphsHtml(c) +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    return (
      '<button type="button" class="industry-grid-item__close" aria-label="Minimize">' +
      '<svg class="industry-grid-item__close-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
      '<path d="M5 10h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg></button>' +
      '<div class="industry-grid-item__detail-inner">' +
      '<div class="industry-grid-item__detail-header">' +
      '<p class="industry-grid-item__detail-kicker">Industry</p>' +
      '<h3 class="industry-grid-item__detail-heading">' +
      escapeHtml(item.heading || item.title) +
      '</h3>' +
      '</div>' +
      '<div class="industry-grid-item__cases" style="--industry-case-count:' + caseCount + '">' +
      casesHtml +
      '</div>' +
      '<div class="industry-grid-item__detail-actions">' +
      '<a href="shop/" class="industry-grid-item__link industry-grid-item__link--accent">Order &rarr;</a>' +
      '</div>' +
      '</div>'
    );
  }

  function buildMoreTile(index) {
    var link = document.createElement('a');
    link.href = '#contact';
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var target = document.getElementById('contact');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
    link.className = 'industry-grid-item industry-grid-item--more';
    link.dataset.index = String(index);
    link.setAttribute('aria-label', 'Don\'t see your industry? Contact us');

    link.innerHTML =
      '<div class="industry-grid-item__more-inner">' +
      '<div class="industry-grid-item__more-body">' +
      '<span class="industry-grid-item__more-lead">Don\'t see your industry?</span>' +
      '<span class="industry-grid-item__more-cta">Contact us &rarr;</span>' +
      '<span class="industry-grid-item__more-text">Find out how Tinylab can streamline your team\'s analysis today.</span>' +
      '</div>' +
      '<span class="industry-grid-item__title">And\nMore...</span>' +
      '</div>';

    return link;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rectCopy(rect) {
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }

  function setFlightStyles(tile, rect) {
    tile.style.position = 'fixed';
    tile.style.top = rect.top + 'px';
    tile.style.left = rect.left + 'px';
    tile.style.width = rect.width + 'px';
    tile.style.height = rect.height + 'px';
    tile.style.margin = '0';
    tile.style.zIndex = '60';
    tile.style.boxSizing = 'border-box';
    tile.style.maxWidth = 'none';
    tile.style.maxHeight = 'none';
  }

  function clearFlightStyles(tile) {
    tile.style.position = '';
    tile.style.top = '';
    tile.style.left = '';
    tile.style.width = '';
    tile.style.height = '';
    tile.style.margin = '';
    tile.style.zIndex = '';
    tile.style.boxSizing = '';
    tile.style.maxWidth = '';
    tile.style.maxHeight = '';
    tile.style.transition = '';
    tile.style.transform = '';
    tile.style.transformOrigin = '';
  }

  function createSpacer(className, aspectRatio) {
    var spacer = document.createElement('div');
    spacer.className = className;
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.width = '100%';
    spacer.style.aspectRatio = aspectRatio;
    spacer.style.visibility = 'hidden';
    spacer.style.pointerEvents = 'none';
    return spacer;
  }

  function getExpandTargetRect(grid, fromRect) {
    var gridRect = grid.getBoundingClientRect();
    return {
      top: fromRect.top,
      left: gridRect.left,
      width: gridRect.width,
      height: gridRect.width / EXPAND_RATIO,
    };
  }

  function getTileTargetRect(grid, index) {
    var cols = getGridCols(grid);
    var col = index % cols;
    var row = Math.floor(index / cols);
    var gridRect = grid.getBoundingClientRect();
    var cellW = gridRect.width / cols;
    var cellH = cellW / getTileRatio();
    return {
      top: gridRect.top + row * cellH,
      left: gridRect.left + col * cellW,
      width: cellW,
      height: cellH,
    };
  }

  function animateFlight(tile, from, to, ms, onDone) {
    setFlightStyles(tile, from);
    tile.classList.add('is-flight');
    tile.style.transition = 'none';
    tile.style.transform = 'translateZ(0)';

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      tile.removeEventListener('transitionend', onTransitionEnd);
      setFlightStyles(tile, to);
      tile.style.transition = 'none';
      tile.style.transform = 'translateZ(0)';
      onDone();
    }

    function onTransitionEnd(event) {
      if (event.target !== tile) return;
      if (event.propertyName === 'width' || event.propertyName === 'height') finish();
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        tile.style.transition =
          'top ' +
          ms +
          'ms ' +
          EASE +
          ', left ' +
          ms +
          'ms ' +
          EASE +
          ', width ' +
          ms +
          'ms ' +
          EASE +
          ', height ' +
          ms +
          'ms ' +
          EASE;
        tile.style.top = to.top + 'px';
        tile.style.left = to.left + 'px';
        tile.style.width = to.width + 'px';
        tile.style.height = to.height + 'px';
        tile.addEventListener('transitionend', onTransitionEnd);
        window.setTimeout(finish, ms + 80);
      });
    });
  }

  function fadeSiblings(siblings, visible) {
    siblings.forEach(function (el) {
      el.classList.toggle('is-row-fading', !visible);
    });
  }

  function syncDetailScrollMode(tile) {
    var detail = tile && tile.querySelector('.industry-grid-item__detail');
    if (!detail) return;

    window.requestAnimationFrame(function () {
      var canScroll = detail.scrollHeight > detail.clientHeight + 1;
      detail.style.overflowY = canScroll ? 'auto' : 'visible';
    });
  }

  function showDetail(tile, show) {
    var detail = tile.querySelector('.industry-grid-item__detail');
    if (!detail) return;
    if (show) {
      detail.hidden = false;
      requestAnimationFrame(function () {
        tile.classList.add('is-detail-visible');
        syncDetailScrollMode(tile);
      });
    } else {
      tile.classList.remove('is-detail-visible');
      detail.style.removeProperty('overflow-y');
      window.setTimeout(function () {
        if (!tile.classList.contains('is-expanded')) {
          detail.hidden = true;
        }
      }, DETAIL_MS);
    }
  }

  function rowSiblings(grid, index) {
    var cols = getGridCols(grid);
    var row = Math.floor(index / cols);
    return Array.prototype.filter.call(
      grid.querySelectorAll('.industry-grid-item[data-index]'),
      function (el) {
        var i = Number(el.dataset.index);
        return Math.floor(i / cols) === row && i !== index;
      }
    );
  }

  function onGridClick(event) {
    var closeBtn = event.target.closest('.industry-grid-item__close');
    if (closeBtn) {
      event.preventDefault();
      collapseExpanded(closeBtn.closest('.industries-grid'));
      return;
    }

    var tile = event.target.closest('.industry-grid-item:not(.industry-grid-item--more)');
    if (!tile) return;

    var grid = tile.closest('.industries-grid');
    if (!grid || grid.classList.contains('is-animating')) return;
    if (tile.classList.contains('is-expanded') || tile.classList.contains('is-flight')) return;

    expandTile(grid, tile);
  }

  function onDocumentKeydown(event) {
    if (event.key !== 'Escape') return;
    var grid = document.querySelector('.industries-grid.has-expanded');
    if (grid && !grid.classList.contains('is-animating')) {
      collapseExpanded(grid);
    }
  }

  function expandTile(grid, tile) {
    if (grid.classList.contains('has-expanded')) {
      collapseExpanded(grid, function () {
        expandTile(grid, tile);
      });
      return;
    }

    var index = Number(tile.dataset.index);
    var siblings = rowSiblings(grid, index);
    var from = rectCopy(tile.getBoundingClientRect());
    var to = getExpandTargetRect(grid, from);

    if (prefersReducedMotion()) {
      siblings.forEach(function (el) {
        el.classList.add('is-row-collapsed');
      });
      tile.classList.add('is-expanded');
      tile.setAttribute('aria-expanded', 'true');
      grid.classList.add('has-expanded');
      showDetail(tile, true);
      scheduleIndustryTitleFit();
      return;
    }

    grid.classList.add('is-animating');
    fadeSiblings(siblings, false);

    var tileSpacer = createSpacer('industry-grid-spacer', getTileAspectRatioCss());
    tile.insertAdjacentElement('afterend', tileSpacer);

    animateFlight(tile, from, to, EXPAND_MS, function () {
        tile.classList.remove('is-flight');
        clearFlightStyles(tile);
        tileSpacer.remove();

        tile.classList.add('is-expanded');
        tile.setAttribute('aria-expanded', 'true');
        grid.classList.add('has-expanded');

        siblings.forEach(function (el) {
          el.classList.remove('is-row-fading');
          el.classList.add('is-row-collapsed');
        });

        grid.classList.remove('is-animating');
        showDetail(tile, true);
        scheduleIndustryTitleFit();
      });
  }

  function collapseExpanded(grid, onSettled) {
    if (!grid) return;

    var expanded = grid.querySelector('.industry-grid-item.is-expanded');
    if (!expanded) {
      if (onSettled) onSettled();
      return;
    }
    if (grid.classList.contains('is-animating')) return;

    var index = Number(expanded.dataset.index);
    var siblings = rowSiblings(grid, index);
    var from = rectCopy(expanded.getBoundingClientRect());

    showDetail(expanded, false);

    if (prefersReducedMotion()) {
      expanded.classList.remove('is-expanded', 'is-detail-visible');
      expanded.setAttribute('aria-expanded', 'false');
      grid.classList.remove('has-expanded');
      siblings.forEach(function (el) {
        el.classList.remove('is-row-collapsed', 'is-row-fading');
      });
      if (onSettled) onSettled();
      scheduleIndustryTitleFit();
      return;
    }

    grid.classList.add('is-animating');

    setFlightStyles(expanded, from);
    expanded.classList.add('is-flight');
    expanded.style.transform = 'translateZ(0)';

    var rowSpacer = createSpacer('industry-grid-spacer industry-grid-spacer--row', '21 / 9');
    rowSpacer.style.gridColumn = '1 / -1';
    expanded.insertAdjacentElement('beforebegin', rowSpacer);

    expanded.classList.remove('is-expanded');
    grid.classList.remove('has-expanded');
    expanded.setAttribute('aria-expanded', 'false');
    siblings.forEach(function (el) {
      el.classList.remove('is-row-collapsed');
    });

    var to = getTileTargetRect(grid, index);

    animateFlight(expanded, from, to, EXPAND_MS, function () {
      expanded.classList.remove('is-flight', 'is-detail-visible');
      clearFlightStyles(expanded);
      rowSpacer.remove();

      siblings.forEach(function (el) {
        el.classList.remove('is-row-fading');
      });

      grid.classList.remove('is-animating');
      var detail = expanded.querySelector('.industry-grid-item__detail');
      if (detail) detail.hidden = true;
      if (onSettled) onSettled();
      scheduleIndustryTitleFit();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndustriesGrid);
  } else {
    initIndustriesGrid();
  }
})();
