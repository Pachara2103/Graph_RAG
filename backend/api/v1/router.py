"""Everything under /api/v1, assembled in one place.

Adding an endpoint means adding it to the router of the resource it belongs to
and, for a new resource, one include_router line here — app.py never grows.
"""

from fastapi import APIRouter

from api.v1 import auth, company, coordinator, line

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(company.router)
api_router.include_router(coordinator.router)
api_router.include_router(line.router)
