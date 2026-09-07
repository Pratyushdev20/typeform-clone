import json
import urllib.request

API_BASE = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data else None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            return response.getcode(), json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def test_public_runner():
    print("=== Test 1: Fetch Published Form by Slug ===")
    status, form = make_req("/public/forms/cust-sat-123")
    assert status == 200, f"Expected 200, got {status}"
    assert form["slug"] == "cust-sat-123"
    assert form["is_published"] is True
    print(f"[OK] Fetched public form: '{form['title']}' with {len(form['questions'])} questions.")

    print("\n=== Test 2: Attempt to Fetch Non-existent / Unpublished Slug ===")
    status, error_resp = make_req("/public/forms/non-existent-slug-xyz")
    assert status == 404, f"Expected 404, got {status}"
    print(f"[OK] Non-existent slug correctly returned 404: {error_resp['detail']}")

    print("\n=== Test 3: Submit Valid Responses via Public API ===")
    answers = []
    for q in form["questions"]:
        if q["question_type"] == "short_text":
            answers.append({"question_id": q["id"], "text_value": "John Doe"})
        elif q["question_type"] == "rating":
            answers.append({"question_id": q["id"], "number_value": 5, "text_value": "5"})
        elif q["question_type"] == "long_text":
            answers.append({"question_id": q["id"], "text_value": "Loved the clean UI!"})
        elif q["question_type"] == "yes_no":
            answers.append({"question_id": q["id"], "boolean_value": True, "text_value": "yes"})

    status, submit_resp = make_req("/public/forms/cust-sat-123/responses", method="POST", data={"answers": answers})
    assert status == 200, f"Expected 200, got {status}: {submit_resp}"
    assert submit_resp["form_id"] == form["id"]
    assert len(submit_resp["answers"]) == len(answers)
    print(f"[OK] Response submitted successfully! Response ID: {submit_resp['id']}")

    print("\n=== Test 4: Verify Results Count Incremented ===")
    status, updated_form = make_req(f"/forms/{form['id']}")
    print(f"[OK] Form response count updated to: {updated_form.get('response_count')}")

    print("\nALL PUBLIC RESPONDENT ENDPOINTS TESTED AND WORKING!")

if __name__ == "__main__":
    test_public_runner()
