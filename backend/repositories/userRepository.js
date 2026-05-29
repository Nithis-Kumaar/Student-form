const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || "dashboard",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "4341"
});

class UserRepository {
  async initDb() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        student_class TEXT NOT NULL,
        email TEXT,
        courses JSONB NOT NULL DEFAULT '[]',
        attendance TEXT
      )
    `);

    const result = await pool.query(`SELECT id FROM users WHERE username = $1`, ["Nithis"]);
    if (result.rowCount === 0) {
      await pool.query(
        `INSERT INTO users (username, password, name, student_id, student_class, email, courses, attendance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          "Nithis",
          "NK12345",
          "Nithis Kumaar",
          "727723EUIT150",
          "Grade 12",
          "nithiskumaar.m.b@gmail.com",
          JSON.stringify(["Mathematics", "Science", "History"]),
          "95%"
        ]
      );
    }
  }

  async findByUsername(username) {
    const result = await pool.query(
      `SELECT id, username, password, name, student_id AS "studentId", student_class AS "studentClass", email, courses, attendance
       FROM users
       WHERE username = $1`,
      [username]
    );
    return result.rows[0] || null;
  }

  async findByStudentId(studentId) {
    const result = await pool.query(
      `SELECT id, username, password, name, student_id AS "studentId", student_class AS "studentClass", email, courses, attendance
       FROM users
       WHERE student_id = $1`,
      [studentId]
    );
    return result.rows[0] || null;
  }

  async updatePassword(studentId, password) {
    await pool.query(
      `UPDATE users SET password = $1 WHERE student_id = $2`,
      [password, studentId]
    );
  }
}

module.exports = new UserRepository();