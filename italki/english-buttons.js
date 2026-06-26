fetch("vocabulary.json")
.then(res => res.json())
.then(data => {
  data.forEach(entry => {
    const displayDate = formatDate(entry.date);

    const groupContainer = document.createElement("div");
    groupContainer.classList.add("date-group");
    document.getElementById("word-container").appendChild(groupContainer);

    const h2 = document.createElement("h2");
    h2.textContent = displayDate;
    groupContainer.appendChild(h2);
    fetch(`../English audio/${displayDate}.m4a`, { method: "HEAD" })
      .then(res => {
        if (res.ok) {
          h2.classList.add("has-audio");
          h2.addEventListener("click", () => {
            new Audio(`../English audio/${displayDate}.m4a`).play();
          });
        }
      });
    const subContainer = document.createElement("div");
    groupContainer.appendChild(subContainer);
    entry.vocabulary.forEach(item => {
      const word = typeof item === "string" ? item : item.word;
      const audioFile = item.audio ?? item.word;

      const div = document.createElement("div");
      div.classList.add("word-box");
      div.innerHTML = `<span class="english">${word}</span><span class="IPA">${item.IPA ?? ""}</span>`
        + (item.translation ? `<span class="translation">${item.translation}</span>` : "");
      subContainer.appendChild(div);
      fetch(`../English audio/${audioFile}.m4a`, { method: "HEAD" })
        .then(res => {
          if (res.ok) {
            div.classList.add("has-audio");
            div.addEventListener("click", () => {
              new Audio(`../English audio/${audioFile}.m4a`).play();
            });
          } else {
            div.classList.add("no-audio");
          }
        });
    });

    loadNotes(entry, groupContainer);
  });
});

// Convert a YYYY-MM-DD date (as stored in the JSON) into the display form
// "Thursday June 25, 2026" used in the headings and for the date-named audio.
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  const date = new Date(+y, +m - 1, +d);
  return `${weekdays[date.getDay()]} ${months[+m - 1]} ${d}, ${y}`;
}

// Look for optional markdown note files in this student's notes/ folder, named
// "<YYYY-MM-DD>.md" (then " (2)", " (3)", ...). Each renders as a box after
// that date's buttons, gaining Play/Download buttons when a sibling .m4a of
// the same name exists. Probing stops at the first missing file.
async function loadNotes(entry, groupContainer) {
  const base = `notes/${entry.date}`;

  for (let i = 1; ; i++) {
    const name = `${base}${i === 1 ? "" : ` (${i})`}`;
    const res = await fetch(`${name}.md`);
    if (!res.ok) break;

    const box = document.createElement("div");
    box.classList.add("note-box");
    box.innerHTML = marked.parse(await res.text());
    groupContainer.appendChild(box);

    const audioPath = `${name}.m4a`;
    const audioRes = await fetch(audioPath, { method: "HEAD" });
    if (audioRes.ok) {
      const controls = document.createElement("div");
      controls.classList.add("note-audio");

      const playLabel = '<i class="fa-solid fa-play"></i> Play';
      const stopLabel = '<i class="fa-solid fa-stop"></i> Stop';
      const playBtn = document.createElement("button");
      playBtn.innerHTML = playLabel;
      let audio = null;
      playBtn.addEventListener("click", () => {
        if (audio) {
          audio.pause();
          audio = null;
          playBtn.innerHTML = playLabel;
          return;
        }
        audio = new Audio(audioPath);
        playBtn.innerHTML = stopLabel;
        audio.addEventListener("ended", () => {
          audio = null;
          playBtn.innerHTML = playLabel;
        });
        audio.play();
      });

      const downloadBtn = document.createElement("a");
      downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download';
      downloadBtn.href = audioPath;
      downloadBtn.setAttribute("download", "");

      controls.appendChild(playBtn);
      controls.appendChild(downloadBtn);
      box.appendChild(controls);
    }
  }
}

// Styles for note boxes (kept here so all English pages share them).
const noteStyle = document.createElement("style");
noteStyle.textContent = `
  /* Each date's heading + buttons + notes occupies its own full-width row so
     the date groups stack vertically, even when a group has no buttons. The
     flex-wrap layout on #word-container still arranges the buttons within. */
  .date-group {
    flex-basis: 100%;
  }
  .translation {
    color: #c0392b;
    font-size: 90%;
  }
  /* Each part of a word-box is its own line; hiding one collapses its line
     entirely (no leftover blank line) and shrinks the button to fit. */
  .word-box .english,
  .word-box .IPA,
  .word-box .translation {
    display: block;
  }
  #word-container.ipa-hidden .IPA {
    display: none;
  }
  #word-container.translations-hidden .translation {
    display: none;
  }
  .note-box {
    display: block;
    background-color: #00000010;
    margin: 10px;
    padding: 15px 20px;
    border-radius: 10px;
    text-align: left;
  }
  .note-box > *:first-child { margin-top: 0; }
  .note-box > *:last-child { margin-bottom: 0; }
  .note-audio {
    margin-top: 12px;
    text-align: center;
  }
  .note-audio button,
  .note-audio a {
    display: inline-block;
    margin: 0 5px;
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    background-color: #00000018;
    color: inherit;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .note-audio button:hover,
  .note-audio a:hover {
    background-color: #00000030;
  }
`;
document.head.appendChild(noteStyle);

// IPA + translation visibility are controlled by classes on #word-container so
// that words loaded asynchronously inherit the current state automatically. The
// initial state is read from each checkbox (translations default to unchecked).
const wordContainer = document.getElementById("word-container");

function syncToggle(toggle, cls) {
  if (!toggle) return;
  wordContainer.classList.toggle(cls, !toggle.checked);
  toggle.addEventListener("change", function() {
    wordContainer.classList.toggle(cls, !this.checked);
  });
}

syncToggle(document.getElementById("ipa-toggle"), "ipa-hidden");
syncToggle(document.getElementById("translation-toggle"), "translations-hidden");
