import unittest
import uuid
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.database import SessionLocal, engine, Base
from app.models import models, crud
from app.core.auth import hash_password

class TestStarterFormsIdempotency(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_new_user_gets_at_least_two_forms(self):
        test_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
        user = crud.create_user(
            self.db,
            name="Test Explorer",
            email=test_email,
            password_hash=hash_password("password123")
        )
        self.assertIsNotNone(user.id)

        # 1. Initial check: user starts with 0 forms
        initial_forms = self.db.query(models.Form).filter(models.Form.user_id == user.id).all()
        
        # 2. Call ensure_user_starter_forms
        forms = crud.ensure_user_starter_forms(self.db, user.id)
        self.assertGreaterEqual(len(forms), 2, "New user must have at least 2 starter forms")

        form1 = forms[0]
        form2 = forms[1]

        self.assertTrue(len(form1.questions) > 0, "Form 1 should have questions")
        self.assertTrue(len(form2.questions) > 0, "Form 2 should have questions")
        self.assertTrue(form1.is_published, "Starter form 1 should be published")
        self.assertTrue(form2.is_published, "Starter form 2 should be published")

        # 3. Test Idempotency: Calling ensure_user_starter_forms again MUST NOT create duplicates
        forms_again = crud.ensure_user_starter_forms(self.db, user.id)
        self.assertEqual(len(forms_again), len(forms), "Calling starter forms check again must not create duplicates")

        # Repeat 5 times
        for _ in range(5):
            forms_repeat = crud.ensure_user_starter_forms(self.db, user.id)
            self.assertEqual(len(forms_repeat), len(forms))

        # 4. Existing user with 3+ forms should never get extra starter forms added
        new_form = models.Form(
            title="Custom 3rd Form",
            description="My own form",
            slug=uuid.uuid4().hex[:8],
            user_id=user.id,
            is_published=False
        )
        self.db.add(new_form)
        self.db.commit()

        forms_after_3rd = crud.ensure_user_starter_forms(self.db, user.id)
        self.assertEqual(len(forms_after_3rd), 3, "User with 3 forms must retain exactly 3 forms")

        print("[OK] All 2-starter-forms idempotency and duplicate prevention tests passed!")

if __name__ == "__main__":
    unittest.main()
