# Smart Telehealth Backend

Node.js + Express API for the AWS telehealth demo platform. The service listens on `PORT`, defaults to `8000`, and returns `200` from `/health` for the Application Load Balancer target group.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Service metadata |
| `GET` | `/health` | ALB/container health check |
| `GET` | `/api/providers` | Mock provider directory |
| `GET` | `/api/appointments` | In-memory appointment list |
| `POST` | `/api/appointments` | Create an appointment |
| `POST` | `/api/triage` | Evaluate symptoms and return urgency |

## Local Development

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:8000`.

## Quick Checks

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/providers

curl -X POST http://localhost:8000/api/appointments \
  -H "Content-Type: application/json" \
  -d "{\"patient_name\":\"Mayank Shekhar\",\"reason\":\"Video consult for fever\",\"preferred_date\":\"2026-08-18\",\"department\":\"General Care\"}"

curl -X POST http://localhost:8000/api/triage \
  -H "Content-Type: application/json" \
  -d "{\"symptoms\":[\"fever\",\"cough\"],\"temperature_c\":38.3,\"oxygen_level\":96}"
```

## Docker

```bash
docker build -t smart-telehealth-backend .
docker run --rm -p 8000:8000 smart-telehealth-backend
curl http://localhost:8000/health
```

## GitHub Actions / AWS Deployment

The existing `.github/workflows/backend.yaml` builds this directory and pushes the image to ECR:

```bash
cd backend
docker build -t "$ECR_REPOSITORY:$GITHUB_SHA" .
docker push "$ECR_REPOSITORY:$GITHUB_SHA"
```

The container exposes port `8000` and honors the `PORT` environment variable, so it remains compatible with the Terraform ALB health check and SSM Run Command deployment flow.
