# AIRWISE AI — Admin Security, RBAC & Protection Policies

## Overview
This document outlines the security architecture, authorization controls, and safety invariants implemented in **Module 09** of AIRWISE AI.

---

## 1. Role-Based Access Control (RBAC)

AIRWISE AI enforces strict role separation between standard users and system administrators.

```
+-------------------------------------------------------------+
|                      User Account Role                      |
+------------------------------+------------------------------+
|            USER              |            ADMIN             |
+------------------------------+------------------------------+
| - Access public landing page | - All standard USER powers   |
| - View personal dashboard    | - Access /admin frontend     |
| - Query live AQI & maps      | - Manage user roles & status |
| - Chat with AI assistant     | - Review environmental data  |
| - Configure notifications    | - Inspect external providers |
| - Manage saved locations     | - Monitor AI usage & tokens  |
| - Access /api/v1/ user routes| - Access /api/v1/admin/*     |
+------------------------------+------------------------------+
```

### Authorization Dependency (`get_current_admin_user`)
In `backend/app/api/deps.py`:
```python
def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges",
        )
    return current_user
```
- **Unauthenticated requests** fail at `get_current_user` with `401 Unauthorized`.
- **Authenticated non-admin requests** fail at `get_current_admin_user` with `403 Forbidden`.

---

## 2. Critical Administrative Safeguards

### 2.1 Self-Deactivation Prevention
An administrator cannot deactivate their own active account through the admin interface:
```python
if str(user_id) == str(current_admin.id) and not new_status:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Administrators cannot deactivate their own account.",
    )
```

### 2.2 Last Active Administrator Protection
The system ensures that there is always at least one active administrator in the database. Any action that would demote or deactivate the last active administrator is strictly rejected:
```python
active_admin_count = (
    db.query(func.count(User.id))
    .filter(User.role == "ADMIN", User.is_active == True)
    .scalar()
)
if active_admin_count <= 1:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Cannot demote or deactivate the only active administrator.",
    )
```

---

## 3. Persistent & Redacted Audit Logging

All administrative actions are permanently logged in the `audit_logs` table via `AuditService.record_action()`:
- `admin_id`: UUID of the performing administrator.
- `admin_email`: Email of the administrator.
- `action`: Specific operation code (e.g., `USER_STATUS_CHANGE`, `USER_ROLE_CHANGE`, `DATA_REVIEW`, `NOTIFICATION_RETRY`).
- `target_type`: Target entity name (`USER`, `POLLUTION_OBSERVATION`, `NOTIFICATION`, `SYSTEM`).
- `target_id`: ID of the target record.
- `details`: JSON payload of the action context (state diffs, notes).
- `ip_address`: Client IP address from request headers.
- `user_agent`: Client user agent.

### Secret Redaction Guarantee
Any sensitive field (`password`, `token`, `secret`, `api_key`, `key`) found in state payloads is automatically sanitized before persistence:
```python
SENSITIVE_KEYS = {"password", "token", "secret", "api_key", "authorization", "cookie"}
# Transformed to "[REDACTED]"
```

---

## 4. Provisioning Administrators Securely

Administrators cannot register via the public registration endpoint. They must be provisioned via the secure CLI command:

```powershell
# Interactive CLI
python -m app.cli.admin create --email admin@airwise.ai --name "Platform Administrator"

# Convenience Script
python scripts/create_admin.py --email admin@airwise.ai --name "Platform Administrator" --password "<secure-password>"
```
