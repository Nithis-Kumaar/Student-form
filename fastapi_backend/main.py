import json
import os
from pathlib import Path
from typing import List, Optional

import psycopg
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
import shutil
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from psycopg.rows import dict_row
from passlib.context import CryptContext

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"

DB_HOST = os.getenv("PGHOST", "localhost")
DB_PORT = os.getenv("PGPORT", "5432")
DB_NAME = os.getenv("PGDATABASE", "dashboard")
DB_USER = os.getenv("PGUSER", "postgres")
DB_PASSWORD = os.getenv("PGPASSWORD", "4341")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)

db_conn: Optional[psycopg.Connection] = None

app = FastAPI(title="Dashboard FastAPI Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn() -> psycopg.Connection:
    if db_conn is None:
        raise RuntimeError("Database connection is not initialized.")
    return db_conn


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class LoginRequest(BaseModel):
    username: str
    password: str
    

class ResetPasswordRequest(BaseModel):
    registerNumber: str
    password: str


class EncryptRequest(BaseModel):
    plaintext: str


class EncryptResponse(BaseModel):
    ciphertext: str


class DecryptRequest(BaseModel):
    ciphertext: str


class DecryptResponse(BaseModel):
    plaintext: str


class PasswordEncryptRequest(BaseModel):
    password: str


class PasswordEncryptResponse(BaseModel):
    ciphertext: str


class SubmissionData(BaseModel):
    name: str
    register: str
    college: str
    department: str
    course: str
    year: str
    cgpa: float
    skills: List[str] = []
    resumeFilename: Optional[str] = None
    interests: List[str] = []


class SubmissionResponse(SubmissionData):
    id: int
    timestamp: str


def init_db():
    with get_conn().cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                student_id TEXT UNIQUE NOT NULL,
                student_class TEXT NOT NULL,
                email TEXT
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                name TEXT NOT NULL,
                register TEXT NOT NULL,
                college TEXT NOT NULL,
                department TEXT NOT NULL,
                course TEXT NOT NULL,
                year TEXT NOT NULL,
                cgpa TEXT NOT NULL,
                skills JSONB NOT NULL DEFAULT '[]',
                resume_filename TEXT,
                interests JSONB NOT NULL DEFAULT '[]'
            )
            """
        )
        hashed = pwd_context.hash("NK12345")
        cur.execute(
            """
            INSERT INTO users (username, password, name, student_id, student_class, email)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (username) DO NOTHING
            """,
            [
                "Nithis",
                hashed,
                "Nithis Kumaar",
                "727723EUIT150",
                "Grade 12",
                "nithiskumaar.m.b@gmail.com",
            ],
        )


        cur.execute("SELECT id, username, password FROM users")
        rows = cur.fetchall()
        for r in rows:
            uid, uname, pwd = r

            if not (isinstance(pwd, str) and pwd.startswith("$pbkdf2-sha256$")):
                try:
                    new_h = pwd_context.hash(pwd)
                    cur.execute("UPDATE users SET password = %s WHERE id = %s", (new_h, uid))
                except Exception:
                    continue


@app.on_event("startup")
def startup_event():
    global db_conn
    db_conn = psycopg.connect(DATABASE_URL, autocommit=True)
    init_db()


@app.post("/api/login")
def login(request: LoginRequest):
    with get_conn().cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT username, password, name FROM users WHERE username = %s",
            (request.username,),
        )
        user = cur.fetchone()

    if user is None or not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    return {"name": user["name"], "message": "Login successful!"}


@app.post("/api/reset-password")
def reset_password(request: ResetPasswordRequest):
    hashed = pwd_context.hash(request.password)
    with get_conn().cursor(row_factory=dict_row) as cur:
        cur.execute(
            "UPDATE users SET password = %s WHERE student_id = %s RETURNING id",
            (hashed, request.registerNumber),
        )
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Register number not found.")
    return {"message": "Password reset successful. Use your new password to login."}


@app.post("/api/submit-form", status_code=201)
def submit_form(submission: SubmissionData):
    resume_value = submission.resumeFilename.strip() if submission.resumeFilename and submission.resumeFilename.strip() else None
    with get_conn().cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO submissions (
                name,
                register,
                college,
                department,
                course,
                year,
                cgpa,
                skills,
                resume_filename,
                interests
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests
            """,
            [
                submission.name,
                submission.register,
                submission.college,
                submission.department,
                submission.course,
                submission.year,
                submission.cgpa,
                json.dumps(submission.skills),
                resume_value,
                json.dumps(submission.interests),
            ],
        )
        new_submission = cur.fetchone()
        if new_submission is None:
            raise HTTPException(status_code=500, detail="Unable to save submission.")

    new_submission["timestamp"] = new_submission["timestamp"].isoformat()
    return {"message": "Form submitted successfully!", "submission": new_submission}


@app.post("/api/submit-form-multipart", status_code=201)
async def submit_form_multipart(
    name: str = Form(...),
    register: str = Form(...),
    college: str = Form(...),
    department: str = Form(...),
    course: str = Form(...),
    year: str = Form(...),
    cgpa: float = Form(...),
    skills: str = Form('[]'),
    interests: str = Form('[]'),
    resume: UploadFile | None = File(None),
):
    # ensure uploads directory
    uploads_dir = FRONTEND_DIR / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    resume_filename = None
    if resume is not None:
        resume_filename = resume.filename
        dest = uploads_dir / resume_filename
        with dest.open("wb") as f:
            shutil.copyfileobj(resume.file, f)
        await resume.close()

    with get_conn().cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO submissions (
                name,
                register,
                college,
                department,
                course,
                year,
                cgpa,
                skills,
                resume_filename,
                interests
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests
            """,
            [
                name,
                register,
                college,
                department,
                course,
                year,
                cgpa,
                skills,
                resume_filename,
                interests,
            ],
        )
        new_submission = cur.fetchone()

    if new_submission is None:
        raise HTTPException(status_code=500, detail="Unable to save submission.")

    new_submission["timestamp"] = new_submission["timestamp"].isoformat()
    return {"message": "Form submitted successfully!", "submission": new_submission}


@app.get("/api/submissions", response_model=List[SubmissionResponse])
def get_submissions():
    with get_conn().cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS \"resumeFilename\", interests FROM submissions ORDER BY id DESC"
        )
        submissions = cur.fetchall()
    for item in submissions:
        item["timestamp"] = item["timestamp"].isoformat()
    return submissions


@app.get("/api/submissions/{submission_id}", response_model=SubmissionResponse)
def get_submission(submission_id: int):
    with get_conn().cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS \"resumeFilename\", interests FROM submissions WHERE id = %s",
            (submission_id,),
        )
        submission = cur.fetchone()

    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found.")
    submission["timestamp"] = submission["timestamp"].isoformat()
    return submission


@app.put("/api/submissions/{submission_id}")
def update_submission(submission_id: int, submission: SubmissionData):
    with get_conn().cursor(row_factory=dict_row) as cur:
        resume_value = submission.resumeFilename.strip() if submission.resumeFilename and submission.resumeFilename.strip() else None
        cur.execute(
            """
            UPDATE submissions
            SET name = %s,
                register = %s,
                college = %s,
                department = %s,
                course = %s,
                year = %s,
                cgpa = %s,
                skills = %s,
                resume_filename = %s,
                interests = %s,
                timestamp = NOW()
            WHERE id = %s
            RETURNING id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests
            """,
            [
                submission.name,
                submission.register,
                submission.college,
                submission.department,
                submission.course,
                submission.year,
                submission.cgpa,
                json.dumps(submission.skills),
                resume_value,
                json.dumps(submission.interests),
                submission_id,
            ],
        )
        updated = cur.fetchone()

    if updated is None:
        raise HTTPException(status_code=404, detail="Submission not found.")
    updated["timestamp"] = updated["timestamp"].isoformat()
    return {"message": "Form updated successfully!", "submission": updated}


@app.put("/api/submissions/{submission_id}/multipart")
async def update_submission_multipart(
    submission_id: int,
    name: str = Form(...),
    register: str = Form(...),
    college: str = Form(...),
    department: str = Form(...),
    course: str = Form(...),
    year: str = Form(...),
    cgpa: float = Form(...),
    skills: str = Form('[]'),
    interests: str = Form('[]'),
    resume: UploadFile | None = File(None),
):
    uploads_dir = FRONTEND_DIR / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    resume_filename = None
    if resume is not None:
        resume_filename = resume.filename
        dest = uploads_dir / resume_filename
        with dest.open("wb") as f:
            shutil.copyfileobj(resume.file, f)
        await resume.close()

    with get_conn().cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            UPDATE submissions
            SET name = %s,
                register = %s,
                college = %s,
                department = %s,
                course = %s,
                year = %s,
                cgpa = %s,
                skills = %s,
                resume_filename = %s,
                interests = %s,
                timestamp = NOW()
            WHERE id = %s
            RETURNING id, timestamp, name, register, college, department, course, year, cgpa, skills, resume_filename AS "resumeFilename", interests
            """,
            [
                name,
                register,
                college,
                department,
                course,
                year,
                cgpa,
                skills,
                resume_filename,
                interests,
                submission_id,
            ],
        )
        updated = cur.fetchone()

    if updated is None:
        raise HTTPException(status_code=404, detail="Submission not found.")
    updated["timestamp"] = updated["timestamp"].isoformat()
    return {"message": "Form updated successfully!", "submission": updated}


@app.delete("/api/submissions/{submission_id}")
def delete_submission(submission_id: int):
    with get_conn().cursor() as cur:
        cur.execute(
            "DELETE FROM submissions WHERE id = %s",
            (submission_id,),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Submission not found.")
    return {"message": "Submission deleted successfully."}


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
