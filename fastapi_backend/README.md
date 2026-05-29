# FastAPI Backend

This folder contains a FastAPI backend for the Dashboard frontend.

## Install

Use the configured Python environment and install dependencies:

```bash
python -m pip install -r requirements.txt
```

## PostgreSQL Configuration

The backend reads the following environment variables:

- `DATABASE_URL` (highest priority)
- `PGHOST` (default: `localhost`)
- `PGPORT` (default: `5432`)
- `PGDATABASE` (default: `dashboard`)
- `PGUSER` (default: `postgres`)
- `PGPASSWORD` (default: `4341`)

If no `DATABASE_URL` is provided, the app builds the connection string from the `PG*` variables.

## Run

There are two easy options to start the backend:

1. Using the provided PowerShell script:

```powershell
./start_fastapi.ps1
```

2. Directly with Uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open:

- `http://localhost:8000/form.html`
- or `http://localhost:8000/index.html`

> This FastAPI backend can be used as a replacement for the existing Node.js backend in `Dashboard/backend`.

## API Endpoints

- `POST /api/login`
- `POST /api/reset-password`
- `POST /api/submit-form`
- `GET /api/submissions`
- `GET /api/submissions/{id}`
- `PUT /api/submissions/{id}`
- `DELETE /api/submissions/{id}`
