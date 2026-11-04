// Next-lesson bar: a fixed bar across the top of the page for students and
// parents who have signed in with an emailed link ("Next lesson on Thu, Nov 6
// at 4:00 PM for 60 min", a countdown under 24 hours, and a Zoom button from
// 30 minutes before). Signed in with no lessons booked, it has a
// button to the availability page instead. Signed out, nothing shows.
//
// The sign-in box goes wherever the page has <div id="next-lesson-box"></div>
// (login.html). The backend is the "Student sign-in" Apps Script web app.
//
// Previews without signing in: ?lessonbar=sample | soon | live | family | today | none | loading | stale
(function () {
	var API = 'https://script.google.com/macros/s/AKfycbz0z19vvsQdhKimWMDE9T2rO-bX88sMF_DhYBMal9B7enM4x6WSHoNzjacXZPrml7X3/exec';   // the Apps Script web app's /exec URL; empty: only ?lessonbar previews work
	var TOKEN_KEY = 'tk-lesson-token', DATA_KEY = 'tk-lesson-bar', HEIGHT_KEY = 'tk-lesson-bar-h';
	var REFRESH_MS = 5 * 60 * 1000;   // ask again this often, and on page loads after this long
	var ZOOM_OPENS_MS = 30 * 60 * 1000;
	var STALE_MS = 15 * 60 * 1000;   // a saved answer older than this isn't shown as fact
	var RECHECK_MS = 60 * 1000;      // back on the page after this long: ask again
	var MANUAL_GAP_MS = 10 * 1000;   // the refresh button works this often

	var store = {
		get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
		set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
		del: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
	};
	var params = new URLSearchParams(location.search);
	var preview = params.get('lessonbar');
	var state = { data: null, at: 0, failed: false, busy: false, manualAt: 0 };   // data: { email, students, next: {start, end, student} | null, zoom }

	// ---------- styles ----------
	var css = ''
		+ ':root { --lb-h: 0px; }'
		+ '.lesson-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 110; min-height: 46px; box-sizing: border-box;'
		+ ' display: flex; align-items: center; justify-content: center; gap: 10px; padding: 6px 24px;'
		+ ' background: #3C303E; color: #F5EEE2; font-size: 0.95em; line-height: 1.2; white-space: nowrap; overflow: hidden; }'
		+ '.lesson-bar[hidden] { display: none; }'
		+ '.lesson-bar .lb-row { display: flex; align-items: baseline; gap: 0 0.3em; }'
		+ '.lesson-bar .lb-end::after { content: "."; font-family: Arial, sans-serif; font-size: calc(1em / 1.1); color: #F5EEE2; }'
		+ '.lesson-bar .lb-plain .lb-end::after { content: none; }'
		+ '.lesson-bar a.lb-portal { color: #FB8C73; text-decoration: underline; }'
		+ '.lesson-bar .lb-meta { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 8px; font-size: 0.72em; }'
		+ '.lesson-bar .lb-ago { opacity: 0.65; }'
		+ '.lesson-bar .lb-refresh, .lesson-bar .lb-refresh:hover { margin: 0; padding: 0; border: 0; background: none; color: inherit; font-size: 1.18em; line-height: 1; cursor: pointer; opacity: 0.65; }'
		+ '.lesson-bar .lb-refresh:hover { opacity: 1; }'
		+ '.lesson-bar .lb-refresh i { min-width: 0; }'
		+ '.lesson-bar .lb-date, .lesson-bar .lb-count { font-family: Freeman, sans-serif; font-size: 1.1em; color: #FB8C73; }'
		+ '.lesson-bar .lb-count { font-variant-numeric: tabular-nums; }'
		+ '.lesson-bar .lb-u { font-size: 0.72em; margin-left: 1px; }'
		+ '.lesson-bar .lb-btn { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 24px; box-sizing: border-box; padding: 0 12px;'
		+ ' border-radius: 999px; border: 1.5px solid transparent; color: #fff; font-weight: bold; line-height: 1; text-decoration: none; font-size: 0.9em; transition: filter 0.2s; }'
		+ '.lesson-bar .lb-btn:hover { filter: brightness(1.1); color: #fff; }'
		+ '.lesson-bar .lb-btn i { min-width: 0; }'
		+ '.lesson-bar .lb-zoom { background: #2D8CFF; }'
		+ '.lesson-bar .lb-browse { background: #d46a53; }'
		+ '.lesson-bar .lb-tshort, .lesson-bar .lb-a8, .lesson-bar .lb-mshort { display: none; }'
		+ '.lesson-bar[data-fit="f1"] .lb-f1,'
		+ '.lesson-bar[data-fit="f2"] :is(.lb-f1, .lb-f2),'
		+ '.lesson-bar[data-fit="f3"] :is(.lb-f1, .lb-f2, .lb-f3),'
		+ '.lesson-bar[data-fit="f4"] :is(.lb-f1, .lb-f2, .lb-f3, .lb-mlong),'
		+ '.lesson-bar[data-fit="f5"] :is(.lb-f1, .lb-f2, .lb-f3, .lb-mlong, .lb-f5),'
		+ '.lesson-bar[data-fit="f6"] :is(.lb-f1, .lb-f2, .lb-f3, .lb-mlong, .lb-f5, .lb-tfull),'
		+ '.lesson-bar[data-fit="f7"] :is(.lb-f1, .lb-f2, .lb-f3, .lb-mlong, .lb-f5, .lb-tfull, .lb-f7),'
		+ '.lesson-bar[data-fit="f8"] :is(.lb-f1, .lb-f2, .lb-f3, .lb-mlong, .lb-f5, .lb-tfull, .lb-f7, .lb-f8) { display: none; }'
		+ '.lesson-bar:is([data-fit="f6"], [data-fit="f7"], [data-fit="f8"]) .lb-tshort, .lesson-bar[data-fit="f8"] .lb-a8,'
		+ '.lesson-bar:is([data-fit="f4"], [data-fit="f5"], [data-fit="f6"], [data-fit="f7"], [data-fit="f8"]) .lb-mshort { display: inline; }'
		+ '@media (max-width: 640px) { .lesson-bar { min-height: 42px; padding: 6px 14px; font-size: 0.85em; gap: 8px; } .lesson-bar .lb-btn { padding: 0 10px; } }'
		+ ':root[data-theme="dark"] .lesson-bar { border-bottom: 1px solid #ffffff24; }'
		+ '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .lesson-bar { border-bottom: 1px solid #ffffff24; } }'
		+ 'body.has-lesson-bar { padding-top: var(--lb-h); }'
		+ 'body.has-lesson-bar .navbar { top: calc(20px + var(--lb-h)); }'
		+ 'html.lb-early body { padding-top: var(--lb-h); }'
		+ 'html.lb-early body .navbar { top: calc(20px + var(--lb-h)); }'
		+ 'html.lb-early body::before { content: ""; position: fixed; top: 0; left: 0; right: 0; height: var(--lb-h); background: #3C303E; z-index: 109; }'
		// the sign-in box on login.html
		+ '#next-lesson-box { margin: 0 0 1em; padding: 16px 20px; border: 1.5px solid var(--surface-border); border-radius: 20px; background: var(--color3); line-height: 1.45; box-shadow: 1px 1px 10px var(--tint-4, #00000020); }'
		+ ':root[data-theme="dark"] #next-lesson-box { box-shadow: none; }'
		+ '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #next-lesson-box { box-shadow: none; } }'
		+ '#next-lesson-box h3 { margin: 0 0 6px; font-size: 1.1em; }'
		+ '#next-lesson-box .ls-beta { background: #d9e6f5; color: #1f5a96; font-family: Arial, sans-serif; font-size: 70%; font-weight: bold; letter-spacing: 0.05em; padding: 1px 7px; border-radius: 999px; vertical-align: middle; margin-left: 4px; white-space: nowrap; }'
		+ ':root[data-theme="dark"] #next-lesson-box .ls-beta { background: #1f3550; color: #9cc6f2; }'
		+ '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #next-lesson-box .ls-beta { background: #1f3550; color: #9cc6f2; } }'
		+ '#next-lesson-box p { margin: 6px 0; font-size: 14px; line-height: 21px; }'
		+ '#next-lesson-box form { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }'
		+ '#next-lesson-box input { flex: 1 1 200px; min-width: 0; font-family: Freeman, sans-serif; font-size: 20px; color: var(--color1); background-color: var(--tint-1); border: 1px solid var(--color1); border-radius: 999px; padding: 11px 14px; }'
		+ '#next-lesson-box input::placeholder { color: var(--color1); opacity: 0.5; }'
		+ '#next-lesson-box button { font: inherit; font-weight: bold; cursor: pointer; background: var(--button-bg); color: var(--button-text, #fff); }'
		+ '#next-lesson-box button:hover { background: var(--button-bg-hover); }'
		+ '#next-lesson-box button:disabled { opacity: 0.6; cursor: default; }'
		+ '#next-lesson-box .ls-link { background: none; color: var(--link, inherit); padding: 0; font-weight: normal; text-decoration: underline; }'
		+ '#next-lesson-box .ls-link:hover { background: none; }'
		+ '#next-lesson-box .ls-acct { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 12px; margin: 6px 0; }'
		+ '#next-lesson-box .ls-acct .ls-link { flex: none; margin: 0; font-size: 13px; }'
		+ '#next-lesson-box .ls-err { color: #d4553f; }'
		+ '#next-lesson-box .ls-feedback { margin-top: 10px; }'
		+ '#next-lesson-box p.ls-status { font-size: 12px; line-height: 18px; opacity: 0.65; }'
		+ '#next-lesson-box.ls-shut { cursor: pointer; }'
		+ '#next-lesson-box .ls-go { margin: 0; color: var(--defaultlink); }'
		+ '#next-lesson-box .ls-go i { min-width: 0; font-size: 0.75em; }'
		+ '#next-lesson-box .ls-opening { animation: ls-open 0.2s ease-out; }'
		+ '@keyframes ls-open { from { opacity: 0; transform: translateY(-6px); } }'
		+ '#next-lesson-box .ls-who { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; font-size: 13px; box-sizing: border-box; padding: 3px 4px 3px 9px; border: 1px solid var(--tint-3); border-radius: 999px; background: var(--tint-1); overflow-wrap: anywhere; }'
		+ '#next-lesson-box .ls-on { flex: none; display: inline-flex; align-items: center; gap: 3px; padding: 1px 6px; border-radius: 999px; background: #3a9d5d; color: #fff; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; }'
		+ '#next-lesson-box .ls-on i { min-width: 0; }'
		+ '#next-lesson-box .ls-warn { font-size: 0.85em; font-weight: bold; color: #b02a1e; }'
		+ ':root[data-theme="dark"] #next-lesson-box .ls-warn { color: #ff9a8c; }'
		+ '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #next-lesson-box .ls-warn { color: #ff9a8c; } }'
		+ '#next-lesson-box .ls-diagram { display: block; width: 100%; max-width: 280px; height: auto; margin: 10px auto; }';
	var styleEl = document.createElement('style');
	styleEl.textContent = css;
	document.head.appendChild(styleEl);

	// this file runs in the head, before the first paint, but the bar needs the
	// body: until then a plain strip holds its place, so the page doesn't jump
	function cached() {
		try { var c = JSON.parse(store.get(DATA_KEY)); return c && c.data ? c : null; } catch (e) { return null; }
	}
	if (!preview && token() && cached()) {
		document.documentElement.classList.add('lb-early');
		document.documentElement.style.setProperty('--lb-h', (Number(store.get(HEIGHT_KEY)) || (innerWidth <= 640 ? 42 : 46)) + 'px');
	}

	// ---------- backend ----------
	function call(action, args) {
		if (!API) return Promise.reject(new Error('no API'));
		var q = new URLSearchParams(args || {});
		q.set('action', action);
		return fetch(API + '?' + q.toString(), { cache: 'no-store' }).then(function (r) {
			if (!r.ok) throw new Error('HTTP ' + r.status);
			return r.json();
		});
	}

	// made-up data for ?lessonbar=…
	function sample(kind) {
		var now = Date.now(), at = function (min, len) { return { start: new Date(now + min * 60e3).toISOString(), end: new Date(now + (min + len) * 60e3).toISOString(), student: 'Ava Sample' }; };
		var base = { email: 'parent@example.com', students: ['Ava Sample'], zoom: 'https://zoom.us/' };
		if (kind === 'none') return Object.assign(base, { next: null });
		if (kind === 'loading') return { loading: true };
		if (kind === 'soon') return Object.assign(base, { next: at(20, 60) });
		if (kind === 'today') return Object.assign(base, { next: at(200, 60) });
		if (kind === 'live') return Object.assign(base, { next: at(-15, 60) });
		if (kind === 'family') return Object.assign(base, { students: ['Ava Sample', 'Leo Sample'], next: at(3 * 1440 + 125, 90) });
		return Object.assign(base, { next: at(3 * 1440 + 65, 60) });
	}

	function token() { return store.get(TOKEN_KEY); }

	// e.g. "Chrome on Android", for the sign-in list
	function deviceName() {
		var ua = navigator.userAgent;
		var browser = /Edg/.test(ua) ? 'Edge' : /OPR|Opera/.test(ua) ? 'Opera' : /Firefox|FxiOS/.test(ua) ? 'Firefox' :
			/Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Browser';
		var os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' :
			/Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? (navigator.maxTouchPoints > 1 ? 'iPad' : 'Mac') :
			/CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'unknown device';
		return browser + ' on ' + os;
	}

	function signedOut() {
		store.del(TOKEN_KEY); store.del(DATA_KEY); store.del(HEIGHT_KEY);
		state.data = null; state.at = 0;
		render(); renderBox();
	}

	function refresh(fresh) {
		if (preview) {
			state.data = sample(preview); state.failed = preview === 'stale';
			state.at = state.failed ? 1 : Date.now();
			render(); renderBox(); meta();
			return Promise.resolve();
		}
		var t = token();
		if (!t) return Promise.resolve();
		state.busy = true; meta();
		var args = { token: t };
		if (fresh) args.fresh = '1';
		return call('next', args).then(function (d) {
			if (d.error === 'signed-out') { signedOut(); return; }
			if (d.error) { state.failed = true; return; }
			state.data = d; state.at = Date.now(); state.failed = false;
			store.set(DATA_KEY, JSON.stringify({ at: state.at, data: d }));
			render(); renderBox();
		}).catch(function () { state.failed = true; /* offline or backend down: keep what's showing */ }).then(function () {
			state.busy = false;
			if (state.data) render();
			meta();
		});
	}

	// ---------- the bar ----------
	var bar;
	var fmtDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	var fmtTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
	function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
	function shortTime(d) { return fmtTime.format(d).replace(/\s?([AP])M$/, function (m, a) { return a.toLowerCase(); }); }
	// AM/PM (or a/p) as small as the countdown's h, m and s
	function timeHtml(t) { return esc(t).replace(/\s?([AaPp]M?)$/, '<span class="lb-u">$1</span>'); }

	function ensureBar() {
		if (bar) return;
		bar = document.createElement('div');
		bar.className = 'lesson-bar'; bar.id = 'lesson-bar'; bar.setAttribute('role', 'status'); bar.hidden = true;
		document.body.insertBefore(bar, document.body.firstChild);
		new ResizeObserver(function () {
			document.documentElement.style.setProperty('--lb-h', bar.hidden ? '0px' : Math.ceil(bar.offsetHeight) + 'px');
			if (!bar.hidden) store.set(HEIGHT_KEY, Math.ceil(bar.offsetHeight));
		}).observe(bar);
		addEventListener('resize', function () { if (!bar.hidden) { fit(); meta(); } });
		if (document.fonts) document.fonts.ready.then(function () { if (!bar.hidden) fit(); });
	}

	function render() {
		ensureBar();
		var d = state.data;
		var n = d && d.next && { start: new Date(d.next.start), end: new Date(d.next.end), student: d.next.student };
		if (n && n.end <= Date.now()) { n = null; if (!preview && Date.now() - state.at > 30e3) { state.at = Date.now(); refresh(); } }
		var on = !!d;
		bar.hidden = !on;
		document.body.classList.toggle('has-lesson-bar', on);
		document.documentElement.classList.remove('lb-early');
		document.documentElement.style.setProperty('--lb-h', on ? Math.ceil(bar.offsetHeight) + 'px' : '0px');
		if (!on) { bar.dataset.key = ''; return; }

		// old and can't be checked: better no lesson than a wrong one
		if (state.failed && Date.now() - state.at >= STALE_MS) {
			if (bar.dataset.key !== 'failed') {
				bar.dataset.key = 'failed';
				bar.classList.add('is-none');
				bar.innerHTML = '<span class="lb-row lb-plain"><span><span class="lb-f8">Can’t check your schedule right now. Please see the </span><span class="lb-a8">See the </span><a class="lb-portal" href="/login.html">Portal Login</a>.</span></span>';
				bar.dataset.fit = '';
			}
			if (!bar.dataset.fit || bar.scrollWidth > bar.clientWidth) fit();
			return;
		}

		if (!n) {
			bar.classList.add('is-none');
			if (d.loading) {
				if (bar.dataset.key !== 'loading') {
					bar.dataset.key = 'loading';
					bar.innerHTML = '<span class="lb-row lb-plain"><span>Fetching your next lesson…</span></span>';
					bar.dataset.fit = '';
				}
			} else if (bar.dataset.key !== 'none') {
				bar.dataset.key = 'none';
				bar.innerHTML = '<span class="lb-row"><span><span class="lb-f8">You have no</span><span class="lb-a8">No</span> upcoming lessons</span></span>'
					+ '<a class="lb-btn lb-browse" href="/availability.html"><i class="fa-solid fa-calendar-days"></i><span class="lb-f7">Browse Availability</span></a>';
				bar.dataset.fit = '';
			}
			if (!bar.dataset.fit || bar.scrollWidth > bar.clientWidth) fit();
			return;
		}
		bar.classList.remove('is-none');
		var now = Date.now(), live = n.start <= now;
		var left = (live ? n.end : n.start) - now;
		var zoomOn = !!d.zoom && (live || left <= ZOOM_OPENS_MS);
		var t0 = new Date(); t0.setHours(0, 0, 0, 0);
		var n0 = new Date(n.start); n0.setHours(0, 0, 0, 0);
		var days = Math.round((n0 - t0) / 864e5);
		var when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : null;
		// a parent with more than one student: whose lesson it is
		var who = d.students && d.students.length > 1 && n.student ? n.student.split(/\s+/)[0] : '';
		var key = [n.start.getTime(), n.end.getTime(), who, zoomOn && d.zoom, live, days].join('|');
		if (bar.dataset.key !== key) {
			bar.dataset.key = key;
			var zoom = zoomOn ? '<a class="lb-btn lb-zoom" href="' + esc(d.zoom) + '" target="_blank" rel="noopener"><i class="fa-solid fa-video"></i><span class="lb-f7">Zoom</span></a>' : '';
			var mins = Math.round((n.end - n.start) / 60e3);
			var name = '<span class="lb-date">' + esc(who) + '</span>';
			bar.innerHTML = '<span class="lb-row">' + (live
				? '<span><span class="lb-f8">' + (who ? name + '’s lesson' : 'Lesson') + ' in progress,</span><span class="lb-a8">' + (who ? name + ':' : 'In progress,') + '</span></span><span class="lb-in">ends in</span><span class="lb-count"></span>'
				: '<span><span class="lb-f8">Next lesson' + (who ? ' for ' + name : '') + '</span><span class="lb-a8">' + (who ? name : 'Next') + ':</span>' + (when ? '' : '<span class="lb-f2"> on</span>') + '</span>'
					+ '<span class="lb-date">' + esc(when || fmtDate.format(n.start)) + '</span>'
					+ (when ? '' : '<span class="lb-f1">(in ' + days + ' days)</span>')
					+ '<span>at</span><span class="lb-date"><span class="lb-tfull">' + timeHtml(fmtTime.format(n.start)) + '</span><span class="lb-tshort">' + timeHtml(shortTime(n.start)) + '</span></span>'
					+ '<span class="lb-f5">for</span><span class="lb-date lb-f5">' + mins + '<span class="lb-u lb-mlong">min</span><span class="lb-u lb-mshort">m</span></span><span class="lb-in" hidden>in</span><span class="lb-count" hidden></span>')
				+ '</span>' + zoom;
			bar.dataset.fit = '';
		}
		var inEl = bar.querySelector('.lb-in'), count = bar.querySelector('.lb-count');
		if (left < 864e5) {
			var sec = Math.floor(left / 1000);
			var h = Math.floor(sec / 3600); sec -= h * 3600;
			var m = Math.floor(sec / 60); sec -= m * 60;
			var p = function (v) { return String(v).padStart(2, '0'); }, u = function (x) { return '<span class="lb-u">' + x + '</span>'; };
			var was = count.hidden;
			inEl.hidden = count.hidden = false;
			count.innerHTML = p(h) + u('h') + ' ' + p(m) + u('m') + '<span class="lb-f3"> ' + p(sec) + u('s') + '</span>';
			if (was) bar.dataset.fit = '';
		} else inEl.hidden = count.hidden = true;
		if (!bar.dataset.fit || bar.scrollWidth > bar.clientWidth) fit();
	}

	function updated() {
		var mins = Math.floor((Date.now() - state.at) / 60e3);
		return mins < 1 ? 'Updated just now' : 'Updated ' + mins + ' min ago';
	}

	// the bar's far-right note again, in the sign-in box, for screens too narrow for it
	function boxStatus() {
		var el = document.querySelector('#next-lesson-box .ls-status');
		if (!el) return;
		var lesson = state.data && state.data.next, known = state.at > 1;
		el.textContent = (lesson ? zoneName(new Date(lesson.start)) + (known ? ' · ' : '') : '') + (known ? updated() : '');
	}

	// e.g. "in America/New_York (UTC-5)", with the offset on the lesson's own date
	function zoneName(date) {
		var off = -date.getTimezoneOffset(), abs = Math.abs(off), m = abs % 60;
		return 'in ' + Intl.DateTimeFormat().resolvedOptions().timeZone + ' (UTC' + (off < 0 ? '-' : '+') + Math.floor(abs / 60) + (m ? ':' + String(m).padStart(2, '0') : '') + ')';
	}

	// how old the answer is and a refresh button, at the far right. Positioned out
	// of the flow so nothing else moves, and only shown where there's room.
	function meta() {
		if (!bar || bar.hidden) return;
		var box = bar.querySelector('.lb-meta');
		if (!box) {
			box = document.createElement('span');
			box.className = 'lb-meta';
			box.innerHTML = '<span class="lb-ago"><span class="lb-zone"></span><span class="lb-when"></span></span><button type="button" class="lb-refresh" aria-label="Refresh next lesson" title="Refresh"><i class="fa-solid fa-arrows-rotate"></i></button>';
			bar.appendChild(box);
			box.querySelector('button').addEventListener('click', function () {
				if (Date.now() - state.manualAt < MANUAL_GAP_MS) return;
				state.manualAt = Date.now();
				refresh(true);
			});
		}
		var ago = box.querySelector('.lb-ago');
		var zone = box.querySelector('.lb-zone'), lesson = state.data && state.data.next;
		box.querySelector('.lb-when').textContent = updated();
		zone.textContent = lesson ? zoneName(new Date(lesson.start)) + ' · ' : '';
		box.querySelector('i').classList.toggle('fa-spin', state.busy);
		var end = 0;
		Array.prototype.forEach.call(bar.children, function (c) { if (c !== box) end = Math.max(end, c.getBoundingClientRect().right); });
		var room = function () { return box.getBoundingClientRect().left >= end + 12; };
		box.hidden = false;
		ago.hidden = !state.at || state.at === 1;
		zone.hidden = !lesson;
		if (!room()) zone.hidden = true;
		if (!room()) ago.hidden = true;
		if (!room()) box.hidden = true;
	}

	// one line always: drop the optional pieces in order until it fits, then put
	// the full stop after whatever now ends the sentence
	function fit() {
		for (var lvl = 0; lvl <= 8; lvl++) {
			bar.dataset.fit = 'f' + lvl;
			bar.querySelectorAll('.lb-end').forEach(function (x) { x.classList.remove('lb-end'); });
			var vis = Array.prototype.filter.call(bar.querySelectorAll('.lb-row > span'), function (x) { return !x.hidden && x.offsetWidth; });
			if (vis.length) vis[vis.length - 1].classList.add('lb-end');
			if (bar.scrollWidth <= bar.clientWidth) break;
		}
	}

	// ---------- the sign-in box (login.html) ----------
	var box = { mode: null, email: '', msg: '', open: false, anim: false };   // mode: form | sent | redeeming | signedin

	// a page of the site with the bar across the top, for the sign-in box
	var BAR_DIAGRAM = '<svg class="ls-diagram" viewBox="0 0 280 86" role="img" aria-label="The home page of this site with a dark bar across the very top, above the menu and page title, showing the next lesson and a Zoom link">'
		+ '<rect x="1" y="1" width="278" height="84" rx="8" fill="var(--color3)" stroke="var(--tint-5)" stroke-width="1.5"/>'
		+ '<path d="M1 24V9a8 8 0 0 1 8-8h262a8 8 0 0 1 8 8v15z" fill="#3C303E"/>'
		+ '<text x="24" y="16" font-family="Arial, sans-serif" font-size="10" fill="#F5EEE2">Next lesson <tspan fill="#FB8C73" font-weight="bold">Tuesday</tspan> at <tspan fill="#FB8C73" font-weight="bold">4:00 PM</tspan></text>'
		+ '<rect x="205" y="6" width="48" height="13" rx="6.5" fill="#2D8CFF"/>'
		+ '<text x="229" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#fff">Zoom</text>'
		+ '<defs><linearGradient id="ls-title" gradientUnits="userSpaceOnUse" x1="54" y1="0" x2="172" y2="0"><stop offset="0" style="stop-color: rgb(175, 0, 105)"/><stop offset="1" style="stop-color: var(--color2)"/></linearGradient><filter id="ls-blur" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation="0.7"/></filter></defs>'
		+ '<g opacity="0.25" filter="url(#ls-blur)"><rect x="14" y="31" width="252" height="19" rx="9.5" fill="var(--color3)" stroke="var(--tint-5)"/>'
		+ '<rect x="22" y="34" width="60" height="13" rx="6.5" fill="var(--tint-3)"/>'
		+ '<g font-family="Freeman, sans-serif" font-size="9" fill="currentColor" text-anchor="middle"><text x="52" y="44">Trevor Kafka</text><text x="118" y="44">Get Started</text><text x="176" y="44">Students</text><text x="228" y="44">Login</text></g>'
		+ '<text x="140" y="71" text-anchor="middle" font-family="Freeman, sans-serif" font-size="12" fill="currentColor">Online <tspan fill="url(#ls-title)">Math &amp; Physics Tutoring</tspan> with Trevor Kafka</text></g>'
		+ '</svg>';

	function renderBox() {
		var el = document.getElementById('next-lesson-box');
		if (!el) return;
		var mode = box.mode || (state.data || token() ? 'signedin' : 'form');
		// signed out, the box stays shut until someone opens it; an error needs to be seen
		var open = mode !== 'form' || box.open || !!box.msg;
		var title = '<i class="fa-solid fa-clock"></i> Next lesson preview<span class="ls-beta">beta</span>';
		var html = '<h3>' + title + '</h3>';
		if (mode === 'redeeming') html += '<p>Signing you in…</p>';
		else if (mode === 'sent') {
			html += '<p>Check your email. If <strong>' + esc(box.email) + '</strong> is on file for a student or parent, a sign-in link is on its way. It works once, within 30 minutes.</p>'
				+ '<p><button type="button" class="ls-link" data-ls="again">Use a different email</button></p>';
		} else if (mode === 'signedin') {
			var who = state.data && state.data.email;
			html += '<div class="ls-acct">' + (who ? '<span class="ls-who"><strong>' + esc(who) + '</strong><span class="ls-on"><i class="fa-solid fa-check"></i>enabled</span></span>' : '<span>Signed in.</span>')
				+ '<button type="button" class="ls-link" data-ls="signout">Sign out</button></div>'
				+ '<p>A Zoom link will appear in the bar at the top of the screen 30 minutes before your lesson starts.</p>';
		} else {
			html += '<p>Show your next lesson at the top of the main pages on trevorkafka.com, even without being logged into the student portal.</p>'
				+ (open ? '' : '<p><button type="button" class="ls-link ls-go" data-ls="toggle" aria-expanded="false" aria-controls="ls-more">Let’s do it! <i class="fa-solid fa-chevron-down"></i></button></p>')
				+ '<div id="ls-more"' + (open ? (box.anim ? ' class="ls-opening"' : '') : ' hidden') + '>' + (open ? '<p>Enter the email you use for the student portal and check your email for a magic link.</p><p class="ls-warn"><i class="fa-solid fa-triangle-exclamation"></i> This is separate from the Portal Login. You cannot schedule lessons here.</p>'
				+ BAR_DIAGRAM
				+ (box.msg ? '<p class="ls-err">' + esc(box.msg) + '</p>' : '')
				+ '<form><input type="email" name="email" required autocomplete="email" placeholder="Email address" aria-label="Email address" value="' + esc(box.email) + '"><button type="submit">Send magic link</button></form>' : '') + '</div>';
		}
		if (open) html += '<p class="ls-feedback">Feedback? Email me at <span class="tooltip"><a onclick="copyEmail()" onmouseout="outFunc()">tutor@trevorkafka.com</a><span class="tooltiptext">Copy to clipboard</span></span></p>';
		if (mode === 'signedin') html += '<p class="ls-status"></p>';
		el.innerHTML = html;
		boxStatus();
		el.classList.toggle('ls-shut', !open);
		box.anim = false;
	}

	document.addEventListener('submit', function (e) {
		var form = e.target.closest && e.target.closest('#next-lesson-box form');
		if (!form) return;
		e.preventDefault();
		var email = form.email.value.trim(), btn = form.querySelector('button');
		box.email = email; box.msg = '';
		btn.disabled = true; btn.textContent = 'Sending…';
		if (preview) { box.mode = 'sent'; renderBox(); return; }
		call('request', { email: email, origin: location.origin }).then(function (d) {
			if (d.error === 'email') { box.msg = 'That doesn’t look like an email address.'; box.mode = 'form'; }
			else if (d.error) { box.msg = 'Something went wrong. Please try again in a minute.'; box.mode = 'form'; }
			else box.mode = 'sent';
			renderBox();
		}).catch(function () { box.msg = 'Couldn’t reach the server. Please try again in a minute.'; box.mode = 'form'; renderBox(); });
	});

	document.addEventListener('click', function (e) {
		var b = e.target.closest && e.target.closest('#next-lesson-box [data-ls]');
		// shut, the whole box is the way in
		if (!b && e.target.closest && e.target.closest('#next-lesson-box.ls-shut')) { box.open = box.anim = true; renderBox(); return; }
		if (!b) return;
		if (b.dataset.ls === 'again') { box.mode = 'form'; box.msg = ''; box.open = true; renderBox(); }
		if (b.dataset.ls === 'toggle') {
			box.open = box.anim = true;
			renderBox();
			document.querySelector('#next-lesson-box input').focus();
		}
		if (b.dataset.ls === 'signout') {
			var t = token();
			if (t) call('signout', { token: t }).catch(function () {});
			box.mode = 'form'; box.email = ''; box.msg = '';
			if (preview) { preview = null; state.data = null; render(); renderBox(); return; }
			signedOut();
		}
	});

	// ---------- start ----------
	function start() {
		var code = params.get('signin');
		if (code) {
			// take the code out of the address bar, so it isn't bookmarked or shared
			params.delete('signin');
			history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
			box.mode = 'redeeming'; renderBox();
			call('redeem', { code: code, device: deviceName() }).then(function (d) {
				if (d.token) { store.set(TOKEN_KEY, d.token); box.mode = 'signedin'; state.data = { email: d.email, loading: true }; render(); return refresh(); }
				box.mode = 'form';
				box.msg = 'That sign-in link has expired or was already used. Enter your email for a new one.';
			}).catch(function () { box.mode = 'form'; box.msg = 'Couldn’t reach the server to sign you in. Please open the link again in a minute.'; })
				.then(function () { renderBox(); });
		} else renderBox();

		if (preview) refresh();
		else if (token()) {
			// show the last answer straight away, then check for a newer one
			var c = cached();
			var fresh = c && Date.now() - c.at < STALE_MS;
			state.data = fresh ? c.data : { email: c && c.data.email, loading: true };
			state.at = fresh ? c.at : 0;
			render(); renderBox();
			if (!code && Date.now() - state.at > 60e3) refresh();
		}
		setInterval(function () { if (state.data) { render(); meta(); boxStatus(); } }, 1000);
		// timers stop while a tab is hidden or a device sleeps: look again on the way back
		function back() {
			if (preview || !token() || document.hidden || Date.now() - state.at < RECHECK_MS) return;
			if (state.data && Date.now() - state.at >= STALE_MS) { state.data = { email: state.data.email, loading: true }; render(); }
			refresh();
		}
		document.addEventListener('visibilitychange', back);
		['focus', 'pageshow', 'online'].forEach(function (ev) { addEventListener(ev, back); });
		setInterval(function () { if (token() || preview) refresh(); }, REFRESH_MS);
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
	else start();
})();
