// ============================================================
// 断面図ビュー — けい建築設計事務所の断面図画像 + 情報オーバーレイ
// ============================================================
(function () {
  'use strict';
  var D = window.HOUSE_DATA;
  var currentSection = 0; // 0=断面図(1), 1=断面図(2)

  // ズーム・パン状態
  var zoomState = { scale: 1, x: 0, y: 0 };
  var MIN_SCALE = 1;
  var MAX_SCALE = 5;

  var SECTIONS = [
    {
      image: 'img/section_main.png',
      title: '断面図（1）X方向 — A-11',
      description: '玄関側→テラス側（X0→X12方向）。LDK吹抜3,350mm、パウダールーム、ホール、小屋裏を表示',
      highlights: [
        { label: 'LDK', x: 52, y: 68, note: 'CH=2,200mm / 吹抜CH=3,350mm' },
        { label: 'パウダールーム', x: 33, y: 45, note: 'CH=2,200mm / FL+1,700mm' },
        { label: 'ホール', x: 52, y: 45, note: '2F CH=2,200mm' },
        { label: '小屋裏', x: 48, y: 24, note: 'CH=1,400mm' },
        { label: '設計GL', x: 12, y: 83, note: 'GL→1FL: 586mm' }
      ]
    },
    {
      image: 'img/section_detail.png',
      title: '断面図（2）Y方向 — A-12',
      description: '北側→南側（Y0→Y8方向）。LDK・テラス、BR・MBR、ロフトを表示',
      highlights: [
        { label: 'LDK', x: 35, y: 68, note: 'CH=2,200mm' },
        { label: 'テラス', x: 58, y: 68, note: '半屋外空間' },
        { label: 'BR', x: 38, y: 38, note: '2F CH=2,200mm / 勾配天井' },
        { label: 'MBR', x: 62, y: 42, note: '2F CH=2,200mm' },
        { label: 'ロフト', x: 42, y: 18, note: 'CH=600mm〜' }
      ]
    }
  ];

  window.renderSection = function () {
    var c = document.getElementById('view-section');
    c.innerHTML = '';

    c.appendChild(mk('div', 'section-title')).textContent = '断面図';

    // 図面情報
    var info = mk('div', 'fp-info');
    info.innerHTML = 'けい建築設計事務所 260224_断面図.pdf（2026.02.24）<br>岡本 直也様邸新築工事｜準耐火構造｜縮尺 1/50';
    c.appendChild(info);

    // タブ
    var tabs = mk('div', 'tabs');
    SECTIONS.forEach(function (sec, i) {
      var btn = mk('button', 'tab-btn' + (currentSection === i ? ' active' : ''));
      btn.textContent = '断面図（' + (i + 1) + '）';
      btn.addEventListener('click', function () {
        currentSection = i;
        zoomState = { scale: 1, x: 0, y: 0 };
        renderSectionContent(c);
      });
      tabs.appendChild(btn);
    });
    c.appendChild(tabs);

    renderSectionContent(c);
  };

  function renderSectionContent(c) {
    var old = c.querySelector('.sec-layout');
    if (old) old.remove();

    var sec = SECTIONS[currentSection];
    var layout = mk('div', 'sec-layout');

    // 画像 + ハイライト（ズーム・パン対応）
    var imgWrap = mk('div', 'sec-img-wrap');

    // ズームコントロールバー
    var zoomBar = mk('div', 'zoom-controls');
    var zoomInBtn = mk('button', 'zoom-btn');
    zoomInBtn.textContent = '+';
    zoomInBtn.title = '拡大';
    var zoomOutBtn = mk('button', 'zoom-btn');
    zoomOutBtn.textContent = '−';
    zoomOutBtn.title = '縮小';
    var zoomResetBtn = mk('button', 'zoom-btn zoom-reset');
    zoomResetBtn.textContent = 'リセット';
    zoomResetBtn.title = '元のサイズに戻す';
    var zoomLevel = mk('span', 'zoom-level');
    zoomLevel.textContent = Math.round(zoomState.scale * 100) + '%';

    zoomInBtn.addEventListener('click', function (e) { e.stopPropagation(); applyZoom(imgContainer, zoomState.scale * 1.3, zoomLevel); });
    zoomOutBtn.addEventListener('click', function (e) { e.stopPropagation(); applyZoom(imgContainer, zoomState.scale / 1.3, zoomLevel); });
    zoomResetBtn.addEventListener('click', function (e) { e.stopPropagation(); zoomState.scale = 1; zoomState.x = 0; zoomState.y = 0; updateTransform(imgContainer); zoomLevel.textContent = '100%'; });

    zoomBar.appendChild(zoomOutBtn);
    zoomBar.appendChild(zoomLevel);
    zoomBar.appendChild(zoomInBtn);
    zoomBar.appendChild(zoomResetBtn);
    imgWrap.appendChild(zoomBar);

    var imgContainer = mk('div', 'sec-img-container');

    var img = mk('img', 'sec-img');
    img.src = sec.image;
    img.alt = sec.title;
    img.draggable = false;
    imgContainer.appendChild(img);

    // ハイライトポイント
    sec.highlights.forEach(function (hl) {
      var dot = mk('div', 'sec-highlight');
      dot.style.left = hl.x + '%';
      dot.style.top = hl.y + '%';
      dot.setAttribute('data-label', hl.label);
      dot.setAttribute('data-note', hl.note);

      var tooltip = mk('div', 'sec-tooltip');
      tooltip.innerHTML = '<strong>' + hl.label + '</strong><br>' + hl.note;
      dot.appendChild(tooltip);

      imgContainer.appendChild(dot);
    });

    // マウスホイールズーム
    imgWrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = imgContainer.getBoundingClientRect();
      var mouseX = e.clientX - rect.left;
      var mouseY = e.clientY - rect.top;
      var delta = e.deltaY > 0 ? 0.9 : 1.1;
      var newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, zoomState.scale * delta));
      var scaleChange = newScale / zoomState.scale;
      zoomState.x = mouseX - (mouseX - zoomState.x) * scaleChange;
      zoomState.y = mouseY - (mouseY - zoomState.y) * scaleChange;
      zoomState.scale = newScale;
      clampPan(imgContainer);
      updateTransform(imgContainer);
      zoomLevel.textContent = Math.round(zoomState.scale * 100) + '%';
    }, { passive: false });

    // ドラッグパン・ピンチズーム
    setupDragPan(imgContainer, imgWrap);
    setupPinchZoom(imgContainer, imgWrap, zoomLevel);
    updateTransform(imgContainer);

    imgWrap.appendChild(imgContainer);
    layout.appendChild(imgWrap);

    // 右: 情報パネル
    var panel = mk('div', 'sec-panel');

    panel.appendChild(mk('div', 'fp-panel-title')).textContent = sec.title;
    var desc = mk('div', 'sec-desc');
    desc.textContent = sec.description;
    panel.appendChild(desc);

    // 主要寸法テーブル
    var dimTitle = mk('div', 'sec-dim-title');
    dimTitle.textContent = '主要寸法';
    panel.appendChild(dimTitle);

    var dims = [
      ['設計GL → 1FL', '586mm'],
      ['1F天井高 (CH)', '2,200mm'],
      ['LDK吹抜高', '3,350mm'],
      ['1CH → 2FL', '450mm'],
      ['2F天井高 (CH)', '2,200mm'],
      ['2CH → 軒高', '350mm'],
      ['ロフト天井高', '≒1,400mm'],
      ['最高軒高', '8,750mm'],
      ['建物幅 (X方向)', '9,100mm'],
      ['建物奥行 (Y方向)', '5,915mm + 305mm']
    ];

    dims.forEach(function (d) {
      var row = mk('div', 'fp-detail-row');
      row.innerHTML = '<span class="fp-detail-key">' + d[0] + '</span><span class="fp-detail-val">' + d[1] + '</span>';
      panel.appendChild(row);
    });

    // 屋根勾配
    var roofTitle = mk('div', 'sec-dim-title');
    roofTitle.textContent = '屋根勾配';
    roofTitle.style.marginTop = '16px';
    panel.appendChild(roofTitle);

    D.section.roof.forEach(function (r) {
      var row = mk('div', 'fp-detail-row');
      row.innerHTML = '<span class="fp-detail-key">' + r.name + '</span><span class="fp-detail-val">' + r.slope + '　' + r.material + '</span>';
      panel.appendChild(row);
    });

    // 構造グリッド
    var gridTitle = mk('div', 'sec-dim-title');
    gridTitle.textContent = '構造グリッド (X方向)';
    gridTitle.style.marginTop = '16px';
    panel.appendChild(gridTitle);

    var gridRow = mk('div', 'sec-grid-info');
    gridRow.textContent = 'X0→X12: ' + D.section.gridSpans.join(' / ');
    panel.appendChild(gridRow);

    layout.appendChild(panel);
    c.appendChild(layout);

    // タブ再アクティブ
    c.querySelectorAll('.tab-btn').forEach(function (btn, i) {
      btn.classList.toggle('active', i === currentSection);
    });
  }

  // ── ズーム・パン ヘルパー ──
  function applyZoom(container, newScale, label) {
    newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    var rect = container.getBoundingClientRect();
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var scaleChange = newScale / zoomState.scale;
    zoomState.x = cx - (cx - zoomState.x) * scaleChange;
    zoomState.y = cy - (cy - zoomState.y) * scaleChange;
    zoomState.scale = newScale;
    clampPan(container);
    updateTransform(container);
    if (label) label.textContent = Math.round(zoomState.scale * 100) + '%';
  }

  function updateTransform(container) {
    container.style.transform = 'translate(' + zoomState.x + 'px, ' + zoomState.y + 'px) scale(' + zoomState.scale + ')';
  }

  function clampPan(container) {
    if (zoomState.scale <= 1) { zoomState.x = 0; zoomState.y = 0; return; }
    var wrap = container.parentElement;
    var wrapRect = wrap.getBoundingClientRect();
    var w = wrapRect.width;
    var h = wrapRect.height;
    var scaledW = w * zoomState.scale;
    var scaledH = h * zoomState.scale;
    zoomState.x = Math.min(0, Math.max(w - scaledW, zoomState.x));
    zoomState.y = Math.min(0, Math.max(h - scaledH, zoomState.y));
  }

  function setupDragPan(container, wrap) {
    var dragging = false;
    var startX, startY, startPanX, startPanY;
    wrap.addEventListener('mousedown', function (e) {
      if (zoomState.scale <= 1) return;
      e.preventDefault(); dragging = true;
      startX = e.clientX; startY = e.clientY;
      startPanX = zoomState.x; startPanY = zoomState.y;
      wrap.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      zoomState.x = startPanX + (e.clientX - startX);
      zoomState.y = startPanY + (e.clientY - startY);
      clampPan(container); updateTransform(container);
    });
    window.addEventListener('mouseup', function () {
      if (dragging) { dragging = false; wrap.style.cursor = ''; }
    });
  }

  function setupPinchZoom(container, wrap, label) {
    var lastDist = 0;
    var touchPanning = false;
    var touchStartX, touchStartY, touchStartPanX, touchStartPanY;

    wrap.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault(); touchPanning = false;
        lastDist = getTouchDist(e.touches);
      } else if (e.touches.length === 1 && zoomState.scale > 1) {
        touchPanning = true;
        touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
        touchStartPanX = zoomState.x; touchStartPanY = zoomState.y;
      }
    }, { passive: false });
    wrap.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault(); touchPanning = false;
        var dist = getTouchDist(e.touches);
        if (lastDist > 0) applyZoom(container, zoomState.scale * (dist / lastDist), label);
        lastDist = dist;
      } else if (e.touches.length === 1 && touchPanning && zoomState.scale > 1) {
        e.preventDefault();
        zoomState.x = touchStartPanX + (e.touches[0].clientX - touchStartX);
        zoomState.y = touchStartPanY + (e.touches[0].clientY - touchStartY);
        clampPan(container); updateTransform(container);
      }
    }, { passive: false });
    wrap.addEventListener('touchend', function () { lastDist = 0; touchPanning = false; });
  }

  function getTouchDist(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
})();
