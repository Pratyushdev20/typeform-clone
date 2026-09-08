import json
from fastapi.testclient import TestClient
from main import app
from seed import seed_data

client = TestClient(app)

def make_req(endpoint, method="GET", data=None):
    if method == "GET":
        res = client.get(f"/api{endpoint}")
    elif method == "POST":
        res = client.post(f"/api{endpoint}", json=data)
    elif method == "PUT":
        res = client.put(f"/api{endpoint}", json=data)
    elif method == "DELETE":
        res = client.delete(f"/api{endpoint}")
    else:
        raise ValueError(f"Unsupported method: {method}")
    return res.status_code, res.json()

def test_form_builder_flow():
    print("=== Step 0: Reset Database ===")
    seed_data()

    print("\n=== Test 1: Load Existing Form (GET /api/forms/1) ===")
    status, form = make_req("/forms/1")
    assert status == 200
    assert form["title"] == "Customer Satisfaction Survey"
    initial_q_count = len(form["questions"])
    print(f"Loaded form: '{form['title']}' with {initial_q_count} questions.")

    print("\n=== Test 2: Edit Form Title & Description (PUT /api/forms/1) ===")
    status, updated_form = make_req("/forms/1", method="PUT", data={
        "title": "Customer Satisfaction Survey 2026",
        "description": "Updated description for 2026.",
        "thank_you_title": "All done!",
        "thank_you_message": "Thanks for taking the 2026 survey!"
    })
    assert status == 200
    assert updated_form["title"] == "Customer Satisfaction Survey 2026"
    assert updated_form["description"] == "Updated description for 2026."
    print("Form metadata updated successfully.")

    print("\n=== Test 3: Add all 8 Question Types (POST /api/forms/1/questions) ===")
    question_types = [
        ("short_text", "Short Text Question", []),
        ("long_text", "Long Text Question", []),
        ("multiple_choice", "Multiple Choice Question", [{"value": "Opt A", "order_index": 0}, {"value": "Opt B", "order_index": 1}]),
        ("dropdown", "Dropdown Question", [{"value": "Country 1", "order_index": 0}, {"value": "Country 2", "order_index": 1}]),
        ("email", "Email Question", []),
        ("number", "Number Question", []),
        ("yes_no", "Yes No Question", []),
        ("rating", "Rating Question", [])
    ]

    added_question_ids = []
    for q_type, title, opts in question_types:
        status, new_q = make_req("/forms/1/questions", method="POST", data={
            "title": title,
            "description": f"Help text for {q_type}",
            "question_type": q_type,
            "is_required": True,
            "options": opts
        })
        assert status == 200
        assert new_q["question_type"] == q_type
        assert new_q["title"] == title
        assert new_q["is_required"] is True
        added_question_ids.append(new_q["id"])
        print(f"[OK] Added {q_type} (ID: {new_q['id']}, Options: {len(new_q['options'])})")


    print("\n=== Test 4: Edit Question & Options (PUT /api/questions/{id}) ===")
    mc_q_id = added_question_ids[2] # multiple_choice
    status, updated_q = make_req(f"/questions/{mc_q_id}", method="PUT", data={
        "title": "How did you hear about us?",
        "description": "Please select the primary channel.",
        "is_required": False,
        "options": [
            {"value": "Search Engine", "order_index": 0},
            {"value": "Friend / Colleague", "order_index": 1},
            {"value": "Social Media", "order_index": 2}
        ]
    })
    assert status == 200
    assert updated_q["title"] == "How did you hear about us?"
    assert updated_q["is_required"] is False
    assert len(updated_q["options"]) == 3
    assert updated_q["options"][2]["value"] == "Social Media"
    print(f"Question {mc_q_id} updated with 3 options: {[o['value'] for o in updated_q['options']]}")

    print("\n=== Test 5: Reorder Questions (PUT /api/forms/1/questions/reorder) ===")
    status, form_before = make_req("/forms/1")
    current_ids = [q["id"] for q in form_before["questions"]]
    reversed_ids = list(reversed(current_ids))
    status, reorder_res = make_req("/forms/1/questions/reorder", method="PUT", data={
        "question_ids": reversed_ids
    })
    assert status == 200
    
    status, form_after = make_req("/forms/1")
    reordered_ids = [q["id"] for q in form_after["questions"]]
    assert reordered_ids == reversed_ids
    print(f"Questions reordered successfully! Old head: {current_ids[0]}, New head: {reordered_ids[0]}")

    print("\n=== Test 6: Delete a Question (DELETE /api/questions/{id}) ===")
    to_delete = added_question_ids[0] # short_text
    status, del_res = make_req(f"/questions/{to_delete}", method="DELETE")
    assert status == 200
    
    status, form_after_del = make_req("/forms/1")
    remaining_ids = [q["id"] for q in form_after_del["questions"]]
    assert to_delete not in remaining_ids
    print(f"Question {to_delete} deleted. Remaining count: {len(remaining_ids)}")

    print("\n=== Test 7: Toggle Publish Status & Verify Public Form Access ===")
    # Unpublish
    status, unpub_form = make_req("/forms/1", method="PUT", data={"is_published": False})
    assert unpub_form["is_published"] is False
    print("Form unpublished (Draft state).")

    # Publish
    status, pub_form = make_req("/forms/1", method="PUT", data={"is_published": True})
    assert pub_form["is_published"] is True
    print(f"Form published! Public slug: {pub_form['slug']}")

    # Verify public access works
    status, public_form = make_req(f"/public/forms/{pub_form['slug']}")
    assert status == 200
    assert public_form["title"] == "Customer Satisfaction Survey 2026"
    assert len(public_form["questions"]) == len(remaining_ids)
    print("Public form endpoint confirmed accessible with updated questions.")

    print("\n=== Test 8: Verify Complete Persistence After Full Reload ===")
    status, final_form = make_req("/forms/1")
    assert final_form["title"] == "Customer Satisfaction Survey 2026"
    assert final_form["description"] == "Updated description for 2026."
    assert final_form["thank_you_title"] == "All done!"
    assert final_form["thank_you_message"] == "Thanks for taking the 2026 survey!"
    assert final_form["is_published"] is True
    print("All form metadata, questions, options, order, and publish states fully persisted in SQLite DB!")

    print("\nALL FORM BUILDER E2E TESTS PASSED!")

if __name__ == "__main__":
    test_form_builder_flow()
