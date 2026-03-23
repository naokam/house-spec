// ============================================================
// ダッシュボード — 見積書スムーズ階層メニュー
// 左: ツリーナビ（常時表示）  右: 詳細パネル（選択に応じて切替）
// ============================================================
(function () {
  'use strict';
  const D = window.HOUSE_DATA;

  const COLORS = ['#2563EB','#059669','#D97706','#7C3AED','#DC2626','#6B7280','#0EA5E9','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16','#EF4444','#06B6D4','#92400E','#065F46','#B45309','#9CA3AF'];
  const TOP_ICONS = { temp: '🏗', main: '🏠', exterior: '🌳', overhead: '📋', adjust: '⚖', discount: '🏷' };

  // 状態
  let expandedTop = null;   // 展開中のトップID
  let expandedSub = null;   // 展開中のサブID
  let selectedItem = null;  // { topId, subId? } 詳細パネル用

  window.renderDashboard = function () {
    const c = document.getElementById('view-dashboard');
    c.innerHTML = '';

    // 総額ヘッダー（コンパクト）
    const hdr = el('div', 'dash-header');
    hdr.innerHTML = `
      <div class="dash-total">
        <span class="dash-total-label">${D.estimate.contractor}｜御見積金額（税込）</span>
        <span class="dash-total-value">${fmt(D.estimate.total)}</span>
        <span class="dash-total-sub">工事代金 ${fmt(D.estimate.construction)}　消費税 ${fmt(D.estimate.tax)}</span>
      </div>`;
    c.appendChild(hdr);

    // 2カラムレイアウト
    const layout = el('div', 'dash-layout');
    const nav = el('div', 'dash-nav');
    const detail = el('div', 'dash-detail');
    detail.id = 'dash-detail-panel';
    layout.appendChild(nav);
    layout.appendChild(detail);
    c.appendChild(layout);

    // ツリーナビ構築
    buildTree(nav);

    // 初期詳細: トップ概要
    renderOverview(detail);
  };

  // 外部ナビゲーション
  window.dashboardDrill = function (topId, subId) {
    expandedTop = topId;
    expandedSub = subId || null;
    selectedItem = { topId: topId, subId: subId || null };
    window.renderDashboard();
  };

  // ═══════════════════════════════════════
  // ツリーナビ構築
  // ═══════════════════════════════════════
  function buildTree(nav) {
    D.estimate.topLevel.forEach((top, ti) => {
      const d = D.estimate.details[top.id];
      const hasChildren = d && (d.subcategories || (d.items && d.items.length > 0));
      const isExpanded = expandedTop === top.id;

      // トップ行
      const row = el('div', 'tree-row tree-l0' + (isExpanded ? ' expanded' : '') + (selectedItem && selectedItem.topId === top.id && !selectedItem.subId ? ' selected' : ''));
      row.style.setProperty('--accent-c', COLORS[ti % COLORS.length]);

      const arrow = el('span', 'tree-arrow');
      arrow.textContent = hasChildren ? (isExpanded ? '▾' : '▸') : '　';
      row.appendChild(arrow);

      const icon = el('span', 'tree-icon');
      icon.textContent = TOP_ICONS[top.id] || '';
      row.appendChild(icon);

      const label = el('span', 'tree-label');
      label.textContent = top.name;
      row.appendChild(label);

      const cost = el('span', 'tree-cost');
      cost.textContent = fmt(top.cost);
      if (top.cost < 0) cost.classList.add('negative');
      row.appendChild(cost);

      const pctBar = el('div', 'tree-pct-bar');
      if (top.cost > 0) {
        const pct = top.cost / D.estimate.construction * 100;
        pctBar.innerHTML = `<div class="tree-pct-fill" style="width:${pct.toFixed(1)}%;background:${COLORS[ti % COLORS.length]}"></div>`;
      }
      row.appendChild(pctBar);

      row.addEventListener('click', function () {
        if (hasChildren) {
          expandedTop = isExpanded ? null : top.id;
          expandedSub = null;
        }
        selectedItem = { topId: top.id, subId: null };
        refreshTree(nav);
        refreshDetail();
      });

      nav.appendChild(row);

      // サブ行（本体工事のサブカテゴリ）
      if (d && d.subcategories && isExpanded) {
        const subWrap = el('div', 'tree-sub-wrap');
        d.subcategories.forEach((sub, si) => {
          const isSel = selectedItem && selectedItem.topId === top.id && selectedItem.subId === sub.id;
          const isSubExpanded = expandedSub === sub.id;
          const subRow = el('div', 'tree-row tree-l1' + (isSel ? ' selected' : ''));
          subRow.style.setProperty('--accent-c', COLORS[si % COLORS.length]);

          const sArrow = el('span', 'tree-arrow');
          sArrow.textContent = (sub.items && sub.items.length > 0) ? (isSubExpanded ? '▾' : '▸') : '　';
          subRow.appendChild(sArrow);

          const sLabel = el('span', 'tree-label');
          sLabel.textContent = sub.name;
          subRow.appendChild(sLabel);

          const sCost = el('span', 'tree-cost');
          sCost.textContent = fmt(sub.cost);
          subRow.appendChild(sCost);

          subRow.addEventListener('click', function (e) {
            e.stopPropagation();
            expandedSub = isSubExpanded ? null : sub.id;
            selectedItem = { topId: top.id, subId: sub.id };
            refreshTree(nav);
            refreshDetail();
          });
          subWrap.appendChild(subRow);

          // L2: 個別アイテム（折りたたみ）
          if (sub.items && isSubExpanded) {
            sub.items.forEach(function (item) {
              const itemRow = el('div', 'tree-row tree-l2');
              const iLabel = el('span', 'tree-label');
              iLabel.textContent = item.name;
              itemRow.appendChild(iLabel);
              // 相場バッジ
              const badge = marketBadgeHtml(item);
              if (badge) {
                const badgeSpan = el('span', '');
                badgeSpan.innerHTML = badge;
                itemRow.appendChild(badgeSpan);
              }
              const iCost = el('span', 'tree-cost');
              iCost.textContent = item.cost ? fmt(item.cost) : '—';
              itemRow.appendChild(iCost);
              if (item.productUrl) {
                const link = el('a', 'tree-link');
                link.href = item.productUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = '↗';
                link.title = '製品ページ';
                link.addEventListener('click', function (e) { e.stopPropagation(); });
                itemRow.appendChild(link);
              }
              subWrap.appendChild(itemRow);
            });
          }
        });
        nav.appendChild(subWrap);
      }

      // 直接アイテム行（仮設/外構/諸経費）展開時
      if (d && !d.subcategories && d.items && d.items.length > 0 && isExpanded) {
        const itemWrap = el('div', 'tree-sub-wrap');
        d.items.forEach(function (item) {
          const itemRow = el('div', 'tree-row tree-l1');
          const iLabel = el('span', 'tree-label');
          iLabel.textContent = item.name;
          itemRow.appendChild(iLabel);
          const badge2 = marketBadgeHtml(item);
          if (badge2) {
            const bs = el('span', '');
            bs.innerHTML = badge2;
            itemRow.appendChild(bs);
          }
          const iCost = el('span', 'tree-cost');
          iCost.textContent = item.cost ? fmt(item.cost) : '—';
          itemRow.appendChild(iCost);
          if (item.productUrl) {
            const link = el('a', 'tree-link');
            link.href = item.productUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = '↗';
            link.addEventListener('click', function (e) { e.stopPropagation(); });
            itemRow.appendChild(link);
          }
          itemWrap.appendChild(itemRow);
        });
        nav.appendChild(itemWrap);
      }
    });
  }

  function refreshTree(nav) {
    nav.innerHTML = '';
    buildTree(nav);
  }

  function refreshDetail() {
    const panel = document.getElementById('dash-detail-panel');
    if (!panel) return;
    // アニメーション
    panel.classList.remove('dash-detail-in');
    void panel.offsetWidth;
    panel.classList.add('dash-detail-in');

    panel.innerHTML = '';

    if (!selectedItem) {
      renderOverview(panel);
      return;
    }

    const d = D.estimate.details[selectedItem.topId];
    if (!d) { renderOverview(panel); return; }

    if (selectedItem.subId && d.subcategories) {
      const sub = d.subcategories.find(s => s.id === selectedItem.subId);
      if (sub) {
        renderSubDetail(panel, sub, d);
        return;
      }
    }

    renderTopDetail(panel, selectedItem.topId, d);
  }

  // ═══════════════════════════════════════
  // 詳細パネル: 全体概要
  // ═══════════════════════════════════════
  function renderOverview(panel) {
    panel.innerHTML = '<div class="detail-title">見積内訳概要</div>';
    const positiveItems = D.estimate.topLevel.filter(t => t.cost > 0);
    panel.appendChild(buildDonut(positiveItems, D.estimate.construction));
    panel.appendChild(buildMiniBar(positiveItems));
  }

  // ═══════════════════════════════════════
  // 詳細パネル: トップカテゴリ
  // ═══════════════════════════════════════
  function renderTopDetail(panel, topId, d) {
    panel.innerHTML = '';
    const titleEl = el('div', 'detail-title');
    titleEl.textContent = d.name;
    panel.appendChild(titleEl);

    const costEl = el('div', 'detail-cost-big');
    costEl.textContent = fmt(d.cost);
    if (d.page) {
      const pg = el('span', 'detail-page');
      pg.textContent = 'P.' + d.page;
      costEl.appendChild(pg);
    }
    panel.appendChild(costEl);

    if (d.subcategories) {
      const validSubs = d.subcategories.filter(s => s.cost > 0);
      panel.appendChild(buildDonut(validSubs, d.cost));
      panel.appendChild(buildMiniBar(validSubs));
    } else if (d.items && d.items.length > 0) {
      panel.appendChild(buildDonut(d.items.filter(i => i.cost > 0), d.cost));
      panel.appendChild(buildTable(d.items, d.cost));
    }
  }

  // ═══════════════════════════════════════
  // 詳細パネル: サブカテゴリ
  // ═══════════════════════════════════════
  function renderSubDetail(panel, sub, parent) {
    panel.innerHTML = '';
    const breadEl = el('div', 'detail-bread');
    const parentLink = el('a', '');
    parentLink.textContent = parent.name;
    parentLink.addEventListener('click', function () {
      selectedItem = { topId: selectedItem.topId, subId: null };
      expandedSub = null;
      refreshTree(document.querySelector('.dash-nav'));
      refreshDetail();
    });
    breadEl.appendChild(parentLink);
    breadEl.appendChild(document.createTextNode(' > ' + sub.name));
    panel.appendChild(breadEl);

    const titleEl = el('div', 'detail-title');
    titleEl.textContent = sub.name;
    panel.appendChild(titleEl);

    const costEl = el('div', 'detail-cost-big');
    costEl.textContent = fmt(sub.cost);
    if (sub.page) {
      const pg = el('span', 'detail-page');
      pg.textContent = 'P.' + sub.page;
      costEl.appendChild(pg);
    }
    panel.appendChild(costEl);

    if (sub.note) {
      const note = el('div', 'detail-note');
      note.textContent = sub.note;
      panel.appendChild(note);
    }

    if (sub.items && sub.items.length > 0) {
      const barItems = sub.items.filter(i => i.cost > 0);
      if (barItems.length > 1) {
        panel.appendChild(buildDonut(barItems, sub.cost));
      }
      panel.appendChild(buildTable(sub.items, sub.cost));
    }
  }

  // ═══════════════════════════════════════
  // 共通: ドーナツ
  // ═══════════════════════════════════════
  function buildDonut(items, total) {
    const wrapper = el('div', 'donut-chart-wrapper');
    let gradient = '', cumPct = 0;
    items.forEach(function (b, i) {
      var pct = total > 0 ? b.cost / total * 100 : 0;
      gradient += COLORS[i % COLORS.length] + ' ' + cumPct + '% ' + (cumPct + pct) + '%';
      if (i < items.length - 1) gradient += ', ';
      cumPct += pct;
    });
    const donut = el('div', 'donut-chart');
    donut.style.background = 'conic-gradient(' + gradient + ')';
    const center = el('div', 'donut-center');
    center.innerHTML = '<div class="donut-center-value">' + fmt(total) + '</div><div class="donut-center-label">合計</div>';
    donut.appendChild(center);
    wrapper.appendChild(donut);

    var legend = el('div', 'donut-legend');
    items.forEach(function (b, i) {
      var pct = total > 0 ? (b.cost / total * 100).toFixed(1) : '—';
      var item = el('div', 'donut-legend-item');
      item.innerHTML = '<div class="donut-legend-color" style="background:' + COLORS[i % COLORS.length] + '"></div><div class="donut-legend-name">' + esc(b.name) + '</div><div class="donut-legend-value">' + pct + '%</div>';
      legend.appendChild(item);
    });
    wrapper.appendChild(legend);
    return wrapper;
  }

  // ═══════════════════════════════════════
  // 共通: ミニ棒グラフ
  // ═══════════════════════════════════════
  function buildMiniBar(items) {
    var chart = el('div', 'bar-chart');
    var maxCost = Math.max.apply(null, items.map(function (b) { return b.cost; }));
    items.forEach(function (b, i) {
      var pct = (b.cost / maxCost * 100).toFixed(1);
      var row = el('div', 'bar-row');
      row.innerHTML = '<div class="bar-label">' + esc(b.name) + '</div><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + COLORS[i % COLORS.length] + '"></div></div><div class="bar-value">' + fmt(b.cost) + '</div>';
      chart.appendChild(row);
    });
    return chart;
  }

  // ═══════════════════════════════════════
  // 共通: テーブル
  // ═══════════════════════════════════════
  function buildTable(items, total) {
    var wrap = el('div', 'detail-table-wrap');
    var maxCost = Math.max.apply(null, items.map(function (i) { return i.cost || 0; }));
    var html = '<table class="detail-table"><thead><tr><th>名称</th><th>仕様</th><th class="r">数量</th><th class="r">単価</th><th class="r">金額</th><th>相場比較</th></tr></thead><tbody>';
    items.forEach(function (item) {
      var pct = (total && item.cost) ? (item.cost / total * 100).toFixed(1) : '';
      var barW = (maxCost && item.cost) ? (item.cost / maxCost * 100).toFixed(0) : 0;
      html += '<tr>';
      html += '<td class="td-name">' + esc(item.name);
      if (item.manufacturer) html += '<br><span class="td-mfr">' + esc(item.manufacturer) + '</span>';
      if (item.note) html += '<br><span class="td-mfr">' + esc(item.note) + '</span>';
      html += '</td>';
      html += '<td class="td-spec">' + esc(item.spec || '') + '</td>';
      html += '<td class="r">' + (item.qty != null ? item.qty + (item.unit ? ' ' + item.unit : '') : '') + '</td>';
      html += '<td class="r">' + (item.unitPrice ? fmt(item.unitPrice) : '') + '</td>';
      html += '<td class="r b">' + (item.cost ? fmt(item.cost) : '—') + '</td>';
      html += '<td class="td-market">' + marketBadgeHtml(item);
      if (item.productUrl) html += ' <a href="' + esc(item.productUrl) + '" target="_blank" rel="noopener noreferrer" class="tbl-link" title="製品ページ">↗</a>';
      html += '</td></tr>';
      // 相場レンジバー行
      var mBar = marketBarHtml(item);
      if (mBar) {
        html += '<tr class="bar-tr"><td colspan="6">' + mBar + '</td></tr>';
      }
      if (item.cost && pct) {
        html += '<tr class="bar-tr"><td colspan="6"><div class="tbl-bar-wrap"><div class="tbl-bar" style="width:' + barW + '%"></div><span class="tbl-pct">' + pct + '%</span></div></td></tr>';
      }
    });
    var itemTotal = items.reduce(function (s, i) { return s + (i.cost || 0); }, 0);
    html += '<tr class="total-tr"><td colspan="4">合計</td><td class="r b">' + fmt(itemTotal) + '</td><td></td></tr>';
    html += '</tbody></table>';
    wrap.innerHTML = html;
    return wrap;
  }

  // ═══════════════════════════════════════
  // コスト分析ビュー
  // ═══════════════════════════════════════
  window.renderCost = function () {
    var c = document.getElementById('view-cost');
    c.innerHTML = '';
    c.appendChild(el('div', 'section-title')).textContent = 'コスト分析';
    var totalCard = el('div', 'cost-total-card');
    totalCard.innerHTML = '<div class="cost-total-label">総工事費（税込）</div><div class="cost-total-value">' + fmt(D.estimate.total) + '</div><div class="cost-detail-row"><span>工事費: ' + fmt(D.estimate.construction) + '</span><span>消費税: ' + fmt(D.estimate.tax) + '</span></div>';
    c.appendChild(totalCard);
    var mainDetail = D.estimate.details.main;
    var sub = el('div', 'section-subtitle');
    sub.textContent = '本体工事内訳（' + fmt(mainDetail.cost) + '）';
    c.appendChild(sub);
    c.appendChild(buildDonut(mainDetail.subcategories.filter(function (s) { return s.cost > 0; }), mainDetail.cost));
    var sub2 = el('div', 'section-subtitle mb-4');
    sub2.textContent = '工事種別 金額比較';
    sub2.style.marginTop = '28px';
    c.appendChild(sub2);
    c.appendChild(buildMiniBar(mainDetail.subcategories.filter(function (s) { return s.cost > 0; })));
  };

  // ═══════════════════════════════════════
  // 相場比較ヘルパー
  // ═══════════════════════════════════════
  function getMarket(item) {
    if (!D.marketRanges || !item.unitPrice) return null;
    var m = D.marketRanges[item.name];
    if (!m) return null;
    var up = item.unitPrice;
    var verdict, cls;
    if (up < m.low) { verdict = '割安'; cls = 'market-cheap'; }
    else if (up > m.high) { verdict = '割高'; cls = 'market-expensive'; }
    else { verdict = '相場内'; cls = 'market-fair'; }
    var mid = (m.low + m.high) / 2;
    var diff = Math.round((up - mid) / mid * 100);
    return { low: m.low, high: m.high, unit: m.unit, note: m.note, verdict: verdict, cls: cls, diff: diff, unitPrice: up };
  }

  function marketBadgeHtml(item) {
    var m = getMarket(item);
    if (!m) return '';
    return '<span class="market-badge ' + m.cls + '" title="相場 ' + fmt(m.low) + '〜' + fmt(m.high) + m.unit + '&#10;' + esc(m.note) + '">' + m.verdict + '</span>';
  }

  function marketBarHtml(item) {
    var m = getMarket(item);
    if (!m) return '';
    var rangeWidth = m.high - m.low;
    var barMin = m.low * 0.7;
    var barMax = m.high * 1.3;
    var barRange = barMax - barMin;
    var lowPct = ((m.low - barMin) / barRange * 100).toFixed(1);
    var highPct = ((m.high - barMin) / barRange * 100).toFixed(1);
    var valPct = Math.min(100, Math.max(0, ((m.unitPrice - barMin) / barRange * 100))).toFixed(1);
    return '<div class="market-range-wrap">' +
      '<div class="market-range-bar">' +
        '<div class="market-range-zone" style="left:' + lowPct + '%;width:' + (highPct - lowPct).toFixed(1) + '%"></div>' +
        '<div class="market-range-pin" style="left:' + valPct + '%"></div>' +
      '</div>' +
      '<div class="market-range-labels">' +
        '<span>' + fmt(m.low) + '</span>' +
        '<span class="market-range-note">' + esc(m.note) + '</span>' +
        '<span>' + fmt(m.high) + '</span>' +
      '</div></div>';
  }

  // ── ヘルパー ──
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function fmt(n) { return APP.formatCost(n); }
  function esc(s) { return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }
})();
