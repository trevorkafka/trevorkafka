// SHOW DUPLICATES BUTTON //

const showDuplicatesButton = document.getElementById("show-duplicates");
const duplicates = document.querySelectorAll(".duplicate")

showDuplicatesButton.addEventListener("click", () => {

let firstDuplicateStyle = window.getComputedStyle(duplicates[0])

	if (firstDuplicateStyle.opacity === "0") {
		duplicates.forEach(el =>{
			el.style.opacity = "100";
		});
	} else {
		duplicates.forEach(el =>{
			el.style.opacity = "0";
		});
	};
});

// ============================================================
// JAPANESE TTS CODE, PRONUNCIATION, AND MEANING
// ============================================================

// Keep a cached list of voices (browsers populate this async)
let voices = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
}

// Some browsers fire this after voices are ready
window.speechSynthesis.onvoiceschanged = loadVoices;
// Also try immediately (Chrome sometimes has them already)
loadVoices();

function pickJapaneseVoice() {
  if (!voices || voices.length === 0) return null;
  // Strong preference: locale starts with ja (e.g., ja-JP)
  const jaExact = voices.find(v => /^ja(-|_)?/i.test(v.lang));
  if (jaExact) return jaExact;
  // Next: anything that declares Japanese in the name (rare, but just in case)
  const nameJa = voices.find(v => /japanese/i.test(v.name));
  return nameJa || null;
}

function speakJA(text) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    console.warn("Web Speech API not supported in this browser.");
    return;
  }
  // If speaking already, cancel to avoid queue spam
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "ja-JP";
  // Optional tweaks: slower rate helps clarity for learners
  utt.rate = 0.7;   // 0.1–10 (1.0 is default)
  utt.pitch = 1;  // 0–2
  const v = pickJapaneseVoice();
  if (v) utt.voice = v;
  speechSynthesis.speak(utt);
}

// Attach to any .speak-ja element; reads data-say or its textContent
function attachHandlers() {
  const boxes = document.querySelectorAll(".speak-ja");
  boxes.forEach(el => {
    el.style.cursor = "pointer";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.addEventListener("click", (e) => {
      boxes.forEach((b) => {b.classList.remove("selected")});
      e.currentTarget.classList.add("selected");
      const text = el.dataset.say?.trim() || el.textContent.trim();
      if (text) speakJA(text);
      document.getElementById("pronunciation").innerHTML = el.getAttribute("romaji");
	    document.getElementById("meaning").innerHTML = el.getAttribute("english");
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  });
}

// // In case voices arrive late, re-run a couple times
// document.addEventListener("DOMContentLoaded", () => {
//   attachHandlers();
//   // Nudge voice loading on some platforms
//   const tick = setInterval(() => {
//     if (voices.length === 0) loadVoices();
//     else clearInterval(tick);
//   }, 300);
//   setTimeout(() => clearInterval(tick), 4000);
// });

// DEFINE FISHER-YATES SHUFFLE //

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// GENERATE WORDS IN WORD-CONTAINER //

const word_container = document.getElementById("word-container");

async function loadWordList() {
	const response = await fetch("extracted_katakana.json");
	const text = await response.json();
	return text;
};

//do a sweep to see which kana buttons are already pressed as specified by the HTML
function buildGroupsFromDOM() {
  document.querySelectorAll(".kana.button").forEach(btn => {
    const state = btn.dataset.state || "none";
    if (idGroups[state]) idGroups[state].add(btn.id);
    keepPressed(btn); // optional: keeps the visual state consistent
  });
}

// If your script is `defer`, DOM is parsed by now, but this is safe either way.
document.addEventListener("DOMContentLoaded", () => {
  buildGroupsFromDOM();
  filterWordList();
});

const idGroups = {
	  require: new Set(),
	  emphasize: new Set(),
	  allow: new Set()
	};

function union(...sets) {
	return new Set(sets.flatMap(set => [...set]));
};

function isSuperset(setA, setB) {
	for (const el of setB) if (!setA.has(el)) return false;
	return true;
}

function nonEmptyIntersection(setA, setB) {
	for (const el of setB) if (setA.has(el)) return true;
	return false;
}

function filterWordList() {

	const idUnion = union(idGroups.require, idGroups.emphasize, idGroups.allow)

	loadWordList().then(text =>{
		
		const filtered = text.filter(([, , , components]) => {
				const componentSet = new Set(components);
				const satisfiesRequire = isSuperset(componentSet, idGroups.require);
				const satisfiesEmphasize = idGroups.emphasize.size === 0 || nonEmptyIntersection(componentSet, idGroups.emphasize);
				const satisfiesAllow = isSuperset(idUnion, componentSet);
				return satisfiesRequire && satisfiesEmphasize && satisfiesAllow;
			});

    document.querySelectorAll(".word-count").forEach(el => {el.innerHTML = filtered.length;
    });

		word_container.innerHTML = "";

    if (filtered.length !== 0) {
      document.getElementById("no-words-message").style.display = "none";
    } else {
      document.getElementById("no-words-message").style.display = "block"
    }

		shuffle(filtered).forEach(word => {

			const [katakana, romaji, english, components] = word;
			const div = document.createElement("div");
			div.textContent = katakana;
			div.classList.add("word-box", "japanese", "speak-ja");
			div.setAttribute("romaji", romaji);
			div.setAttribute("english", english)
			word_container.appendChild(div);

		});
	
	attachHandlers();

	});
};

filterWordList();

// HIDE UNNEEDED BUTTONS //

// window.addEventListener("scroll", () => {
//   const readStart = document.getElementById("read-start");
//   const tag1Start = document.getElementById("tag1-start");
//   const tag2Start = document.getElementById("tag2-start");
//   const tag3Start = document.getElementById("tag3-start");
//   const topToolbar = document.getElementById("top-toolbar");
//   const readButton = document.getElementById("read");
//   const tagsButton = document.getElementById("tags");
//   const tag1Button = document.getElementById("tag1");
//   const tag2Button = document.getElementById("tag2");
//   const tag3Button = document.getElementById("tag3");

//   // Get the marker's distance from the top of the page
//   const readMarkerTop = readStart.getBoundingClientRect().top + window.scrollY;
//   const tag1MarkerTop = tag1Start.getBoundingClientRect().top + window.scrollY;
//   const tag2MarkerTop = tag2Start.getBoundingClientRect().top + window.scrollY;
//   const tag3MarkerTop = tag3Start.getBoundingClientRect().top + window.scrollY;

//   if (window.innerWidth < 1459) {
//   	tagsButton.style.display = "none";

//   	if (window.scrollY > tag1MarkerTop) {
//   		tag1Button.style.display = "flex";
//   	} else {
//   		tag1Button.style.display = "none";
//   	}

//   	if (window.scrollY > tag2MarkerTop) {
//   		tag2Button.style.display = "flex";
//   	} else {
//   		tag2Button.style.display = "none";
//   	}

//   	if (window.scrollY > tag3MarkerTop) {
//   		tag3Button.style.display = "flex";
//   	} else {
//   		tag3Button.style.display = "none";
//   	}

//   } else {
//   	if (window.scrollY > tag1MarkerTop) {
//   		tagsButton.style.display = "flex";
//   	} else {
//   		tagsButton.style.display = "none";
//   	}
//   	tag1Button.style.display = "none";
//   	tag2Button.style.display = "none";
//   	tag3Button.style.display = "none";
//   }

//   if (window.scrollY > readMarkerTop - 81) {
//     readButton.style.display = "none"; 
//     topToolbar.style.display = "none";
//   } else {
//     readButton.style.display = "flex"; 
//     topToolbar.style.display = "flex";
//   }

// if (window.innerWidth < 1459) {

//     tagsButton.style.display = "none";
//     tag1Button.style.display = "flex";
//     tag2Button.style.display = "flex";
//     tag3Button.style.display = "flex";

//   } else {

//     tagsButton.style.display = "flex";
//     tag1Button.style.display = "none";
//     tag2Button.style.display = "none";
//     tag3Button.style.display = "none";
    
//   };

// });

// ==========================
// One-step Undo (DIV #undo)
// ==========================
const BUTTON_SELECTOR = "td.button";
let lastSnapshot = null;
let _isRestoring = false;

const undoBtn = document.getElementById("undo");

// Show/hide the undo control (works for a DIV)
function setUndoVisible(visible) {
  if (!undoBtn) return;
  undoBtn.style.display = visible ? "" : "none";
  undoBtn.setAttribute("aria-hidden", String(!visible));
}

// Start hidden on load
setUndoVisible(false);

// Give every .button a stable UID so snapshots can map correctly
function ensureUIDs() {
  const buttons = document.querySelectorAll(BUTTON_SELECTOR);
  buttons.forEach((el, i) => {
    if (!el.dataset.uid) el.dataset.uid = String(i);
  });
}

// Capture the current state of all .button cells (classes + data-*)
function takeSnapshot() {
  ensureUIDs();
  const buttons = document.querySelectorAll(BUTTON_SELECTOR);
  return Array.from(buttons).map((el) => ({
    uid: el.dataset.uid,
    className: el.className,
    data: Object.fromEntries(
      Array.from(el.attributes)
        .filter(a => a.name.startsWith("data-"))
        .map(a => [a.name, a.value])
    )
  }));
}

// Restore a snapshot back into the DOM
function applySnapshot(snapshot) {
  if (!snapshot) return;
  _isRestoring = true;
  try {
    const map = new Map();
    document.querySelectorAll(BUTTON_SELECTOR).forEach(el => {
      if (el.dataset.uid) map.set(el.dataset.uid, el);
    });

    snapshot.forEach(({ uid, className, data }) => {
      const el = map.get(uid);
      if (!el) return;

      // Restore classes wholesale
      el.className = className;

      // Remove current data-* then reapply saved data-*
      Array.from(el.attributes)
        .filter(a => a.name.startsWith("data-"))
        .forEach(a => el.removeAttribute(a.name));

      Object.entries(data).forEach(([k, v]) => el.setAttribute(k, v));
    });
  } finally {
    _isRestoring = false;
  }
}

function pushSnapshot() {
  lastSnapshot = takeSnapshot();
  setUndoVisible(true);   // show undo when there’s something to undo
}

function undoLast() {
  if (!lastSnapshot) return;
  applySnapshot(lastSnapshot);
  lastSnapshot = null;    // one-step only
  setUndoVisible(false);  // hide immediately after undo
}

// Click + keyboard handlers for the DIV#undo
document.addEventListener("click", (e) => {
  if (e.target.closest("#undo")) undoLast(); checkKanaButtonsForPress();
});
if (undoBtn) {
  undoBtn.setAttribute("role", "button");
  undoBtn.setAttribute("tabindex", "0");
  undoBtn.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "enter" || k === " ") { e.preventDefault(); undoLast(); }
  });
}

// update the tagging mode based on the top bar //

const topToolbar = document.getElementById("top-toolbar")

const barButtonIds = [
  "cycle",
  "none",
  "require",
  "emphasize",
  "allow"
];

function keepPressed(elem) {
  const tagMode = topToolbar.getAttribute("tag-mode");
      if (elem.getAttribute("data-state") === tagMode || (tagMode === "none" && !elem.getAttribute("data-state"))) {
        elem.style.cursor = "auto";
        elem.style.boxShadow = "none";
        elem.style.transform = "translate(2px, 2px)"
      } else {
        elem.style.cursor = "";
        elem.style.boxShadow = "";
        elem.style.transform = ""
      }
}

function checkKanaButtonsForPress() {
  document.querySelectorAll(".kana.button").forEach(elem => {
      keepPressed(elem);
    });
}

function checkTopToolbarButtons(elem) {
  document.querySelectorAll(".top-bar.button").forEach(elem => {
    keepPressed(elem);
  });
}

checkTopToolbarButtons();
checkKanaButtonsForPress();

for (const id of barButtonIds) {
  document.getElementById(id).addEventListener("click", () => {
  	topToolbar.setAttribute("tag-mode", id);
    checkKanaButtonsForPress();
    checkTopToolbarButtons();
  });
}

// ============================================================
// TOGGLE UPDATE OF STATE ATTRIBUTES FOR KANA BUTTONS AND UPDATE
// THE WORD LIST ACCORDINGLY
// ============================================================

const kanaButtonIds = new Set(
  Array.from(document.querySelectorAll(".kana.button"), el => el.id)
);
const STATES = ["none", "require", "emphasize", "allow"];
const nextState = s => STATES[(STATES.indexOf(s) + 1) % STATES.length];

function toggle(el) {

  const current  = el.dataset.state || "none";

  const tagMode = topToolbar.getAttribute("tag-mode");

  let newState = ""

  if (tagMode === "cycle") {

    newState = nextState(current);

  } else if (tagMode === "none") {

    newState = "none";

  } else if (tagMode === "require") {

    newState = "require";

  } else if (tagMode === "emphasize") {

    newState = "emphasize";

  } else if (tagMode === "allow") {

    newState = "allow";

  };

  document.querySelectorAll(`#${CSS.escape(el.id)}`).forEach(elem => {
    elem.dataset.state = newState;
    keepPressed(elem);
  }); // this stategy of selecting elements takes care of the fact that there are some duplicate kana buttons

  if (idGroups[current])  idGroups[current].delete(el.id);
  if (idGroups[newState]) idGroups[newState].add(el.id);

  filterWordList();
}

function clickAction (e) {
  const el = e.target.closest(".button");
  if (!el || _isRestoring) return;

  function getLogicalColStart(cell) {
    let start = 0;
    const cells = Array.from(cell.parentElement.children);
    for (const c of cells) {
      if (c === cell) break;
      start += parseInt(c.getAttribute("colspan") || "1", 10);
    }
    return start; // 0-based
  }

  function getColRange(cell) {
    const start = getLogicalColStart(cell);
    const span = parseInt(cell.getAttribute("colspan") || "1", 10);
    return [start, start + span - 1];
  }

  function isVisible(cell) {
    return getComputedStyle(cell).opacity !== "0";
  }

  if (el.classList.contains("all-col")) {
    // Determine the 5-column block anchored by this header cell
    const [blockStart] = getColRange(el);
    const blockEnd = blockStart + 4; // since colspan=5

    // Search within the same table
    const table = el.closest("table");
    const candidates = table
      ? Array.from(table.querySelectorAll("td.button:not(.all)"))
      : [];

    const targets = candidates.filter((cell) => {
      if (cell === el) return false;           // exclude the clicked one
      if (!isVisible(cell)) return false;      // exclude fully transparent
      const [cStart, cEnd] = getColRange(cell);
      // Overlap test with the 5-col block
      return cStart <= blockEnd && cEnd >= blockStart;
    });

    if (targets.length) pushSnapshot();        // 👈 snapshot BEFORE mutating
    targets.forEach(toggle);

  } else if (el.classList.contains("all")) {
    // "select all in the same row" behavior
    const row = el.closest("tr");
    const rowEls = Array.from(
      row.querySelectorAll("td.button:not(.all)")
    ).filter(cell => (cell !== el && isVisible(cell)));

    if (rowEls.length) pushSnapshot();         // 👈 snapshot BEFORE mutating
    rowEls.forEach(toggle);

  } else if (el?.id && kanaButtonIds.has(el.id)) {
    pushSnapshot();                             // 👈 snapshot BEFORE mutating
    toggle(el);
  }
}

document.addEventListener("click", clickAction);

// ============================================================
// SET DEFAULT BUTTON CONFIGURATION WHEN USER LOADS PAGE
// ============================================================

for (const id of ["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","ン","ー","ッ"]){
  document.querySelectorAll(`#${CSS.escape(id)}`).forEach(elem => {
    elem.dataset.state = "allow";
    keepPressed(elem);
  });
};