const createFormBtn = document.getElementById("create-form-btn");
const clearFiltersBtn = document.getElementById("clear-filters-btn");
const filterName = document.getElementById("filter-name");
const filterRegister = document.getElementById("filter-register");
const filterCollege = document.getElementById("filter-college");
const filterDepartment = document.getElementById("filter-department");
const filterYear = document.getElementById("filter-year");
const submissionsCount = document.getElementById("submissions-count");
const submissionsTableBody = document.querySelector("#submissions-table tbody");
const noResults = document.getElementById("no-results");

let submissions = [];

function normalize(value) {
  return (value || "").toString().toLowerCase();
}

function viewSubmission(submission) {
  window.location.href = `view-details.html?id=${submission.id}`;
}

async function deleteSubmission(id) {
  if (!confirm("Are you sure you want to delete this submission?")) {
    return;
  }
  try {
    const response = await fetch(`/api/submissions/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      throw new Error("Failed to delete submission.");
    }
    alert("Submission deleted successfully.");
    loadSubmissions(); // Reload the list
  } catch (error) {
    alert(error.message);
  }
}

function applyFilters() {
  const nameFilter = normalize(filterName.value);
  const registerFilter = normalize(filterRegister.value);
  const collegeFilter = normalize(filterCollege.value);
  const departmentFilter = normalize(filterDepartment.value);
  const yearFilter = normalize(filterYear.value);

  const filtered = submissions.filter((submission) => {
    return (
      normalize(submission.name).includes(nameFilter) &&
      normalize(submission.register).includes(registerFilter) &&
      normalize(submission.college).includes(collegeFilter) &&
      normalize(submission.department).includes(departmentFilter) &&
      normalize(submission.year).includes(yearFilter)
    );
  });

  renderTable(filtered);
}

function renderTable(rows) {
  submissionsTableBody.innerHTML = "";

  if (!rows.length) {
    noResults.classList.remove("hidden");
    submissionsCount.textContent = `Showing 0 of ${submissions.length} submissions`;
    return;
  }

  noResults.classList.add("hidden");
  submissionsCount.textContent = `Showing ${rows.length} of ${submissions.length} submissions`;

  rows.forEach((submission, index) => {
    const row = document.createElement("tr");
    const resumeCell = submission.resumeFilename && submission.resumeFilename.trim().length > 0
      ? `<a class="resume-link" href="preview.html?file=${encodeURIComponent(submission.resumeFilename)}">${submission.resumeFilename}</a>`
      : `<span class="muted">Not uploaded</span>`;

    row.innerHTML = `
      <td>${index + 1}</td>
      <td class="name-cell">${submission.name}</td>
      <td>${submission.register}</td>
      <td>${submission.college}</td>
      <td>${submission.course}</td>
      <td>${submission.department}</td>
      <td>${submission.year}</td>
      <td>${submission.cgpa}</td>
      <td>${submission.skills ? submission.skills.join(", ") : ""}</td>
      <td>${submission.interests ? submission.interests.join(", ") : ""}</td>
      <td>${resumeCell}</td>
      <td>${new Date(submission.timestamp).toLocaleString()}</td>
      <td>
        <div class="action-buttons">
          <button type="button" class="view-btn" data-id="${submission.id}">View</button>
          <button type="button" class="edit-btn" data-id="${submission.id}">Edit</button>
          <button type="button" class="delete-btn" data-id="${submission.id}">Delete</button>
        </div>
      </td>
    `;
    submissionsTableBody.appendChild(row);
    const viewButton = row.querySelector(".view-btn");
    const editButton = row.querySelector(".edit-btn");
    const deleteButton = row.querySelector(".delete-btn");
    if (viewButton) {
      viewButton.addEventListener("click", () => {
        viewSubmission(submission);
      });
    }
    if (editButton) {
      editButton.addEventListener("click", () => {
        window.location.href = `form.html?editId=${submission.id}`;
      });
    }
    if (deleteButton) {
      deleteButton.addEventListener("click", () => {
        deleteSubmission(submission.id);
      });
    }
  });
}

async function loadSubmissions() {
  try {
    const response = await fetch("/api/submissions");
    if (!response.ok) {
      throw new Error("Unable to load submissions.");
    }
    submissions = await response.json();
    renderTable(submissions);
  } catch (error) {
    submissionsCount.textContent = error.message;
    noResults.classList.add("hidden");
  }
}

if (createFormBtn) {
  createFormBtn.addEventListener("click", () => {
    window.location.href = "form.html";
  });
}

const logoutBtnForms = document.getElementById("logout-btn-forms");
if (logoutBtnForms) {
  logoutBtnForms.addEventListener("click", () => {
    sessionStorage.removeItem("userName");
    window.location.href = "index.html";
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    filterName.value = "";
    filterRegister.value = "";
    filterCollege.value = "";
    filterDepartment.value = "";
    filterYear.value = "";
    renderTable(submissions);
  });
}

[filterName, filterRegister, filterCollege, filterDepartment, filterYear].forEach((field) => {
  field.addEventListener("input", applyFilters);
});

loadSubmissions();
