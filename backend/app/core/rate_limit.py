import time
from collections import defaultdict, deque
from typing import Deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

LIMITS = {
    "/api/v1/auth/login": (10, 900),
    "/api/v1/devices/lookup": (60, 60),
    "/api/v1/auth/recovery": (5, 3600),
}
_state: dict[str, Deque[float]] = defaultdict(deque)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in LIMITS:
            count, window = LIMITS[path]
            key = f"{request.client.host if request.client else 'unknown'}:{path}"
            now = time.time()
            q = _state[key]
            while q and q[0] <= now - window:
                q.popleft()
            if len(q) >= count:
                return JSONResponse(status_code=429, content={"detail": "rate limit exceeded"})
            q.append(now)
        return await call_next(request)
