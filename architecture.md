# GitSense Architecture & Implementation Guide

GitSense is a premium, AI-powered developer cockpit designed for deep codebase comprehension, commit intelligence, interactive context-aware chats, and on-demand documentation generation. This document provides a highly detailed, professional overview of the system architecture, component boundaries, database schemas, and principal data flows.

---

## 1. High-Level System Architecture

GitSense is built on a clean **Client-Server split** with a Next.js frontend and a FastAPI backend. It utilizes PostgreSQL for persistent relational storage, Redis for fast cache operations, GitHub OAuth for identity and repository permissions, and a modular AI interface to interact with language models (LLMs).

```mermaid
graph TB
    subgraph Client Layer [Frontend - Next.js Workspace]
        UI([User Interface]) -->|User Actions| Pages[Pages & Components]
        Pages -->|Typed Request Layer| APIClient[Client API Wrapper lib/api.ts]
    end

    subgraph Server Layer [Backend - FastAPI Services]
        APIClient -->|HTTP Requests with secure cookie| Server[FastAPI Router main.py]
        Server -->|Middleware & Deps| Auth[Auth / Session Middleware]
        Server -->|Dependency Injection| RepoRouter[Repository Routes]
        
        subgraph Core Services [Business Logic]
            RepoRouter -->|Coordinates| RepoService[RepositoryService]
            RepoService -->|Concurrent API Calls| GHService[GitHubService]
            RepoService -->|Prompt Engineering & Models| AIService[AI Provider Gateway]
        end

        subgraph Persistent & Cache Storage
            RepoService -->|Async Transactions| DB[(PostgreSQL DB)]
            RepoService -->|State & Caching| Redis[(Redis Cache)]
        end
    end

    subgraph External Services
        GHService -->|REST/OAuth| GitHub[GitHub API]
        AIService -->|Provider Factory| OpenRouter[OpenRouter / OpenAI]
        AIService -->|Provider Factory| Gemini[Google Gemini]
    end

    classDef client fill:#1e1e38,stroke:#7c3aed,stroke-width:2px,color:#fff;
    classDef server fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef storage fill:#111827,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef external fill:#1c1917,stroke:#6b7280,stroke-width:2px,color:#fff;
    
    class UI,Pages,APIClient client;
    class Server,Auth,RepoRouter,RepoService,GHService,AIService server;
    class DB,Redis storage;
    class GitHub,OpenRouter,Gemini external;
```

---

## 2. Component Design & Directory Mapping

The codebase is organized as a monorepo featuring distinct application directories:

```text
gitsense/
├── apps/
│   ├── api/                      # FastAPI Backend
│   │   ├── alembic/              # Database migration environments
│   │   └── app/
│   │       ├── api/
│   │       │   └── routes/       # Auth, Health, Repositories routers
│   │       ├── core/             # Configurations, settings, dependency logic
│   │       ├── db/               # SQLAlchemy Session and engine configuration
│   │       ├── models/           # SQLAlchemy DB models mapping to schema.sql
│   │       ├── schemas/          # Pydantic input/output validation models
│   │       ├── services/         # Core operational services (AI, GitHub, Repository)
│   │       └── main.py           # Application lifespan and CORS setup
│   └── web/                      # Next.js Frontend
│       ├── app/                  # App Router: auth, dashboard, repositories pages
│       ├── components/           # Core Layouts and custom Radix-style UI Components
│       └── lib/
│           └── api.ts            # Highly typed client library and API abstractions
└── infra/
    └── schema.sql                # Relational SQL blueprint of the system
```

---

## 3. Database Schema Blueprint

GitSense stores relational metadata, cached repository commits, files structure, user preferences, and AI summaries in a structured **PostgreSQL database**. 

```mermaid
erDiagram
    users ||--o{ repositories : owns
    users ||--o{ chats : initiates
    repositories ||--o{ chats : contains
    repositories ||--o{ ai_summaries : summarizes
    repositories ||--o{ commits : records
    repositories ||--o{ generated_docs : yields
    chats ||--|{ chat_messages : maintains

    users {
        UUID id PK
        BIGINT github_id UK
        VARCHAR username UK
        VARCHAR name
        VARCHAR email
        TEXT avatar_url
        TEXT access_token_encrypted
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    repositories {
        UUID id PK
        UUID user_id FK
        BIGINT github_id
        VARCHAR owner
        VARCHAR name
        VARCHAR full_name
        TEXT description
        VARCHAR language
        INT stars
        VARCHAR default_branch
        TEXT html_url
        TIMESTAMPTZ last_updated_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ai_summaries {
        UUID id PK
        UUID repository_id FK
        TEXT overview
        TEXT architecture
        JSONB detected_stack
        TEXT probable_purpose
        TEXT beginner_explanation
        TIMESTAMPTZ created_at
    }

    chats {
        UUID id PK
        UUID repository_id FK
        UUID user_id FK
        VARCHAR title
        TIMESTAMPTZ created_at
    }

    chat_messages {
        UUID id PK
        UUID chat_id FK
        VARCHAR role
        TEXT content
        TIMESTAMPTZ created_at
    }

    commits {
        UUID id PK
        UUID repository_id FK
        VARCHAR sha UK
        VARCHAR author_name
        TEXT author_avatar_url
        TEXT message
        TEXT html_url
        TIMESTAMPTZ committed_at
        TEXT ai_summary
        TIMESTAMPTZ created_at
    }

    generated_docs {
        UUID id PK
        UUID repository_id FK
        VARCHAR kind
        VARCHAR title
        TEXT content_markdown
        TIMESTAMPTZ created_at
    }
```

> [!NOTE]
> Database models are defined using **SQLAlchemy Async declarative mappings** inside `apps/api/app/models/`. Cryptographic functions (`cryptography.fernet`) securely encrypt user access tokens before persistence, guaranteeing secret isolation.

---

## 4. Fundamental System Flows

### A. Authentication and Callback Flow

GitSense uses **GitHub OAuth** for user authentication and repository access integration.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Next.js (web)
    participant Backend as FastAPI (api)
    participant GitHub as GitHub OAuth

    User->>Frontend: Clicks "Sign in with GitHub"
    Frontend->>Backend: Request /api/auth/github
    Backend-->>Frontend: Returns OAuth Redirect URL with secure state
    Frontend->>GitHub: Redirects to login
    GitHub-->>User: Prompts for permission scope (repo, read:user, user:email)
    User->>GitHub: Approves access
    GitHub-->>Frontend: Callback with code & state parameter
    Frontend->>Backend: Calls Auth Callback route with code
    Backend->>GitHub: Exchanges authorization code for access token
    GitHub-->>Backend: Returns access token
    Backend->>Backend: Encrypts token & persists / updates User in PostgreSQL
    Backend-->>Frontend: Responds with success, setting signed 'gitsense_session' Cookie
    Frontend->>Frontend: Redirects to /dashboard
```

### B. High-Performance Repository Sync Flow

GitSense implements concurrent data pipeline ingestion to speed up synchronization times.

```mermaid
sequenceDiagram
    autonumber
    participant Frontend as Next.js Client
    participant Service as RepositoryService
    participant GitHub as GitHub API Client
    participant DB as PostgreSQL Database

    Frontend->>Service: GET /api/repositories/{owner}/{repo} (Workspace Request)
    Service->>GitHub: Trigger Concurrent Aggregation (asyncio.gather)
    par Contents API
        GitHub-->>Service: Returns raw file tree
    and Contributors API
        GitHub-->>Service: Returns contributors profiles
    and Commits API
        GitHub-->>Service: Returns recent commit history
    and Languages API
        GitHub-->>Service: Returns language metrics
    end
    Service->>DB: Persists and syncs commits securely
    Service-->>Frontend: Aggregated Workspace Payload (Files, Contributors, Commits, Technologies)
```

---

## 5. Modular AI Provider Gateway

The backend abstraction layer enables switching LLM engines seamlessly while providing reliable error management.

### Architecture Structure

* **`AIProvider` (Base Interface)**: Defines the standard operations required by GitSense:
  * `repository_summary(context)`
  * `chat(context, question)`
  * `commit_intelligence(context)`
  * `readme(context)`
* **`GeminiService`**: Custom service integration translating calls directly into native Gemini formats using Google Gemini credentials.
* **`OpenAIService`**: Universal adapter accommodating both official **OpenAI** engines and aggregate portals like **OpenRouter**.
* **`DisabledAIService`**: A robust fallback system ensuring features fail gracefully into structured placeholder states if no active API credentials are provided.

### Prompt Context Construction

When a workflow runs, GitSense gathers high-fidelity repository context:
1. **Directory Tree**: Up to 80 structured file path nodes.
2. **Top Contributors**: Up to 20 contributor profiles and metrics.
3. **Commit Stream**: Top 20 chronological commits.
4. **Targeted Code Context**: Up to 5 user-selected files with full code body strings.

---

## 6. Premium Dark-Mode User Interface

The Next.js client layout features a premium dashboard styled around modern dark mode design:

1. **Workspace Tabs Layout**:
   * **Overview**: Interactive files navigation list grouped with contributors avatars and live language pills.
   * **Codebase Chat**: Interactive dialogue bubble utilizing sliding micro-animations and quick onboarding chip prompts.
   * **Commits**: In-depth commit analysis engine containing summaries of recent codebase events.
   * **Docs**: Interactive README.md compiler providing one-click copy features.
2. **Glassmorphism Styling**: Uses custom background filters (`glass-strong`) and dynamic borders alongside visual micro-animations (`animate-float`, `animate-glow-pulse`, `animate-slide-up`).
