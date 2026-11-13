// One Google sign-in for every Kafka page. All pages share one token in
// localStorage (same site), asked for once with every scope any page needs, so
// signing in on one page signs in on all of them, in other open tabs too.
// This file is copied to the site unencrypted: only the app ID (not secret:
// Google accepts it only from trevorkafka.com and the local test servers) and logic.
//
//   KafkaGoogle.cached(scopes)        the saved token if it's still good and has these scopes, else null
//   KafkaGoogle.getToken({ interactive, scopes, consent, hint })
//                                     a Promise of a token: the saved one, else a quiet request
//                                     (interactive: false) or a sign-in popup (call from a click).
//                                     Rejects { error, missingScopes } when Google says no.
//   KafkaGoogle.invalidate(token)     forget a token Google refused (401)
//   KafkaGoogle.onChange(fn)          fn(token or null) whenever the saved token changes, here or in another tab
//   KafkaGoogle.signOut()
(function () {
	var CLIENT_ID = '641397643087-q2dqlpsfa1okj2i7j2d335p96652bpu0.apps.googleusercontent.com';
	var S = 'https://www.googleapis.com/auth/';
	var SCOPES = [S + 'calendar.readonly', S + 'tasks', S + 'spreadsheets', S + 'drive.metadata.readonly'];
	var KEY = 'kafka_google_token', OLD_KEYS = ['kafka_gcal_token', 'kafka_sheets_token'];
	var IMPLIED = {};   // a broader scope covers its read-only one
	IMPLIED[S + 'spreadsheets.readonly'] = S + 'spreadsheets';
	IMPLIED[S + 'calendar.readonly'] = S + 'calendar';
	var listeners = [], waiters = [], client = null, gsi = null, gsiWait = [], hint = null, inflight = false, last;

	function words(s) { return (Array.isArray(s) ? s : String(s || '').split(/\s+/)).filter(Boolean); }
	// saved as { token, exp, scopes }: the shape the old per-page keys had, which other
	// Kafka code (the index page's card badges) reads from any kafka_…token key
	var mem = null;   // if localStorage can't be used, this page still keeps its token
	function read() { try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && c.token) return c; } catch (e) {} return mem; }
	function write(c) { mem = c; try { if (c) localStorage.setItem(KEY, JSON.stringify(c)); else localStorage.removeItem(KEY); } catch (e) {} }
	function live(c) { return !!c && c.exp > Date.now() + 60e3; }
	function lacking(c, need) {
		var have = ' ' + ((c && c.scopes) || '') + ' ';
		return words(need || SCOPES).filter(function (s) { return have.indexOf(' ' + s + ' ') < 0 && !(IMPLIED[s] && have.indexOf(' ' + IMPLIED[s] + ' ') >= 0); });
	}
	function cached(need) { var c = read(); return live(c) && !lacking(c, need).length ? c.token : null; }
	function emit() {
		var c = read(), t = live(c) ? c.token : null;
		if (t === last) return;
		last = t;
		listeners.slice().forEach(function (fn) { try { fn(t); } catch (e) { setTimeout(function () { throw e; }); } });
	}
	window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) emit(); });

	// the per-page tokens from before: adopt a still-good one (asking Google which scopes it
	// has), then stop using them
	var ready = (function () {
		if (read()) return Promise.resolve();
		var best = null;
		OLD_KEYS.forEach(function (k) {
			try { var o = JSON.parse(localStorage.getItem(k) || 'null'); if (!best && o && o.token && o.exp > Date.now() + 120e3) best = o; } catch (e) {}
		});
		function drop() { OLD_KEYS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }
		if (!best) { drop(); return Promise.resolve(); }
		return fetch('https://oauth2.googleapis.com/tokeninfo', {
			method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'access_token=' + encodeURIComponent(best.token)
		}).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
			if (d && d.scope && d.aud === CLIENT_ID && !read()) write({ token: best.token, exp: best.exp, scopes: d.scope });
		}).catch(function () {}).then(function () { drop(); emit(); });
	})();

	// Google's sign-in library, loaded straight away so a click can open the popup at once
	function withGsi(fn) {
		if (gsi === 'ok') return fn();
		if (gsi === 'failed') return fn({ error: 'gsi_load' });
		gsiWait.push(fn);
		if (gsi) return;
		gsi = 'loading';
		var el = document.createElement('script');
		el.src = 'https://accounts.google.com/gsi/client';
		el.async = true;
		el.onload = function () { gsi = 'ok'; gsiWait.splice(0).forEach(function (f) { f(); }); };
		el.onerror = function () { gsi = 'failed'; gsiWait.splice(0).forEach(function (f) { f({ error: 'gsi_load' }); }); };
		document.head.appendChild(el);
	}
	function settle(err, c) {
		inflight = false;
		waiters.splice(0).forEach(function (w) { if (err) w.rej(err); else w.res(c); });
	}
	function request(interactive, consent) {
		return new Promise(function (res, rej) {
			waiters.push({ res: res, rej: rej });
			if (inflight && !interactive) return;   // a quiet request is already on its way: share it
			inflight = true;
			withGsi(function (err) {
				if (err) return settle(err);
				if (!client) client = google.accounts.oauth2.initTokenClient({
					client_id: CLIENT_ID, scope: SCOPES.join(' '), include_granted_scopes: true, hint: hint || undefined,
					callback: function (r) {
						if (r.error || !r.access_token) return settle({ error: r.error || 'no_token' });
						var c = { token: r.access_token, exp: Date.now() + r.expires_in * 1000, scopes: r.scope || '' };
						write(c); emit(); settle(null, c);
					},
					// no popup (blocked, or closed): the page shows its Connect button
					error_callback: function (e) { settle({ error: (e && e.type) || 'popup' }); }
				});
				client.requestAccessToken({ prompt: consent ? 'consent' : interactive ? '' : 'none', login_hint: hint || undefined });
			});
		});
	}
	function getToken(o) {
		o = o || {};
		if (o.hint) hint = o.hint;
		return ready.then(function () {
			var t = cached(o.scopes);
			if (t && !o.consent) return t;
			return request(!!o.interactive, !!o.consent).then(function (c) {
				var miss = lacking(c, o.scopes);
				if (miss.length) throw { error: 'missing_scopes', missingScopes: miss };
				return c.token;
			});
		});
	}

	window.KafkaGoogle = {
		SCOPES: SCOPES.join(' '),
		cached: cached,
		getToken: getToken,
		hasScopes: function (need) { return !lacking(read(), need).length; },
		invalidate: function (t) { var c = read(); if (t && c && c.token === t) { write(null); emit(); } },
		onChange: function (fn) { listeners.push(fn); },
		signOut: function () {
			var c = read();
			write(null); emit();
			if (c) withGsi(function (err) { if (!err) google.accounts.oauth2.revoke(c.token, function () {}); });
		}
	};
	last = live(read()) ? read().token : null;
	withGsi(function () {});
})();
