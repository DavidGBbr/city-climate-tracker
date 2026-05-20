from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://climate:climate@postgres:5432/climate_tracker"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    admin_password: str = "change-me"
    jwt_secret: str = "dev-secret-change-me"
    jwt_expire_minutes: int = 480


@lru_cache
def get_settings() -> Settings:
    return Settings()
