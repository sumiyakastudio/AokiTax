/* ============================================================
   AOKI TAX OFFICE — main.js
   アンカー（荻野鷹也税理士事務所）のモーション人格を再現
   - 慣性スクロール（Lenis / 読み込めない環境ではネイティブへ自動フォールバック）
   - FVスローガンの1文字分割リビール
   - KV 4枚クロスフェード + ズーム + パララックス
   - スクロールリビール（stagger）
   - オーバーレイメニュー / 追従CTA / FAQ / フォーム（疑似送信）
   ※ prefers-reduced-motion は無視して常時アニメ（デザイン憲法 §7）
   ============================================================ */
(function () {
  'use strict';

  var html = document.documentElement;
  var lenis = null;

  /* ---------- 0. ready ---------- */
  function ready() {
    html.classList.add('js-ready');
  }

  /* ---------- 1. 慣性スクロール ---------- */
  function initLenis() {
    if (typeof window.Lenis !== 'function') return null;
    var l = new window.Lenis({
      lerp: 0.1,
      wheelMultiplier: 1.0,
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    function raf(time) {
      l.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return l;
  }

  function scrollTo(target) {
    if (lenis) { lenis.scrollTo(target, { offset: -20 }); return; }
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 20, behavior: 'smooth' });
  }

  /* ---------- 2. スクロールリビール ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal, .reveal-child, .split');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------- 3. 文字分割（FVスローガン等） ---------- */
  function initSplit() {
    var targets = document.querySelectorAll('[data-split]');
    Array.prototype.forEach.call(targets, function (el) {
      var rows = el.querySelectorAll('[data-split-row]');
      var list = rows.length ? rows : [el];
      var i = 0;
      Array.prototype.forEach.call(list, function (row) {
        var text = row.textContent;
        var frag = document.createDocumentFragment();
        for (var c = 0; c < text.length; c++) {
          var span = document.createElement('span');
          span.className = 'ch';
          span.textContent = text.charAt(c);
          span.style.transitionDelay = (i * 0.06) + 's';
          frag.appendChild(span);
          i++;
        }
        row.textContent = '';
        row.appendChild(frag);
      });
      el.classList.add('split');
    });
  }

  /* ---------- 4. KVスライダー ---------- */
  function initKv() {
    var kv = document.querySelector('[data-kv]');
    if (!kv) return;
    var slides = kv.querySelectorAll('.kv__slide');
    if (slides.length < 2) return;
    var curr = document.querySelector('[data-kv-curr]');
    var bar = document.querySelector('[data-kv-bar]');
    var idx = 0;
    var total = slides.length;

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function show(n) {
      Array.prototype.forEach.call(slides, function (s, i) {
        s.classList.toggle('is-active', i === n);
      });
      if (curr) curr.textContent = pad(n + 1);
      if (bar) {
        bar.style.width = (100 / total) + '%';
        bar.style.transform = 'translateX(' + (n * 100) + '%)';
      }
    }
    show(0);
    setInterval(function () {
      idx = (idx + 1) % total;
      show(idx);
    }, 8000);
  }

  /* ---------- 5. パララックス（控えめ 0.06） ---------- */
  function initParallax() {
    var items = document.querySelectorAll('[data-parallax]');
    if (!items.length) return;
    var vh = window.innerHeight;

    // 基準は「transformを持たない親要素」の実測。
    // 自分自身のrectを測ると、適用したtransformが次の計測に混ざって位置がずれ続ける。
    function update() {
      vh = window.innerHeight;
      Array.prototype.forEach.call(items, function (el) {
        var host = el.parentElement || el;
        var r = host.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.06;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        if (offset > 80) offset = 80;
        if (offset < -80) offset = -80;
        el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
      });
    }
    window.addEventListener('resize', update);
    if (lenis) { lenis.on('scroll', update); } else { window.addEventListener('scroll', update, { passive: true }); }
    // 初期表示: レイアウト確定後にも測り直す（画像・フォント読込で位置が動くため）
    update();
    window.addEventListener('load', update);
    setTimeout(update, 300);
    setTimeout(update, 1200);
  }

  /* ---------- 6. メニュー ---------- */
  function initMenu() {
    var btn = document.querySelector('[data-menu-btn]');
    var nav = document.querySelector('[data-menu]');
    if (!btn || !nav) return;

    function setOpen(open) {
      btn.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var label = btn.querySelector('.menu-btn__label');
      if (label) label.textContent = open ? 'CLOSE' : 'MENU';
      if (lenis) { if (open) { lenis.stop(); } else { lenis.start(); } }
      document.body.style.overflow = open ? 'hidden' : '';
    }
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ---------- 7. 追従CTA / ロゴ縮小 ---------- */
  function initSticky() {
    var cta = document.querySelector('[data-fixed-cta]');
    var logo = document.querySelector('[data-site-logo]');
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (cta) cta.classList.toggle('is-shown', y > 520);
      if (logo) logo.classList.toggle('is-min', y > 520);
    }
    if (lenis) { lenis.on('scroll', update); } else { window.addEventListener('scroll', update, { passive: true }); }
    update();
  }

  /* ---------- 8. FAQ ---------- */
  function initFaq() {
    var qs = document.querySelectorAll('.faq__q');
    Array.prototype.forEach.call(qs, function (q) {
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        q.setAttribute('aria-expanded', open ? 'false' : 'true');
        var panel = q.nextElementSibling;
        if (panel) panel.classList.toggle('is-open', !open);
      });
    });
  }

  /* ---------- 9. アンカーリンク ---------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollTo(target);
    });
  }

  /* ---------- 10. ページ遷移フェード（pageshow対応） ---------- */
  function initPageFade() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
      if (/^(https?:)?\/\//.test(href) && href.indexOf(location.host) === -1) return;
      if (/^(mailto:|tel:)/.test(href)) return;
      e.preventDefault();
      html.classList.add('is-leaving');
      setTimeout(function () { location.href = href; }, 480);
    });
    // bfcache（戻るボタン）対策: 状態を必ずリセット
    window.addEventListener('pageshow', function () {
      html.classList.remove('is-leaving');
      html.classList.add('js-ready');
    });
  }

  /* ---------- 11. フォーム（疑似送信・実送信なし） ---------- */
  function initForm() {
    var form = document.querySelector('[data-form]');
    if (!form) return;
    var fields = form.querySelectorAll('.field');
    var confirmBox = form.querySelector('[data-confirm]');
    var doneBox = document.querySelector('[data-done]');
    var toConfirm = form.querySelector('[data-to-confirm]');
    var back = form.querySelector('[data-back]');
    var send = form.querySelector('[data-send]');
    var body = form.querySelector('[data-form-body]');

    function valueOf(name) {
      var el = form.elements[name];
      if (!el) return '';
      if (el.length && !el.tagName) {
        var v = '';
        Array.prototype.forEach.call(el, function (r) { if (r.checked) v = r.value; });
        return v;
      }
      return (el.value || '').trim();
    }

    function validate() {
      var ok = true;
      Array.prototype.forEach.call(fields, function (f) {
        var required = f.getAttribute('data-required');
        if (!required) return;
        var val = valueOf(required);
        var isMail = f.getAttribute('data-type') === 'email';
        var bad = !val || (isMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
        f.classList.toggle('is-err', bad);
        if (bad && ok) {
          ok = false;
          scrollTo(f);
        }
      });
      return ok;
    }

    if (toConfirm) {
      toConfirm.addEventListener('click', function () {
        if (!validate()) return;
        var map = { type: 'inquiry-type', name: 'name', email: 'email', tel: 'tel', company: 'company', message: 'message' };
        Object.keys(map).forEach(function (k) {
          var out = form.querySelector('[data-confirm-' + k + ']');
          if (out) out.textContent = valueOf(map[k]) || '—';
        });
        body.classList.add('is-hidden');
        toConfirm.classList.add('is-hidden');
        confirmBox.classList.add('is-shown');
        scrollTo(confirmBox);
      });
    }
    if (back) {
      back.addEventListener('click', function () {
        confirmBox.classList.remove('is-shown');
        body.classList.remove('is-hidden');
        toConfirm.classList.remove('is-hidden');
        scrollTo(body);
      });
    }
    if (send) {
      send.addEventListener('click', function () {
        // デモサイトのため実送信は行わない（受注後に送信先を設定）
        confirmBox.classList.remove('is-shown');
        if (doneBox) {
          doneBox.classList.add('is-shown');
          scrollTo(doneBox);
        }
      });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    lenis = initLenis();
    ready();
    initSplit();
    initReveal();
    initKv();
    initParallax();
    initMenu();
    initSticky();
    initFaq();
    initAnchors();
    initPageFade();
    initForm();
    // 撮影用フラグ（?shot=1 でリビールを全発火・追従UIを非表示）
    if (location.search.indexOf('shot=') !== -1) {
      html.classList.add('is-shot');
      Array.prototype.forEach.call(document.querySelectorAll('.reveal,.reveal-child,.split'), function (el) { el.classList.add('is-in'); });
      Array.prototype.forEach.call(document.querySelectorAll('[data-fixed-cta],[data-menu-btn]'), function (el) { el.style.display = 'none'; });
      // 巨大ビューポートでの撮影時、vh基準のKVが全画面に膨張するのを防ぐ（PC幅のみ）
      if (window.innerWidth >= 1024) {
        var kvMedia = document.querySelector('.kv__media');
        if (kvMedia) { kvMedia.style.height = '820px'; kvMedia.style.maxHeight = '820px'; kvMedia.style.minHeight = '0'; }
        var nf = document.querySelector('.nf');
        if (nf) { nf.style.minHeight = '520px'; }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
