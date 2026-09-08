import json
from fastapi.testclient import TestClient
from main import app
from seed import seed_data

client = TestClient(app)

def run_tests():
    print("=== Step 0: Seeding fresh data ===")
    seed_data()

    # Signup test user for protected management endpoints
    auth_res = client.post("/api/auth/signup", json={
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpassword123"
    })
    assert auth_res.status_code == 200, f"Auth signup failed: {auth_res.text}"
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n=== Test 1: Fetch initial forms ===")
    res = client.get("/api/forms/", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    forms = res.json()
    assert len(forms) >= 2, f"Expected at least 2 forms, got {len(forms)}"
    form1 = forms[0]
    form_id = form1["id"]
    slug = form1["slug"]
    print(f"Form 1 ID: {form_id}, Title: {form1['title']}, Questions count: {len(form1['questions'])}")

    print("\n=== Test 2: Question Update (PUT /api/questions/{question_id}) ===")
    q1 = form1["questions"][0]
    q1_id = q1["id"]
    update_payload = {
        "title": "Updated Question 1 Title",
        "description": "Updated Description",
        "is_required": True,
        "options": [{"value": "Updated Opt 1"}, {"value": "Updated Opt 2"}]
    }
    res = client.put(f"/api/questions/{q1_id}", json=update_payload, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    updated_q = res.json()
    assert updated_q["title"] == "Updated Question 1 Title"
    assert updated_q["is_required"] is True
    assert len(updated_q["options"]) == 2
    assert updated_q["options"][0]["value"] == "Updated Opt 1"
    print("Question update PASSED!")

    print("\n=== Test 3: Add new question and then Delete it (DELETE /api/questions/{question_id}) ===")
    new_q_payload = {
        "title": "Temp Question for Deletion",
        "question_type": "short_text",
        "is_required": False
    }
    res = client.post(f"/api/forms/{form_id}/questions", json=new_q_payload, headers=headers)
    assert res.status_code == 200
    temp_q_id = res.json()["id"]
    
    res = client.delete(f"/api/questions/{temp_q_id}", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    
    # Confirm it's gone
    res = client.get(f"/api/forms/{form_id}", headers=headers)
    q_ids = [q["id"] for q in res.json()["questions"]]
    assert temp_q_id not in q_ids
    print("Question delete PASSED!")

    print("\n=== Test 4: Question Reorder (PUT /api/forms/{form_id}/questions/reorder) ===")
    res = client.get(f"/api/forms/{form_id}", headers=headers)
    current_questions = res.json()["questions"]
    orig_q_ids = [q["id"] for q in current_questions]
    reversed_ids = list(reversed(orig_q_ids))
    
    res = client.put(f"/api/forms/{form_id}/questions/reorder", json={"question_ids": reversed_ids}, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    
    res = client.get(f"/api/forms/{form_id}", headers=headers)
    reordered_q_ids = [q["id"] for q in res.json()["questions"]]
    assert reordered_q_ids == reversed_ids, f"Expected {reversed_ids}, got {reordered_q_ids}"
    print(f"Question reorder PASSED! (New order: {reordered_q_ids})")

    print("\n=== Test 5: Deep Form Duplication (POST /api/forms/{form_id}/duplicate) ===")
    res = client.post(f"/api/forms/{form_id}/duplicate", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    dup_form = res.json()
    assert dup_form["id"] != form_id
    assert "(Copy)" in dup_form["title"]
    assert dup_form["slug"] != slug
    assert dup_form["is_published"] is False
    assert len(dup_form["questions"]) == len(current_questions)
    assert dup_form["questions"][0]["id"] != current_questions[0]["id"]
    print(f"Duplicated Form ID: {dup_form['id']}, Slug: {dup_form['slug']}, Questions: {len(dup_form['questions'])}")
    print("Deep form duplication PASSED!")

    print("\n=== Test 6: Submission Validation (POST /api/public/forms/{slug}/responses) ===")
    seed_data()
    
    # Re-signup after seed for stats test
    auth_res = client.post("/api/auth/signup", json={
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpassword123"
    })
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Form 1: short_text, rating, long_text, yes_no
    res1 = client.get("/api/public/forms/cust-sat-123")
    f1_q = {q["question_type"]: q for q in res1.json()["questions"]}

    # Form 2: email, number, dropdown, multiple_choice
    res2 = client.get("/api/public/forms/event-reg-456")
    f2_q = {q["question_type"]: q for q in res2.json()["questions"]}

    # 6a. Required question missing (Form 1: name is required)
    bad_submission_1 = {
        "answers": [
            {"question_id": f1_q["short_text"]["id"], "text_value": ""},
            {"question_id": f1_q["rating"]["id"], "number_value": 5},
            {"question_id": f1_q["yes_no"]["id"], "boolean_value": True}
        ]
    }
    res = client.post("/api/public/forms/cust-sat-123/responses", json=bad_submission_1)
    assert res.status_code == 400, f"Expected 400 for missing required, got {res.status_code}"
    print("Validation 6a (Required field rejected) PASSED:", res.json()["detail"])

    # 6b. Invalid email format (Form 2)
    bad_submission_2 = {
        "answers": [
            {"question_id": f2_q["email"]["id"], "text_value": "not-an-email"},
            {"question_id": f2_q["number"]["id"], "number_value": 2},
            {"question_id": f2_q["dropdown"]["id"], "text_value": "AI"}
        ]
    }
    res = client.post("/api/public/forms/event-reg-456/responses", json=bad_submission_2)
    assert res.status_code == 400, f"Expected 400 for bad email, got {res.status_code}"
    print("Validation 6b (Invalid email rejected) PASSED:", res.json()["detail"])

    # 6c. Invalid number format (Form 2)
    bad_submission_num = {
        "answers": [
            {"question_id": f2_q["email"]["id"], "text_value": "valid@example.com"},
            {"question_id": f2_q["number"]["id"], "text_value": "abc"},
            {"question_id": f2_q["dropdown"]["id"], "text_value": "AI"}
        ]
    }
    res = client.post("/api/public/forms/event-reg-456/responses", json=bad_submission_num)
    assert res.status_code == 400, f"Expected 400 for bad number, got {res.status_code}"
    print("Validation 6c (Invalid number rejected) PASSED:", res.json()["detail"])

    # 6d. Invalid dropdown option (Form 2)
    bad_submission_drop = {
        "answers": [
            {"question_id": f2_q["email"]["id"], "text_value": "valid@example.com"},
            {"question_id": f2_q["number"]["id"], "number_value": 2},
            {"question_id": f2_q["dropdown"]["id"], "text_value": "Blockchain"}
        ]
    }
    res = client.post("/api/public/forms/event-reg-456/responses", json=bad_submission_drop)
    assert res.status_code == 400, f"Expected 400 for bad dropdown, got {res.status_code}"
    print("Validation 6d (Invalid dropdown option rejected) PASSED:", res.json()["detail"])

    # 6e. Invalid multiple choice option (Form 2)
    bad_submission_mc = {
        "answers": [
            {"question_id": f2_q["email"]["id"], "text_value": "valid@example.com"},
            {"question_id": f2_q["number"]["id"], "number_value": 2},
            {"question_id": f2_q["dropdown"]["id"], "text_value": "AI"},
            {"question_id": f2_q["multiple_choice"]["id"], "text_value": "Keto"}
        ]
    }
    res = client.post("/api/public/forms/event-reg-456/responses", json=bad_submission_mc)
    assert res.status_code == 400, f"Expected 400 for bad choice, got {res.status_code}"
    print("Validation 6e (Invalid multiple choice option rejected) PASSED:", res.json()["detail"])

    # 6f. Invalid rating value (Form 1: rating > 10)
    bad_submission_rating = {
        "answers": [
            {"question_id": f1_q["short_text"]["id"], "text_value": "Bob"},
            {"question_id": f1_q["rating"]["id"], "number_value": 15},
            {"question_id": f1_q["yes_no"]["id"], "boolean_value": True}
        ]
    }
    res = client.post("/api/public/forms/cust-sat-123/responses", json=bad_submission_rating)
    assert res.status_code == 400, f"Expected 400 for bad rating, got {res.status_code}"
    print("Validation 6f (Invalid rating rejected) PASSED:", res.json()["detail"])

    # 6g. Invalid yes_no value (Form 1)
    bad_submission_yn = {
        "answers": [
            {"question_id": f1_q["short_text"]["id"], "text_value": "Bob"},
            {"question_id": f1_q["rating"]["id"], "number_value": 5},
            {"question_id": f1_q["yes_no"]["id"], "text_value": "maybe"}
        ]
    }
    res = client.post("/api/public/forms/cust-sat-123/responses", json=bad_submission_yn)
    assert res.status_code == 400, f"Expected 400 for bad yes/no, got {res.status_code}"
    print("Validation 6g (Invalid yes/no rejected) PASSED:", res.json()["detail"])

    # 6h. Valid submission on Form 1
    valid_submission_1 = {
        "answers": [
            {"question_id": f1_q["short_text"]["id"], "text_value": "Charlie"},
            {"question_id": f1_q["rating"]["id"], "number_value": 5},
            {"question_id": f1_q["long_text"]["id"], "text_value": "Excellent experience!"},
            {"question_id": f1_q["yes_no"]["id"], "boolean_value": True}
        ]
    }
    res = client.post("/api/public/forms/cust-sat-123/responses", json=valid_submission_1)
    assert res.status_code == 200, f"Expected 200 for valid submission, got {res.status_code}: {res.text}"
    print("Validation 6h (Valid Form 1 submission accepted) PASSED!")

    # 6i. Valid submission on Form 2
    valid_submission_2 = {
        "answers": [
            {"question_id": f2_q["email"]["id"], "text_value": "attendee@techconf.org"},
            {"question_id": f2_q["number"]["id"], "number_value": 3},
            {"question_id": f2_q["dropdown"]["id"], "text_value": "AI"},
            {"question_id": f2_q["multiple_choice"]["id"], "text_value": "Vegetarian"}
        ]
    }
    res = client.post("/api/public/forms/event-reg-456/responses", json=valid_submission_2)
    assert res.status_code == 200, f"Expected 200 for valid submission, got {res.status_code}: {res.text}"
    print("Validation 6i (Valid Form 2 submission accepted) PASSED!")

    print("\n=== Test 7: Statistics Endpoint (GET /api/forms/{form_id}/stats) ===")
    res = client.get("/api/forms/1/stats", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    stats1 = res.json()
    assert stats1["form_id"] == 1
    assert stats1["total_responses"] >= 2
    print(f"Form 1 Total Responses: {stats1['total_responses']}")

    for q_stat in stats1["questions"]:
        print(f"- Form 1 Q: {q_stat['title']} ({q_stat['question_type']}) -> response count: {q_stat['response_count']}")
        if q_stat["yes_no_counts"]:
            print(f"  Yes/No counts: {q_stat['yes_no_counts']}")
        if q_stat["rating_stats"]:
            print(f"  Rating stats: {q_stat['rating_stats']}")
        if q_stat["text_answers"]:
            print(f"  Text answers: {q_stat['text_answers']}")

    res = client.get("/api/forms/2/stats", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    stats2 = res.json()
    assert stats2["form_id"] == 2
    assert stats2["total_responses"] >= 2
    print(f"\nForm 2 Total Responses: {stats2['total_responses']}")
    for q_stat in stats2["questions"]:
        print(f"- Form 2 Q: {q_stat['title']} ({q_stat['question_type']}) -> response count: {q_stat['response_count']}")
        if q_stat["option_counts"]:
            print(f"  Option counts: {q_stat['option_counts']}")
        if q_stat["number_stats"]:
            print(f"  Number stats: {q_stat['number_stats']}")
        if q_stat["text_answers"]:
            print(f"  Text answers: {q_stat['text_answers']}")

    print("Statistics endpoint PASSED for both forms!")


    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
