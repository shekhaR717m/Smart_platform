# Smart Telehealth Backend

FastAPI service used by the AWS demo platform.

## Local Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Endpoints:

- `GET /health`
- `GET /api/providers`
- `GET /api/appointments`
- `POST /api/appointments`
- `POST /api/triage`
- `GET /docs`
