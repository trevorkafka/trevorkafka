//
// SECTION 1: CUSTOM HTML TAG REPLACEMENTS
//

//navigation bar HTML insertion and addition of "active-link" class to current page for styling purposes
$('trevorkafka-nav').load('snippets/navigation.html', function() {
        $("#" + window.location.pathname.split("/").pop().split(".")[0]).addClass("active-link");
    });

//other replacements
$('trevorkafka-email').load('snippets/email.html')
$('trevorkafka-footer').load('snippets/footer.html')
$('trevorkafka-announcement').load('snippets/announcement.html')

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

// SUMMARY/DETAILS: Script that makes sure that only one FAQ details panel can be opened at a time.
// Code source: https://stackoverflow.com/questions/16751345/automatically-close-all-the-other-details-tags-after-opening-a-specific-detai

const All_Details = document.querySelectorAll('div.FAQ > details');

All_Details.forEach(deet=>{
  deet.addEventListener('toggle', toggleOpenOneOnly)
})

function toggleOpenOneOnly(e) {
  if (this.open) {
    All_Details.forEach(deet=>{
      if (deet!=this && deet.open) deet.open = false
    });
  }
}

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

//MASONRY: setup

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

//MATHJAX: adds some mathjax commands and, importantly, refreshes Masonry layout once mathjax is fully loaded via an annoying workaround

	window.MathJax = {
		tex: {
		    inlineMath: [['$', '$'], ['\\(', '\\)']]
		  },
	  startup: {
	    ready: () => {
	      MathJax.startup.defaultReady();
	      MathJax.startup.promise.then(() => {
	      	refresh = setInterval("$('.grid').masonry()",100);
	      	setTimeout("clearInterval(refresh)", 1000); //workaround: performs ten refreshes spaced apart by 100ms in order to enusre that the masonry layout is adjusted in accordance with the completed mathjax rendering
	      });
	    }
	  }
	};

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