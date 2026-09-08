import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from . import models
from ..schemas import schemas

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email.lower().strip()).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, name: str, email: str, password_hash: str):
    db_user = models.User(
        name=name.strip(),
        email=email.lower().strip(),
        password_hash=password_hash
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_forms(db: Session, user_id: Optional[int] = None, skip: int = 0, limit: int = 100, published_only: bool = False):
    query = db.query(models.Form)
    if user_id is not None:
        query = query.filter(models.Form.user_id == user_id)
    if published_only:
        query = query.filter(models.Form.is_published == True)
    return query.offset(skip).limit(limit).all()

def ensure_user_starter_forms(db: Session, user_id: int) -> List[models.Form]:
    existing_forms = db.query(models.Form).filter(models.Form.user_id == user_id).all()
    if len(existing_forms) >= 2:
        return existing_forms

    # Check for unowned legacy forms and assign if available
    unowned = db.query(models.Form).filter(models.Form.user_id == None).all()
    for f in unowned:
        if len(existing_forms) < 2:
            f.user_id = user_id
            existing_forms.append(f)
    if unowned:
        db.commit()

    if len(existing_forms) >= 2:
        return existing_forms

    starter_templates = [
        {
            "title": "Product Feedback Survey",
            "description": "Help us improve by sharing your thoughts and experience.",
            "thank_you_title": "Thank you for your feedback!",
            "thank_you_message": "Your input is invaluable in shaping our future updates.",
            "is_published": True,
            "questions": [
                {
                    "title": "How did you first discover our product?",
                    "description": "Select the option that best describes how you found us.",
                    "question_type": models.QuestionType.multiple_choice,
                    "is_required": True,
                    "order_index": 0,
                    "options": ["Social Media", "Search Engine (Google/Bing)", "Friend or Colleague", "Online Community / Forum"]
                },
                {
                    "title": "How would you rate your overall satisfaction?",
                    "description": "1 is lowest, 5 is highest rating.",
                    "question_type": models.QuestionType.rating,
                    "is_required": True,
                    "order_index": 1,
                    "options": []
                },
                {
                    "title": "Would you recommend our product to a colleague?",
                    "description": "Your recommendation helps us grow our community.",
                    "question_type": models.QuestionType.yes_no,
                    "is_required": False,
                    "order_index": 2,
                    "options": []
                },
                {
                    "title": "What is the single most important feature we could add?",
                    "description": "Please provide any ideas or pain points you've encountered.",
                    "question_type": models.QuestionType.long_text,
                    "is_required": False,
                    "order_index": 3,
                    "options": []
                }
            ]
        },
        {
            "title": "Event Registration & RSVP",
            "description": "Sign up for our upcoming interactive workshop and product showcase.",
            "thank_you_title": "You're all registered!",
            "thank_you_message": "We've sent a calendar invite and access link to your email address.",
            "is_published": True,
            "questions": [
                {
                    "title": "What is your full name?",
                    "description": "Enter your first and last name.",
                    "question_type": models.QuestionType.short_text,
                    "is_required": True,
                    "order_index": 0,
                    "options": []
                },
                {
                    "title": "What is your primary email address?",
                    "description": "We will send your event confirmation ticket here.",
                    "question_type": models.QuestionType.email,
                    "is_required": True,
                    "order_index": 1,
                    "options": []
                },
                {
                    "title": "Will you be attending in person or virtually?",
                    "description": "Choose your preferred attendance format.",
                    "question_type": models.QuestionType.yes_no,
                    "is_required": True,
                    "order_index": 2,
                    "options": []
                },
                {
                    "title": "Which workshop track are you most interested in?",
                    "description": "Select the track you plan to join.",
                    "question_type": models.QuestionType.dropdown,
                    "is_required": False,
                    "order_index": 3,
                    "options": ["Track 1: Building High-Converting Conversational Forms", "Track 2: Advanced Conditional Logic & Workflow Automation", "Track 3: CSV Data Import & Real-Time Analytics"]
                }
            ]
        }
    ]

    existing_titles = {f.title for f in existing_forms}
    for template in starter_templates:
        if len(existing_forms) >= 2:
            break

        slug = str(uuid.uuid4())[:8]
        while db.query(models.Form).filter(models.Form.slug == slug).first():
            slug = str(uuid.uuid4())[:8]

        title = template["title"]
        if title in existing_titles:
            title = f"{title} (Starter)"

        new_form = models.Form(
            title=title,
            description=template["description"],
            thank_you_title=template["thank_you_title"],
            thank_you_message=template["thank_you_message"],
            slug=slug,
            is_published=template["is_published"],
            user_id=user_id
        )
        db.add(new_form)
        db.commit()
        db.refresh(new_form)

        for q_data in template["questions"]:
            new_q = models.Question(
                form_id=new_form.id,
                title=q_data["title"],
                description=q_data["description"],
                question_type=q_data["question_type"],
                is_required=q_data["is_required"],
                order_index=q_data["order_index"]
            )
            db.add(new_q)
            db.commit()
            db.refresh(new_q)

            for opt_idx, opt_text in enumerate(q_data["options"]):
                new_opt = models.QuestionOption(
                    question_id=new_q.id,
                    value=opt_text,
                    order_index=opt_idx
                )
                db.add(new_opt)
            if q_data["options"]:
                db.commit()

        db.refresh(new_form)
        existing_forms.append(new_form)
        existing_titles.add(new_form.title)

    return existing_forms

def get_form_by_id(db: Session, form_id: int, user_id: Optional[int] = None):
    query = db.query(models.Form).filter(models.Form.id == form_id)
    if user_id is not None:
        query = query.filter(models.Form.user_id == user_id)
    return query.first()

def get_form_by_slug(db: Session, slug: str):
    form = db.query(models.Form).filter(models.Form.slug == slug).first()
    if not form and slug.isdigit():
        form = db.query(models.Form).filter(models.Form.id == int(slug)).first()
    return form

def create_form(db: Session, form: schemas.FormCreate, slug: str, user_id: Optional[int] = None):
    db_form = models.Form(**form.model_dump(), slug=slug, user_id=user_id)
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return db_form

def update_form(db: Session, form_id: int, form_update: schemas.FormUpdate, user_id: Optional[int] = None):
    db_form = get_form_by_id(db, form_id, user_id=user_id)
    if db_form:
        update_data = form_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_form, key, value)
        db.commit()
        db.refresh(db_form)
    return db_form

def delete_form(db: Session, form_id: int, user_id: Optional[int] = None):
    db_form = get_form_by_id(db, form_id, user_id=user_id)
    if db_form:
        db.delete(db_form)
        db.commit()
        return True
    return False

def duplicate_form(db: Session, form_id: int, user_id: Optional[int] = None):
    original_form = get_form_by_id(db, form_id, user_id=user_id)
    if not original_form:
        return None
        
    new_slug = str(uuid.uuid4())[:8]
    while get_form_by_slug(db, new_slug):
        new_slug = str(uuid.uuid4())[:8]
        
    new_form = models.Form(
        title=f"{original_form.title} (Copy)",
        description=original_form.description,
        thank_you_title=original_form.thank_you_title,
        thank_you_message=original_form.thank_you_message,
        slug=new_slug,
        is_published=False,
        user_id=user_id or original_form.user_id
    )
    db.add(new_form)
    db.commit()
    db.refresh(new_form)
    
    sorted_questions = sorted(original_form.questions, key=lambda q: q.order_index)
    old_to_new_qid = {}
    for q in sorted_questions:
        new_question = models.Question(
            form_id=new_form.id,
            title=q.title,
            description=q.description,
            question_type=q.question_type,
            is_required=q.is_required,
            order_index=q.order_index
        )
        db.add(new_question)
        db.commit()
        db.refresh(new_question)
        old_to_new_qid[q.id] = new_question.id
        
        sorted_options = sorted(q.options, key=lambda opt: opt.order_index)
        for opt in sorted_options:
            new_opt = models.QuestionOption(
                question_id=new_question.id,
                value=opt.value,
                order_index=opt.order_index
            )
            db.add(new_opt)
        db.commit()

    # Duplicate logic rules mapping destination questions
    for q in sorted_questions:
        new_qid = old_to_new_qid.get(q.id)
        if not new_qid:
            continue
        for rule in q.logic_rules:
            dest_qid = old_to_new_qid.get(rule.destination_question_id) if rule.destination_question_id else None
            db_rule = models.LogicRule(
                question_id=new_qid,
                condition_value=rule.condition_value,
                action=rule.action,
                destination_question_id=dest_qid
            )
            db.add(db_rule)
    db.commit()
        
    db.refresh(new_form)
    return new_form

def get_question_by_id(db: Session, question_id: int):
    return db.query(models.Question).filter(models.Question.id == question_id).first()

def create_question(db: Session, form_id: int, question: schemas.QuestionCreate):
    # Determine order index
    max_order = db.query(models.Question).filter(models.Question.form_id == form_id).count()
    
    db_question = models.Question(
        form_id=form_id,
        title=question.title,
        description=question.description,
        question_type=question.question_type,
        is_required=question.is_required,
        order_index=max_order
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    if question.options:
        for idx, opt in enumerate(question.options):
            db_opt = models.QuestionOption(
                question_id=db_question.id,
                value=opt.value,
                order_index=idx
            )
            db.add(db_opt)
        db.commit()

    if question.logic_rules:
        for rule in question.logic_rules:
            # Validate destination question
            dest_id = rule.destination_question_id
            if dest_id == db_question.id:
                dest_id = None
            db_rule = models.LogicRule(
                question_id=db_question.id,
                condition_value=rule.condition_value,
                action=rule.action,
                destination_question_id=dest_id
            )
            db.add(db_rule)
        db.commit()
        
    db.refresh(db_question)
    return db_question

def update_question(db: Session, question_id: int, question_update: schemas.QuestionUpdate):
    db_question = get_question_by_id(db, question_id)
    if not db_question:
        return None
        
    update_data = question_update.model_dump(exclude_unset=True)
    
    for field in ["title", "description", "question_type", "is_required", "order_index"]:
        if field in update_data and update_data[field] is not None:
            setattr(db_question, field, update_data[field])
            
    if "options" in update_data and update_data["options"] is not None:
        db.query(models.QuestionOption).filter(models.QuestionOption.question_id == question_id).delete()
        for idx, opt in enumerate(question_update.options):
            val = opt.value if hasattr(opt, "value") else str(opt)
            ord_idx = opt.order_index if (hasattr(opt, "order_index") and opt.order_index is not None and opt.order_index != 0) else idx
            db_opt = models.QuestionOption(
                question_id=db_question.id,
                value=val,
                order_index=ord_idx
            )
            db.add(db_opt)

    if "logic_rules" in update_data and update_data["logic_rules"] is not None:
        db.query(models.LogicRule).filter(models.LogicRule.question_id == question_id).delete()
        # Find all valid sibling question IDs in the same form
        valid_dest_ids = {
            q.id for q in db.query(models.Question.id).filter(
                models.Question.form_id == db_question.form_id,
                models.Question.id != question_id
            ).all()
        }
        
        for rule in question_update.logic_rules:
            action = rule.action if hasattr(rule, "action") else "jump"
            dest_id = rule.destination_question_id if hasattr(rule, "destination_question_id") else None
            cond_val = rule.condition_value if hasattr(rule, "condition_value") else ""

            # Check rule validity
            if action == "jump":
                if dest_id is None or dest_id not in valid_dest_ids:
                    # If invalid destination, default to "next"
                    action = "next"
                    dest_id = None
            elif action in ["end", "next"]:
                dest_id = None

            db_rule = models.LogicRule(
                question_id=db_question.id,
                condition_value=str(cond_val),
                action=action,
                destination_question_id=dest_id
            )
            db.add(db_rule)
            
    db.commit()
    db.refresh(db_question)
    return db_question

def delete_question(db: Session, question_id: int) -> bool:
    db_question = get_question_by_id(db, question_id)
    if not db_question:
        return False
    db.delete(db_question)
    db.commit()
    return True

def reorder_questions(db: Session, form_id: int, question_ids: List[int]) -> bool:
    form = get_form_by_id(db, form_id)
    if not form:
        return False
        
    existing_ids = {q.id for q in form.questions}
    if not set(question_ids).issubset(existing_ids):
        return False
        
    for index, q_id in enumerate(question_ids):
        db.query(models.Question).filter(
            models.Question.id == q_id,
            models.Question.form_id == form_id
        ).update({"order_index": index})
        
    db.commit()
    return True

def get_responses_for_form(db: Session, form_id: int):
    return db.query(models.Response).filter(models.Response.form_id == form_id).all()

def create_response(db: Session, form_id: int, response: schemas.ResponseCreate):
    kwargs = {"form_id": form_id}
    if response.submitted_at is not None:
        kwargs["submitted_at"] = response.submitted_at
    db_response = models.Response(**kwargs)
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    
    for ans in response.answers:
        db_answer = models.Answer(
            response_id=db_response.id,
            question_id=ans.question_id,
            text_value=ans.text_value,
            number_value=ans.number_value,
            boolean_value=ans.boolean_value
        )
        db.add(db_answer)
    
    db.commit()
    db.refresh(db_response)
    return db_response

def bulk_create_responses(db: Session, form_id: int, responses: List[schemas.ResponseCreate]) -> int:
    created_count = 0
    for resp in responses:
        kwargs = {"form_id": form_id}
        if resp.submitted_at is not None:
            kwargs["submitted_at"] = resp.submitted_at
        db_response = models.Response(**kwargs)
        db.add(db_response)
        db.flush()  # gets db_response.id without committing
        
        for ans in resp.answers:
            db_answer = models.Answer(
                response_id=db_response.id,
                question_id=ans.question_id,
                text_value=ans.text_value,
                number_value=ans.number_value,
                boolean_value=ans.boolean_value
            )
            db.add(db_answer)
        created_count += 1
        
    db.commit()
    return created_count

def get_form_stats(db: Session, form_id: int):
    form = get_form_by_id(db, form_id)
    if not form:
        return None
        
    responses = db.query(models.Response).filter(models.Response.form_id == form_id).all()
    total_responses = len(responses)
    
    questions_stats = []
    sorted_questions = sorted(form.questions, key=lambda q: q.order_index)
    
    for q in sorted_questions:
        answers = db.query(models.Answer).join(models.Response).filter(
            models.Response.form_id == form_id,
            models.Answer.question_id == q.id
        ).all()
        
        valid_answers = []
        for a in answers:
            if a.text_value is not None and str(a.text_value).strip() != "":
                valid_answers.append(a)
            elif a.number_value is not None:
                valid_answers.append(a)
            elif a.boolean_value is not None:
                valid_answers.append(a)
                
        q_stat = {
            "question_id": q.id,
            "title": q.title,
            "question_type": q.question_type,
            "response_count": len(valid_answers),
            "option_counts": None,
            "yes_no_counts": None,
            "rating_stats": None,
            "number_stats": None,
            "text_answers": None,
        }
        
        if q.question_type in [models.QuestionType.multiple_choice, models.QuestionType.dropdown]:
            counts = {opt.value: 0 for opt in q.options}
            for a in valid_answers:
                val = str(a.text_value).strip() if a.text_value is not None else ""
                if val in counts:
                    counts[val] += 1
                elif val:
                    counts[val] = counts.get(val, 0) + 1
            q_stat["option_counts"] = counts
            
        elif q.question_type == models.QuestionType.yes_no:
            counts = {"yes": 0, "no": 0}
            for a in valid_answers:
                if a.boolean_value is True or (a.text_value and str(a.text_value).strip().lower() in ["yes", "true", "1"]):
                    counts["yes"] += 1
                elif a.boolean_value is False or (a.text_value and str(a.text_value).strip().lower() in ["no", "false", "0"]):
                    counts["no"] += 1
            q_stat["yes_no_counts"] = counts
            
        elif q.question_type == models.QuestionType.rating:
            ratings = []
            distribution = {}
            for a in valid_answers:
                r_val = None
                if a.number_value is not None:
                    r_val = int(a.number_value)
                elif a.text_value is not None:
                    try:
                        r_val = int(float(str(a.text_value).strip()))
                    except ValueError:
                        pass
                if r_val is not None:
                    ratings.append(r_val)
                    distribution[str(r_val)] = distribution.get(str(r_val), 0) + 1
                    
            avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
            q_stat["rating_stats"] = {
                "average": avg_rating,
                "distribution": distribution,
                "total_ratings": len(ratings)
            }
            
        elif q.question_type == models.QuestionType.number:
            numbers = []
            for a in valid_answers:
                n_val = None
                if a.number_value is not None:
                    n_val = a.number_value
                elif a.text_value is not None:
                    try:
                        n_val = float(str(a.text_value).strip())
                    except ValueError:
                        pass
                if n_val is not None:
                    numbers.append(n_val)
            if numbers:
                q_stat["number_stats"] = {
                    "min": min(numbers),
                    "max": max(numbers),
                    "average": round(sum(numbers) / len(numbers), 2),
                    "count": len(numbers)
                }
            else:
                q_stat["number_stats"] = {
                    "min": 0,
                    "max": 0,
                    "average": 0.0,
                    "count": 0
                }
                
        elif q.question_type in [models.QuestionType.short_text, models.QuestionType.long_text, models.QuestionType.email]:
            q_stat["text_answers"] = [
                str(a.text_value) for a in valid_answers if a.text_value is not None and str(a.text_value).strip() != ""
            ]
            
        questions_stats.append(q_stat)
        
    return {
        "form_id": form.id,
        "title": form.title,
        "total_responses": total_responses,
        "questions": questions_stats
    }

