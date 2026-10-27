(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* ---------- Titolo dell'hero: comparsa parola per parola ---------- */
  var heroTitle = document.querySelector('.hero__title');
  if (heroTitle) {
    var words = heroTitle.textContent.trim().split(/\s+/);
    heroTitle.setAttribute('aria-label', heroTitle.textContent.trim());
    heroTitle.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  }

  /* ---------- Header: trasparente sull'hero, pieno dopo ---------- */
  var header = document.querySelector('.header');
  var hero = document.querySelector('.hero');
  var callbar = document.getElementById('callbar');
  var formSectionVisible = false;

  function updateHeader() {
    // pieno appena si scorre: il titolo dell'hero non passa mai sotto il logo trasparente
    header.classList.toggle('is-solid', window.scrollY > 40);
  }

  /* ---------- Barra contatti su telefono ---------- */
  function updateCallbar() {
    var pastHero = hero ? window.scrollY > hero.offsetHeight * 0.55 : true;
    var overlayOpen = document.body.classList.contains('no-scroll');
    var show = pastHero && !formSectionVisible && !overlayOpen;
    callbar.classList.toggle('is-visible', show);
    callbar.setAttribute('aria-hidden', show ? 'false' : 'true');
    callbar.querySelectorAll('a').forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    document.body.classList.toggle('callbar-on', show && window.innerWidth < 960);
  }

  // la barra sparisce nel modulo e vicino al blocco con il numero di telefono
  var hideZones = ['richiesta', 'contatti'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var zonesInView = {};
  if ('IntersectionObserver' in window && hideZones.length) {
    var zoneIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { zonesInView[entry.target.id] = entry.isIntersecting; });
      formSectionVisible = Object.keys(zonesInView).some(function (k) { return zonesInView[k]; });
      updateCallbar();
    }, { rootMargin: '0px 0px -25% 0px' });
    hideZones.forEach(function (z) { zoneIo.observe(z); });
  }

  /* ---------- Hero e fasce: sfocatura e parallax allo scroll ---------- */
  var heroMedia = document.querySelector('.hero__media');
  var heroShade = document.querySelector('.hero__shade');
  var bands = Array.prototype.slice.call(document.querySelectorAll('.band'));
  var ticking = false;

  function isDesktop() { return window.innerWidth >= 960; }

  /* ---------- Video del drone nell'apertura ---------- */
  // con "riduci movimento" o il risparmio dati resta solo il poster
  var heroVideo = document.querySelector('.hero__video');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (heroVideo && !reduceMotion && !saveData) {
    var playVideo = function () {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {}); // autoplay bloccato: resta il poster
    };
    heroVideo.muted = true;
    heroVideo.src = window.matchMedia('(max-width: 767px)').matches
      ? heroVideo.getAttribute('data-src-phone')
      : heroVideo.getAttribute('data-src-desktop');
    heroVideo.addEventListener('playing', function () { heroMedia.classList.add('is-playing'); }, { once: true });
    playVideo();
    // fuori schermo il video si ferma: meno batteria e meno dati
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) playVideo();
        else heroVideo.pause();
      }).observe(hero);
    }
  }

  function updateEffects() {
    ticking = false;
    var vh = window.innerHeight;
    var desktop = isDesktop();

    if (hero && heroMedia) {
      var h = hero.offsetHeight;
      var p = Math.min(Math.max(window.scrollY / h, 0), 1);
      if (p < 1) {
        heroMedia.style.transform = 'translate3d(0,' + (p * h * (desktop ? 0.3 : 0.15)).toFixed(1) + 'px,0)';
        heroMedia.style.filter = p > 0.01 ? 'blur(' + (p * (desktop ? 8 : 4)).toFixed(2) + 'px)' : '';
        heroShade.style.opacity = (p * 0.45).toFixed(3);
      }
    }

    bands.forEach(function (band) {
      var r = band.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var progress = (r.top + r.height / 2 - vh / 2) / vh; // circa da +0,8 a -0,8
      var shift = -progress * r.height * (desktop ? 0.2 : 0.1);
      band.querySelector('.band__media').style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
    });
  }

  function requestEffects() {
    if (reduceMotion || ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateEffects);
  }

  // la scritta delle fasce compare con una dissolvenza
  if (reduceMotion || !('IntersectionObserver' in window)) {
    bands.forEach(function (b) { b.classList.add('is-visible'); });
  } else {
    var bandIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          bandIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    bands.forEach(function (b) { bandIo.observe(b); });
  }

  function onScroll() {
    updateHeader();
    updateCallbar();
    requestEffects();
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Menu a tre lineette ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');

  function openMenu() {
    menu.hidden = false;
    void menu.offsetWidth; // forza il reflow per far partire la transizione
    menu.classList.add('is-open');
    header.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Chiudi il menu');
    document.body.classList.add('no-scroll');
    updateCallbar();
    var first = menu.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus) {
    menu.classList.remove('is-open');
    header.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Apri il menu');
    document.body.classList.remove('no-scroll');
    updateCallbar();
    window.setTimeout(function () {
      if (!menu.classList.contains('is-open')) menu.hidden = true;
    }, reduceMotion ? 0 : 350);
    if (returnFocus) burger.focus();
  }

  /* ---------- Il nome in alto riporta in cima ---------- */
  // l'header è fisso, quindi il link #top da solo non farebbe scorrere la pagina
  document.querySelector('.logo').addEventListener('click', function (e) {
    e.preventDefault();
    if (burger.getAttribute('aria-expanded') === 'true') closeMenu(false);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  burger.addEventListener('click', function () {
    if (burger.getAttribute('aria-expanded') === 'true') closeMenu(true);
    else openMenu();
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu(false);
  });

  /* ---------- Immagini piccole: entrano di lato, alternando sinistra e destra ---------- */
  // escluse le immagini a tutta larghezza (hero e fasce) e quelle nei caroselli
  var slides = Array.prototype.slice.call(document.querySelectorAll('main figure, main .gallery__item'))
    .filter(function (el) { return !el.closest('.hero, .band, .carosello'); });
  var alterna = 0;
  slides.forEach(function (el) {
    el.classList.remove('reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    // nella sua riga: la foto a sinistra entra da sinistra, quella a destra da destra
    // (le vicine non si incrociano); le foto centrate, una per riga, si alternano
    var r = el.getBoundingClientRect();
    var pr = el.parentElement.getBoundingClientRect();
    var offset = (r.left + r.width / 2) - (pr.left + pr.width / 2);
    var fromLeft = Math.abs(offset) < pr.width * 0.08 ? (alterna++ % 2 === 0) : offset < 0;
    el.classList.add('slide');
    el.style.setProperty('--dx', (fromLeft ? -56 : 56) + 'px');
  });
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var slideIo = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        slideIo.unobserve(el); // una sola volta
        // piccolo ritardo tra immagini che entrano insieme
        el.style.setProperty('--delay', Math.min(batch, 3) * 0.09 + 's');
        batch++;
        // parte solo quando la foto è caricata: con connessioni lente
        // l'animazione non deve svolgersi su un riquadro ancora vuoto
        var img = el.querySelector('img');
        var start = function () {
          window.requestAnimationFrame(function () { el.classList.add('is-in'); });
        };
        if (img && !img.complete) {
          img.addEventListener('load', start, { once: true });
          img.addEventListener('error', start, { once: true });
        } else {
          start();
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    slides.forEach(function (el) { slideIo.observe(el); });
  }

  /* ---------- Comparsa leggera allo scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Toast ---------- */
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- Copia numero ---------- */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { showToast('Numero copiato: ' + text); };
      var fail = function () {
        if (fallbackCopy(text)) done();
        else showToast('Copia non riuscita. Il numero è ' + text);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        fail();
      }
    });
  });

  /* ---------- Lightbox delle gallerie ---------- */
  var photos = [];
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('.lightbox__img');
  var lbCount = document.getElementById('lb-count');
  var lbText = document.getElementById('lb-text');
  var lbDots = lb.querySelector('.lightbox__dots');
  var lbFigure = lb.querySelector('.lightbox__figure');
  var current = 0;
  var lastTrigger = null;


  function preload(index) {
    var p = photos[(index + photos.length) % photos.length];
    var im = new Image();
    im.src = p.src;
  }

  function show(index) {
    current = (index + photos.length) % photos.length;
    var p = photos[current];
    lbImg.classList.add('is-loading');
    var swap = function () {
      lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
      lbImg.src = p.src;
      lbImg.alt = p.alt;
      if (lbImg.complete) lbImg.classList.remove('is-loading');
    };
    // breve dissolvenza tra una foto e l'altra
    if (lb.hidden || reduceMotion) swap();
    else window.setTimeout(swap, 180);
    lbCount.textContent = (current + 1) + ' di ' + photos.length;
    lbText.textContent = p.alt;
    Array.prototype.forEach.call(lbDots.children, function (d, i) {
      d.classList.toggle('is-active', i === current);
    });
    preload(current + 1);
    preload(current - 1);
  }

  function openLightbox(list, name, index, trigger) {
    lastTrigger = trigger;
    photos = list;
    lb.setAttribute('aria-label', 'Galleria: ' + name);
    lbDots.innerHTML = '';
    photos.forEach(function () { lbDots.appendChild(document.createElement('span')); });
    show(index);
    lb.hidden = false;
    void lb.offsetWidth;
    lb.classList.add('is-open');
    document.body.classList.add('no-scroll');
    updateCallbar();
    lb.querySelector('.lightbox__close').focus();
  }

  function closeLightbox() {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    updateCallbar();
    window.setTimeout(function () {
      if (lb.classList.contains('is-open')) return;
      lb.hidden = true;
      lbFigure.style.transform = '';
      lbFigure.style.opacity = '';
    }, reduceMotion ? 0 : 300);
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  var galleries = {};
  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    var name = gallery.getAttribute('data-gallery');
    var buttons = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__item'));
    var list = buttons.map(function (btn) {
      var img = btn.querySelector('img');
      // nella lightbox la versione grande, se c'è
      return { src: img.getAttribute('data-full') || img.getAttribute('src'), alt: img.getAttribute('alt') };
    });
    galleries[gallery.id] = list;
    buttons.forEach(function (btn, i) {
      btn.setAttribute('aria-label', 'Ingrandisci: ' + list[i].alt);
      btn.addEventListener('click', function () { openLightbox(list, name, i, btn); });
    });
  });

  /* ---------- Galleria: "Vedi tutte le foto" e avanzamento del carosello ---------- */
  var galGrid = document.getElementById('galleria-foto');
  var galBtn = document.getElementById('galleria-tutte');
  var galBar = document.querySelector('.galleria__progress span');
  if (galGrid && galBtn) {
    var galLabel = galBtn.textContent;
    galBtn.addEventListener('click', function () {
      // sul telefono le foto sono già tutte nel carosello: si aprono a schermo intero
      if (!isDesktop()) {
        openLightbox(galleries['galleria-foto'], 'Galleria', 0, galBtn);
        return;
      }
      var open = galGrid.classList.toggle('is-open');
      galBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      galBtn.textContent = open ? 'Mostra meno foto' : galLabel;
      if (!open && galGrid.getBoundingClientRect().top < 0) {
        galGrid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
    if (galBar) {
      var updateGalBar = function () {
        var max = galGrid.scrollWidth - galGrid.clientWidth;
        var p = max > 0 ? galGrid.scrollLeft / max : 0;
        galBar.style.transform = 'scaleX(' + (0.08 + p * 0.92).toFixed(3) + ')';
      };
      galGrid.addEventListener('scroll', updateGalBar, { passive: true });
    }
  }

  lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', function () { show(current - 1); });
  lb.querySelector('.lightbox__nav--next').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lightbox__figure') || e.target.classList.contains('lightbox__frame')) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        // tiene il focus dentro la lightbox
        var f = lb.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });

  // Swipe sul telefono: di lato cambia foto, in su o in giù chiude
  var startX = 0, startY = 0, tracking = false, axis = '';
  lb.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { tracking = false; return; }
    tracking = true;
    axis = '';
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    lbFigure.style.transition = 'none';
  }, { passive: true });
  lb.addEventListener('touchmove', function (e) {
    if (!tracking || e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
    // la foto segue il dito e sfuma man mano
    if (axis === 'y' && !reduceMotion) {
      lbFigure.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0)';
      lbFigure.style.opacity = Math.max(0.35, 1 - Math.abs(dy) / 420).toFixed(3);
    }
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    lbFigure.style.transition = '';
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (axis === 'y' && Math.abs(dy) > 90) {
      if (!reduceMotion) {
        lbFigure.style.transform = 'translate3d(0,' + (dy > 0 ? 1 : -1) * window.innerHeight * 0.35 + 'px,0)';
        lbFigure.style.opacity = '0';
      }
      closeLightbox();
      return;
    }
    lbFigure.style.transform = '';
    lbFigure.style.opacity = '';
    if (axis === 'x' && Math.abs(dx) > 45) show(dx < 0 ? current + 1 : current - 1);
  });

  /* ---------- Modulo richiesta di preventivo ---------- */
  var form = document.getElementById('form-evento');
  var conferma = document.getElementById('conferma');
  var riepilogo = document.getElementById('riepilogo');
  var summary = document.getElementById('form-summary');
  var dateInput = document.getElementById('f-data');

  var today = new Date();
  var iso = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  dateInput.min = iso;

  var rules = [
    { id: 'f-tipo', err: 'e-tipo', check: function (v) { return v ? '' : 'Scegli il tipo di evento dall\'elenco.'; } },
    { id: 'f-data', err: 'e-data', check: function (v) {
      if (!v) return 'Indica la data dell\'evento, anche indicativa.';
      if (v < iso) return 'La data è già passata: scegli un giorno da oggi in poi.';
      return '';
    } },
    { id: 'f-ospiti', err: 'e-ospiti', check: function (v) {
      var n = Number(v);
      if (!v) return 'Indica quanti ospiti prevedete, anche approssimativamente.';
      if (!Number.isInteger(n) || n < 1) return 'Scrivi il numero di ospiti in cifre, ad esempio 60.';
      if (n > 2000) return 'Il numero sembra troppo alto: controlla le cifre.';
      return '';
    } },
    { id: 'f-nome', err: 'e-nome', check: function (v) { return v.trim().length >= 2 ? '' : 'Scrivi nome e cognome.'; } },
    { id: 'f-tel', err: 'e-tel', check: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Scrivi un numero di telefono per essere ricontattati.';
      if (/[^\d\s+().\/-]/.test(v)) return 'Il numero può contenere solo cifre, spazi e il segno +.';
      if (digits.length < 6 || digits.length > 15) return 'Il numero sembra incompleto: controlla le cifre.';
      return '';
    } },
    { id: 'f-email', err: 'e-email', check: function (v) {
      v = v.trim();
      if (!v) return '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'L\'indirizzo email non sembra corretto, ad esempio nome@email.it.';
    } }
  ];

  function describedBy(input, errId, hasError) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== errId; });
    if (hasError) ids.push(errId);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  function validateField(rule) {
    var input = document.getElementById(rule.id);
    var msg = rule.check(input.value);
    document.getElementById(rule.err).textContent = msg;
    input.closest('.field').classList.toggle('has-error', !!msg);
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    describedBy(input, rule.err, !!msg);
    return !msg;
  }

  rules.forEach(function (rule) {
    var input = document.getElementById(rule.id);
    var evt = input.tagName === 'SELECT' || input.type === 'date' ? 'change' : 'blur';
    input.addEventListener(evt, function () {
      if (input.closest('.field').classList.contains('has-error') || input.value) validateField(rule);
    });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('has-error')) validateField(rule);
    });
  });

  function formatDate(value) {
    var parts = value.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function addRow(label, value) {
    var row = document.createElement('div');
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    row.appendChild(dt);
    row.appendChild(dd);
    riepilogo.appendChild(row);
  }

  var submitBtn = form.querySelector('button[type="submit"]');
  var submitText = submitBtn.textContent;
  var sending = false;

  function setSending(on) {
    sending = on;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Invio in corso…' : submitText;
    form.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function showSendError() {
    summary.innerHTML = 'Non siamo riusciti a inviare la richiesta. Riprovate tra qualche minuto oppure chiamateci allo <a href="tel:+390858579011">085&nbsp;857&nbsp;9011</a>: saremo felici di aiutarvi.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var invalid = rules.filter(function (rule) { return !validateField(rule); });
    if (invalid.length) {
      summary.textContent = invalid.length === 1
        ? 'Controlla il campo evidenziato.'
        : 'Controlla i ' + invalid.length + ' campi evidenziati.';
      document.getElementById(invalid[0].id).focus();
      return;
    }
    summary.textContent = '';

    var data = new FormData(form);
    var email = (data.get('email') || '').trim();
    var msg = (data.get('messaggio') || '').trim();
    var righe = [
      ['Evento', data.get('tipo')],
      ['Data', formatDate(data.get('data'))],
      ['Ospiti', 'circa ' + data.get('ospiti')],
      ['Dove', data.get('luogo') || 'Da decidere insieme'],
      ['Nome', data.get('nome').trim()],
      ['Telefono', data.get('telefono').trim()]
    ];
    if (email) righe.push(['Email', email]);
    if (msg) righe.push(['Messaggio', msg]);

    // Web3Forms inoltra la richiesta alla casella email del ristorante
    var payload = {
      access_key: data.get('access_key'),
      subject: data.get('subject'),
      from_name: data.get('from_name')
    };
    if (data.get('botcheck')) payload.botcheck = true; // campo anti-spam: lo compilano solo i bot
    righe.forEach(function (r) { payload[r[0]] = r[1]; });
    if (email) payload.replyto = email;

    setSending(true);
    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        setSending(false);
        if (!res.success) { showSendError(); return; }

        riepilogo.innerHTML = '';
        righe.forEach(function (r) { addRow(r[0], r[1]); });
        form.hidden = true;
        conferma.hidden = false;
        conferma.focus({ preventScroll: true });
        conferma.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      })
      .catch(function () {
        setSending(false);
        showSendError();
      });
  });

  document.getElementById('nuova-richiesta').addEventListener('click', function () {
    form.reset();
    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      document.getElementById(rule.err).textContent = '';
      input.closest('.field').classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      describedBy(input, rule.err, false);
    });
    conferma.hidden = true;
    form.hidden = false;
    document.getElementById('f-tipo').focus();
  });
})();
