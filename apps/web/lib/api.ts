export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(body || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isServerError() {
    return this.status >= 500;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ApiError(response.status, body);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "Request timed out");
    }
    throw new ApiError(0, error instanceof Error ? error.message : "Network error");
  } finally {
    clearTimeout(timeout);
  }
}

export type User = {
  id: string;
  username: string;
  name?: string;
  email?: string;
  avatar_url?: string;
};

export type Repository = {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  stars: number;
  default_branch?: string;
  html_url?: string;
  last_updated_at?: string;
};

export type Workspace = {
  repository: Repository;
  files: Array<{ name: string; path: string; type: string; size?: number }>;
  contributors: Array<{ login: string; avatar_url?: string; html_url?: string; contributions: number }>;
  commits: Array<{
    sha: string;
    message: string;
    author_name?: string;
    author_avatar_url?: string;
    html_url?: string;
    committed_at?: string;
    ai_summary?: string;
  }>;
  technologies: string[];
};

export const api = {
  me: () => request<User>("/api/auth/me"),
  authUrl: () => request<{ url: string }>("/api/auth/github"),
  logout: () => request<{ status: string }>("/api/auth/logout", { method: "POST" }),
  repositories: () => request<Repository[]>("/api/repositories"),
  syncRepositories: () => request<Repository[]>("/api/repositories/sync", { method: "POST" }),
  workspace: (owner: string, repo: string) => request<Workspace>(`/api/repositories/${owner}/${repo}`),
  summary: (owner: string, repo: string) =>
    request<{
      overview: string;
      architecture: string;
      detected_stack: string[];
      probable_purpose: string;
      beginner_explanation: string;
    }>(`/api/repositories/${owner}/${repo}/summary`, { method: "POST" }),
  chat: (owner: string, repo: string, message: string, selected_files: string[] = []) =>
    request<{ chat_id: string; answer: string }>(`/api/repositories/${owner}/${repo}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, selected_files })
    }),
  commitIntel: (owner: string, repo: string) =>
    request<{ commit_summaries: string[]; contributor_insights: string[]; weekly_progress_summary: string }>(
      `/api/repositories/${owner}/${repo}/commits/intelligence`,
      { method: "POST" }
    ),
  readme: (owner: string, repo: string) =>
    request<{ id?: string; markdown: string }>(`/api/repositories/${owner}/${repo}/readme`, { method: "POST" })
};
