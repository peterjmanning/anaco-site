(function () {
  'use strict';

  function initIndustriesGrid() {
    var data = window.INDUSTRIES_DATA;
    var grid = document.getElementById('industriesGrid');
    if (!data || !grid) return;

    function carouselSrc(imgPath) {
      var name = imgPath.replace(/^images\//, '').replace(/\.(jpe?g|png|webp)$/i, '');
      return 'images/carousel/' + name + '.jpg';
    }

    function industryDescription(item) {
      if (!item.cases || !item.cases.length) return '';
      return item.cases[0].text || '';
    }

    data.forEach(function (item) {
      var link = document.createElement('a');
      link.className = 'industry-grid-item';
      link.href = 'industries/#' + encodeURIComponent(item.id);
      link.setAttribute('aria-label', item.title);

      var media = document.createElement('div');
      media.className = 'industry-grid-item__media';

      var img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = carouselSrc(item.img);
      img.addEventListener('error', function onImgError() {
        if (img.dataset.fallbackApplied === '1') return;
        img.dataset.fallbackApplied = '1';
        img.src = item.img;
      });

      media.appendChild(img);

      var overlay = document.createElement('div');
      overlay.className = 'industry-grid-item__overlay';

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

      link.appendChild(media);
      link.appendChild(overlay);
      grid.appendChild(link);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndustriesGrid);
  } else {
    initIndustriesGrid();
  }
})();
