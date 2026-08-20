/* Shared data layer for the Pennsylvania Environmental Scorecard.
 *
 * Reads the same session files the rest of the site is built from:
 *   data/house_member_votes_25-26.json   written by tools/build_data.py
 *   data/senate_member_votes_25-26.json  written by tools/build_data.py
 *   data/bills_25-26.json                written by tools/build_pages.py
 *
 * Everything on the pages -- chamber averages, champion lists, the map colors --
 * is derived from those files at runtime, so a data refresh never leaves a
 * hand-written number behind.
 */
window.SC = (function () {
  'use strict';

  var SESSION = '2025-2026';

  var PAGES = {
    house: 'house-scorecard-2025-2026.html',
    senate: 'senate-scorecard-2025-2026.html'
  };

  var SOURCES = {
    house: 'data/house_member_votes_25-26.json',
    senate: 'data/senate_member_votes_25-26.json',
    bills: 'data/bills_25-26.json'
  };

  /* Score ramp, shared by the map, the list, the chips and the legend. */
  var RAMP = [
    { max: 0, bg: '#C0392B', fg: '#fff', label: '0%' },
    { max: 24, bg: '#E07A2F', fg: '#231005', label: '1–24%' },
    { max: 49, bg: '#E8B93C', fg: '#2A2005', label: '25–49%' },
    { max: 74, bg: '#C9CF3C', fg: '#232608', label: '50–74%' },
    { max: 99, bg: '#7BAE45', fg: '#12200A', label: '75–99%' },
    { max: 100, bg: '#085A0A', fg: '#fff', label: '100%' }
  ];
  var NO_SCORE = { bg: '#D5DAC8', fg: '#5C665C', label: 'No score' };

  /* A vacant seat has no record to report; it is not a legislator who voted
     against the environment every time. Same for a member on leave. */
  function band(v) {
    if (v === null || v === undefined || isNaN(v)) return NO_SCORE;
    for (var i = 0; i < RAMP.length; i++) if (v <= RAMP[i].max) return RAMP[i];
    return RAMP[RAMP.length - 1];
  }

  function pct(v) { return v === null || v === undefined ? '–' : Math.round(v) + '%'; }

  /* Vote codes as they appear in the tracking workbook. */
  var CODES = {
    YAY: { cast: 'YAY' },
    NAY: { cast: 'NAY' },
    A: { note: 'Abstained' },
    E: { note: 'Excused absence' },
    X: { note: 'Unexcused absence' },
    NP: { note: 'Not present' },
    NIO: { note: 'Not in office' },
    '-': { note: 'Not in office' }
  };

  function code(raw) {
    var k = String(raw === undefined || raw === null ? '' : raw).trim().toUpperCase();
    return CODES[k] || { note: k ? k : 'Not scored' };
  }

  function num(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function chamberLabel(chamber, plural) {
    if (chamber === 'senate') return plural ? 'senators' : 'senator';
    return plural ? 'representatives' : 'representative';
  }

  function normalize(raw) {
    var vacant = raw.Party === 'Vacant';
    var party = vacant ? 'V' : (raw.Party || '').trim();
    var total = num(raw.TVotes);
    var lifetime = num(raw.Life);
    /* A member sworn in after the last scored vote comes out of the workbook
       with a Score of 0, because the arithmetic is 0 of 0 -- not because they
       voted against the environment every time. There is no record to report,
       so they are shown the way a vacant seat is: no colour on the map, no
       percentage, and no place in the averages or the roll calls. Their
       lifetime score stands unless it is 0 too, which for someone who has
       never cast a scored vote is the same empty record rather than a
       judgement. A missing TVotes leaves the member alone. */
    var norecord = !vacant && total === 0;
    return {
      dist: num(raw.District),
      name: raw.full_name || raw.Name || '',
      // "Harkins, Patrick J." -- surname first, which is what the list sorts on.
      sortName: (raw.Name || raw.full_name || '').toLowerCase(),
      party: party,
      partyLabel: vacant ? 'Vacant seat'
        : party === 'D' ? 'Democrat'
        : party === 'R' ? 'Republican'
        : party || 'Unaffiliated',
      vacant: vacant,
      norecord: norecord,
      score: vacant || norecord ? null : num(raw.Score),
      lifetime: vacant || (norecord && !lifetime) ? null : lifetime,
      // The workbook stores site-absolute paths; the pages may be served from a
      // subdirectory (project pages), so keep them relative to the page.
      photo: String(raw.photo || '').replace(/^\/+/, ''),
      phone: raw.district_voice || raw.Phone || '',
      withN: num(raw.VWith), against: num(raw.VAgainst), total: num(raw.TVotes),
      raw: raw
    };
  }

  var cache = null;

  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ': HTTP ' + r.status);
      return r.json();
    });
  }

  /* Resolves to { house: {members, bills, byDist}, senate: {...}, session } */
  function load() {
    if (cache) return cache;
    cache = Promise.all([
      getJSON(SOURCES.house), getJSON(SOURCES.senate), getJSON(SOURCES.bills)
    ]).then(function (res) {
      var out = { session: res[2].session || SESSION };
      [['house', res[0]], ['senate', res[1]]].forEach(function (pair) {
        var chamber = pair[0];
        var members = (pair[1].data || []).map(normalize)
          .sort(function (a, b) { return a.dist - b.dist; });
        var byDist = {};
        members.forEach(function (m) { byDist[m.dist] = m; });
        out[chamber] = { members: members, bills: res[2][chamber] || [], byDist: byDist };
      });
      return out;
    });
    return cache;
  }

  /* Chamber summary, computed from the members themselves. A seat with no
     record -- vacant, or filled after the last scored vote -- is left out of
     every average, count and roll call; see normalize(). */
  function stats(members) {
    var seated = members.filter(function (m) { return !m.vacant && m.score !== null; });
    var avg = function (list) {
      if (!list.length) return null;
      var t = list.reduce(function (s, m) { return s + m.score; }, 0);
      return Math.round(t / list.length);
    };
    var byParty = function (p) { return seated.filter(function (m) { return m.party === p; }); };
    return {
      seated: seated.length,
      vacant: members.filter(function (m) { return m.vacant; }).length,
      norecord: members.filter(function (m) { return m.norecord; }),
      avg: avg(seated),
      avgD: avg(byParty('D')),
      avgR: avg(byParty('R')),
      champions: seated.filter(function (m) { return m.score === 100; }),
      zeros: seated.filter(function (m) { return m.score === 0; }),
      /* Members at or under a score, lowest first: the Senate roll call is the
         0% one, the House's a 10%-or-less band. */
      atOrBelow: function (max) {
        return seated.filter(function (m) { return m.score <= max; })
          .sort(function (a, b) { return a.score - b.score || a.dist - b.dist; });
      },
      low: seated.reduce(function (lo, m) { return lo === null || m.score < lo ? m.score : lo; }, null)
    };
  }

  /* ---------- address lookup, US Census geocoder ---------- */
  /* Layers 56 and 58 are the current upper and lower state legislative
     district layers. Names carry a vintage prefix ("2024 State Legislative
     Districts - Upper"), so match on Upper/Lower rather than the full key.
     The geocoder sends no CORS header, so fetch() is blocked from a browser;
     its JSONP mode is the supported way to call it from a static page. */
  var GEOCODER = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress' +
    '?benchmark=Public_AR_Current&vintage=Current_Current&layers=56,58&format=jsonp&address=';

  var jsonpSeq = 0;

  function jsonp(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var name = 'cvpaGeo' + (++jsonpSeq) + '_' + Math.floor(Math.random() * 1e9);
      var script = document.createElement('script');
      var settled = false;
      var timer = setTimeout(function () { finish(reject, new Error('geocoder timeout')); }, timeoutMs || 12000);
      function finish(fn, arg) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { delete window[name]; } catch (e) { window[name] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
        fn(arg);
      }
      window[name] = function (data) { finish(resolve, data); };
      script.onerror = function () { finish(reject, new Error('geocoder unreachable')); };
      script.src = url + '&callback=' + name;
      document.head.appendChild(script);
    });
  }

  function lookup(address) {
    return jsonp(GEOCODER + encodeURIComponent(address)).then(function (j) {
      var matches = (j.result && j.result.addressMatches) || [];
      if (!matches.length) return null;
      var geo = matches[0].geographies || {};
      var pick = function (part) {
        for (var k in geo) {
          if (k.indexOf(part) !== -1 && geo[k] && geo[k].length) return num(geo[k][0].BASENAME);
        }
        return null;
      };
      var senate = pick('Upper'), house = pick('Lower');
      if (senate === null && house === null) return null;
      return { senate: senate, house: house, matched: matches[0].matchedAddress || address };
    });
  }

  var STORE = 'cvpa.districts.v2';

  function remember(payload) {
    try { localStorage.setItem(STORE, JSON.stringify(payload)); } catch (e) { /* private mode */ }
  }

  function recall() {
    try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { return null; }
  }

  function forget() {
    try { localStorage.removeItem(STORE); } catch (e) { /* private mode */ }
  }

  /* Both pages show the same pair of result cards with a Clear underneath. */
  function showResults(box, cardsHtml, onClear) {
    box.innerHTML = cardsHtml
      ? cardsHtml + '<button type="button" class="clearlookup" ' +
        'aria-label="Clear the address and these results">Clear</button>'
      : '';
    var btn = box.querySelector('.clearlookup');
    if (btn && onClear) btn.addEventListener('click', onClear);
  }

  /* ---------- small shared bits of markup ---------- */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* A leaf for a bill we asked members to pass, a cross for one we asked them to
     stop. The overview's bill lists and the chamber pages' bill cards both use
     it, so a bill reads the same wherever it appears. The symbol is decorative;
     the words beside it are what a screen reader gets. */
  function billIcon(pro) {
    return String(pro).toUpperCase() === 'YAY'
      ? '<svg class="billicon leaf" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M6.05 8.05a7 7 0 0 0-.02 9.9c1.47-3.4 4.09-6.24 7.36-7.93' +
        'A15.9 15.9 0 0 0 8 19.32c2.6 1.23 5.8.78 7.95-1.37C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z"/></svg>'
      : '<svg class="billicon cross" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" ' +
        'd="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
  }

  function proLabel(pro) {
    return String(pro).toUpperCase() === 'YAY'
      ? 'Pro-environment vote: yes.' : 'Pro-environment vote: no.';
  }

  function resultCard(m, chamber, label, href) {
    if (!m) return '';
    var c = band(m.score);
    return '<a class="result" href="' + esc(href) + '">' +
      '<span class="sc" style="background:' + c.bg + ';color:' + c.fg + '">' + pct(m.score) + '</span>' +
      '<span><small>' + esc(label) + '</small><strong>' + esc(m.name) + '</strong>' +
      '<em>District ' + m.dist + ' · ' + esc(m.partyLabel) +
      (m.lifetime === null ? '' : ' · Lifetime ' + pct(m.lifetime)) + '</em></span></a>';
  }

  /* Mobile navigation, on every page. The links sit in the bar on desktop; below
     the breakpoint CSS hides them and this opens them under the header. Visibility
     is a class on the header rather than an attribute on the nav, so a menu left
     open on a phone cannot hide the desktop nav after a resize. */
  function navMenu() {
    var header = document.querySelector('header.site');
    var btn = header && header.querySelector('.navtoggle');
    var nav = header && header.querySelector('nav.site');
    if (!btn || !nav) return;

    function setOpen(open) {
      header.classList.toggle('navopen', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    /* Following a link, Escape, or a tap anywhere else all put the menu away. */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('navopen')) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  /* Back-to-top button, added by every page. */
  function backToTop() {
    var btn = document.getElementById('backtotop');
    if (!btn) return;
    // The 2024 scorecard showed it as soon as the page moved at all.
    var onScroll = function () { btn.classList.toggle('show', window.scrollY > 50); };
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    onScroll();
  }

  return {
    SESSION: SESSION, PAGES: PAGES, RAMP: RAMP, NO_SCORE: NO_SCORE,
    band: band, pct: pct, code: code, esc: esc, num: num,
    chamberLabel: chamberLabel, load: load, stats: stats,
    lookup: lookup, remember: remember, recall: recall, forget: forget,
    billIcon: billIcon, proLabel: proLabel,
    resultCard: resultCard, showResults: showResults, backToTop: backToTop,
    navMenu: navMenu
  };
})();
