import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.models import models

# Import API Routers
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.dashboard import router as dashboard_router
from backend.app.api.v1.accounts import router as accounts_router
from backend.app.api.v1.categories import router as categories_router
from backend.app.api.v1.transactions import router as transactions_router
from backend.app.api.v1.clients import router as clients_router
from backend.app.api.v1.projects import router as projects_router
from backend.app.api.v1.invoices import router as invoices_router
from backend.app.api.v1.budgets import router as budgets_router
from backend.app.api.v1.subscriptions import router as subscriptions_router
from backend.app.api.v1.taxes import router as taxes_router
from backend.app.api.v1.savings import router as savings_router
from backend.app.api.v1.reports import router as reports_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Authoritative Financial Management Platform for Independent Freelancers",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(accounts_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(transactions_router, prefix=settings.API_V1_STR)
app.include_router(clients_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(invoices_router, prefix=settings.API_V1_STR)
app.include_router(budgets_router, prefix=settings.API_V1_STR)
app.include_router(subscriptions_router, prefix=settings.API_V1_STR)
app.include_router(taxes_router, prefix=settings.API_V1_STR)
app.include_router(savings_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check(request: Request):
    if request.method == "HEAD":
        return Response(status_code=200)
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": "1.0.0"}

@app.api_route("/", methods=["HEAD"])
def root_head_check():
    return Response(status_code=200)

# Serve frontend static assets and SPA fallback
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path == "health":
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
