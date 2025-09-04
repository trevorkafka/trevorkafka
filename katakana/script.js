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
		
		const filtered = (idUnion.size === 0)
			? text
			: text.filter(([, , , components]) => {
				const componentSet = new Set(components);
				const satisfiesRequire = isSuperset(componentSet, idGroups.require);
				const satisfiesEmphasize = idGroups.emphasize.size === 0 || nonEmptyIntersection(componentSet, idGroups.emphasize);
				const satisfiesAllow = isSuperset(idUnion, componentSet);
				return satisfiesRequire && satisfiesEmphasize && satisfiesAllow;
			});

		word_container.innerHTML = "";

		shuffle(filtered).forEach(word => {

			const [katakana, romaji, english, components] = word;
			const div = document.createElement("div");
			div.textContent = katakana;
			div.classList.add("word-box", "japanese");
			word_container.appendChild(div);

		});
	});
};

filterWordList();

// HIDE UNNEEDED BUTTONS //

window.addEventListener("scroll", () => {
  const readStart = document.getElementById("read-start");
  const tag1Start = document.getElementById("tag1-start");
  const tag2Start = document.getElementById("tag2-start");
  const tag3Start = document.getElementById("tag3-start");
  const topToolbar = document.getElementById("top-toolbar");
  const readButton = document.getElementById("read");
  const tagsButton = document.getElementById("tags");
  const tag1Button = document.getElementById("tag1");
  const tag2Button = document.getElementById("tag2");
  const tag3Button = document.getElementById("tag3");

  // Get the marker's distance from the top of the page
  const readMarkerTop = readStart.getBoundingClientRect().top + window.scrollY;
  const tag1MarkerTop = tag1Start.getBoundingClientRect().top + window.scrollY;
  const tag2MarkerTop = tag2Start.getBoundingClientRect().top + window.scrollY;
  const tag3MarkerTop = tag3Start.getBoundingClientRect().top + window.scrollY;

  if (window.innerWidth < 1459) {
  	tagsButton.style.display = "none";

  	if (window.scrollY > tag1MarkerTop) {
  		tag1Button.style.display = "flex";
  	} else {
  		tag1Button.style.display = "none";
  	}

  	if (window.scrollY > tag2MarkerTop) {
  		tag2Button.style.display = "flex";
  	} else {
  		tag2Button.style.display = "none";
  	}

  	if (window.scrollY > tag3MarkerTop) {
  		tag3Button.style.display = "flex";
  	} else {
  		tag3Button.style.display = "none";
  	}

  } else {
  	if (window.scrollY > tag1MarkerTop) {
  		tagsButton.style.display = "flex";
  	} else {
  		tagsButton.style.display = "none";
  	}
  	tag1Button.style.display = "none";
  	tag2Button.style.display = "none";
  	tag3Button.style.display = "none";
  }

  if (window.scrollY > readMarkerTop - 81) {
    readButton.style.display = "none"; 
    topToolbar.style.display = "none";
  } else {
    readButton.style.display = "flex"; 
    topToolbar.style.display = "flex";
  }
});


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
  if (e.target.closest("#undo")) undoLast();
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
  "tag-mode-cycle",
  "tag-mode-clear",
  "tag-mode-require",
  "tag-mode-emphasize",
  "tag-mode-allow"
];


for (const id of barButtonIds) {
  document.getElementById(id).addEventListener("click", () => {
  	for (const id of barButtonIds) {
  		topToolbar.classList.remove(id)
  	}
  	topToolbar.classList.add(id)
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
  const newState = nextState(current);

  document.querySelectorAll(`#${CSS.escape(el.id)}`).forEach(elem => {
    elem.dataset.state = newState;
  });

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