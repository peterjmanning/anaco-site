(function () {
  'use strict';

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

  function syncCardHeights(root, cards) {
    var prevMins = Array.prototype.map.call(cards, function (card) {
      return card.style.minHeight;
    });

    cards.forEach(function (card) {
      card.style.minHeight = 'auto';
    });

    var maxHeight = 0;
    cards.forEach(function (card) {
      maxHeight = Math.max(maxHeight, Math.round(card.offsetHeight));
    });

    cards.forEach(function (card, index) {
      card.style.minHeight = prevMins[index];
    });

    var next = maxHeight + 'px';
    if (root.style.getPropertyValue('--why-card-height') !== next) {
      root.style.setProperty('--why-card-height', next);
    }
  }

  function updateWhyCascadeLayout() {
    var root = document.querySelector('.why-cascade');
    if (!root) return;

    var cards = root.querySelectorAll('.why-cascade-card');
    if (cards.length < 4) return;

    var width = root.offsetWidth;
    if (!width) return;

    var isStacked = width <= 640;
    if (isStacked) {
      root.style.removeProperty('--why-card-height');
      return;
    }

    syncCardHeights(root, cards);
    void root.offsetHeight;

    var rootRect = root.getBoundingClientRect();
    var rects = Array.prototype.map.call(cards, function (card) {
      return relRect(card.getBoundingClientRect(), rootRect);
    });

    positionChevrons(root, hubPoints(rects));
  }

  var resizeTimer;
  function scheduleUpdate() {
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
        var observer = new ResizeObserver(scheduleUpdate);
        observer.observe(root);
        root.querySelectorAll('.why-cascade-card').forEach(function (card) {
          observer.observe(card);
        });
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
