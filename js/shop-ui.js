(function () {
  'use strict';

  window.ShopCartUI = {
    updateBadge: function () {
      var count = window.ShopCart ? window.ShopCart.getItemCount() : 0;
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = String(count);
        el.hidden = count < 1;
      });
      document.querySelectorAll('[data-cart-link]').forEach(function (el) {
        el.setAttribute('aria-label', count ? 'Cart, ' + count + ' items' : 'Cart, empty');
      });
      document.querySelectorAll('[data-checkout-go]').forEach(function (el) {
        el.hidden = count < 1;
      });
    },

    initNav: function () {
      this.updateBadge();
      window.addEventListener('shop-cart-changed', this.updateBadge.bind(this));
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.ShopCart) window.ShopCartUI.initNav();
    });
  } else if (window.ShopCart) {
    window.ShopCartUI.initNav();
  }
})();
