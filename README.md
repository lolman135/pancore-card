# PANCORE — сайт-візитка

Фронт (статика, укр.) + бекенд (FastAPI) для прийому заявок.

| Папка       | Що це                                   | Докладніше            |
|-------------|------------------------------------------|-----------------------|
| `frontend/` | 3 сторінки: головна · виробництво · асортимент | `frontend/README.md` |
| `backend/`  | API `/api/v1/contact`, `/api/v1/health`  | код у `backend/app`   |

## Запуск із чистого клона (Windows)

```powershell
git clone https://github.com/lolman135/pancore-card.git
cd pancore-card
git checkout frontend-pancore   # актуальний фронт (master може відставати)
```

**Фронт** — будь-який статичний сервер із папки `frontend/`
(подвійний клік по index.html НЕ працює: браузер блокує ES-модулі з file://):

```powershell
cd frontend
py -m http.server 8090
```

→ http://127.0.0.1:8090

**Бекенд** — окреме вікно терміналу:

```powershell
cd backend
py -m venv .venv                                   # лише перший раз
.venv\Scripts\python.exe -m pip install -r requirements.txt   # лише перший раз
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

→ Swagger: http://127.0.0.1:8000/docs · заявки падають у `backend/data/contacts.jsonl`

Щоб форма з фронта (порт 8090) била в бекенд (порт 8000), у `<head>` трьох
HTML-сторінок впишіть:

```html
<meta name="api-base" content="http://127.0.0.1:8000">
```

Порожній `api-base` означає «той самий origin» — режим продакшена, коли фронт
роздає той же сервер (nginx / StaticFiles), деталі у `frontend/README.md`.

## Гілки

- `frontend-pancore` — актуальний фронт + бекенд з master;
- `backend-frontend-linking` — гілка Кирила: інтеграція через `.env`
  (`backend/scripts/gen_frontend_env.py` генерує `frontend/js/env.js`;
  без цього кроку фронт тієї гілки не стартує);
- `master` — стабільні злиття через PR.
