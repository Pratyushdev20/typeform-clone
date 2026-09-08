import os
import sys
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import models, crud
from app.schemas import schemas
from app.routers.public import validate_submission

class TestBranchingLogic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # In-memory SQLite for isolated test
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_full_branching_workflow(self):
        # 1. Create a user and form
        user = crud.create_user(self.db, "Branch User", "branch@example.com", "hash123")
        form = crud.create_form(
            self.db,
            schemas.FormCreate(title="Branching Survey", description="Testing conditional branching"),
            slug="branch-test-1",
            user_id=user.id
        )
        self.assertIsNotNone(form.id)

        # 2. Add questions
        # Q1: Yes/No - Are you employed?
        q1 = crud.create_question(
            self.db,
            form.id,
            schemas.QuestionCreate(
                title="Are you currently employed?",
                question_type=models.QuestionType.yes_no,
                is_required=True
            )
        )
        # Q2: Short text - What is your job title? (Required if employed)
        q2 = crud.create_question(
            self.db,
            form.id,
            schemas.QuestionCreate(
                title="What is your job title?",
                question_type=models.QuestionType.short_text,
                is_required=True
            )
        )
        # Q3: Multiple choice - Are you looking for work?
        q3 = crud.create_question(
            self.db,
            form.id,
            schemas.QuestionCreate(
                title="Are you actively looking for opportunities?",
                question_type=models.QuestionType.multiple_choice,
                is_required=True,
                options=[
                    schemas.QuestionOptionCreate(value="Yes, full-time", order_index=0),
                    schemas.QuestionOptionCreate(value="No, not interested", order_index=1)
                ]
            )
        )
        # Q4: Rating - Rate your satisfaction (1-5)
        q4 = crud.create_question(
            self.db,
            form.id,
            schemas.QuestionCreate(
                title="How satisfied are you with your career?",
                question_type=models.QuestionType.rating,
                is_required=False
            )
        )

        # 3. Add Logic Rules to Q1:
        # If "yes" -> Jump to Q2
        # If "no" -> Jump to Q3
        crud.update_question(
            self.db,
            q1.id,
            schemas.QuestionUpdate(
                logic_rules=[
                    schemas.LogicRuleUpdate(condition_value="yes", action="jump", destination_question_id=q2.id),
                    schemas.LogicRuleUpdate(condition_value="no", action="jump", destination_question_id=q3.id),
                ]
            )
        )

        # Refresh Q1 and verify rules persisted
        q1_refreshed = crud.get_question_by_id(self.db, q1.id)
        self.assertEqual(len(q1_refreshed.logic_rules), 2)
        rule_yes = next(r for r in q1_refreshed.logic_rules if r.condition_value == "yes")
        rule_no = next(r for r in q1_refreshed.logic_rules if r.condition_value == "no")
        self.assertEqual(rule_yes.destination_question_id, q2.id)
        self.assertEqual(rule_no.destination_question_id, q3.id)

        # Add Logic Rule to Q3: "No, not interested" -> End Form
        crud.update_question(
            self.db,
            q3.id,
            schemas.QuestionUpdate(
                logic_rules=[
                    schemas.LogicRuleUpdate(condition_value="No, not interested", action="end")
                ]
            )
        )
        q3_refreshed = crud.get_question_by_id(self.db, q3.id)
        self.assertEqual(len(q3_refreshed.logic_rules), 1)
        self.assertEqual(q3_refreshed.logic_rules[0].action, "end")
        self.assertIsNone(q3_refreshed.logic_rules[0].destination_question_id)

        # 4. Test Submission Validation with Skipped Questions:
        # Respondent answers "no" on Q1, skips Q2 (which is is_required=True), answers Q3 with "No, not interested" and ends form.
        resp_payload = schemas.ResponseCreate(
            answers=[
                schemas.AnswerCreate(question_id=q1.id, text_value="no", boolean_value=False),
                schemas.AnswerCreate(question_id=q3.id, text_value="No, not interested")
            ]
        )
        
        # Must pass validate_submission without failing on skipped Q2
        form_refreshed = crud.get_form_by_id(self.db, form.id)
        validate_submission(form_refreshed, resp_payload)

        # Save response to db
        db_resp = crud.create_response(self.db, form.id, resp_payload)
        self.assertIsNotNone(db_resp.id)
        self.assertEqual(len(db_resp.answers), 2)

        # 5. Test Form Duplication with Logic Rules
        duplicated = crud.duplicate_form(self.db, form.id, user_id=user.id)
        self.assertIsNotNone(duplicated)
        self.assertEqual(len(duplicated.questions), 4)

        dup_q1 = next(q for q in duplicated.questions if q.order_index == 0)
        dup_q2 = next(q for q in duplicated.questions if q.order_index == 1)
        dup_q3 = next(q for q in duplicated.questions if q.order_index == 2)

        self.assertEqual(len(dup_q1.logic_rules), 2)
        dup_rule_yes = next(r for r in dup_q1.logic_rules if r.condition_value == "yes")
        dup_rule_no = next(r for r in dup_q1.logic_rules if r.condition_value == "no")
        
        # Verify mapped to the NEW duplicated question IDs, not the old ones
        self.assertEqual(dup_rule_yes.destination_question_id, dup_q2.id)
        self.assertEqual(dup_rule_no.destination_question_id, dup_q3.id)

        print("All branching unit tests passed successfully!")

if __name__ == "__main__":
    unittest.main()
