"""FastAPI entry point.

Nothing but wiring lives here: middleware, the error handlers that turn an
exception into a response, and the one router include. Endpoints live under
api/v1/, grouped by the resource they act on.
"""

import logging

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.v1.router import api_router
from core.exceptions import AppException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="NextLink AI API",
    version="1.0.0",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Every deliberate failure, with the status the service layer chose.

    `exc.message` is written for the person using the console, so it is safe to
    show as-is — that is what the frontend puts in its toast.
    """
    logger.warning(
        "[%s] %s %s -> %s", type(exc).__name__, request.method, request.url.path, exc.message
    )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(Exception)
async def global_unknown_exception_handler(request: Request, exc: Exception):
    """Anything nobody thought to raise on purpose.

    The details stay in the server log; the client gets one sentence, because a
    stack trace in a toast helps an attacker more than it helps the user.
    """
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้งภายหลัง"},
    )


@app.get("/api/v1/health", tags=["health"])
def health_api():
    """Unauthenticated liveness probe, so the console can tell "backend down"
    from "token rejected" without spending a real request."""
    return {"status": "ok"}


app.include_router(api_router)


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
