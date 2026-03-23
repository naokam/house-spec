// ============================================================
// 平面図ビュー — けい建築設計事務所の設計図画像 + 部屋ホットスポット
// ============================================================
(function () {
  'use strict';
  var D = window.HOUSE_DATA;
  var currentLevel = '1F';
  var selectedRoomId = null;

  // ズーム・パン状態
  var zoomState = { scale: 1, x: 0, y: 0 };
  var MIN_SCALE = 1;
  var MAX_SCALE = 5;
  var animId = 0; // アニメーション識別子（新アニメで旧を無効化）

  // 現在の図面DOM参照（ズームアニメーション用に保持）
  var liveImgContainer = null;
  var liveImgWrap = null;
  var liveZoomLabel = null;

  // 部屋→仕様マッピング（部屋IDからカテゴリ/サブカテゴリへのリンク）
  var ROOM_SPEC_LINKS = {
    kitchen: [
      { label: 'キッチン', catId: 'equipment', subId: 'kitchen' },
      { label: '床仕上', catId: 'interior', subId: 'flooring' },
      { label: '壁・天井', catId: 'interior', subId: 'wall-ceiling' }
    ],
    dining: [
      { label: '床暖房', catId: 'equipment', subId: 'floor-heating' },
      { label: '床仕上', catId: 'interior', subId: 'flooring' },
      { label: '建具', catId: 'windows-doors', subId: 'interior-doors' }
    ],
    living: [
      { label: '床暖房', catId: 'equipment', subId: 'floor-heating' },
      { label: '床仕上', catId: 'interior', subId: 'flooring' },
      { label: '壁・天井', catId: 'interior', subId: 'wall-ceiling' }
    ],
    'stairs-1f': [
      { label: '階段', catId: 'stairs' }
    ],
    terrace: [
      { label: '外壁', catId: 'exterior', subId: 'siding' }
    ],
    entrance: [
      { label: '洗面', catId: 'equipment', subId: 'washroom' },
      { label: '床仕上', catId: 'interior', subId: 'flooring' },
      { label: '玄関・門扉', catId: 'windows-doors', subId: 'entrance' }
    ],
    hall01: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' }
    ],
    storage01: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' }
    ],
    stockroom: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' }
    ],
    br: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' },
      { label: '壁・天井', catId: 'interior', subId: 'wall-ceiling' },
      { label: '建具', catId: 'windows-doors', subId: 'interior-doors' }
    ],
    mbr: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' },
      { label: '壁・天井', catId: 'interior', subId: 'wall-ceiling' }
    ],
    fcl: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' }
    ],
    bath: [
      { label: '浴室', catId: 'equipment', subId: 'bath' }
    ],
    utility: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' }
    ],
    powder: [
      { label: '洗面', catId: 'equipment', subId: 'washroom' },
      { label: '床仕上', catId: 'interior', subId: 'flooring' }
    ],
    hall02: [
      { label: '床仕上', catId: 'interior', subId: 'flooring' }
    ],
    'stairs-2f': [
      { label: '階段', catId: 'stairs' }
    ],
    wc: [
      { label: 'トイレ', catId: 'equipment', subId: 'toilet' }
    ],
    balcony: [
      { label: '外壁', catId: 'exterior', subId: 'siding' }
    ],
    koyaura: [
      { label: '断熱', catId: 'insulation', subId: 'insulation-wall' }
    ],
    'loft-space': [
      { label: '断熱', catId: 'insulation', subId: 'insulation-wall' }
    ]
  };

  // 部屋→CGパース画像マッピング（basePath + ファイル名, ラベル）
  var CG_BASE = 'Data/CGパース/';
  var ROOM_CG_IMAGES = {
    kitchen: [
      { file: 'スクリーンショット 2026-02-15 215326.png', label: 'キッチン' },
      { file: 'スクリーンショット 2026-02-15 215619.png', label: 'キッチン カウンター' },
      { file: 'スクリーンショット 2026-02-21 191651.png', label: 'キッチン側' }
    ],
    dining: [
      { file: 'スクリーンショット 2026-02-15 212511.png', label: 'ダイニング・階段' },
      { file: 'スクリーンショット 2026-02-15 212844.png', label: 'ダイニング全景' }
    ],
    living: [
      { file: 'スクリーンショット 2026-02-15 213104.png', label: 'リビング側' },
      { file: 'スクリーンショット 2026-02-15 214449.png', label: 'リビング吹抜' }
    ],
    'stairs-1f': [
      { file: 'スクリーンショット 2026-02-15 212511.png', label: '階段・ダイニング方向' },
      { file: 'スクリーンショット 2026-02-23 155322.png', label: '鉄骨スケルトン階段' }
    ],
    terrace: [
      { file: 'スクリーンショット 2026-02-15 214908.png', label: 'テラスからLDK方向' }
    ],
    entrance: [
      { file: 'スクリーンショット 2026-02-15 205641.png', label: '玄関アプローチ' },
      { file: 'スクリーンショット 2026-02-21 142344.png', label: '玄関 門扉' },
      { file: 'スクリーンショット 2026-02-15 212151.png', label: '玄関ホールからLDK' }
    ],
    hall01: [
      { file: 'スクリーンショット 2026-02-15 212151.png', label: 'ホール01 → LDK' }
    ],
    storage01: [
      { file: 'スクリーンショット 2026-02-15 212151.png', label: '1F 収納方向' }
    ],
    stockroom: [],
    br: [
      { file: 'スクリーンショット 2026-02-15 223043.png', label: 'BR ピアノ・ロフトはしご' }
    ],
    mbr: [
      { file: 'スクリーンショット 2026-02-15 220723.png', label: 'MBR 主寝室' },
      { file: 'スクリーンショット 2026-02-15 220333.png', label: 'MBR 階段側から' }
    ],
    fcl: [
      { file: 'スクリーンショット 2026-02-15 221057.png', label: 'FCL クローゼット' }
    ],
    bath: [
      { file: 'スクリーンショット 2026-02-15 221843.png', label: '浴室・ユーティリティ' }
    ],
    utility: [
      { file: 'スクリーンショット 2026-02-15 221843.png', label: 'ユーティリティ・浴室' }
    ],
    powder: [
      { file: 'スクリーンショット 2026-02-15 221255.png', label: 'パウダールーム 廊下' },
      { file: 'スクリーンショット 2026-02-15 221535.png', label: 'パウダールーム 洗面台' }
    ],
    hall02: [
      { file: 'スクリーンショット 2026-02-15 222310.png', label: 'ホール02 階段' },
      { file: 'スクリーンショット 2026-02-15 222723.png', label: 'ホール02 → ロフト階段' }
    ],
    'stairs-2f': [
      { file: 'スクリーンショット 2026-02-23 155322.png', label: '鉄骨スケルトン階段' },
      { file: 'スクリーンショット 2026-02-15 222723.png', label: '2F → ロフト階段' }
    ],
    wc: [
      { file: 'スクリーンショット 2026-02-15 221255.png', label: 'WC方向' }
    ],
    balcony: [
      { file: 'スクリーンショット 2026-02-15 210120.png', label: 'バルコニー外観' }
    ],
    koyaura: [
      { file: 'スクリーンショット 2026-02-15 223546.png', label: '小屋裏' },
      { file: 'スクリーンショット 2026-02-15 223837.png', label: '小屋裏・ロフト上部' }
    ],
    'loft-space': [
      { file: 'スクリーンショット 2026-02-15 223546.png', label: 'ロフト空間' },
      { file: 'スクリーンショット 2026-02-15 223837.png', label: 'ロフト上部から' }
    ]
  };

  // 階全体のCGパース（部屋未選択時用）
  var LEVEL_CG_IMAGES = {
    '1F': [
      { file: 'スクリーンショット 2026-02-15 205013.png', label: '外観 正面' },
      { file: 'スクリーンショット 2026-02-15 205331.png', label: '外観 玄関側' },
      { file: 'スクリーンショット 2026-02-15 205940.png', label: '外観 斜め' },
      { file: 'スクリーンショット 2026-02-15 210518.png', label: '外観 俯瞰' },
      { file: 'スクリーンショット 2026-02-15 210909.png', label: '1F 俯瞰（屋根なし）' },
      { file: 'スクリーンショット 2026-02-15 211337.png', label: '1F 玄関俯瞰' }
    ],
    '2F': [
      { file: 'スクリーンショット 2026-02-15 211720.png', label: '外観 玄関正面' },
      { file: 'スクリーンショット 2026-02-15 220333.png', label: '2F 階段・MBR' },
      { file: 'スクリーンショット 2026-02-23 164508.png', label: '外観 屋根俯瞰' }
    ],
    'loft': [
      { file: 'スクリーンショット 2026-02-15 223546.png', label: '小屋裏空間' },
      { file: 'スクリーンショット 2026-02-15 223837.png', label: 'ロフト上部' },
      { file: 'スクリーンショット 2026-02-23 164508.png', label: '屋根全景' }
    ]
  };

  // 各階の画像と部屋ホットスポット座標（%ベースで画像上の位置を指定）
  var LEVELS = {
    '1F': {
      image: 'img/floorplan_1f.png',
      title: '1階平面詳細図（A-04）',
      hotspots: [
        // LDK 細分化
        { id: 'kitchen',    x: 25, y: 15, w: 32, h: 13, label: 'キッチン' },
        { id: 'dining',     x: 25, y: 28, w: 14, h: 15, label: 'ダイニング' },
        { id: 'living',     x: 39, y: 28, w: 18, h: 20, label: 'リビング' },
        { id: 'stairs-1f',  x: 27, y: 46, w: 8,  h: 10, label: '階段' },
        { id: 'terrace',    x: 58, y: 22, w: 18, h: 32, label: 'テラスデッキ' },
        // 個室・共用
        { id: 'entrance',   x: 14, y: 14, w: 10, h: 10, label: '玄関' },
        { id: 'hall01',     x: 18, y: 23, w: 6,  h: 6,  label: 'ホール01' },
        { id: 'storage01',  x: 14, y: 31, w: 10, h: 14, label: '収納01' },
        { id: 'stockroom',  x: 14, y: 46, w: 10, h: 13, label: '備蓄倉庫' }
      ]
    },
    '2F': {
      image: 'img/floorplan_2f.png',
      title: '2階平面詳細図（A-05）',
      hotspots: [
        // 個室
        { id: 'br',         x: 42, y: 16, w: 14, h: 26, label: 'BR' },
        { id: 'mbr',        x: 32, y: 16, w: 10, h: 14, label: 'MBR' },
        { id: 'fcl',        x: 22, y: 16, w: 10, h: 16, label: 'FCL' },
        // 水回り
        { id: 'bath',       x: 13, y: 16, w: 9,  h: 9,  label: '浴室' },
        { id: 'utility',    x: 13, y: 25, w: 9,  h: 8,  label: 'ﾕｰﾃｨﾘﾃｨ' },
        { id: 'powder',     x: 13, y: 35, w: 14, h: 12, label: 'ﾊﾟｳﾀﾞｰ' },
        { id: 'wc',         x: 13, y: 50, w: 9,  h: 10, label: 'WC' },
        // 共用・動線
        { id: 'hall02',     x: 28, y: 38, w: 14, h: 12, label: 'ホール02' },
        { id: 'stairs-2f',  x: 28, y: 32, w: 8,  h: 6,  label: '階段' },
        { id: 'hall03',     x: 42, y: 44, w: 12, h: 10, label: 'ホール03' },
        // 外部
        { id: 'balcony',    x: 56, y: 14, w: 12, h: 16, label: 'Balcony' }
      ]
    },
    'loft': {
      image: 'img/floorplan_loft.png',
      title: 'ロフト平面詳細図（A-06）',
      hotspots: [
        { id: 'koyaura',    x: 25, y: 22, w: 22, h: 18, label: '小屋裏' },
        { id: 'loft-space', x: 24, y: 42, w: 20, h: 16, label: 'ロフト' }
      ]
    }
  };

  window.renderFloorplan = function () {
    var c = document.getElementById('view-floorplan');
    c.innerHTML = '';

    c.appendChild(mk('div', 'section-title')).textContent = '平面図';

    // 図面情報
    var info = mk('div', 'fp-info');
    info.innerHTML = 'けい建築設計事務所 260309_平面図.pdf（2026.03.09）<br>岡本 直也様邸新築工事｜準耐火構造｜縮尺 1/50';
    c.appendChild(info);

    // タブ
    var tabs = mk('div', 'tabs');
    ['1F', '2F', 'loft'].forEach(function (lvl) {
      var lvData = D.levels[lvl];
      var btn = mk('button', 'tab-btn' + (currentLevel === lvl ? ' active' : ''));
      btn.textContent = lvData.name + '（' + lvData.floorArea + '㎡）';
      btn.addEventListener('click', function () {
        if (currentLevel === lvl) return;
        currentLevel = lvl;
        selectedRoomId = null;
        zoomState = { scale: 1, x: 0, y: 0 };
        animId++;
        renderContent(c);
      });
      tabs.appendChild(btn);
    });
    c.appendChild(tabs);

    renderContent(c);
  };

  // 図面エリアを構築（階切替時のみ再生成）
  function buildImageArea(c, lvl) {
    var imgWrap = mk('div', 'fp-img-wrap');
    var imgContainer = mk('div', 'fp-img-container');

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
    zoomResetBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      animateZoom(imgContainer, 1, 0, 0, zoomLevel);
    });

    zoomBar.appendChild(zoomOutBtn);
    zoomBar.appendChild(zoomLevel);
    zoomBar.appendChild(zoomInBtn);
    zoomBar.appendChild(zoomResetBtn);
    imgWrap.appendChild(zoomBar);

    var img = mk('img', 'fp-img');
    img.src = lvl.image;
    img.alt = lvl.title;
    img.draggable = false;
    imgContainer.appendChild(img);

    // ホットスポットオーバーレイ
    lvl.hotspots.forEach(function (hs) {
      var spot = mk('div', 'fp-hotspot' + (selectedRoomId === hs.id ? ' active' : ''));
      spot.style.left = hs.x + '%';
      spot.style.top = hs.y + '%';
      spot.style.width = hs.w + '%';
      spot.style.height = hs.h + '%';
      spot.setAttribute('data-label', hs.label);
      spot.setAttribute('data-room-id', hs.id);

      // ポップアップオーバーレイ（CG + 仕様リンク）
      var cgImgs = ROOM_CG_IMAGES[hs.id] || [];
      var specLinks = ROOM_SPEC_LINKS[hs.id] || [];
      var hasCg = cgImgs.length > 0;
      var hasSpec = specLinks.length > 0;

      if (hasCg || hasSpec) {
        var overlay = mk('div', 'fp-cg-overlay');
        var inner = mk('div', 'fp-cg-overlay-inner');

        // CG画像部
        var overlayImg = null, overlayLabel = null;
        if (hasCg) {
          overlayImg = mk('img', '');
          overlayImg.src = CG_BASE + cgImgs[0].file;
          overlayImg.alt = cgImgs[0].label;
          overlayImg.loading = 'lazy';
          inner.appendChild(overlayImg);
          overlayLabel = mk('div', 'fp-cg-overlay-label');
          overlayLabel.textContent = cgImgs[0].label + (cgImgs.length > 1 ? '  (+' + (cgImgs.length - 1) + ')' : '');
          inner.appendChild(overlayLabel);
        }

        // 仕様リンクバー
        if (hasSpec) {
          var linkBar = mk('div', 'fp-overlay-links');
          specLinks.forEach(function (link) {
            var btn = mk('a', 'fp-overlay-link-btn');
            btn.textContent = link.label;
            btn.href = '#specs';
            btn.addEventListener('click', function (e) {
              e.preventDefault();
              e.stopPropagation();
              APP.navigateToSpec(link.catId, link.subId);
            });
            linkBar.appendChild(btn);
          });
          inner.appendChild(linkBar);
        }

        overlay.appendChild(inner);
        spot.appendChild(overlay);

        // JS でホバー管理（ホットスポット + オーバーレイ両方を監視）
        (function (spot, overlay, cgImgs, overlayImg, overlayLabel) {
          var hideTimer = null;
          var cycleTimer = null;
          var cycleIdx = 0;

          function showOverlay() {
            clearTimeout(hideTimer);
            if (overlay.classList.contains('show')) return;
            // 上下位置判定
            var rect = spot.getBoundingClientRect();
            if (rect.top < 280) {
              overlay.classList.add('overlay-below');
            } else {
              overlay.classList.remove('overlay-below');
            }
            overlay.classList.remove('hiding');
            overlay.classList.add('show');
            // CG サイクル開始
            if (cgImgs.length > 1) {
              cycleIdx = 0;
              cycleTimer = setInterval(function () {
                cycleIdx = (cycleIdx + 1) % cgImgs.length;
                overlayImg.src = CG_BASE + cgImgs[cycleIdx].file;
                overlayLabel.textContent = cgImgs[cycleIdx].label + '  (' + (cycleIdx + 1) + '/' + cgImgs.length + ')';
              }, 2000);
            }
          }

          function scheduleHide() {
            clearTimeout(hideTimer);
            hideTimer = setTimeout(function () {
              overlay.classList.add('hiding');
              overlay.classList.remove('show');
              clearInterval(cycleTimer);
              // リセット
              setTimeout(function () {
                overlay.classList.remove('hiding');
                if (cgImgs.length > 0 && overlayImg) {
                  cycleIdx = 0;
                  overlayImg.src = CG_BASE + cgImgs[0].file;
                  overlayLabel.textContent = cgImgs[0].label + (cgImgs.length > 1 ? '  (+' + (cgImgs.length - 1) + ')' : '');
                }
              }, 160);
            }, 200); // 200ms の猶予（マウスがオーバーレイに移動する時間）
          }

          function cancelHide() {
            clearTimeout(hideTimer);
          }

          spot.addEventListener('mouseenter', showOverlay);
          spot.addEventListener('mouseleave', scheduleHide);
          overlay.addEventListener('mouseenter', cancelHide);
          overlay.addEventListener('mouseleave', scheduleHide);
        })(spot, overlay, cgImgs, overlayImg, overlayLabel);
      }

      // クリック → 部屋選択 + 自動ズーム
      spot.addEventListener('click', function (e) {
        e.stopPropagation();
        selectRoom(hs.id, c);
        zoomToHotspot(imgContainer, imgWrap, hs, zoomLevel);
      });

      imgContainer.appendChild(spot);
    });

    // 画像クリックで選択解除 + ズームアウト
    imgContainer.addEventListener('click', function () {
      if (selectedRoomId) {
        selectRoom(null, c);
        animateZoom(imgContainer, 1, 0, 0, zoomLevel);
      }
    });

    // マウスホイールズーム
    imgWrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      animId++; // 進行中のアニメーションをキャンセル
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

    // ドラッグパン
    setupDragPan(imgContainer, imgWrap);

    // ピンチズーム（タッチ対応）
    setupPinchZoom(imgContainer, imgWrap, zoomLevel);

    // 初期トランスフォーム適用
    updateTransform(imgContainer);

    imgWrap.appendChild(imgContainer);

    // ライブ参照を保存
    liveImgContainer = imgContainer;
    liveImgWrap = imgWrap;
    liveZoomLabel = zoomLevel;

    return imgWrap;
  }

  // 部屋選択（パネルのみ更新、図面は維持）
  function selectRoom(roomId, c) {
    selectedRoomId = roomId;
    updatePanel(c);
    // ホットスポットのアクティブ状態を更新
    if (liveImgContainer) {
      liveImgContainer.querySelectorAll('.fp-hotspot').forEach(function (spot) {
        var id = spot.getAttribute('data-room-id');
        spot.classList.toggle('active', id === roomId);
      });
    }
  }

  // パネルだけ差し替え
  function updatePanel(c) {
    var layout = c.querySelector('.fp-layout');
    if (!layout) return;
    var oldPanel = layout.querySelector('.fp-panel');
    if (oldPanel) oldPanel.remove();

    var lvl = LEVELS[currentLevel];
    var lvData = D.levels[currentLevel];
    var panel = mk('div', 'fp-panel');
    if (selectedRoomId) {
      var room = null;
      if (lvData.rooms) room = lvData.rooms.find(function (r) { return r.id === selectedRoomId; });
      if (room) {
        buildRoomPanel(panel, room, lvData, c);
      } else {
        panel.innerHTML = '<div class="fp-panel-empty">部屋データが見つかりません</div>';
      }
    } else {
      buildFloorSummaryPanel(panel, lvl, lvData, c);
    }
    layout.appendChild(panel);
  }

  // 部屋一覧パネル
  function buildFloorSummaryPanel(panel, lvl, lvData, c) {
    panel.innerHTML = '<div class="fp-panel-title">' + lvData.name + ' 部屋一覧</div>';
    var list = mk('div', 'fp-room-list');
    if (lvData.rooms) {
      lvData.rooms.forEach(function (room) {
        var row = mk('div', 'fp-room-row');
        var areaText = room.area != null
          ? room.area + '㎡' + (room.areaTatami ? '（' + room.areaTatami + '帖）' : '')
          : '';
        row.innerHTML =
          '<span class="fp-room-name">' + room.name + '</span>' +
          '<span class="fp-room-area">' + areaText + '</span>';
        row.addEventListener('click', function () {
          selectRoom(room.id, c);
          var hs = lvl.hotspots.find(function (h) { return h.id === room.id; });
          if (hs && liveImgContainer && liveImgWrap) {
            zoomToHotspot(liveImgContainer, liveImgWrap, hs, liveZoomLabel);
          }
        });
        list.appendChild(row);
      });
    }
    panel.appendChild(list);

    var summary = mk('div', 'fp-floor-summary');
    summary.innerHTML =
      '<div class="fp-summary-row"><span>床面積</span><span>' + lvData.floorArea + '㎡</span></div>' +
      '<div class="fp-summary-row"><span>天井高（標準）</span><span>' + (lvData.ceilingHeight || '—') + 'mm</span></div>' +
      '<div class="fp-summary-row"><span>部屋数</span><span>' + (lvData.rooms ? lvData.rooms.length : 0) + '室</span></div>';
    panel.appendChild(summary);

    var levelCg = LEVEL_CG_IMAGES[currentLevel];
    if (levelCg && levelCg.length > 0) {
      var cgTitle = mk('div', 'fp-feat-title');
      cgTitle.textContent = 'CGパース';
      cgTitle.style.marginTop = '16px';
      panel.appendChild(cgTitle);
      panel.appendChild(buildCgGrid(levelCg));
    }
  }

  function renderContent(c) {
    var old = c.querySelector('.fp-layout');
    if (old) old.remove();

    var layout = mk('div', 'fp-layout');
    var lvl = LEVELS[currentLevel];

    layout.appendChild(buildImageArea(c, lvl));

    c.appendChild(layout);

    // パネル描画
    updatePanel(c);

    // タブ再アクティブ
    c.querySelectorAll('.tab-btn').forEach(function (btn, i) {
      var lvls = ['1F', '2F', 'loft'];
      btn.classList.toggle('active', lvls[i] === currentLevel);
    });
  }

  function buildRoomPanel(panel, room, lvData, c) {
    // ← 戻るボタン
    var back = mk('div', 'fp-back');
    back.textContent = '← ' + lvData.name + ' 部屋一覧';
    back.addEventListener('click', function () {
      selectRoom(null, c);
      if (liveImgContainer) {
        animateZoom(liveImgContainer, 1, 0, 0, liveZoomLabel);
      }
    });
    panel.appendChild(back);

    panel.appendChild(mk('div', 'fp-panel-title')).textContent = room.name;

    if (room.areaTatami) {
      var sub = mk('div', 'fp-panel-sub');
      sub.textContent = room.areaTatami + '帖（' + room.area + '㎡）';
      panel.appendChild(sub);
    }

    var rows = [
      ['面積', room.area != null ? room.area + '㎡' : '—'],
      ['床仕上', room.floor],
      ['壁仕上', room.wall],
      ['天井仕上', room.ceiling],
      ['天井高', room.ceilingHeight ? room.ceilingHeight + 'mm' : '—']
    ];
    if (room.voidHeight) rows.push(['吹抜高', room.voidHeight + 'mm']);
    if (room.floorLevel) rows.push(['床レベル', room.floorLevel]);

    rows.forEach(function (r) {
      var row = mk('div', 'fp-detail-row');
      row.innerHTML = '<span class="fp-detail-key">' + r[0] + '</span><span class="fp-detail-val">' + esc(r[1]) + '</span>';
      panel.appendChild(row);
    });

    if (room.features && room.features.length > 0) {
      var featTitle = mk('div', 'fp-feat-title');
      featTitle.textContent = '特徴・設備';
      panel.appendChild(featTitle);
      var featWrap = mk('div', 'fp-feat-wrap');
      room.features.forEach(function (f) {
        var tag = mk('span', 'fp-feat-tag');
        tag.textContent = f;
        featWrap.appendChild(tag);
      });
      panel.appendChild(featWrap);
    }

    // 仕様へのダイレクトリンク
    var specLinks = ROOM_SPEC_LINKS[room.id];
    if (specLinks && specLinks.length > 0) {
      var linkTitle = mk('div', 'fp-feat-title');
      linkTitle.textContent = '関連する仕様';
      panel.appendChild(linkTitle);
      var linkWrap = mk('div', 'fp-spec-links');
      specLinks.forEach(function (link) {
        var btn = mk('button', 'fp-spec-link-btn');
        btn.textContent = link.label + ' →';
        btn.addEventListener('click', function () {
          APP.navigateToSpec(link.catId, link.subId);
        });
        linkWrap.appendChild(btn);
      });
      panel.appendChild(linkWrap);
    }

    // CGパース画像
    var cgImages = ROOM_CG_IMAGES[room.id];
    if (cgImages && cgImages.length > 0) {
      var cgTitle = mk('div', 'fp-feat-title');
      cgTitle.textContent = 'CGパース';
      panel.appendChild(cgTitle);
      panel.appendChild(buildCgGrid(cgImages));
    }

    // 仕様一覧へ
    var linkBtn = mk('button', 'btn btn-secondary');
    linkBtn.textContent = '仕様一覧を見る →';
    linkBtn.style.marginTop = '12px';
    linkBtn.addEventListener('click', function () { APP.navigate('specs'); });
    panel.appendChild(linkBtn);
  }

  // ── CGパース サムネイル生成ヘルパー ──
  function buildCgGrid(images) {
    var cgGrid = mk('div', 'fp-cg-grid');
    images.forEach(function (cg, idx) {
      var src = CG_BASE + cg.file;
      var thumbEl = mk('div', 'fp-cg-thumb');

      var imgEl = mk('img', '');
      imgEl.src = src;
      imgEl.alt = cg.label;
      imgEl.loading = 'lazy';
      thumbEl.appendChild(imgEl);

      // ポップアッププレビュー
      var popup = mk('div', 'fp-cg-popup');
      var popupImg = mk('img', '');
      popupImg.src = src;
      popupImg.alt = cg.label;
      popup.appendChild(popupImg);
      var popupLabel = mk('div', 'fp-cg-popup-label');
      popupLabel.textContent = cg.label;
      popup.appendChild(popupLabel);
      thumbEl.appendChild(popup);

      // マウスオーバー時にポップアップの上下位置を動的判定
      thumbEl.addEventListener('mouseenter', function () {
        var rect = thumbEl.getBoundingClientRect();
        if (rect.top < 250) {
          popup.classList.add('popup-below');
        } else {
          popup.classList.remove('popup-below');
        }
      });

      // クリックでライトボックス
      thumbEl.addEventListener('click', function (e) {
        e.stopPropagation();
        openCgLightbox(images, idx);
      });

      cgGrid.appendChild(thumbEl);
    });
    return cgGrid;
  }

  // ── CGパース ライトボックス ──
  // グローバルライトボックスの仕組みを借りつつ、平面図CGパース用に独自管理
  var cgLbState = null; // { srcs, labels, idx, cleanup }

  function openCgLightbox(images, startIdx) {
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lb-img');
    var lbCaption = document.getElementById('lb-caption');

    // 前回のリスナーをクリーンアップ
    if (cgLbState && cgLbState.cleanup) cgLbState.cleanup();

    var srcs = images.map(function (cg) { return CG_BASE + cg.file; });
    var labels = images.map(function (cg) { return cg.label; });
    var idx = startIdx;

    function show(i) {
      if (i < 0) i = srcs.length - 1;
      if (i >= srcs.length) i = 0;
      idx = i;
      lbImg.src = srcs[idx];
      lbCaption.textContent = labels[idx] + '  (' + (idx + 1) + ' / ' + srcs.length + ')';
    }

    function onClose() {
      lb.hidden = true;
      document.body.style.overflow = '';
      cleanup();
    }
    function onPrev(e) { e.stopPropagation(); show(idx - 1); }
    function onNext(e) { e.stopPropagation(); show(idx + 1); }
    function onKey(e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    }
    function onBg(e) {
      if (e.target === lb || e.target.classList.contains('lb-content')) onClose();
    }

    // ボタンをクローンして既存リスナーを除去
    var closeBtn = lb.querySelector('.lb-close');
    var prevBtn = lb.querySelector('.lb-prev');
    var nextBtn = lb.querySelector('.lb-next');
    var newClose = closeBtn.cloneNode(true);
    var newPrev = prevBtn.cloneNode(true);
    var newNext = nextBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    newClose.addEventListener('click', onClose);
    newPrev.addEventListener('click', onPrev);
    newNext.addEventListener('click', onNext);
    document.addEventListener('keydown', onKey);
    lb.addEventListener('click', onBg);

    // タッチスワイプ対応
    var swipeStartX = 0;
    function onTouchStart(e) { swipeStartX = e.touches[0].clientX; }
    function onTouchEnd(e) {
      var dx = e.changedTouches[0].clientX - swipeStartX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) show(idx - 1);
        else show(idx + 1);
      }
    }
    lb.addEventListener('touchstart', onTouchStart, { passive: true });
    lb.addEventListener('touchend', onTouchEnd, { passive: true });

    function cleanup() {
      document.removeEventListener('keydown', onKey);
      lb.removeEventListener('click', onBg);
      lb.removeEventListener('touchstart', onTouchStart);
      lb.removeEventListener('touchend', onTouchEnd);
      cgLbState = null;
    }

    cgLbState = { cleanup: cleanup };

    show(idx);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  // ── 自動ズーム ──
  function getBaseSize(container) {
    // scale=1 での基本サイズ（transform 考慮なし）
    // getBoundingClientRect は transform 後のサイズなので、現在の scale で割る
    var rect = container.getBoundingClientRect();
    var s = zoomState.scale || 1;
    return { w: rect.width / s, h: rect.height / s };
  }

  function zoomToHotspot(container, wrap, hs, label) {
    var base = getBaseSize(container);
    var w = base.w;
    var h = base.h;

    var centerX = (hs.x + hs.w / 2) / 100 * w;
    var centerY = (hs.y + hs.h / 2) / 100 * h;

    // ズーム倍率を部屋サイズに応じて決定
    var roomSize = Math.max(hs.w, hs.h);
    var targetScale = Math.min(MAX_SCALE, Math.max(2, 70 / roomSize));

    // 表示領域のサイズ
    var viewW = wrap.clientWidth;
    var viewH = wrap.clientHeight;
    var targetX = viewW / 2 - centerX * targetScale;
    var targetY = viewH / 2 - centerY * targetScale;

    // 事前にクランプ
    var sW = w * targetScale, sH = h * targetScale;
    targetX = Math.min(0, Math.max(viewW - sW, targetX));
    targetY = Math.min(0, Math.max(viewH - sH, targetY));

    animateZoom(container, targetScale, targetX, targetY, label);
  }

  function animateZoom(container, targetScale, targetX, targetY, label) {
    var myId = ++animId; // このアニメーションのID
    var startScale = zoomState.scale;
    var startX = zoomState.x;
    var startY = zoomState.y;
    var duration = 500;
    var startTime = null;

    // ターゲットが scale=1 なら位置も (0,0) に
    if (targetScale <= 1) { targetScale = 1; targetX = 0; targetY = 0; }

    container.style.transition = 'none';

    function step(timestamp) {
      if (myId !== animId) return; // 新しいアニメーションが開始されたら中止
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-in-out
      var ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      zoomState.scale = startScale + (targetScale - startScale) * ease;
      zoomState.x = startX + (targetX - startX) * ease;
      zoomState.y = startY + (targetY - startY) * ease;

      // クランプ
      if (zoomState.scale <= 1.01 && targetScale <= 1) {
        // ズームアウト完了間際
        var t = ease;
        zoomState.scale = 1 + (startScale - 1) * (1 - t);
        if (progress >= 1) { zoomState.scale = 1; zoomState.x = 0; zoomState.y = 0; }
      }

      updateTransform(container);
      if (label) label.textContent = Math.round(zoomState.scale * 100) + '%';

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        container.style.transition = '';
      }
    }
    requestAnimationFrame(step);
  }

  // ── ズーム・パン ヘルパー ──
  function applyZoom(container, newScale, label) {
    animId++;
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
    if (zoomState.scale <= 1) {
      zoomState.x = 0;
      zoomState.y = 0;
      return;
    }
    var base = getBaseSize(container);
    var wrap = container.parentElement;
    var viewW = wrap.clientWidth;
    var viewH = wrap.clientHeight;
    var scaledW = base.w * zoomState.scale;
    var scaledH = base.h * zoomState.scale;
    zoomState.x = Math.min(0, Math.max(viewW - scaledW, zoomState.x));
    zoomState.y = Math.min(0, Math.max(viewH - scaledH, zoomState.y));
  }

  function setupDragPan(container, wrap) {
    var dragging = false;
    var startX, startY, startPanX, startPanY;

    wrap.addEventListener('mousedown', function (e) {
      if (zoomState.scale <= 1) return;
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startPanX = zoomState.x;
      startPanY = zoomState.y;
      wrap.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      zoomState.x = startPanX + (e.clientX - startX);
      zoomState.y = startPanY + (e.clientY - startY);
      clampPan(container);
      updateTransform(container);
    });

    window.addEventListener('mouseup', function () {
      if (dragging) {
        dragging = false;
        wrap.style.cursor = '';
      }
    });
  }

  function setupPinchZoom(container, wrap, label) {
    var lastDist = 0;
    var touchPanning = false;
    var touchStartX, touchStartY, touchStartPanX, touchStartPanY;

    wrap.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchPanning = false;
        lastDist = getTouchDist(e.touches);
      } else if (e.touches.length === 1 && zoomState.scale > 1) {
        // ズーム時の1本指パン
        touchPanning = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartPanX = zoomState.x;
        touchStartPanY = zoomState.y;
      }
    }, { passive: false });

    wrap.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchPanning = false;
        var dist = getTouchDist(e.touches);
        if (lastDist > 0) {
          var delta = dist / lastDist;
          applyZoom(container, zoomState.scale * delta, label);
        }
        lastDist = dist;
      } else if (e.touches.length === 1 && touchPanning && zoomState.scale > 1) {
        e.preventDefault();
        zoomState.x = touchStartPanX + (e.touches[0].clientX - touchStartX);
        zoomState.y = touchStartPanY + (e.touches[0].clientY - touchStartY);
        clampPan(container);
        updateTransform(container);
      }
    }, { passive: false });

    wrap.addEventListener('touchend', function () {
      lastDist = 0;
      touchPanning = false;
    });
  }

  function getTouchDist(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function esc(s) { return s ? String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '—'; }
})();
