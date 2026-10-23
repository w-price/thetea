const authSheet = document.querySelector("#auth-sheet");
const authBackdrop = document.querySelector("#auth-backdrop");
const registerView = document.querySelector("#register-view");
const loginView = document.querySelector("#login-view");
const joinCode = document.querySelector("#join-code");
const toast = document.querySelector("#preview-toast");

let lastFocusedElement = null;
let toastTimer = null;
let pendingIntent = null;

function setAuthView(view) {
  const showLogin = view === "login";
  registerView.hidden = showLogin;
  loginView.hidden = !showLogin;
}

function openAuth(view) {
  lastFocusedElement = document.activeElement;
  setAuthView(view);
  authSheet.hidden = false;
  authBackdrop.hidden = false;
  document.body.style.overflow = "hidden";

  const firstInput = authSheet.querySelector(".auth-view:not([hidden]) input");
  firstInput?.focus();
}

function closeAuth() {
  authSheet.hidden = true;
  authBackdrop.hidden = true;
  document.body.style.overflow = "";
  lastFocusedElement?.focus();
}

function showPreviewToast() {
  clearTimeout(toastTimer);
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

document.querySelectorAll("[data-open-auth]").forEach((button) => {
  button.addEventListener("click", () => {
    pendingIntent = button.textContent.includes("Host") ? "host" : null;
    openAuth(button.dataset.openAuth);
  });
});

document.querySelectorAll("[data-switch-auth]").forEach((button) => {
  button.addEventListener("click", () => setAuthView(button.dataset.switchAuth));
});

document.querySelector("#close-auth").addEventListener("click", closeAuth);
authBackdrop.addEventListener("click", closeAuth);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !authSheet.hidden) {
    closeAuth();
  }
});

joinCode.addEventListener("input", () => {
  joinCode.value = joinCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

document.querySelector("#join-form").addEventListener("submit", (event) => {
  event.preventDefault();
  pendingIntent = "join";
  openAuth("register");
});

document.querySelectorAll("[data-preview-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (pendingIntent === "host") {
      window.location.href = "host.html";
      return;
    }
    closeAuth();
    showPreviewToast();
  });
});
