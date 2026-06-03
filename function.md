# GitSense Key Functions Reference Guide

This document catalogs the principal functions of the GitSense project across both backend and frontend layers. Each section outlines the function's signature, file location, core responsibility, importance, and a blueprint for scaling and future optimization.

---

## 1. Repository & Workspace Synchronization

### `RepositoryService.sync(user: User) -> list[Repository]`
* **File Location**: [repositories.py](file:///d:/gitsense/apps/api/app/services/repositories.py#L106-L122)
* **Description**: Initiates a sync of all repositories for a user. It decrypts the user's encrypted GitHub access token, fetches the repository list via the GitHub API, checks for existing database entries, inserts/updates repository fields (description, stars, default branch, language, URLs), and commits the transaction.
* **Why It Matters**: It is the onboarding gateway function that constructs the user's available catalog of projects.
* **Scaling & Improvement Blueprint**:
  * **Background Processing**: Currently runs synchronously within the request thread. For large portfolios, this blocks response loops. Offload repository synchronization to a background worker queue (e.g., Celery or FastAPI background tasks).
  * **Webhook Subscriptions**: To keep stats accurate without manual triggers, configure GitHub webhooks to automatically trigger sync events on push or repository metadata updates.

### `RepositoryService.workspace(user: User, owner: str, repo_name: str) -> dict`
* **File Location**: [repositories.py](file:///d:/gitsense/apps/api/app/services/repositories.py#L140-L154)
* **Description**: Aggregates the primary repository context needed for the developer cockpit UI. It triggers concurrent API fetches for the directory file structure, recent commits, contributors, and programming language statistics, and persists commit details in the backend database.
* **Why It Matters**: This function feeds the entire client UI tabs (Overview, Commits, and Stack summaries).
* **Scaling & Improvement Blueprint**:
  * **Caching Layer**: Since git logs and directory structures change only on commits, cache this aggregated workspace payload in Redis using a key composed of `{owner}:{repo_name}:{last_commit_sha}`.
  * **Database Sync Separation**: Decouple `_persist_commits` from the workspace fetch path, pushing it to an async queue so user response times are independent of commit write times.

### `RepositoryService._persist_commits(repository_id: UUID, commits: list[dict]) -> None`
* **File Location**: [repositories.py](file:///d:/gitsense/apps/api/app/services/repositories.py#L229-L237)
* **Description**: Loops over the list of fetched GitHub commits, checks if the commit SHA is already in the database for the given repository, and inserts it if missing.
* **Why It Matters**: Ensures the database contains a synchronized, historical record of commits for local AI queries.
* **Scaling & Improvement Blueprint**:
  * **Bulk / Batch Inserts**: The current implementation loops and queries the database for each individual commit. Scale this by querying matching SHAs in a single batch (e.g., `WHERE sha IN (...)`) and performing bulk inserts (`INSERT INTO ... ON CONFLICT DO NOTHING`) to drastically reduce DB connection roundtrips.

---

## 2. GitHub Service Integration

### `GitHubService.read_file(token: str, owner: str, repo: str, path: str) -> str`
* **File Location**: [github.py](file:///d:/gitsense/apps/api/app/services/github.py#L63-L71)
* **Description**: Downloads the raw text content of a specific codebase file from GitHub. The returned body is truncated to the first 20,000 characters to protect LLM context windows.
* **Why It Matters**: Essential for the repository chat feature, enabling the user to attach specific files to their prompts for code review.
* **Scaling & Improvement Blueprint**:
  * **Redis / Cache Storage**: Store fetched files inside Redis or a temporary SQL Cache table with a TTL. Users chatting about a file tend to ask follow-up questions; caching prevents hitting GitHub API limits and speeds up LLM processing.

### `GitHubService._get(token: str, path: str) -> dict | list`
* **File Location**: [github.py](file:///d:/gitsense/apps/api/app/services/github.py#L73-L85)
* **Description**: Central HTTP GET wrapper utilizing `httpx.AsyncClient` with a 30-second timeout to fetch endpoints from the GitHub REST API.
* **Why It Matters**: Serves as the primary driver for all outbound GitHub requests.
* **Scaling & Improvement Blueprint**:
  * **Rate Limiting & Retries**: Add token bucket rate-limiting guards and exponential backoff retry mechanisms to handle secondary rate limit responses (`403 Forbidden` / `429 Too Many Requests`) from GitHub.

---

## 3. Modular AI Gateway

### `OpenAICompatibleProvider._create_completion(**kwargs: Any) -> Any`
* **File Location**: [openai_compatible.py](file:///d:/gitsense/apps/api/app/services/ai/openai_compatible.py#L56-L64)
* **Description**: Sends instructions to the LLM model using the `openai` client. Implements a retry loop with exponential backoff if temporary errors are caught (e.g., rate limits, connections, timeouts).
* **Why It Matters**: Prevents transient network errors or rate spikes from failing the user's request.
* **Scaling & Improvement Blueprint**:
  * **Circuit Breakers**: Implement a circuit breaker pattern to prevent spamming downstream AI models (Gemini, OpenRouter, OpenAI) if they are consistently timing out or returning `503 Service Unavailable`.

### `RepositoryService.summarize(user: User, owner: str, repo_name: str) -> AISummary`
* **File Location**: [repositories.py](file:///d:/gitsense/apps/api/app/services/repositories.py#L175-L186)
* **Description**: Gathers repository metadata, formats the LLM context, invokes the AI summary generator, validates/normalizes the generated structure (overview, architecture, stack, purpose, beginner_explanation), and writes it to the database.
* **Why It Matters**: Drives the primary AI summary screen in the Overview workspace tab.
* **Scaling & Improvement Blueprint**:
  * **Asynchronous Execution & SSE**: Rather than making the browser wait for a synchronous HTTP request that takes several seconds, queue the summary job and stream progress or update via WebSockets/SSE when finalized.

### `RepositoryService.chat(user: User, owner: str, repo_name: str, message: str, selected_files: list[str]) -> tuple[Chat, str]`
* **File Location**: [repositories.py](file:///d:/gitsense/apps/api/app/services/repositories.py#L188-L200)
* **Description**: Orchestrates the repository chat system. Constructs the conversation log, fetches file attachments, feeds them to the LLM provider, and persists user/assistant responses.
* **Why It Matters**: The conversational engine of the GitSense Cockpit.
* **Scaling & Improvement Blueprint**:
  * **Session Context Management**: Currently, the chat context passes raw workspace dumps on every message. Scale this by keeping a rolling summary of chat context or capping token lengths to prevent expensive API charges.
  * **Response Streaming**: Implement response streaming (`stream_chat` integration) directly to the web client using FastAPI `StreamingResponse`, yielding chunks in real-time to lower time-to-first-token latency.

### `RepositoryService.commits_intelligence(user: User, owner: str, repo_name: str) -> dict`
* **File Location**: [repositories.py](file:///d:/gitsense/apps/api/app/services/repositories.py#L202-L206)
* **Description**: Requests commit synthesis intelligence (commit summaries, contributor activity analysis, and weekly progress updates).
* **Why It Matters**: Helps project managers and developers understand velocity and development patterns.
* **Scaling & Improvement Blueprint**:
  * **Periodic Synthesis**: Since weekly progress changes slowly, run this analysis once a day or on a CRON schedule (offload during low traffic periods) and store the JSON output in the database, instead of executing LLM calls dynamically on click.

---

## 4. Security & Authentication

### `security.encrypt_token(token: str, settings: Settings) -> str`
* **File Location**: [security.py](file:///d:/gitsense/apps/api/app/core/security.py#L45-L50)
* **Description**: Performs symmetric encryption on GitHub OAuth tokens using `cryptography.fernet`. A unique per-token envelope key is generated, combined with the cipher, and persisted.
* **Why It Matters**: Critical for security compliance. If the database is compromised, OAuth tokens remain protected.
* **Scaling & Improvement Blueprint**:
  * **KMS/Vault Integration**: Upgrade from local, file-configured/in-memory keys to a dedicated Key Management Service (AWS KMS, Azure Key Vault, or HashiCorp Vault) for envelope decryption/encryption.

---

## 5. Web Frontend API Client

### `api` export object
* **File Location**: [api.ts](file:///d:/gitsense/apps/web/lib/api.ts#L96-L123)
* **Description**: Contains typed wrappers mapping to each FastAPI backend endpoint (e.g. `api.me()`, `api.workspace()`, `api.chat()`, `api.summary()`, etc.) with built-in client-side request timeout cancellation at 45 seconds.
* **Why It Matters**: Streamlines Next.js interface components by acting as the unified communications layer.
* **Scaling & Improvement Blueprint**:
  * **State Management integration**: Pair this api object with `React Query` (`@tanstack/react-query`) or `SWR`. This will instantly enable automatic background refetching, client-side pagination caching, and request deduplication across multiple dashboard components.
