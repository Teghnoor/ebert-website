/* ============================================================
   Google-Kalender-Terminbuchung — Konfiguration

   ⚠️ PLATZHALTER. Hier die echte Buchungsseite eintragen, sonst nirgends.

   So kommt Julien an die Adresse:
     1. calendar.google.com öffnen (kostenloses Konto genügt — es erlaubt
        genau einen Terminplan, für Probeflächen-Termine reicht das)
     2. Links oben "Erstellen" → "Terminplan"
     3. Dauer, Verfügbarkeit und Vorlaufzeit festlegen
     4. Oben "Buchungsseite öffnen" → die Adresse aus der Zeile kopieren
        Sie sieht so aus:
        https://calendar.google.com/calendar/appointments/schedules/AcZssZ...
     5. Hier unten eintragen. Fertig.

   DATENSCHUTZ: Der Kalender wird bewusst ERST NACH einem Klick geladen
   (Zwei-Klick-Lösung). Solange niemand klickt, geht kein einziger Request
   an Google — deshalb braucht die Seite weiterhin kein Cookie-Banner.
   Wird das auf ein direkt geladenes iFrame umgestellt, ist ein
   Einwilligungsbanner Pflicht.
   ============================================================ */

window.EBERT_TERMIN = {
  // TODO Julien: echte Buchungsseite eintragen
  buchungsseite: '',

  // Wird angezeigt, solange oben nichts eingetragen ist
  platzhalter: true
};
