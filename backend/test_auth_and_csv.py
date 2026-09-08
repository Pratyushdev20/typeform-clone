from fastapi.testclient import TestClient
from main import app
from seed import seed_data
from app.core.database import SessionLocal
from app.models import models

client = TestClient(app)

def test_full_auth_and_csv_flow():
    print("=== Step 0: Fresh Seed ===")
    seed_data()

    print("\n=== Test 1: User Signup ===")
    signup_payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "securepassword123"
    }
    res = client.post("/api/auth/signup", json=signup_payload)
    assert res.status_code == 200, f"Signup failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane@example.com"
    token1 = data["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print("User 1 Signup PASSED!")

    print("\n=== Test 2: Reject Duplicate Email ===")
    res = client.post("/api/auth/signup", json=signup_payload)
    assert res.status_code == 400, f"Expected 400 on duplicate, got {res.status_code}"
    print("Duplicate email rejection PASSED!")

    print("\n=== Test 3: User Login ===")
    # Wrong password
    res = client.post("/api/auth/login", json={"email": "jane@example.com", "password": "wrong"})
    assert res.status_code == 401
    # Correct password
    res = client.post("/api/auth/login", json={"email": "jane@example.com", "password": "securepassword123"})
    assert res.status_code == 200
    assert "access_token" in res.json()
    print("Login verification PASSED!")

    print("\n=== Test 4: Auth /me endpoint ===")
    res = client.get("/api/auth/me", headers=headers1)
    assert res.status_code == 200
    assert res.json()["email"] == "jane@example.com"
    print("Auth /me PASSED!")

    print("\n=== Test 5: Form Creation with Ownership ===")
    res = client.post("/api/forms/", json={"title": "Jane's Survey", "description": "Private Survey"}, headers=headers1)
    assert res.status_code == 200
    form_jane = res.json()
    form_jane_id = form_jane["id"]
    assert form_jane["title"] == "Jane's Survey"
    print(f"Form created with ID: {form_jane_id}")

    # Add questions to Jane's form
    q1_res = client.post(f"/api/forms/{form_jane_id}/questions", json={
        "title": "What is your name?",
        "question_type": "short_text",
        "is_required": True
    }, headers=headers1)
    q1_id = q1_res.json()["id"]

    q2_res = client.post(f"/api/forms/{form_jane_id}/questions", json={
        "title": "Rate our quality",
        "question_type": "rating",
        "is_required": True
    }, headers=headers1)
    q2_id = q2_res.json()["id"]

    q3_res = client.post(f"/api/forms/{form_jane_id}/questions", json={
        "title": "Will you return?",
        "question_type": "yes_no",
        "is_required": False
    }, headers=headers1)
    q3_id = q3_res.json()["id"]
    print("Questions added to form PASSED!")

    print("\n=== Test 6: Form Ownership Isolation ===")
    # Sign up user 2
    res2 = client.post("/api/auth/signup", json={
        "name": "Bob Smith",
        "email": "bob@example.com",
        "password": "bobpassword123"
    })
    assert res2.status_code == 200
    token2 = res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Bob tries to access Jane's form -> 403
    res = client.get(f"/api/forms/{form_jane_id}", headers=headers2)
    assert res.status_code == 403, f"Expected 403 for unauthorized user, got {res.status_code}"

    # Bob tries to update Jane's form -> 403
    res = client.put(f"/api/forms/{form_jane_id}", json={"title": "Hacked Title"}, headers=headers2)
    assert res.status_code == 403

    # Bob tries to delete Jane's form -> 403
    res = client.delete(f"/api/forms/{form_jane_id}", headers=headers2)
    assert res.status_code == 403
    print("Ownership protection PASSED!")

    print("\n=== Test 7: CSV Response Import ===")
    # Valid CSV with quoted commas and valid ratings
    csv_valid = """Submitted At,What is your name?,Rate our quality,Will you return?
2026-09-08 10:00:00,"Doe, John",5,Yes
2026-09-08 10:05:00,Alice Walker,4,true
2026-09-08 10:10:00,"Smith, Charlie",3,no
"""
    res = client.post(f"/api/forms/{form_jane_id}/import-csv", json={"csv_content": csv_valid}, headers=headers1)
    assert res.status_code == 200, f"CSV import failed: {res.text}"
    import_result = res.json()
    assert import_result["imported_count"] == 3
    print("Valid CSV import PASSED! Result:", import_result)

    # Verify responses are in database and stats are updated
    res = client.get(f"/api/forms/{form_jane_id}/responses", headers=headers1)
    assert res.status_code == 200
    responses = res.json()
    assert len(responses) == 3

    # Check stats
    res = client.get(f"/api/forms/{form_jane_id}/stats", headers=headers1)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_responses"] == 3
    # Check rating stat average = (5+4+3)/3 = 4.0
    rating_stat = next(q for q in stats["questions"] if q["question_id"] == q2_id)
    assert rating_stat["rating_stats"]["average"] == 4.0
    print("Responses persistence and stats calculation PASSED!")

    print("\n=== Test 8: CSV Import Validation Errors ===")
    # Invalid rating (e.g. 25)
    csv_bad_rating = """What is your name?,Rate our quality,Will you return?
Bad Rating User,25,Yes
"""
    res = client.post(f"/api/forms/{form_jane_id}/import-csv", json={"csv_content": csv_bad_rating}, headers=headers1)
    assert res.status_code == 400
    assert "Invalid rating" in res.json()["detail"]
    print("Bad rating validation PASSED!")

    # Header mismatch
    csv_mismatched = """Unknown Column 1,Random Question 2
Val 1,Val 2
"""
    res = client.post(f"/api/forms/{form_jane_id}/import-csv", json={"csv_content": csv_mismatched}, headers=headers1)
    assert res.status_code == 400
    assert "CSV headers do not match" in res.json()["detail"]
    print("Header mismatch validation PASSED!")

    # Empty CSV
    res = client.post(f"/api/forms/{form_jane_id}/import-csv", json={"csv_content": ""}, headers=headers1)
    assert res.status_code == 400
    print("Empty CSV rejection PASSED!")

    print("\n=== Test 9: Public Form Access & Submission without Auth ===")
    # Publish Jane's form
    client.put(f"/api/forms/{form_jane_id}", json={"is_published": True}, headers=headers1)
    form_res = client.get(f"/api/forms/{form_jane_id}", headers=headers1)
    slug = form_res.json()["slug"]

    # Anonymous user gets public form
    pub_res = client.get(f"/api/public/forms/{slug}")
    assert pub_res.status_code == 200
    assert pub_res.json()["title"] == "Jane's Survey"

    # Anonymous user submits response
    sub_res = client.post(f"/api/public/forms/{slug}/responses", json={
        "answers": [
            {"question_id": q1_id, "text_value": "Anonymous Respondent"},
            {"question_id": q2_id, "number_value": 5},
            {"question_id": q3_id, "boolean_value": True}
        ]
    })
    assert sub_res.status_code == 200
    print("Public form submission without login PASSED!")

    print("\nALL BACKEND AUTH & CSV TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_auth_and_csv_flow()
