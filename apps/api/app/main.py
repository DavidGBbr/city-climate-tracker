from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel import Session

from .db import get_session, init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="City Climate Action Tracker API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "city-climate-action-tracker", "status": "ok"}


@app.get("/health")
def health(session: Session = Depends(get_session)):
    db_ok = "ok"
    try:
        session.exec(text("SELECT 1"))
    except Exception:
        db_ok = "error"
    return {"status": "ok" if db_ok == "ok" else "degraded", "db": db_ok}
