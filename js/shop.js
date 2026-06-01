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

  function findProduct(id) {
    return getCatalog().find(function (p) {
      return p.id === id;
    });
  }

  function getCartQty(productId) {
    if (!window.ShopCart) return 0;
    var item = window.ShopCart.getItems().find(function (i) {
      return i.productId === productId;
    });
    return item ? item.quantity : 0;
  }

  function syncCardFromCart(card) {
    var bubble = card.querySelector('.shop-card__cart-bubble');
    var actions = card.querySelector('.shop-card__actions');
    var input = card.querySelector('.shop-card__qty-input');
    if (!bubble) return;

    var qty = getCartQty(card.dataset.productId);
    if (qty > 0) {
      bubble.classList.add('is-in-cart');
      if (actions) actions.classList.add('is-in-cart');
      if (input) {
        input.value = String(qty);
        input.removeAttribute('tabindex');
      }
    } else {
      bubble.classList.remove('is-in-cart');
      if (actions) actions.classList.remove('is-in-cart');
      if (input) {
        input.value = '1';
        input.setAttribute('tabindex', '-1');
      }
    }
  }

  function syncAllCards() {
    document.querySelectorAll('.shop-card').forEach(syncCardFromCart);
  }

  function readQtyInput(input) {
    var val = (input.value || '').replace(/[^0-9]/g, '');
    var qty = parseInt(val, 10);
    return qty > 0 ? qty : 1;
  }

  function setCartQty(productId, qty) {
    if (!window.ShopCart) return;
    if (qty < 1) {
      window.ShopCart.removeItem(productId);
    } else {
      var existing = getCartQty(productId);
      if (existing) {
        window.ShopCart.setQuantity(productId, qty);
      } else {
        window.ShopCart.addItem(productId, qty);
      }
    }
    if (window.ShopCartUI) window.ShopCartUI.updateBadge();
  }

  function addToCart(productId, card) {
    var product = findProduct(productId);
    if (!product || !window.ShopCart) return;

    var qty = 1;
    window.ShopCart.addItem(productId, qty);
    syncCardFromCart(card);

    if (window.ShopCartUI) {
      window.ShopCartUI.updateBadge();
    }
  }

  function bindCard(card) {
    var productId = card.dataset.productId;
    var bubble = card.querySelector('.shop-card__cart-bubble');
    var addBtn = card.querySelector('.shop-card__add');
    var input = card.querySelector('.shop-card__qty-input');
    var decBtn = card.querySelector('[data-action="decrease"]');
    var incBtn = card.querySelector('[data-action="increase"]');

    syncCardFromCart(card);

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addToCart(productId, card);
      });
    }

    if (input) {
      input.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
      });
      input.addEventListener('change', function () {
        if (!bubble.classList.contains('is-in-cart')) return;
        var qty = readQtyInput(input);
        input.value = String(qty);
        setCartQty(productId, qty);
        syncCardFromCart(card);
      });
    }

    if (decBtn) {
      decBtn.addEventListener('click', function () {
        var qty = getCartQty(productId);
        if (qty <= 1) {
          window.ShopCart.removeItem(productId);
          syncCardFromCart(card);
          if (window.ShopCartUI) window.ShopCartUI.updateBadge();
          return;
        }
        setCartQty(productId, qty - 1);
        syncCardFromCart(card);
      });
    }

    if (incBtn) {
      incBtn.addEventListener('click', function () {
        var qty = getCartQty(productId) || readQtyInput(input);
        setCartQty(productId, qty + 1);
        syncCardFromCart(card);
      });
    }
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
        '" alt="" loading="lazy" decoding="async"' +
        imgDims +
        '>'
      : '<div class="shop-card__icon shop-card__icon--' +
        escapeHtml(product.icon || 'system') +
        '">' +
        (ICONS[product.icon] || ICONS.system) +
        '</div>';

    var cardClass =
      'shop-card' +
      (product.featured ? ' shop-card--featured' : ' shop-card--module');

    return (
      '<article class="' +
      cardClass +
      '" data-product-id="' +
      escapeHtml(product.id) +
      '">' +
      '<div class="shop-card__visual' +
      (product.featured ? ' shop-card__visual--featured' : ' pattern-hatch-light') +
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
      (product.featured
        ? '<p class="shop-card__desc">' + escapeHtml(product.description) + '</p>'
        : '<div class="shop-card__desc-wrap"><p class="shop-card__desc">' +
          escapeHtml(product.description) +
          '</p></div>') +
      '<div class="shop-card__actions">' +
      '<div class="shop-card__price">' +
      '<span class="shop-card__price-label">' +
      escapeHtml(product.priceLabel || '') +
      '</span>' +
      (product.priceNote
        ? '<span class="shop-card__price-note">' + escapeHtml(product.priceNote) + '</span>'
        : '') +
      '</div>' +
      '<div class="shop-card__cart-bubble">' +
      '<button type="button" class="btn btn-primary shop-card__add">Add to cart</button>' +
      '<div class="shop-card__qty-stepper">' +
      '<button type="button" class="shop-card__qty-btn" data-action="decrease" aria-label="Decrease quantity">−</button>' +
      '<input type="text" class="shop-card__qty-input" value="1" inputmode="numeric" aria-label="Quantity" tabindex="-1">' +
      '<button type="button" class="shop-card__qty-btn" data-action="increase" aria-label="Increase quantity">+</button>' +
      '</div>' +
      '</div>' +
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
    root.querySelectorAll('.shop-card').forEach(bindCard);
    syncFeaturedCardLayout();
  }

  function syncFeaturedCardLayout() {
    document.querySelectorAll('.shop-card--featured').forEach(function (card) {
      var img = card.querySelector('.shop-card__img');
      if (!img) return;

      function measure() {
        card.style.setProperty('--shop-featured-media-w', img.offsetWidth + 'px');
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
    window.addEventListener('shop-cart-changed', syncAllCards);
    window.addEventListener('resize', scheduleFeaturedCardLayout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
