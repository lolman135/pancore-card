import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[3]
DEFAULT_ENV_PATH = BACKEND_DIR / ".env"
DEFAULT_PROBLEM_BASE_URL = "https://pancore-card.example.com/problems"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8080

load_dotenv(DEFAULT_ENV_PATH)


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "Pancore Card API"
    version: str = "1.0.0"
    port: int = DEFAULT_PORT
    host: str = DEFAULT_HOST
    api_prefix: str = "/api/v1"
    cors_origins: tuple[str, ...] = ("*",)
    problem_base_url: str = DEFAULT_PROBLEM_BASE_URL


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS", "*")
    return Settings(
        problem_base_url=os.getenv("PROBLEM_BASE_URL", DEFAULT_PROBLEM_BASE_URL).rstrip("/"),
        cors_origins=tuple(origin.strip() for origin in origins.split(",") if origin.strip()),
        port=int(os.getenv("BACKEND_PORT", DEFAULT_PORT)),
        host=os.getenv("BACKEND_HOST", DEFAULT_HOST),
    )
