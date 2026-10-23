const builder = document.querySelector("#game-builder");
const pollList = document.querySelector("#poll-list");
const pollTemplate = document.querySelector("#poll-template");
const saveStatus = document.querySelector("#save-status");
const builderToast = document.querySelector("#builder-toast");
const gamePassword = document.querySelector("#game-password");
const passwordCount = document.querySelector("#password-count");

let saveTimer = null;
let toastTimer = null;

function updatePollOrder() {
  const polls = [...pollList.querySelectorAll("[data-poll]")];
  polls.forEach((poll, index) => {
    const position = index + 1;
    poll.querySelector(".poll-kicker").textContent = `Poll ${position}`;

    const subject = poll.querySelector('[name="poll_subject"]');
    const subjectLabel = poll.querySelector(".sr-only");
    subject.id = `poll-subject-${position}`;
    subjectLabel.htmlFor = subject.id;
    subjectLabel.textContent = `Poll ${position} subject`;

    poll.querySelector('[data-move="up"]').disabled = index === 0;
    poll.querySelector('[data-move="down"]').disabled = index === polls.length - 1;
    poll.querySelector("[data-remove]").disabled = polls.length === 1;
  });
}

function showSavingState() {
  clearTimeout(saveTimer);
  saveStatus.innerHTML = '<span aria-hidden="true">···</span> Saving draft';
  saveStatus.classList.add("is-saving");

  saveTimer = setTimeout(() => {
    saveStatus.innerHTML = '<span aria-hidden="true">✓</span> Draft saved';
    saveStatus.classList.remove("is-saving");
  }, 650);
}

function showBuilderToast() {
  clearTimeout(toastTimer);
  builderToast.hidden = false;
  toastTimer = setTimeout(() => {
    builderToast.hidden = true;
  }, 4200);
}

document.querySelector("#add-poll").addEventListener("click", () => {
  const poll = pollTemplate.content.firstElementChild.cloneNode(true);
  pollList.append(poll);
  updatePollOrder();
  poll.querySelector('[name="poll_subject"]').focus();
  showSavingState();
});

pollList.addEventListener("click", (event) => {
  const poll = event.target.closest("[data-poll]");
  if (!poll) return;

  if (event.target.closest("[data-remove]")) {
    poll.remove();
  } else if (event.target.closest('[data-move="up"]')) {
    poll.previousElementSibling?.before(poll);
  } else if (event.target.closest('[data-move="down"]')) {
    poll.nextElementSibling?.after(poll);
  } else {
    return;
  }

  updatePollOrder();
  showSavingState();
});

builder.addEventListener("input", showSavingState);

gamePassword.addEventListener("input", () => {
  gamePassword.value = gamePassword.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  passwordCount.textContent = `${gamePassword.value.length}/8`;
});

builder.addEventListener("submit", (event) => {
  event.preventDefault();
  showBuilderToast();
});

updatePollOrder();
