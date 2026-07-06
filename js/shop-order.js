(function () {
  'use strict';

  function getCatalog() {
    return (window.SHOP_CATALOG && window.SHOP_CATALOG.products) || [];
  }

  function populateProductSelect() {
    var select = document.getElementById('orderProduct');
    if (!select) return;

    getCatalog().forEach(function (product) {
      var option = document.createElement('option');
      option.value = product.id;
      option.textContent = product.name;
      select.appendChild(option);
    });
  }

  function selectProduct(productId) {
    var select = document.getElementById('orderProduct');
    if (!select || !productId) return;
    var option = select.querySelector('option[value="' + productId + '"]');
    if (option) select.value = productId;
  }

  function scrollToOrderSection() {
    var section = document.getElementById('order');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bindOrderLinks() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('.shop-card__order');
      if (!link) return;
      event.preventDefault();
      var productId = link.dataset.productId;
      if (productId) selectProduct(productId);
      scrollToOrderSection();
    });
  }

  function applyQueryProduct() {
    var params = new URLSearchParams(window.location.search);
    var productId = params.get('product');
    if (productId) selectProduct(productId);
  }

  function showOrderSuccess() {
    document.getElementById('orderFormContent').hidden = true;
    document.getElementById('orderSuccess').hidden = false;
  }

  function init() {
    populateProductSelect();
    bindOrderLinks();
    applyQueryProduct();
  }

  window.submitOrder = function () {
    var firstName = document.getElementById('orderFirstName');
    var lastName = document.getElementById('orderLastName');
    var email = document.getElementById('orderEmail');
    var company = document.getElementById('orderCompany');
    var product = document.getElementById('orderProduct');
    var industry = document.getElementById('orderIndustry');
    var notes = document.getElementById('orderNotes');
    var errorEl = document.getElementById('orderFormError');

    if (errorEl) errorEl.hidden = true;

    if (
      !firstName.value.trim() ||
      !lastName.value.trim() ||
      !email.value.trim() ||
      !company.value.trim() ||
      !product.value ||
      !industry.value
    ) {
      if (errorEl) {
        errorEl.textContent = 'Please fill in all required fields.';
        errorEl.hidden = false;
      } else {
        alert('Please fill in all required fields.');
      }
      return;
    }

    var productName =
      product.options[product.selectedIndex] && product.options[product.selectedIndex].textContent;

    var data = new FormData();
    data.append('first_name', firstName.value.trim());
    data.append('last_name', lastName.value.trim());
    data.append('email', email.value.trim());
    data.append('company', company.value.trim());
    data.append('product', productName || product.value);
    data.append('industry', industry.value);
    data.append('notes', notes.value.trim());
    data.append(
      '_subject',
      'Tinylab Order Request — ' + productName + ' — ' + company.value.trim()
    );
    data.append('_template', 'table');

    var btn = document.querySelector('#order-form .submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending…';
    }

    fetch('https://formsubmit.co/ajax/agangla@anaco.com', { method: 'POST', body: data })
      .then(function () {
        showOrderSuccess();
      })
      .catch(function () {
        showOrderSuccess();
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Submit order request →';
        }
      });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
