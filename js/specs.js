// ============================================================
// 仕様一覧 — インタラクティブ階層アコーディオンUI
// カテゴリ → サブカテゴリ → 製品カード（すべて同一ページ内で展開）
// ============================================================
(function () {
  'use strict';
  var D = window.HOUSE_DATA;

  // 展開状態
  var expandedCats = {};   // { catId: true }
  var expandedSubs = {};   // { "catId/subId": true }
  var expandedItems = {};  // { "catId/subId/idx": true }
  var searchQuery = '';

  // サムネイルプレースホルダー色マップ
  var THUMB_COLORS = {
    kitchen:'#E8D5B7', cupboard:'#D4C5A9', bath:'#B8D4E3', toilet:'#C5D5C5',
    washbasin:'#D5C8B8', vanity:'#C8B8A8', heating:'#E8C8A8', sash:'#A8C8E8',
    skylight:'#C8D8E8', 'wood-sash':'#C8B898', door:'#B8A898', gate:'#A8B8A8',
    canopy:'#B8C8B8', roof:'#8B8878', jolypate:'#E8E0D8', tile:'#D8D0C8',
    'terrace-tile':'#C8C0B0', gravio:'#B8A898', 'spray-insulation':'#E8D898',
    aclear:'#E8E0B8', stiebel:'#C8D0E8', 'steel-stair':'#A8A8A8'
  };
  var THUMB_ICONS = {
    kitchen:'🍳', cupboard:'📦', bath:'🛁', toilet:'🚽', washbasin:'🚰', vanity:'💄',
    heating:'🔥', sash:'🪟', skylight:'☀', 'wood-sash':'🪵', door:'🚪', gate:'🚧',
    canopy:'☂', roof:'🏠', jolypate:'🖌', tile:'🔲', 'terrace-tile':'🏞',
    gravio:'🪵', 'spray-insulation':'💨', aclear:'🧱', stiebel:'💨', 'steel-stair':'🪜'
  };

  window.renderSpecs = function () { render(); };
  window.specsNavigate = function (catId, subId) {
    expandedCats[catId] = true;
    if (subId) expandedSubs[catId + '/' + subId] = true;
    render();
    // スクロール
    setTimeout(function () {
      var el = document.getElementById('spec-' + (subId || catId));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  function render() {
    var c = document.getElementById('view-specs');
    c.innerHTML = '';

    // ヘッダー
    var hdr = mk('div', 'spec-header');
    hdr.innerHTML = '<div class="section-title">仕様一覧</div><div class="spec-header-sub">カテゴリをクリックで展開。各製品の詳細・メーカーリンクを確認できます</div>';
    c.appendChild(hdr);

    // 検索バー
    var searchWrap = mk('div', 'spec-search-bar');
    var input = mk('input', 'spec-search-input');
    input.type = 'text';
    input.placeholder = '仕様を検索…（例: LIXIL, キッチン, ガルバリウム, 断熱）';
    input.value = searchQuery;
    input.addEventListener('input', function () {
      searchQuery = this.value;
      renderBody(c);
    });
    searchWrap.appendChild(input);
    c.appendChild(searchWrap);

    renderBody(c);
  }

  function renderBody(c) {
    var old = c.querySelector('.spec-body');
    if (old) old.remove();
    var body = mk('div', 'spec-body');

    if (searchQuery.length >= 2) {
      renderSearch(body);
    } else {
      D.specs.categories.forEach(function (cat) {
        body.appendChild(buildCategory(cat));
      });
    }
    c.appendChild(body);
  }

  // ═══════════════════════════════════════
  // カテゴリ（L0）アコーディオン
  // ═══════════════════════════════════════
  function buildCategory(cat) {
    var isOpen = expandedCats[cat.id];
    var totalCost = catCost(cat);

    var wrap = mk('div', 'spec-cat' + (isOpen ? ' open' : ''));
    wrap.id = 'spec-' + cat.id;

    // ヘッダー行
    var header = mk('div', 'spec-cat-header');
    header.style.borderLeftColor = cat.color;
    header.innerHTML =
      '<span class="spec-cat-arrow">' + (isOpen ? '▾' : '▸') + '</span>' +
      '<span class="spec-cat-icon">' + cat.icon + '</span>' +
      '<span class="spec-cat-name">' + cat.name + '</span>' +
      '<span class="spec-cat-cost">' + APP.formatCost(totalCost) + '</span>' +
      '<span class="spec-cat-count">' + catItemCount(cat) + '項目</span>';

    header.addEventListener('click', function () {
      expandedCats[cat.id] = !isOpen;
      render();
    });
    wrap.appendChild(header);

    // サブカテゴリ一覧（展開時）
    if (isOpen) {
      var content = mk('div', 'spec-cat-content');
      cat.subcategories.forEach(function (sub) {
        content.appendChild(buildSubcategory(cat, sub));
      });
      wrap.appendChild(content);
    }

    return wrap;
  }

  // ═══════════════════════════════════════
  // サブカテゴリ（L1）アコーディオン
  // ═══════════════════════════════════════
  function buildSubcategory(cat, sub) {
    var key = cat.id + '/' + sub.id;
    var isOpen = expandedSubs[key];
    var cost = sub.totalCost || (sub.items ? sub.items.reduce(function (s, i) { return s + (i.cost || 0); }, 0) : 0);

    var wrap = mk('div', 'spec-sub' + (isOpen ? ' open' : ''));
    wrap.id = 'spec-' + sub.id;

    var header = mk('div', 'spec-sub-header');
    header.innerHTML =
      '<span class="spec-sub-arrow">' + (isOpen ? '▾' : '▸') + '</span>' +
      '<span class="spec-sub-name">' + sub.name + '</span>' +
      '<span class="spec-sub-cost">' + APP.formatCost(cost) + '</span>' +
      '<span class="spec-sub-count">' + (sub.items ? sub.items.length : 0) + '項目</span>';

    header.addEventListener('click', function () {
      expandedSubs[key] = !isOpen;
      render();
    });
    wrap.appendChild(header);

    // アイテムカード一覧
    if (isOpen && sub.items) {
      var items = mk('div', 'spec-items');
      sub.items.forEach(function (item, idx) {
        items.appendChild(buildItemCard(cat, sub, item, idx));
      });
      wrap.appendChild(items);
    }

    return wrap;
  }

  // ═══════════════════════════════════════
  // 製品カード（L2）
  // ═══════════════════════════════════════
  function buildItemCard(cat, sub, item, idx) {
    var key = cat.id + '/' + sub.id + '/' + idx;
    var isOpen = expandedItems[key];

    var card = mk('div', 'spec-item-card' + (isOpen ? ' open' : ''));

    // 上段: サマリー行（常時表示）
    var summary = mk('div', 'spec-item-summary');
    summary.addEventListener('click', function () {
      expandedItems[key] = !isOpen;
      render();
    });

    // サムネイル（製品画像 or アイコンフォールバック）
    var thumb = mk('div', 'spec-item-thumb');
    var color = (item.thumb && THUMB_COLORS[item.thumb]) || '#f0f0f5';
    var icon = (item.thumb && THUMB_ICONS[item.thumb]) || '📋';
    var imgUrl = item.thumb && window.PRODUCT_IMAGES && window.PRODUCT_IMAGES[item.thumb];
    if (imgUrl) {
      thumb.classList.add('has-img');
      var img = mk('img', '');
      img.src = imgUrl;
      img.alt = item.name;
      img.loading = 'lazy';
      img.onerror = function () { this.parentNode.innerHTML = '<span>' + icon + '</span>'; this.parentNode.style.background = color; this.parentNode.classList.remove('has-img'); };
      thumb.appendChild(img);
    } else {
      thumb.style.background = color;
      thumb.innerHTML = '<span>' + icon + '</span>';
    }
    summary.appendChild(thumb);

    // 情報
    var info = mk('div', 'spec-item-brief');
    var nameHtml = '<span class="spec-item-name">' + esc(item.name) + '</span>';
    if (item.spec) nameHtml += '<span class="spec-item-spec">' + esc(item.spec) + '</span>';
    info.innerHTML = nameHtml;
    summary.appendChild(info);

    // メーカー
    if (item.manufacturer) {
      var mfr = mk('span', 'spec-item-mfr');
      mfr.textContent = item.manufacturer;
      summary.appendChild(mfr);
    }

    // 金額
    var cost = mk('span', 'spec-item-cost');
    cost.textContent = item.cost ? APP.formatCost(item.cost) : '—';
    summary.appendChild(cost);

    // 展開矢印
    var arrow = mk('span', 'spec-item-expand');
    arrow.textContent = isOpen ? '▾' : '▸';
    summary.appendChild(arrow);

    card.appendChild(summary);

    // 下段: 展開詳細
    if (isOpen) {
      var detail = mk('div', 'spec-item-detail');

      // 左: 大きいサムネイル + アクション
      var detailLeft = mk('div', 'spec-item-detail-left');
      var bigThumb = mk('div', 'spec-item-big-thumb');
      if (imgUrl) {
        bigThumb.classList.add('has-img');
        var bigImg = mk('img', '');
        bigImg.src = imgUrl;
        bigImg.alt = item.name;
        bigImg.loading = 'lazy';
        bigImg.onerror = function () { this.parentNode.innerHTML = '<span>' + icon + '</span>'; this.parentNode.style.background = color; this.parentNode.classList.remove('has-img'); };
        bigThumb.appendChild(bigImg);
      } else {
        bigThumb.style.background = color;
        bigThumb.innerHTML = '<span>' + icon + '</span>';
      }
      detailLeft.appendChild(bigThumb);

      // アクションボタン
      if (item.productUrl) {
        var link = mk('a', 'spec-item-link');
        link.href = item.productUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = '&#128279; 製品ページを見る';
        link.addEventListener('click', function (e) { e.stopPropagation(); });
        detailLeft.appendChild(link);
      }
      detail.appendChild(detailLeft);

      // 右: 詳細情報
      var detailRight = mk('div', 'spec-item-detail-right');
      var rows = [];
      if (item.spec) rows.push(['仕様', item.spec]);
      if (item.manufacturer) rows.push(['メーカー', item.manufacturer]);
      if (item.qty) rows.push(['数量', item.qty]);
      if (item.cost) rows.push(['金額', APP.formatCost(item.cost)]);

      rows.forEach(function (r) {
        var row = mk('div', 'spec-detail-row');
        row.innerHTML = '<span class="spec-detail-key">' + r[0] + '</span><span class="spec-detail-val">' + esc(r[1]) + '</span>';
        detailRight.appendChild(row);
      });

      // 説明文
      if (item.description) {
        var desc = mk('div', 'spec-item-desc');
        desc.textContent = item.description;
        detailRight.appendChild(desc);
      }

      // 製品リンク（テキストURL表示）
      if (item.productUrl) {
        var urlRow = mk('div', 'spec-detail-row');
        urlRow.innerHTML = '<span class="spec-detail-key">製品情報</span><a href="' + esc(item.productUrl) + '" target="_blank" rel="noopener noreferrer" class="spec-detail-url">' + esc(item.productUrl) + '</a>';
        urlRow.querySelector('a').addEventListener('click', function (e) { e.stopPropagation(); });
        detailRight.appendChild(urlRow);
      }

      detail.appendChild(detailRight);
      card.appendChild(detail);

      // 代替オプション
      var alts = window.SPEC_ALTERNATIVES && window.SPEC_ALTERNATIVES[item.name];
      if (alts) {
        card.appendChild(buildAlternatives(alts, item));
      }
    }

    return card;
  }

  // ═══════════════════════════════════════
  // 代替オプション（競合 / アップグレード / コストダウン）
  // ═══════════════════════════════════════
  var ALT_META = {
    competitor: { label: '競合製品',       icon: '🔄', cls: 'alt-competitor' },
    upgrade:    { label: 'アップグレード', icon: '⬆',  cls: 'alt-upgrade' },
    costdown:   { label: 'コストダウン',   icon: '⬇',  cls: 'alt-costdown' }
  };

  function buildAlternatives(alts, currentItem) {
    var wrap = mk('div', 'spec-alt-section');
    var title = mk('div', 'spec-alt-title');
    title.textContent = '代替オプション';
    wrap.appendChild(title);

    var grid = mk('div', 'spec-alt-grid');

    ['competitor', 'upgrade', 'costdown'].forEach(function (type) {
      var list = alts[type];
      if (!list || list.length === 0) return;

      var meta = ALT_META[type];
      var col = mk('div', 'spec-alt-col ' + meta.cls);

      var colHeader = mk('div', 'spec-alt-col-header');
      colHeader.innerHTML = '<span class="spec-alt-icon">' + meta.icon + '</span> ' + meta.label;
      col.appendChild(colHeader);

      list.forEach(function (alt) {
        var card = mk('div', 'spec-alt-card');

        var nameRow = mk('div', 'spec-alt-name');
        nameRow.textContent = alt.name;
        card.appendChild(nameRow);

        if (alt.manufacturer) {
          var mfr = mk('div', 'spec-alt-mfr');
          mfr.textContent = alt.manufacturer;
          card.appendChild(mfr);
        }

        if (alt.cost != null) {
          var costRow = mk('div', 'spec-alt-cost');
          costRow.textContent = APP.formatCost(alt.cost);
          // 差額表示
          if (currentItem.cost) {
            var diff = alt.cost - currentItem.cost;
            var diffSpan = mk('span', 'spec-alt-diff' + (diff > 0 ? ' diff-up' : diff < 0 ? ' diff-down' : ''));
            diffSpan.textContent = diff === 0 ? '±0' : (diff > 0 ? '+' : '') + APP.formatCost(Math.abs(diff));
            if (diff < 0) diffSpan.textContent = '−' + APP.formatCost(Math.abs(diff));
            costRow.appendChild(diffSpan);
          }
          card.appendChild(costRow);
        }

        if (alt.note) {
          var note = mk('div', 'spec-alt-note');
          note.textContent = alt.note;
          card.appendChild(note);
        }

        if (alt.productUrl) {
          var link = mk('a', 'spec-alt-link');
          link.href = alt.productUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = '製品ページ →';
          link.addEventListener('click', function (e) { e.stopPropagation(); });
          card.appendChild(link);
        }

        col.appendChild(card);
      });

      grid.appendChild(col);
    });

    wrap.appendChild(grid);
    return wrap;
  }

  // ═══════════════════════════════════════
  // 検索
  // ═══════════════════════════════════════
  function renderSearch(body) {
    var q = searchQuery.toLowerCase();
    var results = [];
    D.specs.categories.forEach(function (cat) {
      cat.subcategories.forEach(function (sub) {
        if (!sub.items) return;
        sub.items.forEach(function (item, idx) {
          var s = [item.name, item.spec, item.manufacturer, item.description, sub.name, cat.name].filter(Boolean).join(' ').toLowerCase();
          if (s.indexOf(q) >= 0) results.push({ item: item, cat: cat, sub: sub, idx: idx });
        });
      });
    });

    if (results.length === 0) {
      body.innerHTML = '<div class="spec-no-result">「' + esc(searchQuery) + '」に一致する仕様が見つかりませんでした</div>';
      return;
    }

    var countEl = mk('div', 'spec-search-count');
    countEl.textContent = results.length + '件の仕様が見つかりました';
    body.appendChild(countEl);

    results.forEach(function (r) {
      // パンくず
      var crumb = mk('div', 'spec-search-crumb');
      crumb.textContent = r.cat.icon + ' ' + r.cat.name + ' > ' + r.sub.name;
      body.appendChild(crumb);

      // 自動展開状態にして描画
      var key = r.cat.id + '/' + r.sub.id + '/' + r.idx;
      expandedItems[key] = true;
      body.appendChild(buildItemCard(r.cat, r.sub, r.item, r.idx));
    });
  }

  // ── ヘルパー ──
  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function esc(s) { return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }
  function catCost(cat) { var t = 0; cat.subcategories.forEach(function (s) { t += s.totalCost || (s.items ? s.items.reduce(function (a, i) { return a + (i.cost || 0); }, 0) : 0); }); return t; }
  function catItemCount(cat) { var t = 0; cat.subcategories.forEach(function (s) { if (s.items) t += s.items.length; }); return t; }
})();
