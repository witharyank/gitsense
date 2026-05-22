# GitSense

GitSense is an AI-powered developer workspace MVP for understanding, analyzing, and collaborating on GitHub repositories.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn-style components
- Backend: FastAPI, SQLAlchemy async, PostgreSQL, Redis
- Auth: GitHub OAuth with signed server sessions
- AI: OpenRouter by default through the OpenAI-compatible API, with provider abstraction for OpenAI, Groq, TogetherAI, local vLLM, and similar providers
- Deployment: Docker Compose

## Quick Start

1. Copy environment values:

```bash
cp .env.example .env
```

2. Add GitHub OAuth credentials and OpenRouter credentials to `.env`.

OpenRouter setup:

- Create an OpenRouter API key.
- Set `OPENAI_API_KEY`.
- Keep `OPENAI_BASE_URL=https://openrouter.ai/api/v1`.
- Keep `OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free` unless you want another OpenRouter model.
- Keep `AI_PROVIDER=openai`.
- `OPENAI_HTTP_REFERER` and `OPENAI_TITLE` are sent as optional OpenRouter attribution headers.
- `AI_MAX_RETRIES=2` enables exponential backoff for temporary provider failures.
- Local development defaults to `ENABLE_RATE_LIMITING=false`; set `ENABLE_RATE_LIMITING=true` when you want API rate-limit responses enabled again.

Any OpenAI-compatible provider can be used by setting `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_MODEL`. Gemini remains available by setting `AI_PROVIDER=gemini` with the Gemini-specific environment values.

3. Start the platform:

```bash
docker compose up --build
```

4. Open:

- Web: http://localhost:3000
- API docs: http://localhost:8000/docs

## Local Development->

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
  openai_compatible.py Shared OpenAI-compatible client, retries, and provider errors
  openai_service.py    OpenRouter/OpenAI-compatible provider selected by AI_PROVIDER=openai
  gemini_service.py    Optional Gemini provider using the OpenAI-compatible endpoint
  factory.py           Selects provider from AI_PROVIDER
```

OpenRouter is called with the OpenAI Python SDK against its OpenAI-compatible endpoint. Provider errors are normalized for invalid keys, rate limits, timeouts, connection failures, provider outages, and malformed model responses. Docker logs include structured provider details for AI failures while API responses remain user-friendly.
