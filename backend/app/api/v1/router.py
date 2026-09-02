from fastapi import APIRouter

from app.api.v1 import contact, health

api_router = APIRouter()
api_router.include_router(contact.router)
api_router.include_router(health.router)
