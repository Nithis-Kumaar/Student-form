const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || "dashboard",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "4341"
});

class SubmissionRepository {
  async create(submissionData) {
    const { name, register, college, department, course, year, cgpa, skills, resumeFilename, interests } = submissionData;
    const result = await pool.query(
      `INSERT INTO submissions (name, register, college, department, course, year, cgpa, skills, resume_filename, interests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests`,
      [name, register, college, department, course, year, cgpa, JSON.stringify(skills || []), resumeFilename || null, JSON.stringify(interests || [])]
    );
    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query(`SELECT id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests FROM submissions ORDER BY id DESC`);
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query(`SELECT id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests FROM submissions WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async update(id, submissionData) {
    const { name, register, college, department, course, year, cgpa, skills, resumeFilename, interests } = submissionData;
    const result = await pool.query(
      `UPDATE submissions
       SET name = $1,
           register = $2,
           college = $3,
           department = $4,
           course = $5,
           year = $6,
           cgpa = $7,
           skills = $8,
           resume_filename = $9,
           interests = $10,
           timestamp = NOW()
       WHERE id = $11
       RETURNING id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests`,
      [name, register, college, department, course, year, cgpa, JSON.stringify(skills || []), resumeFilename || null, JSON.stringify(interests || []), id]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await pool.query(`DELETE FROM submissions WHERE id = $1`, [id]);
    return result.rowCount > 0;
  }

  async initDb() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        name TEXT NOT NULL,
        register TEXT NOT NULL,
        college TEXT NOT NULL,
        department TEXT NOT NULL,
        course TEXT NOT NULL,
        year TEXT NOT NULL,
        cgpa NUMERIC(4,2) NOT NULL,
        skills JSONB NOT NULL DEFAULT '[]',
        resume_filename TEXT,
        interests JSONB NOT NULL DEFAULT '[]'
      )
    `);
  }
}

module.exports = new SubmissionRepository();