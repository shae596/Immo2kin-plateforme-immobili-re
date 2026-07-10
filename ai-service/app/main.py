from fastapi import FastAPI

from app.api import health, recommendations

app = FastAPI(
    title="Immo2Kin — AI Service",
    description="Microservice de recommandations (Phase 8)",
    version="0.2.0",
)

app.include_router(health.router)
app.include_router(recommendations.router)
