# GitSense

GitSense is an AI-powered developer workspace MVP for understanding, analyzing, and collaborating on GitHub repositories.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn-style components
- Backend: FastAPI, SQLAlchemy async, PostgreSQL, Redis
- Auth: GitHub OAuth with signed server sessions
- AI: Google Gemini by default through the OpenAI-compatible API, with provider abstraction for future OpenAI support
- Deployment: Docker Compose

## Quick Start

1. Copy environment values:

```bash
cp .env.example .env
```

2. Add GitHub OAuth credentials and Gemini credentials to `.env`.

Gemini setup:

- Create a Gemini API key in Google AI Studio.
- Set `GEMINI_API_KEY`.
- Keep `GEMINI_MODEL=gemini-2.0-flash` unless you want to use another compatible Gemini model.
- Keep `GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/` for the OpenAI-compatible Gemini endpoint.
- Keep `AI_PROVIDER=gemini`.
- Local development defaults to `ENABLE_RATE_LIMITING=false`; set `ENABLE_RATE_LIMITING=true` when you want API rate-limit responses enabled again.

OpenAI remains supported for future use by setting `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.

3. Start the platform:

```bash
docker compose up --build
```

4. Open:

- Web: http://localhost:3000
- API docs: http://localhost:8000/docs

## Local Development

Backend:

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd apps/web
npm install
npm run dev
```

## Architecture

```text
apps/
  api/
    app/
      api/routes/      HTTP route modules
      core/            settings, security, dependencies
      db/              async database session and metadata
      models/          SQLAlchemy persistence models
      schemas/         Pydantic API contracts
      services/        GitHub, modular AI providers, repository, chat, docs logic
      utils/           small reusable helpers
  web/
    app/               Next.js app router pages
    components/        reusable UI and product components
    lib/               API client and utilities
infra/
  schema.sql           database schema reference
```

## MVP Capabilities

- GitHub OAuth login/logout with signed session cookies
- User profile persistence
- Repository sync from GitHub
- Dashboard with repositories, recent activity, and AI insight cards
- Repository workspace with files, contributors, commits, technologies, AI summary, chat, commit intelligence, and README generation
- PostgreSQL schema for users, repositories, chats, summaries, commits, and generated docs
- Redis-backed cache hooks for expensive GitHub/API reads

## AI Provider Architecture

```text
apps/api/app/services/ai/
  base.py              Provider interface, fallbacks, shared errors
  gemini_service.py    Gemini provider using the OpenAI-compatible endpoint
  openai_service.py    Backward-compatible OpenAI provider
  factory.py           Selects provider from AI_PROVIDER
```

Gemini is called with the OpenAI Python SDK against Google’s OpenAI-compatible endpoint. Provider errors are normalized for invalid keys, rate limits, timeouts, connection failures, and malformed model responses.
