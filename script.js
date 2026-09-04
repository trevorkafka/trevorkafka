//
// SECTION 0: LIGHT/DARK THEME
//
// Apply a previously chosen theme as early as possible so the page doesn't
// flash. With no saved choice, the CSS prefers-color-scheme block handles the
// device default (no JS needed). The nav toggle (in navigation.html) writes the
// choice to localStorage.
(function themeToggleSetup() {
    var root = document.documentElement;
    // Apply a saved choice early to avoid a flash (device default handled by CSS).
    try {
        var saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
    } catch (e) {}

    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    function effective() {
        var a = root.getAttribute('data-theme');
        if (a === 'dark' || a === 'light') return a;
        return mq.matches ? 'dark' : 'light';
    }
    // On pages without the site nav (e.g. italki lesson pages), add a floating
    // toggle. Pages that have <trevorkafka-nav> use the nav toggle instead.
    function addFloatingToggle() {
        if (document.querySelector('trevorkafka-nav')) return;
        if (document.getElementById('theme-toggle-float') || !document.body) return;
        var btn = document.createElement('button');
        btn.id = 'theme-toggle-float';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        btn.style.cssText = 'position:fixed;top:14px;right:14px;z-index:1000;width:42px;height:42px;border-radius:50%;border:1px solid var(--surface-border);background:var(--color3);color:var(--color1);cursor:pointer;box-shadow:1px 1px 10px var(--shadow);font-size:18px;display:flex;align-items:center;justify-content:center;padding:0;margin:0;';
        function updateIcon() {
            btn.innerHTML = effective() === 'dark'
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
        }
        btn.addEventListener('click', function () {
            var next = effective() === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            updateIcon();
        });
        mq.addEventListener('change', function () {
            if (!root.getAttribute('data-theme')) updateIcon();
        });
        document.body.appendChild(btn);
        updateIcon();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addFloatingToggle);
    } else {
        addFloatingToggle();
    }
})();

//
// SECTION 0.25: FULL-HEIGHT CONTENT ABOVE THE FOOTER
//
// Wrap everything above the footer in one element that's at least a viewport
// tall (see #above-footer in style.css). On short pages this keeps the footer
// just below the fold, so it's only revealed on scroll. Runs synchronously —
// script.js is deferred, so the DOM (including <trevorkafka-footer>) is parsed.
(function padAboveFooter() {
    var footer = document.querySelector('body > trevorkafka-footer, body > footer');
    if (!footer || document.getElementById('above-footer')) return;
    var wrap = document.createElement('div');
    wrap.id = 'above-footer';
    // Collect every body child before the footer, except the fixed nav.
    var node = document.body.firstChild;
    var toMove = [];
    while (node && node !== footer) {
        var isNav = node.nodeType === 1 && node.tagName.toLowerCase() === 'trevorkafka-nav';
        if (!isNav) toMove.push(node);
        node = node.nextSibling;
    }
    document.body.insertBefore(wrap, footer);
    toMove.forEach(function (n) { wrap.appendChild(n); });
})();

//
// SECTION 0.5: CLOUDFLARE WEB ANALYTICS (cookieless, privacy-friendly)
//
// Injected here so every page that loads script.js is tracked automatically,
// without pasting the beacon into each HTML file. Cloudflare's beacon reads the
// token from the data-cf-beacon attribute on its own <script> element.
(function loadCloudflareAnalytics() {
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', '{"token": "389e2db315b8432fbe6d5844de5f490e"}');
    document.head.appendChild(s);
})();

//
// SECTION 1: CUSTOM HTML TAG REPLACEMENTS
//

//navigation bar HTML insertion and addition of "active-link" class to current page for styling purposes
$('trevorkafka-nav').load('/snippets/navigation.html', function() {
        $("#" + window.location.pathname.split("/").pop().split(".")[0]).addClass("active-link");
    });

//other replacements
$('trevorkafka-email').load('/snippets/email.html')
$('trevorkafka-footer').load('/snippets/footer.html')
$('trevorkafka-announcement').load('/snippets/announcement.html')
$(`trevorkafka-availability`).load('/snippets/availability.html')

//
// SECTION 2: SPECIFIC-USE FUNCTIONS
//

//FADE SLIDE INS
// adapted from https://blog.hubspot.com/website/css-fade-in

$(document).on("scroll", function() {
  var pageTop = $(document).scrollTop();
  var pageBottom = pageTop + $(window).height();
  var fades = $(".fade");

  for (var i = 0; i < fades.length; i++) {
    var fade = fades[i];
    if ($(fade).position().top < pageBottom) {
      $(fade).addClass("visible");
    }
  }
});

// SUMMARY/DETAILS: FAQ panels open/close with a smooth height+fade animation,
// and only one panel stays open at a time.
// (Native <details> can't be transitioned, so the summary click is intercepted
// and the content div is animated via the Web Animations API before the open
// state actually flips. Keyboard/other toggles fall back to an instant switch.)

const All_Details = document.querySelectorAll('div.FAQ > details');
const FAQ_ANIM_MS = 260;
const FAQ_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function faqContent(det) {
  const s = det.querySelector('summary');
  return s ? s.nextElementSibling : null;
}

// The open/close STATE is driven by a timer (which always runs, even in a
// backgrounded tab), so a panel can never get stuck; the Web Animations pass is
// purely visual polish that plays when the page is actually being painted.
function faqCleanup(det, c) {
  c.style.overflow = '';
  c.style.height = '';
  delete det.dataset.faqBusy;
}

function faqOpen(det) {
  const c = faqContent(det);
  det.open = true;
  if (!c || FAQ_REDUCED) return;
  const end = c.scrollHeight;
  det.dataset.faqBusy = 'open';
  c.style.overflow = 'hidden';
  c.animate(
    [{ height: '0px', opacity: 0 }, { height: end + 'px', opacity: 1 }],
    { duration: FAQ_ANIM_MS, easing: 'ease' }
  );
  clearTimeout(det._faqTimer);
  det._faqTimer = setTimeout(() => faqCleanup(det, c), FAQ_ANIM_MS);
}

function faqClose(det) {
  const c = faqContent(det);
  if (!c || FAQ_REDUCED) { det.open = false; return; }
  const start = c.offsetHeight;
  det.dataset.faqBusy = 'close';
  c.style.overflow = 'hidden';
  c.animate(
    [{ height: start + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
    { duration: FAQ_ANIM_MS, easing: 'ease' }
  );
  clearTimeout(det._faqTimer);
  det._faqTimer = setTimeout(() => { det.open = false; faqCleanup(det, c); }, FAQ_ANIM_MS);
}

All_Details.forEach(det => {
  const summary = det.querySelector('summary');
  if (!summary) return;

  summary.addEventListener('click', function (e) {
    e.preventDefault();
    if (det.dataset.faqBusy) return;   // ignore clicks mid-animation
    if (det.open) {
      faqClose(det);
    } else {
      All_Details.forEach(other => { if (other !== det && other.open) faqClose(other); });
      faqOpen(det);
    }
  });

  // Keep "one open at a time" for opens that bypass the click handler
  // (keyboard, or a link that sets .open directly).
  det.addEventListener('toggle', function () {
    if (det.dataset.faqBusy || !det.open) return;
    All_Details.forEach(other => { if (other !== det && other.open) faqClose(other); });
  });
});

//READ MORE: cript that makes "read more" links in the blockquote section

$(document).ready(function() {
    var max = 200;
    if (window.screen.width < 900) {
    	$(".readMore").each(function() {
	        var str = $(this).text();
	        if (str.length > max) {
	            var subStr = str.substring(0, max);
	            var hiddenStr = str.substring(max, str.length);
	            $(this).empty().html(subStr);
	            $(this).append('<a href="javascript:void(0);" class="link"><span style="color:black">...</span> read more</a>');
	            $(this).append('<span class="addText">' + hiddenStr + '</span>');
	        }
	    });
	    $(".link").click(function() {
	        $(this).siblings(".addText").contents().unwrap();
	        $(this).remove();
	    });
    };
});

//MASONRY: setup (only on pages that load the Masonry plugin — calling it elsewhere would throw and kill the rest of this script)

	if ($.fn.masonry) {
		$('.grid').masonry({
			itemSelector: '.grid > div',
			columnWidth: 300,
			gutter: 20,
			fitWidth: true,
			// transitionDuration: 0
		});

		$('summary').click(function () {
			setTimeout(() => $('.grid').masonry(),1);
		});
	}

//MATHJAX: default config. Pages that need their own settings (e.g. /ask.html, /articles/*) define window.MathJax inline before this runs and it is respected.

	window.MathJax = window.MathJax || {
		tex: {
		    inlineMath: [['$', '$'], ['\\(', '\\)']]
		  }
	};

	//refreshes Masonry layout once MathJax is fully loaded via an annoying workaround
	window.addEventListener('load', function () {
		if ($.fn.masonry && window.MathJax && MathJax.startup && MathJax.startup.promise) {
			MathJax.startup.promise.then(() => {
				refresh = setInterval("$('.grid').masonry()",100);
				setTimeout("clearInterval(refresh)", 1000); //workaround: performs ten refreshes spaced apart by 100ms in order to enusre that the masonry layout is adjusted in accordance with the completed mathjax rendering
			});
		}
	});

//EMAIL LINK TOOLTIP STUFF

	//define function setText(text) that sets the all the tooltip texts to text
	function setText(text) {
		Array.from(document.getElementsByClassName("tooltiptext")).forEach(function (ele, index) {
			ele.innerHTML = text;
		}); 
	}

	//define a function that both copies the email address and changes the tooltip text to notify that the email has been copied
	function copyEmail() {
		var copyText = "tutor@trevorkafka.com";
		navigator.clipboard.writeText(copyText);
	  setText("Copied: " + copyText);
	}

	function copyWaitlistEmail() {
		var copyText = "tutor+waitlist@trevorkafka.com";
		navigator.clipboard.writeText(copyText);
	  setText("Copied: " + copyText);
	}

	function copyPersonalEmail() {
		var copyText = "trevor@trevorkafka.com";
		navigator.clipboard.writeText(copyText);
	  setText("Copied: " + copyText);
	}

	function copyPhone() {
		var copyText = "+19142550499";
		navigator.clipboard.writeText(copyText);
	  setText("Copied: " + copyText);
	}

	//define a function that resets the tooltip text when the mouse is no longer hovering over the email address
	function outFunc() {
		setText("Copy to clipboard");
	}

//RESIZE IFRAME HEIGHT (include onload="resizeIframe(this)" in the iframe tag)
 function resizeIframe(iframe) {
            iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
        }