# Role-Based Access Control (RBAC) in AMANA

## Overview

AMANA uses a simple, modern JWT-based role system with 4 roles:

| Role | Permissions | Use Case |
|------|-----------|----------|
| **claimant** | Register devices, report theft, submit disputes/conflicts | Regular users filing claims |
| **reviewer** | Access queue, triage cases, extend deadlines, reopen cases | Staff reviewing investigations |
| **senior_reviewer** | Everything reviewer can do + resolve disputes | Senior staff making final decisions |
| **admin** | Full system access, user management, configuration | System administrators |

## Backend Authentication (FastAPI)

### 1. **JWT Token Structure**

Tokens include user ID and role:

```json
{
  "sub": "user-id-uuid",
  "role": "reviewer",
  "exp": 1234567890
}
```

### 2. **Creating Tokens**

```python
from app.core.security import create_access_token

token = create_access_token(
    subject=str(user.id),
    role=user.role  # "claimant", "reviewer", etc.
)
```

### 3. **Role-Based Dependencies**

#### Check if user is authenticated:
```python
@router.get("/me")
def get_current_user(current: User = Depends(get_current_user)):
    return current
```

#### Check if user has required role:
```python
from app.api.dependencies import require_role

@router.post("/admin/users")
def create_user(
    data: UserCreate,
    current: User = Depends(require_role(["admin"]))
):
    return create_user(data)
```

#### Check for multiple allowed roles:
```python
@router.post("/{case_id}/triage")
def triage_case(
    case_id: str,
    current: User = Depends(require_role(["reviewer", "senior_reviewer"]))
):
    # Only reviewers or senior_reviewers can access
    pass
```

### 4. **HTTP Status Codes**

- **401 Unauthorized** — No token or invalid token
- **403 Forbidden** — Valid token but insufficient permissions

## Frontend Authentication (Next.js)

### 1. **useAuth Hook**

Get current user and check roles:

```typescript
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user, hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      {hasRole("reviewer") && <AdminPanel />}
    </div>
  );
}
```

### 2. **hasRole() Method**

Check single role:
```typescript
hasRole("admin")  // true if user.role === "admin"
```

Check multiple roles:
```typescript
hasRole(["reviewer", "senior_reviewer"])  // true if either role matches
```

### 3. **ProtectedRoute Component**

Wrap pages requiring authentication or roles:

```typescript
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

## Test Authentication

### 1. **Register a User**

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "locale": "en"
  }'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### 2. **Login**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### 3. **Get Current User Profile**

```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  http://localhost:8000/api/v1/auth/me
```

Response:
```json
{
  "id": "fb27101e-3ef6-4fb8-90f0-e5d3e8b498f1",
  "email": "user@example.com",
  "role": "claimant",
  "account_status": "active",
  "locale": "en"
}
```

## Change User Role

Update a user's role in the database:

```bash
psql -U postgres -h localhost -d amana -c \
  "UPDATE users SET role='reviewer' WHERE email='admin2@sesa.com';"
```

Available roles:
- `claimant`
- `reviewer`
- `senior_reviewer`
- `admin`

## API Endpoint Role Requirements

| Endpoint | Method | Required Role |
|----------|--------|---------------|
| `/auth/register` | POST | — (public) |
| `/auth/login` | POST | — (public) |
| `/auth/me` | GET | any (authenticated) |
| `/devices/register` | POST | any (authenticated) |
| `/investigations/{id}/triage` | POST | `reviewer`, `senior_reviewer` |
| `/disputes/queue` | GET | `reviewer`, `senior_reviewer` |
| `/conflicts/queue` | GET | `reviewer`, `senior_reviewer` |

## Best Practices

### Backend
1. Always use `require_role()` for protected endpoints
2. Check roles in business logic, not just dependencies
3. Log authorization failures for audit trails
4. Use consistent role naming across code

### Frontend
1. Use `ProtectedRoute` for admin-only pages
2. Always check `hasRole()` before rendering sensitive UI
3. Never store sensitive data in localStorage (except token)
4. Handle 403 errors gracefully with permission denied message

## Security Notes

- Tokens expire after 60 minutes (configurable in `.env`)
- Roles are embedded in JWT but verified against database on each request
- Role changes take effect on next login (token refresh)
- Always validate roles on the backend, never trust frontend-only checks
