import uuid
from app.core.database import SessionLocal, engine, Base
from app.models import models
from app.schemas.schemas import QuestionType
from datetime import datetime, timezone

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Clean up existing data for clean seed
    db.query(models.Answer).delete()
    db.query(models.Response).delete()
    db.query(models.QuestionOption).delete()
    db.query(models.Question).delete()
    db.query(models.Form).delete()
    db.commit()

    # Create Form 1
    form1 = models.Form(
        title="Customer Satisfaction Survey",
        description="We value your feedback to improve our services.",
        slug="cust-sat-123",
        is_published=True,
        thank_you_title="Thank you!",
        thank_you_message="Your feedback helps us grow."
    )
    db.add(form1)
    db.commit()
    db.refresh(form1)
    
    # Add questions for Form 1
    q1 = models.Question(form_id=form1.id, title="What is your name?", question_type=QuestionType.short_text, is_required=True, order_index=0)
    q2 = models.Question(form_id=form1.id, title="How would you rate our service?", question_type=QuestionType.rating, is_required=True, order_index=1)
    q3 = models.Question(form_id=form1.id, title="Please provide any additional comments.", question_type=QuestionType.long_text, is_required=False, order_index=2)
    q4 = models.Question(form_id=form1.id, title="Would you recommend us?", question_type=QuestionType.yes_no, is_required=True, order_index=3)
    
    db.add_all([q1, q2, q3, q4])
    db.commit()
    db.refresh(q4)
    
    # Create Form 2
    form2 = models.Form(
        title="Event Registration",
        description="Register for the upcoming tech conference.",
        slug="event-reg-456",
        is_published=True,
        thank_you_title="See you there!",
        thank_you_message="We've received your registration."
    )
    db.add(form2)
    db.commit()
    db.refresh(form2)
    
    # Add questions for Form 2
    q5 = models.Question(form_id=form2.id, title="What is your email address?", question_type=QuestionType.email, is_required=True, order_index=0)
    q6 = models.Question(form_id=form2.id, title="How many tickets do you need?", question_type=QuestionType.number, is_required=True, order_index=1)
    
    q7 = models.Question(form_id=form2.id, title="Which track are you most interested in?", question_type=QuestionType.dropdown, is_required=True, order_index=2)
    db.add(q7)
    db.commit()
    db.refresh(q7)
    for idx, opt in enumerate(["Frontend", "Backend", "AI", "DevOps"]):
        db.add(models.QuestionOption(question_id=q7.id, value=opt, order_index=idx))
    
    q8 = models.Question(form_id=form2.id, title="What are your dietary preferences?", question_type=QuestionType.multiple_choice, is_required=False, order_index=3)
    db.add(q8)
    db.commit()
    db.refresh(q8)
    for idx, opt in enumerate(["None", "Vegetarian", "Vegan", "Gluten-Free"]):
        db.add(models.QuestionOption(question_id=q8.id, value=opt, order_index=idx))
        
    db.add_all([q5, q6])
    db.commit()
    
    # Add some mock responses
    r1 = models.Response(form_id=form1.id)
    db.add(r1)
    db.commit()
    db.refresh(r1)
    db.add(models.Answer(response_id=r1.id, question_id=q1.id, text_value="Alice"))
    db.add(models.Answer(response_id=r1.id, question_id=q2.id, number_value=5.0))
    db.add(models.Answer(response_id=r1.id, question_id=q3.id, text_value="Great service!"))
    db.add(models.Answer(response_id=r1.id, question_id=q4.id, boolean_value=True))
    
    r2 = models.Response(form_id=form2.id)
    db.add(r2)
    db.commit()
    db.refresh(r2)
    db.add(models.Answer(response_id=r2.id, question_id=q5.id, text_value="bob@example.com"))
    db.add(models.Answer(response_id=r2.id, question_id=q6.id, number_value=2.0))
    db.add(models.Answer(response_id=r2.id, question_id=q7.id, text_value="Backend"))
    db.add(models.Answer(response_id=r2.id, question_id=q8.id, text_value="None"))

    db.commit()
    db.close()
    
    print("Database seeded successfully with 2 forms and sample responses.")

if __name__ == "__main__":
    seed_data()
