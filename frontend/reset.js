const resetForm = document.getElementById("reset-form");
const messageEl = document.getElementById("message");
const errorEl = document.getElementById("error");
const resetPasswordInput = document.getElementById("reset-password");
const resetConfirmInput = document.getElementById("reset-confirm");
const resetPasswordToggle = document.getElementById("reset-password-toggle");
const resetConfirmToggle = document.getElementById("reset-confirm-toggle");

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.style.display = "block";
  errorEl.style.display = "none";
}

function showError(text) {
  errorEl.textContent = text;
  errorEl.style.display = "block";
  messageEl.style.display = "none";
}

function togglePassword(input, button) {
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  button.textContent = isPassword ? "⚆_⚆":"◉_◉";
}

if (resetPasswordToggle && resetPasswordInput) {
  resetPasswordToggle.addEventListener("click", () => {
    togglePassword(resetPasswordInput, resetPasswordToggle);
  });
}

if (resetConfirmToggle && resetConfirmInput) {
  resetConfirmToggle.addEventListener("click", () => {
    togglePassword(resetConfirmInput, resetConfirmToggle);
  });
}

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const registerNumber = document.getElementById("reset-reg").value.trim();
  const password = resetPasswordInput.value;
  const confirmPassword = resetConfirmInput.value;

  if (!registerNumber || !password || !confirmPassword) {
    showError("All fields are required.");
    return;
  }
  if (password !== confirmPassword) {
    showError("Passwords do not match.");
    return;
  }
  if (password.length < 6) {
    showError("Password must be at least 6 characters.");
    return;
  }

  try {
    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registerNumber, password })
    });
    const data = await response.json();

    if (!response.ok) {
      showError(data.error || "Reset failed.");
      return;
    }

    showMessage(data.message || "Password reset successfully.");
    resetForm.reset();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  } catch (error) {
    showError("Network error. Try again.");
  }
});
