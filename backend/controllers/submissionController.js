const submissionService = require("../services/submissionService");

class SubmissionController {
  async submitForm(req, res) {
    try {
      const submission = await submissionService.createSubmission(req.body);
      res.status(201).json({ message: "Form submitted successfully!", submission });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Unable to save submission." });
    }
  }

  async getSubmissions(req, res) {
    try {
      const submissions = await submissionService.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Unable to load submissions." });
    }
  }

  async getSubmissionById(req, res) {
    const id = Number(req.params.id);
    try {
      const submission = await submissionService.getSubmissionById(id);
      res.json(submission);
    } catch (error) {
      console.error(error);
      if (error.message === "Submission not found.") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || "Unable to load submission." });
      }
    }
  }

  async updateSubmission(req, res) {
    const id = Number(req.params.id);
    try {
      const submission = await submissionService.updateSubmission(id, req.body);
      res.json({ message: "Form updated successfully!", submission });
    } catch (error) {
      console.error(error);
      if (error.message === "Submission not found.") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || "Unable to update submission." });
      }
    }
  }

  async deleteSubmission(req, res) {
    const id = Number(req.params.id);
    try {
      await submissionService.deleteSubmission(id);
      res.json({ message: "Submission deleted successfully." });
    } catch (error) {
      console.error(error);
      if (error.message === "Submission not found.") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || "Unable to delete submission." });
      }
    }
  }
}

module.exports = new SubmissionController();