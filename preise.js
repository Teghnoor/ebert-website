/* ============================================================
   PLATZHALTER-PREISE — hier und nur hier ändern.
   Sobald Juliens echte Kalkulation vorliegt, werden diese Zahlen
   ersetzt; der Rechner auf der Startseite stimmt dann automatisch.

   Sätze sind € pro m², als Spanne von/bis.
   Grundpreis = Mindestbetrag pro Auftrag (Anfahrt + Rüstzeit).
   ============================================================ */

window.EBERT_PREISE = {
  // TODO Julien: echte Sätze eintragen
  grundpreis: 180,

  leistungen: {
    pflaster: { von: 3.5, bis: 6.0, name: 'Einfahrt / Gehweg' },
    terrasse: { von: 4.0, bis: 7.0, name: 'Terrasse' },
    dach:     { von: 8.0, bis: 14.0, name: 'Dach' },
    fassade:  { von: 9.0, bis: 16.0, name: 'Fassade' }
  },

  extras: {
    impraegnierung: { von: 3.0, bis: 5.5, name: 'Imprägnierung' },
    verfugung:      { von: 6.0, bis: 11.0, name: 'Neu verfugen' }
  },

  // Ab dieser Fläche sinkt der m²-Satz (Mengenstaffel)
  staffel: [
    { ab: 150, faktor: 0.92 },
    { ab: 300, faktor: 0.85 }
  ]
};
