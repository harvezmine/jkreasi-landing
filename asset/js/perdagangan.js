(function () {
  'use strict';

  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  var clamp = function (v, a, b) {
    return Math.max(a, Math.min(b, v));
  };

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var motion = !reduced;
  var depth = !reduced && !touch;

  if (motion)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.add('is-ready');
      });
    });
  else root.classList.add('is-ready');

  // Navigasi menu ponsel
  var burger = $('#burger'),
    sheet = $('#sheet');
  var shut = function () {
    sheet.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  burger.addEventListener('click', function () {
    var open = sheet.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#sheet a').forEach(function (a) {
    a.addEventListener('click', shut);
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') shut();
  });

  // Animasi elemen halaman
  var io =
    'IntersectionObserver' in window && motion
      ? function (els, fn, opt) {
          var o = new IntersectionObserver(function (l) {
            l.forEach(function (en) {
              if (en.isIntersecting) {
                fn(en.target);
                o.unobserve(en.target);
              }
            });
          }, opt);
          els.forEach(function (el) {
            o.observe(el);
          });
        }
      : function (els, fn) {
          els.forEach(fn);
        };

  io(
    $$('.up'),
    function (el) {
      el.classList.add('in');
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  io(
    $$('#desk'),
    function (el) {
      el.classList.add('in');
    },
    { threshold: 0.35 }
  );

  var fmt = function (n) {
    return n.toLocaleString('id-ID');
  };
  var counters = $$('[data-count]');
  if (motion)
    counters.forEach(function (el) {
      el.textContent = '0' + (el.getAttribute('data-suffix') || '');
    });
  io(
    counters,
    function (el) {
      var to = +el.getAttribute('data-count'),
        suf = el.getAttribute('data-suffix') || '',
        t0 = null;
      if (!motion) {
        el.textContent = fmt(to) + suf;
        return;
      }
      var tick = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min((t - t0) / 1600, 1);
        el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))) + suf;
        if (k < 1) requestAnimationFrame(tick);
      };
      setTimeout(function () {
        requestAnimationFrame(tick);
      }, 250);
    },
    { threshold: 0.6 }
  );

  // Dialog rincian pemakaian
  var dlg = $('#useDlg'),
    tiles = $$('.tile'),
    cur = 0;
  var dImg = $('#dlgImg'),
    dNo = $('#dlgNo'),
    dTitle = $('#dlgTitle'),
    dLead = $('#dlgLead');
  var dRole = $('#dlgRole'),
    dList = $('#dlgList'),
    dWa = $('#dlgWa'),
    dThumbs = $('#dlgThumbs');
  var two = function (n) {
    return (n < 10 ? '0' : '') + n;
  };
  var replay = function (el) {
    el.classList.remove('dlg__swap');
    void el.offsetWidth;
    el.classList.add('dlg__swap');
  };

  tiles.forEach(function (t, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', $('h3', t).textContent);
    b.innerHTML = '<img src="' + $('img', t).getAttribute('src') + '" alt="">';
    b.addEventListener('click', function () {
      showUse(i);
    });
    dThumbs.appendChild(b);
  });
  var thumbs = $$('button', dThumbs);

  var showUse = function (i) {
    cur = (i + tiles.length) % tiles.length;
    var t = tiles[cur],
      more = $('.tile__more', t),
      name = $('h3', t).textContent;
    dImg.src = $('img', t).getAttribute('src');
    dImg.alt = $('img', t).alt;
    dNo.innerHTML = two(cur + 1) + '<small>/ ' + two(tiles.length) + '</small>';
    dTitle.textContent = name;
    dLead.textContent = $('p', more).textContent;
    dRole.textContent = more.getAttribute('data-role');
    dList.innerHTML = $('ul', more).innerHTML;
    dWa.href =
      'https://wa.me/628111033334?text=' +
      encodeURIComponent(
        'Halo JKreasi, saya ingin menanyakan pasokan sulfur untuk ' +
          name.toLowerCase() +
          '.'
      );
    thumbs.forEach(function (b, n) {
      b.classList.toggle('on', n === cur);
    });
    if (motion) {
      replay(dImg);
      replay($('#dlgSwap'));
      replay($('#dlgFacts'));
    }
  };
  var openUse = function (i) {
    showUse(i);
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
      root.classList.add('dlg-open');
    }
  };
  var closeUse = function () {
    if (dlg.open) dlg.close();
  };

  tiles.forEach(function (t, i) {
    $('.tile__hit', t).addEventListener('click', function () {
      openUse(i);
    });
  });
  $('#dlgX').addEventListener('click', closeUse);
  $('#dlgPrev').addEventListener('click', function () {
    showUse(cur - 1);
  });
  $('#dlgNext').addEventListener('click', function () {
    showUse(cur + 1);
  });
  $('#dlgQuote').addEventListener('click', closeUse);
  dlg.addEventListener('close', function () {
    root.classList.remove('dlg-open');
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) closeUse();
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') showUse(cur - 1);
    if (e.key === 'ArrowRight') showUse(cur + 1);
  });

  // Interaksi dokumen legal
  var files = $('.paper'),
    tlItems = $$('#tl li');
  var pick = function (i) {
    files.forEach(function (f, n) {
      f.classList.toggle('is-on', n === i);
    });
    tlItems.forEach(function (t, n) {
      t.classList.toggle('is-on', n === i);
    });
  };
  tlItems.forEach(function (t, i) {
    t.addEventListener('mouseenter', function () {
      pick(i);
    });
    t.addEventListener('focus', function () {
      pick(i);
    });
    t.addEventListener('mouseleave', function () {
      pick(-1);
    });
    t.addEventListener('blur', function () {
      pick(-1);
    });
    t.addEventListener('click', function () {
      pick(t.classList.contains('is-on') && touch ? -1 : i);
    });
  });

  var nav = $('#nav'),
    prog = $('#prog'),
    hero = $('.hero');
  var heroImg = $('.hero__img'),
    heroIn = $('.hero__in');
  var trackbox = $('#trackbox'),
    steps = $$('.step');
  var deal = $('#transaksi'),
    dealImg = $('.deal__photo img'),
    dealSlab = $('.deal__slab'),
    tixPar = $('#tixPar');
  var cta = $('#hubungi'),
    ctaTex = $('#ctaTex');
  var desk = $('#desk');
  var pm = $('#pm'),
    pmMain = $('.pm__main img'),
    pmPrint = $('.pm__print');

  var offset = function (node, vh) {
    var r = node.getBoundingClientRect();
    return clamp((vh / 2 - (r.top + r.height / 2)) / vh, -1.2, 1.2);
  };

  // Animasi gulir halaman
  var onScroll = function () {
    var y = window.scrollY,
      vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    var over = hero.getBoundingClientRect().bottom > (nav.offsetHeight || 74);
    nav.classList.toggle('dark', over);
    nav.classList.toggle('lite', !over);

    if (depth && y < vh * 1.2) {
      heroImg.style.transform =
        'translate3d(0,' + (y * 0.3).toFixed(1) + 'px,0) scale(1.08)';
      heroIn.style.transform =
        'translate3d(0,' + (y * 0.14).toFixed(1) + 'px,0)';
      heroIn.style.opacity = clamp(1 - y / (vh * 0.8), 0, 1).toFixed(3);
    }

    var r = trackbox.getBoundingClientRect();
    var p = reduced
      ? 1
      : clamp((vh * 0.85 - r.top) / Math.max(r.height, vh * 0.55), 0, 1);
    trackbox.style.setProperty('--p', p.toFixed(3));
    steps.forEach(function (s, i) {
      s.classList.toggle('on', p > i / steps.length + 0.01);
    });

    if (depth && window.innerWidth > 1000) {
      var k = offset(deal, vh),
        ak = Math.abs(k);
      dealSlab.style.setProperty('--sy', (k * 60).toFixed(1) + 'px');
      dealImg.style.setProperty('--py', (k * 30).toFixed(1) + 'px');
      tixPar.style.setProperty('--fan', clamp(1 - ak * 1.6, 0, 1).toFixed(3));
      tixPar.style.setProperty(
        '--ry',
        (clamp(-k, -1, 1) * -14).toFixed(2) + 'deg'
      );
      tixPar.style.setProperty('--rx', (k * 6).toFixed(2) + 'deg');
      tixPar.style.translate = '0 ' + (k * -40).toFixed(1) + 'px';
    }

    if (depth) {
      var kp = offset(pm, vh);
      pmMain.style.setProperty('--py', (kp * 34).toFixed(1) + 'px');
      pmPrint.style.setProperty('--py2', (kp * -46).toFixed(1) + 'px');

      tiles.forEach(function (t) {
        var r = t.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh)
          t.style.setProperty(
            '--py',
            (clamp((vh / 2 - (r.top + r.height / 2)) / vh, -1, 1) * 22).toFixed(
              1
            ) + 'px'
          );
      });
    }

    if (depth) {
      var kd = offset(desk, vh);
      desk.style.setProperty('--tx', (48 - kd * 9).toFixed(2) + 'deg');
      desk.style.setProperty('--tz', (-26 + kd * 7).toFixed(2) + 'deg');
    }
    if (depth)
      ctaTex.style.transform =
        'translate3d(0,' + (offset(cta, vh) * 70).toFixed(1) + 'px,0)';
  };

  var queued = false;
  var request = function () {
    if (!queued) {
      queued = true;
      requestAnimationFrame(function () {
        onScroll();
        queued = false;
      });
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  onScroll();

  $('#year').textContent = new Date().getFullYear();
})();
