(function () {
  'use strict';

  var ICONS = {
    system:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M8 20v2M16 20v2M12 4V2"/></svg>',
    microreactor:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>',
    ptv:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 2v8M8 6l4 4 4-4"/><rect x="4" y="10" width="16" height="12" rx="2"/></svg>',
    microgc:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4"/></svg>',
    'flow-cell':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/></svg>',
  };

  function getCatalog() {
    return (window.SHOP_CATALOG && window.SHOP_CATALOG.products) || [];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderProductCard(product) {
    var imageSrc = product.image
      ? window.resolveShopAsset
        ? window.resolveShopAsset(product.image)
        : product.image
      : '';
    var imgDims =
      product.imageWidth && product.imageHeight
        ? ' width="' +
          Number(product.imageWidth) +
          '" height="' +
          Number(product.imageHeight) +
          '"'
        : '';
    var visual = imageSrc
      ? '<img class="shop-card__img" src="' +
        escapeHtml(imageSrc) +
        '" alt="' +
        escapeHtml(product.name) +
        '" loading="lazy" decoding="async"' +
        imgDims +
        '>'
      : '<div class="shop-card__icon shop-card__icon--' +
        escapeHtml(product.icon || 'system') +
        '">' +
        (ICONS[product.icon] || ICONS.system) +
        '</div>';

    var cardClass =
      'shop-card shop-card--module' +
      (product.featured ? ' shop-card--featured' : '');

    return (
      '<article class="' +
      cardClass +
      '" data-product-id="' +
      escapeHtml(product.id) +
      '">' +
      '<div class="shop-card__visual' +
      (product.featured ? ' shop-card__visual--featured' : ' shop-card__visual--plain') +
      '">' +
      visual +
      '</div>' +
      '<div class="shop-card__body">' +
      '<span class="shop-card__kicker">' +
      escapeHtml(product.kicker || '') +
      '</span>' +
      '<h3 class="shop-card__title">' +
      escapeHtml(product.name) +
      '</h3>' +
      '<div class="shop-card__desc-wrap"><p class="shop-card__desc">' +
      escapeHtml(product.description) +
      '</p></div>' +
      '<div class="shop-card__actions">' +
      '<button type="button" class="btn btn-primary shop-card__order" data-product-id="' +
      escapeHtml(product.id) +
      '">Order</button>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function renderCatalog() {
    var root = document.getElementById('shop-catalog');
    if (!root) return;

    var products = getCatalog();
    if (!products.length) {
      root.innerHTML =
        '<p class="shop-catalog-empty">No products configured. Add items to <code>js/shop-catalog.js</code>.</p>';
      return;
    }

    var featured = products.filter(function (p) {
      return p.featured;
    });
    var modules = products.filter(function (p) {
      return !p.featured;
    });

    var html = '';
    if (featured.length) {
      html +=
        '<div class="shop-catalog__featured">' +
        featured.map(renderProductCard).join('') +
        '</div>';
    }
    if (modules.length) {
      html +=
        '<div class="shop-catalog__modules">' +
        modules.map(renderProductCard).join('') +
        '</div>';
    }

    root.innerHTML = html;
    syncFeaturedCardLayout();
  }

  function syncFeaturedCardLayout() {
    var stackedFeatured = window.matchMedia('(max-width: 1100px)').matches;
    document.querySelectorAll('.shop-card--featured').forEach(function (card) {
      if (stackedFeatured) {
        card.style.removeProperty('--shop-featured-media-w');
        return;
      }

      var img = card.querySelector('.shop-card__img');
      var visual = card.querySelector('.shop-card__visual--featured');
      if (!img || !visual) return;

      function measure() {
        card.style.setProperty('--shop-featured-media-w', visual.offsetWidth + 'px');
      }

      if (img.complete) {
        measure();
      } else {
        img.addEventListener('load', measure, { once: true });
      }
    });
  }

  var featuredLayoutTimer;
  function scheduleFeaturedCardLayout() {
    window.clearTimeout(featuredLayoutTimer);
    featuredLayoutTimer = window.setTimeout(syncFeaturedCardLayout, 100);
  }

  function init() {
    renderCatalog();
    window.addEventListener('resize', scheduleFeaturedCardLayout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
