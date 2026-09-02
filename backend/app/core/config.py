import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_STORAGE_PATH = BACKEND_DIR / "data" / "contacts.jsonl"


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "Pancore Card API"
    version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    storage_path: Path = DEFAULT_STORAGE_PATH
    cors_origins: tuple[str, ...] = ("*",)


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS", "*")
    return Settings(
        storage_path=Path(os.getenv("CONTACTS_STORAGE_PATH", DEFAULT_STORAGE_PATH)),
        cors_origins=tuple(origin.strip() for origin in origins.split(",") if origin.strip()),
    )
