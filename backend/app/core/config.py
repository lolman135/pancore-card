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
DEFAULT_SMTP_HOST = "smtp.gmail.com"
DEFAULT_SMTP_PORT = 465
DEFAULT_SMTP_TIMEOUT = 10.0
DEFAULT_MAIL_PROVIDER = "smtp"
DEFAULT_RESEND_API_URL = "https://api.resend.com/emails"


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
    smtp_host: str = DEFAULT_SMTP_HOST
    smtp_port: int = DEFAULT_SMTP_PORT
    smtp_timeout: float = DEFAULT_SMTP_TIMEOUT
    mail_provider: str = DEFAULT_MAIL_PROVIDER
    resend_api_key: str = ""
    resend_api_url: str = DEFAULT_RESEND_API_URL
    mail_from: str = ""
    mail_from_password: str = ""
    mail_to: str = ""
    api_key: str = ""
    prod_flag: bool = False


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS", "*")
    return Settings(
        problem_base_url=os.getenv("PROBLEM_BASE_URL", DEFAULT_PROBLEM_BASE_URL).rstrip("/"),
        cors_origins=tuple(origin.strip() for origin in origins.split(",") if origin.strip()),
        port=int(os.getenv("BACKEND_PORT", DEFAULT_PORT)),
        host=os.getenv("BACKEND_HOST", DEFAULT_HOST),
        smtp_host=os.getenv("SMTP_HOST", DEFAULT_SMTP_HOST),
        smtp_port=int(os.getenv("SMTP_PORT", DEFAULT_SMTP_PORT)),
        smtp_timeout=float(os.getenv("SMTP_TIMEOUT", DEFAULT_SMTP_TIMEOUT)),
        mail_provider=os.getenv("MAIL_PROVIDER", DEFAULT_MAIL_PROVIDER).strip().lower(),
        resend_api_key=os.getenv("RESEND_API_KEY", ""),
        resend_api_url=os.getenv("RESEND_API_URL", DEFAULT_RESEND_API_URL),
        mail_from=os.getenv("MAIL_FROM", ""),
        mail_from_password=os.getenv("MAIL_FROM_PASSWORD", ""),
        mail_to=os.getenv("MAIL_TO", ""),
        api_key=os.getenv("API_KEY", ""),
        prod_flag=_env_bool("PROD_FLAG")
    )

def _env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")