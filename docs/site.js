// Unlimited MapMerge docs: language picker (12 languages, English by default), dark/light theme button,
// and the header nav that moves links which do not fit into the "More" menu. Same behaviour as the
// Unlimited Reforge docs site. No libraries; translations are in i18n.js (tools/build.js).
// ?lang=<code> and ?theme=light|dark in the address pick a language / theme for that visit.
(function () {
  var L = window.I18N || {}, LANGS = window.I18N_LANGS || [['en', 'English']], KEY = 'ummerge-lang', TKEY = 'ummerge-theme';
  var root = document.documentElement, q = new URLSearchParams(location.search);
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
  var cur = 'en';

  // ---- theme (dark default; the early script in <head> already applied a saved light theme)
  function setTheme(light) {
    if (light) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', light ? '#f4f6fc' : '#0b1020');
    syncTheme();
  }
  function syncTheme() {
    var light = root.getAttribute('data-theme') === 'light', d = L[cur] || L.en || {}, k = light ? 'theme_dark' : 'theme_light';
    var t = d[k] || (L.en || {})[k] || '', b = document.getElementById('themeBtn');
    if (b) { b.setAttribute('aria-label', t); b.title = t; }
  }
  var qt = q.get('theme');
  if (qt === 'light' || qt === 'dark') setTheme(qt === 'light');
  document.getElementById('themeBtn').addEventListener('click', function () {
    var light = root.getAttribute('data-theme') !== 'light';
    store.set(TKEY, light ? 'light' : 'dark'); setTheme(light);
  });

  // ---- language
  function apply(code) {
    var d = L[code] || L.en, en = L.en || {};
    var get = function (k) { return d[k] != null ? d[k] : (en[k] != null ? en[k] : ''); };
    cur = L[code] ? code : 'en';
    root.lang = { no: 'nb', dk: 'da', cn: 'zh-Hans' }[cur] || cur;
    document.querySelectorAll('[data-i]').forEach(function (el) { el.textContent = get(el.getAttribute('data-i')); });
    document.querySelectorAll('[data-h]').forEach(function (el) { el.innerHTML = get(el.getAttribute('data-h')); });
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = get(el.getAttribute('data-t')); });
    document.querySelectorAll('[data-alt]').forEach(function (el) { el.alt = get(el.getAttribute('data-alt')).replace(/<[^>]+>/g, ''); });
    document.querySelectorAll('[data-ia]').forEach(function (el) { var t = get(el.getAttribute('data-ia')); el.setAttribute('aria-label', t); el.title = t; });
    document.querySelectorAll('[data-meta]').forEach(function (el) { el.setAttribute('content', get(el.getAttribute('data-meta'))); });
    document.getElementById('langFlag').src = 'flags/' + cur + '.png';
    document.getElementById('langCode').textContent = cur.toUpperCase();
    document.getElementById('langBtn').setAttribute('aria-label', get('langlabel'));
    document.querySelectorAll('#langList li').forEach(function (li) { li.setAttribute('aria-selected', li.dataset.code === cur ? 'true' : 'false'); });
    syncTheme();
    if (window.ummergeFitNav) window.ummergeFitNav();
  }
  var btn = document.getElementById('langBtn'), list = document.getElementById('langList');
  LANGS.forEach(function (p) {
    var li = document.createElement('li'); li.setAttribute('role', 'option'); li.tabIndex = -1; li.dataset.code = p[0];
    li.innerHTML = '<img src="flags/' + p[0] + '.png" width="20" height="14" alt=""><span></span>'; li.lastChild.textContent = p[1];
    li.addEventListener('click', function () { choose(p[0]); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(p[0]); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); (li.nextSibling || list.firstChild).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (li.previousSibling || list.lastChild).focus(); }
      else if (e.key === 'Escape') { close(); btn.focus(); }
    });
    list.appendChild(li);
  });
  function open() { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); (list.querySelector('[aria-selected=true]') || list.firstChild).focus(); }
  function close() { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  function choose(c) { store.set(KEY, c); apply(c); close(); btn.focus(); }
  btn.addEventListener('click', function () { if (list.hidden) open(); else close(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.lang')) close(); });

  // ---- header nav: links that do not fit go into "More" (all of them on small screens)
  (function () {
    var nav = document.querySelector('.bar nav'), wrap = document.getElementById('navMore'), mb = document.getElementById('moreBtn'), ml = document.getElementById('moreList');
    if (!nav || !wrap) return;
    var links = [].slice.call(nav.querySelectorAll('a'));
    function shut() { ml.hidden = true; mb.setAttribute('aria-expanded', 'false'); }
    function fit() {
      links.forEach(function (a) { nav.appendChild(a); });
      wrap.hidden = true;
      if (window.matchMedia('(max-width:960px)').matches) { links.forEach(function (a) { ml.appendChild(a); }); wrap.hidden = false; return; }
      wrap.hidden = false;   // the button takes its room first, so the links are measured against what is really left
      var moved = [];
      while (nav.lastElementChild && nav.scrollWidth > nav.clientWidth + 1) { var a = nav.lastElementChild; moved.unshift(a); nav.removeChild(a); }
      moved.forEach(function (a) { ml.appendChild(a); });
      wrap.hidden = moved.length === 0;
      if (wrap.hidden) shut();
    }
    window.ummergeFitNav = fit;
    mb.addEventListener('click', function (e) { e.stopPropagation(); var o = ml.hidden; ml.hidden = !o; mb.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) { var f = ml.querySelector('a'); if (f) f.focus(); } });
    ml.addEventListener('click', function (e) { if (e.target.closest('a')) shut(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('#navMore')) shut(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ml.hidden) { shut(); mb.focus(); } });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 80); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
  })();

  var ql = q.get('lang'), saved = store.get(KEY);
  apply(ql && L[ql] ? ql : saved && L[saved] ? saved : 'en');   // English unless the visitor chose another
})();
