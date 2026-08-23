/* ══════════════════════════════════════════════════════════════════════════
   RISS — aus einer Mikdash-Baukarte wird eine Zeichnung.

   Gezeichnet wird ausschließlich, was die Maßtabelle der Karte belegt.
   Was dort offen bleibt, erscheint als offen und wird nicht ergänzt.
   Es wird nicht zwischen Einheiten umgerechnet; Maßstab ist die Einheit
   der Quelle. Maße verschiedener Quellenschichten werden nie in denselben
   Maßstab gesetzt, solange die Karte sie nicht gleichsetzt.
   ══════════════════════════════════════════════════════════════════════════ */
var RISS = (function () {
  "use strict";

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
    s.push(T(46, 88, card.he, { fill: C.ivory, size: 25, font: HE, rtl: true }));
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
      title: q(".hero-de"),
      lead: q(".lead"),
      rows: [],
      metrics: [].slice.call(doc.querySelectorAll(".metric")).map(function (mt) {
        return { value: strip(mt.querySelector(".metric-value") ? mt.querySelector(".metric-value").textContent : ""),
                 label: strip(mt.querySelector(".metric-label") ? mt.querySelector(".metric-label").textContent : "") };
      })
    };
    [].slice.call(doc.querySelectorAll("tbody tr")).forEach(function (tr) {
      var c = [].slice.call(tr.querySelectorAll("td")).map(function (td) { return strip(td.textContent); });
      if (c.length >= 7) {
        card.rows.push({ bauteil: c[0], quelle: c[1], mass: c[2], einheit: c[3], achse: c[4], sicherheit: c[5], bemerkung: c[6] });
      }
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

      if (/Tore|Anzahl/i.test(r.bauteil) && v != null) { g.gates = { n: v, verteilung: r.achse + " " + r.bemerkung, quelle: r.quelle }; return; }
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
    if (g.gates && g.gates.n - gesetzt > 0) nicht.unshift((g.gates.n - gesetzt) + " weitere Tore — Lage nicht angegeben");
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

  /* ── öffentlich ── */
  var LABEL = {
    grundriss: "Grundriss", masstab: "Maßstabsleiter", flaechen: "Flächenvergleich",
    hoehe: "Höhenschema", tore: "Torschema", strecke: "Streckenschema", ort: "Verortungsschema"
  };
  function build(html) {
    var card = parse(html);
    var g = model(card);
    var t = typeOf(card, g);
    var fn = { grundriss: grundriss, masstab: masstab, flaechen: flaechen, hoehe: hoehe, tore: tore, strecke: strecke, ort: ort }[t];
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
      o.push(T(b3[0], b3[1] + 16, "nicht vergleichbar", { fill: C.dangerLt, size: 10, anchor: "middle" }));
    });

    /* Flächen der Körper sammeln, sortieren, zeichnen */
    var stil = {
      fest:      { top: C.stoneLt, s1: C.stone, s2: C.bronze, stroke: C.ivory, dash: "", op: 1 },
      andeutung: { top: C.stone,   s1: C.bronze, s2: C.bronze, stroke: C.stoneLt, dash: "", op: .82 },
      offen:     { top: C.danger,  s1: C.danger, s2: C.danger, stroke: C.danger, dash: "6 5", op: .13 },
      boden:     { top: C.panel,   s1: C.night, s2: C.night,  stroke: C.stone, dash: "", op: 1 },
      tor:       { top: C.ivory,   s1: C.stoneLt, s2: C.stoneLt, stroke: C.ivory, dash: "", op: 1 },
      wasser:    { top: C.water,   s1: C.water, s2: C.water,  stroke: C.waterLt, dash: "4 4", op: .75 },
      linie:     { top: C.bronze,  s1: C.bronze, s2: C.bronze, stroke: C.bronze, dash: "", op: .9 }
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
      legend: [[C.stoneLt, "voller Körper", "Maß in der Karte belegt"],
               [C.stone, "Andeutung", "Grundriss belegt, Höhe nicht überliefert"],
               [C.danger, "gestrichelt", "in der Karte ausdrücklich offen"]],
      nicht: S.nicht,
      foot: "Axonometrie · relative Lage · keine Perspektive, kein Bildwerk · kein Zukunftsbauplan"
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

  return { build: build, build3d: build3d, parse: parse, model: model, prompt: prompt, LABEL: LABEL, colors: C };
})();
if (typeof module !== "undefined") module.exports = RISS;
