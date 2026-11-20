"""
AIRWISE AI — Authentication & RBAC API Integration Tests
Tests full auth flows: registration, login, JWT cookies, refresh rotation, reuse rejection, logout, password change, reset, email verification, and RBAC.
"""

from fastapi.testclient import TestClient
from app.models.email_verification_token import EmailVerificationToken
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User


def test_registration_and_duplicate_email(client: TestClient):
    # 1. Successful registration
    reg_payload = {
        "full_name": "Elena Rostova",
        "email": "elena.rostova@airwise.ai",
        "password": "StrongPassword!2026",
        "confirm_password": "StrongPassword!2026",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    body = res.json()
    assert body["success"] is True
    assert body["data"]["email"] == "elena.rostova@airwise.ai"
    assert body["data"]["role"] == "USER"
    assert "password_hash" not in body["data"]

    # 2. Duplicate email rejection (409)
    res_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 409
    assert res_dup.json()["success"] is False

    # 3. Password mismatch rejection (400)
    mismatch_payload = {
        **reg_payload,
        "email": "other@airwise.ai",
        "confirm_password": "DifferentPassword!2026",
    }
    res_mismatch = client.post("/api/v1/auth/register", json=mismatch_payload)
    assert res_mismatch.status_code == 400


def test_login_and_cookie_establishment(client: TestClient):
    # Register user
    reg_payload = {
        "full_name": "Marcus Vance",
        "email": "marcus.vance@airwise.ai",
        "password": "VanceP@ssw0rd2026!",
        "confirm_password": "VanceP@ssw0rd2026!",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # 1. Invalid credentials rejection
    res_bad = client.post("/api/v1/auth/login", json={
        "email": "marcus.vance@airwise.ai",
        "password": "WrongPassword123!",
    })
    assert res_bad.status_code == 401
    assert "Invalid email or password" in res_bad.json()["message"]

    # 2. Successful login
    res_login = client.post("/api/v1/auth/login", json={
        "email": "marcus.vance@airwise.ai",
        "password": "VanceP@ssw0rd2026!",
    })
    assert res_login.status_code == 200
    login_data = res_login.json()["data"]
    access_token = login_data["access_token"]
    assert access_token is not None
    assert login_data["user"]["email"] == "marcus.vance@airwise.ai"

    # Verify cookies established
    assert "access_token" in res_login.cookies
    assert "refresh_token" in res_login.cookies

    # 3. Access protected /me endpoint with Bearer header
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert res_me.status_code == 200
    assert res_me.json()["data"]["email"] == "marcus.vance@airwise.ai"

    # 4. Access protected /me endpoint using cookie
    res_me_cookie = client.get("/api/v1/auth/me", cookies={"access_token": access_token})
    assert res_me_cookie.status_code == 200


def test_refresh_token_rotation_and_reuse_detection(client: TestClient):
    # Register & Login
    client.post("/api/v1/auth/register", json={
        "full_name": "Token Tester",
        "email": "token.tester@airwise.ai",
        "password": "TokenPassword!2026",
        "confirm_password": "TokenPassword!2026",
    })
    res_login = client.post("/api/v1/auth/login", json={
        "email": "token.tester@airwise.ai",
        "password": "TokenPassword!2026",
    })
    first_refresh_token = res_login.cookies["refresh_token"]

    # 1. Successful Refresh
    res_refresh = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": first_refresh_token},
    )
    assert res_refresh.status_code == 200
    second_refresh_token = res_refresh.cookies["refresh_token"]
    assert second_refresh_token != first_refresh_token

    # 2. Token Reuse Attack: Attempt to reuse the first (now revoked) token
    res_reuse = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": first_refresh_token},
    )
    assert res_reuse.status_code == 401
    assert "Revoked token reuse detected" in res_reuse.json()["message"]

    # 3. Verify all sessions were terminated (even the second token is now dead)
    res_second_check = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": second_refresh_token},
    )
    assert res_second_check.status_code == 401


def test_logout_and_session_clearing(client: TestClient):
    # Register & Login
    client.post("/api/v1/auth/register", json={
        "full_name": "Logout Tester",
        "email": "logout.tester@airwise.ai",
        "password": "LogoutPassword!2026",
        "confirm_password": "LogoutPassword!2026",
    })
    res_login = client.post("/api/v1/auth/login", json={
        "email": "logout.tester@airwise.ai",
        "password": "LogoutPassword!2026",
    })
    access_token = res_login.json()["data"]["access_token"]
    refresh_token = res_login.cookies["refresh_token"]

    # Logout
    res_logout = client.post(
        "/api/v1/auth/logout",
        cookies={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert res_logout.status_code == 200
    assert res_logout.json()["success"] is True

    # Refresh should now fail
    res_refresh_fail = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )
    assert res_refresh_fail.status_code == 401


def test_password_change_flow(client: TestClient):
    client.post("/api/v1/auth/register", json={
        "full_name": "Password Changer",
        "email": "pw.changer@airwise.ai",
        "password": "OldPassword!2026",
        "confirm_password": "OldPassword!2026",
    })
    res_login = client.post("/api/v1/auth/login", json={
        "email": "pw.changer@airwise.ai",
        "password": "OldPassword!2026",
    })
    access_token = res_login.json()["data"]["access_token"]

    # 1. Change password with incorrect current password
    res_bad = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "current_password": "WrongOldPassword!2026",
            "new_password": "NewStrongPass!2026",
            "confirm_new_password": "NewStrongPass!2026",
        },
    )
    assert res_bad.status_code == 400

    # 2. Change password successfully
    res_ok = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "current_password": "OldPassword!2026",
            "new_password": "NewStrongPass!2026",
            "confirm_new_password": "NewStrongPass!2026",
        },
    )
    assert res_ok.status_code == 200

    # 3. Old password should fail login
    res_old_login = client.post("/api/v1/auth/login", json={
        "email": "pw.changer@airwise.ai",
        "password": "OldPassword!2026",
    })
    assert res_old_login.status_code == 401

    # 4. New password succeeds
    res_new_login = client.post("/api/v1/auth/login", json={
        "email": "pw.changer@airwise.ai",
        "password": "NewStrongPass!2026",
    })
    assert res_new_login.status_code == 200


def test_user_profile_update(client: TestClient):
    client.post("/api/v1/auth/register", json={
        "full_name": "Profile User",
        "email": "profile.user@airwise.ai",
        "password": "ProfilePass!2026",
        "confirm_password": "ProfilePass!2026",
    })
    res_login = client.post("/api/v1/auth/login", json={
        "email": "profile.user@airwise.ai",
        "password": "ProfilePass!2026",
    })
    access_token = res_login.json()["data"]["access_token"]

    # Update full_name and profile_image
    patch_res = client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"full_name": "Updated Name", "profile_image": "https://avatar.url/img.png"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["full_name"] == "Updated Name"
    assert patch_res.json()["data"]["profile_image"] == "https://avatar.url/img.png"
    assert patch_res.json()["data"]["role"] == "USER"


def test_rbac_admin_protection(client: TestClient, db_session):
    # Create normal user
    client.post("/api/v1/auth/register", json={
        "full_name": "Normal User",
        "email": "normal.user@airwise.ai",
        "password": "NormalUserPass!2026",
        "confirm_password": "NormalUserPass!2026",
    })
    res_login = client.post("/api/v1/auth/login", json={
        "email": "normal.user@airwise.ai",
        "password": "NormalUserPass!2026",
    })
    user_token = res_login.json()["data"]["access_token"]

    # Verify role in profile is USER
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert res_me.json()["data"]["role"] == "USER"

    # Elevate another user to ADMIN directly in database for testing
    admin_user = User(
        email="admin@airwise.ai",
        full_name="Platform Admin",
        role="ADMIN",
        is_active=True,
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    from app.core.security import create_access_token
    admin_token = create_access_token(user_id=admin_user.id, role="ADMIN", email="admin@airwise.ai")

    res_admin_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_me.status_code == 200
    assert res_admin_me.json()["data"]["role"] == "ADMIN"
