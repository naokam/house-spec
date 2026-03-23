// ============================================================
// CGギャラリー — 画像グリッド + ライトボックス
// ============================================================
(function () {
  'use strict';
  const D = window.HOUSE_DATA;

  let currentGalleryCat = 'cg-pers';
  let lightboxImages = [];
  let lightboxIndex = 0;

  window.renderGallery = function () {
    const container = document.getElementById('view-gallery');
    container.innerHTML = '';

    container.appendChild(APP.el('div', { className: 'section-title', textContent: 'CGギャラリー' }));

    // カテゴリタブ
    const tabs = APP.el('div', { className: 'tabs' });
    D.gallery.categories.forEach(cat => {
      const btn = APP.el('button', {
        className: 'tab-btn' + (currentGalleryCat === cat.id ? ' active' : ''),
        textContent: cat.name + ' (' + cat.images.length + ')',
        onClick: function () {
          currentGalleryCat = cat.id;
          renderGalleryContent(container);
          // タブ更新
          tabs.querySelectorAll('.tab-btn').forEach((b, i) => {
            b.classList.toggle('active', D.gallery.categories[i].id === currentGalleryCat);
          });
        }
      });
      tabs.appendChild(btn);
    });
    container.appendChild(tabs);

    renderGalleryContent(container);
    setupLightbox();
  };

  function renderGalleryContent(container) {
    const old = container.querySelector('.gallery-grid');
    if (old) old.remove();

    const cat = D.gallery.categories.find(c => c.id === currentGalleryCat);
    if (!cat) return;

    // 画像リストを構築
    lightboxImages = cat.images.map(img => cat.basePath + img);

    const grid = APP.el('div', { className: 'gallery-grid' });
    cat.images.forEach((imgFile, i) => {
      const thumb = APP.el('div', {
        className: 'gallery-thumb',
        onClick: function () {
          openLightbox(i);
        }
      });
      const img = APP.el('img', {
        src: cat.basePath + imgFile,
        alt: imgFile,
        loading: 'lazy'
      });
      thumb.appendChild(img);
      grid.appendChild(thumb);
    });
    container.appendChild(grid);
  }

  // ── ライトボックス ──
  function setupLightbox() {
    const lb = document.getElementById('lightbox');
    const closeBtn = lb.querySelector('.lb-close');
    const prevBtn = lb.querySelector('.lb-prev');
    const nextBtn = lb.querySelector('.lb-next');

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function () { showImage(lightboxIndex - 1); });
    nextBtn.addEventListener('click', function () { showImage(lightboxIndex + 1); });

    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-content')) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(lightboxIndex - 1);
      if (e.key === 'ArrowRight') showImage(lightboxIndex + 1);
    });
  }

  function openLightbox(index) {
    lightboxIndex = index;
    const lb = document.getElementById('lightbox');
    lb.hidden = false;
    showImage(index);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    document.getElementById('lightbox').hidden = true;
    document.body.style.overflow = '';
  }

  function showImage(index) {
    if (index < 0) index = lightboxImages.length - 1;
    if (index >= lightboxImages.length) index = 0;
    lightboxIndex = index;

    const img = document.getElementById('lb-img');
    img.src = lightboxImages[index];

    const caption = document.getElementById('lb-caption');
    caption.textContent = (index + 1) + ' / ' + lightboxImages.length;
  }
})();
