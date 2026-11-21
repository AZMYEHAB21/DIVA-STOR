/* =====================================================================
   DIVA — script.js
   كل التفاعلات والأنيميشن (Vanilla JS بدون مكتبات)
   ===================================================================== */

/* ---------------------------------------------------------------
   ⚙️ إعدادات سهلة التعديل
   --------------------------------------------------------------- */

// لإظهار العروض: غيّري القيمة لـ true  (أو من الكونسول: enableOffers())
let OFFERS_AVAILABLE = true;

const WHATSAPP_NUMBER = '201142640064';

// بيانات EmailJS (نفس البيانات القديمة بتاعة الموقع)
const EMAILJS = {
  publicKey: 'Oxblyy4zqUxm6KvlA',
  serviceId: 'service_endnvxq',
  templateId: 'template_o9cp0vp'
};

// مواعيد العمل بتوقيت القاهرة: [ساعة الفتح, ساعة الإغلاق] — الأيام بنظام JS (0 = الأحد ... 5 = الجمعة)
const STORE_HOURS = { default: [10, 22], 5: [14, 22] };

/* =============================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ------------------------- التوست (رسائل صغيرة) ------------------------- */
  function toast(msg, type = 'ok') {
    let wrap = $('.toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toasts';
      wrap.setAttribute('aria-live', 'polite');
      Object.assign(wrap.style, { position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10500, display: 'grid', gap: '10px', justifyItems: 'center', pointerEvents: 'none' });
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    const ok = type === 'ok';
    Object.assign(el.style, {
      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 22px', borderRadius: '999px',
      background: ok ? '#0d0d0e' : '#b73a2f', color: '#fff', fontWeight: 700, fontSize: '.98rem',
      boxShadow: '0 20px 40px -12px rgba(0,0,0,.5)', opacity: 0, transform: 'translateY(20px) scale(.96)',
      transition: 'opacity .4s, transform .5s cubic-bezier(.22,1,.36,1)', maxWidth: '92vw'
    });
    const ic = document.createElement('i');
    ic.className = 'fa-solid ' + (ok ? 'fa-circle-check' : 'fa-triangle-exclamation');
    ic.style.color = ok ? '#2fb56b' : '#fff';
    const tx = document.createElement('span');
    tx.textContent = msg;
    el.append(ic, tx);
    wrap.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = 1; el.style.transform = 'none'; });
    setTimeout(() => {
      el.style.opacity = 0; el.style.transform = 'translateY(10px)';
      setTimeout(() => el.remove(), 500);
    }, 4200);
  }

  /* ------------------------- صور مكسورة: نخفيها ونسيب الخلفية ------------------------- */
  document.addEventListener('error', e => {
    if (e.target && e.target.tagName === 'IMG') e.target.style.visibility = 'hidden';
  }, true);
  $$('img').forEach(img => { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.style.visibility = 'hidden'; });

  /* ------------------------- الوضع الداكن ------------------------- */
  $$('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('diva-theme', next); } catch (e) { /* ignore */ }
      const m = $('meta[name="theme-color"]');
      if (m) m.setAttribute('content', next === 'dark' ? '#0b0b0c' : '#f6f2eb');
    });
  });
  if (root.getAttribute('data-theme') === 'dark') {
    const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', '#0b0b0c');
  }

  /* ------------------------- شاشة التحميل ------------------------- */
  const loader = $('.loader');
  let first = true;
  try { first = !sessionStorage.getItem('diva-seen'); sessionStorage.setItem('diva-seen', '1'); } catch (e) { /* ignore */ }
  if (loader && first) loader.classList.add('first');
  const minMs = first ? 1150 : 140;
  const t0 = performance.now();
  let readyDone = false;
  function ready() {
    if (readyDone) return; readyDone = true;
    const wait = Math.max(0, minMs - (performance.now() - t0));
    setTimeout(() => {
      if (loader) loader.classList.add('done');
      root.classList.add('is-ready');
      setTimeout(startReveals, 250);
    }, wait);
  }
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready, { once: true });
  setTimeout(ready, 4000); // حماية لو الصور التقيلة اتأخرت

  /* ------------------------- انتقال الصفحات ------------------------- */
  window.addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('is-leaving'); });
  document.addEventListener('click', e => {
    if (reduced) return;
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    let url; try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // نفس الصفحة / hash
    if (!/\.html?$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = a.href; }, 520);
  });

  /* ------------------------- الهيدر + القائمة + التقدم ------------------------- */
  const header = $('.site-header');
  const burger = $('.burger');
  const menu = $('.menu');
  const progress = $('.progress span');
  const toTop = $('.to-top');
  const toTopRing = toTop ? $('circle', toTop) : null;
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    if (!menu || !burger) return;
    menu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(!menuOpen));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1040 && menuOpen) setMenu(false); });
  }

  let lastY = window.scrollY, ticking = false;
  const parallaxEls = $$('[data-parallax]');
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = clamp(y / max, 0, 1);
    if (header) {
      header.classList.toggle('is-scrolled', y > 20);
      if (!menuOpen) {
        if (y > lastY + 6 && y > 500) header.classList.add('is-hidden');
        else if (y < lastY - 6 || y < 500) header.classList.remove('is-hidden');
      }
    }
    if (progress) progress.style.transform = 'scaleX(' + p + ')';
    if (toTop) {
      toTop.classList.toggle('show', y > 700);
      if (toTopRing) toTopRing.style.strokeDashoffset = String(169.6 * (1 - p));
    }
    if (!reduced) {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const f = parseFloat(el.dataset.parallax) || 0.1;
        const off = (r.top + r.height / 2 - vh / 2) * f;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }
    lastY = y;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ------------------------- تقسيم العناوين لكلمات (أنيميشن الدخول) ------------------------- */
  function splitText(el) {
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'wi'; s.style.setProperty('--i', i++); s.textContent = w;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    walk(el);
  }
  if (!reduced) $$('[data-split]').forEach(splitText);

  /* ------------------------- الكشف عند التمرير ------------------------- */
  $$('[data-stagger]').forEach(p => {
    Array.from(p.children).forEach((c, i) => {
      if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', '');
      c.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
    });
  });
  $$('[data-delay]').forEach(el => el.style.setProperty('--d', el.dataset.delay + 's'));

  function startReveals() {
    const els = $$('[data-reveal],[data-split]');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        if (el.hasAttribute('data-reveal')) {
          // بعد انتهاء الأنيميشن نشيل الـ attribute عشان الـ hover يشتغل بسرعته الطبيعية
          const d = (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 1000;
          setTimeout(() => el.removeAttribute('data-reveal'), 1000 + d);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }
  if (reduced) $$('[data-reveal]').forEach(e => e.removeAttribute('data-reveal'));

  /* ------------------------- Spotlight على الكروت + Tilt ------------------------- */
  if (finePointer) {
    $$('.f-card, .o-card').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (!reduced) {
      $$('.o-card').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          el.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg) translateY(-6px)';
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      });

      // زرار مغناطيسي
      $$('.btn').forEach(b => {
        b.addEventListener('pointermove', e => {
          const r = b.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
          b.style.transform = 'translate(' + (x * .18).toFixed(1) + 'px,' + (y * .3).toFixed(1) + 'px)';
        });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
      });
    }
  }

  /* ------------------------- Hero: حركة مع الماوس ------------------------- */
  const hv = $('.hero-visual');
  if (hv && finePointer && !reduced) {
    const layers = $$('[data-depth]', hv);
    const hero = hv.closest('.hero') || hv;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    hero.addEventListener('pointermove', e => {
      tx = (e.clientX / window.innerWidth - .5) * 2;
      ty = (e.clientY / window.innerHeight - .5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    function loop() {
      cx = lerp(cx, tx, .08); cy = lerp(cy, ty, .08);
      layers.forEach(l => {
        const d = parseFloat(l.dataset.depth) || 10;
        l.style.transform = 'translate3d(' + (cx * d).toFixed(1) + 'px,' + (cy * d).toFixed(1) + 'px,0)';
      });
      raf = (Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002) ? requestAnimationFrame(loop) : null;
    }
  }

  /* ------------------------- المؤشر المخصص ------------------------- */
  if (finePointer && !reduced) {
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    let mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    window.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      if (!shown) { shown = true; ring.classList.add('on'); dot.classList.add('on'); rx = mx; ry = my; }
    });
    document.addEventListener('pointerleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); shown = false; });
    (function tick() {
      rx = lerp(rx, mx, .18); ry = lerp(ry, my, .18);
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(tick);
    })();
    const hoverSel = 'a, button, [data-cursor], input, textarea, .g-item';
    document.addEventListener('pointerover', e => { if (e.target.closest(hoverSel)) ring.classList.add('hover'); });
    document.addEventListener('pointerout', e => { if (e.target.closest(hoverSel)) ring.classList.remove('hover'); });
    window.addEventListener('pointerdown', () => ring.classList.add('down'));
    window.addEventListener('pointerup', () => ring.classList.remove('down'));
  }

  /* ------------------------- سلايدر بالسحب (Rail) ------------------------- */
  $$('[data-rail]').forEach(rail => {
    let down = false, startX = 0, startLeft = 0, moved = 0;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; startX = e.clientX; startLeft = rail.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) rail.classList.add('dragging');
      rail.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => { down = false; setTimeout(() => rail.classList.remove('dragging'), 0); });
    const step = () => (rail.querySelector('.r-card') || { offsetWidth: 300 }).offsetWidth + 20;
    $$('[data-rail-next]').forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' })));
    $$('[data-rail-prev]').forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' })));
  });

  /* ------------------------- قائمة التصنيفات مع صورة تتبع الماوس ------------------------- */
  const cats = $('[data-hoverlist]');
  if (cats && finePointer && !reduced) {
    const pv = document.createElement('div'); pv.className = 'cat-preview';
    pv.innerHTML = '<div class="inner"><img alt=""></div>';
    document.body.appendChild(pv);
    const pimg = $('img', pv);
    let px = 0, py = 0, tx = 0, ty = 0, active = false;
    $$('.cat', cats).forEach(c => {
      c.addEventListener('pointerenter', () => {
        pimg.style.visibility = 'visible';
        pimg.src = c.dataset.img || '';
        pv.classList.add('show'); active = true;
      });
      c.addEventListener('pointerleave', () => { pv.classList.remove('show'); active = false; });
    });
    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      px = lerp(px, tx, .12); py = lerp(py, ty, .12);
      if (active || pv.classList.contains('show')) pv.style.transform = 'translate3d(' + (px - 125) + 'px,' + (py - 167) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ------------------------- حالة المحل (مفتوح / مغلق) بتوقيت القاهرة ------------------------- */
  function fmtHour(h) { const p = h >= 12 ? 'مساءً' : 'صباحاً'; const x = h % 12 === 0 ? 12 : h % 12; return x + ' ' + p; }
  function storeStatus() {
    let parts;
    try {
      parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    } catch (e) { return null; }
    const g = t => (parts.find(p => p.type === t) || {}).value;
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = days[g('weekday')]; const h = parseInt(g('hour'), 10) + parseInt(g('minute'), 10) / 60;
    const today = STORE_HOURS[day] || STORE_HOURS.default;
    if (h >= today[0] && h < today[1]) return { open: true, text: 'مفتوح الآن · حتى ' + fmtHour(today[1]) };
    if (h < today[0]) return { open: false, text: 'مغلق الآن · نفتح اليوم ' + fmtHour(today[0]) };
    const nxt = STORE_HOURS[(day + 1) % 7] || STORE_HOURS.default;
    return { open: false, text: 'مغلق الآن · نفتح غداً ' + fmtHour(nxt[0]) };
  }
  function updateStatus() {
    const s = storeStatus(); if (!s) return;
    $$('[data-open-status]').forEach(el => { el.textContent = s.text; el.classList.toggle('is-open', s.open); });
  }
  updateStatus(); setInterval(updateStatus, 60000);

  /* ------------------------- المعرض + Lightbox ------------------------- */
  const grid = $('.g-grid');
  if (grid) {
    const items = $$('.g-item', grid);
    const pills = $('.pills');
    const slider = $('.slider', pills);
    const pillBtns = $$('.pill', pills);
    const countEl = $('#gCount');
    let visible = items.slice();

    function moveSlider(btn) {
      if (!slider || !btn) return;
      slider.style.width = btn.offsetWidth + 'px';
      slider.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    }
    function setActive(btn) { pillBtns.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); }); moveSlider(btn); }

    function applyFilter(cat, animate) {
      const next = items.filter(i => cat === 'all' || i.dataset.category === cat);
      const run = () => {
        items.forEach(i => { i.hidden = !next.includes(i); });
        visible = next;
        next.forEach((i, idx) => {
          i.style.setProperty('--d', Math.min(idx * 60, 500) + 'ms');
          requestAnimationFrame(() => requestAnimationFrame(() => i.classList.remove('is-out')));
        });
        if (countEl) countEl.textContent = String(next.length);
      };
      if (!animate || reduced) { items.forEach(i => i.classList.remove('is-out')); run(); return; }
      items.forEach(i => i.classList.add('is-out'));
      setTimeout(run, 320);
    }

    pillBtns.forEach(btn => btn.addEventListener('click', () => {
      setActive(btn); applyFilter(btn.dataset.filter, true);
      try { history.replaceState(null, '', btn.dataset.filter === 'all' ? location.pathname : '?filter=' + btn.dataset.filter); } catch (e) { /* ignore */ }
    }));

    const wanted = new URLSearchParams(location.search).get('filter');
    const initBtn = pillBtns.find(b => b.dataset.filter === wanted) || pillBtns[0];
    setActive(initBtn);
    if (initBtn.dataset.filter !== 'all') applyFilter(initBtn.dataset.filter, false);
    window.addEventListener('resize', () => moveSlider($('.pill.active', pills)));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveSlider($('.pill.active', pills)));
    window.addEventListener('load', () => moveSlider($('.pill.active', pills)));

    // Lightbox
    const lb = $('#lb'); const lbImg = $('#lbImg'); const lbCap = $('#lbCap');
    const lbCur = $('#lbCur'); const lbTot = $('#lbTot');
    let idx = 0, lastFocus = null;

    function show(i, dir) {
      idx = (i + visible.length) % visible.length;
      const src = $('img', visible[idx]);
      const swap = () => {
        lbImg.style.visibility = 'visible';
        lbImg.src = src.currentSrc || src.src; lbImg.alt = src.alt;
        lbCap.textContent = src.alt; lbCur.textContent = idx + 1; lbTot.textContent = visible.length;
        lbImg.onload = lbImg.onerror = () => lbImg.classList.remove('swap');
        setTimeout(() => lbImg.classList.remove('swap'), 700);
      };
      if (dir === 0 || reduced) swap(); else { lbImg.classList.add('swap'); setTimeout(swap, 200); }
      [1, -1].forEach(d => { const n = $('img', visible[(idx + d + visible.length) % visible.length]); if (n) new Image().src = n.src; });
    }
    function open(i) {
      lastFocus = document.activeElement;
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      show(i, 0);
      setTimeout(() => $('.lb-close', lb).focus(), 50);
    }
    function close() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      if (lastFocus) lastFocus.focus();
    }
    const next = () => show(idx + 1, 1), prev = () => show(idx - 1, -1);

    items.forEach(it => it.addEventListener('click', () => open(visible.indexOf(it))));
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-bg', lb).addEventListener('click', close);
    $('.lb-next', lb).addEventListener('click', next);
    $('.lb-prev', lb).addEventListener('click', prev);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') next();   // الاتجاه RTL: السهم الشمال = التالي
      else if (e.key === 'ArrowRight') prev();
    });
    let sx = 0, sy = 0;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx > 0 ? next() : prev(); }
    }, { passive: true });
  }

  /* ------------------------- العروض (تشغيل / إيقاف) ------------------------- */
  const stage = $('#offersStage');
  const lockMsg = $('#noOffersMessage');
  function applyOffers() {
    if (!stage) return;
    stage.classList.toggle('is-locked', !OFFERS_AVAILABLE);
    if (lockMsg) lockMsg.hidden = OFFERS_AVAILABLE;
  }
  applyOffers();
  window.enableOffers = function () { OFFERS_AVAILABLE = true; applyOffers(); console.log('✓ تم تفعيل العروض بنجاح!'); };
  window.disableOffers = function () { OFFERS_AVAILABLE = false; applyOffers(); console.log('✗ تم تعطيل العروض!'); };

  /* ------------------------- EmailJS (التواصل + النشرة) ------------------------- */
  let emailReady = false;
  function initEmail() {
    if (emailReady) return true;
    if (window.emailjs) { try { window.emailjs.init(EMAILJS.publicKey); emailReady = true; } catch (e) { /* ignore */ } }
    return emailReady;
  }
  function sendEmail(params) {
    if (!initEmail()) return Promise.reject(new Error('emailjs-missing'));
    return window.emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params);
  }

  const form = $('#contactForm');
  if (form) {
    const rules = {
      name: v => v.trim().length >= 2 || 'من فضلك اكتبي اسمك',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'اكتبي بريد إلكتروني صحيح',
      phone: v => v.trim() === '' || /^[0-9+\s-]{8,16}$/.test(v.trim()) || 'رقم الهاتف غير صحيح',
      message: v => v.trim().length >= 5 || 'اكتبي رسالتك (5 حروف على الأقل)'
    };
    function check(input) {
      const rule = rules[input.name]; if (!rule) return true;
      const res = rule(input.value);
      const field = input.closest('.field');
      field.classList.toggle('has-error', res !== true);
      if (res !== true) $('.err', field).textContent = res;
      return res === true;
    }
    $$('input, textarea', form).forEach(i => {
      i.addEventListener('blur', () => { if (i.value) check(i); });
      i.addEventListener('input', () => { if (i.closest('.field').classList.contains('has-error')) check(i); });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const inputs = $$('input, textarea', form);
      const okAll = inputs.map(check).every(Boolean);
      if (!okAll) { const bad = $('.has-error input, .has-error textarea', form); if (bad) bad.focus(); return; }
      const btn = $('button[type="submit"]', form);
      const label = $('.lbl', btn); const old = label.textContent;
      btn.disabled = true; label.textContent = 'جاري الإرسال...';
      const data = { name: form.name.value.trim(), email: form.email.value.trim(), phone: form.phone.value.trim(), message: form.message.value.trim() };
      sendEmail(data).then(() => {
        form.reset();
        $('.form-card').classList.add('sent');
      }).catch(err => {
        console.error('EmailJS error', err);
        toast('حصل خطأ في الإرسال، جرّبي تاني أو كلمينا على واتساب', 'err');
      }).finally(() => { btn.disabled = false; label.textContent = old; });
    });
    const again = $('[data-send-again]');
    if (again) again.addEventListener('click', () => $('.form-card').classList.remove('sent'));
  }

  const news = $('#newsletterForm');
  if (news) {
    news.addEventListener('submit', e => {
      e.preventDefault();
      const input = $('input[type="email"]', news);
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('اكتبي بريد إلكتروني صحيح', 'err'); input.focus(); return; }
      const btn = $('button', news); btn.disabled = true;
      sendEmail({ name: 'اشتراك في النشرة البريدية', email: email, phone: '-', message: 'طلب اشتراك جديد في النشرة البريدية من الموقع.' })
        .then(() => { toast('شكراً للاشتراك! هنوصلك بأحدث العروض ✨'); news.reset(); })
        .catch(() => toast('حصل خطأ، جرّبي مرة تانية', 'err'))
        .finally(() => { btn.disabled = false; });
    });
  }

  /* ------------------------- فهرس الخصوصية (Scrollspy) ------------------------- */
  const toc = $('.toc');
  if (toc && 'IntersectionObserver' in window) {
    const links = $$('a', toc);
    const secs = links.map(a => $(a.getAttribute('href')));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    secs.forEach(s => s && io.observe(s));
  }

  /* السنة في الفوتر */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  console.log('%c DIVA ✦ BE YOUR OWN STAR ', 'background:#0d0d0e;color:#d9c3a0;padding:6px 12px;border-radius:6px;font-weight:700');
})();
