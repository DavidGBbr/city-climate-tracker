from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel import Session

from .actions.router import router as actions_router
from .ai.router import router as ai_router
from .cities.router import router as cities_router
from .core.db import get_engine, get_session, init_db
from .core.errors import register_error_handlers
from .seed import seed_if_empty
from .summary.router import router as summary_router


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

register_error_handlers(app)

app.include_router(cities_router)
app.include_router(actions_router)
app.include_router(summary_router)
app.include_router(ai_router)


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
