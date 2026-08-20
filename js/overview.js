/* Overview page. Every number on this page is computed from the session data
   files at runtime, so a data refresh cannot leave a stale figure behind. */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var esc = SC.esc;

  function fillStats(map) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-stat]'), function (el) {
      var v = map[el.dataset.stat];
      if (v !== undefined && v !== null) el.textContent = v;
    });
  }

  function cell(value, color, label) {
    return '<div class="cell"><div class="n" style="color:' + color + '">' + esc(value) + '</div>' +
      '<div class="lbl">' + esc(label) + '</div></div>';
  }

  function splitCard(title, rows) {
    return '<div class="split"><h3>' + esc(title) + '</h3><div class="rows">' +
      rows.map(function (r) {
        var c = SC.band(r.value);
        /* The 100% band is the same green as the section behind it; lift a
           full bar so it does not disappear into the panel. */
        var bg = c.bg === '#085A0A' ? '#C2E6B8' : c.bg;
        return '<div><div class="lab"><span>' + esc(r.label) + '</span><b>' + SC.pct(r.value) + '</b></div>' +
          '<div class="track"><div class="fill" style="width:' + Math.max(0, Math.min(100, r.value || 0)) +
          '%;background:' + bg + '"></div></div></div>';
      }).join('') + '</div></div>';
  }

  /* Every scored bill, with the leaf or the cross that says which way we asked
     members to vote. A bill we opposed is red down to its link, so a card full
     of them reads as red before a word of it is read. */
  function billList(el, bills, page) {
    el.querySelector('ul').innerHTML = bills.map(function (b) {
      var good = String(b.pro).toUpperCase() === 'YAY';
      // Number and title are one link: the whole row is the click target, and
      // the hover underline runs the length of what you are about to open.
      return '<li class="bill ' + (good ? 'good' : 'bad') + '">' + SC.billIcon(b.pro) +
        '<a href="' + page + '#bill-' + esc(b.num.replace(/\s/g, '')) + '">' +
        '<span class="sr">' + SC.proLabel(b.pro) + ' </span>' +
        '<b>' + esc(b.num) + '</b>, <span class="t">' + esc(b.title) + '</span></a></li>';
    }).join('');
  }

  var DEFAULT_HINT = '';

  function renderResults(dists, data) {
    SC.showResults($('#lookupresult'),
      SC.resultCard(data.house.byDist[dists.house], 'house', 'PA House',
        SC.PAGES.house + '#d' + dists.house) +
      SC.resultCard(data.senate.byDist[dists.senate], 'senate', 'PA Senate',
        SC.PAGES.senate + '#d' + dists.senate),
      clearLookup);
  }

  function clearLookup() {
    SC.forget();
    $('#lookupresult').innerHTML = '';
    $('#addr').value = '';
    $('#lookuphint').textContent = DEFAULT_HINT;
    $('#addr').focus();
  }

  /* index.html used to be a copy of the Senate map, so links published with the
     previous site can arrive here as ?district=SD-12. Send them to the map. */
  function forwardLegacyDistrict() {
    var m = location.search.match(/[?&]district=([A-Za-z]*)-?(\d+)/);
    if (!m) return false;
    var chamber = m[1].toUpperCase() === 'HD' ? 'house' : 'senate';
    location.replace(SC.PAGES[chamber] + '#d' + SC.num(m[2]));
    return true;
  }

  /* In-page anchors on this page, #signup above all. The sign-up form is
     injected into that section by EveryAction's at.js well after load, so at
     the moment of the click the document is still short enough that the
     browser cannot lift the section to the top: it stops at the bottom of what
     exists and leaves the form halfway down the screen. The numbers and bill
     lists further up fill in from the session data late for the same reason,
     which moves the section the other way for anyone arriving on
     index.html#signup from a chamber page.

     So: let the browser do its usual jump, then keep re-aiming while the page
     is still changing height under us, until it settles or the reader takes
     over the scrolling themselves. */
  function anchors() {
    var header = document.querySelector('header.site');
    var stopCurrent = null;

    function aim(el) {
      // scroll-margin-top is what clears the sticky header; the fallback is
      // for any target that has not been given one.
      var gap = parseFloat(getComputedStyle(el).scrollMarginTop) ||
        (header ? header.offsetHeight + 12 : 0);
      var y = el.getBoundingClientRect().top + window.scrollY - gap;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

    var GIVE_UP = ['wheel', 'touchmove', 'keydown'];

    function follow(el) {
      if (stopCurrent) stopCurrent();

      function stop() {
        if (stopCurrent !== stop) return;
        stopCurrent = null;
        if (ro) ro.disconnect();
        clearTimeout(timer);
        GIVE_UP.forEach(function (t) { window.removeEventListener(t, stop); });
      }

      var ro = window.ResizeObserver ? new ResizeObserver(function () { aim(el); }) : null;
      var timer = setTimeout(stop, 5000);
      stopCurrent = stop;

      aim(el);
      if (ro) ro.observe(document.body);
      GIVE_UP.forEach(function (t) { window.addEventListener(t, stop, { passive: true }); });
    }

    // No preventDefault: the hash still needs to change, and the native jump
    // lands in the right place whenever the page happens to be settled already.
    document.addEventListener('click', function (e) {
      var plain = !e.defaultPrevented && e.button === 0 &&
        !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
      var a = plain && e.target.closest && e.target.closest('a[href^="#"]');
      var el = a && document.getElementById(a.getAttribute('href').slice(1));
      if (el) follow(el);
      // Anything else clickable — back to top, a card, a legislator link —
      // means the reader has moved on and should not be dragged back.
      else if (stopCurrent) stopCurrent();
    });

    if (location.hash.length > 1) {
      var landed = document.getElementById(location.hash.slice(1));
      if (landed) follow(landed);
    }
  }

  function boot() {
    if (forwardLegacyDistrict()) return;
    SC.navMenu();
    SC.backToTop();
    anchors();
    DEFAULT_HINT = $('#lookuphint').textContent;

    SC.load().then(function (data) {
      var house = SC.stats(data.house.members);
      var senate = SC.stats(data.senate.members);
      var housePro = data.house.bills.filter(function (b) {
        return String(b.pro).toUpperCase() === 'YAY';
      });

      fillStats({
        'total-bills': data.house.bills.length + data.senate.bills.length,
        'house-bills': data.house.bills.length,
        'house-pro-bills': housePro.length,
        'senate-bills': data.senate.bills.length,
        'house-avg': SC.pct(house.avg),
        'senate-avg': SC.pct(senate.avg),
        'house-d': SC.pct(house.avgD),
        'house-r': SC.pct(house.avgR),
        'senate-d': SC.pct(senate.avgD),
        'senate-r': SC.pct(senate.avgR),
        'champs-total': house.champions.length + senate.champions.length,
        'champs-house': house.champions.length,
        'champs-senate': senate.champions.length,
        'house-zeros': house.zeros.length,
        'senate-zeros': senate.zeros.length
      });

      var champs = house.champions.length + senate.champions.length;
      $('#numgrid').innerHTML =
        cell(SC.pct(house.avg), '#C2E6B8', 'Average House score') +
        cell(SC.pct(senate.avg), '#F2C94C', 'Average Senate score') +
        cell(champs, '#FFFFFF', 'Members with a perfect 100%, ' + house.champions.length +
          ' Representatives and ' + senate.champions.length + ' Senators') +
        cell(senate.zeros.length, '#F4A261', 'Senators who scored 0%');

      $('#splits').innerHTML =
        splitCard('House average by party', [
          { label: 'Democrats', value: house.avgD }, { label: 'Republicans', value: house.avgR }
        ]) +
        splitCard('Senate average by party', [
          { label: 'Democrats', value: senate.avgD }, { label: 'Republicans', value: senate.avgR }
        ]);

      /* The House card is the bills we asked the House to pass. The Senate card
         is only what still waits on the House: the anti-RGGI fiscal code (HB 416)
         passed both chambers and was signed into law, so it is left out here. */
      var senateWaiting = data.senate.bills.filter(function (b) {
        return !/signed into law/i.test(String(b.status || ''));
      });
      billList($('#passed-house'), housePro, SC.PAGES.house);
      billList($('#passed-senate'), senateWaiting, SC.PAGES.senate);

      var saved = SC.recall();
      if (saved && saved.dists) {
        $('#addr').value = saved.addr || '';
        renderResults(saved.dists, data);
        $('#lookuphint').textContent = 'Welcome back. These are the legislators you looked up last time.';
      }

      $('#lookupform').addEventListener('submit', function (e) {
        e.preventDefault();
        var address = $('#addr').value.trim();
        if (!address) return;
        var hint = $('#lookuphint');
        hint.textContent = 'Looking up…';
        SC.lookup(address).then(function (dists) {
          if (!dists || !data.house.byDist[dists.house]) {
            hint.textContent = 'No match for that address. Try a full street address with the city and state.';
            $('#lookupresult').innerHTML = '';
            return;
          }
          SC.remember({ addr: address, dists: dists });
          renderResults(dists, data);
          hint.textContent = 'Both chambers, one lookup. Saved for your next visit.';
        }).catch(function () {
          hint.innerHTML = 'The Census address lookup is not answering right now. ' +
            'You can still find your district on the ' +
            '<a href="' + SC.PAGES.senate + '">Senate</a> or <a href="' + SC.PAGES.house + '">House</a> map.';
          $('#lookupresult').innerHTML = '';
        });
      });
    }).catch(function (err) {
      $('#numgrid').innerHTML = '<div class="cell"><div class="lbl">Scores could not be loaded. ' +
        'Please reload the page.</div></div>';
      if (window.console) console.error(err);
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
