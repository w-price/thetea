const revealPolls = [
  {
    subject: "Maya + Jordan",
    prompt: "What happened at the altar?",
    groups: {
      married: ["Taylor", "Maya"],
      "altar-no": ["Jordan", "Chris"],
      breakup: ["Riley"],
    },
  },
  {
    subject: "Sienna + Theo",
    prompt: "How did their story end?",
    groups: {
      married: ["Maya"],
      "altar-no": ["Taylor", "Jordan", "Riley"],
      breakup: ["Chris"],
    },
  },
  {
    subject: "Alex + Sam",
    prompt: "Did they leave together?",
    groups: {
      married: ["Taylor", "Jordan"],
      "altar-no": ["Maya"],
      breakup: ["Riley", "Chris"],
    },
  },
  {
    subject: "Nia + Devon",
    prompt: "What was their final outcome?",
    groups: {
      married: ["Taylor", "Maya", "Chris"],
      "altar-no": ["Jordan"],
      breakup: ["Riley"],
    },
  },
  {
    subject: "Remi + Chris",
    prompt: "Did they make it all the way?",
    groups: {
      married: ["Riley"],
      "altar-no": ["Taylor", "Chris"],
      breakup: ["Maya", "Jordan"],
    },
  },
];

const revealOutcomes = [
  { id: "married", flag: "YES", label: "They get married.", group: "married" },
  { id: "altar-no", flag: "NO", label: "Someone says no at the altar.", group: "no-marriage" },
  { id: "breakup", flag: "NO", label: "They break up before the altar.", group: "no-marriage" },
];

const scores = new Map([
  ["Taylor", 0],
  ["Maya", 0],
  ["Jordan", 0],
  ["Riley", 0],
  ["Chris", 0],
]);

const spillCard = document.querySelector("#spill-card");
const confirmSheet = document.querySelector("#confirm-sheet");
const confirmBackdrop = document.querySelector("#confirm-backdrop");
const completeSheet = document.querySelector("#complete-sheet");
const completeBackdrop = document.querySelector("#complete-backdrop");
let revealIndex = 0;
let selectedResult = null;
let isRevealed = false;

function revealOutcome(outcomeId) {
  return revealOutcomes.find((outcome) => outcome.id === outcomeId);
}

function pointsFor(predictionId, actualId) {
  if (predictionId === actualId) return 3;
  const prediction = revealOutcome(predictionId);
  const actual = revealOutcome(actualId);
  return prediction.group === actual.group ? 1 : 0;
}

function renderMiniLeaderboard() {
  const leaders = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  document.querySelector("#mini-leaders").innerHTML = leaders
    .slice(0, 3)
    .map(
      ([name, points], index) => `
        <span title="${name}">
          <b>${index + 1}</b>${name[0]}<em>${points}</em>
        </span>
      `,
    )
    .join("");
  const topScore = leaders[0][1];
  document.querySelector("#leaderboard-status").textContent = topScore
    ? `${leaders[0][0]} leads with ${topScore}`
    : "Everyone’s tied at zero";
}

function rankedScores() {
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return sorted.map(([name, points]) => ({
    name,
    points,
    rank: sorted.findIndex((entry) => entry[1] === points) + 1,
  }));
}

function renderHostReveal() {
  const poll = revealPolls[revealIndex];
  const totalVotes = Object.values(poll.groups).flat().length;
  document.querySelector("#reveal-progress-label").textContent =
    `Reveal ${revealIndex + 1} of ${revealPolls.length}`;
  document.querySelector("#reveal-progress-fill").style.width =
    `${((revealIndex + 1) / revealPolls.length) * 100}%`;

  spillCard.innerHTML = `
    <div class="spill-card-heading">
      <div>
        <p class="step-label">Ready to reveal</p>
        <h2>${poll.subject}</h2>
        <p>${poll.prompt}</p>
      </div>
      <span class="vote-total">${totalVotes} votes</span>
    </div>
    <div class="first-reveal">
      <p class="outcome-heading"><span>The room predicted</span><span>Names stay hidden for now</span></p>
      ${revealOutcomes
        .map((outcome) => {
          const count = poll.groups[outcome.id].length;
          const percent = Math.round((count / totalVotes) * 100);
          return `
            <div class="stat-bar-row">
              <span class="vote-flag">${outcome.flag}</span>
              <span class="stat-bar-copy"><b>${outcome.label}</b><i><span style="width:${percent}%"></span></i></span>
              <strong>${percent}%</strong>
            </div>
          `;
        })
        .join("")}
    </div>
    <div class="host-result-picker">
      <p class="step-label">What actually happened?</p>
      ${revealOutcomes
        .map(
          (outcome) => `
            <button class="result-option" type="button" data-result="${outcome.id}">
              <span class="vote-flag">${outcome.flag}</span>
              <span>${outcome.label}</span>
              <span class="choice-check" aria-hidden="true">✓</span>
            </button>
          `,
        )
        .join("")}
    </div>
    <button class="primary-button spill-button" type="button" id="spill-result" disabled>
      <span>Spill the Tea</span><span aria-hidden="true">☕</span>
    </button>
    <p class="final-vote-note">Final result — this awards points and reveals everyone’s prediction.</p>
  `;
}

function openConfirmation() {
  const outcome = revealOutcome(selectedResult);
  document.querySelector("#confirm-result").innerHTML = `
    <span class="vote-flag">${outcome.flag}</span><strong>${outcome.label}</strong>
  `;
  confirmSheet.hidden = false;
  confirmBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#cancel-result").focus();
}

function closeConfirmation() {
  confirmSheet.hidden = true;
  confirmBackdrop.hidden = true;
  document.body.style.overflow = "";
}

function openCompleteConfirmation() {
  completeSheet.hidden = false;
  completeBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#cancel-complete").focus();
}

function closeCompleteConfirmation() {
  completeSheet.hidden = true;
  completeBackdrop.hidden = true;
  document.body.style.overflow = "";
}

function applyScores() {
  const poll = revealPolls[revealIndex];
  revealOutcomes.forEach((outcome) => {
    poll.groups[outcome.id].forEach((name) => {
      scores.set(name, scores.get(name) + pointsFor(outcome.id, selectedResult));
    });
  });
}

function renderPublishedResult() {
  const poll = revealPolls[revealIndex];
  const actual = revealOutcome(selectedResult);
  spillCard.innerHTML = `
    <div class="published-heading">
      <span class="tea-spilled-icon" aria-hidden="true">☕</span>
      <p class="step-label">The tea is spilled</p>
      <h2>${poll.subject}</h2>
      <div class="actual-result"><span class="vote-flag">${actual.flag}</span><strong>${actual.label}</strong></div>
    </div>
    <div class="named-predictions">
      <p class="outcome-heading"><span>Who called what</span><span>Points awarded</span></p>
      ${revealOutcomes
        .map((outcome) => {
          const isActual = outcome.id === selectedResult;
          return `
            <div class="prediction-group ${isActual ? "is-actual" : ""}">
              <div class="prediction-group-label">
                <span class="vote-flag">${outcome.flag}</span>
                <span><strong>${outcome.label}</strong>${isActual ? "<small>Actual result</small>" : ""}</span>
              </div>
              <div class="prediction-names">
                ${poll.groups[outcome.id]
                  .map(
                    (name) => `
                      <span>${name}<b>+${pointsFor(outcome.id, selectedResult)}</b></span>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
    <button class="primary-button spill-button" type="button" id="next-reveal">
      <span>${revealIndex === revealPolls.length - 1 ? "End game & crown winners" : "Next reveal"}</span>
      <span aria-hidden="true">→</span>
    </button>
  `;
}

function shareText(ranked, winnerNames) {
  const podium = ranked.map((player) => `${player.rank}. ${player.name} — ${player.points} pts`).join("\n");
  const crownLine = winnerNames.length > 1
    ? `${winnerNames.join(" & ")} share the crown!`
    : `${winnerNames[0]} takes the crown!`;
  return `The Tea is officially spilled ☕\n${crownLine}\n\n${podium}`;
}

async function shareFinalScorecard(button, ranked, winnerNames) {
  const text = shareText(ranked, winnerNames);
  try {
    if (navigator.share) {
      await navigator.share({ title: "The Tea — final results", text });
      button.querySelector("span:first-child").textContent = "Scorecard shared!";
    } else {
      await navigator.clipboard.writeText(text);
      button.querySelector("span:first-child").textContent = "Results copied!";
    }
  } catch (error) {
    if (error.name !== "AbortError") button.querySelector("span:first-child").textContent = "Try sharing again";
  }
}

function renderFinalCelebration() {
  const ranked = rankedScores();
  const winnerNames = ranked.filter((player) => player.rank === 1).map((player) => player.name);
  const sharedCrown = winnerNames.length > 1;

  document.querySelector("#reveal-page-title").textContent = "That’s the tea.";
  document.querySelector(".reveal-meta .eyebrow").textContent = "Game complete";
  document.querySelector(".reveal-meta .hero-copy").textContent = "The final leaderboard is locked. Screenshot it, share it, start the group chat.";
  document.querySelector(".host-score-strip").hidden = true;
  document.querySelector(".reveal-progress").hidden = true;

  spillCard.className = "spill-card final-scorecard";
  spillCard.innerHTML = `
    <div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="winner-crown" aria-hidden="true">♛</div>
    <p class="eyebrow">${sharedCrown ? "Our reigning royalty" : "Tonight’s tea queen"}</p>
    <h2>${sharedCrown ? `${winnerNames.join(" & ")} share the crown!` : `${winnerNames[0]} takes the crown!`}</h2>
    <p class="winner-score">${ranked[0].points} points · ${revealPolls.length} reveals</p>
    <div class="final-ranking" aria-label="Final group ranking">
      ${ranked
        .map(
          (player) => `
            <div class="final-rank-row ${player.rank === 1 ? "is-winner" : ""}">
              <span class="final-rank-number">${player.rank === 1 ? "♛" : player.rank}</span>
              <span class="leader-avatar">${player.name[0]}</span>
              <span><strong>${player.name}</strong><small>${player.rank === 1 ? "Crowned winner" : "Final score"}</small></span>
              <b>${player.points}<small>pts</small></b>
            </div>
          `,
        )
        .join("")}
    </div>
    <button class="primary-button share-scorecard" type="button" id="share-scorecard">
      <span>Share the full scorecard</span><span aria-hidden="true">↗</span>
    </button>
    <a class="final-home-link" href="index.html">Start another game</a>
  `;

  document.querySelector("#share-scorecard").addEventListener("click", (event) => {
    shareFinalScorecard(event.currentTarget, ranked, winnerNames);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

spillCard.addEventListener("click", (event) => {
  const resultOption = event.target.closest("[data-result]");
  if (resultOption) {
    selectedResult = resultOption.dataset.result;
    spillCard.querySelectorAll("[data-result]").forEach((button) => {
      const selected = button === resultOption;
      button.classList.toggle("is-selected", selected);
      button.querySelector(".choice-check").textContent = selected ? "✓" : "";
    });
    document.querySelector("#spill-result").disabled = false;
    return;
  }

  if (event.target.closest("#spill-result")) openConfirmation();

  if (event.target.closest("#next-reveal")) {
    if (revealIndex < revealPolls.length - 1) {
      revealIndex += 1;
      selectedResult = null;
      isRevealed = false;
      renderHostReveal();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      openCompleteConfirmation();
    }
  }
});

document.querySelector("#cancel-result").addEventListener("click", closeConfirmation);
confirmBackdrop.addEventListener("click", closeConfirmation);
document.querySelector("#cancel-complete").addEventListener("click", closeCompleteConfirmation);
completeBackdrop.addEventListener("click", closeCompleteConfirmation);
document.querySelector("#confirm-complete").addEventListener("click", () => {
  closeCompleteConfirmation();
  renderFinalCelebration();
});

document.querySelector("#confirm-result-button").addEventListener("click", () => {
  closeConfirmation();
  applyScores();
  isRevealed = true;
  renderMiniLeaderboard();
  renderPublishedResult();
});

renderMiniLeaderboard();
renderHostReveal();
