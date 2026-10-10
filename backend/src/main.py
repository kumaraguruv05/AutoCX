from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.config.settings import settings
from src.services.model_loader import registry
from src.api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models once
    registry.load_models()
    yield
    # Shutdown
    print("AutoCX backend shutting down cleanly.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Automotive Analytics API — Predicts Used Vehicle Resale Value and EV Battery State of Health (SOH)",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router, prefix="/api")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please verify input parameters."}
    )

@app.get("/", tags=["Root"])
def root():
    return {
        "app": "AutoCX — Auto ChronAx",
        "tagline": "Time Changes Cars. AutoCX Measures Value.",
        "docs": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
