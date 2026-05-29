const submissionRepository = require("../repositories/submissionRepository");

class SubmissionService {
  async createSubmission(submissionData) {
    const { name, register, college, department, course, year, cgpa } = submissionData;

    if (!name || !register || !college || !department || !course || !year || !cgpa) {
      throw new Error("All fields are required.");
    }

    return await submissionRepository.create(submissionData);
  }

  async getAllSubmissions() {
    return await submissionRepository.findAll();
  }

  async getSubmissionById(id) {
    const submission = await submissionRepository.findById(id);
    if (!submission) {
      throw new Error("Submission not found.");
    }
    return submission;
  }

  async updateSubmission(id, submissionData) {
    const { name, register, college, department, course, year, cgpa } = submissionData;

    if (!name || !register || !college || !department || !course || !year || !cgpa) {
      throw new Error("All fields are required.");
    }

    const submission = await submissionRepository.update(id, submissionData);
    if (!submission) {
      throw new Error("Submission not found.");
    }
    return submission;
  }

  async deleteSubmission(id) {
    const deleted = await submissionRepository.delete(id);
    if (!deleted) {
      throw new Error("Submission not found.");
    }
    return true;
  }
}

module.exports = new SubmissionService();