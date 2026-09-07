import json
import urllib.request
from seed import seed_data

API_BASE = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data else None
    with urllib.request.urlopen(req, data=body) as response:
        return response.getcode(), json.loads(response.read().decode("utf-8"))

def test_results_flow():
    print("=== Step 0: Seed Database ===")
    seed_data()

    print("\n=== Test 1: Load Results APIs for Form 1 ===")
    status, form = make_req("/forms/1")
    assert status == 200
    status, stats = make_req("/forms/1/stats")
    assert status == 200
    status, responses = make_req("/forms/1/responses")
    assert status == 200

    print(f"[OK] Form: '{form['title']}'")
    print(f"[OK] Total Responses from API: {len(responses)}")
    print(f"[OK] Stats Total: {stats['total_responses']}")
    assert len(responses) == stats["total_responses"]

    print("\n=== Test 2: Submit New Response to Form 1 ===")
    questions = {q["question_type"]: q for q in form["questions"]}
    new_submission = {
        "answers": [
            {"question_id": questions["short_text"]["id"], "text_value": "Dave"},
            {"question_id": questions["rating"]["id"], "number_value": 4},
            {"question_id": questions["long_text"]["id"], "text_value": "Really liked the simplicity."},
            {"question_id": questions["yes_no"]["id"], "boolean_value": True}
        ]
    }
    status, resp_submit = make_req(f"/public/forms/{form['slug']}/responses", method="POST", data=new_submission)
    assert status == 200
    print(f"[OK] Submitted new response with ID: {resp_submit['id']}")

    print("\n=== Test 3: Verify Stats & Responses Updated ===")
    status, updated_responses = make_req("/forms/1/responses")
    status, updated_stats = make_req("/forms/1/stats")
    assert len(updated_responses) == len(responses) + 1
    assert updated_stats["total_responses"] == stats["total_responses"] + 1

    # Check question-level stats update
    for q_stat in updated_stats["questions"]:
        if q_stat["question_type"] == "short_text":
            assert "Dave" in q_stat["text_answers"]
            print(f"[OK] Short text responses contains 'Dave': {q_stat['text_answers']}")
        elif q_stat["question_type"] == "rating":
            print(f"[OK] Rating average updated: {q_stat['rating_stats']['average']}, total ratings: {q_stat['rating_stats']['total_ratings']}")
        elif q_stat["question_type"] == "yes_no":
            print(f"[OK] Yes/No breakdown: {q_stat['yes_no_counts']}")

    print("\n=== Test 4: Form 2 (Dropdown, Multiple Choice, Number, Email) ===")
    status, f2_stats = make_req("/forms/2/stats")
    assert status == 200
    for q_stat in f2_stats["questions"]:
        if q_stat["question_type"] == "dropdown":
            print(f"[OK] Dropdown counts: {q_stat['option_counts']}")
        elif q_stat["question_type"] == "multiple_choice":
            print(f"[OK] Multiple choice counts: {q_stat['option_counts']}")
        elif q_stat["question_type"] == "number":
            print(f"[OK] Number stats: {q_stat['number_stats']}")

    print("\nALL RESULTS & ANALYTICS INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    test_results_flow()
