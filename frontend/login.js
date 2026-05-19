const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("password-toggle");
const forgotPasswordLink = document.getElementById("forgot-password");
const errorMsg = document.getElementById("error-msg");

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function clearError() {
  errorMsg.textContent = "";
  errorMsg.classList.add("hidden");
}

async function login(username, password) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const data = await response.json();
      throw new Error(data.error || "Login failed.");
    }
    const text = await response.text();
    throw new Error(text || "Login failed.");
  }

  if (!isJson) {
    throw new Error("Unexpected server response.");
  }

  return response.json();
}

function ensureNotLoggedIn() {
  if (sessionStorage.getItem("userName")) {
    window.location.href = "forms.html";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showError("Username and password are required.");
    return;
  }

  try {
    const user = await login(username, password);
    sessionStorage.setItem("userName", user.name);
    window.location.href = "forms.html";
  } catch (error) {
    showError(error.message);
  }
});

if (passwordToggle) {
  passwordToggle.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    passwordToggle.textContent = isPassword ? "⚆_⚆" : "◉_◉";
  });
}

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", () => {
    window.open("reset.html", "_blank");
  });
}

ensureNotLoggedIn();