import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import auth, forms, public, questions

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Clone API")

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
# In production, set the CORS_ORIGINS environment variable to the exact
# frontend URL (e.g. "https://your-app.vercel.app").
# Multiple origins can be comma-separated.
# Browsers reject allow_credentials=True with a wildcard origin, so we use
# the explicit origin list in production.
# ---------------------------------------------------------------------------
_raw_origins = os.getenv("CORS_ORIGINS", "*")
if _raw_origins.strip() == "*":
    # Dev / unset: allow all (credentials will be limited by browser anyway)
    allow_origins = ["*"]
    allow_credentials = False  # Cannot use credentials=True with wildcard
else:
    allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(public.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
