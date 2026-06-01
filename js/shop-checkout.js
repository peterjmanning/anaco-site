(function () {
  'use strict';

  var CART_CREATE = [
    'mutation cartCreate($input: CartInput!) {',
    '  cartCreate(input: $input) {',
    '    cart { checkoutUrl }',
    '    userErrors { field message }',
    '  }',
    '}',
  ].join('\n');

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getStoreConfig() {
    return window.SHOPIFY_STORE || {};
  }

  function storeReady(cfg) {
    return cfg.enabled && cfg.storeDomain && cfg.storefrontAccessToken;
  }

  function variantReady(variantId) {
    return String(variantId || '').indexOf('gid://shopify/ProductVariant/') === 0;
  }

  function storefrontEndpoint(cfg) {
    var version = cfg.apiVersion || '2025-01';
    return (
      'https://' +
      cfg.storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') +
      '/api/' +
      version +
      '/graphql.json'
    );
  }

  function productThumb(product) {
    if (product.image) {
      var src = window.resolveShopAsset
        ? window.resolveShopAsset(product.image)
        : product.image;
      return (
        '<img src="' + escapeHtml(src) + '" alt="" class="cart-line__img" loading="lazy">'
      );
    }
    return (
      '<div class="cart-line__icon">' + (ICONS[product.icon] || ICONS.system) + '</div>'
    );
  }

  function renderCart() {
    var list = document.getElementById('cart-lines');
    var empty = document.getElementById('cart-empty');
    var panel = document.getElementById('cart-panel');
    var checkoutForm = document.getElementById('checkout-form-wrap');
    var checkoutGo = document.querySelector('.checkout-page .checkout-go-bubble');
    if (!list) return;

    var items = window.ShopCart.getEnrichedItems();
    var count = window.ShopCart.getItemCount();

    if (window.ShopCartUI) window.ShopCartUI.updateBadge();

    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      if (panel) panel.hidden = true;
      if (checkoutForm) checkoutForm.hidden = true;
      if (checkoutGo) checkoutGo.hidden = true;
      return;
    }

    if (empty) empty.hidden = true;
    if (panel) panel.hidden = false;
    if (checkoutForm) checkoutForm.hidden = false;
    if (checkoutGo) checkoutGo.hidden = false;

    list.innerHTML = items
      .map(function (line) {
        var p = line.product;
        return (
          '<article class="cart-line" data-product-id="' +
          escapeHtml(line.productId) +
          '">' +
          '<div class="cart-line__visual pattern-hatch-light">' +
          productThumb(p) +
          '</div>' +
          '<div class="cart-line__body">' +
          '<h3 class="cart-line__title">' +
          escapeHtml(p.name) +
          '</h3>' +
          '<p class="cart-line__meta">' +
          escapeHtml(p.priceLabel || '') +
          (p.priceNote ? ' · ' + escapeHtml(p.priceNote) : '') +
          '</p>' +
          '<div class="cart-line__actions">' +
          '<label class="cart-line__qty-label">Qty' +
          '<input type="text" class="cart-line__qty" inputmode="numeric" value="' +
          line.quantity +
          '" aria-label="Quantity for ' +
          escapeHtml(p.name) +
          '">' +
          '</label>' +
          '<button type="button" class="cart-line__remove link-neon">Remove</button>' +
          '</div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    var subtotalEl = document.getElementById('cart-subtotal-count');
    if (subtotalEl) {
      subtotalEl.textContent =
        count === 1 ? '1 item' : count + ' items';
    }

    list.querySelectorAll('.cart-line__qty').forEach(function (input) {
      input.addEventListener('change', function () {
        var line = input.closest('.cart-line');
        var id = line && line.dataset.productId;
        var val = (input.value || '').replace(/[^0-9]/g, '');
        var qty = parseInt(val, 10);
        if (!id) return;
        if (!qty || qty < 1) {
          window.ShopCart.removeItem(id);
        } else {
          window.ShopCart.setQuantity(id, qty);
        }
        renderCart();
      });
      input.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
      });
    });

    list.querySelectorAll('.cart-line__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var line = btn.closest('.cart-line');
        if (line && line.dataset.productId) {
          window.ShopCart.removeItem(line.dataset.productId);
          renderCart();
        }
      });
    });
  }

  function showFormError(message) {
    var el = document.getElementById('formError');
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
  }

  function validateCheckoutForm() {
    var items = window.ShopCart.getEnrichedItems();
    if (!items.length) {
      showFormError('Your cart is empty.');
      return null;
    }

    var invalid = items.find(function (line) {
      return !variantReady(line.product.variantId);
    });
    if (invalid) {
      showFormError(
        '"' +
          invalid.product.name +
          '" is missing a Shopify variant ID in shop-catalog.js.'
      );
      return null;
    }

    var firstName = document.getElementById('firstName');
    var lastName = document.getElementById('lastName');
    var email = document.getElementById('email');
    var company = document.getElementById('company');
    var industry = document.getElementById('industry');

    var fields = [firstName, lastName, email, company, industry];
    var valid = true;

    fields.forEach(function (f) {
      f.style.borderColor = '';
      var val = (f.value || '').trim();
      if (!val) {
        f.style.borderColor = '#ef4444';
        valid = false;
      }
    });

    if (!valid) {
      showFormError('Please fill in all required fields.');
      return null;
    }

    showFormError('');
    return {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      company: company.value.trim(),
      industry: industry.value.trim(),
      notes: (document.getElementById('notes').value || '').trim(),
      items: items,
    };
  }

  function createCheckout(cfg, form) {
    var productList = form.items
      .map(function (line) {
        return line.product.name + ' ×' + line.quantity;
      })
      .join(', ');

    var attributes = [
      { key: 'Products', value: productList },
      { key: 'First name', value: form.firstName },
      { key: 'Last name', value: form.lastName },
      { key: 'Company', value: form.company },
      { key: 'Industry', value: form.industry },
    ];
    if (form.notes) {
      attributes.push({ key: 'Additional notes', value: form.notes });
    }

    var lines = form.items.map(function (line) {
      return {
        quantity: line.quantity,
        merchandiseId: line.product.variantId,
      };
    });

    return fetch(storefrontEndpoint(cfg), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': cfg.storefrontAccessToken,
      },
      body: JSON.stringify({
        query: CART_CREATE,
        variables: {
          input: {
            lines: lines,
            attributes: attributes,
            buyerIdentity: { email: form.email },
          },
        },
      }),
    }).then(function (res) {
      return res.json().then(function (body) {
        return { ok: res.ok, body: body };
      });
    });
  }

  function setSubmitting(btn, submitting) {
    if (!btn) return;
    btn.disabled = submitting;
    btn.classList.toggle('is-loading', submitting);
    if (submitting) {
      btn.dataset.originalLabel = btn.textContent;
      btn.textContent = 'Redirecting to checkout…';
    } else if (btn.dataset.originalLabel) {
      btn.textContent = btn.dataset.originalLabel;
    }
  }

  function submitShopCheckout() {
    var btn = document.querySelector('#checkout-form .submit-btn');
    var form = validateCheckoutForm();
    if (!form) return;

    var cfg = getStoreConfig();
    if (!storeReady(cfg)) {
      showFormError(
        'Checkout is not configured yet. Add your Storefront API credentials in js/shopify-config.js.'
      );
      return;
    }

    setSubmitting(btn, true);
    showFormError('');

    createCheckout(cfg, form)
      .then(function (result) {
        var payload = result.body && result.body.data && result.body.data.cartCreate;
        var userErrors =
          (payload && payload.userErrors) || (result.body && result.body.errors) || [];

        if (!result.ok || !payload || userErrors.length) {
          var msg =
            userErrors
              .map(function (e) {
                return e.message;
              })
              .join(' ') ||
            'Could not start checkout. Please try again or email bliker@anaco.com.';
          throw new Error(msg);
        }

        var checkoutUrl = payload.cart && payload.cart.checkoutUrl;
        if (!checkoutUrl) {
          throw new Error('Checkout URL was not returned.');
        }

        window.ShopCart.clear();
        window.location.href = checkoutUrl;
      })
      .catch(function (err) {
        setSubmitting(btn, false);
        showFormError(
          err && err.message
            ? err.message
            : 'Could not reach Shopify. Please try again or email bliker@anaco.com.'
        );
      });
  }

  window.submitShopCheckout = submitShopCheckout;

  function init() {
    renderCart();
    window.addEventListener('shop-cart-changed', renderCart);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
