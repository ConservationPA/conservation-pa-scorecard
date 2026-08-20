/* Behaviour shared by the Senate and House map pages.
 *
 * The page sets window.CHAMBER ('senate' | 'house') and loads the matching
 * district boundaries from maps/cb_2021_pa_*.js before this file runs.
 */
(function () {
  'use strict';

  var CHAMBER = window.CHAMBER;
  var OTHER = CHAMBER === 'senate' ? 'house' : 'senate';
  /* maps/cb_2021_pa_*.js declares its GeoJSON with `let`, which lands in the
     global lexical scope and never on `window`, so read it by bare name. */
  var BOUNDARIES = CHAMBER === 'senate'
    ? (typeof pa_state_senate_boundary_map !== 'undefined' ? pa_state_senate_boundary_map : null)
    : (typeof pa_state_house_boundary_map !== 'undefined' ? pa_state_house_boundary_map : null);
  var PREFIX = CHAMBER === 'senate' ? 'SD' : 'HD';

  var REGIONS = {
    'Pennsylvania': [[39.6, -80.6], [42.3, -74.6]],
    'Pittsburgh': [[40.24, -80.2], [40.62, -79.7]],
    'Philadelphia': [[39.85, -75.35], [40.15, -74.92]],
    'Allentown / Scranton': [[40.5, -75.9], [41.55, -75.2]]
  };

  var $ = function (s) { return document.querySelector(s); };
  var esc = SC.esc;

  /* Districts sit over the street map, translucent enough to read both. */
  var FILL_OPACITY = 0.72;

  var DATA = null, HERE = null, byDist = {};
  var map, layer;
  var frozen = null, helpShown = true, DEFAULT_HINT = '';
  var view = 'map', sortKey = 'dist', sortDir = 1, query = '', searchOpen = false;

  /* ---------- sidebar ---------- */
  /* The first lines describe whichever way this visitor is working the map; see
     the touch section below for why a phone is told something different. */
  function helpHTML() {
    return '<h3>Reading the map</h3>' +
    '<ul>' +
    (touched
      ? '<li><b>Tap</b> a district for the member, their score, and how they voted on every scored bill. ' +
        'The district keeps its name on the map until you tap another one.</li>' +
        '<li>Tap a <b>bill number</b> in that record to jump to its description, or the × to come back here.</li>'
      : '<li><b>Hover</b> a district for the member and their score.</li>' +
        '<li><b>Click</b> a district to freeze the panel, then click a bill number to jump to its description.</li>' +
        '<li><b>Escape</b> or the × unfreezes and brings mouseover back.</li>') +
    '<li><b>Zoom in</b> for the streets under a district, useful near city lines.</li>' +
    '<li>Prefer a list? Switch to <b>List</b> above the map: every district, sortable, and the accessible alternative to color.</li>' +
    '<li>Read the <a href="20260818_CVPA_Scorecard.pdf" target="_blank" rel="noopener">PDF edition</a>, or browse ' +
    '<a href="https://www.conservationpa.org/scorecard/library" target="_blank" rel="noopener">previous scorecards</a>.</li>' +
    '</ul>';
  }

  function billAnchor(num) { return 'bill-' + num.replace(/\s/g, ''); }

  function voteRow(bill, member) {
    var c = SC.code(member.raw[bill.num]);
    // The row carries two separate things: the bill's colour, which is the same
    // wherever the bill appears on the site, and the tick or cross, which is
    // about this member's vote on it.
    var stance = String(bill.pro).toUpperCase() === 'YAY' ? 'good' : 'bad';
    var link = '<a href="#' + billAnchor(bill.num) + '" data-bill="' + esc(billAnchor(bill.num)) + '">' +
      '<b>' + esc(bill.num) + '</b><span class="sr">: </span> <span class="t">' + esc(bill.title) + '</span></a>';
    if (!c.cast) {
      return '<li class="' + stance + '"><span class="ic none" aria-hidden="true">–</span><span>' + link +
        ' <span class="tag">' + esc(c.note) + '</span></span></li>';
    }
    var good = c.cast === String(bill.pro).toUpperCase();
    return '<li class="' + stance + '"><span class="ic" style="background:' +
      (good ? '#085A0A' : '#C0392B') + '" aria-hidden="true">' +
      (good ? '✓' : '✕') + '</span><span>' + link +
      ' <span class="note">— voted ' + (c.cast === 'YAY' ? 'yes' : 'no') +
      (good ? ', with the environment' : ', against the environment') + '</span></span></li>';
  }

  function memberCard(m) {
    var s = SC.band(m.score), l = SC.band(m.lifetime);
    var rows = HERE.bills.map(function (b) { return voteRow(b, m); }).join('');
    var tally = m.vacant
      ? 'This seat was vacant for the scored votes.'
      : m.norecord
        ? 'This member was not in office for any of the scored votes, so there is no score to report yet.'
        : 'Voted with the environment on ' + m.withN + ' of ' + m.total + ' scored bills.';
    var phone = m.phone
      ? '<br><a href="tel:' + esc(m.phone.replace(/[^0-9+]/g, '')) + '">' + esc(m.phone) + '</a>'
      : '';
    return '<span class="tip closetip">' +
        '<button class="panelclose" type="button" aria-label="Close this legislator" aria-describedby="closetip">×</button>' +
        '<span class="tiptext" role="tooltip" id="closetip">' +
          '<b>Close</b>Go back to the map help, and let hovering a district change the panel again. ' +
          'The Escape key does the same.' +
        '</span>' +
      '</span>' +
      '<div class="member">' +
        '<div class="avatar' + (m.photo ? '' : ' noimg') + '">' +
          (m.photo ? '<img src="' + esc(m.photo) + '" alt="' + esc(m.name) +
            '" loading="lazy" onerror="this.parentNode.classList.add(\'noimg\');this.remove()">' : '') +
        '</div>' +
        '<div><h3>' + esc(m.name) + '</h3>' +
        '<div class="sub">District ' + m.dist + ' · ' + esc(m.partyLabel) + phone + '</div></div>' +
      '</div>' +
      '<div class="scores">' +
        '<div class="scorebox"><span>' + SC.SESSION.replace('-', '–') + ' score</span>' +
        '<b style="background:' + s.bg + ';color:' + s.fg + '">' + SC.pct(m.score) + '</b></div>' +
        '<div class="scorebox"><span>Lifetime</span>' +
        '<b style="background:' + l.bg + ';color:' + l.fg + '">' + SC.pct(m.lifetime) + '</b></div>' +
      '</div>' +
      '<div class="tally">' + tally + '</div>' +
      '<ul class="votelist">' + rows + '</ul>';
  }

  function showPanel(html, isFrozen) {
    var box = $('#panelbody');
    box.innerHTML = html;
    $('#panel').classList.toggle('frozen', !!isFrozen);
    var close = box.querySelector('.panelclose');
    if (close) close.addEventListener('click', unfreeze);
    Array.prototype.forEach.call(box.querySelectorAll('[data-bill]'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var el = document.getElementById(a.dataset.bill);
        if (!el) return;
        Array.prototype.forEach.call(document.querySelectorAll('.votecard.hl'), function (c) {
          c.classList.remove('hl');
        });
        el.classList.add('hl');
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
      });
    });
  }

  function showHelp() { helpShown = true; showPanel('<div class="helpbox">' + helpHTML() + '</div>', false); }

  function closeTips() {
    Array.prototype.forEach.call(document.querySelectorAll('.tip.open'), function (t) {
      t.classList.remove('open');
      var btn = t.querySelector('[aria-expanded]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function unfreeze() {
    frozen = null;
    restyle();
    pinLabel(null);
    if (view === 'list') renderList();
    showHelp();
    history.replaceState(null, '', location.pathname + location.search);
  }

  /* ---------- map ---------- */
  function districtOf(feature) { return SC.num(feature.properties.NAME); }

  /* The districts themselves are a tighter fit than a hand-drawn box. */
  function statewide() {
    return layer ? layer.getBounds() : REGIONS['Pennsylvania'];
  }

  function style(feature) {
    var dist = districtOf(feature);
    var m = byDist[dist];
    var c = SC.band(m ? m.score : null);
    var isFrozen = frozen === dist;
    return {
      color: isFrozen ? '#0C2A0B' : '#FFFFFF',
      weight: isFrozen ? 2.5 : 0.8,
      fillColor: c.bg,
      fillOpacity: FILL_OPACITY
    };
  }

  function restyle() { if (layer) layer.setStyle(style); }

  /* Leaving a district puts the help text back, so a card you only brushed past
     does not follow you down the page. Deferred, because crossing from one
     district to the next fires mouseout before mouseover and the help would
     flash between them; the incoming district cancels the pending revert. */
  var revertTimer = null;

  function cancelRevert() {
    if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
  }

  function revertToHelp() {
    cancelRevert();
    if (frozen !== null || helpShown) return;
    revertTimer = setTimeout(function () {
      revertTimer = null;
      if (frozen === null && !helpShown) showHelp();
    }, 60);
  }

  /* A tap fires the mouse events a hover would, on both sides of the click:
     mouseover as the finger lands, mouseout as it lifts. Leaflet opens a
     district's label on the first and closes it on the second, so on a phone the
     label appears and is gone again before it can be read. A desktop browser in
     device-emulation mode never shows this, because the pointer there is a real
     mouse: it arrives, stays, and never leaves.

     So once a touch has happened, hovering means nothing here. The tap alone
     opens the panel, and the label stays on the district that was tapped until
     another district takes it. */
  var touched = false, lastTouch = 0;

  /* The synthesised mouse events trail the touch by up to about 300ms. */
  function fromTouch() { return Date.now() - lastTouch < 700; }

  /* Nothing hovers on a phone, and the panel is above the map rather than to its
     left, so the instructions say neither. */
  function mapHint() {
    return touched
      ? 'Tap a district to open that member’s record. The map keeps their name until you tap another.'
      : 'Hover a district for the member. Click to freeze the panel; Escape to release.';
  }

  function listHint() {
    return touched
      ? 'Tap any row to open that member’s full voting record.'
      : 'Click any row to see that member’s full voting record on the left.';
  }

  function noteTouch() {
    lastTouch = Date.now();
    if (touched) return;
    touched = true;
    $('#maphint').textContent = view === 'map' ? mapHint() : listHint();
    if (helpShown) showHelp();
    // A label that closes itself on the way out is the bug: drop them all, and
    // pin one to the tapped district instead. A laptop with a touch screen loses
    // its hover labels at the first tap it takes, which is worth the fix.
    if (layer) layer.eachLayer(function (l) { l.unbindTooltip(); });
    if (frozen !== null) pinLabel(frozen);
  }

  function labelFor(dist) {
    var m = byDist[dist];
    return m ? esc(m.name) + ' · ' + PREFIX + '-' + dist + ' · ' + SC.pct(m.score) : PREFIX + '-' + dist;
  }

  /* Permanent, so nothing but the next tap closes it. */
  var pinned = null;

  function pinLabel(dist) {
    if (pinned) { pinned.unbindTooltip(); pinned = null; }
    if (!layer || dist === null) return;
    layer.eachLayer(function (l) {
      if (districtOf(l.feature) !== dist) return;
      pinned = l;
      l.bindTooltip(labelFor(dist), { permanent: true, direction: 'top' }).openTooltip();
    });
  }

  /* Below 900px the panel stacks above the map, so a tap on a district writes
     that member's record off the top of the screen. Follow it up there. Beside
     the map on a wide screen the record is already in view, and the measurement
     below is what tells the two apart. */
  function revealPanel() {
    var top = $('#panel').getBoundingClientRect().top;
    if (top >= 0 && top < window.innerHeight / 2) return;
    window.scrollTo({ top: top + window.scrollY - 80, behavior: 'smooth' });
  }

  function onEach(feature, lyr) {
    var dist = districtOf(feature);
    lyr.on('mouseover', function () {
      lyr.setStyle({ weight: 2.5, color: '#0C2A0B' });
      lyr.bringToFront();
      cancelRevert();
      if (frozen === null && !fromTouch()) {
        var m = byDist[dist];
        if (m) { helpShown = false; showPanel(memberCard(m), false); }
      }
    });
    lyr.on('mouseout', function () {
      if (frozen !== dist) layer.resetStyle(lyr);
      if (!fromTouch()) revertToHelp();
    });
    lyr.on('click', function () {
      select(dist, false);
      if (touched) revealPanel();
    });
    if (!touched) lyr.bindTooltip(function () { return labelFor(dist); }, { sticky: true });
  }

  function select(dist, fly) {
    var m = byDist[dist];
    if (!m) return;
    frozen = dist;
    helpShown = false;
    restyle();
    if (touched) pinLabel(dist);
    showPanel(memberCard(m), true);
    if (view === 'list') renderList();
    if (fly && layer) {
      layer.eachLayer(function (l) {
        // maxZoom keeps a small city district in view of its neighbours rather
        // than filling the map with one shape and no context.
        if (districtOf(l.feature) === dist) map.fitBounds(l.getBounds(), { padding: [60, 60], maxZoom: 11 });
      });
    }
    history.replaceState(null, '', location.pathname + location.search + '#d' + dist);
  }

  /* ---------- address lookup ---------- */
  function renderResults(dists, note) {
    var here = byDist[dists[CHAMBER]];
    var there = DATA[OTHER].byDist[dists[OTHER]];
    SC.showResults($('#lookupresult'),
      SC.resultCard(here, CHAMBER, 'Your ' + SC.chamberLabel(CHAMBER) + ', shown on this map', '#d' + dists[CHAMBER]) +
      SC.resultCard(there, OTHER, 'Your ' + SC.chamberLabel(OTHER) + ', on the ' + OTHER + ' map',
        SC.PAGES[OTHER] + '#d' + dists[OTHER]),
      clearLookup);
    if (note) $('#lookuphint').textContent = note;
  }

  function clearLookup() {
    SC.forget();
    $('#lookupresult').innerHTML = '';
    $('#addr').value = '';
    $('#lookuphint').textContent = DEFAULT_HINT;
    $('#addr').focus();
  }

  function runLookup(address) {
    if (!address) return;
    var hint = $('#lookuphint');
    hint.textContent = 'Looking up…';
    SC.lookup(address).then(function (dists) {
      if (!dists || !byDist[dists[CHAMBER]]) {
        hint.textContent = 'No match for that address. Try a full street address with the city and state, ' +
          'or find your district on the map below.';
        $('#lookupresult').innerHTML = '';
        return;
      }
      SC.remember({ addr: address, dists: dists });
      renderResults(dists, 'Both chambers from one lookup. Saved for your next visit.');
      select(dists[CHAMBER], true);
    }).catch(function () {
      hint.textContent = 'The Census address lookup is not answering right now. ' +
        'Click your district on the map, or switch to List and search by name.';
      $('#lookupresult').innerHTML = '';
    });
  }

  /* ---------- stat band ---------- */
  /* Every name in the band opens that member's record, the same panel a click
     on their district opens. The name carries the party and district --
     "Katie Muth (D-44)" -- so the roll call reads on its own, without a hover
     or a click; the tag stays inside the link so the two never wrap apart. */
  function memberLink(m) {
    var tag = (m.party || '').trim();
    tag = (tag ? tag + '-' : '') + m.dist;
    return '<a class="who" href="#d' + m.dist + '" data-dist="' + m.dist + '" title="' +
      esc(m.name) + ', District ' + m.dist + ' · ' + esc(m.partyLabel) + ' · ' + SC.pct(m.score) +
      '">' + esc(m.name) + ' (' + esc(tag) + ')</a>';
  }

  /* A long roll call is cut after `limit`; the rest is in the markup already so
     the "and N more" button only has to unhide it. Ten is enough to name the
     nine representatives at 10% or less in full; the 23 senators at 0% are the
     list this is here for. */
  var NAMES_SHOWN = 10;

  function nameList(members) {
    // Surname order: the members arrive sorted by district, which reads as no
    // order at all in a run of names.
    var links = members.slice().sort(function (a, b) {
      return a.sortName.localeCompare(b.sortName);
    }).map(memberLink);
    if (links.length <= NAMES_SHOWN) return links.join(' · ') + '.';
    return links.slice(0, NAMES_SHOWN).join(' · ') +
      '<span class="rest" hidden> · ' + links.slice(NAMES_SHOWN).join(' · ') + '</span>' +
      '<span class="morewrap"> and <button type="button" class="morelink">' +
      (links.length - NAMES_SHOWN) + ' more</button></span>.';
  }

  /* The roll call of the worst records. 23 senators scored 0%; no representative
     did once the member who was not in office for any of the scored votes is
     left out (see SC.stats), so the House names everyone at 10% or less. */
  var LOW_MAX = CHAMBER === 'house' ? 10 : 0;
  var LOW_LABEL = LOW_MAX + '%' + (LOW_MAX ? ' or less' : '');
  var LOW_HEAD = LOW_MAX ? LOW_LABEL : '0% scorers';

  /* The score ramp is drawn for coloured chips on paper. Against the dark
     average card the 100% green disappears, so that one band is lifted. */
  function onDark(v) {
    var bg = SC.band(v).bg;
    return bg === '#085A0A' ? '#A9D6A3' : bg;
  }

  function partyAvg(label, v) {
    return '<div><b style="color:' + onDark(v) + '">' + SC.pct(v) + '</b><span>' + label + '</span></div>';
  }

  function renderStats() {
    var s = SC.stats(HERE.members);
    var low = s.atOrBelow(LOW_MAX);
    var champs = s.champions.length
      ? s.champions.length + ' ' + SC.chamberLabel(CHAMBER, s.champions.length !== 1) +
        ' voted with the environment on every scored bill: ' + nameList(s.champions)
      : 'No ' + SC.chamberLabel(CHAMBER) + ' scored 100% this session.';
    var lowText = !low.length
      ? 'No ' + SC.chamberLabel(CHAMBER) + ' scored ' + LOW_LABEL + ' this session. The lowest score was ' +
        SC.pct(s.low) + '.'
      : low.length + ' ' + SC.chamberLabel(CHAMBER, low.length !== 1) +
        (LOW_MAX ? ' scored ' + LOW_LABEL + ': ' : ' voted against the environment on every scored bill: ') +
        nameList(low);
    /* What the averages are not counting, which is also what the districts with
       no colour on the map are. */
    var missing = [];
    if (s.vacant) {
      missing.push(s.vacant + ' seat' + (s.vacant > 1 ? 's are' : ' is') + ' vacant.');
    }
    if (s.norecord.length) {
      missing.push(s.norecord.length + ' ' + SC.chamberLabel(CHAMBER, s.norecord.length !== 1) +
        (s.norecord.length > 1 ? ' were' : ' was') + ' not in office for any of the scored votes.');
    }
    var band = $('#statband');
    band.innerHTML =
      '<div class="stat champs"><h3>100% champions</h3><p>' + champs + '</p></div>' +
      '<div class="stat zeros"><h3>' + LOW_HEAD + '</h3><p>' + lowText + '</p></div>' +
      '<div class="stat avg">' +
        '<div class="big">' + SC.pct(s.avg) + '<span>Chamber average</span></div>' +
        '<div class="party">' + partyAvg('Democrats', s.avgD) + partyAvg('Republicans', s.avgR) + '</div>' +
        (missing.length ? '<p class="vacant">' + missing.join(' ') + '</p>' : '') +
      '</div>';

    Array.prototype.forEach.call(band.querySelectorAll('.morelink'), function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.closest('p');
        var rest = p.querySelector('.rest');
        if (rest) rest.hidden = false;
        var wrap = btn.parentNode;
        wrap.parentNode.removeChild(wrap);
      });
    });

    band.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-dist]');
      if (!a) return;
      // The link already points at #dNN, but a member who is open stays open,
      // and no hashchange fires; select() here also brings the panel into view.
      e.preventDefault();
      select(SC.num(a.dataset.dist), true);
      var panel = $('#panel');
      window.scrollTo({
        top: panel.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth'
      });
    });
  }

  /* ---------- list view ---------- */
  var COLS = [
    { key: 'dist', label: 'Dist' }, { key: 'name', label: 'Name' }, { key: 'party', label: 'Party' },
    { key: 'score', label: SC.SESSION.replace('-', '–') }, { key: 'lifetime', label: 'Lifetime' }
  ];

  function renderList() {
    var q = query.trim().toLowerCase();
    var rows = HERE.members.filter(function (m) {
      return !q || m.name.toLowerCase().indexOf(q) !== -1 || String(m.dist).indexOf(q) === 0;
    }).slice().sort(function (a, b) {
      if (sortKey === 'name') return a.sortName.localeCompare(b.sortName) * sortDir;
      if (sortKey === 'party') return a.party.localeCompare(b.party) * sortDir || a.dist - b.dist;
      var av = a[sortKey], bv = b[sortKey];
      av = av === null || av === undefined ? -1 : av;
      bv = bv === null || bv === undefined ? -1 : bv;
      return (av - bv) * sortDir || a.dist - b.dist;
    });

    $('#listtable thead').innerHTML = '<tr>' + COLS.map(function (c) {
      var arrow = sortKey === c.key ? (sortDir === 1 ? ' ↑' : ' ↓') : '';
      return '<th data-sort="' + c.key + '" scope="col" tabindex="0" aria-sort="' +
        (sortKey === c.key ? (sortDir === 1 ? 'ascending' : 'descending') : 'none') + '">' +
        c.label + arrow + '</th>';
    }).join('') + '</tr>';

    $('#listtable tbody').innerHTML = rows.map(function (m) {
      var s = SC.band(m.score), l = SC.band(m.lifetime);
      return '<tr data-dist="' + m.dist + '"' + (frozen === m.dist ? ' class="sel"' : '') + '>' +
        '<td class="num">' + m.dist + '</td>' +
        // A real link so the row is reachable by keyboard; the hashchange
        // handler opens the same panel a mouse click on the row does.
        '<td class="nm"><a href="#d' + m.dist + '">' + esc(m.name) + '</a></td>' +
        '<td><span class="party ' + esc(m.party) + '" title="' + esc(m.partyLabel) + '">' +
          esc(m.vacant ? '–' : m.party) + '</span></td>' +
        '<td><span class="chip" style="background:' + s.bg + ';color:' + s.fg + '">' + SC.pct(m.score) + '</span></td>' +
        '<td><span class="chip ghost" style="border-color:' + l.bg + '">' + SC.pct(m.lifetime) + '</span></td></tr>';
    }).join('');

    var empty = $('#listempty');
    if (empty) empty.hidden = rows.length > 0;

    Array.prototype.forEach.call($('#listtable thead').querySelectorAll('th'), function (th) {
      var sort = function () {
        var k = th.dataset.sort;
        sortDir = sortKey === k ? -sortDir : (k === 'dist' || k === 'name' ? 1 : -1);
        sortKey = k;
        renderList();
        var again = $('#listtable thead th[data-sort="' + k + '"]');
        if (again) again.focus();
      };
      th.addEventListener('click', sort);
      th.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); }
      });
    });
    Array.prototype.forEach.call($('#listtable tbody').querySelectorAll('tr'), function (tr) {
      tr.addEventListener('click', function (e) {
        // The name cell is a link; let it set the hash and stay in sync. The
        // hashchange handler reveals the panel for that half of the row.
        if (e.target.tagName === 'A') return;
        select(SC.num(tr.dataset.dist), false);
        if (touched) revealPanel();
      });
    });
  }

  /* The region buttons and the search box share one row, so opening either puts
     the other away. The regions only mean anything over the map, so the list
     view hides them whether the search is open or not. */
  function showTools() {
    document.querySelector('.regions').hidden = searchOpen || view !== 'map';
    document.querySelector('.searchfield').hidden = !searchOpen;
  }

  function setSearch(open) {
    searchOpen = open;
    var btn = $('#searchtoggle');
    btn.classList.toggle('on', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    showTools();
    if (open) { $('#listsearch').focus(); return; }
    // Closing lifts the filter: a list still narrowed by a search box nobody can
    // see reads as missing members.
    if (query) {
      query = '';
      $('#listsearch').value = '';
      if (view === 'list') renderList();
    }
    btn.focus();
  }

  function setView(v) {
    view = v;
    $('#map').hidden = v !== 'map';
    $('#listview').hidden = v !== 'list';
    $('#maphint').textContent = v === 'map' ? mapHint() : listHint();
    Array.prototype.forEach.call(document.querySelectorAll('.viewswitch button'), function (b) {
      b.classList.toggle('on', b.dataset.view === v);
      b.setAttribute('aria-pressed', b.dataset.view === v ? 'true' : 'false');
    });
    showTools();
    $('#legend').hidden = v !== 'map';
    if (v === 'map' && map) map.invalidateSize();
    if (v === 'list') renderList();
  }

  /* ---------- bill cards ---------- */
  function renderBills() {
    $('#votegrid').innerHTML = HERE.bills.map(function (b) {
      var yes = String(b.pro).toUpperCase() === 'YAY';
      // The heading is the link, number and title together, so the whole line
      // underlines on hover and the target is the size of what it names.
      var head = '<b>' + esc(b.num) + '</b>, <span class="t">' + esc(b.title) + '</span>';
      if (b.url) {
        head = '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + head + '</a>';
      }
      return '<article class="votecard ' + (yes ? 'good' : 'bad') + '" id="' + esc(billAnchor(b.num)) + '">' +
        '<span class="badge ' + (yes ? 'yay' : 'nay') + '">' + SC.billIcon(b.pro) +
        'Pro-environment vote: ' + (yes ? 'Yes' : 'No') + '</span>' +
        '<h3>' + head + '</h3>' +
        '<p>' + esc(b.description || 'Description forthcoming.') + '</p>' +
        (b.status ? '<p class="status">' + esc(b.status) + '</p>' : '') +
        '</article>';
    }).join('');
  }

  /* ---------- deep links ---------- */
  function requestedDistrict() {
    var hash = location.hash.match(/^#d(\d+)$/);
    if (hash) return SC.num(hash[1]);
    // Links published with the previous site used ?district=HD-12 / SD-12.
    var q = location.search.match(/[?&]district=(?:[A-Za-z]+-)?(\d+)/);
    return q ? SC.num(q[1]) : null;
  }

  /* ---------- boot ---------- */
  function boot() {
    SC.navMenu();
    SC.backToTop();
    DEFAULT_HINT = $('#lookuphint').textContent;
    // Before the data loads, so a tap that lands early is still counted.
    document.addEventListener('touchstart', noteTouch, { passive: true, capture: true });
    document.addEventListener('touchend', noteTouch, { passive: true, capture: true });
    SC.load().then(function (data) {
      DATA = data;
      HERE = data[CHAMBER];
      byDist = HERE.byDist;

      renderBills();
      renderStats();
      showHelp();

      if (BOUNDARIES) {
        // zoomSnap lets fitBounds land on a fractional zoom, so the state fills
        // the panel instead of sitting in a corner of the next zoom level down.
        map = L.map('map', { scrollWheelZoom: false, zoomSnap: 0.25 });
        map.attributionControl.addAttribution(
          'District boundaries © <a href="https://www.census.gov/">US Census Bureau</a>');
        // Leaflet keeps tiles in their own pane, always under the districts.
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18, opacity: 0.6
        }).addTo(map);
        layer = L.geoJSON(BOUNDARIES, { style: style, onEachFeature: onEach }).addTo(map);
        map.fitBounds(statewide(), { padding: [12, 12] });
      } else {
        $('#map').hidden = true;
        $('#maphint').textContent = 'District boundaries could not be loaded. The list view has the same data.';
      }

      /* The grey belongs on the legend as much as the six score colours do: a
         seat can be vacant, or filled too late to have voted on anything. */
      var legend = SC.RAMP.concat([SC.NO_SCORE]).map(function (r) {
        return '<span class="sw" style="background:' + r.bg + ';color:' + r.fg + '">' + r.label + '</span>';
      }).join('');
      $('#legend').innerHTML = '<span>Score</span><span class="swatches">' + legend + '</span>';

      Array.prototype.forEach.call(document.querySelectorAll('.regions button[data-region]'), function (b) {
        b.addEventListener('click', function () {
          if (!map) return;
          var target = b.dataset.region === 'Pennsylvania' ? statewide() : REGIONS[b.dataset.region];
          map.flyToBounds(target, { duration: 0.8, padding: [12, 12] });
          Array.prototype.forEach.call(document.querySelectorAll('.regions button[data-region]'), function (o) {
            o.classList.toggle('on', o === b);
          });
        });
      });

      Array.prototype.forEach.call(document.querySelectorAll('.viewswitch button'), function (b) {
        b.addEventListener('click', function () { setView(b.dataset.view); });
      });
      $('#searchtoggle').addEventListener('click', function () { setSearch(!searchOpen); });
      $('#listsearch').addEventListener('input', function (e) {
        query = e.target.value;
        if (query.trim() && view !== 'list') setView('list');
        else if (view === 'list') renderList();
      });
      $('#listsearch').addEventListener('keydown', function (e) {
        // Escape closes the search rather than reaching the panel behind it.
        if (e.key === 'Escape') { e.stopPropagation(); setSearch(false); }
      });

      $('#lookupform').addEventListener('submit', function (e) {
        e.preventDefault();
        runLookup($('#addr').value.trim());
      });

      /* The ? explains the lookup and nothing else. Hover and focus show it in
         CSS; the click is here so it is reachable on a touch screen. */
      var helpBtn = $('#helptoggle');
      helpBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = helpBtn.parentNode.classList.toggle('open');
        helpBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', closeTips);

      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (document.querySelector('.tip.open')) { closeTips(); return; }
        if (frozen !== null) unfreeze();
      });
      window.addEventListener('hashchange', function () {
        var d = requestedDistrict();
        if (d === null || d === frozen) return;
        select(d, true);
        if (touched) revealPanel();
      });

      var saved = SC.recall();
      if (saved && saved.dists) {
        $('#addr').value = saved.addr || '';
        renderResults(saved.dists, 'Welcome back. These are the legislators you looked up last time.');
      }

      var deep = requestedDistrict();
      if (deep !== null) select(deep, true);

      // Bill cards are rendered by this script, so the browser cannot honour a
      // #bill-HB1261 link on its own. Overview page links rely on this.
      var billHash = location.hash.match(/^#bill-[\w-]+$/);
      if (billHash) {
        var card = document.getElementById(location.hash.slice(1));
        if (card) {
          card.classList.add('hl');
          window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - 100 });
        }
      }
    }).catch(function (err) {
      $('#panelbody').innerHTML = '<div class="helpbox"><h3>Scores could not be loaded</h3>' +
        '<p>Please reload the page. If it keeps happening, let us know.</p></div>';
      if (window.console) console.error(err);
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
