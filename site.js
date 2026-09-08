/* Ebert V4 — für Leser ab 50: ruhig, gross, ohne Preise.
   Kein Framework, keine externen Requests, keine Scroll-Animationen. */
(function () {
  'use strict';

  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = Object.assign({}, window.EBERT_EN || {}, window.EBERT_EN_UNTER || {});
  var DYN = window.EBERT_EN_DYN || {};
  var sprache = 'de';

  /* ================= Jahr ================= */
  var jahr = document.getElementById('jahr');
  if (jahr) jahr.textContent = new Date().getFullYear();

  /* ================= Sprache =================
     Deutscher Text bleibt im HTML. Beim Umschalten werden alle
     Textknoten einmal eingesammelt und im EN-Wörterbuch nachgeschlagen. */
  var knoten = [];
  (function sammle(el) {
    var lauf = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var t = p.nodeName;
        if (t === 'SCRIPT' || t === 'STYLE') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-nicht-uebersetzen]')) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n;
    while ((n = lauf.nextNode())) knoten.push({ n: n, de: n.nodeValue });
  })(document.body);

  var attribute = [];
  ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (a) {
    document.querySelectorAll('[' + a + ']').forEach(function (el) {
      var w = el.getAttribute(a);
      if (w && w.trim().length > 1) attribute.push({ el: el, a: a, de: w });
    });
  });

  /* Schlüssel-Normalisierung: mehrzeiliger HTML-Text mit Einrückung wird
     zu einer Zeile, damit er das Wörterbuch trifft. */
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  var EN_NORM = {};
  Object.keys(EN).forEach(function (k) { EN_NORM[norm(k)] = EN[k]; });

  function uebersetze(zu) {
    sprache = zu;
    document.documentElement.lang = zu;
    knoten.forEach(function (k) {
      if (zu === 'de') { k.n.nodeValue = k.de; return; }
      var treffer = EN_NORM[norm(k.de)];
      if (treffer) k.n.nodeValue = treffer;
    });
    attribute.forEach(function (k) {
      k.el.setAttribute(k.a, zu === 'de' ? k.de : (EN_NORM[norm(k.de)] || k.de));
    });
    document.querySelectorAll('.sprache button').forEach(function (b) {
      b.classList.toggle('an', b.dataset.lang === zu);
    });
    try { localStorage.setItem('ebert-lang', zu); } catch (e) {}
    document.dispatchEvent(new CustomEvent('ebert:lang', { detail: zu }));
  }

  document.querySelectorAll('.sprache button').forEach(function (b) {
    b.addEventListener('click', function () { uebersetze(b.dataset.lang); });
  });

  /* ================= Menü ================= */
  var brenner = document.getElementById('brenner');
  var nav = document.getElementById('nav');
  if (brenner && nav) {
    brenner.addEventListener('click', function () {
      var offen = nav.classList.toggle('offen');
      brenner.classList.toggle('auf', offen);
      brenner.setAttribute('aria-expanded', offen ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('offen');
        brenner.classList.remove('auf');
        brenner.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ================= Leistungen-Klappmenü ================= */
  var klappKnopf = document.querySelector('.nav-klapp-knopf');
  var klappInhalt = document.querySelector('.nav-klapp-inhalt');
  if (klappKnopf && klappInhalt) {
    var schmal = function () { return window.matchMedia('(max-width: 740px)').matches; };

    function klappAuf(auf) {
      klappInhalt.classList.toggle('auf', auf);
      klappKnopf.classList.toggle('offen', auf);
      klappKnopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
    }

    klappKnopf.addEventListener('click', function (e) {
      e.stopPropagation();
      klappAuf(!klappInhalt.classList.contains('auf'));
    });

    // Am Rechner öffnet auch das Überfahren mit der Maus
    var klapp = klappKnopf.parentNode;
    klapp.addEventListener('mouseenter', function () { if (!schmal()) klappAuf(true); });
    klapp.addEventListener('mouseleave', function () { if (!schmal()) klappAuf(false); });

    document.addEventListener('click', function (e) {
      if (!klapp.contains(e.target)) klappAuf(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') klappAuf(false);
    });
  }

  /* ================= Kopfleiste ein/aus ================= */
  var kopf = document.getElementById('kopf');
  var letztes = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (kopf && !nav.classList.contains('offen')) {
      kopf.classList.toggle('versteckt', y > letztes && y > 260);
    }
    letztes = y;
  }, { passive: true });

  /* ================= Reveal =================
     V4.1: Der Text ist immer voll lesbar (siehe site.css) — animiert wird
     nur die Position. Trotzdem drei Sicherungen, damit nichts hängen bleibt. */
  function zeigeSichtbare() {
    document.querySelectorAll('.zeig:not(.da)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 80 && r.bottom > -80) el.classList.add('da');
    });
  }

  if ('IntersectionObserver' in window && !ruhig) {
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        var geschwister = [].slice.call(e.target.parentNode.children).filter(function (c) {
          return c.classList.contains('zeig');
        });
        var pos = geschwister.indexOf(e.target);
        setTimeout(function () { e.target.classList.add('da'); }, Math.max(0, pos) * 90);
        beob.unobserve(e.target);
      });
    }, { threshold: 0.02, rootMargin: '0px 0px -3% 0px' });
    document.querySelectorAll('.zeig').forEach(function (el) { beob.observe(el); });

    zeigeSichtbare();
    window.addEventListener('load', zeigeSichtbare);
    window.addEventListener('hashchange', function () { setTimeout(zeigeSichtbare, 60); });
    window.addEventListener('scroll', zeigeSichtbare, { passive: true });
    setTimeout(zeigeSichtbare, 1400);
  } else {
    document.querySelectorAll('.zeig').forEach(function (el) { el.classList.add('da'); });
  }

  /* ================= Zahlen =================
     Zählt beim Eintritt hoch. Unbedenklich: das Element ist durchgehend
     sichtbar, am Ende steht der richtige Wert. Bei "Bewegung reduzieren"
     und ohne Beobachter steht er sofort da. */
  var zahlen = document.querySelectorAll('[data-zaehl]');
  if (!zahlen.length) { /* nichts zu tun */ }
  else if (ruhig || !('IntersectionObserver' in window)) {
    zahlen.forEach(function (el) { el.textContent = el.dataset.zaehl + (el.dataset.suffix || ''); });
  } else {
    zahlen.forEach(function (el) { el.textContent = '0' + (el.dataset.suffix || ''); });
    var zb = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var ziel = parseInt(el.dataset.zaehl, 10);
        var suffix = el.dataset.suffix || '';
        var start = performance.now(), dauer = 1600;
        (function schritt(jetzt) {
          var p = Math.min(1, (jetzt - start) / dauer);
          el.textContent = Math.round(ziel * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(schritt);
        })(start);
        zb.unobserve(el);
      });
    }, { threshold: 0.5 });
    zahlen.forEach(function (z) { zb.observe(z); });
    // Sicherung: nach 3 s steht der Wert auf jeden Fall
    setTimeout(function () {
      zahlen.forEach(function (el) {
        if (el.textContent.replace(/\D/g, '') !== el.dataset.zaehl) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            el.textContent = el.dataset.zaehl + (el.dataset.suffix || '');
          }
        }
      });
    }, 3000);
  }

  /* ================= Vorher/Nachher ================= */
  var schieber = document.getElementById('schieber');
  var oben = document.getElementById('schieber-oben');
  var griff = document.getElementById('schieber-griff');
  if (schieber && oben && griff) {
    var zieht = false;
    function setze(p) {
      p = Math.max(0, Math.min(100, p));
      oben.style.clipPath = 'inset(0 0 0 ' + p + '%)';
      griff.style.left = p + '%';
      schieber.setAttribute('aria-valuenow', Math.round(p));
    }
    function ausEvent(e) {
      var k = schieber.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - k.left;
      setze((x / k.width) * 100);
    }
    schieber.addEventListener('mousedown', function (e) { zieht = true; ausEvent(e); e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (zieht) ausEvent(e); });
    window.addEventListener('mouseup', function () { zieht = false; });
    schieber.addEventListener('touchstart', function (e) { zieht = true; ausEvent(e); }, { passive: true });
    schieber.addEventListener('touchmove', function (e) { if (zieht) ausEvent(e); }, { passive: true });
    window.addEventListener('touchend', function () { zieht = false; });
    schieber.addEventListener('keydown', function (e) {
      var j = parseFloat(schieber.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft') { setze(j - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setze(j + 4); e.preventDefault(); }
      if (e.key === 'Home') { setze(0); e.preventDefault(); }
      if (e.key === 'End') { setze(100); e.preventDefault(); }
    });
    setze(50);
  }

  /* ================= Anfrageformular ================= */
  var form = document.getElementById('anfrage-form');
  var melde = document.getElementById('melde');
  if (form && melde) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var ort = form.ort.value.trim();
      var tel = form.telefon.value.trim();

      if (!name || !ort || !tel) {
        melde.className = 'melde schlecht';
        melde.textContent = sprache === 'en' ? DYN.fehlenFelder
          : 'Bitte Name, Ort und Telefonnummer ausfüllen — mehr brauchen wir nicht.';
        return;
      }

      var text =
        'Anfrage über die Website\n\n' +
        'Name: ' + name + '\n' +
        'Telefon: ' + tel + '\n' +
        'Ort: ' + ort + '\n\n' +
        (form.nachricht.value.trim() || '');

      melde.className = 'melde gut';
      melde.textContent = sprache === 'en' ? DYN.gesendet
        : 'Ihr E-Mail-Programm öffnet sich mit der fertigen Anfrage.';
      window.location.href = 'mailto:info@fassadenebert.de?subject=' +
        encodeURIComponent('Anfrage Probefläche') + '&body=' + encodeURIComponent(text);
    });
  }

  /* ================= Chat (nur Hülle) =================
     TODO: An n8n-Webhook anbinden. Dann `frage()` gegen den Endpunkt
     sprechen lassen statt die Platzhalter-Antwort auszugeben. */
  var CHAT_ENDPUNKT = ''; // z.B. https://n8n.example/webhook/ebert-chat

  var chat = document.getElementById('chat');
  var chatKnopf = document.getElementById('chat-knopf');
  var chatZu = document.getElementById('chat-zu');
  var verlauf = document.getElementById('chat-verlauf');
  var chatForm = document.getElementById('chat-form');
  var chatText = document.getElementById('chat-text');
  var vorschlaegeBox = document.getElementById('chat-vorschlaege');
  var begruesst = false;

  function blase(wer, text) {
    var d = document.createElement('div');
    d.className = 'blase ' + wer;
    d.textContent = text;
    verlauf.appendChild(d);
    verlauf.scrollTop = verlauf.scrollHeight;
    return d;
  }

  function tippt() {
    var d = document.createElement('div');
    d.className = 'tippt';
    d.innerHTML = '<i></i><i></i><i></i>';
    verlauf.appendChild(d);
    verlauf.scrollTop = verlauf.scrollHeight;
    return d;
  }

  function vorschlaege() {
    if (!vorschlaegeBox) return;
    vorschlaegeBox.innerHTML = '';
    var liste = sprache === 'en' ? DYN.vorschlaege
      : ['Was kostet eine Einfahrt?', 'Wie lange dauert das?', 'Ist die Probefläche wirklich gratis?'];
    liste.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = v;
      b.addEventListener('click', function () { frage(v); });
      vorschlaegeBox.appendChild(b);
    });
  }

  function frage(text) {
    blase('ich', text);
    if (vorschlaegeBox) vorschlaegeBox.innerHTML = '';
    var t = tippt();

    if (CHAT_ENDPUNKT) {
      fetch(CHAT_ENDPUNKT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frage: text, sprache: sprache })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) { t.remove(); blase('bot', d.antwort || '…'); })
        .catch(function () { t.remove(); blase('bot', platzhalterAntwort()); });
    } else {
      setTimeout(function () { t.remove(); blase('bot', platzhalterAntwort()); vorschlaege(); }, 900);
    }
  }

  function platzhalterAntwort() {
    return sprache === 'en' ? DYN.chatPlatzhalter
      : '(Entwurf) Hier antwortet der KI-Assistent. Die Anbindung steht noch nicht — '
      + 'für eine echte Antwort bitte 0160 83 59 784 anrufen oder WhatsApp nutzen.';
  }

  function chatAuf(auf) {
    if (!chat) return;
    chat.classList.toggle('auf', auf);
    if (chatKnopf) {
      chatKnopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
      chatKnopf.style.display = auf ? 'none' : 'grid';
    }
    if (auf && !begruesst) {
      begruesst = true;
      setTimeout(function () {
        blase('bot', sprache === 'en' ? DYN.chatBegruessung
          : 'Hallo! Ich beantworte Fragen zur Reinigung von Einfahrten, Gehwegen und Dächern. Worum geht es?');
        vorschlaege();
      }, 400);
    }
    if (auf && chatText) setTimeout(function () { chatText.focus(); }, 380);
  }

  if (chatKnopf) chatKnopf.addEventListener('click', function () { chatAuf(true); });
  if (chatZu) chatZu.addEventListener('click', function () { chatAuf(false); });
  if (chatForm) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = chatText.value.trim();
      if (!t) return;
      chatText.value = '';
      frage(t);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && chat && chat.classList.contains('auf')) chatAuf(false);
  });

  /* ================= Gespeicherte Sprache ================= */
  try {
    var gespeichert = localStorage.getItem('ebert-lang');
    if (gespeichert === 'en') uebersetze('en');
    else if (!gespeichert && (navigator.language || '').slice(0, 2) !== 'de') uebersetze('en');
  } catch (e) {}
})();
