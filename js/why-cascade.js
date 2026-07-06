(function () {
  'use strict';

  var STACK_BREAKPOINT = 640;
  var syncing = false;

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function relRect(rect, rootRect) {
    return {
      left: rect.left - rootRect.left,
      right: rect.right - rootRect.left,
      top: rect.top - rootRect.top,
      bottom: rect.bottom - rootRect.top
    };
  }

  function hubPoints(rects) {
    return {
      right: {
        x: rects[0].right,
        y: (rects[0].top + rects[0].bottom) / 2
      },
      down: {
        x: (rects[1].left + rects[1].right) / 2,
        y: rects[1].bottom
      },
      left: {
        x: rects[2].right,
        y: (rects[2].top + rects[2].bottom) / 2
      }
    };
  }

  function positionChevrons(root, hubs) {
    var map = {
      right: root.querySelector('.why-cascade__chevron--right'),
      down: root.querySelector('.why-cascade__chevron--down'),
      left: root.querySelector('.why-cascade__chevron--left')
    };

    Object.keys(map).forEach(function (key) {
      var node = map[key];
      var point = hubs[key];
      if (!node || !point) return;
      node.style.left = round(point.x) + 'px';
      node.style.top = round(point.y) + 'px';
    });
  }

  function boxPaddingHeight(node) {
    var style = window.getComputedStyle(node);
    return (
      (parseFloat(style.paddingTop) || 0) +
      (parseFloat(style.paddingBottom) || 0)
    );
  }

  function measureProblemCardHeight(card) {
    var pageBody = card.querySelector('.why-cascade-card__page-body');
    if (!pageBody) return 0;
    return Math.ceil(pageBody.scrollHeight);
  }

  function measureStandardCardHeight(card) {
    var style = window.getComputedStyle(card);
    var gap = parseFloat(style.rowGap || style.gap) || 0;
    var total = boxPaddingHeight(card);
    var children = card.children;

    for (var i = 0; i < children.length; i++) {
      if (i > 0) total += gap;
      total += children[i].scrollHeight;
    }

    return Math.ceil(total);
  }

  function measureCardHeight(card) {
    if (card.classList.contains('why-cascade-card--problem')) {
      return measureProblemCardHeight(card);
    }
    return measureStandardCardHeight(card);
  }

  function syncCardHeights(root, cards) {
    var maxHeight = 0;

    cards.forEach(function (card) {
      maxHeight = Math.max(maxHeight, measureCardHeight(card));
    });

    var next = maxHeight + 'px';
    var prev = root.style.getPropertyValue('--why-card-height');
    if (prev !== next) {
      root.style.setProperty('--why-card-height', next);
      return true;
    }

    return false;
  }

  function updateWhyCascadeLayout() {
    if (syncing) return;

    var root = document.querySelector('.why-cascade');
    if (!root) return;

    var cards = root.querySelectorAll('.why-cascade-card');
    if (cards.length < 4) return;

    var width = root.offsetWidth;
    if (!width) return;

    var isStacked = width <= STACK_BREAKPOINT;

    syncing = true;
    syncCardHeights(root, cards);
    syncing = false;

    if (isStacked) {
      return;
    }

    void root.offsetHeight;

    var rootRect = root.getBoundingClientRect();
    var rects = Array.prototype.map.call(cards, function (card) {
      return relRect(card.getBoundingClientRect(), rootRect);
    });

    positionChevrons(root, hubPoints(rects));
  }

  var resizeTimer;
  function scheduleUpdate() {
    if (syncing) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateWhyCascadeLayout, 50);
  }

  function init() {
    updateWhyCascadeLayout();

    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('load', updateWhyCascadeLayout, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      var root = document.querySelector('.why-cascade');
      if (root) {
        var observer = new ResizeObserver(function (entries) {
          var shouldUpdate = entries.some(function (entry) {
            return entry.target === root;
          });
          if (!shouldUpdate) return;
          scheduleUpdate();
        });
        observer.observe(root);
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateWhyCascadeLayout);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
