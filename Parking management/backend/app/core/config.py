from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://parkflow:parkflow@localhost:5432/parkflow"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    app_timezone: str = "UTC"
    cors_origins: str = "http://localhost:5173,http://localhost:8081"
    platform_userinfo_url: str = "http://localhost:8000/int/v1/users/me"

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        has_local_origin = any(
            origin.startswith(("http://localhost", "https://localhost", "http://127.0.0.1", "https://127.0.0.1"))
            for origin in origins
        )
        if not has_local_origin:
            return origins

        local_dev_origins = {
            "http://localhost:4173",
            "http://127.0.0.1:4173",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
        }
        return sorted(set(origins) | local_dev_origins)

    @property
    def cors_origin_regex(self) -> str | None:
        """Allow any localhost/127.0.0.1 port when local dev origins are configured."""
        has_local_origin = any(
            origin.startswith(("http://localhost", "https://localhost", "http://127.0.0.1", "https://127.0.0.1"))
            for origin in self.cors_origin_list
        )
        if has_local_origin:
            return r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
        return None


@lru_cache
def get_settings() -> Settings:
    return Settings()
