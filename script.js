function copyEmail(tooltipId) {
	
	var copyText = "tutor@trevorkafka.com";
	navigator.clipboard.writeText(copyText);

	var tooltip = document.getElementById(tooltipId);
	tooltip.innerHTML = "Copied: " + copyText;

}

function outFunc(tooltipId) {

  var tooltip = document.getElementById(tooltipId);
  tooltip.innerHTML = "Copy to clipboard";

}