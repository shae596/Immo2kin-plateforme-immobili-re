from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "local"
    api_key: str = "dev-ai-key"
    backend_url: str = "http://localhost:8000"


settings = Settings()
