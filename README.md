# GitSense

GitSense is an AI-powered developer workspace designed for understanding, analyzing, and collaborating on GitHub repositories. Combining high-performance backend pipelines with a premium, high-fidelity dark UI, GitSense empowers developers to deep-dive into any codebase, chat with codebase context, extract commit intelligence, and generate documentation on the fly.

---

## Features & Capabilities

GitSense offers a comprehensive developer cockpit equipped with four key AI-powered workflows and highly polished aesthetics:

### 1. High-Performance Repository Sync
* **Concurrent Ingestion**: Speeds up repository indexing by using `asyncio.gather` on the backend to parallelize GitHub API calls (repository files, contributors, commits, and language stats) concurrently.
* **Smart Sync Engine**: Persists repository data and integrates a Redis-backed caching layer for optimized GitHub/API read efficiency.

### 2. Interactive Codebase Workspace
* **Overview & Tech Stack**: Renders visual technology badges mapping languages to clean, semantic pill tags, alongside interactive directory structures.
* **Interactive Contributor Visualizers**: Displays contributor avatars, profiles, and precise commit tallies in an attractive hoverable card layout.
* **Structured AI Summaries**: Generates high-granularity, AI-driven architectural maps (visualizing **Entry Points**, **Data Flows**, **Components**, and **User Flows** as interactive cards) paired with a simplified *"Beginner Explanation"* and *Probable Purpose* walkthroughs.

### 3. Context-Aware Codebase Chat
* **Repository-Grounded Conversations**: Ask complex questions about the workspace codebase and receive immediate answers grounded in the repository files.
* **Interactive Shortcuts**: Includes quick-prompt trigger chips (e.g., *"How is authentication handled?"*, *"Where are API routes defined?"*) for smooth, instantaneous onboarding.
* **Fluent UI Experience**: Features interactive typing bubbles, sleek transitions, and auto-scroll behaviors.

### 4. Commit Intelligence
* **Weekly Progress Reports**: Translates chronological commit streams into a cohesive weekly progress summary.
* **Commit-by-Commit Analyses**: AI analyzes individual commits to identify changes, code quality, and security risks.
* **Actionable Contributor Insights**: Summarizes individual contributor impact, architectural drifts, and focus areas.

### 5. On-Demand README Generator
* **Automatic Drafts**: Creates professional markdown documentation matching the indexed stack, files, and architectural flows of the repository.
* **Instant Clipboard Actions**: Copies generated documents with a single-click button.

---

## Design System & Aesthetics

GitSense is built around a **premium, dark-mode-first visual language** featuring:
* **Glassmorphic Interfaces**: Clean components using advanced background blur filters (`glass-strong` and custom border-border/50 styling) and dynamic light transmission.
* **Micro-Animations**: Custom CSS animation triggers (`animate-float`, `animate-slide-up`, `animate-glow-pulse`, `animate-fade-in`) that make interactive components feel responsive.
* **Interactive Terminal Mockups**: A fully animated CLI terminal simulation on the landing page showing real-time repository analysis logs.
* **Modern Typography**: High-aesthetic typography with dynamic linear gradient text (`text-gradient`) and custom visual metrics widgets.

---

## Technology Stack

### Frontend (Next.js Workspace)
* **Core**: Next.js `15.1.3` (App Router), React `19`, and TypeScript.
* **Styling**: Tailwind CSS `3.4.17` with customized glow utilities and animation configurations.
* **Icons**: `lucide-react` for a clean, consistent iconography.
* **Custom UI Component Library**: A tailored collection of lightweight Radix-inspired components:
  * `avatar.tsx` & `badge.tsx` (semantic language and badge variants)
  * `button.tsx` (includes custom `glow` and `loading` states)
  * `card.tsx` (glassmorphic `GlassCard` and hover-effect containers)
  * `toast.tsx` (complete `ToastProvider` with semantic notifications)
  * `tabs.tsx`, `progress.tsx`, `spinner.tsx`, `input.tsx`, and `textarea.tsx`

### Backend (FastAPI Services)
* **Core Framework**: FastAPI, Uvicorn, and Python 3.10+.
* **Database & Persistence**: SQLAlchemy (async/asyncpg) running against PostgreSQL.
* **Caching & Limits**: Redis-backed cache layer for fast API reads and optional rate-limiting support.
* **Authentication**: GitHub OAuth flow with signed and secure server cookies.

### Resilience & AI Providers
* **AI Provider Abstraction**: A modular backend gateway supporting **OpenRouter**, **OpenAI**, and **Google Gemini** endpoints.
* **Standardized Exception Mapping**: Normalizes API provider errors (invalid keys, rate limits, timeouts, outages) into structured user-friendly responses.
* **Fault-Tolerant Retries**: Implements exponential backoffs using an configurable retry mechanism (`AI_MAX_RETRIES` with `AI_RETRY_BASE_DELAY_SECONDS`).
* **Robust Client Wrapper**: Client API fetches feature unified `ApiError` routing, a 45-second network request abort timer, and loading states.

---

## Architecture Blueprint

```text
gitsense/
├── apps/
│   ├── api/                      # FastAPI Backend Application
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── routes/       # HTTP route endpoints (Auth, Repositories, Chat, Docs)
│   │   │   ├── core/             # Configuration, security & dependency management
│   │   │   ├── db/               # Async DB connection & session configurations
│   │   │   ├── models/           # SQLAlchemy database tables & model structures
│   │   │   ├── schemas/          # Pydantic schema validation & contracts
│   │   │   ├── services/         # Key logic layers
│   │   │   │   ├── ai/           # Modular AI provider files (base, factory, gemini, openrouter)
│   │   │   │   ├── cache.py      # Redis caching hooks
│   │   │   │   ├── github.py     # GitHub Client interaction wrapper
│   │   │   │   └── repositories.py # Repo ingestion & analysis pipelines
│   │   │   ├── utils/            # Shared utility functions
│   │   │   └── main.py           # Application entrypoint
│   ├── web/                      # Next.js Frontend Application
│   │   ├── app/
│   │   │   ├── auth/callback/    # OAuth callback handling
│   │   │   ├── dashboard/        # Repositories & metrics dashboard
│   │   │   ├── repositories/     # Repository workspace pages & layout
│   │   │   ├── globals.css       # Core design tokens, animations, and Tailwind classes
│   │   │   ├── layout.tsx        # High-level layout
│   │   │   └── page.tsx          # Landing page with terminal simulation
│   │   ├── components/
│   │   │   ├── ui/               # Core design system components (Toast, Card, Badge, etc.)
│   │   │   ├── app-shell.tsx     # Workspace layout with premium side navigation
│   │   │   └── skeleton.tsx      # High-aesthetic loading grids
│   │   ├── lib/
│   │   │   └── api.ts            # Typed client API requests and exception handler
│   │   └── Dockerfile
└── infra/
    └── schema.sql                # Database schema reference SQL
```

---

## Database Schema Reference

The PostgreSQL database maintains a normalized relational structure mapping repository statistics and intelligence:

* **`users`**: Encrypted access tokens, user metadata (email, avatar_url, github_id, username), and timestamps.
* **`repositories`**: Reference table mapping stars, language, default branches, and ownership details.
* **`ai_summaries`**: Stores generated structural summaries (Overview, Architecture JSON maps, Stack details, Probable Purpose, and Beginner explanations).
* **`chats` & `chat_messages`**: Maintains conversational context for codebase chat tabs (mapping roles and content).
* **`commits`**: Caches recent commit history, metadata, and generated individual AI commit summaries.
* **`generated_docs`**: Tracks generated documentation artifacts and guides.

---

## Quick Start

### 1. Copy Environment Variables
Duplicate the sample configuration file at the workspace root:
```bash
cp .env.example .env
```

### 2. Configure Credentials
Open `.env` and fill in your GitHub OAuth and chosen AI provider values:
* **GitHub Application**: Create an OAuth Application on GitHub set with the authorization callback pointing to `http://localhost:8000/api/auth/callback`. Generate a Client ID and Client Secret.
* **OpenRouter / OpenAI**:
  * Set `AI_PROVIDER=openai`.
  * Set `OPENAI_API_KEY`.
  * Keep `OPENAI_BASE_URL=https://openrouter.ai/api/v1`.
* **Google Gemini**:
  * Set `AI_PROVIDER=gemini`.
  * Set `GEMINI_API_KEY`.
  * Set `GEMINI_BASE_URL` and `GEMINI_MODEL`.

### 3. Spin Up Docker Compose
Run the orchestrator to build and boot the PostgreSQL, Redis, backend, and frontend containers:
```bash
docker compose up --build
```

### 4. Access the Ports
Once successfully built and loaded, navigate to:
* **Web Portal (Next.js)**: [http://localhost:3000](http://localhost:3000)
* **Backend API Docs (FastAPI Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Local Development Setup

If you prefer to run the services bare-metal instead of inside Docker containers, follow these steps:

### Backend Setup (FastAPI)
1. Ensure you have a running PostgreSQL and Redis server instance, and update `.env` connection paths if needed.
2. Navigate to the backend directory:
   ```bash
   cd apps/api
   ```
3. Initialize and activate a python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
4. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Spin up the Reloading Dev Server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup (Next.js)
1. Navigate to the frontend directory:
   ```bash
   cd apps/web
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Spin up the next development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your web browser.
