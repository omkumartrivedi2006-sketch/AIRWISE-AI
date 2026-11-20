"""
AIRWISE AI — Integration Tests for Feedback REST API
"""

def test_feedback_submission(client):
    # 1. Submit valid feedback
    payload = {
        "rating": 5,
        "comment": "Exceptionally clear breakdown of fine particle risks and WHO guidelines.",
    }
    res = client.post("/api/v1/feedback", json=payload)
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["rating"] == 5
    assert "id" in data

    # 2. Submit invalid rating (out of range 1-5)
    invalid_payload = {
        "rating": 6,
        "comment": "Rating is too high",
    }
    bad_res = client.post("/api/v1/feedback", json=invalid_payload)
    assert bad_res.status_code == 422
    assert bad_res.json()["success"] is False


def test_list_feedback(client):
    res = client.get("/api/v1/feedback")
    assert res.status_code == 200
    assert res.json()["success"] is True
