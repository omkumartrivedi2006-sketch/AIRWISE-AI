"""
AIRWISE AI — Integration Tests for Conversation & Message REST APIs
"""

def test_conversations_and_messages_flow(client):
    # 1. Create Conversation
    create_res = client.post(
        "/api/v1/conversations",
        json={"title": "Air Quality Precautions in Delhi"},
    )
    assert create_res.status_code == 201
    conv_data = create_res.json()["data"]
    conv_id = conv_data["id"]
    assert conv_data["title"] == "Air Quality Precautions in Delhi"

    # 2. Post Messages to Conversation
    msg_1 = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "user", "content": "What is the recommended mask for high PM2.5?"},
    )
    assert msg_1.status_code == 201
    assert msg_1.json()["data"]["role"] == "user"

    msg_2 = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"role": "assistant", "content": "Certified N95 or FFP2 respirators are strongly recommended."},
    )
    assert msg_2.status_code == 201
    assert msg_2.json()["data"]["role"] == "assistant"

    # 3. Retrieve Messages for Conversation
    list_msgs = client.get(f"/api/v1/conversations/{conv_id}/messages")
    assert list_msgs.status_code == 200
    messages = list_msgs.json()["data"]
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"

    # 4. List Conversations
    list_convs = client.get("/api/v1/conversations")
    assert list_convs.status_code == 200
    assert any(c["id"] == conv_id for c in list_convs.json()["data"])

    # 5. Delete Conversation
    del_res = client.delete(f"/api/v1/conversations/{conv_id}")
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted_id"] == conv_id

    # 6. Verify Deleted
    get_del = client.get(f"/api/v1/conversations/{conv_id}")
    assert get_del.status_code == 404
