"""
test_csv_export.py — End-to-end tests for GET /api/forms/{form_id}/export-csv
"""
import csv
import io
from fastapi.testclient import TestClient
from main import app
from seed import seed_data

client = TestClient(app)


def _signup_and_token(email: str, name: str = "Test User", password: str = "pass1234"):
    res = client.post("/api/auth/signup", json={"name": name, "email": email, "password": password})
    if res.status_code == 400:
        res = client.post("/api/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, f"login failed: {res.text}"
    return res.json()["access_token"]


def test_csv_export_full():
    seed_data()

    token = _signup_and_token("exporter@test.com", "Exporter")
    hdr = {"Authorization": f"Bearer {token}"}

    # Create form
    form_res = client.post("/api/forms/", json={"title": "Export, Test Form!", "description": ""}, headers=hdr)
    assert form_res.status_code == 200
    form = form_res.json()
    form_id = form["id"]
    print(f"Created form ID={form_id}")

    # Add questions
    q1 = client.post(f"/api/forms/{form_id}/questions", json={
        "title": "What is your name?", "question_type": "short_text", "is_required": True
    }, headers=hdr).json()
    q2 = client.post(f"/api/forms/{form_id}/questions", json={
        "title": "Rate us from 1-10", "question_type": "rating", "is_required": True
    }, headers=hdr).json()
    q3 = client.post(f"/api/forms/{form_id}/questions", json={
        "title": "Do you agree?", "question_type": "yes_no", "is_required": False
    }, headers=hdr).json()

    q1_id, q2_id, q3_id = q1["id"], q2["id"], q3["id"]

    # Test: Zero-response export returns valid header-only CSV
    res = client.get(f"/api/forms/{form_id}/export-csv", headers=hdr)
    assert res.status_code == 200, f"Empty export failed: {res.text}"
    assert "text/csv" in res.headers.get("content-type", "")
    reader = csv.reader(io.StringIO(res.text))
    rows = list(reader)
    assert len(rows) == 1, f"Expected header-only CSV, got {len(rows)} rows"
    assert "Response ID" in rows[0]
    assert "What is your name?" in rows[0]
    assert "Rate us from 1-10" in rows[0]
    assert "Do you agree?" in rows[0]
    print("PASS: Empty form returns header-only CSV")

    # Publish form
    client.put(f"/api/forms/{form_id}", json={"is_published": True}, headers=hdr)
    slug = client.get(f"/api/forms/{form_id}", headers=hdr).json()["slug"]

    # Submit 3 responses
    # Response 1: comma in name
    r1 = client.post(f"/api/public/forms/{slug}/responses", json={"answers": [
        {"question_id": q1_id, "text_value": "Doe, Jane"},
        {"question_id": q2_id, "number_value": 7},
        {"question_id": q3_id, "boolean_value": True},
    ]})
    assert r1.status_code == 200

    # Response 2: full
    r2 = client.post(f"/api/public/forms/{slug}/responses", json={"answers": [
        {"question_id": q1_id, "text_value": "Alice"},
        {"question_id": q2_id, "number_value": 5},
        {"question_id": q3_id, "boolean_value": False},
    ]})
    assert r2.status_code == 200

    # Response 3: q3 skipped (branching simulation)
    r3 = client.post(f"/api/public/forms/{slug}/responses", json={"answers": [
        {"question_id": q1_id, "text_value": "Bob"},
        {"question_id": q2_id, "number_value": 9},
    ]})
    assert r3.status_code == 200
    print("Submitted 3 responses")

    # Export and parse CSV
    export_res = client.get(f"/api/forms/{form_id}/export-csv", headers=hdr)
    assert export_res.status_code == 200, f"Export failed: {export_res.text}"
    assert "text/csv" in export_res.headers.get("content-type", "")

    content_disp = export_res.headers.get("content-disposition", "")
    assert ".csv" in content_disp, f"Expected .csv in Content-Disposition, got: {content_disp}"
    print(f"PASS: Content-Disposition: {content_disp}")

    reader = csv.reader(io.StringIO(export_res.text))
    rows = list(reader)

    # Header row
    assert len(rows) >= 4, f"Expected header + 3 data rows, got {len(rows)}"
    header = rows[0]
    assert header[0] == "Response ID"
    assert header[1] == "Submitted At"
    assert "What is your name?" in header
    assert "Rate us from 1-10" in header
    assert "Do you agree?" in header
    print("PASS: CSV headers correct")

    name_col = header.index("What is your name?")
    rating_col = header.index("Rate us from 1-10")
    agree_col = header.index("Do you agree?")

    data_rows = rows[1:]
    assert len(data_rows) == 3, f"Expected exactly 3 data rows, got {len(data_rows)}"
    print("PASS: 3 data rows present")

    names = [r[name_col] for r in data_rows]
    ratings = [r[rating_col] for r in data_rows]

    # Comma inside answer
    assert "Doe, Jane" in names, f"Expected 'Doe, Jane' in name column, got: {names}"
    print("PASS: Comma inside answer correctly handled")

    # Correct column mapping
    assert "Alice" in names
    assert "Bob" in names
    print("PASS: Answers mapped to correct question columns")

    # Numeric ratings
    assert any(r in ("7", "7.0") for r in ratings)
    assert any(r in ("5", "5.0") for r in ratings)
    assert any(r in ("9", "9.0") for r in ratings)
    print("PASS: Numeric answers correct")

    # Skipped question => empty cell
    bob_row = next(r for r in data_rows if r[name_col] == "Bob")
    assert bob_row[agree_col] == "", f"Expected empty cell for skipped q3, got: {bob_row[agree_col]!r}"
    print("PASS: Skipped question produces empty cell (branching logic)")

    # Authorization — another user cannot export
    token2 = _signup_and_token("evil@test.com", "Evil User")
    hdr2 = {"Authorization": f"Bearer {token2}"}
    res_forbidden = client.get(f"/api/forms/{form_id}/export-csv", headers=hdr2)
    assert res_forbidden.status_code == 403
    print("PASS: 403 for unauthorized user")

    # Import CSV still works
    csv_import = (
        "What is your name?,Rate us from 1-10,Do you agree?\n"
        "ImportedUser,8,Yes\n"
    )
    imp_res = client.post(f"/api/forms/{form_id}/import-csv", json={"csv_content": csv_import}, headers=hdr)
    assert imp_res.status_code == 200, f"Import CSV broken: {imp_res.text}"
    assert imp_res.json()["imported_count"] == 1
    print("PASS: Existing Import CSV feature not broken")

    # Re-export should now have 4 rows
    export_res2 = client.get(f"/api/forms/{form_id}/export-csv", headers=hdr)
    reader2 = csv.reader(io.StringIO(export_res2.text))
    rows2 = list(reader2)
    assert len(rows2) == 5, f"Expected header + 4 data rows after import, got {len(rows2)}"
    print("PASS: Re-export after import returns 4 responses")

    print("\nALL CSV EXPORT TESTS PASSED!")


if __name__ == "__main__":
    test_csv_export_full()
