import uvicorn

from app.main import app
from app.core import config

__all__ = ["app"]

if __name__ == '__main__':
    uvicorn.run(app, host=config.get_settings().host, port=config.get_settings().port)
