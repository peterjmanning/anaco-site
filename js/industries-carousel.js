(function () {
  'use strict';

  var EXPAND_MS = 520;
  var DETAIL_MS = 320;
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var TILE_RATIO = 9 / 16;
  var EXPAND_RATIO = 21 / 9;

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

  function imageBaseName(imgPath) {
    return imgPath.replace(/^images\//, '').replace(/\.(jpe?g|png|webp)$/i, '');
  }

  function gridThumbSrc(imgPath) {
    return 'images/grid/' + imageBaseName(imgPath) + '.jpg';
  }

  function gridWideSrc(imgPath) {
    return 'images/grid/' + imageBaseName(imgPath) + '-wide.jpg';
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function ensureWideImage(tile, imgPath) {
    var img = tile.querySelector('.industry-grid-item__media img');
    if (!img || img.dataset.wideLoaded === '1') {
      return Promise.resolve();
    }
    var wide = gridWideSrc(imgPath);
    var fallback = imgPath;
    return loadImage(wide)
      .then(function () {
        img.src = wide;
        img.dataset.wideLoaded = '1';
      })
      .catch(function () {
        return loadImage(fallback).then(function () {
          img.src = fallback;
          img.dataset.wideLoaded = '1';
        });
      });
  }

  function initIndustriesGrid() {
    var data = window.INDUSTRIES_DATA;
    var grid = document.getElementById('industriesGrid');
    if (!data || !grid) return;

    data.forEach(function (item, index) {
      grid.appendChild(buildIndustryTile(item, index));
    });
    grid.appendChild(buildMoreTile(data.length));

    grid.addEventListener('click', onGridClick);
    document.addEventListener('keydown', onDocumentKeydown);
  }

  function industryDescription(item) {
    if (!item.cases || !item.cases.length) return '';
    return item.cases[0].text || '';
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
    img.src = gridThumbSrc(item.img);
    img.dataset.fallback = item.img;
    img.addEventListener('error', function onImgError() {
      if (img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      img.src = item.img;
    });
    media.appendChild(img);

    var overlay = document.createElement('div');
    overlay.className = 'industry-grid-item__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var desc = industryDescription(item);
    if (desc) {
      var descEl = document.createElement('p');
      descEl.className = 'industry-grid-item__desc';
      descEl.textContent = desc;
      overlay.appendChild(descEl);
    }

    var title = document.createElement('span');
    title.className = 'industry-grid-item__title';
    title.textContent = item.title;
    overlay.appendChild(title);

    var detail = document.createElement('div');
    detail.className = 'industry-grid-item__detail';
    detail.hidden = true;
    detail.innerHTML = buildDetailHtml(item);

    btn.addEventListener('mouseenter', function () {
      ensureWideImage(btn, item.img);
    });

    btn.appendChild(media);
    btn.appendChild(overlay);
    btn.appendChild(detail);
    return btn;
  }

  function buildDetailHtml(item) {
    var casesHtml = (item.cases || [])
      .map(function (c) {
        return (
          '<article class="industry-case">' +
          '<div class="industry-case__icon">' +
          c.icon +
          '</div>' +
          '<div class="industry-case__label">' +
          escapeHtml(c.label) +
          '</div>' +
          '<h4 class="industry-case__head">' +
          escapeHtml(c.head) +
          '</h4>' +
          '<p class="industry-case__text">' +
          escapeHtml(c.text) +
          '</p>' +
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
      '<p class="industry-grid-item__detail-kicker">Industry</p>' +
      '<h3 class="industry-grid-item__detail-heading">' +
      escapeHtml(item.heading || item.title) +
      '</h3>' +
      '<div class="industry-grid-item__cases">' +
      casesHtml +
      '</div>' +
      '<div class="industry-grid-item__detail-actions">' +
      '<a href="shop/" class="industry-grid-item__link industry-grid-item__link--accent">Shop &rarr;</a>' +
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
      '<div class="industry-grid-item__more-inner pattern-hatch">' +
      '<div class="industry-grid-item__more-body">' +
      '<span class="industry-grid-item__more-lead">Don\'t see your industry?</span>' +
      '<span class="industry-grid-item__more-cta">Contact us &rarr;</span>' +
      '<span class="industry-grid-item__more-text">Find out how TinyLab can streamline your team\'s analysis today.</span>' +
      '</div>' +
      '<span class="industry-grid-item__title">...And more</span>' +
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
    var cellH = cellW / TILE_RATIO;
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

  function showDetail(tile, show) {
    var detail = tile.querySelector('.industry-grid-item__detail');
    if (!detail) return;
    if (show) {
      detail.hidden = false;
      requestAnimationFrame(function () {
        tile.classList.add('is-detail-visible');
      });
    } else {
      tile.classList.remove('is-detail-visible');
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
    var imgPath = tile.dataset.imgPath;
    var siblings = rowSiblings(grid, index);
    var from = rectCopy(tile.getBoundingClientRect());
    var to = getExpandTargetRect(grid, from);

    if (prefersReducedMotion()) {
      ensureWideImage(tile, imgPath).finally(function () {
        siblings.forEach(function (el) {
          el.classList.add('is-row-collapsed');
        });
        tile.classList.add('is-expanded');
        tile.setAttribute('aria-expanded', 'true');
        grid.classList.add('has-expanded');
        showDetail(tile, true);
      });
      return;
    }

    grid.classList.add('is-animating');
    fadeSiblings(siblings, false);

    ensureWideImage(tile, imgPath).finally(function () {
      var tileSpacer = createSpacer('industry-grid-spacer', '9 / 16');
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
      });
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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndustriesGrid);
  } else {
    initIndustriesGrid();
  }
})();
