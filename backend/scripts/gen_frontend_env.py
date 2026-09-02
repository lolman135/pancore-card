"""Генерує frontend/js/env.js з .env.

Фронт статичний, без збірки, тому прочитати .env у браузері неможливо —
адреса бекенда та API-ключ під'їжджають готовим ES-модулем. Запускати
після зміни BACKEND_HOST / BACKEND_PORT / API_KEY у .env.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import BACKEND_DIR as ROOT_DIR, get_settings  # noqa: E402

FRONTEND_ENV_PATH = ROOT_DIR / "frontend" / "js" / "env.js"
# 0.0.0.0 / :: — адреса прив'язки сервера; браузеру треба стукати на локальний хост
BIND_ALL_HOSTS = frozenset({"0.0.0.0", "::", "[::]"})
BROWSER_FALLBACK_HOST = "127.0.0.1"

TEMPLATE = """\
/* Згенеровано backend/scripts/gen_frontend_env.py з .env — не редагувати вручну.
   Перегенерувати після зміни BACKEND_HOST / BACKEND_PORT / API_KEY:
     python backend/scripts/gen_frontend_env.py
   Порожній API_BASE = той самий origin, що й сторінка. */
export const API_BASE = '{api_base}';
export const API_KEY = '{api_key}';
"""


def browser_host(host: str) -> str:
    return BROWSER_FALLBACK_HOST if host in BIND_ALL_HOSTS else host


def main() -> None:
    settings = get_settings()
    api_base = f"http://{browser_host(settings.host)}:{settings.port}"
    FRONTEND_ENV_PATH.parent.mkdir(parents=True, exist_ok=True)
    FRONTEND_ENV_PATH.write_text(
        TEMPLATE.format(api_base=api_base, api_key=settings.api_key), encoding="utf-8"
    )
    print(f"{FRONTEND_ENV_PATH} -> API_BASE = {api_base}, API_KEY = {'set' if settings.api_key else 'empty'}")


if __name__ == "__main__":
    main()
