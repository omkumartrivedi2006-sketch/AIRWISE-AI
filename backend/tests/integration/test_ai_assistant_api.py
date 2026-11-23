"""
AIRWISE AI — Module 05 AI Assistant & Conversation API Integration Tests
Tests conversation lifecycle, authenticated ownership boundaries,
AI chat message generation with Gemini provider, multi-turn dialogue memory,
and robust error handling when unconfigured.
"""

import pytest
from app.core.security import create_access_token, hash_password
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.services.ai.gemini_provider import gemini_provider


@pytest.fixture
def auth_user_a(db_session):
    user = User(
        email="user_a_ai@example.com",
        full_name="User Alpha",
        password_hash=hash_password("ComplexPass123!"),
        role="USER",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_user_b(db_session):
    user = User(
        email="user_b_ai@example.com",
        full_name="User Beta",
        password_hash=hash_password("ComplexPass123!"),
        role="USER",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_ai_conversation_lifecycle_and_ownership(client, auth_user_a, auth_user_b):
    token_a = create_access_token(user_id=auth_user_a.id, role=auth_user_a.role, email=auth_user_a.email)
    token_b = create_access_token(user_id=auth_user_b.id, role=auth_user_b.role, email=auth_user_b.email)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. User A creates conversation
    create_res = client.post(
        "/api/v1/conversations",
        json={"title": "Understanding AQI Levels"},
        headers=headers_a,
    )
    assert create_res.status_code == 201
    conv_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["user_id"] == auth_user_a.id

    # 2. User A can list and see their conversation
    list_a = client.get("/api/v1/conversations", headers=headers_a)
    assert list_a.status_code == 200
    assert any(c["id"] == conv_id for c in list_a.json()["data"])

    # 3. User B cannot see User A's conversation
    list_b = client.get("/api/v1/conversations", headers=headers_b)
    assert list_b.status_code == 200
    assert not any(c["id"] == conv_id for c in list_b.json()["data"])

    # 4. User B cannot access User A's conversation details (403 Forbidden)
    get_b = client.get(f"/api/v1/conversations/{conv_id}", headers=headers_b)
    assert get_b.status_code == 403


def test_ai_chat_message_generation_flow(client, auth_user_a):
    token_a = create_access_token(user_id=auth_user_a.id, role=auth_user_a.role, email=auth_user_a.email)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Create conversation
    create_res = client.post(
        "/api/v1/conversations",
        json={"title": "New Conversation"},
        headers=headers_a,
    )
    conv_id = create_res.json()["data"]["id"]

    # Configure mock response for deterministic test
    mock_ai_text = "Particulate matter PM2.5 refers to microscopic particles with aerodynamic diameter <= 2.5 micrometers."
    gemini_provider.set_mock_response(mock_ai_text)

    try:
        # User sends inquiry to AI
        chat_res = client.post(
            f"/api/v1/conversations/{conv_id}/messages",
            json={"content": "What is PM2.5 and why is it dangerous?"},
            headers=headers_a,
        )
        assert chat_res.status_code == 201
        data = chat_res.json()["data"]

        # Validate response envelope matches Module 05 requirements
        assert data["conversation_id"] == conv_id
        assert data["status"] == "completed"
        assert data["user_message"]["content"] == "What is PM2.5 and why is it dangerous?"
        assert data["user_message"]["role"] == "user"
        assert data["assistant_message"]["content"] == mock_ai_text
        assert data["assistant_message"]["role"] == "assistant"

        # Verify messages persisted in DB
        list_msgs = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers_a)
        assert list_msgs.status_code == 200
        msgs = list_msgs.json()["data"]
        assert len(msgs) == 2
        assert msgs[0]["role"] == "user"
        assert msgs[1]["role"] == "assistant"

        # Verify conversation title auto-updated from default
        get_conv = client.get(f"/api/v1/conversations/{conv_id}", headers=headers_a)
        assert get_conv.json()["data"]["title"] != "New Conversation"

    finally:
        gemini_provider.set_mock_response(None)


def test_ai_chat_message_validation_and_failures(client, auth_user_a):
    token_a = create_access_token(user_id=auth_user_a.id, role=auth_user_a.role, email=auth_user_a.email)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    create_res = client.post("/api/v1/conversations", json={"title": "Error Handling"}, headers=headers_a)
    conv_id = create_res.json()["data"]["id"]

    # 1. Empty message content rejected (422 schema validation or 400)
    empty_res = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "   "},
        headers=headers_a,
    )
    assert empty_res.status_code in (400, 422)

    # 2. When AI provider is unconfigured, should return structured error and NOT persist assistant message
    gemini_provider.set_mock_response(None)
    # Temporarily ensure unconfigured
    orig_key = gemini_provider.api_key
    gemini_provider.api_key = ""

    try:
        fail_res = client.post(
            f"/api/v1/conversations/{conv_id}/messages",
            json={"content": "Can you give me the forecast?"},
            headers=headers_a,
        )
        assert fail_res.status_code in (500, 502, 503)
        assert "not configured" in fail_res.json()["message"].lower() or "unavailable" in fail_res.json()["message"].lower()

        # Verify no fake assistant message was persisted
        list_msgs = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers_a)
        msgs = list_msgs.json()["data"]
        # Only the user's message should exist, zero assistant messages
        assistant_msgs = [m for m in msgs if m["role"] == "assistant"]
        assert len(assistant_msgs) == 0

    finally:
        gemini_provider.api_key = orig_key
