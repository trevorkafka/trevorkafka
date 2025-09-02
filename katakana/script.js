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

function filterWordList() {

	const idUnion = union(idGroups.require, idGroups.emphasize, idGroups.allow)

	loadWordList().then(text =>{
		
		const filtered = (idUnion.size === 0)
			? text
			: text.filter(([, , , components]) => {
				const componentSet = new Set(components);
				const satisfiesRequire = isSuperset(componentSet, idGroups.require);
				const satisfiesAllow = isSuperset(idUnion, componentSet);
				return satisfiesRequire && satisfiesAllow;
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

// TOGGLE UPDATE OF STATE ATTRIBUTES FOR KANA BUTTONS AND UPDATE THE WORD LIST ACCORDINGLY //

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

	if(el.classList.contains("all")) {
		const row = el.closest("tr");
		const rowEls = Array.from(
			row.querySelectorAll("td.button:not(.all)")
		)
		.filter(cell => cell !== el)        // exclude the clicked one (safety)

		rowEls.forEach((rowEl) => {
			toggle(rowEl)
		});

	} else if (el?.id && kanaButtonIds.has(el.id)) {
		toggle(el);
	}
}

document.addEventListener("click", clickAction);