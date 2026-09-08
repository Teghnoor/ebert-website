/* Ebert V2 — kein Framework, keine externen Requests. */
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
     Wichtig: nichts darf unsichtbar hängen bleiben. Drei Sicherungen —
     (1) Beobachter, (2) sofort alles zeigen was schon im Bild ist
     (greift beim direkten Sprung auf einen Anker), (3) Not-Timer. */
  function zeigeSichtbare() {
    document.querySelectorAll('.zeig:not(.da)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('da');
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
        setTimeout(function () { e.target.classList.add('da'); }, Math.max(0, pos) * 110);
        beob.unobserve(e.target);
      });
    }, { threshold: 0.02, rootMargin: '0px 0px -4% 0px' });
    document.querySelectorAll('.zeig').forEach(function (el) { beob.observe(el); });

    zeigeSichtbare();
    window.addEventListener('load', zeigeSichtbare);
    window.addEventListener('hashchange', function () { setTimeout(zeigeSichtbare, 60); });
    window.addEventListener('scroll', zeigeSichtbare, { passive: true });
    setTimeout(zeigeSichtbare, 1200);
  } else {
    document.querySelectorAll('.zeig').forEach(function (el) { el.classList.add('da'); });
  }

  /* ================= Statement Wort für Wort ================= */
  document.querySelectorAll('[data-worte]').forEach(function (el) {
    var teile = [].slice.call(el.childNodes);
    el.textContent = '';
    teile.forEach(function (teil) {
      var klasse = teil.nodeType === 1 ? teil.className : '';
      var text = teil.textContent;
      text.split(/(\s+)/).forEach(function (w) {
        if (!w.trim()) { el.appendChild(document.createTextNode(w)); return; }
        var s = document.createElement('span');
        s.className = 'wort' + (klasse ? ' ' + klasse : '');
        s.textContent = w;
        el.appendChild(s);
      });
    });
    var woerter = el.querySelectorAll('.wort');
    if (ruhig || !('IntersectionObserver' in window)) {
      woerter.forEach(function (w) { w.classList.add('da'); });
      return;
    }
    var wb = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        woerter.forEach(function (w, i) {
          setTimeout(function () { w.classList.add('da'); }, i * 90);
        });
        wb.unobserve(e.target);
      });
    }, { threshold: 0.25 });
    wb.observe(el);
    // Sicherung: was nach 1,4 s noch verborgen und im Bild ist, wird gezeigt
    setTimeout(function () {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        woerter.forEach(function (w) { w.classList.add('da'); });
      }
    }, 1400);
  });

  /* ================= Sticky-Flächen ================= */
  var bloecke = document.querySelectorAll('.flaeche-block');
  var flaechenBilder = document.querySelectorAll('.sticky-bild img');
  if (bloecke.length && flaechenBilder.length && 'IntersectionObserver' in window) {
    var fb = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = e.target.dataset.block;
        flaechenBilder.forEach(function (b) { b.classList.toggle('an', b.dataset.flaeche === i); });
      });
    }, { threshold: 0.5 });
    bloecke.forEach(function (b) { fb.observe(b); });
  }

  /* ================= Zahlen hochzählen ================= */
  var zahlen = document.querySelectorAll('[data-zaehl]');
  if (zahlen.length && 'IntersectionObserver' in window) {
    var zb = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var ziel = parseInt(el.dataset.zaehl, 10);
        var suffix = el.dataset.suffix || '';
        if (ruhig) { el.textContent = ziel + suffix; zb.unobserve(el); return; }
        var start = performance.now(), dauer = 1400;
        (function schritt(jetzt) {
          var p = Math.min(1, (jetzt - start) / dauer);
          var e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(ziel * e2) + suffix;
          if (p < 1) requestAnimationFrame(schritt);
        })(start);
        zb.unobserve(el);
      });
    }, { threshold: 0.6 });
    zahlen.forEach(function (z) { zb.observe(z); });
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

  /* ================= Preisrechner ================= */
  var P = window.EBERT_PREISE;
  var regler = document.getElementById('flaeche-regler');
  var flaecheAn = document.getElementById('flaeche-anzeige');
  var preisAn = document.getElementById('preis-anzeige');

  function euro(n) {
    return new Intl.NumberFormat(sprache === 'en' ? 'en-GB' : 'de-DE', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 0
    }).format(n);
  }

  function rechne() {
    if (!P || !regler || !preisAn) return;
    var qm = parseInt(regler.value, 10);
    var leistung = document.querySelector('input[name="leistung"]:checked');
    var satz = P.leistungen[leistung ? leistung.value : 'pflaster'];
    if (!satz) return;

    var faktor = 1;
    P.staffel.forEach(function (s) { if (qm >= s.ab) faktor = s.faktor; });

    var von = satz.von * qm * faktor;
    var bis = satz.bis * qm * faktor;

    document.querySelectorAll('input[name="extra"]:checked').forEach(function (e) {
      var x = P.extras[e.value];
      if (x) { von += x.von * qm * faktor; bis += x.bis * qm * faktor; }
    });

    von = Math.max(P.grundpreis, von);
    bis = Math.max(P.grundpreis * 1.4, bis);

    if (flaecheAn) flaecheAn.textContent = qm + ' m²';
    preisAn.textContent = euro(Math.round(von / 10) * 10) + ' – ' + euro(Math.round(bis / 10) * 10);
  }

  if (regler) {
    regler.addEventListener('input', rechne);
    document.querySelectorAll('input[name="leistung"], input[name="extra"]').forEach(function (i) {
      i.addEventListener('change', rechne);
    });
    document.addEventListener('ebert:lang', rechne);
    rechne();
  }

  /* ================= Termin-Slots ================= */
  var slots = document.getElementById('slots');
  if (slots) {
    var tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    var heute = new Date();
    var gebaut = 0, i = 1;
    while (gebaut < 3 && i < 10) {
      var d = new Date(heute.getTime() + i * 86400000);
      if (d.getDay() !== 0) {
        ['vormittags', 'nachmittags'].forEach(function (zeit) {
          var name = tage[d.getDay() - 1] + ', ' + d.getDate() + '.' + (d.getMonth() + 1) + '. ' + zeit;
          var l = document.createElement('label');
          l.innerHTML = '<input type="radio" name="slot" value="' + name + '"><span>' + name + '</span>';
          slots.appendChild(l);
        });
        gebaut++;
      }
      i++;
    }
    var frei = document.createElement('label');
    frei.innerHTML = '<input type="radio" name="slot" value="egal" checked><span>Zeit egal, ruft mich an</span>';
    slots.appendChild(frei);
  }

  /* ================= Foto-Vorschau ================= */
  var fotoFeld = document.getElementById('f-foto');
  var vorschau = document.getElementById('upload-vorschau');
  var uploadText = document.getElementById('upload-text');
  if (fotoFeld && vorschau) {
    fotoFeld.addEventListener('change', function () {
      vorschau.innerHTML = '';
      var n = fotoFeld.files.length;
      [].slice.call(fotoFeld.files).slice(0, 6).forEach(function (f) {
        if (!f.type.startsWith('image/')) return;
        var img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        img.alt = f.name;
        img.onload = function () { URL.revokeObjectURL(img.src); };
        vorschau.appendChild(img);
      });
      if (uploadText && n) {
        uploadText.textContent = sprache === 'en'
          ? n + ' ' + DYN.fotoHinweis
          : n + ' Foto(s) ausgewählt — bitte per WhatsApp schicken, der Entwurf kann Dateien noch nicht anhängen.';
      }
    });
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

      var slot = form.querySelector('input[name="slot"]:checked');
      var text =
        'Anfrage über die Website\n\n' +
        'Name: ' + name + '\n' +
        'Ort / PLZ: ' + ort + '\n' +
        'Telefon: ' + tel + '\n' +
        'E-Mail: ' + (form.email.value.trim() || '—') + '\n' +
        'Wunschtermin: ' + (slot ? slot.value : '—') + '\n' +
        (preisAn ? 'Rechner-Schätzung: ' + preisAn.textContent + '\n' : '') +
        (fotoFeld && fotoFeld.files.length ? 'Fotos: ' + fotoFeld.files.length + ' (folgen per WhatsApp)\n' : '') +
        '\n' + (form.nachricht.value.trim() || '');

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
