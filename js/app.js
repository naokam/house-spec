// ============================================================
// アプリケーション制御 — ルーティング・状態管理
// ============================================================
(function () {
  'use strict';

  const views = ['dashboard', 'floorplan', 'section', 'specs', 'gallery', 'cost'];
  let currentView = 'dashboard';

  // ── ナビゲーション ──
  function navigate(viewName) {
    if (!views.includes(viewName)) return;
    currentView = viewName;

    // ビュー切替
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + viewName);
    if (target) {
      target.classList.add('active');
      target.classList.add('fade-in');
      setTimeout(() => target.classList.remove('fade-in'), 300);
    }

    // ナビ切替
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navItem) navItem.classList.add('active');

    // モバイルサイドバーを閉じる
    closeSidebar();

    // ハッシュ更新
    history.replaceState(null, '', '#' + viewName);
  }

  // ── サイドバー (モバイル) ──
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    getOverlay().classList.add('active');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    getOverlay().classList.remove('active');
  }

  function getOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeSidebar);
    }
    return overlay;
  }

  // ── ナビツールチップ（折りたたみ時） ──
  function setupNavTooltip() {
    const sidebar = document.getElementById('sidebar');
    let tooltip = document.createElement('div');
    tooltip.className = 'nav-tooltip';
    document.body.appendChild(tooltip);
    let hideTimer = null;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('mouseenter', function () {
        // サイドバーが展開中（hover で幅が広い）なら非表示
        if (sidebar.offsetWidth > 100) return;
        const rect = item.getBoundingClientRect();
        tooltip.textContent = item.dataset.tip || '';
        tooltip.style.left = (rect.right + 8) + 'px';
        tooltip.style.top = (rect.top + rect.height / 2) + 'px';
        tooltip.style.transform = 'translateY(-50%)';
        clearTimeout(hideTimer);
        tooltip.classList.add('visible');
      });
      item.addEventListener('mouseleave', function () {
        hideTimer = setTimeout(() => tooltip.classList.remove('visible'), 80);
      });
    });

    // サイドバーが展開したらツールチップ即非表示
    sidebar.addEventListener('mouseenter', function () {
      tooltip.classList.remove('visible');
    });
  }

  // ── 初期化 ──
  function init() {
    // ナビクリック
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        navigate(this.dataset.view);
      });
    });

    // モバイルメニュー
    document.getElementById('menu-toggle').addEventListener('click', openSidebar);

    // デスクトップ: ナビツールチップ
    if (window.matchMedia('(hover: hover)').matches) {
      setupNavTooltip();
    }

    // ハッシュから初期ビュー
    const hash = location.hash.replace('#', '');
    const initialView = views.includes(hash) ? hash : 'dashboard';

    // 各ビューを初期描画
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderFloorplan) window.renderFloorplan();
    if (window.renderSection) window.renderSection();
    if (window.renderSpecs) window.renderSpecs();
    if (window.renderGallery) window.renderGallery();
    if (window.renderCost) window.renderCost();

    navigate(initialView);
  }

  // ── ナビゲーション（ビュー + スクロールターゲット付き） ──
  function navigateToSpec(catId, subId) {
    navigate('specs');
    setTimeout(function () {
      if (window.specsNavigate) window.specsNavigate(catId, subId);
    }, 50);
  }

  // ── ユーティリティ ──
  window.APP = {
    navigate: navigate,
    navigateToSpec: navigateToSpec,
    formatCost: function (n) {
      if (n == null) return '—';
      return '¥' + n.toLocaleString('ja-JP');
    },
    el: function (tag, attrs, children) {
      const el = document.createElement(tag);
      if (attrs) {
        Object.keys(attrs).forEach(k => {
          if (k === 'className') el.className = attrs[k];
          else if (k === 'textContent') el.textContent = attrs[k];
          else if (k === 'innerHTML') el.innerHTML = attrs[k];
          else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
          else el.setAttribute(k, attrs[k]);
        });
      }
      if (children) {
        if (typeof children === 'string') el.innerHTML = children;
        else if (Array.isArray(children)) children.forEach(c => { if (c) el.appendChild(c); });
        else el.appendChild(children);
      }
      return el;
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
