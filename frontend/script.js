const welcomeText = document.getElementById("welcome-text");
const studentForm = document.getElementById("student-form");
const logoutBtn = document.getElementById("logout-btn");
const viewFormsBtn = document.getElementById("view-forms-btn");

function ensureLoggedIn() {
  const userName = sessionStorage.getItem("userName");
  if (!userName) {
    window.location.href = "index.html";
    return null;
  }

  welcomeText.textContent = `Welcome, ${userName}! Please fill out the student form below.`;
  return userName;
}

function getEditId() {
  return new URLSearchParams(window.location.search).get("editId");
}

function updateSelectedSkillsDisplay() {
  const selectedSkills = Array.from(document.querySelectorAll("#skills-menu input[type='checkbox']:checked")).map(cb => cb.value);
  const summary = document.getElementById("skills-button");
  if (summary) {
    summary.textContent = selectedSkills.length > 0 ? `Selected: ${selectedSkills.join(", ")}` : "Select skills";
  }
}

function fillForm(submission) {
  document.getElementById("form-name").value = submission.name || "";
  document.getElementById("form-register").value = submission.register || "";
  document.getElementById("form-college").value = submission.college || "";
  document.getElementById("form-department").value = submission.department || "";
  document.getElementById("form-course").value = submission.course || "";
  document.getElementById("form-cgpa").value = submission.cgpa || "";
  document.querySelectorAll(".checkbox-group input[type='checkbox']").forEach((checkbox) => {
    checkbox.checked = submission.interests ? submission.interests.includes(checkbox.value) : false;
  });
  document.querySelectorAll("#skills-menu input[type='checkbox']").forEach((checkbox) => {
    checkbox.checked = submission.skills ? submission.skills.includes(checkbox.value) : false;
  });
  // Update skills display after pre-filling
  updateSelectedSkillsDisplay();
  if (submission.year) {
    const selectedYear = document.querySelector(`input[name='year'][value='${submission.year}']`);
    if (selectedYear) {
      selectedYear.checked = true;
    }
  }
  // Handle resume: show current filename in a visible label below the file input
  const resumeInput = document.getElementById("form-resume");
  const resumeDisplay = document.getElementById("current-resume-display");
  const hasResume = typeof submission.resumeFilename === 'string' && submission.resumeFilename.trim().length > 0;
  if (resumeDisplay) {
    if (hasResume) {
      resumeDisplay.textContent = `Current Resume: ${submission.resumeFilename}`;
    } else {
      resumeDisplay.textContent = `No resume uploaded`;
    }
    resumeDisplay.classList.remove("hidden");
  }
  const submitButton = studentForm.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.textContent = "Update Form";
  }
  const heading = document.querySelector("h1");
  if (heading) {
    heading.textContent = "Edit Student Form";
  }
}

async function loadEditSubmission(editId) {
  try {
    const response = await fetch(`/api/submissions/${editId}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to load submission for editing.");
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(text || "Unexpected response from server.");
    }
    const submission = await response.json();
    fillForm(submission);
  } catch (error) {
    alert(error.message);
    window.location.href = "forms.html";
  }
}

function logout() {
  sessionStorage.removeItem("userName");
  window.location.href = "index.html";
}

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const interests = Array.from(document.querySelectorAll(".checkbox-group input[type='checkbox']:checked")).map(cb => cb.value);
  const yearSelected = document.querySelector("input[name='year']:checked");
  const skills = Array.from(document.querySelectorAll("#skills-menu input[type='checkbox']:checked")).map(cb => cb.value);
  const resumeInput = document.getElementById("form-resume");
  const resumeFile = document.getElementById("form-resume").files[0];
  const editId = getEditId();
  
  // For updates, preserve existing resume if no new file is selected
  let resumeFilename = "";
  if (resumeFile) {
    resumeFilename = resumeFile.name;
  } else if (editId) {
    // If updating and no new file, fetch existing resume
    try {
      const response = await fetch(`/api/submissions/${editId}`);
      if (response.ok) {
        const submission = await response.json();
        resumeFilename = submission.resumeFilename || "";
      }
    } catch (error) {
      console.error("Error fetching existing submission:", error);
    }
  }
  
  const formData = {
    name: document.getElementById("form-name").value,
    register: document.getElementById("form-register").value,
    college: document.getElementById("form-college").value,
    department: document.getElementById("form-department").value,
    course: document.getElementById("form-course").value,
    year: yearSelected ? yearSelected.value : "",
    cgpa: document.getElementById("form-cgpa").value,
    skills: skills,
    resumeFilename: resumeFilename,
    interests: interests
  };

  if (resumeInput && resumeFile) {
    const resumeInfo = document.getElementById("current-resume-display");
    if (resumeInfo) {
      resumeInfo.textContent = `Selected Resume: ${resumeFile.name}`;
      resumeInfo.classList.remove("hidden");
    }
  }

  try {
    let response;
    if (resumeFile) {
      // send multipart/form-data including file
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("register", formData.register);
      fd.append("college", formData.college);
      fd.append("department", formData.department);
      fd.append("course", formData.course);
      fd.append("year", formData.year);
      fd.append("cgpa", formData.cgpa);
      fd.append("skills", JSON.stringify(formData.skills || []));
      fd.append("interests", JSON.stringify(formData.interests || []));
      fd.append("resume", resumeFile);

      const url = editId ? `/api/submissions/${editId}/multipart` : "/api/submit-form-multipart";
      const method = editId ? "PUT" : "POST";
      response = await fetch(url, { method, body: fd });
    } else {
      const url = editId ? `/api/submissions/${editId}` : "/api/submit-form";
      const method = editId ? "PUT" : "POST";
      response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
    }

    if (response.ok) {
      const result = await response.json();
      alert(editId ? "Form updated successfully!" : "Form submitted successfully!");
      window.location.href = "forms.html";
      console.log("Submission response:", result);
    } else {
      alert("Error submitting form.");
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
});

if (viewFormsBtn) {
  viewFormsBtn.addEventListener("click", () => {
    window.location.href = "forms.html";
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

// Skills dropdown and search
const skillsDropdown = document.getElementById("skills-dropdown");
const skillsSearch = document.getElementById("skills-search");
const skillsButton = document.getElementById("skills-button");

// Close dropdown when clicking outside
if (skillsDropdown) {
  document.addEventListener("click", (e) => {
    if (!skillsDropdown.contains(e.target)) {
      skillsDropdown.open = false;
    }
  });
}

// Skills search filter
if (skillsSearch) {
  skillsSearch.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const options = document.querySelectorAll("#skills-menu .option-item");
    options.forEach(option => {
      const text = option.textContent.toLowerCase();
      option.style.display = text.includes(query) ? "" : "none";
    });
  });
}

// Update skills display when selection changes
const skillsCheckboxes = document.querySelectorAll("#skills-menu input[type='checkbox']");
skillsCheckboxes.forEach(checkbox => {
  checkbox.addEventListener("change", updateSelectedSkillsDisplay);
});

const formResumeInput = document.getElementById("form-resume");
if (formResumeInput) {
  formResumeInput.addEventListener("change", () => {
    const selectedFile = formResumeInput.files[0];
    const resumeInfo = document.getElementById("current-resume-display");
    if (resumeInfo) {
      if (selectedFile) {
        resumeInfo.textContent = `Selected Resume: ${selectedFile.name}`;
        resumeInfo.classList.remove("hidden");
      } else {
        resumeInfo.textContent = "No resume selected.";
        resumeInfo.classList.add("hidden");
      }
    }
  });
}

ensureLoggedIn();
const editId = getEditId();
if (editId) {
  loadEditSubmission(editId);
}
