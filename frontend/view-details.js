const backBtn = document.getElementById("back-btn");
const logoutBtn = document.getElementById("logout-btn-details");
const loadingDiv = document.getElementById("loading");
const detailsContent = document.getElementById("details-content");
const errorMessage = document.getElementById("error-message");

function ensureLoggedIn() {
  if (!sessionStorage.getItem("userName")) {
    window.location.href = "index.html";
  }
}

function getSubmissionId() {
  return new URLSearchParams(window.location.search).get("id");
}

function showError(message) {
  loadingDiv.classList.add("hidden");
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function displayDetails(submission) {
  loadingDiv.classList.add("hidden");
  
  const details = [
    { label: "Name", value: submission.name },
    { label: "Register Number", value: submission.register },
    { label: "College", value: submission.college },
    { label: "Course", value: submission.course },
    { label: "Department", value: submission.department },
    { label: "Year", value: submission.year },
    { label: "CGPA", value: submission.cgpa },
    { label: "Skills", value: submission.skills ? submission.skills.join(", ") : "None" },
    { label: "Interests", value: submission.interests ? submission.interests.join(", ") : "None" },
    { label: "Resume", value: submission.resumeFilename || "Not uploaded" },
    { label: "Submitted At", value: new Date(submission.timestamp).toLocaleString() }
  ];

  detailsContent.innerHTML = details.map(item => `
    <div class="detail-item">
      <div class="detail-label">${item.label}</div>
      <div class="detail-value">${item.value}</div>
    </div>
  `).join("");
  
  detailsContent.classList.remove("hidden");
}

async function loadSubmissionDetails() {
  const submissionId = getSubmissionId();
  
  if (!submissionId) {
    showError("Invalid submission ID");
    return;
  }

  try {
    const response = await fetch(`/api/submissions/${submissionId}`);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to load submission details");
    }

    const submission = await response.json();
    displayDetails(submission);
  } catch (error) {
    showError(error.message);
  }
}

backBtn.addEventListener("click", () => {
  window.location.href = "forms.html";
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("userName");
  window.location.href = "index.html";
});

ensureLoggedIn();
loadSubmissionDetails();
