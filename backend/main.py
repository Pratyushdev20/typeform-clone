from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import auth, forms, public, questions

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Clone API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origins
    allow_credentials=True,
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
