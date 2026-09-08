#!/usr/bin/env python3
"""Erzeugt die Leistungs-Unterseiten aus einer gemeinsamen Vorlage.

Jede Seite hat denselben Aufbau, aber eigenen Inhalt — Struktur nach dem
Vorbild von dachbeschichtung-profi.de (Services mit je einer Unterseite),
Gestaltung im Apple-Look der Startseite. Durchgehender Aufruf: kostenlose
Probefläche.

    python3 scripts/baue-unterseiten.py
"""

import io
import os
import re

ORDNER = os.path.join(os.path.dirname(__file__), '..')

# ---------------------------------------------------------------- Inhalte
SEITEN = [
    {
        'datei': 'gehwege-einfahrten.html',
        'titel': 'Gehwege &amp; Einfahrten reinigen',
        'seitentitel': 'Gehwege und Einfahrten reinigen in Gießen | Ebert',
        'beschreibung': 'Pflaster, Beton, Waschbeton und Asphalt professionell gereinigt in Gießen und Umgebung. Kostenlose Probefläche, Festpreis, 5 Jahre Garantie auf die Versiegelung.',
        'bild': 'bilder/leistungen/hof.jpg',
        'bild_alt': 'Gereinigte Pflasterfläche vor einem Wohnhaus',
        'dach': 'Leistung',
        'hero_zeile': 'Die Fläche, die jeder Besucher zuerst betritt.',
        'problem_titel': 'Warum Einfahrten grau werden',
        'problem': [
            'Pflaster und Beton sind offenporig. Über die Jahre setzt sich Feinstaub in diese Poren, Regenwasser wäscht ihn ein, und aus der ursprünglichen Farbe wird ein gleichmäßiges Grau. Das ist kein Schmutz, der sich abkehren lässt — er sitzt in der Oberfläche.',
            'Dazu kommt der Grünbelag. Algen und Moos brauchen wenig: Feuchtigkeit, etwas Schatten, eine raue Oberfläche. In den Fugen finden sie beides. Was dort wächst, hält die Nässe im Belag und beschleunigt die Verwitterung von unten.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Rotierender Flächenreiniger statt freier Lanze',
             'Eine frei geführte Lanze hinterlässt Streifen und raut die Oberfläche auf. Wir arbeiten mit einem geschlossenen Flächenreiniger, der den Druck gleichmäßig verteilt — kein Rattermuster, keine ausgewaschenen Stellen.'),
            ('Druck nach Material, nicht nach Zeitplan',
             'Betonpflaster verträgt mehr als Waschbeton, Waschbeton mehr als Naturstein. Wir stellen den Druck pro Fläche ein. Das dauert länger und ist der Grund, warum die Oberfläche danach noch intakt ist.'),
            ('Fugen ausspülen, dann neu verfüllen',
             'Beim Reinigen wird zwangsläufig Fugenmaterial gelöst. Wer das nicht ersetzt, bekommt binnen eines Jahres wackelnde Steine. Wir verfüllen nach — auf Wunsch mit Harzfuge, in der kein Unkraut mehr wächst.'),
            ('Imprägnierung als Abschluss',
             'Die Schutzschicht schließt die Poren. Wasser perlt ab, Schmutz findet keinen Halt, Grünbelag kommt deutlich langsamer zurück. Darauf geben wir fünf Jahre Garantie.'),
        ],
        'material_titel': 'Diese Beläge reinigen wir',
        'material': ['Betonpflaster und Verbundsteine', 'Waschbeton und Betonplatten',
                     'Natursteinpflaster und Kopfsteinpflaster', 'Asphalt und Teerdecken',
                     'Sichtbeton und Estrich', 'Gehwegplatten aller Formate'],
        'faq': [
            ('Wie lange dauert eine Einfahrt?',
             'Eine Einfahrt von 80 bis 120 m² schaffen wir in der Regel an einem Tag, inklusive Verfugung. Kommt eine Imprägnierung dazu, braucht die Fläche vorher einen Tag Trockenzeit.'),
            ('Wird der Stein durch den Hochdruck beschädigt?',
             'Nicht bei richtig eingestelltem Druck und einem Flächenreiniger. Schäden entstehen fast immer durch eine frei geführte Lanze mit zu viel Druck auf zu kleiner Fläche. Genau deshalb arbeiten wir anders.'),
            ('Was passiert mit den Pflanzen am Rand?',
             'Wir decken Beete und empfindliche Bepflanzung ab. Die von uns eingesetzten Mittel sind biologisch abbaubar.'),
            ('Kommt der Grünbelag wieder?',
             'Ohne Imprägnierung nach zwei bis drei Jahren, je nach Lage. Mit Imprägnierung deutlich später — und wenn er innerhalb der fünf Jahre stark zurückkommt, reinigen wir kostenlos nach.'),
        ],
    },
    {
        'datei': 'dach-ueberdachung.html',
        'titel': 'Dach &amp; Überdachung reinigen',
        'seitentitel': 'Dachreinigung und Überdachung in Gießen | Ebert',
        'beschreibung': 'Dachreinigung, Moosentfernung, Carport und Terrassenüberdachung in Gießen und Umgebung. Kostenlose Probefläche, schonendes Verfahren, 5 Jahre Garantie.',
        'bild': 'bilder/leistungen/dach.jpg',
        'bild_alt': 'Ziegeldach, links bemoost, rechts gereinigt',
        'dach': 'Leistung',
        'hero_zeile': 'Moos kostet das Dach Lebensdauer. Nicht Optik.',
        'problem_titel': 'Warum Moos auf dem Dach ein Problem ist',
        'problem': [
            'Moos sieht nicht nur alt aus, es hält Wasser. Ein bemooster Ziegel trocknet nach Regen deutlich langsamer ab. Bei Frost gefriert diese Feuchtigkeit in der Oberfläche und sprengt sie Stück für Stück auf — der Ziegel wird porös, lange bevor er sein Alter erreicht hat.',
            'Dazu kommt der praktische Teil: Was sich vom Dach löst, landet in der Rinne. Verstopfte Rinnen und Einläufe führen zu Wasser an der Fassade und im schlechtesten Fall zu Feuchtigkeit im Mauerwerk. Wir reinigen deshalb immer beides.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Von der Traufe zum First',
             'Wir arbeiten von unten nach oben, damit kein Wasser unter die Ziegel gedrückt wird. Das ist der Punkt, an dem unsachgemäße Dachreinigung tatsächlich Schaden anrichtet.'),
            ('Angepasster Druck je Eindeckung',
             'Ein Betondachstein verträgt mehr als ein alter Tonziegel, Faserzement wieder etwas anderes. Wir prüfen die Eindeckung, bevor wir anfangen — und sagen es Ihnen, wenn eine Fläche nicht mehr reinigungsfähig ist.'),
            ('Rinnen und Einläufe gehören dazu',
             'Nach der Reinigung werden Dachrinnen und Fallrohre geräumt und auf Durchfluss geprüft. Das ist kein Zusatz, sondern Teil der Arbeit.'),
            ('Nachbehandlung gegen Wiederbewuchs',
             'Auf Wunsch behandeln wir die gereinigte Fläche nach, damit Moos und Flechten nicht sofort zurückkommen. Auch hier gilt die Fünf-Jahres-Garantie.'),
        ],
        'material_titel': 'Diese Dächer reinigen wir',
        'material': ['Ton- und Betondachziegel', 'Faserzement und Wellplatten',
                     'Blech- und Trapezdächer', 'Carports und Garagendächer',
                     'Terrassenüberdachungen aus Glas oder Kunststoff', 'Wintergärten von außen'],
        'faq': [
            ('Steigen Sie auf jedes Dach?',
             'Auf die meisten. Wo die Statik oder der Zustand der Eindeckung es nicht zulässt, arbeiten wir vom Gerüst, von der Hebebühne oder mit der Teleskoplanze vom Boden. Was möglich ist, sehen wir bei der Besichtigung.'),
            ('Ist eine Reinigung besser als eine Neueindeckung?',
             'Fast immer — solange die Ziegel intakt sind. Eine Neueindeckung kostet ein Vielfaches. Wenn die Substanz nicht mehr trägt, sagen wir Ihnen das offen, statt eine Reinigung zu verkaufen, die nichts bringt.'),
            ('Was ist mit einer Dachbeschichtung?',
             'Eine Beschichtung ist Farbe auf dem Ziegel. Sie kann sinnvoll sein, ist aber kein Ersatz für eine saubere Vorreinigung — ohne die hält keine Beschichtung. Wir beraten Sie ehrlich, was Ihr Dach braucht.'),
            ('Wie lange dauert ein Einfamilienhaus?',
             'Ein bis zwei Arbeitstage, je nach Fläche, Neigung und Verschmutzungsgrad. Die Rinnenreinigung ist darin enthalten.'),
        ],
    },
    {
        'datei': 'terrasse-naturstein.html',
        'titel': 'Terrasse &amp; Naturstein reinigen',
        'seitentitel': 'Terrassenreinigung und Naturstein in Gießen | Ebert',
        'beschreibung': 'Terrasse, Treppe und Naturstein materialgerecht gereinigt in Gießen. Marmor, Granit, Sandstein, Feinsteinzeug. Kostenlose Probefläche.',
        'bild': 'bilder/leistungen/terrasse.jpg',
        'bild_alt': 'Gereinigte Terrassenfläche mit Naturstein',
        'dach': 'Leistung',
        'hero_zeile': 'Empfindliche Beläge vertragen keinen groben Druck.',
        'problem_titel': 'Warum Naturstein Sonderbehandlung braucht',
        'problem': [
            'Naturstein ist nicht gleich Naturstein. Marmor und Kalkstein reagieren auf säurehaltige Reiniger, Sandstein ist weich und lässt sich mit zu viel Druck regelrecht abtragen, Granit verträgt fast alles. Wer alle Beläge gleich behandelt, ruiniert die Hälfte davon.',
            'Bei Terrassen kommt hinzu, dass sie meist an das Haus grenzen. Was hier an Wasser und Reinigungsmittel anfällt, darf nicht in die Fuge zur Fassade oder in die Kellerlichtschächte laufen. Das ist Handwerk, keine Kraftfrage.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Materialbestimmung vor dem ersten Handgriff',
             'Wir stellen fest, womit wir es zu tun haben, und wählen Druck und Mittel danach. An einer unauffälligen Stelle prüfen wir das Ergebnis, bevor die ganze Fläche drankommt.'),
            ('Niederdruck und Bürste, wo Hochdruck schadet',
             'Bei weichem Sandstein oder verlegtem Marmor arbeiten wir mit Niederdruck und rotierender Bürste. Das dauert länger, erhält aber die Oberfläche.'),
            ('Kanten, Setzstufen und Anschlüsse von Hand',
             'Treppenkanten und der Anschluss zur Fassade werden von Hand nachgearbeitet. Genau dort sieht man später, ob sorgfältig gearbeitet wurde.'),
            ('Schutzimprägnierung passend zum Stein',
             'Für Naturstein gibt es andere Imprägnierungen als für Beton. Wir wählen die, die den Stein atmen lässt, statt ihn zu versiegeln.'),
        ],
        'material_titel': 'Diese Beläge reinigen wir',
        'material': ['Marmor und Kalkstein', 'Granit und Basalt', 'Sandstein und Travertin',
                     'Feinsteinzeug und Keramikplatten', 'Betonwerkstein und Terrazzo',
                     'Treppen, Podeste und Eingangsbereiche'],
        'faq': [
            ('Kann Naturstein durch Reinigung stumpf werden?',
             'Ja — bei falschem Mittel oder zu viel Druck. Polierte Oberflächen reagieren besonders empfindlich auf Säure. Deshalb bestimmen wir das Material vorher und testen an einer verdeckten Stelle.'),
            ('Bekommen Sie Rotweinflecken und Fett heraus?',
             'Meistens ja, aber ehrlich gesagt nicht immer vollständig. Öl zieht in offenporigen Stein tief ein. Bei der Probefläche sehen Sie, was realistisch geht — und wir versprechen Ihnen nichts, was wir nicht halten.'),
            ('Was kostet eine Terrasse?',
             'Das hängt stark vom Material und vom Zustand ab. Deshalb gibt es die kostenlose Probefläche: Sie sehen das Ergebnis und bekommen danach einen Festpreis.'),
            ('Wie oft sollte man eine Terrasse reinigen?',
             'Ohne Imprägnierung etwa alle zwei bis drei Jahre. Mit Schutzschicht deutlich seltener.'),
        ],
    },
    {
        'datei': 'fassadenreinigung.html',
        'titel': 'Fassadenreinigung',
        'seitentitel': 'Fassadenreinigung in Gießen | Ebert Stein- und Fassadenreinigung',
        'beschreibung': 'Fassadenreinigung statt Neuanstrich in Gießen und Umgebung. Putz, Klinker und Verblendung schonend gereinigt. Kostenlose Probefläche.',
        'bild': 'bilder/leistungen/fassade.jpg',
        'bild_alt': 'Fassade während der Reinigung',
        'dach': 'Leistung',
        'hero_zeile': 'Die Alternative zum Neuanstrich — zu einem Bruchteil.',
        'problem_titel': 'Grünbelag ist kein Anstrichproblem',
        'problem': [
            'Die grünen und schwarzen Schleier an Nordseiten und unter Fenstersimsen sind Algen und Flechten. Sie sitzen auf der Farbe, nicht darunter. Ein neuer Anstrich deckt sie zu und kostet ein Vielfaches — nach zwei bis drei Jahren steht dieselbe Fläche wieder da, wo sie war.',
            'Eine Reinigung entfernt den Bewuchs samt Wurzelwerk und legt die ursprüngliche Farbe frei. Erst wenn die Fassade sauber ist, lässt sich überhaupt beurteilen, ob ein Anstrich nötig ist. Meistens ist er es nicht.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Niedriger Druck, längere Einwirkzeit',
             'Fassaden reinigt man nicht mit Kraft, sondern mit Chemie und Zeit. Wir tragen das Mittel auf, lassen es arbeiten und spülen anschließend mit niedrigem Druck ab. So bleibt der Putz unversehrt.'),
            ('Biologisch abbaubare Mittel',
             'Was an der Fassade herunterläuft, landet im Beet. Deshalb setzen wir Mittel ein, die sich abbauen, und decken empfindliche Bepflanzung ab.'),
            ('Klinker und Verblendung mit anderem Ansatz',
             'Klinker ist hart, die Fuge dazwischen nicht. Wer mit vollem Druck über eine Klinkerfassade geht, spült die Fugen aus. Wir arbeiten fugenschonend.'),
            ('Auf Wunsch Schutzbehandlung',
             'Eine Imprägnierung lässt Wasser abperlen und verzögert den erneuten Bewuchs deutlich. Fünf Jahre Garantie, wie bei allen unseren Versiegelungen.'),
        ],
        'material_titel': 'Diese Fassaden reinigen wir',
        'material': ['Mineralischer und Kunstharzputz', 'Klinker und Verblendmauerwerk',
                     'Wärmedämmverbundsysteme', 'Faserzementplatten und Eternit',
                     'Sichtbeton', 'Sockelbereiche und Vordächer'],
        'faq': [
            ('Ist Reinigung wirklich günstiger als ein Anstrich?',
             'Deutlich. Ein Anstrich braucht Gerüst, Vorbereitung, Material und mehrere Arbeitstage. Eine Reinigung braucht davon nur einen Bruchteil. Wie groß der Unterschied bei Ihnen ist, sagen wir Ihnen nach der Besichtigung.'),
            ('Hält die Reinigung auch bei starkem Befall?',
             'In den allermeisten Fällen ja. Bei durchfeuchtetem oder abplatzendem Putz liegt das Problem allerdings tiefer — dann sagen wir Ihnen, dass eine Reinigung nicht reicht.'),
            ('Brauchen Sie ein Gerüst?',
             'Meistens nicht. Bis etwa zwölf Meter arbeiten wir mit Teleskoplanze vom Boden aus. Das spart Ihnen die Gerüstkosten.'),
            ('Wie lange dauert ein Einfamilienhaus?',
             'In der Regel ein bis zwei Tage, abhängig von Fläche und Verschmutzung.'),
        ],
    },
    {
        'datei': 'impraegnierung.html',
        'titel': 'Imprägnierung &amp; Versiegelung',
        'seitentitel': 'Imprägnierung und Versiegelung in Gießen | Ebert',
        'beschreibung': 'Schutzimprägnierung für Pflaster, Terrasse, Dach und Fassade in Gießen. 5 Jahre Garantie auf die Versiegelung. Kostenlose Probefläche.',
        'bild': 'bilder/leistungen/impraegnierung.jpg',
        'bild_alt': 'Aufbringen der Schutzimprägnierung',
        'dach': 'Leistung',
        'hero_zeile': 'Einmal gereinigt, fünf Jahre geschützt.',
        'problem_titel': 'Warum eine Reinigung allein nicht reicht',
        'problem': [
            'Eine frisch gereinigte Fläche ist offen wie am ersten Tag. Genau das ist der Moment, in dem sich neuer Schmutz am leichtesten festsetzt. Ohne Schutzschicht steht dieselbe Fläche nach zwei bis drei Jahren wieder da, wo sie vorher war.',
            'Die Imprägnierung schließt die Poren, ohne den Belag luftdicht zu versiegeln. Wasser perlt ab statt einzuziehen, Öl und Schmutz finden keinen Halt, und Moos braucht deutlich länger, bis es wieder Fuß fasst.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Nur auf saubere und trockene Flächen',
             'Imprägnierung auf ungereinigtem Untergrund schließt den Schmutz mit ein. Das ist Geldverbrennung. Wir tragen sie frühestens einen Tag nach der Reinigung auf, wenn die Fläche durchgetrocknet ist.'),
            ('Passendes Mittel je Belag',
             'Beton, Naturstein, Ziegel und Putz brauchen unterschiedliche Produkte. Ein Universalmittel gibt es nicht — jedenfalls keines, das lange hält.'),
            ('Sättigend auftragen, nicht sparsam',
             'Die Schutzwirkung entsteht durch die Menge, die einzieht. Wer hier spart, spart an der Haltbarkeit.'),
            ('Fünf Jahre Garantie',
             'Wird dieselbe Fläche innerhalb von fünf Jahren wieder stark verschmutzt oder bewachsen, reinigen wir sie kostenlos erneut.'),
        ],
        'material_titel': 'Was wir imprägnieren',
        'material': ['Pflaster, Einfahrten und Hofflächen', 'Terrassen aus Stein und Beton',
                     'Naturstein mit atmungsaktivem Schutz', 'Dachflächen nach der Reinigung',
                     'Fassaden und Sockelbereiche', 'Treppen und Eingänge'],
        'faq': [
            ('Verändert die Imprägnierung die Optik?',
             'Es gibt matte Varianten, die das Aussehen praktisch nicht verändern, und solche mit leichtem Farbvertiefungseffekt, die den Stein satter wirken lassen. Sie entscheiden — an der Probefläche sehen Sie beides.'),
            ('Wird die Fläche rutschig?',
             'Bei richtiger Auswahl nicht. Für Treppen und Gefällestrecken setzen wir rutschhemmende Produkte ein.'),
            ('Was deckt die Fünf-Jahres-Garantie ab?',
             'Kommt es auf derselben Fläche innerhalb der fünf Jahre zu erneuter starker Verschmutzung oder Bewuchs, reinigen wir kostenlos nach. Mechanische Schäden und bauliche Ursachen sind nicht abgedeckt.'),
            ('Kann man das später nachholen?',
             'Ja, aber die Fläche muss dafür erneut gereinigt werden. Direkt im Anschluss an die Erstreinigung ist es deutlich günstiger.'),
        ],
    },
]

# --------------------------------------------------------------- Bausteine
def nav_html(aktiv):
    punkte = ''.join(
        f'<a href="{s["datei"]}"{" class=\"an\"" if s["datei"] == aktiv else ""}>'
        f'{re.sub(r"&amp;", "&", s["titel"])}</a>'
        for s in SEITEN
    )
    return punkte


def seite_html(s):
    andere = [x for x in SEITEN if x['datei'] != s['datei']]
    unter = ''.join(nav_eintrag(x, s['datei']) for x in SEITEN)

    verfahren = ''.join(f'''
          <article class="verfahren-block zeig">
            <span class="verfahren-nr">{i + 1:02d}</span>
            <div>
              <h3>{t}</h3>
              <p>{p}</p>
            </div>
          </article>''' for i, (t, p) in enumerate(s['verfahren']))

    material = ''.join(f'<li>{m}</li>' for m in s['material'])

    faq = ''.join(f'''
        <details class="faq zeig">
          <summary>{f}</summary>
          <p>{a}</p>
        </details>''' for f, a in s['faq'])

    problem = ''.join(f'<p class="lead">{p}</p>' for p in s['problem'])

    weitere = ''.join(f'''
        <a class="weiter-karte zeig" href="{x['datei']}">
          <img src="{x['bild']}" alt="" loading="lazy" width="1600" height="1260">
          <span>{re.sub(r"&amp;", "&", x['titel'])}</span>
        </a>''' for x in andere[:3])

    return f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{s['seitentitel']}</title>
<meta name="description" content="{s['beschreibung']}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/inter-600-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="site.css">
</head>
<body>

<div class="entwurf-fahne">
  ENTWURF für Julien Ebert — nicht veröffentlichen. Bilder, Preise und Bewertungen sind Platzhalter.
</div>

<div class="oben-leiste">
  <div class="huelle-breit oben-inhalt">
    <a href="tel:+4916083597840">☎ 0160 83 59 784</a>
    <a href="mailto:info@fassadenebert.de">✉ info@fassadenebert.de</a>
    <span class="oben-rechts">Gießen und Umgebung · Anfahrt kostenfrei</span>
  </div>
</div>

<header class="kopf" id="kopf">
  <div class="kopf-inhalt">
    <a class="logo" href="index.html">
      <img src="bilder/logo.png" alt="" aria-hidden="true">
      <b>Ebert</b>
    </a>
    <button class="brenner" id="brenner" aria-label="Menü" aria-expanded="false" aria-controls="nav">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav" id="nav">
      <a href="index.html#ueber-uns">Über uns</a>
      <a href="index.html#arbeit">Unsere Arbeit</a>
      <div class="nav-klapp">
        <button type="button" class="nav-klapp-knopf an" aria-expanded="false">Leistungen <span aria-hidden="true">⌄</span></button>
        <div class="nav-klapp-inhalt">
{unter}        </div>
      </div>
      <a href="index.html#preise">Preise</a>
      <a href="index.html#stimmen">Referenzen</a>
      <a href="index.html#anfrage">Kontakt</a>
    </nav>
    <div class="kopf-rechts">
      <a class="knopf knopf-klein" href="index.html#anfrage">Probefläche sichern</a>
      <div class="sprache" role="group" aria-label="Sprache">
        <button type="button" data-lang="de" class="an">DE</button>
        <button type="button" data-lang="en">EN</button>
      </div>
    </div>
  </div>
</header>

<main>

  <section class="unter-hero">
    <div class="unter-hero-bild">
      <img src="{s['bild']}" alt="{s['bild_alt']}" fetchpriority="high" width="1600" height="1260">
    </div>
    <div class="huelle unter-hero-text">
      <p class="marke-hell">{s['dach']}</p>
      <h1 class="gross-h2">{s['titel']}</h1>
      <p class="lead">{s['hero_zeile']}</p>
      <div class="hero-knoepfe">
        <a class="knopf knopf-gross" href="index.html#anfrage">Kostenlose Probefläche anfragen</a>
        <a class="knopf knopf-hell knopf-gross" href="tel:+4916083597840">0160 83 59 784</a>
      </div>
    </div>
  </section>

  <section class="abschnitt">
    <div class="huelle schmal">
      <h2 class="gross-h2 zeig">{s['problem_titel']}</h2>
      <div class="zeig">{problem}</div>
    </div>
  </section>

  <section class="abschnitt grau">
    <div class="huelle">
      <div class="mitte" style="margin-bottom:40px">
        <p class="eyebrow zeig">{s['verfahren_titel']}</p>
        <h2 class="gross-h2 zeig">Vier Punkte, an denen sich Handwerk entscheidet.</h2>
      </div>
      <div class="verfahren">{verfahren}
      </div>
    </div>
  </section>

  <section class="abschnitt">
    <div class="huelle zwei-spalten">
      <div>
        <h2 class="gross-h2 zeig">{s['material_titel']}</h2>
        <ul class="punkte zeig">{material}</ul>
      </div>
      <div class="probe-kasten zeig">
        <p class="eyebrow">Kostenlos und unverbindlich</p>
        <h3>Wir reinigen ein Stück. Sie entscheiden danach.</h3>
        <p>
          Wir kommen vorbei, sehen uns die Fläche an und reinigen einen Quadratmeter
          als Probe. Sie sehen das Ergebnis an Ihrem eigenen Objekt — nicht auf einem
          Foto von jemand anderem.
        </p>
        <ul class="punkte">
          <li>Kostet nichts, auch wenn Sie danach absagen</li>
          <li>Anfahrt im Einsatzgebiet inklusive</li>
          <li>Festpreis-Angebot direkt im Anschluss</li>
        </ul>
        <a class="knopf knopf-gross" href="index.html#anfrage">Probefläche sichern</a>
      </div>
    </div>
  </section>

  <section class="abschnitt grau">
    <div class="huelle schmal">
      <div class="mitte" style="margin-bottom:36px">
        <p class="eyebrow zeig">Häufige Fragen</p>
        <h2 class="gross-h2 zeig">Was Kunden vorher wissen wollen.</h2>
      </div>
{faq}
    </div>
  </section>

  <section class="abschnitt">
    <div class="huelle">
      <div class="mitte" style="margin-bottom:36px">
        <p class="eyebrow zeig">Weitere Leistungen</p>
        <h2 class="gross-h2 zeig">Was wir sonst noch reinigen.</h2>
      </div>
      <div class="weiter-raster">{weitere}
      </div>
    </div>
  </section>

  <section class="abschnitt dunkel mitte">
    <div class="huelle">
      <h2 class="statement zeig">Sehen Sie es<br>an Ihrer eigenen Fläche.</h2>
      <p class="lead zeig" style="margin-top:20px">
        Die Probefläche kostet nichts und dauert eine halbe Stunde.
      </p>
      <div class="hero-knoepfe zeig" style="justify-content:center;margin-top:28px">
        <a class="knopf knopf-gross" href="index.html#anfrage">Termin vereinbaren</a>
        <a class="knopf knopf-hell knopf-gross" href="https://wa.me/4916083597840" rel="noopener">Per WhatsApp</a>
      </div>
    </div>
  </section>

</main>

<footer class="fuss">
  <div class="huelle-breit">
    <div class="fuss-raster">
      <div>
        <h4>Leistungen</h4>
        <ul>
          <li><a href="gehwege-einfahrten.html">Gehwege und Einfahrten</a></li>
          <li><a href="dach-ueberdachung.html">Dach und Überdachung</a></li>
          <li><a href="terrasse-naturstein.html">Terrasse und Naturstein</a></li>
          <li><a href="fassadenreinigung.html">Fassadenreinigung</a></li>
          <li><a href="impraegnierung.html">Imprägnierung</a></li>
        </ul>
      </div>
      <div>
        <h4>Einsatzgebiet</h4>
        <ul>
          <li>Gießen</li>
          <li>Wetzlar und Marburg</li>
          <li>Butzbach und Pohlheim</li>
          <li>Lich, Linden, Buseck</li>
        </ul>
      </div>
      <div>
        <h4>Kontakt</h4>
        <ul>
          <li><a href="tel:+4916083597840">0160 83 59 784</a></li>
          <li><a href="mailto:info@fassadenebert.de">info@fassadenebert.de</a></li>
          <li>Moltkestraße 30, 35390 Gießen</li>
        </ul>
      </div>
      <div>
        <h4>Rechtliches</h4>
        <ul>
          <li><a href="impressum.html">Impressum</a></li>
          <li><a href="datenschutz.html">Datenschutz</a></li>
        </ul>
      </div>
    </div>
    <div class="fuss-unten">
      <span>Copyright © <span id="jahr">2026</span> Ebert Stein- und Fassadenreinigung. Alle Rechte vorbehalten.</span>
      <span>Gießen, Deutschland</span>
    </div>
  </div>
</footer>

<a class="wa-knopf" href="https://wa.me/4916083597840" rel="noopener" aria-label="WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z"/></svg>
</a>

<button class="chat-knopf" id="chat-knopf" aria-label="Chat öffnen" aria-expanded="false" aria-controls="chat">💬</button>

<div class="chat" id="chat" role="dialog" aria-label="Chat mit Ebert">
  <div class="chat-kopf">
    <span class="chat-punkt" aria-hidden="true"></span>
    <span><b>Ebert Assistent</b><small id="chat-status">Antwortet meist sofort</small></span>
    <button class="chat-zu" id="chat-zu" aria-label="Chat schließen">✕</button>
  </div>
  <div class="chat-verlauf" id="chat-verlauf"></div>
  <div class="chat-vorschlaege" id="chat-vorschlaege"></div>
  <form class="chat-eingabe" id="chat-form">
    <input type="text" id="chat-text" placeholder="Frage eingeben …" autocomplete="off" aria-label="Nachricht">
    <button class="chat-senden" type="submit" aria-label="Senden">↑</button>
  </form>
</div>

<script src="i18n.js"></script>\n<script src="i18n-unterseiten.js"></script>
<script src="preise.js"></script>
<script src="site.js"></script>
</body>
</html>
'''


def nav_eintrag(x, aktiv):
    klasse = ' class="an"' if x['datei'] == aktiv else ''
    return f'          <a href="{x["datei"]}"{klasse}>{re.sub(r"&amp;", "&", x["titel"])}</a>\n'


# ------------------------------------------------------------------ Lauf
if __name__ == '__main__':
    for s in SEITEN:
        pfad = os.path.join(ORDNER, s['datei'])
        io.open(pfad, 'w', encoding='utf-8').write(seite_html(s))
        print('geschrieben:', s['datei'])
    print(f'\n{len(SEITEN)} Unterseiten erzeugt.')
