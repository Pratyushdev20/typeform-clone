from fastapi.testclient import TestClient
from main import app
from seed import seed_data

client = TestClient(app)

def test_dnd_reorder_workflow():
    print("\n=== STEP 1: Seed fresh database ===")
    seed_data()

    print("\n=== STEP 2: Create a new Form and add 4 questions ===")
    create_form_res = client.post("/api/forms", json={
        "title": "DnD Question Reorder Test Form",
        "description": "Testing drag and drop reordering"
    })
    assert create_form_res.status_code == 200, create_form_res.text
    form_id = create_form_res.json()["id"]
    print(f"Created Form ID: {form_id}")

    # Add 4 distinct questions
    q_titles = [
        "Question 1: Short text",
        "Question 2: Multiple Choice",
        "Question 3: Rating",
        "Question 4: Email"
    ]
    q_types = ["short_text", "multiple_choice", "rating", "email"]
    created_q_ids = []

    for i in range(4):
        res = client.post(f"/api/forms/{form_id}/questions", json={
            "title": q_titles[i],
            "description": f"Description for {q_titles[i]}",
            "question_type": q_types[i],
            "is_required": i % 2 == 1,
            "options": [{"value": "Choice 1", "order_index": 0}, {"value": "Choice 2", "order_index": 1}] if q_types[i] == "multiple_choice" else []
        })
        assert res.status_code == 200, res.text
        created_q_ids.append(res.json()["id"])
        print(f"Added Q{i+1}: ID={res.json()['id']}, Title='{q_titles[i]}'")

    # Initial order: [Q1, Q2, Q3, Q4]
    form_res = client.get(f"/api/forms/{form_id}")
    initial_ids = [q["id"] for q in form_res.json()["questions"]]
    assert initial_ids == created_q_ids, f"Expected {created_q_ids}, got {initial_ids}"
    print(f"Initial Question Order: {initial_ids}")

    print("\n=== STEP 3: Drag Question 1 to Position 4 ===")
    # Simulating moving index 0 to index 3: [Q2, Q3, Q4, Q1]
    step3_order = [created_q_ids[1], created_q_ids[2], created_q_ids[3], created_q_ids[0]]
    reorder_res1 = client.put(f"/api/forms/{form_id}/questions/reorder", json={
        "question_ids": step3_order
    })
    assert reorder_res1.status_code == 200, reorder_res1.text

    # Verify persistence by refreshing/fetching form
    form_after_step3 = client.get(f"/api/forms/{form_id}").json()
    ids_after_step3 = [q["id"] for q in form_after_step3["questions"]]
    assert ids_after_step3 == step3_order, f"Expected {step3_order}, got {ids_after_step3}"
    print(f"After Drag Q1 -> Pos 4, Question Order: {ids_after_step3} (Verified persisted)")

    print("\n=== STEP 4: Drag another question to Position 1 ===")
    # Currently: [Q2, Q3, Q4, Q1]. Let's drag Q4 (at index 2) to position 1 (index 0): [Q4, Q2, Q3, Q1]
    step4_order = [created_q_ids[3], created_q_ids[1], created_q_ids[2], created_q_ids[0]]
    reorder_res2 = client.put(f"/api/forms/{form_id}/questions/reorder", json={
        "question_ids": step4_order
    })
    assert reorder_res2.status_code == 200, reorder_res2.text

    # Refresh the page / fetch form again and verify order persists
    form_after_step4 = client.get(f"/api/forms/{form_id}").json()
    ids_after_step4 = [q["id"] for q in form_after_step4["questions"]]
    assert ids_after_step4 == step4_order, f"Expected {step4_order}, got {ids_after_step4}"
    print(f"After Drag Q4 -> Pos 1, Question Order: {ids_after_step4} (Verified persisted)")

    print("\n=== STEP 5: Verify questions detail, options, and order_index fields ===")
    for idx, q in enumerate(form_after_step4["questions"]):
        assert q["id"] == step4_order[idx]
        assert q["order_index"] == idx
        print(f"Position {idx+1}: ID={q['id']}, Title='{q['title']}', Type='{q['question_type']}', order_index={q['order_index']}")

    print("\n=== ALL DRAG-AND-DROP REORDER WORKFLOW TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_dnd_reorder_workflow()
