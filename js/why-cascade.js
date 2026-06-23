(function () {
  'use strict';

  var MARKER_ID = 'why-cascade-arrowhead';
  var END_INSET = 3;

  // Context → Problem → Solution; Context → Evolution → Solution
  var PANEL_LINKS = [
    { from: 0, to: 1, axis: 'horizontal' },
    { from: 1, to: 3, axis: 'vertical' },
    { from: 0, to: 2, axis: 'vertical' },
    { from: 2, to: 3, axis: 'horizontal' }
  ];

  function ensureMarker(svg) {
    var defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }

    if (svg.querySelector('#' + MARKER_ID)) return;

    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', MARKER_ID);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');

    var head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', 'M0,0 L10,5 L0,10');
    head.setAttribute('fill', 'none');
    head.setAttribute('stroke', '#0a0a0a');
    head.setAttribute('stroke-width', '1.5');
    head.setAttribute('stroke-linecap', 'square');
    head.setAttribute('stroke-linejoin', 'miter');

    marker.appendChild(head);
    defs.appendChild(marker);
  }

  function panelPath(fromRect, toRect, rootRect, axis) {
    if (axis === 'horizontal') {
      var y = fromRect.top - rootRect.top + fromRect.height / 2;
      var x1 = fromRect.left - rootRect.left + fromRect.width;
      var x2 = toRect.left - rootRect.left - END_INSET;
      return 'M ' + round(x1) + ' ' + round(y) + ' L ' + round(x2) + ' ' + round(y);
    }

    var x = fromRect.left - rootRect.left + fromRect.width / 2;
    var y1 = fromRect.top - rootRect.top + fromRect.height;
    var y2 = toRect.top - rootRect.top - END_INSET;
    return 'M ' + round(x) + ' ' + round(y1) + ' L ' + round(x) + ' ' + round(y2);
  }

  function updateWhyCascadeConnectors() {
    var root = document.querySelector('.why-cascade');
    if (!root) return;

    var svg = root.querySelector('.why-cascade__connectors');
    if (!svg) return;

    var cards = root.querySelectorAll('.why-cascade-card');
    if (cards.length < 2) {
      svg.innerHTML = '';
      return;
    }

    var width = root.offsetWidth;
    var height = root.offsetHeight;
    if (!width || !height) return;

    var rootRect = root.getBoundingClientRect();
    var isStacked = width <= 640;

    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    svg.querySelectorAll('.why-cascade__connector').forEach(function (node) {
      node.remove();
    });

    ensureMarker(svg);

    if (isStacked) {
      for (var i = 0; i < cards.length - 1; i++) {
        var fromStack = cards[i].getBoundingClientRect();
        var toStack = cards[i + 1].getBoundingClientRect();
        var sx = fromStack.left - rootRect.left + fromStack.width / 2;
        var sy1 = fromStack.top - rootRect.top + fromStack.height;
        var sy2 = toStack.top - rootRect.top - END_INSET;

        appendConnector(svg, 'M ' + round(sx) + ' ' + round(sy1) + ' L ' + round(sx) + ' ' + round(sy2));
      }
      return;
    }

    PANEL_LINKS.forEach(function (link) {
      var from = cards[link.from];
      var to = cards[link.to];
      if (!from || !to) return;

      appendConnector(
        svg,
        panelPath(from.getBoundingClientRect(), to.getBoundingClientRect(), rootRect, link.axis)
      );
    });
  }

  function appendConnector(svg, d) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'why-cascade__connector');
    path.setAttribute('d', d);
    path.setAttribute('marker-end', 'url(#' + MARKER_ID + ')');
    svg.appendChild(path);
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  var resizeTimer;
  function scheduleUpdate() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateWhyCascadeConnectors, 50);
  }

  function init() {
    updateWhyCascadeConnectors();

    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('load', updateWhyCascadeConnectors, { passive: true });

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
      document.fonts.ready.then(updateWhyCascadeConnectors);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
