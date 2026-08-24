/* ══════════════════════════════════════════════════════════════════════════
   RISS v1.4.0 — aus einer Mikdash-Baukarte wird eine Zeichnung.

   Gezeichnet wird ausschließlich, was die Maßtabelle der Karte belegt.
   Was dort offen bleibt, erscheint als offen und wird nicht ergänzt.
   Es wird nicht zwischen Einheiten umgerechnet; Maßstab ist die Einheit
   der Quelle. Maße verschiedener Quellenschichten werden nie in denselben
   Maßstab gesetzt, solange die Karte sie nicht gleichsetzt.
   ══════════════════════════════════════════════════════════════════════════ */
var RISS = (function () {
  "use strict";

  var VERSION = "1.4.0";              /* Karten 01–26 · vollständige Kartenprüfung */

  var C = {
    ink: "#070909", night: "#0B0E0E", panel: "#101515",
    ivory: "#F2EAD9", sand: "#D5C6AA", muted: "#A89F8E", faint: "#6F746D",
    stone: "#B8925D", stoneLt: "#D7BD87", bronze: "#8F653D",
    water: "#6E9EAA", waterLt: "#9EC2C7", rambam: "#CFB36D", ramchal: "#C8C4B8",
    danger: "#C96B62", dangerLt: "#D7A09A"
  };
  var HE = "Frank Ruhl Libre, Noto Serif Hebrew, serif";
  var DE = "EB Garamond, Georgia, serif";
  var DIS = "Cormorant Garamond, Georgia, serif";

  /* ── kleine Helfer ── */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" fill="' + (o.fill || C.sand) +
      '" font-family="' + (o.font || DE) + '" font-size="' + (o.size || 11) + '"' +
      (o.anchor ? ' text-anchor="' + o.anchor + '"' : "") +
      (o.italic ? ' font-style="italic"' : "") +
      (o.weight ? ' font-weight="' + o.weight + '"' : "") +
      (o.ls ? ' letter-spacing="' + o.ls + '"' : "") +
      (o.rtl ? ' direction="rtl"' : "") + ">" + esc(s) + "</text>";
  }
  function TR(x, y, s, o) {           /* gedreht, für senkrechte Beschriftung */
    o = o || {};
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" fill="' + (o.fill || C.sand) +
      '" font-family="' + (o.font || DE) + '" font-size="' + (o.size || 11) +
      '" text-anchor="middle" transform="rotate(-90 ' + x.toFixed(1) + " " + y.toFixed(1) + ')">' + esc(s) + "</text>";
  }
  function L(x1, y1, x2, y2, col, w, dash) {
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
      '" stroke="' + (col || C.stone) + '" stroke-width="' + (w || 1) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>";
  }
  function R(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(0, w).toFixed(1) +
      '" height="' + Math.max(0, h).toFixed(1) + '" fill="' + (o.fill || "none") + '"' +
      (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + (o.sw || 1) + '"' : "") +
      (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") +
      (o.rx ? ' rx="' + o.rx + '"' : "") +
      (o.op ? ' opacity="' + o.op + '"' : "") + "/>";
  }
  function dimH(x1, x2, y, label, col, size) {
    col = col || C.stoneLt;
    return L(x1, y, x2, y, col, 1) + L(x1, y - 4, x1, y + 4, col, 1) + L(x2, y - 4, x2, y + 4, col, 1) +
      T((x1 + x2) / 2, y - 7, label, { fill: col, size: size || 10, anchor: "middle" });
  }
  function dimV(y1, y2, x, label, col, size) {
    col = col || C.stoneLt;
    return L(x, y1, x, y2, col, 1) + L(x - 4, y1, x + 4, y1, col, 1) + L(x - 4, y2, x + 4, y2, col, 1) +
      TR(x - 8, (y1 + y2) / 2, label, { fill: col, size: size || 10 });
  }

  /* ── Rahmen: Titelblock, Legende, „nicht gezeichnet“, Maßstab, Nordpfeil ── */
  function shell(card, o) {
    var W = o.W, H = o.H;
    var s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="100%" ' +
      'role="img" aria-labelledby="riss-t riss-d">',
      '<title id="riss-t">' + esc(o.artLabel + " — " + card.title) + "</title>",
      '<desc id="riss-d">' + esc(o.desc || "Zeichnung ausschließlich nach den Maßangaben der Baukarte. Offene Angaben bleiben offen.") + "</desc>",
      "<defs>",
      '<pattern id="rHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<line x1="0" y1="0" x2="0" y2="7" stroke="' + C.danger + '" stroke-width="1.5" opacity=".6"/></pattern>',
      '<pattern id="rHatchQ" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<line x1="0" y1="0" x2="0" y2="8" stroke="' + C.water + '" stroke-width="1.2" opacity=".55"/></pattern>',
      '<linearGradient id="rWall" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + C.stoneLt + '"/><stop offset="1" stop-color="' + C.bronze + '"/></linearGradient>',
      "</defs>",
      R(0, 0, W, H, { fill: C.ink })];

    /* Titelblock */
    s.push(T(46, 44, "Baukarte " + card.nr + " · " + o.artLabel, { fill: C.stoneLt, size: 12 }));
    s.push(L(46, 54, W - 46, 54, C.stone, 1));
    /* Starke hebräische Zeichen steuern die Bidi-Richtung selbst. Ohne SVG-direction
       wächst die Zeile vom linken Satzspiegel nach rechts und wird nicht abgeschnitten. */
    s.push(T(46, 88, card.he, { fill: C.ivory, size: 25, font: HE }));
    s.push(T(46, 112, card.title, { fill: C.stoneLt, size: 15, font: DIS, italic: true }));
    s.push(T(W - 46, 82, o.unitNote || "Maßstab in der Einheit der Quelle · keine Umrechnung", { fill: C.muted, size: 11, anchor: "end" }));
    s.push(T(W - 46, 100, "Gezeichnet wird nur, was die Karte belegt", { fill: C.faint, size: 11, anchor: "end" }));

    s.push(o.body);

    /* Fußleiste */
    var fy = H - 118;
    s.push(L(46, fy - 16, W - 46, fy - 16, C.stone, 1, "2 6"));
    (o.legend || []).forEach(function (it, i) {
      var yy = fy + i * 18;
      s.push(R(46, yy - 8, 16, 9, { fill: it[0], op: ".85" }));
      s.push(T(70, yy, it[1] + " — " + it[2], { fill: C.muted, size: 11 }));
    });
    var nx = Math.round(W * 0.52);
    s.push(T(nx, fy - 2, "NICHT GEZEICHNET", { fill: C.dangerLt, size: 10, ls: "2" }));
    (o.nicht || []).slice(0, 5).forEach(function (z, i) {
      s.push(T(nx, fy + 16 + i * 16, "· " + z, { fill: C.muted, size: 11 }));
    });
    s.push(T(W / 2, H - 22, o.foot || "Schematisch · relative Lage · keine moderne Koordinate · kein Zukunftsbauplan",
      { fill: C.faint, size: 10, anchor: "middle" }));
    s.push("</svg>");
    return s.join("");
  }

  function northArrow(x, y, note) {
    return '<path d="M' + x + " " + (y + 44) + "V" + y + " M" + x + " " + y + "l-7 12 M" + x + " " + y +
      'l7 12" fill="none" stroke="' + C.stoneLt + '" stroke-width="2"/>' +
      T(x, y + 60, "NORD", { fill: C.stoneLt, size: 11, font: DIS, anchor: "middle" }) +
      (note ? T(x, y + 76, note, { fill: C.faint, size: 10, anchor: "middle" }) : "");
  }
  function scaleBar(x, y, px, unit, marks) {
    var o = [R(x, y, px * marks[marks.length - 1], 9, { stroke: C.stone })];
    for (var i = 0; i < marks.length - 1; i += 2) {
      o.push(R(x + px * marks[i], y, px * (marks[i + 1] - marks[i]), 9, { fill: C.stone, op: ".65" }));
    }
    marks.forEach(function (m) { o.push(T(x + px * m, y - 6, String(m), { fill: C.muted, size: 10, anchor: "middle" })); });
    o.push(T(x + px * marks[marks.length - 1] + 12, y + 9, unit, { fill: C.stoneLt, size: 11 }));
    return o.join("");
  }

  /* ── Lesen der Karte ── */
  function strip(h) {
    var d = document.createElement("div");
    d.innerHTML = String(h == null ? "" : h);
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }
  function parse(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var q = function (sel) { var n = doc.querySelector(sel); return n ? strip(n.textContent) : ""; };
    var kick = q(".kicker");
    var m = kick.match(/(?:Baukarte|Karte)\s*(\d+)\s*von\s*(\d+)/i);
    var card = {
      nr: m ? m[1] : "??",
      kicker: kick,
      he: q("#page-title") || q("h1"),
      title: q(".hero-de") || q(".subtitle") || q(".hero .de") || q(".de"),
      lead: q(".lead"),
      rows: [],
      metrics: [].slice.call(doc.querySelectorAll(".metric")).map(function (mt) {
        var value = mt.querySelector(".metric-value,.value");
        var label = mt.querySelector(".metric-label,span");
        return { value: strip(value ? value.textContent : ""), label: strip(label ? label.textContent : "") };
      })
    };
    [].slice.call(doc.querySelectorAll("table")).forEach(function (table) {
      var head = [].slice.call(table.querySelectorAll("thead th")).map(function (th) { return strip(th.textContent); });
      if (!head.length) return;
      function idx(re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; }
      var ib = idx(/^(?:Bauteil|Gegenstand)/i), im = idx(/Originalmaß|^Wert$|^Maß$/i), ie = idx(/^Einheit$/i), ia = idx(/^Achse/i);
      if (ib < 0 || im < 0 || ie < 0 || ia < 0) return;          /* keine Maßtabelle */
      var iq = idx(/^Quelle$/i), is = idx(/Sicherheit|^Schicht$/i), ir = idx(/Bemerkung|Quelle und Aussage|Befund|Zeitstand/i),
          it = idx(/Bauteiltyp|^Typ$/i);
      [].slice.call(table.querySelectorAll("tbody tr")).forEach(function (tr) {
        var c = [].slice.call(tr.querySelectorAll("td")).map(function (td) { return strip(td.textContent); });
        if (!c.length) return;
        var combined = ir >= 0 ? (c[ir] || "") : "";
        card.rows.push({
          bauteil: c[ib] || "", mass: c[im] || "", einheit: c[ie] || "", achse: c[ia] || "",
          quelle: iq >= 0 ? (c[iq] || "") : combined,
          sicherheit: is >= 0 ? (c[is] || "") : "",
          typ: it >= 0 ? (c[it] || "") : "",
          bemerkung: combined
        });
      });
    });
    return card;
  }

  function num(s) {
    var t = String(s == null ? "" : s).trim();
    t = t.replace(/^(?:ca\.|≈|bis\s+ca\.|bis|etwa|rund)\s*/i, "");
    t = t.replace(/\.(?=\d{3}\b)/g, "");          /* Tausenderpunkt */
    t = t.replace(",", ".");
    var m = t.match(/^(\d+(?:\.\d+)?)$/);
    return m ? parseFloat(m[1]) : null;
  }
  function chain(s) {
    if (String(s).indexOf("+") < 0) return null;
    return String(s).split("+").map(function (p) {
      var v = num(p.trim());
      return v == null ? p.trim() : v;
    });
  }
  function offenP(r) {
    return /offen|nicht angegeben|nicht einheitlich|kein Maß|keine Maßzahl/i.test(r.sicherheit + " " + r.mass);
  }
  function amot(r) { return /Amot|אַמָּה|Ammah/i.test(r.einheit); }
  function allText(card) {
    return [card.he, card.title, card.lead].concat(card.rows.map(function (r) {
      return [r.bauteil, r.mass, r.einheit, r.achse, r.typ, r.sicherheit, r.quelle, r.bemerkung].join(" ");
    })).join(" ");
  }
  function firstRow(card, re) {
    for (var i = 0; i < card.rows.length; i++) if (re.test(card.rows[i].bauteil)) return card.rows[i];
    return null;
  }
  function firstNumber(s, fallback) {
    var m = String(s == null ? "" : s).match(/\d+(?:[.,]\d+)?/);
    return m ? parseFloat(m[0].replace(",", ".")) : fallback;
  }
  function rowNumber(card, re, fallback) {
    var r = firstRow(card, re);
    return firstNumber(r && r.mass, fallback);
  }

  /* ── Modell: was ist zu zeichnen? ── */
  function model(card) {
    var g = { rect: null, chains: [], gates: null, opening: null, blocks: [], fremd: [],
              offen: [], rang: [], strecke: [], hoehen: [], einheiten: [], flaechen: [], nr: card.nr };
    card.rows.forEach(function (r) {
      var v = num(r.mass), ch = chain(r.mass);
      var mm = String(r.mass).match(/^\s*([\d.]+)\s*[×x]\s*([\d.]+)\s*$/);
      if (offenP(r)) g.offen.push(r.bauteil + (r.mass && !/^(nicht angegeben|offen)$/i.test(r.mass) ? " (" + r.mass + ")" : ""));

      if (ch) { g.chains.push({ parts: ch, achse: /O–W/.test(r.achse) ? "OW" : "NS",
        richtung: /Ost→West/.test(r.achse) ? "OW" : (/West→Ost/.test(r.achse) ? "WO" : ""),
        quelle: r.quelle, bauteil: r.bauteil }); return; }

      if (v != null && amot(r) && /O–W|Ost/.test(r.achse)) { g.rect = g.rect || {}; if (!g.rect.L) { g.rect.L = v; g.rect.Lq = r.quelle; } return; }
      if (v != null && amot(r) && /N–S|Nord/.test(r.achse)) { g.rect = g.rect || {}; if (!g.rect.B) { g.rect.B = v; g.rect.Bq = r.quelle; } return; }

      if (((/Anzahl/i.test(r.bauteil) && /Tor/i.test(r.bauteil)) || /^Tore?$/i.test(r.bauteil.trim())) && v != null) {
        g.gates = { n: v, verteilung: r.achse + " " + r.bemerkung, quelle: r.quelle }; return;
      }
      if (/Toröffnung/i.test(r.bauteil)) {
        var o = String(r.mass).match(/(\d+)\D+(\d+)/);
        if (o) g.opening = { b: +o[1], h: +o[2], quelle: r.quelle };
        return;
      }
      if (/Öffnungsbreite/i.test(r.bauteil) && v != null) { g.opening = g.opening || { quelle: r.quelle }; g.opening.b = v; return; }
      if (/Öffnungshöhe/i.test(r.bauteil) && v != null) { g.opening = g.opening || { quelle: r.quelle }; g.opening.h = v; return; }
      if (mm) {
        var eigen = /nicht angegeben|nicht genannt|\?/i.test(r.einheit) || /Jechezkel/.test(r.quelle) && !amot(r);
        var rec = { b: num(mm[1]), t: num(mm[2]), n: /[Vv]ier/.test(r.bemerkung) ? 4 : 1,
                    bauteil: r.bauteil, quelle: r.quelle, einheit: r.einheit, bemerkung: r.bemerkung, offen: eigen };
        if (eigen) g.flaechen.push(rec); else if (g.rect) g.blocks.push(rec); else g.flaechen.push(rec);
        return;
      }
      if (v != null && /Tefach|טֶפַח|Etzba|אֶצְבַּע/i.test(r.einheit)) { g.hoehen.push({ v: v, einheit: r.einheit, bauteil: r.bauteil, achse: r.achse, quelle: r.quelle }); return; }
      if (v != null && /^(m|Meter)$/i.test(r.einheit.trim())) { g.strecke.push({ v: v, bauteil: r.bauteil, achse: r.achse, quelle: r.quelle, roh: r.mass }); return; }
      if (v != null && amot(r) && /vertikal|hoch|ACHSE/i.test(r.achse)) { g.hoehen.push({ v: v, einheit: "Amot", bauteil: r.bauteil, achse: r.achse, quelle: r.quelle, strittig: /STRITTIG/i.test(r.achse) }); return; }
      var lose = String(r.mass).match(/(\d+)\s*[A-Za-zÄÖÜäöüß]*\s*[×x]\s*(\d+)/);
      if (lose && !mm && /nicht angegeben|nicht genannt/i.test(r.einheit)) {
        g.fremd.push({ b: +lose[1], t: +lose[2], bauteil: r.bauteil, quelle: r.quelle,
          einheit: r.einheit, bemerkung: r.bemerkung });
        return;
      }
      var rk = String(r.mass).match(/(\d+)\s*[×x]\s*(\d+)\s*=\s*(\d+)/);
      if (rk) {                                   /* z. B. „500 × 6 = 3000 Amot je Seite“ */
        g.flaechen.push({ b: +rk[3], t: +rk[3], n: 1, bauteil: r.bauteil, quelle: r.quelle,
          einheit: r.einheit, bemerkung: r.bemerkung, offen: false, rekon: /rekonstruiert|B ·/i.test(r.sicherheit) });
        return;
      }
      if (v != null && /Kanim/i.test(r.einheit)) { g.einheiten.push({ v: v, einheit: "Kanim", bauteil: r.bauteil, quelle: r.quelle }); return; }
      if (v != null && /Amot|Tefachim|Kaneh/i.test(r.einheit) && /Einheitslänge|Längsachse|Messrohr|Einheit/i.test(r.achse + r.bauteil)) {
        g.einheiten.push({ v: v, einheit: r.einheit, bauteil: r.bauteil, quelle: r.quelle }); return;
      }
      if (/Rang|Relativangabe|nicht mittig|mittig/i.test(r.mass + r.einheit)) { g.rang.push(r); return; }
      if (v != null) g.einheiten.push({ v: v, einheit: r.einheit, bauteil: r.bauteil, quelle: r.quelle });
    });
    return g;
  }

  function typeOf(card, g) {
    var nr = card.nr;
    var text = allText(card);
    if (nr === "04" || (/500 Messruten|חֲמֵשׁ מֵאוֹת קָנִים/i.test(text))) return "visionsbezirk";
    if (nr === "05" || (/Har HaBajit/i.test(text) && /Süd > Ost > Nord > West/i.test(text))) return "referenzberg";
    if (nr === "06" || (/Terumah/i.test(text) && /Priesterabschnitt/i.test(text) && /Levitenabschnitt/i.test(text))) return "terumah";
    if (nr === "07" || (/Anzahl Bergtore/i.test(text) && /S 2/i.test(text))) return "bergtore";
    if (nr === "10" || (/HaAzarah/i.test(text) && /187/i.test(text) && /135/i.test(text))) return "azarah";
    if (nr === "11" || (/Gesamthöhe/i.test(text) && /Chajl.*Ezrat Naschim/i.test(text))) return "hoehenstaffel";
    if (nr === "12" || (/Torhaus, Messlinie/i.test(text) && /Torhaus, Fünfzig/i.test(text))) return "torhaus";
    if (nr === "13" || (/Kernbau · Gesamtlänge/i.test(text) && /Ulam-Vorsprung/i.test(text))) return "haus100";
    if (nr === "14" || (/Ulam · Tiefe/i.test(text) && /Malteriot/i.test(text))) return "ulam";
    if (nr === "15" || (/Heichal · Innenlänge/i.test(text) && /Wandstücke an der Öffnung/i.test(text))) return "heichal";
    if (nr === "16" || (/Kodesch HaKodaschim · Länge/i.test(text) && /הַפֶּתַח שֵׁשׁ/i.test(text))) return "debir";
    /* Karten 19–26 haben bewusst eigene semantische Risse. Ihre Zahlen
       beschreiben Register, Quellenschichten oder Module und dürfen nicht
       durch den allgemeinen Rechteckparser zu einem einzigen Baukörper
       verschmolzen werden. Die Textmerkmale halten die Erkennung auch dann
       stabil, wenn die Kartennummer später ohne führende Null geschrieben ist. */
    if (nr === "19" || (/Hauswand/i.test(text) && /Torzelle/i.test(text) && /Fundament der Seitenkammern/i.test(text))) return "wandregister";
    if (nr === "20" || (/Gizrah|Gizrah/i.test(text) && /Kir HaBinjan|Westfigur/i.test(text))) return "westfigur";
    if (nr === "21" || (/Kammerblock/i.test(text) && /Südblock/i.test(text) && /Geschosszahl/i.test(text))) return "kammerbloecke";
    if (nr === "22" || (/Eckhof/i.test(text) && /vier Ecken|Arba.*Chatzerot/i.test(text))) return "eckhoefe";
    if (nr === "23" || (/Zelllänge/i.test(text) && /Wand zwischen Zellen/i.test(text) && /3 je Seite/i.test(text))) return "torzellen";
    if (nr === "24" || (/Gewölbe unter dem Berg/i.test(text) && /Bodenöffnung/i.test(text))) return "hohlraeume";
    if (nr === "25" || (/Gihon-Quelle/i.test(text) && /Schiloach in den Tagen des Achaz/i.test(text))) return "wasserorte";
    if (nr === "26" || (/Becken und Leitung/i.test(text) && /Verschluss und Umleitung/i.test(text))) return "wasserwerk";
    if (/טְרַקְסִין|Trachsin|Zwischenzone/i.test(text)) return "trennzone";
    if (/הַתָּאִים|Seitenkammern/i.test(text) && /33|drei Geschosse|3 Geschosse/i.test(text)) return "kammern";
    if (g.rect && g.rect.L && g.rect.B) return "grundriss";
    var kaneh = card.rows.some(function (r) { return /Kaneh|Messrohr|Einheitslänge/i.test(r.bauteil + " " + r.achse + " " + r.einheit); });
    if (nr === "03" || (kaneh && !g.flaechen.length)) return "masstab";
    if (g.strecke.length >= 2) return "strecke";
    if (g.gates && g.opening && g.opening.b && g.opening.h) return "tore";
    if (g.flaechen.length) return "flaechen";
    if (g.hoehen.length) return "hoehe";
    return "ort";
  }

  /* ══════════ 1 · Grundriss ══════════ */
  function grundriss(card, g) {
    var W = 1240, H = 950, ml = 230, mr = 250, mt = 240, mb = 250;
    var L0 = g.rect.L, B0 = g.rect.B;
    var s = Math.min((W - ml - mr) / L0, (H - mt - mb) / B0);
    var pw = L0 * s, ph = B0 * s, x0 = (W - pw) / 2, y0 = mt, x1 = x0 + pw, y1 = y0 + ph;
    var A = function (a) { return a * s; };
    var b = [];

    b.push(R(x0, y0, pw, ph, { fill: C.panel }));
    for (var gx = 10; gx < L0; gx += 10) b.push(L(x0 + A(gx), y0, x0 + A(gx), y1, C.stone, 0.4, "1 6"));
    for (var gy = 10; gy < B0; gy += 10) b.push(L(x0, y0 + A(gy), x1, y0 + A(gy), C.stone, 0.4, "1 6"));
    b.push(R(x0, y0, pw, ph, { stroke: "url(#rWall)", sw: 5 }));
    b.push(T(x0 + 10, y0 + 20, "Wandstärke nicht angegeben", { fill: C.faint, size: 10 }));

    g.chains.forEach(function (c) {
      var cur, p;
      if (c.achse === "OW") {
        var oben = c.richtung !== "WO";
        var y = oben ? y0 - 48 : y1 + 48;
        var parts = c.richtung === "OW" ? c.parts.slice().reverse() : c.parts.slice();
        cur = x0;
        for (var i = 0; i < parts.length; i++) {
          p = parts[i];
          var w = typeof p === "number" ? A(p) : A(25);
          if (typeof p === "number") {
            b.push(dimH(cur, cur + w, y, String(p)));
            b.push(L(cur, oben ? y0 : y1, cur, oben ? y0 - 36 : y1 + 36, C.stone, 0.7, "2 5"));
          } else {
            b.push(R(cur, y - 5, w, 10, { fill: "url(#rHatch)", stroke: C.danger }));
            b.push(T(cur + w / 2, y - 10, "Rest offen", { fill: C.dangerLt, size: 10, anchor: "middle" }));
          }
          cur += w;
        }
        b.push(T(x0, oben ? y - 28 : y + 32, c.bauteil + " · " + c.quelle, { fill: C.muted, size: 11 }));
        b.push(T(x1, oben ? y - 28 : y + 32,
          c.richtung === "OW" ? "Leserichtung Ost → West" : (c.richtung === "WO" ? "Leserichtung West → Ost" : "Reihenfolge der Quelle"),
          { fill: C.faint, size: 10, anchor: "end" }));
      } else {
        var links = /Middot/i.test(c.quelle);
        var x = links ? x0 - 66 : x1 + 120;
        cur = y0;
        var summe = c.parts.reduce(function (a, v) { return a + (typeof v === "number" ? v : 0); }, 0);
        for (var j = 0; j < c.parts.length; j++) {
          p = c.parts[j];
          var h = typeof p === "number" ? A(p) : A(B0 - summe);
          if (typeof p === "number") b.push(dimV(cur, cur + h, x, String(p)));
          else {
            b.push(R(x - 5, cur, 10, h, { fill: "url(#rHatch)", stroke: C.danger }));
            b.push(TR(x - 18, cur + h / 2, "Rest " + (B0 - summe) + " offen", { fill: C.dangerLt, size: 10 }));
          }
          cur += h;
        }
        b.push(TR(links ? x - 40 : x + 40, (y0 + y1) / 2, c.bauteil + " · " + c.quelle, { fill: C.muted, size: 11 }));
      }
    });

    b.push(dimH(x0, x1, y1 + 122, L0 + " Ammot · O–W", C.ivory, 13));
    b.push(TR(x0 - 150, (y0 + y1) / 2, B0 + " Ammot · N–S", { fill: C.ivory, size: 13 }));

    var gesetzt = 0;
    if (g.opening) {
      var ob = A(g.opening.b);
      var ostMittig = card.rows.some(function (r) { return /Osttor/i.test(r.bauteil) && /mittig/i.test(r.mass); });
      if (ostMittig) {
        var gy2 = (y0 + y1) / 2 - ob / 2;
        b.push(R(x1 - 3.5, gy2, 7, ob, { fill: C.night, stroke: C.ivory, sw: 2 }));
        b.push(T(x1 + 14, gy2 - 10, "Osttor · mittig", { fill: C.ivory, size: 11 }));
        b.push(T(x1 + 14, gy2 + ob + 18, g.opening.b + " × " + g.opening.h + " Ammot", { fill: C.muted, size: 10 }));
        gesetzt = 1;
      }
    }
    /* Seitenanzahlen sind belegt, die Positionen entlang der Seiten nicht.
       Gestrichelte Marken zeigen daher nur die Verteilung je Himmelsrichtung. */
    if (g.gates) {
      var vt = String(g.gates.verteilung || ""), vn = +(vt.match(/N\s*(\d+)/i) || [0, 0])[1],
          vs = +(vt.match(/S\s*(\d+)/i) || [0, 0])[1], vw = +(vt.match(/W\s*(\d+)/i) || [0, 0])[1],
          vo = +(vt.match(/O\s*(\d+)/i) || [0, 0])[1];
      function markH(n, yy, side) {
        for (var mi = 0; mi < n; mi++) {
          var mx = x0 + pw * (mi + 1) / (n + 1);
          b.push(R(mx - 12, yy - 4, 24, 8, { fill: C.night, stroke: C.waterLt, sw: 1.5, dash: "3 3" }));
        }
        if (n) b.push(T(x0 + pw / 2, yy + (side === "N" ? -12 : 22), side + " · " + n + " Tor" + (n > 1 ? "e" : "") + " · Lage schematisch", { fill: C.waterLt, size: 10, anchor: "middle" }));
      }
      function markV(n, xx, side) {
        for (var mj = 0; mj < n; mj++) {
          var my = y0 + ph * (mj + 1) / (n + 1);
          b.push(R(xx - 4, my - 12, 8, 24, { fill: C.night, stroke: C.waterLt, sw: 1.5, dash: "3 3" }));
        }
        if (n) b.push(TR(xx + (side === "W" ? -18 : 18), y0 + ph / 2, side + " · " + n + " · Lage schematisch", { fill: C.waterLt, size: 10 }));
      }
      markH(vn, y0, "N"); markH(vs, y1, "S"); markV(vw, x0, "W");
      if (!(gesetzt && vo === 1)) markV(vo, x1, "O");
    }
    g.blocks.forEach(function (blk) {
      var bw = A(blk.b), bt = A(blk.t);
      var ecken = [[x0, y0], [x1 - bw, y0], [x0, y1 - bt], [x1 - bw, y1 - bt]].slice(0, blk.n);
      ecken.forEach(function (e) {
        b.push(R(e[0], e[1], bw, bt, { fill: C.night, stroke: C.stoneLt, sw: 2 }));
        b.push(T(e[0] + bw / 2, e[1] + bt / 2 + 4, blk.b + " × " + blk.t, { fill: C.stoneLt, size: 12, anchor: "middle" }));
      });
      b.push(T(x0, y1 + 158, blk.bauteil + ": " + blk.n + " × " + blk.b + " × " + blk.t + " Ammot · " + blk.quelle, { fill: C.muted, size: 11 }));
    });
    g.rang.forEach(function (r, i) {
      b.push(T(x1 + 120, y1 + 40 + i * 16, r.bauteil + ": " + r.mass, { fill: C.rambam, size: 11, anchor: "end" }));
    });
    g.fremd.slice(0, 1).forEach(function (fr) {
      var fw = 210, fs = Math.min(fw / fr.b, 120 / fr.t), fx = 46, fy = mt + 10;
      b.push(R(fx - 12, fy - 34, fw + 24, fr.t * fs + 96, { fill: C.night, stroke: C.water, sw: 1.5, dash: "5 4" }));
      b.push(T(fx, fy - 16, "Eigene Ebene · " + fr.quelle, { fill: C.waterLt, size: 11 }));
      b.push(R(fx, fy, fr.b * fs, fr.t * fs, { fill: "url(#rHatchQ)", stroke: C.water, sw: 2 }));
      b.push(T(fx, fy + fr.t * fs + 20, fr.bauteil + ": " + fr.b + " × " + fr.t, { fill: C.ivory, size: 11 }));
      b.push(T(fx, fy + fr.t * fs + 38, "Einheit nicht angegeben · eigener Maßstab", { fill: C.muted, size: 10 }));
      b.push(T(fx, fy + fr.t * fs + 56, "nicht mit den Maßen oben verrechnet", { fill: C.dangerLt, size: 10 }));
    });

    b.push(northArrow(W - 92, mt + 40, "Ost rechts"));
    b.push(scaleBar(46, y1 + 150, s, "Ammot", [0, 10, 25, 50]));

    var nicht = g.offen.slice();
    if (g.gates && g.gates.n - gesetzt > 0) nicht.unshift((g.gates.n - gesetzt) + " Torpositionen entlang der Seiten — nur schematisch markiert");
    g.rang.forEach(function (r) { nicht.push(r.bauteil + " — nur Rangaussage, keine Strecke"); });

    return shell(card, {
      W: W, H: H, artLabel: "Grundriss", body: b.join(""),
      unitNote: "Maßstab in Ammot · keine Umrechnung in Meter",
      legend: [[C.ivory, "durchgezogen", "Maß in der Karte belegt"],
               [C.danger, "schraffiert", "in der Karte als offen ausgewiesen"],
               [C.water, "eigene Ebene", "andere Quellenschicht, nicht verrechnet"]],
      nicht: nicht
    });
  }

  /* ══════════ 2 · Maßstabsleiter (Einheiten) ══════════ */
  function masstab(card, g) {
    var W = 1240, H = 820, b = [];
    var x0 = 120, y = 230, px = 150;              /* px je Ammah */
    b.push(T(x0, y - 46, "Verhältnisse, nicht Längen — die Karte nennt ausdrücklich keine cm-Umrechnung",
      { fill: C.muted, size: 12, italic: true }));

    /* Kaneh = 6 Amot */
    var kw = px * 6;
    b.push(R(x0, y, kw, 34, { fill: C.panel, stroke: C.stoneLt, sw: 2 }));
    for (var i = 1; i < 6; i++) b.push(L(x0 + px * i, y, x0 + px * i, y + 34, C.stone, 1));
    for (var j = 0; j < 6; j++) b.push(T(x0 + px * j + px / 2, y + 22, "Ammah", { fill: C.stoneLt, size: 12, anchor: "middle" }));
    b.push(dimH(x0, x0 + kw, y - 14, "1 Kaneh = 6 Ammot · Jechezkel 40:5", C.ivory, 13));

    /* Vision-Ammah = 6 Tefachim, Geräte-Ammah = 5 Tefachim */
    var y2 = y + 110, tw = px / 6;
    b.push(T(x0, y2 - 16, "Vision-Ammah · sechs Tefachim", { fill: C.stoneLt, size: 12 }));
    b.push(R(x0, y2, px, 30, { fill: C.panel, stroke: C.rambam, sw: 2 }));
    for (var t = 1; t < 6; t++) b.push(L(x0 + tw * t, y2, x0 + tw * t, y2 + 30, C.rambam, 1));
    b.push(dimH(x0, x0 + px, y2 + 52, "6 Tefachim", C.rambam, 11));

    var x2 = x0 + px + 120;
    b.push(T(x2, y2 - 16, "Geräte-Ammah · fünf Tefachim", { fill: C.muted, size: 12 }));
    b.push(R(x2, y2, tw * 5, 30, { fill: C.panel, stroke: C.muted, sw: 2 }));
    for (var t2 = 1; t2 < 5; t2++) b.push(L(x2 + tw * t2, y2, x2 + tw * t2, y2 + 30, C.muted, 1));
    b.push(dimH(x2, x2 + tw * 5, y2 + 52, "5 Tefachim", C.muted, 11));
    b.push(R(x2 + tw * 5, y2, tw, 30, { fill: "url(#rHatchQ)", stroke: C.water, dash: "3 3" }));
    b.push(T(x2 + tw * 5 + tw + 14, y2 + 20, "das eine Tefach Unterschied · Keilim 17:10", { fill: C.waterLt, size: 11 }));

    /* Gesamtsumme */
    b.push(T(x0, y2 + 110, "1 Kaneh = 6 Ammot = 36 Tefachim", { fill: C.ivory, size: 16, font: DIS }));
    b.push(T(x0, y2 + 134, "Die Karte rechnet nicht weiter: keine Länge einer Ammah in cm, keine Etzba-Kette.",
      { fill: C.muted, size: 11 }));

    /* Außenmauer: Querschnitt 1 Kaneh × 1 Kaneh */
    var mx = x0 + 700, my = y2 - 30, mS = 130;
    b.push(T(mx, my - 20, "Außenmauer · Querschnitt", { fill: C.stoneLt, size: 12 }));
    b.push(R(mx, my, mS, mS, { fill: C.panel, stroke: "url(#rWall)", sw: 4 }));
    b.push(dimH(mx, mx + mS, my - 6, "1 Kaneh", C.stoneLt, 11));
    b.push(dimV(my, my + mS, mx - 10, "1 Kaneh", C.stoneLt, 11));
    b.push(T(mx, my + mS + 24, "Dicke und Höhe je ein Kaneh · Jechezkel 40:5", { fill: C.muted, size: 11 }));

    return shell(card, {
      W: W, H: H, artLabel: "Maßstabsleiter", body: b.join(""),
      unitNote: "Verhältnisdarstellung · keine absolute Länge",
      legend: [[C.stoneLt, "Ammah / Kaneh", "Maß der Vision, sechs Tefachim"],
               [C.muted, "Geräte-Ammah", "fünf Tefachim, zum Vergleich"],
               [C.water, "Unterschied", "das eine Tefach nach Keilim 17:10"]],
      nicht: ["Umrechnung in cm oder m", "Etzba-Unterteilung", "Bauteile außer der Außenmauer"],
      foot: "Einheitendefinition · keine absolute Skala · kein Bauplan"
    });
  }

  /* ══════════ 3 · Flächenvergleich ══════════ */
  function flaechen(card, g) {
    var W = 1240, H = 980, b = [];
    var recs = g.flaechen.slice(0, 6);
    var groups = {}, order = [];
    recs.forEach(function (r) {
      var u = /Amot|אַמָּה/i.test(r.einheit) ? "Amot" : "offen";
      var mag = Math.floor(Math.log(Math.max(r.b, r.t)) / Math.LN10);
      var k = u + "·" + mag;
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(r);
    });

    if (g.einheiten.length) {
      b.push(T(70, 168, "Ausdrücklich genannte Einheiten dieser Karte", { fill: C.stoneLt, size: 12 }));
      g.einheiten.slice(0, 3).forEach(function (e, i) {
        b.push(T(70 + i * 340, 190, "· " + e.bauteil + ": " + e.v + " " + e.einheit, { fill: C.muted, size: 11 }));
      });
    }

    var colW = (W - 140) / order.length, oy = 300, boxH = 420;
    order.forEach(function (k, ki) {
      var list = groups[k], inAmot = k.indexOf("Amot") === 0;
      var gap = 14;
      var maxB = Math.max.apply(null, list.map(function (r) { return r.b; }));
      var sumT = list.reduce(function (a, r) { return a + r.t; }, 0);
      var boxW = colW - 90;
      var sc = Math.min(boxW / maxB, (boxH - gap * (list.length - 1)) / sumT);
      var ox = 70 + ki * colW, cy = oy;

      b.push(T(ox, oy - 48, inAmot ? "Maße in Ammot" : "Zahlen ohne genannte Einheit",
        { fill: inAmot ? C.stoneLt : C.dangerLt, size: 13 }));
      b.push(T(ox, oy - 28, inAmot ? (list[0].rekon ? "aus dem Messrohr errechnet · Schicht B" : "im Text ausdrücklich genannt")
        : "die Quelle nennt kein Einheitswort", { fill: C.muted, size: 11 }));

      list.forEach(function (r) {
        var w = r.b * sc, h = Math.max(r.t * sc, 14);
        var col = inAmot ? (r.rekon ? C.rambam : C.stoneLt) : C.water;
        b.push(R(ox, cy, w, h, { fill: C.panel, stroke: col, sw: 2, dash: inAmot && !r.rekon ? "" : "6 4" }));
        b.push(T(ox + 10, cy + Math.min(h / 2 + 5, h - 6), r.bauteil, { fill: C.ivory, size: 12 }));
        b.push(T(ox + w - 10, cy + Math.min(h / 2 + 5, h - 6),
          r.b + " × " + r.t + (inAmot ? " Ammot" : " ?"), { fill: col, size: 11, anchor: "end" }));
        cy += h + gap;
      });
      b.push(L(ox, oy + boxH + 24, ox + boxW, oy + boxH + 24, C.stone, 1, "2 6"));
      b.push(T(ox, oy + boxH + 46, list.map(function (r) { return r.quelle; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(" · "),
        { fill: C.faint, size: 10 }));
      if (!inAmot) {
        b.push(R(ox, oy + boxH + 60, boxW, 32, { fill: "url(#rHatch)", stroke: C.danger, op: ".9" }));
        b.push(T(ox + 12, oy + boxH + 81, "Einheit nicht genannt · eigener Maßstab", { fill: C.ivory, size: 11 }));
      }
      if (ki) {
        var tx = ox - 46;
        b.push(L(tx, 250, tx, oy + boxH + 100, C.danger, 1.5, "6 6"));
        b.push(TR(tx - 12, (250 + oy + boxH + 100) / 2, "getrennte Ebenen · keine Gleichsetzung", { fill: C.dangerLt, size: 11 }));
      }
    });

    return shell(card, {
      W: W, H: H, artLabel: "Flächenvergleich", body: b.join(""),
      unitNote: "Relative Proportion · Einheiten nur, wo die Quelle sie nennt",
      legend: [[C.stoneLt, "Ammot", "Einheit im Text genannt"],
               [C.rambam, "errechnet", "aus einer Angabe der Karte abgeleitet"],
               [C.water, "ohne Einheit", "Zahl belegt, Einheit nicht genannt"]],
      nicht: g.offen.concat(["Umrechnung zwischen den Ebenen", "absolute Größe in Metern"]),
      foot: "Flächenvergleich · relative Proportion · keine Gleichsetzung der Einheiten"
    });
  }

  /* ══════════ 4 · Höhen- und Schwellenschema ══════════ */
  function hoehe(card, g) {
    var W = 1240, H = 880, b = [];
    var base = 640, x = 150;
    b.push(L(80, base, W - 80, base, C.stone, 2));
    b.push(T(80, base - 10, "Bodenlinie · Bezug der Karte", { fill: C.faint, size: 10 }));

    /* Skalen je Einheit getrennt */
    var perU = { "Tefachim": 26, "Amot": 26, "Etzba’ot": 46, "Etzbaot": 46 };
    g.hoehen.forEach(function (h, i) {
      var unit = /Tefach/i.test(h.einheit) ? "Tefachim" : (/Etzba/i.test(h.einheit) ? "Etzba’ot" : "Amot");
      var px = perU[unit] || 26;
      var hh = Math.min(h.v * px, 400);
      var w = 120;
      b.push(R(x, base - hh, w, hh, { fill: C.panel, stroke: h.strittig ? C.danger : "url(#rWall)", sw: 3, dash: h.strittig ? "6 4" : "" }));
      b.push(dimV(base - hh, base, x - 14, h.v + " " + unit, h.strittig ? C.dangerLt : C.stoneLt, 12));
      b.push(T(x + w / 2, base + 22, h.bauteil, { fill: C.ivory, size: 12, anchor: "middle" }));
      b.push(T(x + w / 2, base + 38, h.quelle, { fill: C.faint, size: 10, anchor: "middle" }));
      if (h.strittig) {
        b.push(T(x + w + 20, base - hh - 16, "Achse strittig: der Wortlaut sagt „hoch“", { fill: C.dangerLt, size: 11 }));
        /* zweite Lesung: dieselbe Zahl waagrecht */
        var wx = x + w + 20, wy = base - 40;
        b.push(R(wx, wy, h.v * px, 40, { fill: "none", stroke: C.danger, sw: 2, dash: "5 5" }));
        b.push(dimH(wx, wx + h.v * px, wy - 8, h.v + " " + unit + " als Breite gelesen", C.dangerLt, 11));
        b.push(T(wx, wy + 58, "Beide Lesungen stehen nebeneinander; die Karte entscheidet nicht.", { fill: C.muted, size: 11 }));
      }
      if (i < g.hoehen.length - 1) {
        var dx = x + w + (h.strittig ? h.v * px + 45 : 75);
        b.push(L(dx, base - 420, dx, base + 10, C.danger, 1.2, "6 6"));
        b.push(TR(dx - 12, base - 210, "getrennte Einheiten · Höhen nicht vergleichbar", { fill: C.dangerLt, size: 10 }));
      }
      x += w + (h.strittig ? h.v * px + 90 : 150);
    });

    /* Breschen, falls die Karte eine Anzahl nennt */
    var br = card.rows.filter(function (r) { return /Breschen/i.test(r.bauteil); })[0];
    if (br) {
      var n = num(br.mass) || 0, bx = 150, bw = 260;
      b.push(T(bx, 250, br.bauteil + " · " + n + " Stück · " + br.quelle, { fill: C.stoneLt, size: 12 }));
      b.push(L(bx, 280, bx + bw, 280, C.stoneLt, 2));
      for (var i2 = 0; i2 < n; i2++) {
        var px2 = bx + (bw / n) * (i2 + 0.5);
        b.push(L(px2, 272, px2, 288, C.night, 4));
        b.push(L(px2, 272, px2, 288, C.danger, 1.5));
      }
      b.push(T(bx, 306, "Anzahl belegt · Lage und Breite der Breschen nicht angegeben", { fill: C.muted, size: 11 }));
    }
    /* offene Grundfläche, z. B. Even HaSchtijah */
    var gf = card.rows.filter(function (r) { return /Grundfläche|Lage/i.test(r.bauteil) && offenP(r); })[0];
    if (gf) {
      var fx = W - 420, fy = 250;
      b.push(T(fx, fy - 16, gf.bauteil + " · " + gf.quelle, { fill: C.stoneLt, size: 12 }));
      b.push(R(fx, fy, 260, 150, { fill: "url(#rHatch)", stroke: C.danger, dash: "6 5", sw: 1.5 }));
      b.push(T(fx + 130, fy + 80, "nicht überliefert", { fill: C.ivory, size: 13, anchor: "middle" }));
      b.push(T(fx, fy + 176, gf.bemerkung, { fill: C.muted, size: 11 }));
    }

    return shell(card, {
      W: W, H: H, artLabel: "Höhenschema", body: b.join(""),
      unitNote: "Höhen in der Einheit der Quelle · Tefachim und Ammot nicht ineinander umgerechnet",
      legend: [[C.stoneLt, "durchgezogen", "Maß und Achse belegt"],
               [C.danger, "gestrichelt", "Achse oder Maß in der Karte strittig oder offen"],
               [C.water, "eigene Ebene", "andere Quellenschicht"]],
      nicht: g.offen,
      foot: "Höhenschema · Einheiten getrennt · keine Umrechnung · kein Zukunftsbauplan"
    });
  }

  /* ══════════ 5 · Torschema ══════════ */
  function tore(card, g) {
    var W = 1240, H = 900, b = [];
    /* Aufriss der lichten Öffnung, maßstäblich */
    var px = 13, ow = g.opening.b * px, oh = g.opening.h * px;
    var ax = 150, ay = 620;
    b.push(T(ax, 220, "Lichte Öffnung · maßstäblich", { fill: C.stoneLt, size: 13 }));
    b.push(T(ax, 240, g.opening.quelle, { fill: C.faint, size: 10 }));
    b.push(R(ax - 30, ay - oh - 40, ow + 60, oh + 40, { fill: C.panel, stroke: "url(#rWall)", sw: 4 }));
    b.push(R(ax, ay - oh, ow, oh, { fill: C.night, stroke: C.ivory, sw: 2 }));
    b.push(L(ax - 60, ay, ax + ow + 90, ay, C.stone, 2));
    b.push(dimH(ax, ax + ow, ay - oh - 54, g.opening.b + " Ammot breit", C.ivory, 12));
    b.push(dimV(ay - oh, ay, ax - 46, g.opening.h + " Ammot hoch", C.ivory, 12));
    b.push(T(ax, ay + 24, "Türflügel belegt · Zahl und Maße nicht angegeben", { fill: C.muted, size: 11 }));

    /* Verteilung am Bezugsbezirk */
    var sx = 700, sy = 300, ss = 380;
    b.push(T(sx, sy - 40, "Verteilung der " + g.gates.n + " Tore", { fill: C.stoneLt, size: 13 }));
    b.push(T(sx, sy - 22, "Bezugsfläche schematisch — ihr Maß steht auf einer eigenen Karte", { fill: C.faint, size: 10 }));
    b.push(R(sx, sy, ss, ss, { fill: C.panel, stroke: C.stone, sw: 2, dash: "7 6" }));
    var verteilung = String(g.gates.verteilung);
    var sides = [
      { k: "W", n: (verteilung.match(/W\s*(\d)/) || [])[1], x: sx, y: sy + ss / 2, dx: -1, dy: 0 },
      { k: "O", n: (verteilung.match(/O\s*(\d)/) || [])[1], x: sx + ss, y: sy + ss / 2, dx: 1, dy: 0 },
      { k: "N", n: (verteilung.match(/N\s*(\d)/) || [])[1], x: sx + ss / 2, y: sy, dx: 0, dy: -1 },
      { k: "S", n: (verteilung.match(/S\s*(\d)/) || [])[1], x: sx + ss / 2, y: sy + ss, dx: 0, dy: 1 }
    ];
    var gesamt = 0;
    sides.forEach(function (s2) {
      var n = parseInt(s2.n || "0", 10); gesamt += n;
      var lab = s2.k + " · " + (n || "–") + (n ? (n === 1 ? " Tor" : " Tore") : "");
      b.push(T(s2.x + s2.dx * 52, s2.y + s2.dy * 46 + 4, lab, { fill: n ? C.ivory : C.faint, size: 12, anchor: "middle" }));
      for (var i = 0; i < n; i++) {
        var off = (i - (n - 1) / 2) * 60;
        var mxp = s2.x + (s2.dx ? 0 : off), myp = s2.y + (s2.dy ? 0 : off);
        b.push(R(mxp - (s2.dx ? 4 : 16), myp - (s2.dy ? 4 : 16), s2.dx ? 8 : 32, s2.dy ? 8 : 32,
          { fill: C.night, stroke: C.stoneLt, sw: 2, dash: "3 3" }));
      }
    });
    b.push(T(sx + ss / 2, sy + ss / 2 - 8, "Lage der Tore", { fill: C.dangerLt, size: 13, anchor: "middle" }));
    b.push(T(sx + ss / 2, sy + ss / 2 + 12, "an der Seite nicht angegeben", { fill: C.dangerLt, size: 13, anchor: "middle" }));
    b.push(T(sx, sy + ss + 46, "Anzahl je Seite belegt · " + g.gates.quelle, { fill: C.muted, size: 11 }));
    b.push(northArrow(W - 92, 240, "Ost rechts"));
    b.push(scaleBar(150, 700, px, "Ammot", [0, 5, 10, 20]));

    var sturz = card.rows.filter(function (r) { return /Sturz|Tadi/i.test(r.bauteil); })[0];
    if (sturz) {
      b.push(T(700, 700, "Ausnahme " + sturz.bauteil + ": " + sturz.mass, { fill: C.rambam, size: 11 }));
      b.push(T(700, 718, sturz.bemerkung, { fill: C.muted, size: 10 }));
    }

    return shell(card, {
      W: W, H: H, artLabel: "Torschema", body: b.join(""),
      unitNote: "Öffnung maßstäblich in Ammot · Verteilung schematisch",
      legend: [[C.ivory, "durchgezogen", "Maß belegt"],
               [C.stoneLt, "gestrichelte Marke", "Tor belegt, Lage nicht angegeben"],
               [C.danger, "roter Vermerk", "in der Karte ausdrücklich offen"]],
      nicht: g.offen.concat(["Abstände der Tore zueinander", "Mauerstärke und Durchgangstiefe"]),
      foot: "Torschema · Öffnung maßstäblich · Lage nicht behauptet"
    });
  }

  /* ══════════ 6 · Streckenschema ══════════ */
  function strecke(card, g) {
    var W = 1240, H = 900, b = [];
    var laenge = g.strecke.filter(function (s) { return /Länge|Straße|Aufstieg/i.test(s.bauteil) || /S–N|Längs/i.test(s.achse); })[0] || g.strecke[0];
    var quer = g.strecke.filter(function (s) { return /quer/i.test(s.achse); });
    var top = 220, bot = 700, px = (bot - top) / laenge.v;      /* px je Meter, Längsachse */
    var cx = 330;
    var breitPx = 3.0;                                          /* eigene Skala für die Breite */
    var regel = quer[0] ? quer[0].v : 8, weit = quer[1] ? quer[1].v : regel;

    b.push(R(cx - regel * breitPx / 2, top, regel * breitPx, bot - top, { fill: C.panel, stroke: "url(#rWall)", sw: 3 }));
    /* südliche Aufweitung nur im unteren Abschnitt, ohne Längenangabe → gestrichelt */
    if (weit > regel) {
      var wh = 90;
      b.push(R(cx - weit * breitPx / 2, bot - wh, weit * breitPx, wh, { fill: "none", stroke: C.stoneLt, sw: 2, dash: "6 5" }));
      b.push(dimH(cx - weit * breitPx / 2, cx + weit * breitPx / 2, bot + 44, "bis " + weit + " m · Aufweitung", C.stoneLt, 11));
      b.push(T(cx + weit * breitPx / 2 + 16, bot - wh / 2, "Länge dieses Abschnitts nicht angegeben", { fill: C.dangerLt, size: 10 }));
    }
    b.push(dimV(top, bot, cx - weit * breitPx / 2 - 60, laenge.roh + " m · Süd → Nord", C.ivory, 13));
    b.push(dimH(cx - regel * breitPx / 2, cx + regel * breitPx / 2, top - 24, regel + " m Regelbreite", C.stoneLt, 11));
    b.push(T(cx, top - 52, "Nord · Fuß des Tempelbergs", { fill: C.ivory, size: 12, anchor: "middle" }));
    b.push(T(cx, bot + 76, "Süd · Bereich des Schiloach-Beckens", { fill: C.waterLt, size: 12, anchor: "middle" }));

    /* getrennte Entwässerung */
    b.push(L(cx + regel * breitPx / 2 + 26, top + 40, cx + regel * breitPx / 2 + 26, bot - 20, C.water, 3, "9 8"));
    b.push(T(cx + regel * breitPx / 2 + 40, (top + bot) / 2, "getrennter Entwässerungskanal", { fill: C.waterLt, size: 11 }));
    b.push(T(cx + regel * breitPx / 2 + 40, (top + bot) / 2 + 16, "eigenes System · keine Gleichsetzung", { fill: C.faint, size: 10 }));

    /* Höhenprofil ausdrücklich offen */
    b.push(R(W - 470, 250, 330, 120, { fill: "url(#rHatch)", stroke: C.danger, dash: "6 5" }));
    b.push(T(W - 305, 300, "Höhenprofil", { fill: C.ivory, size: 14, anchor: "middle" }));
    b.push(T(W - 305, 322, "nicht angegeben", { fill: C.ivory, size: 14, anchor: "middle" }));
    b.push(T(W - 470, 396, "Keine Gesamtsteigung, keine Stufenzahl.", { fill: C.muted, size: 11 }));

    /* Referenzmaß anderer Schicht getrennt halten */
    var ref = card.rows.filter(function (r) { return /Toröffnung/i.test(r.bauteil); })[0];
    if (ref) {
      b.push(R(W - 470, 470, 330, 110, { fill: C.night, stroke: C.rambam, sw: 1.5, dash: "5 4" }));
      b.push(T(W - 450, 500, "Schicht B · " + ref.quelle, { fill: C.rambam, size: 11 }));
      b.push(T(W - 450, 524, ref.bauteil + ": " + ref.mass + " Ammot", { fill: C.ivory, size: 12 }));
      b.push(T(W - 450, 548, "In Ammot — nicht in diese Meterzeichnung gesetzt.", { fill: C.muted, size: 10 }));
    }
    b.push(northArrow(W - 92, 240, "Norden oben"));
    b.push(scaleBar(700, 640, px * 10, "je 10 m", [0, 5, 10, 20]));

    return shell(card, {
      W: W, H: H, artLabel: "Streckenschema", body: b.join(""),
      unitNote: "Archäologischer Befund in Metern · Längs- und Querachse mit eigenen Maßstäben",
      legend: [[C.stoneLt, "durchgezogen", "Maß im Grabungsbefund belegt"],
               [C.danger, "schraffiert", "in der Karte ausdrücklich offen"],
               [C.water, "blau", "Wassersystem · eigene Ebene"]],
      nicht: g.offen.concat(["Krümmung und genauer Verlauf", "Lage eines künftigen Zieltors"]),
      foot: "Streckenschema · relative Lage · historischer Befund · kein Zukunftsbauplan"
    });
  }

  /* ══════════ 7 · Verortung ohne Maß ══════════ */
  function ort(card, g) {
    var W = 1240, H = 860, b = [];
    var stufen = [];
    var lead = card.lead + " " + card.rows.map(function (r) { return r.bemerkung; }).join(" ");
    var kette = (lead.match(/Jerusalem\s*→\s*Har HaMoriah/i)) ? ["יְרוּשָׁלַיִם", "הַר הַמּוֹרִיָּה", "הַמִּקְדָּשׁ"] : null;
    var de = ["Jerusalem", "Har HaMoriah", "Der Mikdasch"];
    if (!kette) kette = ["", "", ""];
    var cx = 470, cy = 470;
    var sizes = [[620, 480], [420, 320], [230, 170]];
    sizes.forEach(function (sz, i) {
      b.push(R(cx - sz[0] / 2, cy - sz[1] / 2, sz[0], sz[1], {
        fill: i === 2 ? C.panel : "none", stroke: i === 2 ? C.stoneLt : C.stone, sw: i === 2 ? 3 : 1.5,
        dash: i === 2 ? "" : "8 7", rx: 14
      }));
      b.push(T(cx, cy - sz[1] / 2 + 26, kette[i], { fill: C.ivory, size: i === 2 ? 20 : 17, font: HE, anchor: "middle", rtl: true }));
      b.push(T(cx, cy - sz[1] / 2 + 46, de[i], { fill: C.stoneLt, size: 12, font: DIS, italic: true, anchor: "middle" }));
    });
    b.push(T(cx, cy + 20, "Ortsbindung belegt", { fill: C.ivory, size: 14, anchor: "middle" }));
    b.push(T(cx, cy + 42, "Maß und Punkt nicht", { fill: C.dangerLt, size: 14, anchor: "middle" }));

    var qx = 900;
    b.push(T(qx, 250, "Was diese Karte festlegt", { fill: C.stoneLt, size: 13 }));
    var ja = ["Der Ort ist gebunden: Jerusalem und Har HaMoriah.", "Die Bindung ist halachisch, nicht topographisch vermessen.", "Die Schachtelung der Bezirke ist eine Ordnung, keine Fläche."];
    ja.forEach(function (z, i) { b.push(T(qx, 280 + i * 34, "· " + z, { fill: C.sand, size: 11 })); });
    b.push(T(qx, 420, "Was sie ausdrücklich offenlässt", { fill: C.dangerLt, size: 13 }));
    var nein = ["Keine Maßzahl, keine Kantenlänge.", "Keine moderne Koordinate, kein GPS-Punkt.", "Keine Zuordnung zu einem heutigen Bauwerk."];
    nein.forEach(function (z, i) { b.push(T(qx, 450 + i * 34, "· " + z, { fill: C.muted, size: 11 })); });
    b.push(R(qx, 560, 260, 46, { fill: "url(#rHatch)", stroke: C.danger }));
    b.push(T(qx + 130, 588, "kein Maßstab anwendbar", { fill: C.ivory, size: 12, anchor: "middle" }));

    return shell(card, {
      W: W, H: H, artLabel: "Verortungsschema", body: b.join(""),
      unitNote: "Ordnungsdarstellung · kein Maßstab",
      legend: [[C.stone, "gestrichelt", "Bezirk belegt, Ausdehnung nicht angegeben"],
               [C.stoneLt, "durchgezogen", "Gegenstand der Karte"],
               [C.danger, "schraffiert", "ausdrücklich offen"]],
      nicht: ["Kantenlängen und Flächen", "moderne Koordinaten", "Lage im heutigen Stadtbild"],
      foot: "Verortung · Ordnung der Bezirke · keine Fläche, kein Punkt"
    });
  }

  /* ══════════ 8 · Trennzone: drei Quellenzustände, nicht vermischt ══════════ */
  function trennzone(card, g) {
    var W = 1240, H = 860, b = [];
    var rw = firstRow(card, /Wand.*Erster Tempel/i), rz = firstRow(card, /Zwischenzone/i), rf = firstRow(card, /Zukunftstext/i);
    var v1 = firstNumber(rw && rw.mass, 1), v2 = firstNumber(rz && rz.mass, 1), v3 = firstNumber(rf && rf.mass, 2);
    var panels = [
      { x: 105, title: "ERSTER TEMPEL", sub: "Wand", v: v1, art: "wall" },
      { x: 455, title: "ZWEITER TEMPEL", sub: "freier Zwischenraum · zwei Vorhänge", v: v2, art: "zone" },
      { x: 805, title: "ZUKUNFTSTEXT", sub: "Trennelement", v: v3, art: "future" }
    ];
    panels.forEach(function (p) {
      var px = 72, ww = p.v * px, cx = p.x + 145, x = cx - ww / 2, y = 250, hh = 270;
      b.push(R(p.x, 190, 290, 390, { fill: C.night, stroke: C.stone, sw: 1, rx: 10 }));
      b.push(T(cx, 222, p.title, { fill: C.stoneLt, size: 12, anchor: "middle", ls: "1.4" }));
      b.push(T(cx, 242, p.sub, { fill: C.muted, size: 11, anchor: "middle" }));
      if (p.art === "zone") {
        b.push(R(x, y, ww, hh, { fill: "url(#rHatchQ)", stroke: C.waterLt, sw: 2, dash: "6 5" }));
        b.push(L(x + 5, y, x + 5, y + hh, C.ivory, 3, "8 5"));
        b.push(L(x + ww - 5, y, x + ww - 5, y + hh, C.ivory, 3, "8 5"));
        b.push(T(cx, y + hh / 2, "freier Raum", { fill: C.waterLt, size: 12, anchor: "middle" }));
      } else {
        b.push(R(x, y, ww, hh, { fill: "url(#rHatch)", stroke: p.art === "future" ? C.waterLt : C.stoneLt, sw: 2, dash: "6 5" }));
        b.push(T(cx, y + hh / 2, p.v + (p.v === 1 ? " Ammah" : " Amot"), { fill: C.ivory, size: 15, anchor: "middle" }));
      }
      b.push(dimH(x, x + ww, y + hh + 36, p.v + (p.v === 1 ? " Ammah · O–W" : " Amot · O–W"), C.ivory, 11));
      b.push(TR(p.x + 25, y + hh / 2, "N–S-Ausdehnung offen", { fill: C.dangerLt, size: 10 }));
    });
    b.push(T(W / 2, 640, "Drei Quellenzustände · nebeneinander, nicht zu einem Bauteil verschmolzen", { fill: C.ivory, size: 13, anchor: "middle" }));
    b.push(T(W / 2, 664, "Die Breiten 1 · 1 · 2 sind maßstäblich; die gezeichnete Nord–Süd-Länge ist nur eine offene Andeutung.", { fill: C.muted, size: 11, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Trennzonenvergleich", body: b.join(""),
      unitNote: "Breitenmaß in Ammot · drei Bauzustände getrennt",
      legend: [[C.stoneLt, "Wand", "Erster Tempel · 1 Ammah"], [C.waterLt, "Zwischenzone", "Zweiter Tempel · 1 Ammah"], [C.danger, "offene Ausdehnung", "Höhe und N–S nicht beziffert"]],
      nicht: ["Höhe der Trennelemente", "Nord–Süd-Ausdehnung", "Zuordnung der Zwischenzone zu innen oder außen", "Lage eines einzelnen Vorhangs im Ersten Tempel"],
      foot: "Quellenvergleich · gemeinsame O–W-Skala · keine Harmonisierung der drei Bauzustände"
    });
  }

  /* ══════════ 9 · Seitenkammern: 11 je Geschoss, 3 Geschosse ══════════ */
  function kammern(card, g) {
    var W = 1240, H = 930, b = [];
    var x0 = 180, y0 = 270, kw = 450, kh = 250, cellW = 82, cellD = 48;
    b.push(T(x0, 190, "PLAN · EIN GESCHOSS", { fill: C.stoneLt, size: 13, ls: "1.6" }));
    b.push(R(x0, y0, kw, kh, { fill: C.panel, stroke: C.stoneLt, sw: 5 }));
    b.push(T(x0 + kw / 2, y0 + kh / 2, "KERNBAU", { fill: C.ivory, size: 18, anchor: "middle" }));
    for (var i = 0; i < 5; i++) {
      var xx = x0 + 18 + i * cellW;
      b.push(R(xx, y0 - cellD - 8, cellW - 6, cellD, { fill: C.water, stroke: C.waterLt, sw: 1.4, op: ".38" }));
      b.push(R(xx, y0 + kh + 8, cellW - 6, cellD, { fill: C.water, stroke: C.waterLt, sw: 1.4, op: ".38" }));
      b.push(T(xx + (cellW - 6) / 2, y0 - 25, String(i + 1), { fill: C.ivory, size: 11, anchor: "middle" }));
      b.push(T(xx + (cellW - 6) / 2, y0 + kh + 40, String(i + 1), { fill: C.ivory, size: 11, anchor: "middle" }));
    }
    b.push(R(x0 - cellD - 8, y0 + 30, cellD, kh - 60, { fill: C.water, stroke: C.waterLt, sw: 1.4, op: ".38" }));
    b.push(TR(x0 - cellD / 2 - 8, y0 + kh / 2, "1 WEST", { fill: C.ivory, size: 11 }));
    b.push(T(x0 + kw / 2, y0 - cellD - 22, "5 NORD", { fill: C.waterLt, size: 12, anchor: "middle" }));
    b.push(T(x0 + kw / 2, y0 + kh + cellD + 32, "5 SÜD", { fill: C.waterLt, size: 12, anchor: "middle" }));
    b.push(T(x0 + kw + 24, y0 + 24, "Osten frei", { fill: C.stoneLt, size: 11 }));
    b.push(T(x0 + kw / 2, y0 + kh + cellD + 58, "5 + 5 + 1 = 11 Kammern je Geschoss", { fill: C.ivory, size: 12, anchor: "middle" }));

    var sx = 820, sy = 245;
    b.push(T(sx, 190, "DREI GESCHOSSE · ZÄHLSCHEMA", { fill: C.stoneLt, size: 13, ls: "1.6" }));
    for (var z = 0; z < 3; z++) {
      var yy = sy + (2 - z) * 105;
      b.push(R(sx, yy, 270, 72, { fill: C.panel, stroke: C.waterLt, sw: 1.6 }));
      b.push(T(sx + 22, yy + 28, "Geschoss " + (z + 1), { fill: C.ivory, size: 12 }));
      b.push(T(sx + 248, yy + 28, "11", { fill: C.waterLt, size: 18, anchor: "end" }));
      b.push(T(sx + 22, yy + 52, "5 N · 5 S · 1 W", { fill: C.muted, size: 11 }));
    }
    b.push(T(sx + 135, sy + 3 * 105 + 42, "11 × 3 = 33", { fill: C.ivory, size: 18, anchor: "middle" }));

    var qx = 180, qy = 710, u = 8;
    b.push(T(qx, qy - 38, "QUERSCHNITTSMASSE · GETRENNT VOM ZÄHLSCHEMA", { fill: C.stoneLt, size: 12, ls: "1.2" }));
    b.push(R(qx, qy, 6 * u, 42, { fill: C.stone, stroke: C.stoneLt }));
    b.push(R(qx + 6 * u, qy, 4 * u, 42, { fill: C.water, stroke: C.waterLt, op: ".5" }));
    b.push(R(qx + 10 * u, qy, 5 * u, 42, { fill: C.stone, stroke: C.stoneLt }));
    b.push(dimH(qx, qx + 6 * u, qy + 68, "Hauswand 6", C.stoneLt, 10));
    b.push(dimH(qx + 6 * u, qx + 10 * u, qy + 68, "Kammer 4", C.waterLt, 10));
    b.push(dimH(qx + 10 * u, qx + 15 * u, qy + 68, "Außenwand oben 5", C.stoneLt, 10));
    b.push(dimH(qx + 18 * u, qx + 38 * u, qy + 20, "Freiraum 20 Amot", C.ivory, 10));
    return shell(card, {
      W: W, H: H, artLabel: "Kammerkranz · Zählschema", body: b.join(""),
      unitNote: "33 ist Anzahl · Quermaße separat in Ammot",
      legend: [[C.water, "Kammer", "5 Nord + 5 Süd + 1 West je Geschoss"], [C.stoneLt, "Kernbau", "nur Bezugsfläche, hier ohne eigene Maße"], [C.danger, "offen", "Kammerlängen und Geschosshöhen nicht angegeben"]],
      nicht: ["Länge jeder einzelnen Kammer", "Geschosshöhen", "Treppen und Zugänge", "Ostkammern — nicht belegt"],
      foot: "Zählschema · 33 = 11 × 3 · Längsmaße der Einzelkammern nicht behauptet"
    });
  }

  /* ══════════ 10 · Karte 04: äußerer Bezirk der Vision ══════════ */
  function visionsbezirk(card) {
    var W = 1240, H = 940, b = [];
    function square(x, y, size, title, line1, line2, col, dash) {
      b.push(T(x, y - 34, title, { fill: col, size: 12, ls: "1" }));
      b.push(R(x, y, size, size, { fill: C.panel, stroke: col, sw: 2.5, dash: dash || "" }));
      b.push(T(x + size / 2, y + size / 2 - 7, line1, { fill: C.ivory, size: 17, anchor: "middle" }));
      b.push(T(x + size / 2, y + size / 2 + 18, line2, { fill: C.muted, size: 10, anchor: "middle" }));
    }
    square(70, 245, 300, "42:16–19 · VIER SEITEN", "500 × 500 Kanim", "Einheit aus den Seitenversen", C.stoneLt, "");
    b.push(T(220, 228, "500 Kanim", { fill: C.stoneLt, size: 10, anchor: "middle" }));
    b.push(TR(52, 395, "500 Kanim", { fill: C.stoneLt, size: 10 }));
    b.push(T(220, 575, "Mauer umlaufend · Höhe und Dicke offen", { fill: C.dangerLt, size: 10, anchor: "middle" }));
    square(470, 245, 300, "42:20 · GESAMTZAHL", "500 × 500", "Einheitswort im Vers nicht wiederholt", C.waterLt, "7 6");
    b.push(R(485, 260, 270, 270, { fill: "url(#rHatchQ)", stroke: "none", op: ".35" }));
    square(870, 245, 300, "B-RECHNUNG", "3000 × 3000 Ammot", "500 Kanim × 6 Ammot je Kaneh", C.rambam, "6 5");
    b.push(T(620, 640, "QUELLENLOGIK", { fill: C.stoneLt, size: 12, anchor: "middle", ls: "1.2" }));
    b.push(L(220, 680, 470, 680, C.stoneLt, 2));
    b.push(T(345, 670, "Seitenverse geben Kanim", { fill: C.muted, size: 10, anchor: "middle" }));
    b.push(L(770, 680, 870, 680, C.rambam, 2, "6 5"));
    b.push(T(820, 670, "nur mit 40:5 umgerechnet", { fill: C.muted, size: 10, anchor: "middle" }));
    b.push(T(W / 2, 735, "Die drei Quadrate stehen absichtlich in getrennten Bildschirmmaßstäben.", { fill: C.dangerLt, size: 11, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Visionsbezirk · drei Maßebenen", body: b.join(""),
      unitNote: "500 Kanim · 500 × 500 ohne wiederholte Einheit · B: 3000 Ammot",
      legend: [[C.stoneLt, "A-Seitenwerte", "je 500 Kanim"], [C.waterLt, "A-Gesamtzahl", "Einheit in 42:20 nicht wiederholt"], [C.rambam, "B-Rechnung", "Kaneh = 6 Ammot eingesetzt"]],
      nicht: ["Mauerhöhe und -dicke", "Gleichsetzung ohne 40:5", "Umrechnung in Meter", "Bebauung innerhalb des Bezirks"],
      foot: "Quellenvergleich · Quadrate nicht optisch maßstabsgleich gesetzt"
    });
  }

  /* ══════════ 11 · Karte 05: halachischer Referenzberg ══════════ */
  function referenzberg(card) {
    var W = 1240, H = 960, b = [], x = 150, y = 220, s = 1.05, q = 500 * s;
    b.push(T(x, 175, "HAR HABAJIT · 500 × 500 AMOT", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    b.push(R(x, y, q, q, { fill: C.panel, stroke: C.stoneLt, sw: 3 }));
    for (var g = 100; g < 500; g += 100) {
      b.push(L(x + g * s, y, x + g * s, y + q, C.stone, .5, "2 7"));
      b.push(L(x, y + g * s, x + q, y + g * s, C.stone, .5, "2 7"));
    }
    b.push(dimH(x, x + q, y + q + 34, "500 Amot · O–W", C.ivory, 12));
    b.push(dimV(y, y + q, x - 18, "500 Amot · N–S", C.ivory, 12));
    /* Nur die Rangfolge wird gezeigt: W klein, N größer, O größer, S am größten. */
    var ix = x + 42, iy = y + 82, iw = 300, ih = 250;
    b.push(R(ix, iy, iw, ih, { fill: "url(#rHatchQ)", stroke: C.waterLt, sw: 2, dash: "7 6" }));
    b.push(T(ix + iw / 2, iy + ih / 2 - 6, "ASARAH · GRÖẞE OFFEN", { fill: C.ivory, size: 14, anchor: "middle" }));
    b.push(T(ix + iw / 2, iy + ih / 2 + 18, "Lage nur nach Abstands-Rangfolge", { fill: C.muted, size: 10, anchor: "middle" }));
    b.push(T(ix - 4, iy + ih / 2, "WEST · kleinster", { fill: C.rambam, size: 10, anchor: "end" }));
    b.push(T(ix + iw / 2, iy - 12, "NORD", { fill: C.rambam, size: 10, anchor: "middle" }));
    b.push(T(ix + iw + 10, iy + ih / 2, "OST", { fill: C.rambam, size: 10 }));
    b.push(T(ix + iw / 2, iy + ih + 22, "SÜD · größter", { fill: C.rambam, size: 10, anchor: "middle" }));
    b.push(northArrow(760, 230, "Ost rechts"));

    var rx = 820;
    b.push(T(rx, 340, "BELEGTE RANGFOLGE", { fill: C.stoneLt, size: 12, ls: "1" }));
    ["SÜD · größter Freiraum", "OST", "NORD", "WEST · kleinster Freiraum"].forEach(function (z, i) {
      var w = 300 - i * 55, yy = 385 + i * 66;
      b.push(R(rx, yy, w, 28, { fill: i === 0 ? C.rambam : C.stone, stroke: C.stoneLt, op: ".55" }));
      b.push(T(rx + 10, yy + 19, z, { fill: C.ivory, size: 10 }));
    });
    b.push(T(rx, 690, "UNTERBAU UND DOPPELTER PORTIKUS", { fill: C.stoneLt, size: 12 }));
    b.push(R(rx, 720, 320, 70, { fill: "url(#rHatch)", stroke: C.danger, dash: "6 5" }));
    b.push(T(rx + 160, 750, "vorhanden · Maße offen", { fill: C.ivory, size: 11, anchor: "middle" }));
    b.push(T(rx + 160, 772, "keine Spannweite, Stützenzahl oder Tiefe", { fill: C.muted, size: 10, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Referenzberg · Grundriss und Ranglage", body: b.join(""),
      unitNote: "Außenbezirk 500 × 500 Ammot · innere Abstände nur als Rang",
      legend: [[C.stoneLt, "Außenquadrat", "Maß ausdrücklich belegt"], [C.waterLt, "Asarah", "Größe offen; Lage nur relational"], [C.danger, "Schraffur", "Unterbau und Portikus ohne Maße"]],
      nicht: ["Maße der Asarah auf dieser Karte", "numerische Randabstände", "Mauerhöhe und -stärke", "Unterbau- und Portikusmaße"],
      foot: "500-Amot-Referenzplan · Ranglage nicht als Strecke ausgegeben"
    });
  }

  /* ══════════ 12 · Karte 06: Terumat HaKodesch ══════════ */
  function terumah(card) {
    var W = 1240, H = 1010, b = [], x = 95, y = 220, sw = 620, h1 = 230, h2 = 230, h3 = 115;
    b.push(T(x, 175, "LANDPLAN · ZAHLEN BELEGT, EINHEIT NICHT GENANNT", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    b.push(R(x, y, sw, h1, { fill: C.panel, stroke: C.stoneLt, sw: 2 }));
    b.push(T(x + 24, y + 38, "PRIESTERABSCHNITT", { fill: C.ivory, size: 13 }));
    b.push(T(x + sw - 24, y + 38, "25.000 × 10.000 · Einheit offen", { fill: C.stoneLt, size: 12, anchor: "end" }));
    b.push(R(x, y + h1, sw, h2, { fill: C.night, stroke: C.waterLt, sw: 2 }));
    b.push(T(x + 24, y + h1 + 38, "LEVITENABSCHNITT", { fill: C.ivory, size: 13 }));
    b.push(T(x + sw - 24, y + h1 + 38, "25.000 × 10.000 · Einheit offen", { fill: C.waterLt, size: 12, anchor: "end" }));
    b.push(R(x, y + h1 + h2, sw, h3, { fill: C.panel, stroke: C.rambam, sw: 2 }));
    b.push(T(x + 24, y + h1 + h2 + 38, "STADTANTEIL", { fill: C.ivory, size: 13 }));
    b.push(T(x + sw - 24, y + h1 + h2 + 38, "25.000 × 5.000 · Einheit offen", { fill: C.rambam, size: 12, anchor: "end" }));
    b.push(dimH(x, x + sw, y + h1 + h2 + h3 + 34, "25.000 · gemeinsame Längenzahl", C.ivory, 11));
    b.push(T(x + sw / 2, y + h1 + h2 + h3 + 66, "Vertikale Anordnung ist Ordnungsschema; der Text gibt keine moderne Karte.", { fill: C.dangerLt, size: 10, anchor: "middle" }));

    var rx = 825, ry = 250, rs = 250;
    b.push(T(rx, 175, "HEILIGTUMSQUADRAT · EIGENE SKALA", { fill: C.stoneLt, size: 13, ls: "1" }));
    b.push(R(rx, ry, rs, rs, { fill: C.panel, stroke: C.waterLt, sw: 2, dash: "7 6" }));
    b.push(T(rx + rs / 2, ry + 95, "500 × 500", { fill: C.ivory, size: 18, anchor: "middle" }));
    b.push(T(rx + rs / 2, ry + 122, "Einheit im Vers offen", { fill: C.waterLt, size: 11, anchor: "middle" }));
    b.push(T(rx + rs / 2, ry + 150, "Raschi/Malbim: Kanim", { fill: C.muted, size: 10, anchor: "middle" }));
    b.push(R(rx - 20, ry - 20, rs + 40, rs + 40, { fill: "none", stroke: C.rambam, sw: 2 }));
    b.push(T(rx + rs / 2, ry + rs + 48, "Migrasch 50 Ammah ringsum", { fill: C.rambam, size: 11, anchor: "middle" }));
    b.push(T(rx, 625, "MIKDASCH-GEBÄUDE", { fill: C.stoneLt, size: 12 }));
    b.push(R(rx, 655, rs, 105, { fill: "url(#rHatch)", stroke: C.danger, dash: "6 5" }));
    b.push(T(rx + rs / 2, 702, "innerhalb des Priesterabschnitts", { fill: C.ivory, size: 11, anchor: "middle" }));
    b.push(T(rx + rs / 2, 724, "Lage und Maße auf dieser Karte offen", { fill: C.dangerLt, size: 10, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Terumah · Landplan mit getrennten Skalen", body: b.join(""),
      unitNote: "25.000/10.000/5.000 ohne Einheit · 500 × 500 eigene Ebene · Migrasch 50 Ammah",
      legend: [[C.stoneLt, "Priester", "25.000 × 10.000"], [C.waterLt, "Leviten", "25.000 × 10.000"], [C.rambam, "Ammah-Ring", "50 ringsum, nicht auf Großzahlen übertragen"]],
      nicht: ["Einheit der Großzahlen", "Gleichsetzung von 500 mit Ammot", "Gebäudemaße des Mikdasch", "moderne Landkoordinaten"],
      foot: "Landplan · Maßebenen getrennt · keine Umrechnung oder moderne Kartierung"
    });
  }

  /* ══════════ 13 · Karte 07: fünf Tore des Referenzbergs ══════════ */
  function bergtore(card) {
    var W = 1240, H = 970, b = [], px = 12, ow = 10 * px, oh = 20 * px, base = 510;
    b.push(T(75, 175, "FÜNF GLEICHE LICHTE ÖFFNUNGEN", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    ["WEST · 1", "OST · 1", "NORD · 1 · Tadi", "SÜD · 1", "SÜD · 2"].forEach(function (lab, i) {
      var x = 65 + i * 235;
      b.push(R(x, base - oh, ow, oh, { fill: C.night, stroke: C.ivory, sw: 2 }));
      b.push(dimH(x, x + ow, base - oh - 24, "10", C.ivory, 10));
      b.push(dimV(base - oh, base, x - 12, "20", C.ivory, 10));
      b.push(T(x + ow / 2, base + 26, lab, { fill: i === 2 ? C.rambam : C.stoneLt, size: 10, anchor: "middle" }));
      if (i === 2) {
        b.push(L(x, base - oh, x + ow / 2, base - oh - 30, C.rambam, 3));
        b.push(L(x + ow / 2, base - oh - 30, x + ow, base - oh, C.rambam, 3));
      }
    });
    b.push(T(W / 2, 575, "Alle fünf Öffnungen 10 × 20 Ammot · Türflügel vorhanden, Zahl und Maße offen", { fill: C.muted, size: 11, anchor: "middle" }));

    var sx = 380, sy = 650, ss = 280;
    b.push(T(75, 635, "SEITENVERTEILUNG · POSITIONEN ENTLANG DER SEITE OFFEN", { fill: C.stoneLt, size: 12 }));
    b.push(R(sx, sy, ss, 190, { fill: C.panel, stroke: C.stone, sw: 2, dash: "7 6" }));
    function gm(x, y, w, h, label) { b.push(R(x, y, w, h, { fill: C.night, stroke: C.waterLt, sw: 2, dash: "3 3" })); b.push(T(x + w / 2, y - 8, label, { fill: C.waterLt, size: 9, anchor: "middle" })); }
    gm(sx + ss / 2 - 12, sy - 4, 24, 8, "N 1"); gm(sx + ss / 2 - 12, sy + 186, 24, 8, "S 2"); gm(sx + ss / 2 + 56, sy + 186, 24, 8, "");
    gm(sx - 4, sy + 83, 8, 24, "W 1"); gm(sx + ss - 4, sy + 83, 8, 24, "O 1");
    b.push(T(735, 700, "TADI-AUSNAHME", { fill: C.rambam, size: 12 }));
    b.push(T(735, 730, "zwei geneigte Steine · kein gewöhnlicher Sturz", { fill: C.muted, size: 11 }));
    b.push(T(735, 758, "Mauerstärke und Durchgangstiefe bleiben offen.", { fill: C.dangerLt, size: 11 }));
    return shell(card, {
      W: W, H: H, artLabel: "Fünf Bergtore · Öffnungsregister", body: b.join(""),
      unitNote: "5 Tore · lichte Öffnung je 10 × 20 Ammot",
      legend: [[C.ivory, "Öffnung", "Breite und Höhe belegt"], [C.waterLt, "Seitenmarke", "Anzahl je Seite; Position offen"], [C.rambam, "Tadi", "geneigter Doppelstein ohne Maß"]],
      nicht: ["Positionen entlang der Seiten", "Mauerstärke und Durchgangstiefe", "Zahl und Maße der Türflügel", "Maße der Tadi-Steine"],
      foot: "Öffnungsregister · Seitenanzahl belegt · genaue Torlagen offen"
    });
  }

  /* Karte 10 nutzt den präzisen allgemeinen Grundriss mit vier Maßketten;
     die ergänzten gestrichelten Seitenmarken bewahren die 3+3+1-Torverteilung. */
  function azarah(card, g) { return grundriss(card, g); }

  /* ══════════ 14 · Karte 11: Höhenstaffelung ══════════ */
  function hoehenstaffel(card) {
    var W = 1240, H = 1030, b = [], base = 760, sy = 20, x = 90, level = 0;
    b.push(T(75, 175, "KUMULATIVE HÖHENSTAFFELUNG · GESAMT 22 AMOT", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    function landing(w, label) {
      var yy = base - level * sy;
      b.push(L(x, yy, x + w, yy, C.stoneLt, 4));
      b.push(R(x, yy - 8, w, 16, { fill: "url(#rHatchQ)", stroke: C.water, op: ".35" }));
      b.push(T(x + w / 2, yy + 28, label, { fill: C.muted, size: 9, anchor: "middle" }));
      b.push(T(x + w / 2, yy + 44, "horizontale Länge offen", { fill: C.dangerLt, size: 8, anchor: "middle" }));
      x += w;
    }
    function flight(run, rise, count, label, note) {
      var y0 = base - level * sy, y1 = base - (level + rise) * sy, dx = run / count, dy = (rise * sy) / count, d = "M" + x + " " + y0;
      for (var i = 0; i < count; i++) d += " h" + dx.toFixed(2) + " v-" + dy.toFixed(2);
      b.push('<path d="' + d + '" fill="none" stroke="' + C.ivory + '" stroke-width="2"/>');
      b.push(T(x + run / 2, (y0 + y1) / 2 - 12, label, { fill: C.stoneLt, size: 10, anchor: "middle" }));
      b.push(T(x + run / 2, (y0 + y1) / 2 + 5, note, { fill: C.muted, size: 8, anchor: "middle" }));
      level += rise; x += run;
      b.push(dimV(y1, y0, x + 10, "+" + String(rise).replace(".", ",") + "", C.ivory, 9));
    }
    landing(82, "Osttor → Ende Chajl");
    flight(90, 6, 12, "12 Stufen", "½ hoch · ½ Auftritt");
    landing(75, "Ezrat Naschim");
    flight(112, 7.5, 15, "15 Stufen", "½ hoch · halbkreisförmig im Plan");
    landing(75, "Ezrat Jisrael");
    flight(62, 2.5, 4, "1 + 3 Stufen", "Duchan · Laufweite nicht abgeleitet");
    landing(75, "Ezrat Kohanim");
    flight(180, 6, 12, "12 Stufen zum Ulam", "½ hoch · 1 Ammah Auftritt");
    landing(95, "Ulam und Heichal");
    var topY = base - 22 * sy;
    b.push(L(70, base, 70, topY, C.rambam, 4));
    b.push(dimV(topY, base, 55, "22 Amot Gesamthöhe", C.rambam, 11));
    b.push(T(75, base + 78, "Flache Abschnitte besitzen 0 Höhengewinn; ihre gezeichneten Breiten sind nur Trennfelder.", { fill: C.dangerLt, size: 10 }));

    var gx = 1040, gateTop = base - 20 * sy;
    b.push(T(1000, 235, "SICHTLINIEN-BEZUG", { fill: C.stoneLt, size: 12 }));
    b.push(L(gx, base, gx, gateTop, C.waterLt, 7));
    b.push(dimV(gateTop, base, gx - 16, "Osttor 20", C.waterLt, 10));
    b.push(L(gx - 20, topY, gx + 90, topY, C.rambam, 4));
    b.push(T(gx + 35, topY - 14, "Heichalboden 22", { fill: C.rambam, size: 10, anchor: "middle" }));
    b.push(dimV(topY, gateTop, gx + 45, "2 Amot", C.dangerLt, 9));
    return shell(card, {
      W: W, H: H, artLabel: "Höhenstaffelung · kumulatives Profil", body: b.join(""),
      unitNote: "Höhen in Ammot · Gesamthöhe 22 · offene Horizontalstrecken nicht skaliert",
      legend: [[C.ivory, "Stufenprofil", "Anzahl und Höhengewinn belegt"], [C.water, "schraffierte Landung", "Höhe belegt, Länge offen"], [C.rambam, "Gesamthöhe", "Heichalboden 22 über Osttorboden"]],
      nicht: ["Breite der Stufenläufe", "Längen der ebenen Höfe", "gerade Planform der 15 Stufen", "Steigung außerhalb der genannten Flüge"],
      foot: "Kumulatives Höhenprofil · offene Horizontalmaße bewusst unmaßstäblich"
    });
  }

  /* ══════════ 15 · Karte 12: Torhaus Jechezkels ══════════ */
  function torhaus(card) {
    var W = 1240, H = 1020, b = [], s = 9, x = 105, y = 255, cell = 6 * s, wall = 5 * s, pass = 10 * s;
    b.push(T(75, 175, "ZELLMODUL UND PASSAGE · GRUNDRISS", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    var parts = [cell, wall, cell, wall, cell], total = parts.reduce(function (a, v) { return a + v; }, 0);
    function cells(yy) {
      var xx = x;
      parts.forEach(function (w, i) {
        var c = i % 2 === 0;
        b.push(R(xx, yy, w, cell, { fill: c ? C.water : C.stone, stroke: c ? C.waterLt : C.stoneLt, op: c ? ".32" : ".7" }));
        b.push(T(xx + w / 2, yy + cell / 2 + 4, c ? "6 × 6" : "5", { fill: C.ivory, size: c ? 10 : 9, anchor: "middle" }));
        xx += w;
      });
    }
    cells(y); cells(y + cell + pass + 2 * s);
    b.push(R(x, y + cell, total, s, { fill: C.rambam, stroke: C.rambam }));
    b.push(R(x, y + cell + s + pass, total, s, { fill: C.rambam, stroke: C.rambam }));
    b.push(R(x, y + cell + s, total, pass, { fill: "url(#rHatchQ)", stroke: C.waterLt, dash: "6 5" }));
    b.push(T(x + total / 2, y + cell + s + pass / 2, "PASSAGE · LICHTE BREITE 10", { fill: C.ivory, size: 11, anchor: "middle" }));
    b.push(T(x + total + 16, y + cell + 8, "Gevul 1", { fill: C.rambam, size: 9 }));
    b.push(dimH(x, x + total, y - 24, "6 + 5 + 6 + 5 + 6 = 28 · sichtbare Modulrechnung", C.ivory, 9));

    var rx = 730;
    b.push(T(rx, 175, "SEPARATE MESSLINIEN · NICHT ZU EINER BOX ADDIERT", { fill: C.stoneLt, size: 12, ls: "1" }));
    [["Schwelle", 6, C.stoneLt], ["Vorraum", 8, C.waterLt], ["Pfeiler", 2, C.rambam]].forEach(function (z, i) {
      var yy = 245 + i * 72, ww = z[1] * 18;
      b.push(R(rx, yy, ww, 28, { fill: z[2], stroke: C.ivory, op: ".55" }));
      b.push(T(rx + ww + 14, yy + 19, z[0] + " · " + z[1] + " Amot", { fill: C.muted, size: 10 }));
    });
    b.push(T(rx, 475, "QUERLINIE 25", { fill: C.ivory, size: 11 }));
    b.push(L(rx, 505, rx + 350, 505, C.ivory, 4));
    b.push(T(rx, 532, "Zellendach zu gegenüberliegendem Zellendach · keine Außenbreite", { fill: C.muted, size: 9 }));
    b.push(T(rx, 585, "FÜNFZIG · ACHSE STRITTIG", { fill: C.dangerLt, size: 11 }));
    b.push(L(rx, 620, rx + 400, 620, C.waterLt, 5));
    b.push(T(rx + 200, 610, "50 als Länge · Radak/Malbim", { fill: C.waterLt, size: 9, anchor: "middle" }));
    b.push(L(rx + 430, 650, rx + 430, 250, C.rambam, 5, "6 5"));
    b.push(TR(rx + 414, 450, "50 als Höhe · Raschi", { fill: C.rambam, size: 9 }));
    b.push(T(rx, 700, "„Länge des Tores“ 13 bleibt wörtlich Länge, nicht Toranzahl und nicht Höhe.", { fill: C.ivory, size: 10 }));
    b.push(R(rx, 735, 430, 60, { fill: "url(#rHatch)", stroke: C.danger, dash: "6 5" }));
    b.push(T(rx + 215, 762, "Pfeiler 60 · Textcrux · Achse offen", { fill: C.dangerLt, size: 11, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Torhaus · Zellmodul und Messlinien", body: b.join(""),
      unitNote: "Zellen 6 × 6 · Wände 5 · Passage 10 · Messlinien separat",
      legend: [[C.waterLt, "Zellen/Passage", "belegte Einzelmaße"], [C.rambam, "Gevul/Pfeiler", "eigene Bauteile"], [C.danger, "offen/strittig", "50-Achse und 60-Crux"]],
      nicht: ["Torhaus als einfache 50 × 25-Box", "Höhe aus der Zahl 13", "Toranzahl 13", "Wandstärken und Stufenzahl"],
      foot: "Torhaus · Teilmaße nicht zwangssummiert · 50-Lesungen getrennt"
    });
  }

  /* ══════════ 16 · Karte 13: Haus 100 × 100 ══════════ */
  function haus100(card) {
    var W = 1240, H = 1060, b = [], x = 80, y = 230, s = 4, coreW = 100 * s, coreB = 70 * s;
    b.push(T(x, 175, "B-REFERENZPLAN · MIDDOT / RAMBAM", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    b.push(R(x, y + 60, coreW, coreB, { fill: C.panel, stroke: C.stoneLt, sw: 2 }));
    b.push(T(x + coreW / 2, y + 60 + coreB / 2, "KERNKÖRPER · 100 O–W × 70 N–S", { fill: C.ivory, size: 13, anchor: "middle" }));
    /* Ulam-Front am Ostende: 70 + 15 + 15 = 100. */
    b.push(R(x + coreW - 45, y, 45, 400, { fill: C.water, stroke: C.waterLt, op: ".28" }));
    b.push(T(x + coreW - 22, y + 28, "ULAM-FRONT 100", { fill: C.waterLt, size: 10, anchor: "middle" }));
    b.push(dimH(x, x + coreW, y + coreB + 98, "100 Amot Gesamtlänge · O–W", C.ivory, 10));
    b.push(dimV(y + 60, y + 60 + coreB, x - 16, "70 Amot Kernkörper", C.ivory, 9));
    b.push(dimV(y, y + 400, x + coreW + 18, "100 Amot Front · 15 + 70 + 15", C.waterLt, 9));

    var chain = [5, 11, 6, 40, 1, 20, 6, 6, 5], cx = x, cy = 720;
    b.push(T(x, cy - 28, "O–W-KETTE NACH MIDDOT · OST → WEST", { fill: C.stoneLt, size: 11 }));
    chain.forEach(function (v, i) {
      var w = v * s;
      b.push(R(cx, cy, w, 42, { fill: i % 2 ? C.panel : C.stone, stroke: C.stoneLt, op: i % 2 ? "1" : ".55" }));
      b.push(T(cx + w / 2, cy + 27, String(v), { fill: C.ivory, size: 9, anchor: "middle" })); cx += w;
    });
    b.push(T(x, cy + 66, "Rambam führt dieselben 100 in Gegenrichtung und gliedert die westlichen 17 anders.", { fill: C.muted, size: 9 }));

    var rx = 700, ry = 235;
    b.push(T(rx, 175, "A-EBENE · JECHEZKEL GETRENNT", { fill: C.rambam, size: 13, ls: "1.1" }));
    b.push(R(rx, ry, 90 * 4, 70 * 4, { fill: C.panel, stroke: C.rambam, sw: 2 }));
    b.push(R(rx + 20, ry + 20, 90 * 4 - 40, 70 * 4 - 40, { fill: "none", stroke: C.danger, dash: "6 5" }));
    b.push(T(rx + 180, ry + 120, "WESTGEBÄUDE", { fill: C.ivory, size: 14, anchor: "middle" }));
    b.push(T(rx + 180, ry + 145, "90 O–W × 70 N–S", { fill: C.rambam, size: 11, anchor: "middle" }));
    b.push(T(rx + 180, ry + 170, "Wandstärke 5 separat", { fill: C.dangerLt, size: 10, anchor: "middle" }));
    b.push(T(rx, 585, "Hauslänge 100 · Ostfront 100", { fill: C.ivory, size: 11 }));
    b.push(T(rx, 610, "nicht mit dem 100 × 100-B-Referenzkörper verschmolzen", { fill: C.dangerLt, size: 10 }));
    b.push(T(rx, 685, "VERTIKALE B-KETTE · GESAMT 100", { fill: C.stoneLt, size: 11 }));
    var vy = 720, vh = 250, vals = [6, 40, 1, 2, 1, 1, 40, 1, 2, 1, 1, 3, 1], sum = 0;
    vals.forEach(function (v, i) {
      var h = v * 2.5;
      b.push(R(rx + i * 28, vy + vh - h, 22, h, { fill: i % 2 ? C.water : C.stone, stroke: C.ivory, op: ".55" }));
      b.push(T(rx + i * 28 + 11, vy + vh + 18, String(v), { fill: C.muted, size: 8, anchor: "middle" })); sum += v;
    });
    b.push(T(rx, vy + vh + 42, "Summe " + sum + " · Fundament bis Kalah-Orhev", { fill: C.ivory, size: 10 }));
    return shell(card, {
      W: W, H: H, artLabel: "Haus 100 · B-Plan und A-Westgebäude", body: b.join(""),
      unitNote: "B: Haus 100 × 100 · Kernkörper 70 breit · A: Westgebäude 90 × 70",
      legend: [[C.stoneLt, "B-Kernbau", "Middot/Rambam"], [C.waterLt, "Ulam-Front", "70 + 15 + 15 = 100"], [C.rambam, "A-Ebene", "Jechezkel-Westgebäude getrennt"]],
      nicht: ["Verschmelzung des B-Hauses mit dem A-Westgebäude", "Höhe des A-Westgebäudes", "Gleichsetzung der Wandgliederungen", "moderne Umrechnung"],
      foot: "Quellengetrennter Hausriss · O–W-, N–S- und Vertikalachsen getrennt"
    });
  }

  /* ══════════ 17 · Karte 14: Ulam ══════════ */
  function ulam(card) {
    var W = 1240, H = 1010, b = [], x = 95, y = 245, s = 15, d = 11 * s, w = 20 * s;
    b.push(T(x, 175, "A-EBENE · ULAM DER VISION", { fill: C.rambam, size: 13, ls: "1.1" }));
    b.push(R(x, y, d, w, { fill: C.panel, stroke: C.rambam, sw: 2 }));
    b.push(dimH(x, x + d, y + w + 34, "11 Amot · O–W", C.rambam, 10));
    b.push(dimV(y, y + w, x - 16, "20 Amot · N–S", C.rambam, 10));
    b.push(R(x + d - 5, y, 10, 3 * s, { fill: C.stone, stroke: C.stoneLt }));
    b.push(R(x + d - 5, y + w - 3 * s, 10, 3 * s, { fill: C.stone, stroke: C.stoneLt }));
    b.push(R(x + d - 5, y + 3 * s, 10, 14 * s, { fill: C.night, stroke: C.waterLt, dash: "5 4" }));
    b.push(T(x + d + 22, y + 22, "3", { fill: C.stoneLt, size: 9 }));
    b.push(T(x + d + 22, y + w / 2, "14 rekonstruiert", { fill: C.waterLt, size: 9 }));
    b.push(T(x + d + 22, y + w - 12, "3", { fill: C.stoneLt, size: 9 }));
    b.push(T(x, y + w + 72, "Ailim 5 je Seite · O–W-Dicke; Baukörperhöhe offen", { fill: C.dangerLt, size: 10 }));

    var ex = 550, ey = 350, ps = 8, pw = 20 * ps, ph = 40 * ps, base = ey + ph;
    b.push(T(ex, 175, "B-REFERENZ · PORTALAUFRISS", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    b.push(R(ex, ey, pw, ph, { fill: C.night, stroke: C.ivory, sw: 2 }));
    b.push(dimH(ex, ex + pw, ey - 24, "20 Amot", C.ivory, 10));
    b.push(dimV(ey, base, ex - 16, "40 Amot", C.ivory, 10));
    for (var i = 0; i < 5; i++) {
      var yy = ey - 50 - i * 28, bw = (i === 4 ? 30 : 24) * ps;
      b.push(R(ex + pw / 2 - bw / 2, yy, bw, 10, { fill: C.rambam, stroke: C.stoneLt }));
    }
    b.push(T(ex + pw + 30, ey - 140, "5 Malteriot", { fill: C.rambam, size: 10 }));
    b.push(T(ex + pw + 30, ey - 120, "oberste 30 Amot", { fill: C.muted, size: 9 }));

    var fx = 780, fy = 300;
    b.push(T(fx, 175, "B-FRONTBREITE · QUERVERWEIS", { fill: C.waterLt, size: 12, ls: "1" }));
    b.push(R(fx, fy, 90, 50, { fill: C.water, stroke: C.waterLt, op: ".4" }));
    b.push(R(fx + 90, fy, 210, 50, { fill: "url(#rHatchQ)", stroke: C.waterLt }));
    b.push(R(fx + 300, fy, 90, 50, { fill: C.water, stroke: C.waterLt, op: ".4" }));
    b.push(T(fx + 45, fy + 31, "15", { fill: C.ivory, size: 11, anchor: "middle" }));
    b.push(T(fx + 195, fy + 31, "Kern 70 · Karte 13", { fill: C.muted, size: 10, anchor: "middle" }));
    b.push(T(fx + 345, fy + 31, "15", { fill: C.ivory, size: 11, anchor: "middle" }));
    b.push(T(fx, fy + 80, "Ulam-Wand 5 in B strittig · Raavad widerspricht eigener Wand.", { fill: C.dangerLt, size: 10 }));
    b.push(R(fx, 500, 390, 120, { fill: "url(#rHatch)", stroke: C.danger, dash: "6 5" }));
    b.push(T(fx + 195, 555, "A-Baukörperhöhe nicht angegeben", { fill: C.dangerLt, size: 12, anchor: "middle" }));
    b.push(T(fx + 195, 580, "B-Portalhöhe 40 schließt diese Lücke nicht", { fill: C.muted, size: 10, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Ulam · Vision und B-Referenz getrennt", body: b.join(""),
      unitNote: "A-Grundriss 11 × 20 · B-Portal 20 × 40 · Quellen nicht vermischt",
      legend: [[C.rambam, "A-Ebene", "Jechezkel-Grundriss"], [C.ivory, "B-Portal", "Middot/Rambam"], [C.waterLt, "Rechnung", "14 lichte Weite bzw. 100 Front als Rekonstruktion"]],
      nicht: ["A-Baukörperhöhe", "Übertragung der B-Portalhöhe auf A", "sichere Ulam-Wand in B", "Rekonstruktionszahl 14 als Verszahl"],
      foot: "Ulam · A- und B-Geometrie getrennt · offene Baukörperhöhe bewahrt"
    });
  }

  /* ══════════ 18 · Karte 15: Heichal ══════════ */
  function heichal(card) {
    var W = 1240, H = 960, b = [], x = 100, y = 250, s = 10, len = 40 * s, wid = 20 * s;
    b.push(T(x, 175, "A-GRUNDRISS · LICHTER INNENRAUM", { fill: C.rambam, size: 13, ls: "1.1" }));
    b.push(R(x, y, len, wid, { fill: C.panel, stroke: C.rambam, sw: 3 }));
    b.push(dimH(x, x + len, y + wid + 34, "40 Amot · O–W, licht", C.ivory, 10));
    b.push(dimV(y, y + wid, x - 16, "20 Amot · N–S, licht", C.ivory, 10));
    var gy = y + 5 * s;
    b.push(R(x + len - 5, y, 10, 5 * s, { fill: C.stone, stroke: C.stoneLt }));
    b.push(R(x + len - 5, gy, 10, 10 * s, { fill: C.night, stroke: C.ivory, sw: 2 }));
    b.push(R(x + len - 5, gy + 10 * s, 10, 5 * s, { fill: C.stone, stroke: C.stoneLt }));
    b.push(T(x + len + 18, y + 30, "5", { fill: C.stoneLt, size: 10 }));
    b.push(T(x + len + 18, gy + 52, "Eingang 10", { fill: C.ivory, size: 10 }));
    b.push(T(x + len + 18, y + wid - 14, "5", { fill: C.stoneLt, size: 10 }));
    b.push(T(x, y + wid + 72, "5 + 10 + 5 = 20 · interne Kontrolle der Ostwand", { fill: C.muted, size: 10 }));

    var ex = 700, ey = 245, ps = 11, pw = 10 * ps, ph = 20 * ps;
    b.push(T(ex, 175, "B-REFERENZ · EINGANGSAUFRISS", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    b.push(R(ex, ey, pw, ph, { fill: C.night, stroke: C.ivory, sw: 2 }));
    b.push(dimH(ex, ex + pw, ey - 22, "10", C.ivory, 9));
    b.push(dimV(ey, ey + ph, ex - 14, "20", C.ivory, 9));
    b.push(L(ex + pw / 2, ey, ex + pw / 2, ey + ph, C.stoneLt, 1));
    b.push(L(ex, ey + ph / 2, ex + pw, ey + ph / 2, C.stoneLt, 1));
    b.push(T(ex + pw / 2, ey + ph + 30, "4 Türflügel · B", { fill: C.muted, size: 10, anchor: "middle" }));
    b.push(R(900, 250, 220, 100, { fill: "url(#rHatch)", stroke: C.danger, dash: "6 5" }));
    b.push(T(1010, 292, "A-Innenhöhe offen", { fill: C.dangerLt, size: 11, anchor: "middle" }));
    b.push(T(1010, 318, "B-Höhe nicht übertragen", { fill: C.muted, size: 9, anchor: "middle" }));
    b.push(T(900, 430, "AILIM 6 JE SEITE · DEUTUNGSEBENE", { fill: C.stoneLt, size: 11 }));
    b.push(R(900, 465, 72, 70, { fill: C.stone, stroke: C.stoneLt }));
    b.push(R(1048, 465, 72, 70, { fill: C.stone, stroke: C.stoneLt }));
    b.push(T(936, 505, "6", { fill: C.ivory, size: 12, anchor: "middle" }));
    b.push(T(1084, 505, "6", { fill: C.ivory, size: 12, anchor: "middle" }));
    b.push(T(1010, 565, "nicht als lichte Öffnung oder Raumhöhe verwendet", { fill: C.dangerLt, size: 9, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Heichal · Innenraum und Zugang", body: b.join(""),
      unitNote: "A-Innenraum 40 × 20 · Eingang 10 · B-Höhe 20 separat",
      legend: [[C.rambam, "A-Grundriss", "Jechezkel mit B-Parallelen"], [C.ivory, "B-Aufriss", "Eingang 10 × 20 und vier Flügel"], [C.danger, "offen", "A-Innenhöhe und Wandstärken"]],
      nicht: ["Innenhöhe der Vision", "Wandstärken des 40 × 20-Raums", "Übertragung der B-Höhe auf A", "Ailim als lichte Öffnung"],
      foot: "Heichal · Grundrissanker und Referenzportal quellengetrennt"
    });
  }

  /* ══════════ 19 · Karte 16: Kodesch HaKodaschim ══════════ */
  function debir(card) {
    var W = 1240, H = 970, b = [], x = 100, y = 245, s = 18, q = 20 * s;
    b.push(T(x, 175, "A-GRUNDRISS · 20 × 20 AMOT", { fill: C.rambam, size: 13, ls: "1.1" }));
    b.push(R(x, y, q, q, { fill: C.panel, stroke: C.rambam, sw: 3 }));
    b.push(dimH(x, x + q, y + q + 34, "20 Amot · O–W", C.ivory, 10));
    b.push(dimV(y, y + q, x - 16, "20 Amot · N–S", C.ivory, 10));
    var open = 7 * s, oy = y + (q - open) / 2;
    b.push(R(x + q - 5, oy, 10, open, { fill: C.night, stroke: C.ivory, sw: 2 }));
    b.push(T(x + q + 18, oy + open / 2, "lichte Weite 7", { fill: C.ivory, size: 10 }));
    b.push(R(x + q - 2 * s, y, 2 * s, 30, { fill: C.stone, stroke: C.stoneLt }));
    b.push(R(x + q - 2 * s, y + q - 30, 2 * s, 30, { fill: C.stone, stroke: C.stoneLt }));
    b.push(T(x + q - s, y - 12, "Pfeiler 2", { fill: C.stoneLt, size: 9, anchor: "middle" }));
    b.push(T(x, y + q + 70, "Raumhöhe nicht angegeben · keine Übertragung aus anderer Bauperiode", { fill: C.dangerLt, size: 10 }));

    var rx = 635;
    b.push(T(rx, 175, "„HA-PETACH SCHESCH“ · ZWEI LESUNGEN", { fill: C.stoneLt, size: 13, ls: "1" }));
    b.push(R(rx, 240, 220, 270, { fill: C.night, stroke: C.rambam, sw: 2, dash: "6 5" }));
    b.push(L(rx + 110, 450, rx + 110, 330, C.rambam, 8));
    b.push(dimV(330, 450, rx + 85, "6 als Höhe", C.rambam, 9));
    b.push(T(rx + 110, 485, "Raschi", { fill: C.rambam, size: 10, anchor: "middle" }));
    b.push(R(rx + 275, 240, 220, 270, { fill: C.night, stroke: C.waterLt, sw: 2, dash: "6 5" }));
    b.push(L(rx + 330, 390, rx + 440, 390, C.waterLt, 8));
    b.push(dimH(rx + 330, rx + 440, 360, "6 als Türbreite", C.waterLt, 9));
    b.push(T(rx + 385, 485, "Malbim", { fill: C.waterLt, size: 10, anchor: "middle" }));
    b.push(T(rx + 247, 545, "Die Zahl 6 wird nicht mit der ausdrücklich lichten Weite 7 harmonisiert.", { fill: C.dangerLt, size: 10, anchor: "middle" }));

    b.push(T(rx, 635, "B-AUSFÜHRUNG · ZWEITER TEMPEL", { fill: C.stoneLt, size: 11 }));
    b.push(R(rx, 670, 495, 70, { fill: "url(#rHatchQ)", stroke: C.waterLt, dash: "7 6" }));
    b.push(T(rx + 247, 704, "20 volle Ammot O–W · halachische Ausführungsentscheidung", { fill: C.ivory, size: 10, anchor: "middle" }));
    b.push(T(rx + 247, 728, "nicht als zusätzliche Länge an den A-Raum angehängt", { fill: C.dangerLt, size: 9, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Kodesch HaKodaschim · Raum und Zugang", body: b.join(""),
      unitNote: "Raum 20 × 20 · lichte Weite 7 · Zahl 6 achsenstrittig",
      legend: [[C.rambam, "A-Raum", "Jechezkel 20 × 20"], [C.waterLt, "alternative Lesung", "6 als Türbreite"], [C.danger, "offen", "Raumhöhe und Harmonisierung"]],
      nicht: ["Raumhöhe", "Harmonisierung von 6 und 7", "Übertragung fremder Bauhöhen", "Addition der B-20 zur A-Länge"],
      foot: "Debir · Grundrissanker, Zugang und B-Ausführung getrennt"
    });
  }

  /* ══════════ 20 · Karte 19: Register gleichlautender Sechs-Angaben ══════════ */
  function wandregister(card) {
    var W = 1240, H = 930, b = [], u = 18, y = 250;
    var sechs = rowNumber(card, /Hauswand$/, 6);
    b.push(T(85, 185, "DIE ZAHL 6 IN VIER VERSCHIEDENEN BAUTEILTYPEN", { fill: C.stoneLt, size: 13, ls: "1.2" }));

    /* Hauswand: nur Stärke, keine Höhe. */
    b.push(T(105, 222, "HAUSWAND · SCHNITT", { fill: C.ivory, size: 11 }));
    b.push(R(120, y, sechs * u, 230, { fill: "url(#rHatch)", stroke: C.stoneLt, sw: 2, dash: "6 5" }));
    b.push(dimH(120, 120 + sechs * u, y + 260, "6 Amot Stärke", C.stoneLt, 11));
    b.push(TR(102, y + 115, "Höhe nicht angegeben", { fill: C.dangerLt, size: 10 }));

    /* Außenmauer: derselbe Kaneh ist ausdrücklich Stärke und Höhe. */
    var ax = 385, aw = sechs * u;
    b.push(T(ax, 222, "AUSSENMAUER · 40:5", { fill: C.ivory, size: 11 }));
    b.push(R(ax, y + 42, aw, aw, { fill: C.panel, stroke: "url(#rWall)", sw: 4 }));
    b.push(dimH(ax, ax + aw, y + 42 + aw + 30, "1 Kaneh = 6", C.stoneLt, 10));
    b.push(dimV(y + 42, y + 42 + aw, ax - 14, "1 Kaneh = 6", C.stoneLt, 10));

    /* Torzelle: Grundfläche, nicht Wandstärke. */
    var tx = 650;
    b.push(T(tx, 222, "TORZELLE · GRUNDRISS", { fill: C.ivory, size: 11 }));
    b.push(R(tx, y + 42, aw, aw, { fill: C.panel, stroke: C.waterLt, sw: 2 }));
    b.push(dimH(tx, tx + aw, y + 42 + aw + 30, "6 Amot", C.waterLt, 10));
    b.push(dimV(y + 42, y + 42 + aw, tx - 14, "6 Amot", C.waterLt, 10));
    b.push(T(tx + aw / 2, y + 42 + aw / 2 + 4, "6 × 6", { fill: C.ivory, size: 15, anchor: "middle" }));

    /* Fundament: Stärke unten; Höhe und darüberliegende Geometrie offen. */
    var fx = 915;
    b.push(T(fx, 222, "KAMMERFUNDAMENT", { fill: C.ivory, size: 11 }));
    b.push(R(fx, y, aw, 230, { fill: "url(#rHatchQ)", stroke: C.waterLt, sw: 2, dash: "6 5" }));
    b.push(dimH(fx, fx + aw, y + 260, "unten 6 Amot", C.waterLt, 10));
    b.push(TR(fx - 18, y + 115, "Höhe offen", { fill: C.dangerLt, size: 10 }));

    b.push(L(85, 610, W - 85, 610, C.stone, 1, "2 6"));
    b.push(T(85, 645, "HEICHAL-EINGANG · ZWEI GETRENNTE PFEILERBREITEN", { fill: C.stoneLt, size: 12 }));
    b.push(R(150, 685, aw, 55, { fill: C.stone, stroke: C.stoneLt }));
    b.push(R(450, 685, aw, 55, { fill: C.stone, stroke: C.stoneLt }));
    b.push(dimH(150, 150 + aw, 765, "6 Amot je Seite", C.stoneLt, 10));
    b.push(dimH(450, 450 + aw, 765, "6 Amot je Seite", C.stoneLt, 10));
    b.push(T(354, 718, "Eingangsöffnung · Maß auf dieser Karte offen", { fill: C.dangerLt, size: 11, anchor: "middle" }));
    b.push(T(760, 690, "Nicht gleichsetzen:", { fill: C.ivory, size: 12 }));
    b.push(T(760, 716, "Wandstärke · Mauerquerschnitt · Raumgrundfläche · Pfeilerbreite", { fill: C.muted, size: 11 }));
    b.push(T(760, 740, "Die gemeinsame Zahl erzeugt keinen gemeinsamen Baukörper.", { fill: C.dangerLt, size: 11 }));
    return shell(card, {
      W: W, H: H, artLabel: "Sechs-Register · getrennte Schnitte", body: b.join(""),
      unitNote: "6 lange Amot · Achsen und Bauteiltypen getrennt",
      legend: [[C.stoneLt, "durchgezogen", "beide Achsen belegt"], [C.waterLt, "blau", "Grundfläche oder Fundament"], [C.danger, "schraffiert", "Höhe oder Ausdehnung offen"]],
      nicht: ["Höhe der Hauswand", "Höhe des Kammerfundaments", "Höhe der Torzelle", "Gleichsetzung der vier Bauteile"],
      foot: "Maßregister · gleiche Zahl, verschiedene Achsen · keine Verschmelzung"
    });
  }

  /* ══════════ 11 · Karte 20: Westfigur und Quellenkette ══════════ */
  function westfigur(card) {
    var W = 1240, H = 960, b = [], s = 6, x = 90, y = 235;
    var L = rowNumber(card, /Binjan · Länge/i, 90), B = rowNumber(card, /Binjan · Breite/i, 70), wall = rowNumber(card, /Kir HaBinjan/i, 5);
    b.push(T(x, 185, "BINJAN AN DER WESTSEITE · GRUNDFIGUR", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    b.push(R(x, y, L * s, B * s, { fill: C.panel, stroke: C.stoneLt, sw: 3 }));
    b.push(R(x + wall * s, y + wall * s, (L - 2 * wall) * s, (B - 2 * wall) * s,
      { fill: "none", stroke: C.danger, sw: 1.5, dash: "7 6" }));
    b.push(dimH(x, x + L * s, y + B * s + 34, "90 Amot · O–W", C.ivory, 11));
    b.push(dimV(y, y + B * s, x - 18, "70 Amot · N–S", C.ivory, 11));
    b.push(T(x + 18, y + 28, "5-Amot-Wandring", { fill: C.dangerLt, size: 11 }));
    b.push(T(x + 18, y + 48, "Zuordnung nach Raschi/Malbim verschieden", { fill: C.muted, size: 10 }));

    var parts = [4, 10, 5, 6, 20, 6, 19], names = ["Raum", "Zwischen", "Wand", "Kammer", "Freiraum", "Kammer", "Rest"],
        bx = 735, by = 255, ps = 6.2, acc = bx;
    b.push(T(bx, 185, "AUFSCHLÜSSELUNG DER 70 · RASCHI", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    parts.forEach(function (p, i) {
      var ww = p * ps;
      b.push(R(acc, by, ww, 74, { fill: i % 2 ? C.panel : C.water, stroke: C.stoneLt, op: i % 2 ? "1" : ".28" }));
      b.push(T(acc + ww / 2, by + 32, String(p), { fill: C.ivory, size: 12, anchor: "middle" }));
      b.push(T(acc + ww / 2, by + 52, names[i], { fill: C.muted, size: 9, anchor: "middle" }));
      acc += ww;
    });
    b.push(dimH(bx, acc, by + 105, "4 + 10 + 5 + 6 + 20 + 6 + 19 = 70 Amot", C.waterLt, 10));

    b.push(T(bx, 440, "DREI 100-AMOT-BEZÜGE · NICHT ADDIERT", { fill: C.stoneLt, size: 12 }));
    ["Haus / Gesamtfigur · O–W", "Ostfront von Haus und Gizrah · N–S", "Binjan vor der Gizrah · Länge"].forEach(function (lab, i) {
      var yy = 480 + i * 74;
      b.push(R(bx, yy, 400, 24, { fill: i === 1 ? C.water : C.stone, stroke: C.stoneLt, op: ".55" }));
      b.push(T(bx, yy - 8, lab, { fill: C.muted, size: 10 }));
      b.push(T(bx + 410, yy + 17, "100", { fill: C.ivory, size: 12 }));
    });
    b.push(T(bx, 730, "Die drei Versbezüge teilen eine Zahl, aber nicht dieselbe Achse oder denselben Endpunkt.", { fill: C.dangerLt, size: 11 }));
    return shell(card, {
      W: W, H: H, artLabel: "Westfigur · Grundriss und Quellenkette", body: b.join(""),
      unitNote: "90 × 70 Ammot · 5-Amot-Ring auslegungsabhängig",
      legend: [[C.stoneLt, "Grundfigur", "90 O–W × 70 N–S"], [C.water, "Teilketten", "Raschi · 70 in sieben Strecken"], [C.danger, "gestrichelt", "Wandzuordnung oder Endpunkt strittig"]],
      nicht: ["Höhe von Gizrah und Binjan", "sichere Endpunktzuordnung der 90", "bautechnische Gestalt von Attukeha", "Addition der drei 100-Angaben"],
      foot: "Westfigur · A-Maße und B-Aufschlüsselung getrennt · Höhe offen"
    });
  }

  /* ══════════ 12 · Karte 21: Nord- und Südblock ══════════ */
  function kammerbloecke(card) {
    var W = 1240, H = 960, b = [], s = 4, x = 110, bw = 100 * s, bh = 50 * s, gang = 10 * s;
    b.push(T(x, 178, "GRUNDRISS · NORD- UND SÜDBLOCK GESPIEGELT", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    var ny = 220, sy = 560;
    b.push(R(x, ny, bw, bh, { fill: C.panel, stroke: C.stoneLt, sw: 2 }));
    b.push(R(x, sy, bw, bh, { fill: C.panel, stroke: C.waterLt, sw: 2 }));
    b.push(T(x + bw / 2, ny + bh / 2, "NORDBLOCK · 100 × 50", { fill: C.ivory, size: 15, anchor: "middle" }));
    b.push(T(x + bw / 2, sy + bh / 2, "SÜDBLOCK · GLEICHE MAẞE", { fill: C.ivory, size: 15, anchor: "middle" }));
    b.push(R(x, ny + bh + 18, bw, gang, { fill: C.water, stroke: C.waterLt, op: ".25", dash: "6 5" }));
    b.push(R(x, sy - gang - 18, bw, gang, { fill: C.water, stroke: C.waterLt, op: ".25", dash: "6 5" }));
    b.push(T(x + bw / 2, ny + bh + 44, "Gang vor den Kammern · 10 Amot breit", { fill: C.waterLt, size: 11, anchor: "middle" }));
    b.push(T(x + bw / 2, sy - 48, "gespiegelter Gang · innere Struktur offen", { fill: C.waterLt, size: 11, anchor: "middle" }));
    b.push(dimH(x, x + bw, ny - 20, "100 Amot · O–W nach Raschi", C.ivory, 10));
    b.push(dimV(ny, ny + bh, x - 18, "50 Amot · N–S", C.ivory, 10));
    b.push(L(x + bw + 28, ny, x + bw + 28, ny + bh, C.stoneLt, 5));
    b.push(T(x + bw + 42, ny + bh / 2, "äußere Wand · Länge 50 · Stärke offen", { fill: C.muted, size: 10 }));

    var ex = 760, ey = 260;
    b.push(T(ex, 178, "DREI GESCHOSSE · HÖHEN OFFEN", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    for (var i = 0; i < 3; i++) {
      var yy = ey + (2 - i) * 132;
      b.push(R(ex, yy, 330, 92, { fill: "url(#rHatchQ)", stroke: C.waterLt, sw: 2, dash: "6 5" }));
      b.push(T(ex + 24, yy + 38, "Geschoss " + (i + 1), { fill: C.ivory, size: 13 }));
      b.push(T(ex + 306, yy + 38, "Höhe ?", { fill: C.dangerLt, size: 12, anchor: "end" }));
      b.push(T(ex + 24, yy + 64, "Staffelung und Rücksprünge nicht konstruktiv festgelegt", { fill: C.muted, size: 10 }));
    }
    b.push(T(ex, 720, "20 in 42:3 ist ein Textbezug — keine hier neu eingeführte Kammerbreite.", { fill: C.dangerLt, size: 11 }));
    return shell(card, {
      W: W, H: H, artLabel: "Kammerblöcke · Spiegelgrundriss", body: b.join(""),
      unitNote: "100 × 50 Ammot · Gang 10 · Geschosszahl 3",
      legend: [[C.stoneLt, "Nordblock", "A-Maße; Achsenzuordnung B"], [C.waterLt, "Südblock", "textlich gespiegelt"], [C.danger, "Schraffur", "Geschosshöhen und Innenstruktur offen"]],
      nicht: ["Innenstruktur und Rücksprünge", "Geschosshöhen", "sichere Form der Staffelung", "Wandstärke der äußeren Wand"],
      foot: "Nord/Süd-Spiegelung · Grundmaße belegt · vertikale Ausbildung offen"
    });
  }

  /* ══════════ 13 · Karte 22: vier gleich große Eckhöfe ══════════ */
  function eckhoefe(card) {
    var W = 1240, H = 920, b = [], ox = 110, oy = 220, ow = 640, oh = 440, cw = 180, ch = 135;
    b.push(T(ox, 175, "VIER ECKHÖFE · GLEICHES VERSMAẞ", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    b.push(R(ox, oy, ow, oh, { fill: "none", stroke: C.stone, sw: 1.5, dash: "8 7" }));
    [[ox + 22, oy + 22], [ox + ow - cw - 22, oy + 22], [ox + 22, oy + oh - ch - 22], [ox + ow - cw - 22, oy + oh - ch - 22]].forEach(function (p, i) {
      b.push(R(p[0], p[1], cw, ch, { fill: C.panel, stroke: C.waterLt, sw: 2 }));
      b.push(R(p[0] + 10, p[1] + 10, cw - 20, ch - 20, { fill: "none", stroke: C.water, sw: 1, dash: "4 4" }));
      b.push(T(p[0] + cw / 2, p[1] + 56, "ECKHOF " + (i + 1), { fill: C.ivory, size: 12, anchor: "middle" }));
      b.push(T(p[0] + cw / 2, p[1] + 82, "40 × 30 · Einheit offen", { fill: C.waterLt, size: 11, anchor: "middle" }));
      b.push(T(p[0] + cw / 2, p[1] + 105, "Tur saviv · Form offen", { fill: C.muted, size: 9, anchor: "middle" }));
    });
    b.push(T(ox + ow / 2, oy + oh / 2, "Bezirk nur schematisch", { fill: C.faint, size: 12, anchor: "middle" }));
    b.push(T(ox + ow / 2, oy + oh / 2 + 22, "seine Maße sind auf dieser Karte nicht angegeben", { fill: C.faint, size: 10, anchor: "middle" }));

    var rx = 875, ry = 270, rs = 220;
    b.push(T(rx, 175, "B-REFERENZ · GETRENNT", { fill: C.rambam, size: 13, ls: "1.2" }));
    b.push(R(rx, ry, rs, rs, { fill: C.panel, stroke: C.rambam, sw: 2, dash: "7 5" }));
    b.push(T(rx + rs / 2, ry + 90, "40 × 40", { fill: C.ivory, size: 18, anchor: "middle" }));
    b.push(T(rx + rs / 2, ry + 116, "Ammot", { fill: C.rambam, size: 12, anchor: "middle" }));
    b.push(T(rx + rs / 2, ry + 148, "Middot / Rambam", { fill: C.muted, size: 10, anchor: "middle" }));
    b.push(T(rx, ry + rs + 52, "Nicht in Jechezkel 46:22 eingesetzt.", { fill: C.dangerLt, size: 11 }));
    b.push(T(rx, ry + rs + 78, "„Keine Überdachung“ ist B-Deutung von keturot,", { fill: C.muted, size: 10 }));
    b.push(T(rx, ry + rs + 95, "kein A-Maß und keine gezeichnete Dachform.", { fill: C.muted, size: 10 }));
    return shell(card, {
      W: W, H: H, artLabel: "Vier Eckhöfe · Einheiten getrennt", body: b.join(""),
      unitNote: "Jechezkel: 40 × 30 ohne Einheitswort · B-Referenz: 40 × 40 Ammot",
      legend: [[C.waterLt, "vier gleiche Höfe", "40 × 30 in derselben offenen Versebene"], [C.rambam, "B-Referenz", "40 × 40 Ammot, separat"], [C.danger, "offen", "Höhe, Wände und Öffnungen fehlen"]],
      nicht: ["Einheit der 40 × 30", "Höhen und Wandstärken", "Öffnungen", "Gleichsetzung mit 40 × 40 Ammot"],
      foot: "Eckanordnung belegt · Versmaß und Referenzmaß nicht verschmolzen"
    });
  }

  /* ══════════ 14 · Karte 23: Zellmodul des Tores ══════════ */
  function torzellen(card) {
    var W = 1240, H = 960, b = [], s = 11, x = 160, y1 = 265, y2 = 535, depth = 6 * s, border = s;
    var parts = [6, 5, 6, 5, 6], total = 28, passageTop = y1 + depth + border, passageBottom = y2 - border;
    b.push(T(x, 180, "ZWEI ZELLREIHEN · JE DREI ZELLEN", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    function row(y, lower) {
      var xx = x;
      parts.forEach(function (p, i) {
        var isCell = i % 2 === 0, ww = p * s;
        b.push(R(xx, y, ww, depth, { fill: isCell ? C.water : C.stone, stroke: isCell ? C.waterLt : C.stoneLt, sw: 1.5, op: isCell ? ".34" : ".75" }));
        b.push(T(xx + ww / 2, y + depth / 2 + 4, isCell ? "6 × 6" : "Wand 5", { fill: C.ivory, size: isCell ? 11 : 9, anchor: "middle" }));
        xx += ww;
      });
      var by = lower ? y - border : y + depth;
      b.push(R(x, by, total * s, border, { fill: C.rambam, stroke: C.ivory, op: ".55" }));
      b.push(T(x + total * s + 18, by + 9, "Gevul 1", { fill: C.rambam, size: 10 }));
    }
    row(y1, false); row(y2, true);
    b.push(dimH(x, x + total * s, y1 - 28, "6 + 5 + 6 + 5 + 6 = 28 Amot · B-Rechenwert", C.ivory, 10));
    b.push(R(x, passageTop, total * s, passageBottom - passageTop, { fill: "url(#rHatch)", stroke: C.danger, sw: 1.2, dash: "7 6" }));
    b.push(T(x + total * s / 2, (passageTop + passageBottom) / 2, "TORPASSAGE · BREITE AUF DIESER KARTE OFFEN", { fill: C.dangerLt, size: 11, anchor: "middle" }));
    b.push(T(x + total * s / 2, y2 + depth + 42, "3 Zellen je Seite · beidseits der Passage", { fill: C.waterLt, size: 12, anchor: "middle" }));
    b.push(L(x - 55, y1 + depth / 2, x - 55, y2 + depth / 2, C.stoneLt, 2));
    b.push(T(x - 55, y1 - 22, "TORACHSE", { fill: C.stoneLt, size: 10, anchor: "middle" }));

    var hx = 700, hy = 270;
    b.push(T(hx, 180, "AUFRISS · NUR OFFENHEIT", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    b.push(R(hx, hy, 390, 360, { fill: "url(#rHatch)", stroke: C.danger, sw: 2, dash: "7 6" }));
    b.push(T(hx + 195, hy + 150, "HÖHE NICHT ANGEGEBEN", { fill: C.dangerLt, size: 15, anchor: "middle" }));
    b.push(T(hx + 195, hy + 180, "Fenster vorhanden · ohne Maß", { fill: C.muted, size: 11, anchor: "middle" }));
    b.push(T(hx + 195, hy + 204, "Öffnungen nur B-rekonstruiert · ohne Öffnungsmaß", { fill: C.muted, size: 10, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Torzellen · Modulgrundriss", body: b.join(""),
      unitNote: "Zelle 6 × 6 · Zwischenwand 5 · Gevul 1 · drei je Seite",
      legend: [[C.waterLt, "Zelle", "Innenraum 6 × 6 Ammot"], [C.stoneLt, "Zwischenwand", "5 Ammot in Reihenrichtung"], [C.danger, "offen", "Passagebreite, Höhe und Öffnungsmaße"]],
      nicht: ["Passagebreite", "Höhe der Zellen", "Maße der Fenster und Öffnungen", "Verwendung der Zellen"],
      foot: "Zellmodul · 28 als sichtbarer B-Rechenwert · keine erfundene Torbreite"
    });
  }

  /* ══════════ 15 · Karte 24: Gewölbeprinzip und getrennte Wege ══════════ */
  function hohlraeume(card) {
    var W = 1240, H = 1020, b = [];
    b.push(T(80, 180, "GEWÖLBEPRINZIP · SCHNITT OHNE SPANNWEITEN", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    var x = 95, base = 510, vw = 150, vh = 115;
    for (var i = 0; i < 4; i++) {
      var xx = x + i * vw;
      b.push('<path d="M' + xx + ' ' + base + ' V' + (base - 35) + ' A' + (vw / 2) + ' ' + vh + ' 0 0 1 ' + (xx + vw) + ' ' + (base - 35) + ' V' + base + '" fill="none" stroke="' + C.stoneLt + '" stroke-width="3"/>');
    }
    for (var j = 0; j < 2; j++) {
      var ux = x + j * vw * 2;
      b.push('<path d="M' + ux + ' ' + (base - 150) + ' V' + (base - 185) + ' A' + vw + ' ' + (vh * 1.25) + ' 0 0 1 ' + (ux + vw * 2) + ' ' + (base - 185) + ' V' + (base - 150) + '" fill="none" stroke="' + C.waterLt + '" stroke-width="3"/>');
    }
    b.push(T(x + 300, base + 34, "untere Gewölbe nebeneinander", { fill: C.muted, size: 11, anchor: "middle" }));
    b.push(T(x + 300, base - 250, "obere jeweils über zwei unteren", { fill: C.waterLt, size: 11, anchor: "middle" }));
    b.push(T(x, base + 62, "Geometrie, Spannweiten und Tiefen sind ausdrücklich nicht maßstäblich.", { fill: C.dangerLt, size: 10 }));

    var ox = 790, oy = 235, q = 115;
    b.push(T(ox, 180, "ZWEI 1 × 1-AMMAH-ÖFFNUNGEN", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    [[ox, "Beit HaMoked"], [ox + 190, "SW-Ecke · zur Shit"]].forEach(function (p) {
      b.push(R(p[0], oy, q, q, { fill: C.night, stroke: C.ivory, sw: 3 }));
      b.push(dimH(p[0], p[0] + q, oy + q + 30, "1 Ammah", C.ivory, 10));
      b.push(dimV(oy, oy + q, p[0] - 12, "1 Ammah", C.ivory, 10));
      b.push(T(p[0] + q / 2, oy + q + 58, p[1], { fill: C.muted, size: 10, anchor: "middle" }));
      b.push(T(p[0] + q / 2, oy + q + 76, "Tiefe offen", { fill: C.dangerLt, size: 10, anchor: "middle" }));
    });

    b.push(T(790, 520, "WEGE NICHT VERSCHMELZEN", { fill: C.stoneLt, size: 12 }));
    b.push(L(810, 575, 1080, 655, C.waterLt, 5));
    b.push('<path d="M1080 655 l-16 -2 l8 -13 z" fill="' + C.waterLt + '"/>');
    b.push(T(810, 565, "absteigender Gang → Tauchhaus", { fill: C.waterLt, size: 11 }));
    b.push(L(810, 745, 1080, 665, C.rambam, 5));
    b.push('<path d="M1080 665 l-10 13 l-6 -14 z" fill="' + C.rambam + '"/>');
    b.push(T(810, 770, "aufsteigende Mesibah · NO → NW", { fill: C.rambam, size: 11 }));
    b.push(T(810, 800, "Routen, Tiefen und Querschnitte offen", { fill: C.dangerLt, size: 10 }));
    return shell(card, {
      W: W, H: H, artLabel: "Unterbauten · Prinzip- und Öffnungsschnitt", body: b.join(""),
      unitNote: "Nur die beiden Öffnungen 1 × 1 Ammah · übrige Maße offen",
      legend: [[C.stoneLt, "untere Gewölbe", "nebeneinander"], [C.waterLt, "obere Gewölbe", "über je zwei unteren"], [C.rambam, "getrennte Route", "Mesibah nicht mit Abstieg vermischt"]],
      nicht: ["Gewölbespannweiten und Tiefen", "Gangquerschnitte", "Tiefe der 1 × 1-Öffnungen", "Lage des verborgenen Ortes"],
      foot: "Prinzipdarstellung · zwei messbare Öffnungen · keine erfundene Untergrundtopographie"
    });
  }

  /* ══════════ 16 · Karte 25: Wasserorte in getrennten Zeitschichten ══════════ */
  function wasserorte(card) {
    var W = 1240, H = 1010, b = [];
    function node(x, y, w, he, de, col) {
      b.push(R(x, y, w, 78, { fill: C.panel, stroke: col, sw: 2, rx: 8 }));
      b.push(T(x + w / 2, y + 31, he, { fill: C.ivory, size: 16, font: HE, anchor: "middle" }));
      b.push(T(x + w / 2, y + 55, de, { fill: col, size: 11, anchor: "middle" }));
    }
    function arrow(x1, y1, x2, y2, col, dash) {
      b.push(L(x1, y1, x2, y2, col, 2, dash));
      b.push('<path d="M' + x2 + ' ' + y2 + ' l-12 -6 l3 12 z" fill="' + col + '"/>');
    }
    b.push(T(80, 175, "TEXTTOPOGRAPHIE · DREI ZEITSCHICHTEN", { fill: C.stoneLt, size: 13, ls: "1.2" }));
    [250, 470, 690].forEach(function (yy) { b.push(L(80, yy - 38, W - 80, yy - 38, C.stone, 1, "2 7")); });

    b.push(T(85, 230, "DAVID / SCHLOMO · ORTSBELEG", { fill: C.stoneLt, size: 11 }));
    node(250, 260, 260, "גִּיחוֹן", "Gihon · Ort belegt", C.waterLt);
    b.push(T(560, 305, "keine Gestalt · kein Maß", { fill: C.dangerLt, size: 11 }));

    b.push(T(85, 450, "ACHAZ · JESC 8:6", { fill: C.stoneLt, size: 11 }));
    node(250, 480, 300, "מֵי הַשִּׁלֹחַ", "Schiloach · langsam gehende Wasser", C.waterLt);
    b.push(T(600, 524, "nicht mit Chiskijahus Werk gleichgesetzt", { fill: C.dangerLt, size: 11 }));

    b.push(T(85, 670, "CHISKIJAHU / NECHEMJA · GETRENNTE TEXTE", { fill: C.stoneLt, size: 11 }));
    node(190, 700, 220, "גִּיחוֹן", "Quellort", C.waterLt);
    node(510, 700, 260, "לְמַטָּה מַּעְרָבָה", "abwärts / westwärts", C.rambam);
    node(870, 700, 260, "בְּרֵכַת הַשֶּׁלַח", "beim Königsgarten", C.waterLt);
    arrow(410, 739, 500, 739, C.waterLt, "6 5");
    arrow(770, 739, 860, 739, C.waterLt, "6 5");
    b.push(T(870, 805, "Stufen von der Davidstadt: vorhanden · Anzahl offen", { fill: C.muted, size: 10 }));
    b.push(T(190, 836, "Die Pfeile zeigen nur die belegte relative Richtung, keinen identifizierten Leitungsverlauf.", { fill: C.dangerLt, size: 11 }));
    return shell(card, {
      W: W, H: H, artLabel: "Wasserorte · Texttopographie", body: b.join(""),
      unitNote: "Keine Maßzahl · nur Ort, Zeit und relative Richtung",
      legend: [[C.waterLt, "Wasserort", "im jeweiligen Text belegt"], [C.rambam, "Richtung", "abwärts / westwärts"], [C.danger, "Trennlinie", "Zeitschichten nicht verschmolzen"]],
      nicht: ["bauliche Maßzahlen", "identischer Verlauf aller Wassertexte", "moderne Identifikation", "Zukunftsstrom aus Jechezkel 47"],
      foot: "Texttopographie · Zeitschichten getrennt · kein Leitungsplan"
    });
  }

  /* ══════════ 17 · Karte 26: Chiskijahus Wasserwerk, Texte getrennt ══════════ */
  function wasserwerk(card) {
    var W = 1240, H = 950, b = [];
    function panel(x, y, w, h, title, lines, col) {
      b.push(R(x, y, w, h, { fill: C.panel, stroke: col, sw: 2, rx: 10 }));
      b.push(T(x + 22, y + 34, title, { fill: col, size: 13 }));
      lines.forEach(function (z, i) { b.push(T(x + 22, y + 68 + i * 27, "· " + z, { fill: i === 0 ? C.ivory : C.muted, size: 11 })); });
    }
    b.push(T(80, 175, "ZWEI HAUPTTEXTE · KEIN VERSCHMOLZENES TECHNIKPROFIL", { fill: C.stoneLt, size: 13, ls: "1.1" }));
    panel(90, 220, 500, 245, "II MELACHIM 20:20", ["Becken und Leitung", "Ergebnis: Wasser in der Stadt", "keine Richtung · keine Zahl · kein Querschnitt"], C.waterLt);
    panel(650, 220, 500, 245, "II DIVREI HAJAMIM 32:30", ["Verschluss und Umleitung des Gihon", "Richtung: abwärts und westwärts", "keine Zahl · kein technisches Profil"], C.rambam);
    b.push(L(620, 205, 620, 485, C.danger, 2, "7 6"));
    b.push(TR(606, 345, "zwei Aussagen · nicht zu einem Bauplan addiert", { fill: C.dangerLt, size: 10 }));

    panel(90, 525, 500, 170, "JESCHAJAHU 22:9–11 · EIGENER ZEITZEUGE", ["Unteres Becken und Sammelbecken", "Zusammenhang mit den Hauptstellen offen"], C.stoneLt);
    panel(650, 525, 500, 170, "D · ARCHÄOLOGISCHE BEFUNDGRUPPE", ["Schiloach-Damm: 805–795 v. d. Z. · Stand 2025", "älter als die übliche Chiskijahu-Datierung", "kein Schluss auf eine Ammah-Länge"], C.water);
    b.push(L(620, 510, 620, 715, C.danger, 2, "7 6"));
    b.push(T(90, 725, "ARCHÄOLOGIE BLEIBT VOM TANACH-MAẞREGISTER GETRENNT", { fill: C.dangerLt, size: 12, ls: "1" }));
    b.push(R(90, 748, 1060, 48, { fill: "url(#rHatch)", stroke: C.danger, sw: 1.5 }));
    b.push(T(620, 778, "keine Meterzahl → keine Amot · keine Identifikation → kein Leitungsverlauf", { fill: C.ivory, size: 12, anchor: "middle" }));
    return shell(card, {
      W: W, H: H, artLabel: "Wasserwerk · Quellenmatrix", body: b.join(""),
      unitNote: "Keine Tanach-Maßzahl · Befundwerte nur in eigener D-Schicht",
      legend: [[C.waterLt, "Melachim", "Becken und Leitung"], [C.rambam, "Divrei HaJamim", "Verschluss und relative Richtung"], [C.water, "D-Schicht", "archäologisch, datiert, nicht normativ"]],
      nicht: ["Länge und Querschnitt der Leitung", "technische Verbindung aller Objekte", "Ammah-Umrechnung", "Zukunftsstrom aus Jechezkel 47"],
      foot: "Quellenmatrix · Textaussagen und Befund getrennt · kein technischer Bauplan"
    });
  }

  /* ── öffentlich ── */
  var LABEL = {
    grundriss: "Grundriss", masstab: "Maßstabsleiter", flaechen: "Flächenvergleich",
    hoehe: "Höhenschema", tore: "Torschema", strecke: "Streckenschema", ort: "Verortungsschema",
    trennzone: "Trennzonenvergleich", kammern: "Kammerkranz · Zählschema",
    wandregister: "Sechs-Register", westfigur: "Westfigur", kammerbloecke: "Kammerblöcke",
    eckhoefe: "Vier Eckhöfe", torzellen: "Torzellen-Modul", hohlraeume: "Unterbauten",
    wasserorte: "Wasserorte", wasserwerk: "Wasserwerk",
    visionsbezirk: "Visionsbezirk", referenzberg: "Referenzberg", terumah: "Terumat HaKodesch",
    bergtore: "Fünf Bergtore", azarah: "HaAzarah", hoehenstaffel: "Höhenstaffelung",
    torhaus: "Torhaus Jechezkels", haus100: "Haus 100", ulam: "Ulam",
    heichal: "Heichal", debir: "Kodesch HaKodaschim"
  };
  function build(html) {
    var card = parse(html);
    var g = model(card);
    var t = typeOf(card, g);
    var fn = { grundriss: grundriss, masstab: masstab, flaechen: flaechen, hoehe: hoehe, tore: tore, strecke: strecke, ort: ort,
               trennzone: trennzone, kammern: kammern, wandregister: wandregister, westfigur: westfigur,
               kammerbloecke: kammerbloecke, eckhoefe: eckhoefe, torzellen: torzellen,
               hohlraeume: hohlraeume, wasserorte: wasserorte, wasserwerk: wasserwerk,
               visionsbezirk: visionsbezirk, referenzberg: referenzberg, terumah: terumah,
               bergtore: bergtore, azarah: azarah, hoehenstaffel: hoehenstaffel,
               torhaus: torhaus, haus100: haus100, ulam: ulam, heichal: heichal, debir: debir }[t];
    var svg;
    try { svg = fn(card, g); }
    catch (err) { t = "ort"; svg = ort(card, g); }
    return { svg: svg, type: t, label: LABEL[t], card: card, model: g };
  }

  /* Bildauftrag für ein Stimmungsbild — ohne jede Maßbehauptung */
  function prompt(card, g) {
    var teile = card.rows.filter(function (r) { return !offenP(r); }).slice(0, 4)
      .map(function (r) { return r.bauteil; }).join(", ");
    return [
      "Atmospheric architectural impression, not a measured drawing.",
      "Subject: " + card.title + " (" + card.he + "), Second Temple period Jerusalem architecture.",
      teile ? "Elements mentioned in the source: " + teile + "." : "",
      "Style: dark, restrained, monumental stonework in warm limestone and bronze tones,",
      "cool blue-grey light, dust in the air, low sun, no people, no text, no lettering,",
      "no signage, no modern objects, no ritual objects, no altar, no fire, no animals.",
      "Painterly architectural study, muted palette (#0B0E0E background, #B8925D stone, #6E9EAA light),",
      "quiet and documentary rather than dramatic. Do not depict exact proportions or measurements."
    ].filter(Boolean).join(" ");
  }


  /* ══════════════════════════════════════════════════════════════════════
     RÄUMLICHER RISS — Axonometrie aus denselben Maßen.

     Aufgestellt wird nur, was die Karte belegt. Wo eine Höhe fehlt, steht
     kein erfundener Körper, sondern eine gestrichelte Andeutung mit dem
     Vermerk, dass die Höhe nicht überliefert ist. Einheiten verschiedener
     Art werden nie in denselben Körper gerechnet.
     ══════════════════════════════════════════════════════════════════════ */

  /* ── Körper aufstellen ── */
  function box(x, y, z, w, d, h, art, label, oben, lz) {
    return { x: x, y: y, z: z, w: w, d: d, h: h, art: art || "fest", label: label || "", oben: oben || "",
             lz: (lz == null ? null : lz) };
  }

  function szene(card, g, t) {
    var S = { unit: "Ammot", boxes: [], grid: 10, breite: 0, tiefe: 0, notiz: [], nicht: [], teiler: [], kompass: false };

    if (t === "trennzone") {
      var rw = firstRow(card, /Wand.*Erster Tempel/i), rz = firstRow(card, /Zwischenzone/i), rf = firstRow(card, /Zukunftstext/i);
      var v1 = firstNumber(rw && rw.mass, 1), v2 = firstNumber(rz && rz.mass, 1), v3 = firstNumber(rf && rf.mass, 2);
      S.unit = "Ammot"; S.grid = 1; S.breite = 38; S.tiefe = 16;
      S.boxes.push(box(1, 1, -0.4, 8, 14, 0.4, "boden", ""));
      S.boxes.push(box(4.5 - v1 / 2, 2, 0, v1, 12, 8, "offen", "Erster Tempel · Wand " + v1 + " Ammah", "offen"));
      S.boxes.push(box(13, 1, -0.4, 8, 14, 0.4, "boden", ""));
      S.boxes.push(box(16.5 - v2 / 2, 2, 0, v2, 12, 0.22, "zone", "Zweiter Tempel · freier Raum " + v2 + " Ammah"));
      S.boxes.push(box(16.5 - v2 / 2, 2, 0, 0.10, 12, 8, "vorhang", "zwei Vorhänge", "offen"));
      S.boxes.push(box(16.5 + v2 / 2 - 0.10, 2, 0, 0.10, 12, 8, "vorhang", "", "offen"));
      S.boxes.push(box(25, 1, -0.4, 10, 14, 0.4, "boden", ""));
      S.boxes.push(box(29 - v3 / 2, 2, 0, v3, 12, 8, "offen", "Zukunftstext · Trennelement " + v3 + " Amot", "offen"));
      S.teiler = [11, 23];
      S.teilerLabel = "Bauzustand getrennt";
      S.notiz.push("Drei Quellenzustände stehen getrennt nebeneinander; ihre O–W-Breiten 1 · 1 · 2 sind maßstäblich.");
      S.notiz.push("Die Höhe und die Nord–Süd-Ausdehnung sind nicht angegeben; die vertikalen Flächen bleiben gestrichelt offen.");
      S.nicht = ["Höhe", "Nord–Süd-Ausdehnung", "Raumzuordnung innen oder außen", "Lage eines einzelnen Vorhangs im Ersten Tempel"];
      S.legend = [[C.stoneLt, "Breitenmaß", "1 · 1 · 2 Ammot belegt"], [C.waterLt, "freie Zone", "Zweiter Tempel · zwei Vorhänge"], [C.danger, "gestrichelt", "Höhe und N–S offen"]];
      S.foot = "Axonometrischer Quellenvergleich · drei Zustände getrennt · keine erfundene Höhe";
      return S;
    }

    if (t === "kammern") {
      S.unit = "Zählschema · 4 Amot quer"; S.grid = 0; S.breite = 64; S.tiefe = 46; S.kompass = true;
      S.boxes.push(box(12, 9, -0.5, 44, 28, 0.5, "boden", ""));
      S.boxes.push(box(12, 9, 0, 44, 28, 16, "offen", "Kernbau · eigene Maße hier nicht angesetzt", "offen"));
      for (var floor = 0; floor < 3; floor++) {
        var zz = 1 + floor * 5, hh = 3.6;
        for (var i = 0; i < 5; i++) {
          var xx = 14 + i * 8;
          S.boxes.push(box(xx, 5, zz, 7.2, 4, hh, "zaehlung", i === 0 ? "Geschoss " + (floor + 1) + " · 5 N" : ""));
          S.boxes.push(box(xx, 37, zz, 7.2, 4, hh, "zaehlung", i === 0 ? "5 S" : ""));
        }
        S.boxes.push(box(8, 11, zz, 4, 24, hh, "zaehlung", "1 W"));
      }
      S.notiz.push("33 = 11 je Geschoss × 3 Geschosse; je Ebene 5 Nord + 5 Süd + 1 West, Osten frei.");
      S.notiz.push("Nur die Kammerbreite quer zur Hauswand beträgt 4 Amot; Zelllängen und Geschosshöhen sind symbolisch.");
      S.notiz.push("Hauswand 6, äußere Wand oben 5 / unten 6 und Freiraum 20 Amot bleiben als getrennte Querschnittsmaße geführt.");
      S.nicht = ["Länge jeder Einzelkammer", "Geschosshöhen", "Treppen und Zugänge", "Kammern an der Ostseite"];
      S.legend = [[C.water, "Zählkörper", "5 N + 5 S + 1 W je Geschoss"], [C.stoneLt, "Kernbau", "nur Bezugsvolumen, Maße hier offen"], [C.danger, "gestrichelt", "Längen und Höhen nicht beziffert"]];
      S.foot = "Kammerkranz · 33 als Anzahl · Querrichtung 4 Amot · übrige Körpermaße symbolisch";
      return S;
    }

    if (t === "wandregister") {
      S.unit = "Ammot · getrennte Register"; S.grid = 0; S.breite = 82; S.tiefe = 26;
      S.boxes.push(box(0, 2, -0.4, 18, 18, 0.4, "boden", ""));
      S.boxes.push(box(6, 4, 0, 6, 14, 10, "offen", "Hauswand · Stärke 6 · Höhe offen", "offen"));
      S.boxes.push(box(22, 2, -0.4, 18, 18, 0.4, "boden", ""));
      S.boxes.push(box(28, 8, 0, 6, 6, 6, "fest", "Außenmauer · 6 × 6 im Schnitt"));
      S.boxes.push(box(44, 2, -0.4, 16, 18, 0.4, "boden", ""));
      S.boxes.push(box(49, 8, 0, 6, 6, 0.5, "zone", "Torzelle · Grundfläche 6 × 6"));
      S.boxes.push(box(64, 2, -0.4, 18, 18, 0.4, "boden", ""));
      S.boxes.push(box(70, 4, 0, 6, 14, 10, "offen", "Kammerfundament · unten 6 · Höhe offen", "offen"));
      S.teiler = [20, 42, 62]; S.teilerLabel = "anderer Bauteiltyp";
      S.notiz = ["Die Zahl 6 bezeichnet Wandstärke, Mauerquerschnitt, Raumgrundfläche oder Fundamentstärke.",
        "Nur die Außenmauer ist in beiden Schnittachsen mit 1 Kaneh = 6 belegt.", "Offene Höhen bleiben gestrichelt und sind keine Maßbehauptung."];
      S.nicht = ["Höhe der Hauswand", "Höhe von Torzelle und Fundament", "Verschmelzung der vier Sechs-Angaben"];
      S.legend = [[C.stoneLt, "voll", "beide Schnittachsen belegt"], [C.waterLt, "Platte", "nur Grundfläche belegt"], [C.danger, "gestrichelt", "Höhe offen"]];
      S.foot = "Räumliches Maßregister · gleiche Zahl, verschiedene Bauteiltypen";
      return S;
    }

    if (t === "westfigur") {
      S.unit = "Ammot"; S.grid = 10; S.breite = 100; S.tiefe = 94; S.kompass = true;
      S.boxes.push(box(0, 0, -0.6, 90, 70, 0.6, "boden", "Binjan · 90 O–W × 70 N–S"));
      S.boxes.push(box(0, 0, 0, 90, 5, 0.5, "offen", "Kir HaBinjan · 5 · Zuordnung strittig", "offen"));
      S.boxes.push(box(0, 65, 0, 90, 5, 0.5, "offen", "", "offen"));
      S.boxes.push(box(0, 5, 0, 5, 60, 0.5, "offen", "", "offen"));
      S.boxes.push(box(85, 5, 0, 5, 60, 0.5, "offen", "", "offen"));
      [74, 81, 88].forEach(function (yy, i) {
        S.boxes.push(box(0, yy, 0, 100, 2, 0.35, i === 1 ? "zone" : "linie", i === 0 ? "drei getrennte 100-Amot-Bezüge" : ""));
      });
      S.notiz = ["Die belegte Grundfigur misst 90 × 70 Ammot; ihre Höhe ist nicht angegeben.",
        "Der 5-Amot-Wandring ist auslegungsabhängig und liegt nur als offene Markierung auf der Platte.",
        "Die drei 100-Amot-Bezüge sind getrennte Balken und werden weder addiert noch als Körperhöhe benutzt."];
      S.nicht = ["Höhe", "sichere Endpunkte der 90", "technische Gestalt von Attukeha", "Addition der 100-Bezüge"];
      S.foot = "Westfigur · Grundfläche belegt · Höhe und Wandzuordnung offen";
      return S;
    }

    if (t === "kammerbloecke") {
      S.unit = "Ammot · Geschosshöhen symbolisch"; S.grid = 10; S.breite = 100; S.tiefe = 126; S.kompass = true;
      for (var fl = 0; fl < 3; fl++) {
        var zf = fl * 4;
        S.boxes.push(box(0, 0, zf, 100, 50, 3, "offen", fl === 2 ? "Nordblock · 100 × 50 · drei Geschosse" : "", "offen"));
        S.boxes.push(box(0, 76, zf, 100, 50, 3, "offen", fl === 2 ? "Südblock · gespiegelt" : "", "offen"));
      }
      S.boxes.push(box(0, 53, -0.4, 100, 10, 0.4, "zone", "Gang 10 Amot"));
      S.boxes.push(box(0, 63, -0.4, 100, 10, 0.4, "zone", "gespiegelter Bezug"));
      S.notiz = ["Nord- und Südblock tragen dieselben 100 × 50-Ammot-Grundmaße.",
        "Drei Geschosse sind belegt; die gezeichneten gleichen Höhenabstände sind nur ein Zählschema.",
        "Innenstruktur, Rücksprünge und Wandstärken bleiben offen."];
      S.nicht = ["Geschosshöhen", "Innenstruktur und Rücksprünge", "Wandstärken", "sichere Form der Staffelung"];
      S.legend = [[C.danger, "offene Volumen", "Grundfläche und Anzahl belegt, Höhen offen"], [C.waterLt, "Gangstreifen", "10 Amot Breite"], [C.stoneLt, "Spiegelung", "Südblock textlich gleich"]];
      S.foot = "Kammerblöcke · Grundflächen maßstäblich · Vertikale nur als Zählschema";
      return S;
    }

    if (t === "eckhoefe") {
      S.unit = "Versebene ohne genanntes Einheitswort"; S.grid = 0; S.breite = 172; S.tiefe = 90;
      [[0, 0], [58, 0], [0, 50], [58, 50]].forEach(function (p, i) {
        S.boxes.push(box(p[0], p[1], 0, 40, 30, 0.6, "zone", "Eckhof " + (i + 1) + " · 40 × 30 · Einheit offen"));
      });
      S.boxes.push(box(122, 20, 0, 40, 40, 0.6, "offen", "B-Referenz · 40 × 40 Ammot", "offen"));
      S.teiler = [110]; S.teilerLabel = "Einheit nicht gleichsetzen";
      S.notiz = ["Vier Eckhöfe haben in Jechezkel ein gleiches 40 × 30-Versmaß ohne genanntes Einheitswort.",
        "Der 40 × 40-Ammot-Hof aus Middot/Rambam steht in einer getrennten B-Ebene.",
        "Höhen, Wandstärken, Öffnungen und die genaue Form des ringsseitigen Tur bleiben offen."];
      S.nicht = ["Einheit der 40 × 30", "Höhen", "Wandstärken und Öffnungen", "Gleichsetzung mit 40 × 40 Ammot"];
      S.foot = "Vier Eckhöfe · Versmaß intern proportional · B-Referenz getrennt";
      return S;
    }

    if (t === "torzellen") {
      S.unit = "Ammot"; S.grid = 1; S.breite = 28; S.tiefe = 22;
      var xp = 0, ps = [6, 5, 6, 5, 6];
      ps.forEach(function (pv, pi) {
        var art = pi % 2 === 0 ? "zone" : "fest";
        S.boxes.push(box(xp, 0, 0, pv, 6, 0.6, art, pi === 0 ? "3 Zellen · je 6 × 6" : ""));
        S.boxes.push(box(xp, 16, 0, pv, 6, 0.6, art, pi === 0 ? "3 Zellen · Gegenseite" : ""));
        xp += pv;
      });
      S.boxes.push(box(0, 6, 0, 28, 1, 0.35, "linie", "Gevul 1"));
      S.boxes.push(box(0, 15, 0, 28, 1, 0.35, "linie", "Gevul 1"));
      S.notiz = ["Jede Zellreihe folgt 6 + 5 + 6 + 5 + 6 = 28 Ammot; 28 ist der sichtbare B-Rechenwert.",
        "Der Zwischenraum markiert nur die Torpassage; ihre Breite ist nicht angegeben.",
        "Zellhöhen, Fenster- und Öffnungsmaße bleiben offen."];
      S.nicht = ["Passagebreite", "Zellhöhen", "Fenster- und Öffnungsmaße", "Verwendung"];
      S.legend = [[C.waterLt, "Zellplatte", "6 × 6 Ammot"], [C.stoneLt, "Zwischenwand", "5 Ammot"], [C.bronze, "Gevul", "1 Ammah je Seite"]];
      S.foot = "Torzellen · Grundrissmaßstäblich · Höhe nicht aufgestellt";
      return S;
    }

    if (t === "hohlraeume") {
      S.unit = "Nur Öffnungen 1 × 1 Ammah; übrige Geometrie symbolisch"; S.grid = 0; S.breite = 86; S.tiefe = 32;
      S.boxes.push(box(0, 0, -0.4, 18, 18, 0.4, "boden", ""));
      S.boxes.push(box(8, 8, 0, 1, 1, 5, "offen", "Beit HaMoked · Öffnung 1 × 1 · Tiefe offen", "offen"));
      S.boxes.push(box(22, 0, -0.4, 18, 18, 0.4, "boden", ""));
      S.boxes.push(box(30, 8, 0, 1, 1, 5, "offen", "SW-Ecke · Öffnung 1 × 1 · Tiefe offen", "offen"));
      S.boxes.push(box(46, 2, 0, 16, 10, 3, "offen", "untere Gewölbe nebeneinander", "offen"));
      S.boxes.push(box(46, 16, 0, 16, 10, 3, "offen", "zweite untere Gruppe", "offen"));
      S.boxes.push(box(66, 5, 4, 18, 18, 3, "zone", "obere über je zwei · Prinzip"));
      S.teiler = [20, 42]; S.teilerLabel = "getrennter Befund";
      S.notiz = ["Nur die beiden Bodenöffnungen besitzen ein Maß: je 1 × 1 Ammah; ihre Tiefe fehlt.",
        "Die Gewölbekörper zeigen ausschließlich das 2→1-Prinzip, keine Spannweite oder Tiefe.",
        "Absteigender Gang und aufsteigende Mesibah werden nicht zu einer Route verbunden."];
      S.nicht = ["Gewölbespannweiten", "Tiefen", "Gangquerschnitte", "Lage des verborgenen Ortes"];
      S.foot = "Unterbauten · Öffnungsmaße belegt · Gewölbe nur als Prinzip";
      return S;
    }

    if (t === "wasserorte") {
      S.unit = "ohne Maßstab · Zeitschichten"; S.grid = 0; S.breite = 98; S.tiefe = 32;
      S.boxes.push(box(0, 4, 0, 26, 22, 0.6, "wasser", "Gihon · Ortsbeleg David/Schlomo"));
      S.boxes.push(box(36, 4, 0, 26, 22, 0.6, "wasser", "Schiloach · Achaz · langsam gehende Wasser"));
      S.boxes.push(box(72, 4, 0, 26, 22, 0.6, "wasser", "Chiskijahu / Nechemja · relative Richtung"));
      S.teiler = [31, 67]; S.teilerLabel = "andere Zeitschicht";
      S.notiz = ["Die drei Platten sind Textschichten, keine maßstäblichen Gelände- oder Leitungsabschnitte.",
        "Gihon, älterer Schiloach-Text und spätere Wasserwerke werden nicht zu einer Anlage verschmolzen.",
        "Abwärts / westwärts ist die einzige gezeichnete Richtungsinformation."];
      S.nicht = ["Maßzahlen", "Leitungsverlauf", "moderne Identifikation", "Jechezkel-47-Strom"];
      S.legend = [[C.waterLt, "Textplatte", "Wasserort belegt"], [C.danger, "Trennebene", "Zeit oder Quelle getrennt"], [C.stoneLt, "ohne Maßstab", "keine räumliche Distanz"]];
      S.foot = "Texttopographie · axonometrische Schichten, keine Geländeform";
      return S;
    }

    if (t === "wasserwerk") {
      S.unit = "ohne Maßstab · Quellenmatrix"; S.grid = 0; S.breite = 112; S.tiefe = 54;
      S.boxes.push(box(0, 0, 0, 48, 22, 0.7, "wasser", "II Melachim · Becken und Leitung"));
      S.boxes.push(box(64, 0, 0, 48, 22, 0.7, "zone", "II Divrei HaJamim · abwärts / westwärts"));
      S.boxes.push(box(0, 32, 0, 48, 22, 0.7, "offen", "Jeschajahu 22 · eigener Zeitzeuge", "offen"));
      S.boxes.push(box(64, 32, 0, 48, 22, 0.7, "offen", "D-Schicht · 805–795 v. d. Z.", "offen"));
      S.teiler = [56]; S.teilerLabel = "Quellen nicht addiert";
      S.notiz = ["Vier Platten bilden eine Quellenmatrix und keinen technischen Leitungsverlauf.",
        "Melachim und Divrei HaJamim nennen verschiedene Handlungen und Objekte.",
        "Der archäologische Befund bleibt datiert, separat und ohne Ammah-Schluss."];
      S.nicht = ["Leitungslänge und Querschnitt", "Verbindung aller Objekte", "Ammah-Umrechnung", "Jechezkel-47-Strom"];
      S.legend = [[C.waterLt, "Tanachplatte", "Textaussage"], [C.danger, "offene Platte", "Zusammenhang oder Identifikation offen"], [C.stoneLt, "ohne Maßstab", "keine Distanz oder Höhe"]];
      S.foot = "Quellenmatrix · räumlich getrennt, nicht als Leitung rekonstruiert";
      return S;
    }

    if (t === "visionsbezirk") {
      S.unit = "drei getrennte Maßebenen"; S.grid = 0; S.breite = 110; S.tiefe = 34;
      S.boxes.push(box(0, 2, 0, 30, 30, 0.7, "fest", "42:16–19 · 500 × 500 Kanim"));
      S.boxes.push(box(40, 2, 0, 30, 30, 0.7, "zone", "42:20 · 500 × 500 · Einheit nicht wiederholt"));
      S.boxes.push(box(80, 2, 0, 30, 30, 0.7, "offen", "B · 3000 × 3000 Ammot", "offen"));
      S.teiler = [35, 75]; S.teilerLabel = "anderer Maßstab";
      S.notiz = ["Die drei Platten sind gleich groß gezeichnet, stehen aber ausdrücklich nicht im selben Maßstab.",
        "Nur die Seitenverse nennen Kanim; 42:20 wiederholt die Einheit bei 500 × 500 nicht.",
        "3000 × 3000 Ammot ist eine getrennte B-Rechnung mit Kaneh = 6 Ammot."];
      S.nicht = ["Mauerhöhe und -dicke", "Bebauung im Bezirk", "Meterumrechnung", "unbegründete Gleichsetzung der Platten"];
      S.foot = "Visionsbezirk · axonometrischer Quellenvergleich, keine gemeinsame Skala";
      return S;
    }

    if (t === "referenzberg") {
      S.unit = "Ammot außen · innere Größe symbolisch"; S.grid = 100; S.breite = 500; S.tiefe = 500; S.kompass = true;
      S.boxes.push(box(0, 0, -1, 500, 500, 1, "boden", "Har HaBajit · 500 × 500 Ammot"));
      S.boxes.push(box(30, 60, 0, 300, 230, 1, "offen", "Asarah · Größe offen · Lage nur nach Rang", "offen"));
      S.notiz = ["Außenquadrat 500 × 500 Ammot maßstäblich; die Asarah-Platte besitzt keine ablesbare Größe.",
        "Ihre Lage zeigt nur Süd > Ost > Nord > West: Süden am weitesten, Westen am nächsten.",
        "Unterbau und doppelter Portikus sind belegt, aber mangels Maßen nicht aufgestellt."];
      S.nicht = ["Asarah-Größe", "numerische Randabstände", "Mauerhöhe und -stärke", "Unterbau- und Portikusmaße"];
      S.legend = [[C.stoneLt, "Außenplatte", "500 × 500 Ammot"], [C.danger, "offene Innenplatte", "nur Ranglage"], [C.stone, "Raster", "100-Ammot-Außenbezug"]];
      S.foot = "Referenzberg · Außenmaß maßstäblich · Innenlage nur relational";
      return S;
    }

    if (t === "terumah") {
      S.unit = "Großzahlen ohne Einheit · Heiligtum eigene Skala"; S.grid = 0; S.breite = 76; S.tiefe = 60;
      S.boxes.push(box(0, 0, 0, 25, 20, 0.6, "fest", "Priester · 25.000 × 10.000 · Einheit offen"));
      S.boxes.push(box(0, 20, 0, 25, 20, 0.6, "zone", "Leviten · 25.000 × 10.000 · Einheit offen"));
      S.boxes.push(box(0, 40, 0, 25, 10, 0.6, "linie", "Stadt · 25.000 × 5.000 · Einheit offen"));
      S.boxes.push(box(45, 8, 0, 20, 20, 0.6, "offen", "Heiligtum · 500 × 500 · Einheit offen", "offen"));
      S.boxes.push(box(43, 6, -0.2, 24, 24, 0.2, "linie", "Migrasch 50 Ammah · eigene Skala"));
      S.boxes.push(box(45, 38, 0, 20, 14, 5, "offen", "Mikdasch-Gebäude · Maße offen", "offen"));
      S.teiler = [35]; S.teilerLabel = "Skalen nicht gleichsetzen";
      S.notiz = ["Die drei Landstreifen sind nur nach ihren Zahlen 10.000 : 10.000 : 5.000 proportioniert.",
        "Das 500 × 500-Heiligtumsquadrat steht in einer eigenen, nicht gleichgesetzten Skala.",
        "Nur der ringsseitige Migrasch nennt ausdrücklich 50 Ammah."];
      S.nicht = ["Einheit der Großzahlen", "Einheit des 500er-Quadrats", "Mikdasch-Gebäudemaße", "moderne Landkoordinaten"];
      S.foot = "Terumah · Landordnung proportional innerhalb der Ebene · Skalen getrennt";
      return S;
    }

    if (t === "bergtore") {
      S.unit = "Ammot · fünf getrennte Öffnungsebenen"; S.grid = 0; S.breite = 118; S.tiefe = 18;
      ["West 1", "Ost 1", "Nord 1 · Tadi", "Süd 1", "Süd 2"].forEach(function (lab, i) {
        var xx = i * 24;
        S.boxes.push(box(xx, 4, -0.4, 20, 10, 0.4, "boden", ""));
        S.boxes.push(box(xx + 5, 8, 0, 10, 0.5, 20, i === 2 ? "offen" : "tor", lab + " · lichte Öffnung 10 × 20", i === 2 ? "offen" : ""));
      });
      S.teiler = [22, 46, 70, 94]; S.teilerLabel = "Torposition offen";
      S.notiz = ["Fünf isolierte Öffnungsebenen bewahren die Verteilung W1 · O1 · N1 · S2.",
        "Ihre Abstände sind keine Bergtor-Positionen; diese bleiben entlang der Seiten offen.",
        "Das Nord-/Tadi-Modul bleibt wegen der besonderen Sturzform gestrichelt."];
      S.nicht = ["Positionen entlang der Seiten", "Mauerstärke", "Durchgangstiefe", "Türflügel- und Tadi-Maße"];
      S.foot = "Fünf Bergtore · Öffnungsmaße aufgestellt · Lage und Baukörper offen";
      return S;
    }

    if (t === "azarah") {
      S.unit = "Ammot"; S.grid = 25; S.breite = 187; S.tiefe = 135; S.kompass = true;
      S.boxes.push(box(0, 0, -0.8, 187, 135, 0.8, "boden", "HaAzarah · 187 × 135"));
      function gateNS(xx, yy, lab) { S.boxes.push(box(xx - 5, yy, 0, 10, 1, 20, "offen", lab + " · 10 × 20 · Position schematisch", "offen")); }
      gateNS(187 * .25, 0, "Nordtor"); gateNS(187 * .5, 0, "Nordtor"); gateNS(187 * .75, 0, "Nordtor");
      gateNS(187 * .25, 134, "Südtor"); gateNS(187 * .5, 134, "Südtor"); gateNS(187 * .75, 134, "Südtor");
      S.boxes.push(box(186, 62.5, 0, 1, 10, 20, "tor", "Osttor · mittig · 10 × 20"));
      S.notiz = ["Grundfläche 187 × 135 Ammot und Osttor-Mitte sind maßstäblich.",
        "Drei Nord- und drei Südtore stehen nur nach Seitenanzahl; ihre Positionen sind schematisch.",
        "Die vier Längenketten werden im 2D-Riss geführt und nicht zu Innenwänden erhoben."];
      S.nicht = ["Positionen der sechs Nord-/Südtore", "Wandstärken", "Baukörperhöhen", "Innenwände aus Maßketten"];
      S.legend = [[C.stoneLt, "Bodenplatte", "187 × 135 Ammot"], [C.danger, "offene Torflächen", "Seite und Maß belegt, Position offen"], [C.ivory, "Osttor", "mittig belegt"]];
      S.foot = "HaAzarah · Grundfläche maßstäblich · Seitenpositionen der Tore offen";
      return S;
    }

    if (t === "hoehenstaffel") {
      S.unit = "Ammot Höhe · Landungslängen symbolisch"; S.grid = 0; S.breite = 44; S.tiefe = 12;
      var sxh = 0, zh = 0;
      function land(lab) { S.boxes.push(box(sxh, 0, zh, 2, 10, .35, "offen", lab + " · Länge offen", "offen")); sxh += 2; }
      function steps(n, tread, rise, lab) {
        for (var i = 0; i < n; i++) {
          S.boxes.push(box(sxh, 0, 0, tread, 10, zh + rise, "fest", i === n - 1 ? lab : ""));
          sxh += tread; zh += rise;
        }
      }
      land("Osttor/Chajl"); steps(12, .5, .5, "12 Stufen · +6"); land("Ezrat Naschim");
      steps(15, .5, .5, "15 Stufen · +7,5"); land("Ezrat Jisrael");
      steps(1, 1, 1, "1-Ammah-Stufe"); steps(3, .5, .5, "Duchan · +1,5"); land("Ezrat Kohanim");
      steps(12, 1, .5, "12 Stufen · +6"); land("Ulam/Heichal · Höhe 22");
      S.breite = sxh; S.notiz = ["Stufenhöhen und genannte Auftritte sind maßstäblich; offene Landungslängen nur zwei Zeichnungseinheiten breit.",
        "Die 15 Stufen sind im Plan halbkreisförmig; diese Axonometrie zeigt nur ihr Höhenprofil.",
        "Der Endstand beträgt genau 22 Ammot über dem Boden des östlichen Tores."];
      S.nicht = ["Breite der Stufenläufe", "Längen der ebenen Höfe", "halbkreisförmiger Plan der 15 Stufen", "weitere Steigungen"];
      S.foot = "Höhenstaffelung · Treppenprofil maßstäblich, Landungen unmaßstäblich";
      return S;
    }

    if (t === "torhaus") {
      S.unit = "Ammot · Teilmaße getrennt"; S.grid = 0; S.breite = 72; S.tiefe = 26;
      var xg = 0, psg = [6, 5, 6, 5, 6];
      psg.forEach(function (v, i) {
        var art = i % 2 === 0 ? "zone" : "fest";
        S.boxes.push(box(xg, 0, 0, v, 6, .6, art, i === 0 ? "3 Zellen · 6 × 6" : ""));
        S.boxes.push(box(xg, 16, 0, v, 6, .6, art, i === 0 ? "Gegenseite" : "")); xg += v;
      });
      S.boxes.push(box(0, 6, 0, 28, 1, .35, "linie", "Gevul 1"));
      S.boxes.push(box(0, 7, 0, 28, 9, .25, "wasser", "Passage · lichte Breite 10"));
      S.boxes.push(box(0, 15, 0, 28, 1, .35, "linie", "Gevul 1"));
      S.boxes.push(box(40, 2, 0, 25, 2, .5, "tor", "Messlinie 25 · Dach zu Dach"));
      S.boxes.push(box(40, 9, 0, 30, 2, .5, "offen", "50 als Länge · eigener Bezug", "offen"));
      S.boxes.push(box(40, 16, 0, 2, 2, 20, "offen", "50 als Höhe · nur alternative Lesung", "offen"));
      S.teiler = [34]; S.teilerLabel = "Messlinien nicht summiert";
      S.notiz = ["Das Zellmodul 6/5/6/5/6 und die 10-Amot-Passage sind als Grundrissplatten geführt.",
        "25, 50 und die Textcrux 60 sind keine Außenbox 50 × 25.",
        "Zell- und Torhaushöhen bleiben offen; die 50-Höhe ist nur eine getrennte Raschi-Lesung."];
      S.nicht = ["Torhaus als 50 × 25-Quader", "Toranzahl 13", "Zellhöhen", "Pfeiler-60-Geometrie"];
      S.foot = "Torhaus Jechezkels · Modulgrundriss und Messlinien getrennt";
      return S;
    }

    if (t === "haus100") {
      S.unit = "Ammot · A/B getrennt"; S.grid = 0; S.breite = 238; S.tiefe = 110; S.kompass = true;
      S.boxes.push(box(0, 15, 0, 100, 70, .7, "fest", "B-Kernkörper · 100 × 70"));
      S.boxes.push(box(90, 0, .7, 10, 100, .5, "zone", "Ulam-Front · 70 + 15 + 15 = 100"));
      S.boxes.push(box(106, 4, 0, 2, 2, 100, "linie", "B-Gesamthöhe 100"));
      S.boxes.push(box(138, 15, 0, 90, 70, .7, "offen", "A-Westgebäude · 90 × 70", "offen"));
      S.boxes.push(box(138, 92, 0, 100, 3, .5, "linie", "A-Hauslänge / Ostfront · 100-Bezüge"));
      S.teiler = [120]; S.teilerLabel = "B-Plan / A-Ebene";
      S.notiz = ["Links: B-Kernkörper 100 × 70, Ulam-Front 100 und vertikaler Gesamthöhen-Datum 100.",
        "Rechts: Jechezkel-Westgebäude 90 × 70; seine Höhe bleibt offen.",
        "Die beiden 100-Bezugssysteme werden nicht zu einem einzigen Quader verschmolzen."];
      S.nicht = ["Höhe des A-Westgebäudes", "gemeinsame Wandgliederung A/B", "Verschmelzung der beiden Pläne", "moderne Umrechnung"];
      S.foot = "Haus 100 · B-Kernbau und A-Westgebäude räumlich getrennt";
      return S;
    }

    if (t === "ulam") {
      S.unit = "A und B getrennt"; S.grid = 0; S.breite = 82; S.tiefe = 36;
      S.boxes.push(box(0, 4, 0, 11, 20, .6, "zone", "A-Ulam · Grundriss 11 × 20"));
      S.boxes.push(box(11, 4, 0, .5, 3, 6, "offen", "Seitenmaß 3", "offen"));
      S.boxes.push(box(11, 21, 0, .5, 3, 6, "offen", "Seitenmaß 3", "offen"));
      S.boxes.push(box(26, 6, 0, 20, .6, 40, "tor", "B-Portal · 20 × 40"));
      S.boxes.push(box(52, 2, 0, 12, 15, .5, "zone", "B-Ulam-Vorsprung Nord · 15"));
      S.boxes.push(box(52, 19, 0, 12, 15, .5, "zone", "B-Ulam-Vorsprung Süd · 15"));
      S.boxes.push(box(70, 6, 0, 10, 20, 8, "offen", "A-Baukörperhöhe offen", "offen"));
      S.teiler = [20, 49, 67]; S.teilerLabel = "Quelle / Achse getrennt";
      S.notiz = ["A-Grundriss 11 × 20, B-Portal 20 × 40 und B-Seitenvorsprünge 15 stehen getrennt.",
        "Die Portalhöhe 40 ist keine Baukörperhöhe der Vision.",
        "Die offene A-Höhe bleibt als gestrichelter Hinweis ohne ablesbaren Zahlenwert."];
      S.nicht = ["A-Baukörperhöhe", "Übertragung der B-Portalhöhe", "sichere B-Ulam-Wand", "14 als Verszahl"];
      S.foot = "Ulam · Grundriss, Portal und Vorsprünge quellengetrennt";
      return S;
    }

    if (t === "heichal") {
      S.unit = "Ammot · A-Grundriss / B-Portal"; S.grid = 5; S.breite = 68; S.tiefe = 28;
      S.boxes.push(box(0, 4, 0, 40, 20, .6, "boden", "A-Heichal · innen 40 × 20"));
      S.boxes.push(box(39.5, 4, .6, .5, 5, 4, "offen", "Wandstück 5", "offen"));
      S.boxes.push(box(39.5, 19, .6, .5, 5, 4, "offen", "Wandstück 5", "offen"));
      S.boxes.push(box(39.5, 9, .6, .5, 10, .4, "tor", "A-Eingang · Breite 10"));
      S.boxes.push(box(50, 9, 0, 10, .6, 20, "tor", "B-Portal · 10 × 20"));
      S.boxes.push(box(64, 5, 0, 2, 6, 8, "offen", "Ailim 6 je Seite · Deutung", "offen"));
      S.boxes.push(box(64, 17, 0, 2, 6, 8, "offen", "", "offen"));
      S.teiler = [45, 62]; S.teilerLabel = "Quelle / Bauteil getrennt";
      S.notiz = ["Der A-Innenraum 40 × 20 liegt als Bodenplatte; seine Höhe ist nicht aufgestellt.",
        "Die Ostöffnung 10 und ihre beiden 5-Amot-Wandstücke sind im Grundriss geführt.",
        "Das 10 × 20-B-Portal und die Ailim-6-Deutung stehen in getrennten Feldern."];
      S.nicht = ["A-Innenhöhe", "Wandstärken", "Übertragung der B-Höhe auf A", "Ailim als lichte Öffnung"];
      S.foot = "Heichal · A-Grundriss maßstäblich · B-Portal separat";
      return S;
    }

    if (t === "debir") {
      S.unit = "Ammot · Zugangsauslegungen getrennt"; S.grid = 2; S.breite = 84; S.tiefe = 28;
      S.boxes.push(box(0, 4, 0, 20, 20, .6, "boden", "A-Debir · 20 × 20"));
      S.boxes.push(box(19.5, 4, .6, .5, 6.5, 4, "offen", "", "offen"));
      S.boxes.push(box(19.5, 17.5, .6, .5, 6.5, 4, "offen", "", "offen"));
      S.boxes.push(box(19.5, 10.5, .6, .5, 7, .4, "tor", "lichte Weite 7"));
      S.boxes.push(box(30, 6, 0, 2, 2, 6, "offen", "Raschi · 6 als Höhe", "offen"));
      S.boxes.push(box(42, 6, 0, 6, 2, .5, "zone", "Malbim · 6 als Breite"));
      S.boxes.push(box(58, 4, 0, 20, 20, .5, "offen", "B-Ausführung · 20 volle Ammot", "offen"));
      S.teiler = [25, 37, 53]; S.teilerLabel = "Lesung / Bauperiode";
      S.notiz = ["Der A-Raum 20 × 20 und die lichte Öffnungsweite 7 sind gemeinsam belegt.",
        "Die Zahl 6 steht als Höhen- und Breitenlesung in getrennten Feldern und wird nicht mit 7 harmonisiert.",
        "Die B-Ausführung 20 volle Ammot wird nicht an die A-Länge angehängt."];
      S.nicht = ["Raumhöhe", "Harmonisierung von 6 und 7", "fremde Bauhöhen", "Addition der B-20"];
      S.foot = "Kodesch HaKodaschim · Raum, Zugangsauslegung und B-Ausführung getrennt";
      return S;
    }

    if (t === "grundriss" && g.rect) {
      var L = g.rect.L, B = g.rect.B;
      S.breite = L; S.tiefe = B; S.kompass = true;
      var hw = (g.opening && g.opening.h) ? g.opening.h : Math.max(6, Math.round(Math.min(L, B) / 12));
      var dick = Math.max(2, Math.round(Math.min(L, B) / 60));
      var hoeheBelegt = !!(g.opening && g.opening.h);
      S.notiz.push(hoeheBelegt
        ? "Mauerhöhe nicht überliefert — hier auf die belegte Torhöhe von " + g.opening.h + " Ammot gesetzt und offen gelassen."
        : "Mauerhöhe nicht überliefert — die Mauern stehen nur als Andeutung.");
      S.notiz.push("Mauerstärke nicht überliefert — hier als schmales Band gezeigt.");

      /* Hoffläche */
      S.boxes.push(box(0, 0, -0.8, L, B, 0.8, "boden", ""));

      /* Osttor, wenn seine Lage belegt ist: die Ostmauer bekommt eine echte Lücke */
      var ostMittig = card.rows.some(function (r) { return /Osttor/i.test(r.bauteil) && /mittig/i.test(r.mass); });
      var ob = (g.opening && g.opening.b) ? g.opening.b : 0;
      var wandArt = "andeutung";

      /* Nord- und Südmauer (längs, O–W) */
      S.boxes.push(box(0, 0, 0, L, dick, hw, wandArt, "", "offen"));
      S.boxes.push(box(0, B - dick, 0, L, dick, hw, wandArt, "", "offen"));
      /* Westmauer */
      S.boxes.push(box(0, dick, 0, dick, B - 2 * dick, hw, wandArt, "", "offen"));
      /* Ostmauer, gegebenenfalls geteilt */
      if (ostMittig && ob) {
        var y1 = dick, y2 = (B - ob) / 2, y3 = y2 + ob;
        S.boxes.push(box(L - dick, y1, 0, dick, y2 - y1, hw, wandArt, "", "offen"));
        S.boxes.push(box(L - dick, y3, 0, dick, B - dick - y3, hw, wandArt, "", "offen"));
        S.boxes.push(box(L - dick, y2, 0, dick, ob, 0.4, "tor", "Osttor " + ob + " × " + g.opening.h, "", hw * 1.15));
      } else {
        S.boxes.push(box(L - dick, dick, 0, dick, B - 2 * dick, hw, wandArt, "", "offen"));
        if (g.gates) S.nicht.push(g.gates.n + " Tore belegt — Lage nicht angegeben, daher keine Öffnung gesetzt");
      }

      /* Innenkörper mit belegter Grundfläche, Höhe offen */
      g.blocks.forEach(function (blk) {
        var ecken = [[0, 0], [L - blk.b, 0], [0, B - blk.t], [L - blk.b, B - blk.t]].slice(0, blk.n);
        ecken.forEach(function (e, i) {
          S.boxes.push(box(e[0], e[1], 0, blk.b, blk.t, hw * 0.9, "offen", i === 0 ? blk.b + " × " + blk.t : "", "offen"));
        });
        S.nicht.push(blk.bauteil + ": Höhe nicht angegeben");
      });
      g.offen.forEach(function (o) { S.nicht.push(o); });
      g.fremd.forEach(function (f) { S.nicht.push(f.bauteil + " (" + f.b + " × " + f.t + ", eigene Ebene) — nicht mitgestellt"); });
      return S;
    }

    if (t === "tore" && g.opening) {
      var ow = g.opening.b, oh = g.opening.h, wd = Math.max(3, Math.round(ow / 3));
      var flanke = ow * 1.2;
      S.unit = "Ammot"; S.grid = 5;
      S.breite = ow + 2 * flanke; S.tiefe = wd * 4;
      S.boxes.push(box(0, 0, -0.6, S.breite, S.tiefe, 0.6, "boden", ""));
      var yy = (S.tiefe - wd) / 2;
      S.boxes.push(box(0, yy, 0, flanke, wd, oh, "andeutung", "", "offen"));
      S.boxes.push(box(flanke + ow, yy, 0, flanke, wd, oh, "andeutung", "", "offen"));
      var sturz = card.rows.some(function (r) { return /Sturz|Tadi/i.test(r.bauteil); });
      if (sturz) S.notiz.push("Sturz belegt; die Ausnahme des Tadi-Tors bleibt hier ungezeichnet.");
      S.boxes.push(box(flanke, yy, oh, ow, wd, Math.max(2, oh / 10), "fest", "Sturz"));
      S.boxes.push(box(flanke, yy + wd / 2 - 0.3, 0, ow, 0.6, 0.4, "tor", "lichte Öffnung " + ow + " × " + oh, "", oh * 0.5));
      S.notiz.push("Mauerhöhe über dem Sturz nicht überliefert; Tiefe des Durchgangs nicht angegeben.");
      S.nicht = g.offen.concat(["Lage der Tore an den Seiten", "Mauerstärke und Durchgangstiefe"]);
      return S;
    }

    if (t === "hoehe" && g.hoehen.length) {
      var x = 0;
      S.grid = 5;
      g.hoehen.slice(0, 3).forEach(function (h, i) {
        var einheit = /Tefach/i.test(h.einheit) ? "Tefachim" : (/Etzba/i.test(h.einheit) ? "Etzba’ot" : "Ammot");
        var laenge = Math.max(14, h.v * 2.2), dicke = Math.max(1.4, h.v / 7);
        S.boxes.push(box(x, 0, -0.5, laenge, dicke * 4, 0.5, "boden", ""));
        S.boxes.push(box(x, dicke * 1.5, 0, laenge, dicke, h.v, h.strittig ? "offen" : "fest",
          h.bauteil + " · " + h.v + " " + einheit, h.strittig ? "offen" : ""));
        if (h.strittig) {
          S.boxes.push(box(x, dicke * 1.5 + dicke + 1, 0, h.v, dicke, dicke, "offen", "dieselbe Zahl als Breite gelesen"));
          S.notiz.push(h.bauteil + ": die Achse ist strittig — beide Lesungen stehen nebeneinander.");
        }
        x += laenge + 12;
        if (i < Math.min(g.hoehen.length, 3) - 1) S.teiler.push(x - 6);
      });
      S.breite = x; S.tiefe = 20;
      S.notiz.push("Die Körper stehen in verschiedenen Einheiten und sind untereinander nicht vergleichbar.");
      S.unit = "Einheit der Quelle";
      S.nicht = g.offen;
      return S;
    }

    if (t === "masstab") {
      S.unit = "Verhältnis"; S.grid = 1;
      /* Mauerquerschnitt ein Kaneh im Geviert, Länge sechs Ammot */
      S.boxes.push(box(0, 0, -0.4, 26, 14, 0.4, "boden", ""));
      S.boxes.push(box(2, 4, 0, 18, 6, 6, "fest", "Außenmauer · ein Kaneh dick und hoch"));
      for (var i2 = 1; i2 < 6; i2++) S.boxes.push(box(2 + i2 * 3, 4, 0, 0.14, 6, 6.02, "linie", ""));
      S.boxes.push(box(2, 12, 0, 3, 1, 1, "fest", "eine Ammah = sechs Tefachim"));
      S.boxes.push(box(6, 12, 0, 2.5, 1, 1, "offen", "Geräte-Ammah = fünf Tefachim"));
      S.breite = 26; S.tiefe = 14;
      S.notiz.push("Verhältnisse, keine Längen: die Karte nennt ausdrücklich keine Umrechnung in Zentimeter.");
      S.nicht = ["absolute Länge einer Ammah", "Bauteile außer der Außenmauer"];
      return S;
    }

    if (t === "strecke" && g.strecke.length) {
      var lang = g.strecke.filter(function (z) { return z.v > 50; })[0] || g.strecke[0];
      var quer = g.strecke.filter(function (z) { return z.v <= 50; });
      var regel = quer[0] ? quer[0].v : 8, weit = quer[1] ? quer[1].v : regel;
      S.unit = "Meter"; S.grid = 50; S.kompass = true;
      S.breite = Math.max(weit, regel) * 3; S.tiefe = lang.v;
      var mitte = S.breite / 2;
      S.boxes.push(box(mitte - regel / 2, 0, 0, regel, lang.v, 0.5, "fest", regel + " m breit · " + lang.v + " m lang"));
      if (weit > regel) S.boxes.push(box(mitte - weit / 2, 0, 0, weit, 60, 0.4, "offen", "Aufweitung bis " + weit + " m"));
      S.boxes.push(box(mitte + regel / 2 + 3, 20, -0.4, 1.2, lang.v - 40, 0.4, "wasser", "Entwässerung · eigenes System"));
      S.notiz.push("Höhenprofil nicht angegeben — die Straße liegt hier waagrecht, nicht als Steigung.");
      S.nicht = g.offen.concat(["Steigung und Stufen", "Krümmung und genauer Verlauf"]);
      return S;
    }

    /* Flächen und Verortung: nur Platten, keine Höhen */
    var recs = g.flaechen.slice(0, 4);
    if (recs.length) {
      var ox = 0, maxT = 0;
      recs.forEach(function (r, i) {
        var norm = Math.max(r.b, r.t), f = 60 / norm;               /* jede Fläche im eigenen Maßstab */
        var w = r.b * f, d = r.t * f;
        S.boxes.push(box(ox, 0, -0.4, w, d, 0.4 + i * 0.15, /Amot|אַמָּה/i.test(r.einheit) ? "fest" : "offen",
          r.bauteil + " · " + r.b + " × " + r.t + (/Amot|אַמָּה/i.test(r.einheit) ? " Ammot" : " ?")));
        ox += w + 16; maxT = Math.max(maxT, d);
        if (i < recs.length - 1) S.teiler.push(ox - 8);
      });
      S.breite = ox; S.tiefe = maxT;
      S.unit = "je Fläche eigener Maßstab";
      S.grid = 0;
      S.notiz.push("Jede Fläche steht in ihrem eigenen Maßstab; die Karte setzt die Einheiten nicht gleich.");
      S.nicht = g.offen.concat(["Höhen", "Verhältnis der Flächen zueinander"]);
      return S;
    }

    /* Verortung ohne Maß: geschachtelte Platten ohne Zahl */
    S.unit = "ohne Maßstab"; S.grid = 0;
    var groesse = [90, 58, 30];
    groesse.forEach(function (gr, i) {
      S.boxes.push(box((90 - gr) / 2, (90 - gr) / 2, i * 0.6 - 0.6, gr, gr, 0.6, i === 2 ? "fest" : "offen",
        ["Jerusalem", "Har HaMoriah", "Der Mikdasch"][i]));
    });
    S.breite = 90; S.tiefe = 90;
    S.notiz.push("Ordnung der Bezirke, keine Fläche: die Karte nennt keine Kantenlänge.");
    S.nicht = ["Kantenlängen", "Höhen", "moderne Koordinaten"];
    return S;
  }

  /* ── Axonometrie ── */
  function iso(card, S, az, el) {
    var W = 1240, H = 980;
    az = az == null ? 0.62 : az;
    el = el == null ? 0.58 : el;
    var ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    var mx = S.breite / 2, my = S.tiefe / 2;

    function pr(x, y, z) {
      var dx = x - mx, dy = y - my;
      var X = dx * ca - dy * sa;
      var Y = (dx * sa + dy * ca) * se - z * ce;
      return [X, Y];
    }
    function tiefe(x, y, z) {
      var dx = x - mx, dy = y - my;
      return (dx * sa + dy * ca) * ce + z * se;
    }

    /* Maßstab aus den Eckpunkten des Raums */
    var pts = [], zmax = 0;
    S.boxes.forEach(function (b) { zmax = Math.max(zmax, b.z + b.h); });
    [0, S.breite].forEach(function (x) {
      [0, S.tiefe].forEach(function (y) {
        [0, zmax].forEach(function (z) { pts.push(pr(x, y, z)); });
      });
    });
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var spanX = Math.max.apply(null, xs) - Math.min.apply(null, xs) || 1;
    var spanY = Math.max.apply(null, ys) - Math.min.apply(null, ys) || 1;
    var s = Math.min((W - 340) / spanX, (H - 470) / spanY);
    var cx = W / 2, cy = 250 + (H - 470) / 2 - ((Math.max.apply(null, ys) + Math.min.apply(null, ys)) / 2) * s;
    function P(x, y, z) { var p = pr(x, y, z); return [cx + p[0] * s, cy + p[1] * s]; }
    function poly(pp) { return pp.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }

    var o = [];

    /* Bodenraster */
    if (S.grid) {
      for (var gx = 0; gx <= S.breite + 0.01; gx += S.grid) {
        var a = P(gx, 0, 0), b2 = P(gx, S.tiefe, 0);
        o.push('<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b2[0].toFixed(1) + '" y2="' + b2[1].toFixed(1) + '" stroke="' + C.stone + '" stroke-width=".5" opacity=".22"/>');
      }
      for (var gy = 0; gy <= S.tiefe + 0.01; gy += S.grid) {
        var c2 = P(0, gy, 0), d2 = P(S.breite, gy, 0);
        o.push('<line x1="' + c2[0].toFixed(1) + '" y1="' + c2[1].toFixed(1) + '" x2="' + d2[0].toFixed(1) + '" y2="' + d2[1].toFixed(1) + '" stroke="' + C.stone + '" stroke-width=".5" opacity=".22"/>');
      }
    }
    /* Trennebenen zwischen nicht vergleichbaren Körpern */
    S.teiler.forEach(function (tx) {
      var a3 = P(tx, 0, 0), b3 = P(tx, S.tiefe, 0), c3 = P(tx, S.tiefe, zmax || 10);
      o.push('<polyline points="' + poly([a3, b3, c3]) + '" fill="none" stroke="' + C.danger + '" stroke-width="1.2" stroke-dasharray="6 6"/>');
      o.push(T(b3[0], b3[1] + 16, S.teilerLabel || "nicht vergleichbar", { fill: C.dangerLt, size: 10, anchor: "middle" }));
    });

    /* Flächen der Körper sammeln, sortieren, zeichnen */
    var stil = {
      fest:      { top: C.stoneLt, s1: C.stone, s2: C.bronze, stroke: C.ivory, dash: "", op: 1 },
      andeutung: { top: C.stone,   s1: C.bronze, s2: C.bronze, stroke: C.stoneLt, dash: "", op: .82 },
      offen:     { top: C.danger,  s1: C.danger, s2: C.danger, stroke: C.danger, dash: "6 5", op: .13 },
      boden:     { top: C.panel,   s1: C.night, s2: C.night,  stroke: C.stone, dash: "", op: 1 },
      tor:       { top: C.ivory,   s1: C.stoneLt, s2: C.stoneLt, stroke: C.ivory, dash: "", op: 1 },
      wasser:    { top: C.water,   s1: C.water, s2: C.water,  stroke: C.waterLt, dash: "4 4", op: .75 },
      linie:     { top: C.bronze,  s1: C.bronze, s2: C.bronze, stroke: C.bronze, dash: "", op: .9 },
      zone:      { top: C.water,   s1: C.water, s2: C.water, stroke: C.waterLt, dash: "5 4", op: .34 },
      vorhang:   { top: C.ivory,   s1: C.ivory, s2: C.ivory, stroke: C.ivory, dash: "5 4", op: .55 },
      zaehlung:  { top: C.water,   s1: C.water, s2: C.water, stroke: C.waterLt, dash: "4 3", op: .52 }
    };
    var faces = [];
    S.boxes.forEach(function (b, bi) {
      var x0 = b.x, x1 = b.x + b.w, y0 = b.y, y1 = b.y + b.d, z0 = b.z, z1 = b.z + b.h;
      var st = stil[b.art] || stil.fest;
      var f = [
        { p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c: st.top, k: "top" },
        { p: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], c: st.s1, k: "n" },
        { p: [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]], c: st.s1, k: "s" },
        { p: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], c: st.s2, k: "o" },
        { p: [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]], c: st.s2, k: "w" }
      ];
      f.forEach(function (fa) {
        var pp = fa.p.map(function (q) { return P(q[0], q[1], q[2]); });
        var flaeche = 0;
        for (var i = 0; i < pp.length; i++) {
          var j = (i + 1) % pp.length;
          flaeche += pp[i][0] * pp[j][1] - pp[j][0] * pp[i][1];
        }
        if (flaeche <= 0) return;                       /* abgewandte Seite */
        var tf = fa.p.reduce(function (a2, q) { return a2 + tiefe(q[0], q[1], q[2]); }, 0) / fa.p.length;
        faces.push({ pts: pp, c: fa.c, st: st, t: tf, bi: bi, oben: b.oben, k: fa.k });
      });
    });
    faces.sort(function (a, b) { return a.t - b.t; });
    faces.forEach(function (fa) {
      var strich = fa.st.dash;
      if (fa.oben === "offen" && fa.k === "top") strich = "5 4";
      o.push('<polygon points="' + poly(fa.pts) + '" fill="' + fa.c + '" fill-opacity="' + (fa.c === "none" ? 0 : fa.st.op) +
        '" stroke="' + fa.st.stroke + '" stroke-width="1"' + (strich ? ' stroke-dasharray="' + strich + '"' : "") +
        ' stroke-opacity=".85"/>');
    });

    /* Beschriftungen */
    S.boxes.forEach(function (b) {
      if (!b.label) return;
      var p = P(b.x + b.w / 2, b.y + b.d / 2, b.lz != null ? b.lz : b.z + b.h + Math.max(1, zmax * 0.06));
      o.push(T(p[0], p[1], b.label, { fill: b.art === "offen" ? C.dangerLt : C.ivory, size: 11, anchor: "middle" }));
    });

    /* Himmelsrichtungen */
    var pn = P(S.breite / 2, -Math.max(6, S.tiefe * .16), 0), po = P(S.breite + Math.max(6, S.breite * .12), S.tiefe / 2, 0);
    if (S.kompass) {
      o.push(T(pn[0], pn[1], "NORD", { fill: C.stoneLt, size: 11, font: DIS, anchor: "middle" }));
      o.push(T(po[0], po[1], "OST", { fill: C.stoneLt, size: 11, font: DIS, anchor: "middle" }));
    }

    /* Hinweise unter der Zeichnung */
    var ny = H - 190;
    S.notiz.slice(0, 3).forEach(function (n, i) {
      o.push(T(46, ny + i * 17, "· " + n, { fill: C.muted, size: 11 }));
    });

    /* Maßstabsstab entlang der Ostkante */
    if (S.grid) {
      var q0 = P(0, S.tiefe, 0), q1 = P(S.grid, S.tiefe, 0);
      var len = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]);
      o.push('<line x1="' + (46) + '" y1="' + (ny - 34) + '" x2="' + (46 + len) + '" y2="' + (ny - 34) + '" stroke="' + C.stoneLt + '" stroke-width="3"/>');
      o.push(T(46 + len + 10, ny - 30, S.grid + " " + S.unit + " (in der Bodenebene)", { fill: C.stoneLt, size: 11 }));
    } else {
      o.push(T(46, ny - 30, "Ohne Maßstab — " + S.unit, { fill: C.stoneLt, size: 11 }));
    }

    return shell(card, {
      W: W, H: H, artLabel: "Räumlicher Riss",
      body: o.join(""),
      unitNote: "Axonometrie · " + (S.grid ? "Maßstab in " + S.unit : S.unit) + " · keine Perspektive",
      desc: "Räumliche Darstellung ausschließlich nach den Maßangaben der Baukarte. Fehlende Höhen bleiben offen.",
      legend: S.legend || [[C.stoneLt, "voller Körper", "Maß in der Karte belegt"],
                           [C.stone, "Andeutung", "Grundriss belegt, Höhe nicht überliefert"],
                           [C.danger, "gestrichelt", "in der Karte ausdrücklich offen"]],
      nicht: S.nicht,
      foot: S.foot || "Axonometrie · relative Lage · keine Perspektive, kein Bildwerk · kein Zukunftsbauplan"
    });
  }

  function build3d(html, opts) {
    opts = opts || {};
    var card = parse(html), g = model(card), t = typeOf(card, g);
    var S, svg;
    try {
      S = szene(card, g, t);
      svg = iso(card, S, opts.az, opts.el);
    } catch (err) {
      S = szene(card, { rect: null, chains: [], blocks: [], fremd: [], offen: [], rang: [], strecke: [], hoehen: [], einheiten: [], flaechen: [], gates: null, opening: null }, "ort");
      svg = iso(card, S, opts.az, opts.el);
    }
    return { svg: svg, type: t, label: LABEL[t] + " · räumlich", card: card, model: g,
             az: opts.az == null ? 0.62 : opts.az, el: opts.el == null ? 0.58 : opts.el };
  }

  return { version: VERSION, build: build, build3d: build3d, parse: parse, model: model, prompt: prompt, LABEL: LABEL, colors: C };
})();
if (typeof module !== "undefined") module.exports = RISS;
