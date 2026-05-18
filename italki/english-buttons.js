fetch("vocabulary.json")
.then(res => res.json())
.then(data => {
  data.forEach(entry => {
    const h2 = document.createElement("h2");
    h2.textContent = entry.date;
    document.getElementById("word-container").appendChild(h2);
    fetch(`../English audio/${entry.date}.m4a`, { method: "HEAD" })
      .then(res => {
        if (res.ok) {
          h2.classList.add("has-audio");
          h2.addEventListener("click", () => {
            new Audio(`../English audio/${entry.date}.m4a`).play();
          });
        }
      });
    const subContainer = document.createElement("div");
    document.getElementById("word-container").appendChild(subContainer);
    entry.vocabulary.forEach(item => {
      const word = typeof item === "string" ? item : item.word;
      const audioFile = item.audio ?? item.word;

      const div = document.createElement("div");
      div.classList.add("word-box");
      div.innerHTML = `<span class="english">${word}</span><br><span class="IPA">${item.IPA}</span>`;
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
  });
});

// toggle IPA
document.getElementById("ipa-toggle").addEventListener("change", function() {
    document.querySelectorAll(".IPA").forEach(el => {
      el.style.display = this.checked ? "" : "none";
    });
  });