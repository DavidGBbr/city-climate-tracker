from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel import Session

from .db import get_engine, get_session, init_db
from .routers import actions as actions_router
from .routers import cities as cities_router
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    with Session(get_engine()) as s:
        seed_if_empty(s)
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

app.include_router(cities_router.router)
app.include_router(actions_router.router)


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
