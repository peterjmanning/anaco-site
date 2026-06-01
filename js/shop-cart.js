(function () {
  'use strict';

  var STORAGE_KEY = 'anaco-shop-cart';

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function writeRaw(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('shop-cart-changed', { detail: { items: items } }));
  }

  function normalizeItem(item) {
    var qty = parseInt(item.quantity, 10);
    if (!item.productId || !qty || qty < 1) return null;
    return { productId: item.productId, quantity: qty };
  }

  function getCatalogProduct(id) {
    var products = (window.SHOP_CATALOG && window.SHOP_CATALOG.products) || [];
    return products.find(function (p) {
      return p.id === id;
    });
  }

  window.ShopCart = {
    getItems: function () {
      return readRaw()
        .map(normalizeItem)
        .filter(Boolean);
    },

    getItemCount: function () {
      return this.getItems().reduce(function (sum, item) {
        return sum + item.quantity;
      }, 0);
    },

    getLineCount: function () {
      return this.getItems().length;
    },

    addItem: function (productId, quantity) {
      quantity = parseInt(quantity, 10) || 1;
      if (quantity < 1) quantity = 1;
      if (!getCatalogProduct(productId)) return false;

      var items = this.getItems();
      var existing = items.find(function (i) {
        return i.productId === productId;
      });
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({ productId: productId, quantity: quantity });
      }
      writeRaw(items);
      return true;
    },

    setQuantity: function (productId, quantity) {
      quantity = parseInt(quantity, 10);
      var items = this.getItems();
      var idx = items.findIndex(function (i) {
        return i.productId === productId;
      });
      if (idx === -1) return false;
      if (!quantity || quantity < 1) {
        items.splice(idx, 1);
      } else {
        items[idx].quantity = quantity;
      }
      writeRaw(items);
      return true;
    },

    removeItem: function (productId) {
      var items = this.getItems().filter(function (i) {
        return i.productId !== productId;
      });
      writeRaw(items);
    },

    clear: function () {
      writeRaw([]);
    },

    getEnrichedItems: function () {
      return this.getItems()
        .map(function (item) {
          var product = getCatalogProduct(item.productId);
          if (!product) return null;
          return {
            productId: item.productId,
            quantity: item.quantity,
            product: product,
          };
        })
        .filter(Boolean);
    },
  };
})();
