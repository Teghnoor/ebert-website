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
            'Pflaster und Beton haben feine Poren. Über die Jahre setzt sich dort Staub fest, der Regen wäscht ihn ein. So wird aus der ursprünglichen Farbe ein gleichmäßiges Grau. Diesen Schmutz kann man nicht wegkehren. Er sitzt im Stein.',
            'Dazu kommt das Grün. Algen und Moos brauchen nur Feuchtigkeit und etwas Schatten. In den Fugen finden sie beides. Was dort wächst, hält die Nässe im Stein. Der Belag altert dadurch schneller.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Ein Gerät, das den Druck gleichmäßig verteilt',
             'Wer mit einem einfachen Strahl über den Stein geht, hinterlässt Streifen. Wir arbeiten mit einem Gerät, das den Druck gleichmäßig verteilt. So bleiben keine Streifen und keine ausgewaschenen Stellen zurück.'),
            ('Wir stellen den Druck auf Ihren Stein ein',
             'Nicht jeder Stein verträgt gleich viel. Betonpflaster hält mehr aus als Waschbeton, Waschbeton mehr als Naturstein. Wir stellen den Druck für jede Fläche neu ein. Das dauert länger. Dafür bleibt Ihr Stein heil.'),
            ('Fugen spülen und wieder auffüllen',
             'Beim Reinigen löst sich immer etwas Fugenmaterial. Wird es nicht ersetzt, wackeln die Steine schon nach einem Jahr. Wir füllen die Fugen wieder auf. Auf Wunsch mit einem Material, in dem kein Unkraut mehr wächst.'),
            ('Zum Schluss eine Schutzschicht',
             'Die Schutzschicht schließt die Poren im Stein. Wasser perlt ab, Schmutz hält nicht mehr, und das Grün kommt viel später zurück. Darauf geben wir fünf Jahre Garantie.'),
        ],
        'material_titel': 'Diese Beläge reinigen wir',
        'material': ['Betonpflaster und Verbundsteine', 'Waschbeton und Betonplatten',
                     'Natursteinpflaster und Kopfsteinpflaster', 'Asphalt und Teerdecken',
                     'Beton und Estrich', 'Gehwegplatten aller Formate'],
        'faq': [
            ('Wie lange dauert eine Einfahrt?',
             'Eine normale Einfahrt schaffen wir meist an einem Tag, die Fugen inklusive. Kommt eine Schutzschicht dazu, muss die Fläche vorher einen Tag trocknen.'),
            ('Wird der Stein durch den Hochdruck beschädigt?',
             'Nein, wenn der Druck richtig eingestellt ist. Schäden entstehen fast immer, wenn jemand mit einem harten Strahl zu nah an den Stein geht. Genau das machen wir nicht.'),
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
            'Moos sieht nicht nur alt aus. Es hält Wasser fest. Ein bemooster Ziegel trocknet nach Regen viel langsamer. Bei Frost gefriert dieses Wasser im Ziegel und sprengt ihn nach und nach auf. So wird der Ziegel kaputt, lange bevor er alt ist.',
            'Dazu kommt: Was sich vom Dach löst, landet in der Dachrinne. Ist die Rinne verstopft, läuft das Wasser an der Hauswand herunter. Im schlimmsten Fall wird die Mauer feucht. Deshalb reinigen wir immer beides.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Von der Traufe zum First',
             'Wir arbeiten von unten nach oben. So wird kein Wasser unter die Ziegel gedrückt. Genau hier machen unerfahrene Firmen den Fehler, der ein Dach beschädigt.'),
            ('Der Druck passt zu Ihrem Dach',
             'Ein Betonstein hält mehr aus als ein alter Tonziegel. Wir schauen uns Ihr Dach an, bevor wir anfangen. Und wir sagen es Ihnen ehrlich, wenn eine Fläche nicht mehr zu reinigen ist.'),
            ('Die Dachrinne machen wir mit',
             'Nach der Reinigung räumen wir Dachrinne und Fallrohr frei und prüfen, ob das Wasser abläuft. Das kostet nichts extra. Das gehört dazu.'),
            ('Schutz, damit das Moos nicht gleich wiederkommt',
             'Auf Wunsch behandeln wir das saubere Dach nach. Dann kommen Moos und Flechten nicht so schnell zurück. Auch darauf geben wir fünf Jahre Garantie.'),
        ],
        'material_titel': 'Diese Dächer reinigen wir',
        'material': ['Ton- und Betondachziegel', 'Faserzement und Wellplatten (Eternit)',
                     'Blech- und Trapezdächer', 'Carports und Garagendächer',
                     'Terrassenüberdachungen aus Glas oder Kunststoff', 'Wintergärten von außen'],
        'faq': [
            ('Steigen Sie auf jedes Dach?',
             'Auf die meisten. Wenn das Dach es nicht trägt, arbeiten wir vom Gerüst, von einer Hebebühne oder mit einer langen Stange vom Boden aus. Was bei Ihnen geht, sehen wir vor Ort.'),
            ('Ist eine Reinigung besser als eine Neueindeckung?',
             'Fast immer, solange die Ziegel heil sind. Ein neues Dach kostet ein Vielfaches. Wenn Ihr Dach wirklich nicht mehr zu retten ist, sagen wir Ihnen das offen.'),
            ('Was ist mit einer Dachbeschichtung?',
             'Eine Beschichtung ist Farbe auf dem Ziegel. Sie kann sinnvoll sein. Ohne gründliche Reinigung vorher hält sie aber nicht. Wir sagen Ihnen ehrlich, was Ihr Dach braucht.'),
            ('Wie lange dauert ein Einfamilienhaus?',
             'Ein bis zwei Tage, je nach Größe und Verschmutzung. Die Dachrinne ist dabei.'),
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
            'Naturstein ist nicht gleich Naturstein. Marmor und Kalkstein vertragen keine scharfen Mittel. Sandstein ist weich und geht bei zu viel Druck kaputt. Granit hält fast alles aus. Wer alle Steine gleich behandelt, macht die Hälfte davon kaputt.',
            'Eine Terrasse grenzt meist direkt ans Haus. Wasser und Reinigungsmittel dürfen nicht in die Fuge zur Hauswand oder in die Kellerschächte laufen. Das ist eine Frage von Sorgfalt, nicht von Kraft.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Zuerst schauen wir, um welchen Stein es geht',
             'Wir schauen uns Ihren Stein genau an und wählen danach Druck und Mittel. An einer Stelle, die man nicht sieht, testen wir das Ergebnis. Erst dann machen wir weiter.'),
            ('Wenig Druck und Bürste, wo es nötig ist',
             'Bei weichem Sandstein oder Marmor arbeiten wir mit wenig Druck und einer Bürste. Das dauert länger. Dafür bleibt die Oberfläche schön.'),
            ('Kanten und Stufen machen wir von Hand',
             'Treppenkanten und den Übergang zur Hauswand machen wir von Hand nach. Genau dort sieht man später, ob sauber gearbeitet wurde.'),
            ('Eine Schutzschicht, die zu Ihrem Stein passt',
             'Naturstein braucht eine andere Schutzschicht als Beton. Wir nehmen eine, die den Stein atmen lässt.'),
        ],
        'material_titel': 'Diese Beläge reinigen wir',
        'material': ['Marmor und Kalkstein', 'Granit und Basalt', 'Sandstein und Travertin',
                     'Feinsteinzeug und Keramik', 'Betonstein und Terrazzo',
                     'Treppen, Podeste und Eingangsbereiche'],
        'faq': [
            ('Kann Naturstein durch Reinigung stumpf werden?',
             'Ja, wenn das falsche Mittel benutzt wird oder der Druck zu hoch ist. Polierte Steine sind besonders empfindlich. Deshalb prüfen wir vorher und testen an einer verdeckten Stelle.'),
            ('Bekommen Sie Rotweinflecken und Fett heraus?',
             'Meistens ja. Ganz ehrlich: nicht immer vollständig. Öl zieht tief in den Stein ein. Bei der Probefläche sehen Sie, was wirklich geht. Wir versprechen Ihnen nichts, was wir nicht halten können.'),
            ('Wie kommt der Preis zustande?',
             'Das hängt vom Stein und vom Zustand ab. Deshalb kommen wir vorbei und reinigen eine Probefläche. Danach bekommen Sie einen festen Preis, schriftlich.'),
            ('Wie oft sollte man eine Terrasse reinigen?',
             'Ohne Schutzschicht etwa alle zwei bis drei Jahre. Mit Schutzschicht viel seltener.'),
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
            'Die grünen und schwarzen Schleier an der Nordseite und unter den Fenstern sind Algen und Flechten. Sie sitzen auf der Farbe, nicht darunter. Ein neuer Anstrich deckt sie nur zu und kostet ein Vielfaches. Nach zwei bis drei Jahren sieht die Wand wieder genauso aus.',
            'Eine Reinigung entfernt das Grün mit den Wurzeln und legt die alte Farbe frei. Erst wenn die Wand sauber ist, sieht man, ob ein Anstrich überhaupt nötig ist. Meistens ist er es nicht.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Wenig Druck, dafür mehr Zeit',
             'Eine Hauswand reinigt man nicht mit Kraft. Wir tragen ein Mittel auf, lassen es einwirken und spülen dann mit wenig Druck ab. So bleibt der Putz heil.'),
            ('Biologisch abbaubare Mittel',
             'Was an der Wand herunterläuft, landet in Ihrem Beet. Deshalb nehmen wir Mittel, die sich in der Natur abbauen. Empfindliche Pflanzen decken wir ab.'),
            ('Bei Klinker gehen wir anders vor',
             'Klinker ist hart, die Fuge dazwischen nicht. Wer mit vollem Druck darüber geht, spült die Fugen aus. Wir arbeiten so, dass die Fugen heil bleiben.'),
            ('Auf Wunsch mit Schutzschicht',
             'Eine Schutzschicht lässt Wasser abperlen. Das Grün kommt dadurch viel später zurück. Fünf Jahre Garantie, wie immer bei uns.'),
        ],
        'material_titel': 'Diese Fassaden reinigen wir',
        'material': ['Mineralischer und Kunstharzputz', 'Klinker und Verblendmauerwerk',
                     'gedämmte Fassaden', 'Faserzementplatten (Eternit)',
                     'Sichtbeton', 'Sockel und Vordächer'],
        'faq': [
            ('Lohnt sich eine Reinigung gegenüber einem Anstrich?',
             'Ja, deutlich. Ein Anstrich braucht ein Gerüst, Material und mehrere Tage Arbeit. Eine Reinigung braucht davon nur einen Bruchteil. Wie es bei Ihnen aussieht, sagen wir Ihnen nach der Besichtigung.'),
            ('Hält die Reinigung auch bei starkem Befall?',
             'In den allermeisten Fällen ja. Wenn der Putz feucht ist oder abplatzt, liegt das Problem tiefer. Dann sagen wir Ihnen, dass eine Reinigung nicht reicht.'),
            ('Brauchen Sie ein Gerüst?',
             'Meistens nicht. Bis etwa zwölf Meter Höhe arbeiten wir mit einer langen Stange vom Boden aus. Das spart Ihnen das Gerüst.'),
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
        'hero_zeile': 'Einmal sauber, fünf Jahre geschützt.',
        'problem_titel': 'Warum eine Reinigung allein nicht reicht',
        'problem': [
            'Eine frisch gereinigte Fläche ist offen wie am ersten Tag. Genau dann setzt sich neuer Schmutz am leichtesten fest. Ohne Schutzschicht sieht die Fläche nach zwei bis drei Jahren wieder aus wie vorher.',
            'Die Schutzschicht schließt die Poren, aber der Stein kann weiter atmen. Wasser perlt ab, statt einzuziehen. Öl und Schmutz halten nicht mehr. Und Moos braucht viel länger, bis es wiederkommt.',
        ],
        'verfahren_titel': 'Wie wir arbeiten',
        'verfahren': [
            ('Nur auf saubere, trockene Flächen',
             'Wer eine Schutzschicht auf schmutzigen Stein aufträgt, schließt den Schmutz mit ein. Das ist rausgeworfenes Geld. Wir tragen sie frühestens einen Tag nach der Reinigung auf, wenn alles trocken ist.'),
            ('Für jeden Belag das passende Mittel',
             'Beton, Naturstein, Ziegel und Putz brauchen jeweils ein anderes Mittel. Ein Mittel für alles gibt es nicht. Jedenfalls keines, das lange hält.'),
            ('Reichlich auftragen, nicht sparsam',
             'Der Schutz entsteht durch die Menge, die in den Stein einzieht. Wer hier spart, spart an der Haltbarkeit.'),
            ('Fünf Jahre Garantie',
             'Wird dieselbe Fläche innerhalb von fünf Jahren wieder stark schmutzig oder bewachsen, reinigen wir sie kostenlos noch einmal.'),
        ],
        'material_titel': 'Was wir imprägnieren',
        'material': ['Pflaster, Einfahrten und Höfe', 'Terrassen aus Stein und Beton',
                     'Naturstein mit atmendem Schutz', 'Dachflächen nach der Reinigung',
                     'Hauswände und Sockel', 'Treppen und Eingänge'],
        'faq': [
            ('Verändert die Imprägnierung die Optik?',
             'Es gibt matte Mittel, die kaum etwas verändern. Und solche, die den Stein etwas kräftiger wirken lassen. Sie entscheiden. An der Probefläche sehen Sie beides nebeneinander.'),
            ('Wird die Fläche rutschig?',
             'Nicht, wenn das richtige Mittel gewählt wird. Für Treppen und Schrägen nehmen wir Mittel, die rutschfest bleiben.'),
            ('Was deckt die Fünf-Jahres-Garantie ab?',
             'Wird dieselbe Fläche in den fünf Jahren wieder stark schmutzig oder bewachsen, reinigen wir kostenlos nach. Schäden durch Kratzer oder bauliche Mängel gehören nicht dazu.'),
            ('Kann man das später nachholen?',
             'Ja. Die Fläche muss dafür aber noch einmal gereinigt werden. Direkt nach der ersten Reinigung ist es deutlich einfacher.'),
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
          <img src="{x['bild']}" alt="" loading="lazy" width="1200" height="944">
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
      <a href="index.html#probeflaeche">Ablauf</a>
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
      <img src="{s['bild']}" alt="{s['bild_alt']}" fetchpriority="high" width="1200" height="944">
    </div>
    <div class="huelle unter-hero-text">
      <p class="marke-hell">{s['dach']}</p>
      <h1 class="gross-h2">{s['titel']}</h1>
      <p class="lead">{s['hero_zeile']}</p>
      <div class="hero-knoepfe">
        <a class="hero-tel" href="tel:+4916083597840">
          <span class="hero-tel-inhalt" aria-hidden="true">☎</span>
          <span class="hero-tel-inhalt">
            0160 83 59 784
            <span>Rufen Sie uns einfach an</span>
          </span>
        </a>
        <a class="knopf knopf-gross" href="index.html#anfrage">Probefläche anfragen</a>
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
        <h2 class="gross-h2 zeig">So arbeiten wir. Vier Punkte, auf die es ankommt.</h2>
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
          Wir kommen vorbei und reinigen etwa einen Quadratmeter als Probe.
          Sie sehen das Ergebnis bei sich zu Hause. Nicht auf einem Foto
          von jemand anderem.
        </p>
        <ul class="punkte">
          <li>Kostet nichts, auch wenn Sie danach absagen</li>
          <li>Die Anfahrt ist kostenlos</li>
          <li>Sie bekommen danach einen festen Preis</li>
        </ul>
        <p class="nummer-gross" style="margin-bottom:18px"><a href="tel:+4916083597840">0160 83 59 784</a></p>
        <a class="knopf knopf-gross" href="index.html#anfrage">Probefläche anfragen</a>
      </div>
    </div>
  </section>

  <section class="abschnitt grau">
    <div class="huelle schmal">
      <div class="mitte" style="margin-bottom:36px">
        <p class="eyebrow zeig">Häufige Fragen</p>
        <h2 class="gross-h2 zeig">Das werden wir oft gefragt.</h2>
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
      <p class="nummer-gross zeig" style="margin-top:22px"><a href="tel:+4916083597840">0160 83 59 784</a></p>
      <div class="hero-knoepfe zeig" style="justify-content:center;margin-top:24px">
        <a class="knopf knopf-gross" href="tel:+4916083597840">Jetzt anrufen</a>
        <a class="knopf knopf-hell knopf-gross" href="https://wa.me/4916083597840" rel="noopener">Über WhatsApp schreiben</a>
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

<div class="tel-leiste">
  <a class="anrufen" href="tel:+4916083597840">☎ Anrufen</a>
  <a class="whatsapp" href="https://wa.me/4916083597840" rel="noopener">WhatsApp</a>
</div>

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
