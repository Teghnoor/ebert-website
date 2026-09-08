#!/usr/bin/env python3
"""Baut i18n-unterseiten.js aus scripts/unterseiten_en.py."""
import io, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from unterseiten_en import EN

ziel = os.path.join(os.path.dirname(__file__), '..', 'i18n-unterseiten.js')
zeilen = ["/* Englische Fassung der Leistungs-Unterseiten.",
          "   Erzeugt aus scripts/unterseiten_en.py — dort ändern, dann baue-i18n.py laufen lassen.",
          "   Wird von site.js in das Hauptwörterbuch gemischt. */",
          "", "window.EBERT_EN_UNTER = {"]
for de, en in EN.items():
    zeilen.append("  %s: %s," % (json.dumps(de.replace('&amp;', '&'), ensure_ascii=False),
                                 json.dumps(en.replace('&amp;', '&'), ensure_ascii=False)))
zeilen.append("};")
io.open(ziel, 'w', encoding='utf-8').write("\n".join(zeilen) + "\n")
print('i18n-unterseiten.js:', len(EN), 'Einträge')
