from pydantic import BaseModel, Field


class AISummaryRead(BaseModel):
    id: str | None = None
    overview: str
    architecture: str
    detected_stack: list[str]
    probable_purpose: str
    beginner_explanation: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    selected_files: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    chat_id: str
    answer: str


class CommitIntelligence(BaseModel):
    commit_summaries: list[str]
    contributor_insights: list[str]
    weekly_progress_summary: str


class GeneratedReadme(BaseModel):
    id: str | None = None
    markdown: str
