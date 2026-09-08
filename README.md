# Ebert Stein- und Fassadenreinigung — Website-Entwurf

Entwurf für **Julien Ebert**, Gießen. Gebaut von Brandscale als Pitch-Stück —
**nicht veröffentlichen**, solange die offenen Punkte unten nicht geklärt sind.

## Ansehen

```bash
python3 -m http.server 8899      # im Projektordner
open http://localhost:8899
```

## Prüfen

```bash
node scripts/pruefe-seite.mjs
```

Misst am **gerenderten Ergebnis**, nicht am Quelltext: Konsole, externe Requests,
Bilder wirklich geladen, Direktsprung auf jeden Anker, Sprachumschalter lässt keine
Zeile deutsch, Formular-Validierung, Chat, drei Breiten, Seitengewicht — und dazu
die vier Zielgruppen-Prüfungen: **Kontrast ≥ 7,0**, **kein Text unter 17 px**,
**Schaltflächen ≥ 44 px**, **keine Preisangabe**, **nichts startet unsichtbar**.

```bash
node scripts/handy-bild.mjs                 # echter Handy-Screenshot (390 px, mit Geräte-Emulation)
```

⚠️ Ein einfacher `--window-size=390`-Aufruf von Chrome liefert **abgeschnittene**
Bilder, weil das Viewport-Meta ohne Geräte-Emulation nicht greift. Deshalb dieses Skript.

Letzter Lauf: **bestanden, 0 Fehler.**

## Aufbau

Struktur nach dem Vorbild von `dachbeschichtung-profi.de` (Top-Leiste, Leistungen
mit eigener Unterseite je Gewerk). **Durchgehender Aufruf ist die kostenlose
Probefläche** — Hero, eigene Sektion mit vier Schritten, Kasten auf jeder
Unterseite und Abschluss.

## Zielgruppe: Hausbesitzer ab 50

Die Seite ist auf ältere Leser ausgelegt. Das ist keine Geschmacksfrage,
sondern sind Messwerte — das Prüfskript setzt sie durch:

| | Wert |
|---|---|
| Grundschrift | **19 px**, Zeilenabstand **1,7** |
| kleinster Text | **17 px** |
| Kontrast, jeder Fließtext | **≥ 7,0** (WCAG AAA) |
| Schaltflächen | **≥ 44 px** hoch |
| Animationen | **nur unbedenkliche** — siehe unten |
| Preise | **keine** — kein €, kein „pro m²" |
| Telefon | groß im Hero, im Klartext in jedem Aufruf, feste Leiste am Handy |

**Sprache:** kurze Hauptsätze, kein Fachbegriff ohne Erklärung im selben Satz.
Wer Texte ändert, hält sich daran — sonst trägt die Seite ihre Zielgruppe nicht mehr.

### Welche Animation erlaubt ist

Die Trennlinie: **Animiert es das Erscheinen von Inhalt, oder nur das Aussehen
von bereits sichtbarem Inhalt?**

| erlaubt | verboten |
|---|---|
| Element **gleitet** sanft hoch (`transform`), bleibt dabei voll lesbar | Element **blendet ein** (`opacity 0→1`) |
| Zahl **zählt hoch** — Endwert steht am Schluss | Bild **tauscht sich selbst aus** beim Scrollen |
| Bild **zoomt** langsam, ist durchgehend sichtbar | alles, was Inhalt zeitweise unsichtbar macht |
| Aufklappen, Hover, der Vorher/Nachher-Regler | |

`prefers-reduced-motion` schaltet alles ab. Das Prüfskript setzt beides durch:
**nichts startet unsichtbar** (Gruppe 14) und **jede Animation erreicht ihren
Endzustand** (Gruppe 12b).

| Datei | Zweck |
|---|---|
| `index.html` | Startseite — Deutsch steht im HTML |
| `gehwege-einfahrten.html` u. a. | 5 Leistungs-Unterseiten — **nicht von Hand ändern**, sie werden erzeugt |
| `scripts/baue-unterseiten.py` | Inhalte und Vorlage der Unterseiten. Hier ändern, dann neu bauen |
| `scripts/unterseiten_en.py` | englische Fassung der Unterseiten-Texte |
| `i18n-unterseiten.js` | erzeugt — nicht von Hand ändern |
| `site.css` | Design-System. Werte aus `apple.com` gemessen: Body 17/1.47, H2 56px/600, Statement bis 96px/600, Gewicht **immer 600**, Farbe `#1D1D1F` auf Weiß |
| `site.js` | Reveal, Sticky-Bilder, Zähler, Vorher/Nachher, Preisrechner, Chat, Sprachumschalter |
| `i18n.js` | **Englisch.** Schlüssel = der deutsche Text. Fehlt ein Eintrag, bleibt die Zeile deutsch — das Prüfskript listet sie auf |
| `impressum.html`, `datenschutz.html` | § 5 DDG und DSGVO, mit markierten Lücken |

**Kein Framework, kein CDN, keine Cookies.** Schriften liegen lokal in `fonts/` —
die Seite macht keinen einzigen Request an einen fremden Host (vom Prüfskript verifiziert).

## Unterseiten ändern

```bash
python3 scripts/baue-unterseiten.py     # nach jeder Änderung an den Inhalten
```

Inhalte stehen in `scripts/baue-unterseiten.py`, die englische Fassung in
`scripts/unterseiten_en.py`. Beide erzeugen die HTML-Dateien bzw.
`i18n-unterseiten.js` neu — direkte Änderungen an den erzeugten Dateien
gehen beim nächsten Lauf verloren.

## Deutsch ändern

Nur im HTML der Startseite ändern (bei Unterseiten im Generator). Für Englisch den passenden Eintrag in `i18n.js` nachziehen,
sonst bleibt die Zeile deutsch (und fällt im Prüfskript auf).

## Preise

Es stehen **bewusst keine Preise** auf der Seite — weder Rechner noch Beträge.
Der Preis entsteht nach der kostenlosen Probefläche, persönlich.

## ⚠ Offen vor einer Veröffentlichung

1. **Bilder.** Stammen von `fassadenebert.de` und sind KI-erzeugt (Gemini-Wasserzeichen wurde
   weggeschnitten). Es sind **nicht Juliens Objekte**. Vor dem Live-Gang durch eigene Fotos ersetzen —
   die Dateinamen bleiben gleich, es ist ein Kopiervorgang.
2. **Vorher/Nachher.** Braucht zwei Aufnahmen derselben Fläche vom Stativ, Kamera zwischen den
   Aufnahmen nicht bewegen. Das ist der stärkste Beweis, den die Seite tragen kann.
4. **Google-Bewertungen** — es stehen bewusst keine erfundenen drin.
5. **Firmendaten** im Impressum: Rechtsform, USt-IdNr. bzw. § 19-Hinweis, Kammer, Handwerksrolle.
6. **Hosting-Absatz** in der Datenschutzerklärung an den tatsächlichen Hoster anpassen.
7. **WhatsApp-Absatz** in der Datenschutzerklärung ergänzen.
8. **Chat-Anbindung.** `CHAT_ENDPUNKT` in `site.js` auf den n8n-Webhook zeigen lassen.
   Bis dahin antwortet der Chat mit einem klar gekennzeichneten Platzhalter.
8. **Formular** verschickt derzeit über das E-Mail-Programm des Besuchers.
   Für echten Versand einen Endpunkt eintragen.
