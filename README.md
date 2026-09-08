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
Bilder wirklich geladen und nicht hochskaliert, kein Reveal-Element bleibt unsichtbar
hängen, Direktsprung auf jeden Anker, Sprachumschalter lässt keine Zeile deutsch,
Preisrechner rechnet plausibel, Formular-Validierung, Chat, drei Breiten, Seitengewicht.

Letzter Lauf: **bestanden, 0 Fehler.**

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Startseite — Deutsch steht im HTML |
| `site.css` | Design-System. Werte aus `apple.com` gemessen: Body 17/1.47, H2 56px/600, Statement bis 96px/600, Gewicht **immer 600**, Farbe `#1D1D1F` auf Weiß |
| `site.js` | Reveal, Sticky-Bilder, Zähler, Vorher/Nachher, Preisrechner, Chat, Sprachumschalter |
| `i18n.js` | **Englisch.** Schlüssel = der deutsche Text. Fehlt ein Eintrag, bleibt die Zeile deutsch — das Prüfskript listet sie auf |
| `preise.js` | **Alle Preise an einer Stelle.** Hier ändern, nicht im Rechner |
| `impressum.html`, `datenschutz.html` | § 5 DDG und DSGVO, mit markierten Lücken |

**Kein Framework, kein CDN, keine Cookies.** Schriften liegen lokal in `fonts/` —
die Seite macht keinen einzigen Request an einen fremden Host (vom Prüfskript verifiziert).

## Deutsch ändern

Nur im HTML ändern. Für Englisch den passenden Eintrag in `i18n.js` nachziehen,
sonst bleibt die Zeile deutsch (und fällt im Prüfskript auf).

## Preise ändern

Ausschließlich `preise.js`. Die aktuellen Sätze sind **Platzhalter** —
sie stammen nicht von Julien.

## ⚠ Offen vor einer Veröffentlichung

1. **Bilder.** Stammen von `fassadenebert.de` und sind KI-erzeugt (Gemini-Wasserzeichen wurde
   weggeschnitten). Es sind **nicht Juliens Objekte**. Vor dem Live-Gang durch eigene Fotos ersetzen —
   die Dateinamen bleiben gleich, es ist ein Kopiervorgang.
2. **Vorher/Nachher.** Braucht zwei Aufnahmen derselben Fläche vom Stativ, Kamera zwischen den
   Aufnahmen nicht bewegen. Das ist der stärkste Beweis, den die Seite tragen kann.
3. **Preise** in `preise.js` durch Juliens echte Kalkulation ersetzen.
4. **Google-Bewertungen** — es stehen bewusst keine erfundenen drin.
5. **Firmendaten** im Impressum: Rechtsform, USt-IdNr. bzw. § 19-Hinweis, Kammer, Handwerksrolle.
6. **Hosting-Absatz** in der Datenschutzerklärung an den tatsächlichen Hoster anpassen.
7. **WhatsApp-Absatz** in der Datenschutzerklärung ergänzen.
8. **Chat-Anbindung.** `CHAT_ENDPUNKT` in `site.js` auf den n8n-Webhook zeigen lassen.
   Bis dahin antwortet der Chat mit einem klar gekennzeichneten Platzhalter.
9. **Formular** verschickt derzeit über das E-Mail-Programm des Besuchers. Für echten Versand
   einen Endpunkt eintragen; Foto-Anhänge brauchen dann ebenfalls ein Backend.
