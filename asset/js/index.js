(function () {
  'use strict';

  setTimeout(function () {
    var g = document.getElementById('gate');
    if (g && !g.hidden && g.getAttribute('data-ready') !== '1') {
      g.hidden = true;
      document.documentElement.classList.remove('gated');
      document.body.classList.remove('gated');
    }
  }, 4000);

  // Pengaturan halaman utama
  var CONFIG = {
    waNumber: '628111033334',
    formEndpoint: '',
    gateOnce: false
  };

  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) {
    return v < a ? a : v > b ? b : v;
  };

  // Animasi gelombang air
  var LAYERS = [
    {
      y: 0,
      amp: 24,
      len: 0.0031,
      spd: 0.00021,
      off: 0,
      col: 'rgba(64,180,255,.20)'
    },
    {
      y: 0.055,
      amp: 19,
      len: 0.0044,
      spd: -0.0003,
      off: 1.4,
      col: 'rgba(0,134,234,.30)'
    },
    {
      y: 0.115,
      amp: 14,
      len: 0.0061,
      spd: 0.0004,
      off: 2.6,
      col: 'rgba(10,84,180,.52)'
    },
    {
      y: 0.18,
      amp: 10,
      len: 0.0084,
      spd: -0.00052,
      off: 3.9,
      col: 'rgba(7,38,100,.92)'
    }
  ];

  var waveY = function (L, x, t) {
    return (
      Math.sin(x * L.len + t * L.spd + L.off) * L.amp +
      Math.sin(x * L.len * 2.3 + t * L.spd * 1.7 + L.off) * L.amp * 0.34
    );
  };

  function makeWater(canvas) {
    var ctx = canvas.getContext('2d'),
      W = 0,
      H = 0;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function paint(t, level, ripple) {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      var sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0A1733');
      sky.addColorStop(0.55, '#08122B');
      sky.addColorStop(1, '#050D1F');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      var base = H - level * H,
        step = 7,
        x;

      var glow = ctx.createLinearGradient(0, base - 90, 0, base + 20);
      glow.addColorStop(0, 'rgba(0,128,224,0)');
      glow.addColorStop(1, 'rgba(0,140,235,.26)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, base - 90, W, 110);

      LAYERS.forEach(function (L, i) {
        var y0 = base + L.y * H;
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, y0 + waveY(L, 0, t));
        for (x = step; x <= W; x += step) ctx.lineTo(x, y0 + waveY(L, x, t));
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = L.col;
        ctx.fill();

        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(0, y0 + waveY(L, 0, t));
          for (x = step; x <= W; x += step) ctx.lineTo(x, y0 + waveY(L, x, t));
          ctx.strokeStyle = 'rgba(150,215,255,.55)';
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
      });

      if (ripple && ripple.a > 0) {
        for (var k = 0; k < 3; k++) {
          var rr = ripple.r - k * 90;
          if (rr <= 0) continue;
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, rr, 0, Math.PI * 2);
          ctx.strokeStyle =
            'rgba(150,215,255,' + (ripple.a * (1 - k * 0.3)).toFixed(3) + ')';
          ctx.lineWidth = 2 - k * 0.5;
          ctx.stroke();
        }
      }
    }

    return { size: size, paint: paint };
  }

  // Gerbang halaman utama
  var gate = $('#gate'),
    gateWater = makeWater($('#gateWater'));
  var gateOn = true,
    entering = false,
    tEnter = 0,
    cx = 0,
    cy = 0;

  var unlock = function () {
    document.documentElement.classList.remove('gated');
    document.body.classList.remove('gated');
  };

  var finishGate = function () {
    gateOn = false;
    gate.hidden = true;
    unlock();
    try {
      if (CONFIG.gateOnce) sessionStorage.setItem('jk_gate', '1');
    } catch (err) {}
    openFromHash();
  };

  var ptOf = function (e) {
    if (!e) return null;
    if (typeof e.clientX === 'number') return { x: e.clientX, y: e.clientY };
    var t =
      (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    return t ? { x: t.clientX, y: t.clientY } : null;
  };
  var enter = function (e) {
    if (entering) return;
    entering = true;
    var pt = ptOf(e);
    cx = pt ? pt.x : window.innerWidth / 2;
    cy = pt ? pt.y : window.innerHeight * 0.5;
    if (reduced) {
      finishGate();
      return;
    }
    tEnter = performance.now();
    setTimeout(function () {
      gate.classList.add('out');
    }, 620);
    setTimeout(finishGate, 1520);
  };

  var gateLoop = function (t) {
    if (!gateOn) return;
    var lv = 0.26,
      rip = null;
    if (entering) {
      var e = Math.min((t - tEnter) / 950, 1);
      var k = 1 - Math.pow(1 - e, 3);
      lv = 0.26 + k * 0.95;
      rip = {
        x: cx,
        y: cy,
        r: k * Math.max(window.innerWidth, window.innerHeight) * 1.3,
        a: (1 - e) * 0.55
      };
    }
    gateWater.paint(t, lv, rip);
    requestAnimationFrame(gateLoop);
  };

  var skipGate = false;
  try {
    skipGate = CONFIG.gateOnce && sessionStorage.getItem('jk_gate') === '1';
  } catch (err) {}

  gate.setAttribute('data-ready', '1');

  if (skipGate) {
    gateOn = false;
    gate.hidden = true;
    unlock();
  } else {
    gate.addEventListener('click', enter);

    gate.addEventListener('touchend', enter, { passive: true });
    gate.addEventListener('touchmove', enter, { passive: true });
    gate.addEventListener('wheel', enter, { passive: true });
    $('#gateEnter').addEventListener('click', function (e) {
      e.stopPropagation();
      enter(e);
    });
    document.addEventListener('keydown', function (e) {
      if (
        gateOn &&
        !entering &&
        (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')
      ) {
        e.preventDefault();
        enter(null);
      }
    });
  }

  var stage = $('#stage'),
    heroWater = makeWater($('#water'));
  var heroSeen = true,
    heroRaf = null,
    heroLevel = 0.2;

  var heroLoop = function (t) {
    if (!heroSeen) {
      heroRaf = null;
      return;
    }
    var span = stage.offsetHeight || window.innerHeight;
    var p = clamp(-stage.getBoundingClientRect().top / span, 0, 1);
    var want = 0.2 + p * 0.2;
    heroLevel += (want - heroLevel) * 0.08;
    heroWater.paint(t, heroLevel, null);
    heroRaf = requestAnimationFrame(heroLoop);
  };
  var startHero = function () {
    if (!heroRaf && heroSeen && !reduced)
      heroRaf = requestAnimationFrame(heroLoop);
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (e) {
        heroSeen = e[0].isIntersecting;
        if (heroSeen) startHero();
      },
      { threshold: 0 }
    ).observe(stage);
  }

  var callCv = $('#callWater'),
    callWater = callCv ? makeWater(callCv) : null;
  var callSeen = false,
    callRaf = null;
  var callLoop = function (t) {
    if (!callSeen || !callWater) {
      callRaf = null;
      return;
    }
    callWater.paint(t, 0.14, null);
    callRaf = requestAnimationFrame(callLoop);
  };
  var startCall = function () {
    if (!callRaf && callSeen && !reduced && callWater)
      callRaf = requestAnimationFrame(callLoop);
  };
  if (callCv && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      function (e) {
        callSeen = e[0].isIntersecting;
        if (callSeen) startCall();
      },
      { threshold: 0 }
    ).observe(callCv);
  }

  var esc = function (t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var two = function (n) {
    return (n < 10 ? '0' : '') + n;
  };

  // Data proyek portofolio
  var projects = $$('#projects .proj')
    .filter(function (a) {
      var title = $('h3', a);
      return title && title.textContent.trim();
    })
    .map(function (a) {
      var f = function (k) {
        var el = $('[data-f="' + k + '"]', a);
        return el ? el.textContent.trim() : '';
      };
      return {
        slug: a.getAttribute('data-slug') || '',
        img: a.getAttribute('data-img') || '',
        title: $('h3', a).textContent.trim(),
        client: f('client'),
        sector: f('sector'),
        summary: f('summary'),
        facts: $('[data-f="facts"]', a),
        story: $('[data-f="story"]', a)
      };
    });

  var casesEl = $('#portofolio'),
    rail = $('#rail'),
    track = $('#railTrack'),
    featShot = $('#featShot'),
    featTxt = $('#featTxt'),
    casesBar = $('#casesBar'),
    panel = $('#case'),
    N = projects.length,
    idx = -1,
    backTo = null,
    active = -1;

  casesEl.style.setProperty('--n', N);
  casesEl.hidden = N === 0;
  casesEl.classList.toggle('cases--single', N === 1);
  $('#featOf').textContent = '/ ' + two(N);

  featShot.innerHTML = projects
    .map(function (p, i) {
      return (
        '<figure class="slide" data-i="' +
        i +
        '"><span class="shot__ph"><span>Foto menyusul</span><b>' +
        two(i + 1) +
        '</b></span>' +
        (p.img
          ? '<img src="' +
            esc(p.img) +
            '" alt="' +
            esc(p.title) +
            '" loading="lazy" onerror="this.remove()">'
          : '') +
        '</figure>'
      );
    })
    .join('');
  track.innerHTML = projects
    .map(function (p, i) {
      return (
        '<button class="tile" type="button" data-i="' +
        i +
        '"><span class="tile__shot"><span class="shot__ph"><span>Foto</span><b>' +
        two(i + 1) +
        '</b></span>' +
        (p.img
          ? '<img src="' +
            esc(p.img) +
            '" alt="" loading="lazy" onerror="this.remove()">'
          : '') +
        '</span>' +
        '<span class="tile__meta"><span class="tile__no">' +
        two(i + 1) +
        '</span><span class="tile__t">' +
        esc(p.title) +
        '</span></span></button>'
      );
    })
    .join('');

  var tiles = $$('.tile', track),
    slides = $$('.slide', featShot);
  var mqCoarse = window.matchMedia('(hover:none) and (pointer:coarse)');
  var wide = function () {
    return window.innerWidth > 900 && !reduced && !mqCoarse.matches;
  };

  var setActive = function (i) {
    if (!N) return;
    i = clamp(i, 0, N - 1);
    if (i === active) return;
    active = i;
    var p = projects[i];
    tiles.forEach(function (el, k) {
      el.classList.toggle('on', k === i);
      el.setAttribute('aria-pressed', String(k === i));
    });
    slides.forEach(function (el, k) {
      el.classList.toggle('on', k === i);
    });

    $('#featNo').textContent = two(i + 1);
    $('#featSector').textContent = p.sector;
    $('#featTitle').textContent = p.title;
    $('#featClient').textContent = p.client;
    $('#featDesc').textContent = p.summary;

    if (!reduced && featTxt.animate) {
      featTxt.animate(
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'none' }
        ],
        { duration: 420, easing: 'cubic-bezier(.22,.75,.3,1)' }
      );
    }
  };

  // Gulir kartu portofolio
  var railX = 0,
    casesSeen = false,
    casesRaf = null;

  var casesLoop = function () {
    if (!casesSeen) {
      casesRaf = null;
      return;
    }
    if (wide()) {
      var range = casesEl.offsetHeight - window.innerHeight;
      var p =
        range > 0
          ? clamp(-casesEl.getBoundingClientRect().top / range, 0, 1)
          : 0;
      var max = Math.max(track.scrollWidth - rail.clientWidth, 0);
      var to = p * max;
      railX += (to - railX) * 0.085;
      if (Math.abs(to - railX) < 0.25) railX = to;
      track.style.transform = 'translate3d(' + (-railX).toFixed(2) + 'px,0,0)';

      var pe = max > 0 ? railX / max : p;
      setActive(Math.round(pe * (N - 1)));
      casesBar.style.transform = 'scaleX(' + pe.toFixed(4) + ')';
      featShot.style.setProperty('--px', pe.toFixed(4));
    }
    casesRaf = requestAnimationFrame(casesLoop);
  };
  var startCases = function () {
    if (N && !casesRaf && casesSeen)
      casesRaf = requestAnimationFrame(casesLoop);
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (e) {
        casesSeen = e[0].isIntersecting;
        if (casesSeen) startCases();
      },
      { threshold: 0 }
    ).observe(casesEl);
  } else {
    casesSeen = true;
    startCases();
  }

  tiles.forEach(function (t, i) {
    t.addEventListener('click', function () {
      if (!wide() || N < 2) {
        setActive(i);
        return;
      }
      var range = casesEl.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: casesEl.offsetTop + (i / (N - 1)) * range,
        behavior: 'smooth'
      });
    });
  });

  // Panel rincian proyek
  var navBtn = function (btn, j, dir) {
    var q = projects[j];
    btn.disabled = !q;
    btn.innerHTML = q
      ? (q.img ? '<img src="' + esc(q.img) + '" alt="">' : '') +
        '<span><i>' +
        dir +
        '</i><b>' +
        esc(q.title) +
        '</b></span>'
      : '';
  };

  var openCase = function (i, syncHash) {
    if (i < 0 || i >= N) return;
    idx = i;
    var p = projects[i],
      img = $('#caseImg');

    $('#caseNo').textContent = 'Studi kasus ' + two(i + 1) + ' / ' + two(N);
    $('#caseSector').textContent = p.sector;
    $('#caseTitle').textContent = p.title;
    $('#caseSum').textContent = p.summary;
    $('#caseBlur').style.backgroundImage = p.img ? 'url("' + p.img + '")' : '';
    img.hidden = !p.img;
    if (p.img) {
      img.src = p.img;
      img.alt = p.title;
    }

    var facts = [];
    if (p.client) facts.push(['Klien', p.client]);
    if (p.facts)
      $$('dt', p.facts).forEach(function (dt) {
        facts.push([
          dt.textContent,
          dt.nextElementSibling ? dt.nextElementSibling.textContent : ''
        ]);
      });
    $('#caseFacts').innerHTML = facts
      .map(function (f) {
        return (
          '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'
        );
      })
      .join('');

    $('#caseStory').innerHTML = p.story
      ? $$('h4', p.story)
          .map(function (h) {
            var body =
              h.nextElementSibling && h.nextElementSibling.tagName === 'P'
                ? h.nextElementSibling.innerHTML
                : '';
            return (
              '<li><h4>' + esc(h.textContent) + '</h4><p>' + body + '</p></li>'
            );
          })
          .join('')
      : '';

    navBtn($('#casePrev'), i - 1, 'Sebelumnya');
    navBtn($('#caseNext'), i + 1, 'Berikutnya');

    if (panel.hidden) {
      backTo = document.activeElement;
      panel.hidden = false;
      document.body.classList.add('locked');
      void panel.offsetWidth;
      panel.classList.add('in');
      $('.case__x', panel).focus();
    }
    $('.case__panel', panel).scrollTop = 0;

    if (
      syncHash !== false &&
      p.slug &&
      window.history &&
      history.replaceState
    ) {
      history.replaceState(null, '', '#' + p.slug);
    }
  };

  var closeCase = function () {
    if (panel.hidden) return;
    panel.classList.remove('in');
    document.body.classList.remove('locked');
    setTimeout(
      function () {
        panel.hidden = true;
      },
      reduced ? 0 : 560
    );
    if (
      window.history &&
      history.replaceState &&
      location.hash.indexOf('#studi-') === 0
    ) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (backTo && backTo.focus) backTo.focus();
  };

  function openFromHash() {
    var h = location.hash.replace('#', '');
    for (var i = 0; i < N; i++) {
      if (projects[i].slug && projects[i].slug === h) {
        setActive(i);
        openCase(i, false);
        return;
      }
    }
  }

  $('#featOpen').addEventListener('click', function () {
    openCase(active < 0 ? 0 : active);
  });
  $$('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeCase);
  });
  $('#casePrev').addEventListener('click', function () {
    openCase(idx - 1);
  });
  $('#caseNext').addEventListener('click', function () {
    openCase(idx + 1);
  });

  document.addEventListener('keydown', function (e) {
    if (panel.hidden) return;
    if (e.key === 'Escape') closeCase();
    if (e.key === 'ArrowLeft') openCase(idx - 1);
    if (e.key === 'ArrowRight') openCase(idx + 1);
  });

  if (N) setActive(0);

  var mates = $$('.crew .mate'),
    mid = (mates.length - 1) / 2;
  mates.forEach(function (m, i) {
    m.style.setProperty(
      '--o',
      (mid ? (Math.abs(i - mid) / mid) * 48 : 0).toFixed(1) + 'px'
    );
  });
  $('#crewCount').setAttribute('data-count', mates.length);

  // Navigasi menu ponsel
  var burger = $('#burger'),
    sheet = $('#sheet'),
    nav = $('#nav'),
    prog = $('#prog');
  var shut = function () {
    sheet.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Buka menu');
  };
  burger.addEventListener('click', function () {
    var open = sheet.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  });
  $$('#sheet a').forEach(function (a) {
    a.addEventListener('click', shut);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') shut();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) shut();
  });

  var ups = $$('.up');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(
      function (l) {
        l.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    );
    ups.forEach(function (el) {
      io.observe(el);
    });
  } else {
    ups.forEach(function (el) {
      el.classList.add('in');
    });
  }

  var run = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0,
      t0 = null;
    var tick = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / 1500, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  var nums = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    var nio = new IntersectionObserver(
      function (l) {
        l.forEach(function (en) {
          if (en.isIntersecting) {
            run(en.target);
            nio.unobserve(en.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach(function (el) {
      nio.observe(el);
    });
  } else {
    nums.forEach(function (el) {
      el.textContent = el.getAttribute('data-count');
    });
  }

  var links = $$('.nav__menu a');
  var secs = links
    .map(function (a) {
      return $(a.getAttribute('href'));
    })
    .filter(Boolean);

  var tradeSec = $('#perdagangan'),
    tradePhoto = $('.trade__photo');
  var tradeDepth =
    !reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var onScroll = function () {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    var over = stage.getBoundingClientRect().bottom > (nav.offsetHeight || 74);
    nav.classList.toggle('dark', over);
    nav.classList.toggle('lite', !over);

    if (secs.length) {
      var pos = y + (nav.offsetHeight || 74) + 60,
        cur = null;
      secs.forEach(function (s) {
        if (s.offsetTop <= pos) cur = s;
      });
      links.forEach(function (a) {
        a.classList.toggle(
          'on',
          !!cur && a.getAttribute('href') === '#' + cur.id
        );
      });
    }

    if (tradeDepth && tradePhoto && window.innerWidth > 900) {
      var tr = tradeSec.getBoundingClientRect(),
        vh = window.innerHeight;
      if (tr.bottom > 0 && tr.top < vh) {
        var k = Math.max(
          -1,
          Math.min(1, (vh / 2 - (tr.top + tr.height / 2)) / vh)
        );
        tradePhoto.style.transform =
          'translate3d(0,' + (k * 60).toFixed(1) + 'px,0)';
      }
    }
  };

  var queued = false;
  window.addEventListener(
    'scroll',
    function () {
      if (!queued) {
        queued = true;
        requestAnimationFrame(function () {
          onScroll();
          queued = false;
        });
      }
    },
    { passive: true }
  );

  $$('.qa__i').forEach(function (item) {
    var btn = $('.qa__q', item),
      body = $('.qa__a', item);
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      $$('.qa__i.open').forEach(function (o) {
        o.classList.remove('open');
        $('.qa__q', o).setAttribute('aria-expanded', 'false');
        $('.qa__a', o).style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Formulir pesan kontak
  var form = $('#form'),
    ok = $('#msgOk'),
    no = $('#msgNo');
  var check = function () {
    var valid = true;
    $$('input[required], select[required], textarea[required]', form).forEach(
      function (el) {
        var v = el.value.trim(),
          bad = !v;
        if (!bad && el.type === 'email')
          bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && el.type === 'tel') bad = v.replace(/\D/g, '').length < 8;
        el.closest('.f').classList.toggle('bad', bad);
        if (bad) valid = false;
      }
    );
    return valid;
  };
  $$('input, select, textarea', form).forEach(function (el) {
    el.addEventListener(
      el.tagName === 'SELECT' ? 'change' : 'input',
      function () {
        if (el.closest('.f').classList.contains('bad')) check();
      }
    );
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ok.classList.remove('show');
    no.classList.remove('show');
    if (!check()) {
      var b = $('.f.bad input, .f.bad select, .f.bad textarea', form);
      if (b) b.focus();
      return;
    }

    var d = {
      nama: $('#nama').value.trim(),
      instansi: $('#instansi').value.trim(),
      email: $('#email').value.trim(),
      telepon: $('#telepon').value.trim(),
      kebutuhan: $('#kebutuhan').value,
      pesan: $('#pesan').value.trim()
    };
    var done = function () {
      ok.classList.add('show');
      form.reset();
    };
    var fail = function () {
      no.classList.add('show');
    };

    if (CONFIG.formEndpoint) {
      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(d)
      })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          done();
        })
        .catch(fail);
    } else {
      var text =
        'Halo JKreasi, saya ' +
        d.nama +
        ' dari ' +
        d.instansi +
        '. ' +
        'Saya ingin berdiskusi mengenai kebutuhan ' +
        d.kebutuhan +
        '.\n\n' +
        d.pesan +
        '\n\nEmail: ' +
        d.email +
        '\nTelepon: ' +
        d.telepon;
      var w = window.open(
        'https://wa.me/' +
          CONFIG.waNumber +
          '?text=' +
          encodeURIComponent(text),
        '_blank'
      );
      if (w) {
        done();
      } else {
        fail();
      }
    }
  });

  // Interaksi layanan digital
  var comb = $('#comb');
  if (comb) {
    var svcData = $$('.svc__data', $('#svcStore')),
      cells = $$('.hex--node', comb),
      wires = $$('.wire', comb),
      xBody = $('#combBody'),
      picked = -1,
      swapT = null;

    var pick = function (i, focus) {
      if (i < 0) i = cells.length - 1;
      if (i >= cells.length) i = 0;
      if (i === picked) return;
      picked = i;

      cells.forEach(function (c, k) {
        c.classList.toggle('on', k === i);
        c.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      wires.forEach(function (w, k) {
        w.classList.toggle('on', k === i);
      });
      comb.classList.add('picked');
      if (focus) cells[i].focus();

      xBody.classList.add('fade');
      clearTimeout(swapT);
      swapT = setTimeout(
        function () {
          xBody.innerHTML = svcData[i].innerHTML;
          xBody.classList.remove('fade');
        },
        reduced ? 0 : 190
      );
    };

    cells.forEach(function (c, i) {
      c.addEventListener('mouseenter', function () {
        pick(i);
      });
      c.addEventListener('focus', function () {
        pick(i);
      });
      c.addEventListener('click', function () {
        pick(i);
      });
      c.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          pick(i + 1, true);
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          pick(i - 1, true);
        }
      });
    });

    var stage3d = $('.comb__stage', comb);
    if (stage3d && !reduced && !mqCoarse.matches) {
      var tX = 0,
        tY = 0,
        cX = 0,
        cY = 0,
        tRaf = null;
      var tiltLoop = function () {
        cX += (tX - cX) * 0.08;
        cY += (tY - cY) * 0.08;
        stage3d.style.transform =
          'rotateX(' +
          (-cY * 5).toFixed(2) +
          'deg) rotateY(' +
          (cX * 6).toFixed(2) +
          'deg)';
        if (Math.abs(tX - cX) > 0.0015 || Math.abs(tY - cY) > 0.0015)
          tRaf = requestAnimationFrame(tiltLoop);
        else {
          tRaf = null;
        }
      };
      var kick = function () {
        if (!tRaf) tRaf = requestAnimationFrame(tiltLoop);
      };
      comb.addEventListener('pointermove', function (e) {
        var r = comb.getBoundingClientRect();
        tX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tY = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      });
      comb.addEventListener('pointerleave', function () {
        tX = 0;
        tY = 0;
        kick();
      });
    }

    xBody.innerHTML = svcData[0].innerHTML;
    cells[0].classList.add('on');
    wires[0].classList.add('on');
    picked = 0;
  }

  var boot = function () {
    gateWater.size();
    heroWater.size();
    if (callWater) {
      callWater.size();
      if (reduced) callWater.paint(0, 0.14, null);
    }
    onScroll();
    if (reduced) {
      heroWater.paint(0, 0.3, null);
      if (gateOn) gateWater.paint(0, 0.26, null);
    } else {
      startHero();
    }
    $$('.qa__i.open .qa__a').forEach(function (b) {
      b.style.maxHeight = b.scrollHeight + 'px';
    });
  };

  window.addEventListener('resize', boot);
  window.addEventListener('orientationchange', boot);
  boot();

  if (gateOn && !reduced) requestAnimationFrame(gateLoop);
  if (!gateOn) openFromHash();

  $('#year').textContent = new Date().getFullYear();
})();
