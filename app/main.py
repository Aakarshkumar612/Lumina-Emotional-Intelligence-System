from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, health
from app.pipeline.predict_engine import get_engine

app = FastAPI(
    title="Lumina — Emotional Intelligence System",
    description="AI system that understands human emotional state, reasons under uncertainty, and guides users toward better mental states.",
    version="1.0.0",
)

# CORS — allow frontend (Lovable/BoltAI) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, tags=["Health"])
app.include_router(predict.router, tags=["Prediction"])


@app.on_event("startup")
async def startup_event():
    """Pre-load models on startup so first request isn't slow."""
    
    get_engine()
    print("✅ Models ready.")


@app.get("/")
def root():
    return {
        "message": "Lumina Emotional Intelligence System is running.",
        "docs":    "/docs",
        "health":  "/health",
        "predict": "/predict",
    }