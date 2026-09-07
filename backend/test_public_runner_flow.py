import json
from fastapi.testclient import TestClient
from main import app
from seed import seed_data

client = TestClient(app)

def run_public_runner_e2e_tests():
    print("=== Step 0: Seed Database ===")
    seed_data()

    print("\n=== Step 1: Create a Full Form with all 8 Question Types ===")
    create_form_res = client.post("/api/forms/", json={
        "title": "Welcome to Your Request and Task Tracker",
        "description": "Easily organize your events, projects, and incoming requests.",
        "thank_you_title": "Thanks for completing this form",
        "thank_you_message": "Now create your own — it's free, easy & beautiful"
    })
    assert create_form_res.status_code == 200, f"Failed to create form: {create_form_res.text}"
    form = create_form_res.json()
    form_id = form["id"]
    slug = form["slug"]
    print(f"[OK] Created Form #{form_id} with Slug: '{slug}'")

    # Add all 8 question types
    questions_data = [
        {"title": "What is your full name?", "question_type": "short_text", "is_required": True, "order_index": 0},
        {"title": "Please provide your work email address", "question_type": "email", "is_required": True, "order_index": 1},
        {"title": "How many team members will participate?", "question_type": "number", "is_required": False, "order_index": 2},
        {"title": "Which department are you in?", "question_type": "multiple_choice", "is_required": True, "order_index": 3,
         "options": [{"value": "Engineering"}, {"value": "Design"}, {"value": "Product"}, {"value": "Marketing"}]},
        {"title": "Select your primary location", "question_type": "dropdown", "is_required": False, "order_index": 4,
         "options": [{"value": "San Francisco"}, {"value": "New York"}, {"value": "London"}, {"value": "Remote"}]},
        {"title": "Are you the main point of contact?", "question_type": "yes_no", "is_required": True, "order_index": 5},
        {"title": "How urgent is this request on a scale of 1-5?", "question_type": "rating", "is_required": True, "order_index": 6},
        {"title": "Any additional project notes or context?", "question_type": "long_text", "is_required": False, "order_index": 7},
    ]

    created_questions = []
    for q_data in questions_data:
        res = client.post(f"/api/forms/{form_id}/questions", json=q_data)
        assert res.status_code == 200, f"Failed to add question {q_data['title']}: {res.text}"
        created_questions.append(res.json())

    print(f"[OK] Added {len(created_questions)} questions spanning all 8 question types.")

    print("\n=== Step 2: Verify Unpublished Form is Rejected with 404 ===")
    pub_res = client.get(f"/api/public/forms/{slug}")
    assert pub_res.status_code == 404, f"Expected 404 for unpublished form, got {pub_res.status_code}"
    print("[OK] Unpublished form correctly returns 404.")

    print("\n=== Step 3: Publish the Form ===")
    publish_res = client.put(f"/api/forms/{form_id}", json={"is_published": True})
    assert publish_res.status_code == 200
    assert publish_res.json()["is_published"] is True
    print("[OK] Form published successfully.")

    print("\n=== Step 4: GET /api/public/forms/{slug} ===")
    pub_form_res = client.get(f"/api/public/forms/{slug}")
    assert pub_form_res.status_code == 200
    pub_form = pub_form_res.json()
    assert pub_form["title"] == "Welcome to Your Request and Task Tracker"
    assert pub_form["description"] == "Easily organize your events, projects, and incoming requests."
    assert len(pub_form["questions"]) == 8
    print(f"[OK] Public form loaded with {len(pub_form['questions'])} questions and correct metadata.")

    # Also test numeric ID lookup fallback in GET /api/public/forms/{id}
    pub_id_res = client.get(f"/api/public/forms/{form_id}")
    assert pub_id_res.status_code == 200
    print("[OK] Fallback numeric ID lookup in public router works properly.")

    print("\n=== Step 5: Test Validation Rejections ===")
    # 5a. Missing required field (name)
    invalid_sub_1 = client.post(f"/api/public/forms/{slug}/responses", json={
        "answers": [
            {"question_id": created_questions[0]["id"], "text_value": ""}, # required name empty
            {"question_id": created_questions[1]["id"], "text_value": "user@example.com"}
        ]
    })
    assert invalid_sub_1.status_code == 400
    print(f"[OK] Missing required field rejected: {invalid_sub_1.json()['detail']}")

    # 5b. Invalid email format
    invalid_sub_2 = client.post(f"/api/public/forms/{slug}/responses", json={
        "answers": [
            {"question_id": created_questions[0]["id"], "text_value": "Alex Doe"},
            {"question_id": created_questions[1]["id"], "text_value": "not-an-email"},
            {"question_id": created_questions[3]["id"], "text_value": "Engineering"},
            {"question_id": created_questions[5]["id"], "boolean_value": True},
            {"question_id": created_questions[6]["id"], "number_value": 4}
        ]
    })
    assert invalid_sub_2.status_code == 400
    print(f"[OK] Invalid email format rejected: {invalid_sub_2.json()['detail']}")

    # 5c. Invalid Multiple Choice option
    invalid_sub_3 = client.post(f"/api/public/forms/{slug}/responses", json={
        "answers": [
            {"question_id": created_questions[0]["id"], "text_value": "Alex Doe"},
            {"question_id": created_questions[1]["id"], "text_value": "alex@company.com"},
            {"question_id": created_questions[3]["id"], "text_value": "Astronomy"}, # invalid option
            {"question_id": created_questions[5]["id"], "boolean_value": True},
            {"question_id": created_questions[6]["id"], "number_value": 4}
        ]
    })
    assert invalid_sub_3.status_code == 400
    print(f"[OK] Invalid multiple choice option rejected: {invalid_sub_3.json()['detail']}")

    print("\n=== Step 6: Submit Complete Valid Response ===")
    valid_answers = [
        {"question_id": created_questions[0]["id"], "text_value": "Alex Doe"},
        {"question_id": created_questions[1]["id"], "text_value": "alex@company.com"},
        {"question_id": created_questions[2]["id"], "number_value": 5, "text_value": "5"},
        {"question_id": created_questions[3]["id"], "text_value": "Engineering"},
        {"question_id": created_questions[4]["id"], "text_value": "San Francisco"},
        {"question_id": created_questions[5]["id"], "boolean_value": True, "text_value": "yes"},
        {"question_id": created_questions[6]["id"], "number_value": 5, "text_value": "5"},
        {"question_id": created_questions[7]["id"], "text_value": "Everything looks great!"},
    ]

    valid_res = client.post(f"/api/public/forms/{slug}/responses", json={"answers": valid_answers})
    assert valid_res.status_code == 200, f"Valid submission failed: {valid_res.text}"
    saved_response = valid_res.json()
    assert saved_response["form_id"] == form_id
    assert len(saved_response["answers"]) == 8
    print(f"[OK] Response submitted successfully with ID: {saved_response['id']}")

    print("\n=== Step 7: Verify Response Appears in Results Page API ===")
    res_list = client.get(f"/api/forms/{form_id}/responses")
    assert res_list.status_code == 200
    responses = res_list.json()
    assert len(responses) == 1
    assert responses[0]["id"] == saved_response["id"]
    print(f"[OK] Response verified in GET /api/forms/{form_id}/responses")

    stats_res = client.get(f"/api/forms/{form_id}/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_responses"] == 1
    print(f"[OK] Total responses in stats endpoint: {stats['total_responses']}")

    print("\n====================================================")
    print("ALL 7 PUBLIC RUNNER FLOW STEPS PASSED SUCCESSFULLY!")
    print("====================================================")

if __name__ == "__main__":
    run_public_runner_e2e_tests()
