import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal, init_db
from app.models import crud, models
from app.schemas import schemas

client = TestClient(app)

def test_api_suite():
    init_db()
    db = SessionLocal()
    
    # 1. Register / login test user
    test_email = "api_tester@example.com"
    existing_user = crud.get_user_by_email(db, test_email)
    if not existing_user:
        user = crud.create_user(db, "API Tester", test_email, "hashed_pw")
    else:
        user = existing_user

    token_resp = client.post("/api/auth/token", data={"username": test_email, "password": "any"})
    headers = {}
    if token_resp.status_code == 200:
        token = token_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Form
    create_form_resp = client.post(
        "/api/forms/",
        json={"title": "Branching API Form", "description": "Testing Endpoints"},
        headers=headers
    )
    assert create_form_resp.status_code == 200, f"Form creation failed: {create_form_resp.text}"
    form_data = create_form_resp.json()
    form_id = form_data["id"]
    slug = form_data["slug"]

    # 3. Add 3 Questions
    # Q1: yes_no
    q1_resp = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "title": "Do you need a loan?",
            "question_type": "yes_no",
            "is_required": True,
            "options": []
        },
        headers=headers
    )
    assert q1_resp.status_code == 200
    q1 = q1_resp.json()

    # Q2: number
    q2_resp = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "title": "How much loan amount?",
            "question_type": "number",
            "is_required": True,
            "options": []
        },
        headers=headers
    )
    assert q2_resp.status_code == 200
    q2 = q2_resp.json()

    # Q3: short_text
    q3_resp = client.post(
        f"/api/forms/{form_id}/questions",
        json={
            "title": "Why are you not looking for a loan?",
            "question_type": "short_text",
            "is_required": True,
            "options": []
        },
        headers=headers
    )
    assert q3_resp.status_code == 200
    q3 = q3_resp.json()

    # 4. Update Q1 with branching rules
    # "yes" -> Jump to Q2
    # "no" -> Jump to Q3
    q1_update_resp = client.put(
        f"/api/questions/{q1['id']}",
        json={
            "title": q1["title"],
            "question_type": "yes_no",
            "is_required": True,
            "logic_rules": [
                {"condition_value": "yes", "action": "jump", "destination_question_id": q2["id"]},
                {"condition_value": "no", "action": "jump", "destination_question_id": q3["id"]}
            ]
        },
        headers=headers
    )
    assert q1_update_resp.status_code == 200
    q1_updated = q1_update_resp.json()
    assert len(q1_updated["logic_rules"]) == 2

    # 5. Publish Form
    pub_resp = client.put(
        f"/api/forms/{form_id}",
        json={"is_published": True},
        headers=headers
    )
    assert pub_resp.status_code == 200
    assert pub_resp.json()["is_published"] is True

    # 6. Public Form Runner GET
    public_form_resp = client.get(f"/api/public/forms/{slug}")
    assert public_form_resp.status_code == 200
    pub_form = public_form_resp.json()
    assert len(pub_form["questions"]) == 3
    assert len(pub_form["questions"][0]["logic_rules"]) == 2

    # 7. Public Submission Following Branch (Q1 -> Q3, skipping required Q2)
    submit_resp = client.post(
        f"/api/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q1["id"], "text_value": "no", "boolean_value": False},
                {"question_id": q3["id"], "text_value": "I am debt free"}
            ]
        }
    )
    assert submit_resp.status_code == 200, f"Branch submission failed: {submit_resp.text}"

    # 8. Check Form Analytics / Stats
    stats_resp = client.get(f"/api/forms/{form_id}/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_responses"] >= 1

    # 9. Clean up
    del_resp = client.delete(f"/api/forms/{form_id}", headers=headers)
    assert del_resp.status_code == 200

    db.close()
    print("ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api_suite()
