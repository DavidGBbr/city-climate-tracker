import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlmodel import Session
from starlette.exceptions import HTTPException as StarletteHTTPException

from .db import get_engine, get_session, init_db
from .routers import actions as actions_router
from .routers import cities as cities_router
from .routers import extract as extract_router
from .routers import summary as summary_router
from .seed import seed_if_empty

logger = logging.getLogger("climate_tracker")


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


# ---- Global error handlers ---------------------------------------------------


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Request payload failed validation.",
            "details": exc.errors(),
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": exc.detail if isinstance(exc.detail, str) else "HTTP error.",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred. The team has been notified.",
        },
    )


# ---- Routers -----------------------------------------------------------------

app.include_router(cities_router.router)
app.include_router(actions_router.router)
app.include_router(summary_router.router)
app.include_router(extract_router.router)


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
