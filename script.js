function setText(text) {
	Array.from(document.getElementsByClassName("tooltiptext")).forEach(function (ele, index) {
		ele.innerHTML = text;
	}); 
}

function copyEmail() {
	var copyText = "tutor@trevorkafka.com";
	navigator.clipboard.writeText(copyText);
  setText("Copied: " + copyText);
}

function outFunc() {
	setText("Copy to clipboard");
}