const polls = [
  { id: "maya-jordan", subject: "Maya + Jordan", prompt: "What happens at the altar?" },
  { id: "sienna-theo", subject: "Sienna + Theo", prompt: "How does their story end?" },
  { id: "alex-sam", subject: "Alex + Sam", prompt: "Are they leaving together?" },
  { id: "nia-devon", subject: "Nia + Devon", prompt: "What’s your final call?" },
  { id: "remi-chris", subject: "Remi + Chris", prompt: "Do they make it all the way?" },
];

const outcomes = [
  { id: "married", flag: "YES", label: "They get married." },
  { id: "altar-no", flag: "NO", label: "Someone says no at the altar." },
  { id: "breakup", flag: "NO", label: "They break up before the altar." },
];

const players = [
  { name: "Taylor", initial: "T", voted: true, current: true, points: 0 },
  { name: "Maya", initial: "M", voted: true, points: 0 },
  { name: "Jordan", initial: "J", voted: true, points: 0 },
  { name: "Riley", initial: "R", voted: false, points: 0 },
  { name: "Chris", initial: "C", voted: true, points: 0 },
];

const selections = new Map();
const voteCard = document.querySelector("#vote-card");
const progressLabel = document.querySelector("#progress-label");
const progressTrack = document.querySelector(".progress-track");
const progressFill = document.querySelector("#progress-fill");
const previousButton = document.querySelector("#previous-poll");
const nextButton = document.querySelector("#next-poll");
const finalVoteNote = document.querySelector("#final-vote-note");
const ballotScreen = document.querySelector("#ballot-screen");
const roomScreen = document.querySelector("#room-screen");
const dramaSheet = document.querySelector("#drama-sheet");
const dramaBackdrop = document.querySelector("#drama-backdrop");
const playerFinalScreen = document.querySelector("#player-final-screen");

let currentPollIndex = 0;
let isReviewing = false;
let roomTimers = [];

function outcomeFor(outcomeId) {
  return outcomes.find((outcome) => outcome.id === outcomeId);
}

function renderPoll() {
  isReviewing = false;
  const poll = polls[currentPollIndex];
  const selectedOutcome = selections.get(poll.id);

  progressLabel.textContent = `${currentPollIndex + 1} of ${polls.length}`;
  progressTrack.setAttribute("aria-valuenow", currentPollIndex + 1);
  progressFill.style.width = `${((currentPollIndex + 1) / polls.length) * 100}%`;
  previousButton.disabled = currentPollIndex === 0;
  nextButton.disabled = !selectedOutcome;
  nextButton.querySelector("span:first-child").textContent =
    currentPollIndex === polls.length - 1 ? "Review scorecard" : "Next prediction";
  finalVoteNote.hidden = true;

  voteCard.innerHTML = `
    <div class="vote-card-topline">
      <span>Prediction ${currentPollIndex + 1}</span>
      <span>${selections.size}/${polls.length} picked</span>
    </div>
    <div class="couple-monogram" aria-hidden="true">
      <span>${poll.subject.split(" + ")[0][0]}</span>
      <span>+</span>
      <span>${poll.subject.split(" + ")[1][0]}</span>
    </div>
    <p class="vote-prompt">${poll.prompt}</p>
    <h2>${poll.subject}</h2>
    <div class="vote-options" role="radiogroup" aria-label="Choose an outcome">
      ${outcomes
        .map(
          (outcome) => `
            <button
              class="vote-option ${selectedOutcome === outcome.id ? "is-selected" : ""}"
              type="button"
              role="radio"
              aria-checked="${selectedOutcome === outcome.id}"
              data-outcome="${outcome.id}"
            >
              <span class="vote-flag">${outcome.flag}</span>
              <span>${outcome.label}</span>
              <span class="choice-check" aria-hidden="true">✓</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderScorecard() {
  isReviewing = true;
  progressLabel.textContent = "Ready to submit";
  progressTrack.setAttribute("aria-valuenow", polls.length);
  progressFill.style.width = "100%";
  previousButton.disabled = false;
  nextButton.disabled = false;
  nextButton.querySelector("span:first-child").textContent = "Submit final votes";
  finalVoteNote.hidden = false;

  voteCard.innerHTML = `
    <div class="scorecard-heading">
      <span class="scorecard-sparkle" aria-hidden="true">✦</span>
      <p class="step-label">Your scorecard</p>
      <h2>Five calls. Zero take-backs.</h2>
      <p>Give everything one last look before the tea starts brewing.</p>
    </div>
    <div class="scorecard-list">
      ${polls
        .map((poll, index) => {
          const outcome = outcomeFor(selections.get(poll.id));
          return `
            <button class="scorecard-row" type="button" data-edit-poll="${index}">
              <span class="scorecard-number">${index + 1}</span>
              <span class="scorecard-call">
                <strong>${poll.subject}</strong>
                <span><b>${outcome.flag}</b> — ${outcome.label}</span>
              </span>
              <span class="edit-label">Edit</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderLeaderboard() {
  const leaderList = document.querySelector("#leader-list");
  const rankedPlayers = [...players].sort((a, b) => b.points - a.points);
  leaderList.innerHTML = rankedPlayers
    .map(
      (player, index) => `
        <div class="leader-row ${player.current ? "is-current" : ""}">
          <span class="leader-rank">${index + 1}</span>
          <span class="leader-avatar">${player.initial}</span>
          <span class="leader-name">${player.name}${player.current ? " (you)" : ""}</span>
          <span class="ballot-status ${player.voted ? "is-in" : ""}">
            ${player.voted ? "Ballot in" : "Choosing…"}
          </span>
          <strong class="leader-points">${player.points}</strong>
        </div>
      `,
    )
    .join("");
  document.querySelector("#live-count").textContent = `${players.length} joined`;
}

function renderMyPicks() {
  document.querySelector("#my-picks").innerHTML = polls
    .map((poll) => {
      const outcome = outcomeFor(selections.get(poll.id));
      return `
        <div class="my-pick-row">
          <span><strong>${poll.subject}</strong><small>${outcome.label}</small></span>
          <span class="pick-flag">${outcome.flag}</span>
        </div>
      `;
    })
    .join("");
}

function openDramaSummary() {
  dramaSheet.hidden = false;
  dramaBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#close-drama").focus();
}

function closeDramaSummary() {
  dramaSheet.hidden = true;
  dramaBackdrop.hidden = true;
  document.body.style.overflow = "";
}

function addActivity(icon, title, detail) {
  const item = document.createElement("div");
  item.className = "activity-item is-new";
  item.innerHTML = `
    <span class="activity-icon">${icon}</span>
    <p><strong>${title}</strong><br><span>${detail}</span></p>
  `;
  document.querySelector("#activity-list").prepend(item);
}

function startRoomUpdates() {
  roomTimers.push(
    setTimeout(() => {
      players.push({ name: "Sasha", initial: "S", voted: false, points: 0 });
      renderLeaderboard();
      addActivity("💖", "Sasha joined the party.", "Six people are in the room now.");
    }, 2800),
  );
  roomTimers.push(
    setTimeout(() => {
      players[3].voted = true;
      renderLeaderboard();
      addActivity("🔥", "Another ballot is in.", "The room just flipped on Alex + Sam.");
    }, 5600),
  );
  roomTimers.push(setTimeout(showPublishedResult, 8400));
  roomTimers.push(setTimeout(showPlayerFinal, 11800));
}

function pointsForFirstResult(outcomeId) {
  if (outcomeId === "altar-no") return 3;
  if (outcomeId === "breakup") return 1;
  return 0;
}

function showPublishedResult() {
  const userOutcome = selections.get("maya-jordan");
  const userPoints = pointsForFirstResult(userOutcome);
  const scoreUpdates = new Map([
    ["Taylor", userPoints],
    ["Maya", 0],
    ["Jordan", 3],
    ["Riley", 1],
    ["Chris", 3],
  ]);
  players.forEach((player) => {
    player.points = scoreUpdates.get(player.name) ?? player.points;
  });

  const groups = {
    married: ["Maya"],
    "altar-no": ["Jordan", "Chris"],
    breakup: ["Riley"],
  };
  groups[userOutcome].unshift("Taylor");

  const resultCard = document.querySelector("#player-result-card");
  resultCard.innerHTML = `
    <div class="player-result-heading">
      <span class="tea-spilled-icon" aria-hidden="true">☕</span>
      <div><p class="step-label">The tea is spilled</p><h3 id="player-result-title">Maya + Jordan</h3></div>
      <span class="points-burst ${userPoints ? "earned" : ""}">+${userPoints}</span>
    </div>
    <div class="actual-result"><span class="vote-flag">NO</span><strong>Someone says no at the altar.</strong></div>
    <p class="result-reaction">${
      userPoints === 3
        ? "Exact call. You knew the tea."
        : userPoints === 1
          ? "Right ending, wrong flavor of drama."
          : "The altar had other plans for your prediction."
    }</p>
    <div class="player-prediction-groups">
      <span><b>YES — Married</b>${groups.married.join(", ")}</span>
      <span class="is-actual"><b>NO — At the altar</b>${groups["altar-no"].join(", ")}</span>
      <span><b>NO — Before the altar</b>${groups.breakup.join(", ")}</span>
    </div>
  `;
  resultCard.hidden = false;
  renderLeaderboard();
  addActivity("☕", "The host spilled the tea.", "Maya + Jordan scores are now live.");
}

function rankFinalPlayers(finalPlayers) {
  const sorted = [...finalPlayers].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return sorted.map((player) => ({
    ...player,
    rank: sorted.findIndex((entry) => entry.points === player.points) + 1,
  }));
}

function finalShareText(ranked, winners) {
  const standings = ranked.map((player) => `${player.rank}. ${player.name} — ${player.points} pts`).join("\n");
  return `The Tea is officially spilled ☕\n${winners.join(" & ")} share the crown!\n\n${standings}`;
}

async function sharePlayerResults(button, ranked, winners) {
  const text = finalShareText(ranked, winners);
  try {
    if (navigator.share) {
      await navigator.share({ title: "The Tea — final results", text });
      button.querySelector("span:first-child").textContent = "Results shared!";
    } else {
      await navigator.clipboard.writeText(text);
      button.querySelector("span:first-child").textContent = "Results copied!";
    }
  } catch (error) {
    if (error.name !== "AbortError") button.querySelector("span:first-child").textContent = "Try sharing again";
  }
}

function showPlayerFinal() {
  const finalPlayers = [
    { name: "Taylor", initial: "T", points: 9, current: true },
    { name: "Maya", initial: "M", points: 9 },
    { name: "Chris", initial: "C", points: 3 },
    { name: "Jordan", initial: "J", points: 3 },
    { name: "Riley", initial: "R", points: 3 },
    { name: "Sasha", initial: "S", points: 0 },
  ];
  const ranked = rankFinalPlayers(finalPlayers);
  const currentPlayer = ranked.find((player) => player.current);
  const winners = ranked.filter((player) => player.rank === 1);
  const everyoneElse = ranked.filter((player) => !player.current && player.rank !== 1);

  document.querySelector(".game-meta").hidden = true;
  roomScreen.hidden = true;
  playerFinalScreen.hidden = false;
  document.querySelector(".status-pill").classList.remove("live-pill");
  document.querySelector(".status-pill").innerHTML = '<span aria-hidden="true">♛</span> Complete';

  playerFinalScreen.innerHTML = `
    <header class="player-final-heading">
      <p class="eyebrow">That’s the tea</p>
      <h1 id="player-final-title">The crowns are claimed.</h1>
      <p>The results are locked, and the group chat has receipts.</p>
    </header>

    <section class="player-winners" aria-labelledby="player-winners-title">
      <div class="winner-crown" aria-hidden="true">♛</div>
      <p class="step-label">${winners.length > 1 ? "Reigning royalty" : "Tonight’s winner"}</p>
      <h2 id="player-winners-title">${winners.map((winner) => winner.name).join(" & ")}</h2>
      <p>${winners.length > 1 ? "share the crown" : "takes the crown"} · ${winners[0].points} points</p>
      <div class="winner-avatars">
        ${winners.map((winner) => `<span aria-label="${winner.name}">${winner.initial}</span>`).join("")}
      </div>
    </section>

    <section class="player-night-card" aria-labelledby="your-night-title">
      <div class="player-night-heading">
        <div><p class="step-label">Your night</p><h2 id="your-night-title">You finished #${currentPlayer.rank}</h2></div>
        <strong>${currentPlayer.points}<small>points</small></strong>
      </div>
      <div class="player-stat-grid">
        <div><strong>3</strong><span>Exact calls</span><small>+9 points</small></div>
        <div><strong>0</strong><span>Right ending</span><small>+0 points</small></div>
        <div><strong>2</strong><span>Plot twists</span><small>0 points</small></div>
      </div>
      <p class="player-verdict">Three exact calls? You didn’t predict the drama—you produced it.</p>
    </section>

    <section class="everyone-else-card" aria-labelledby="everyone-else-title">
      <div class="room-card-heading">
        <div><p class="step-label">The rest of the room</p><h2 id="everyone-else-title">Everyone else</h2></div>
        <span>${ranked.length} players</span>
      </div>
      <div class="player-final-ranking">
        ${everyoneElse
          .map(
            (player) => `
              <div class="player-final-row">
                <span>${player.rank}</span>
                <span class="leader-avatar">${player.initial}</span>
                <strong>${player.name}</strong>
                <b>${player.points}<small> pts</small></b>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>

    <button class="primary-button player-share-button" type="button" id="player-share-results">
      <span>Share the final results</span><span aria-hidden="true">↗</span>
    </button>
    <a class="final-home-link" href="index.html">Back to The Tea</a>
  `;

  document.querySelector("#player-share-results").addEventListener("click", (event) => {
    sharePlayerResults(event.currentTarget, ranked, winners.map((winner) => winner.name));
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function submitBallot() {
  ballotScreen.hidden = true;
  roomScreen.hidden = false;
  renderLeaderboard();
  renderMyPicks();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(openDramaSummary, 250);
  startRoomUpdates();
}

voteCard.addEventListener("click", (event) => {
  const option = event.target.closest("[data-outcome]");
  const editButton = event.target.closest("[data-edit-poll]");

  if (option) {
    selections.set(polls[currentPollIndex].id, option.dataset.outcome);
    renderPoll();
  } else if (editButton) {
    currentPollIndex = Number(editButton.dataset.editPoll);
    renderPoll();
  }
});

previousButton.addEventListener("click", () => {
  if (isReviewing) {
    currentPollIndex = polls.length - 1;
  } else {
    currentPollIndex = Math.max(0, currentPollIndex - 1);
  }
  renderPoll();
});

nextButton.addEventListener("click", () => {
  if (isReviewing) {
    submitBallot();
  } else if (currentPollIndex === polls.length - 1) {
    renderScorecard();
  } else {
    currentPollIndex += 1;
    renderPoll();
  }
});

document.querySelector("#close-drama").addEventListener("click", closeDramaSummary);
document.querySelector("#enter-room").addEventListener("click", closeDramaSummary);
dramaBackdrop.addEventListener("click", closeDramaSummary);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dramaSheet.hidden) closeDramaSummary();
});

renderPoll();

if (new URLSearchParams(window.location.search).get("view") === "final") {
  ballotScreen.hidden = true;
  showPlayerFinal();
}
