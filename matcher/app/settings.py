from pydantic import BaseModel
from pydantic_settings import BaseSettings


class LlmRetryPolicy(BaseModel):
    max_attempts: int = 3
    initial_delay_seconds: float = 0.5
    max_delay_seconds: float = 5.0
    exponential_base: float = 2.0
    jitter_factor: float = 0.1


class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_site_url: str = "http://localhost"
    openrouter_app_name: str = "Dream-Link Matcher"
    primary_model: str = "qwen/qwen3.5-flash-02-23"
    openrouter_timeout_seconds: float = 60.0
    process_dream_retry_count: int = 6
    process_dream_retry_delay_seconds: float = 0.35
    database_url: str
    llm_retry_policy: LlmRetryPolicy = LlmRetryPolicy()

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
