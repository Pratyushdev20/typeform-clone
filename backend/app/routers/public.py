import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models import crud, models
from ..schemas import schemas

router = APIRouter(prefix="/api/public", tags=["public"])

def validate_submission(form: models.Form, response_in: schemas.ResponseCreate):
    questions_by_id = {q.id: q for q in form.questions}
    answers_by_qid = {}
    
    # 1. Check for invalid/foreign questions
    for ans in response_in.answers:
        if ans.question_id not in questions_by_id:
            raise HTTPException(
                status_code=400,
                detail=f"Question ID {ans.question_id} does not belong to this form."
            )
        answers_by_qid[ans.question_id] = ans
        
    # 2. Validate each question in the form
    for q_id, q in questions_by_id.items():
        ans = answers_by_qid.get(q_id)
        
        has_value = False
        if ans is not None:
            if ans.text_value is not None and str(ans.text_value).strip() != "":
                has_value = True
            elif ans.number_value is not None:
                has_value = True
            elif ans.boolean_value is not None:
                has_value = True
                
        # Required question check
        if q.is_required and not has_value:
            raise HTTPException(
                status_code=400,
                detail=f"Question '{q.title}' is required."
            )
            
        if not has_value:
            continue
            
        # Email format validation
        if q.question_type == models.QuestionType.email:
            email_val = str(ans.text_value).strip() if ans.text_value is not None else ""
            email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
            if not re.match(email_regex, email_val):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid email format for question '{q.title}'."
                )
                
        # Number values validation
        elif q.question_type == models.QuestionType.number:
            if ans.number_value is None:
                if ans.text_value is not None:
                    try:
                        ans.number_value = float(str(ans.text_value).strip())
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Value for question '{q.title}' must be a valid number."
                        )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Value for question '{q.title}' must be a valid number."
                    )
            if ans.text_value is None:
                ans.text_value = str(ans.number_value)
                
        # Multiple choice option validity
        elif q.question_type == models.QuestionType.multiple_choice:
            valid_options = [opt.value for opt in q.options]
            val = str(ans.text_value).strip() if ans.text_value is not None else ""
            if val not in valid_options:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid option '{val}' for question '{q.title}'. Allowed options: {valid_options}"
                )
                
        # Dropdown option validity
        elif q.question_type == models.QuestionType.dropdown:
            valid_options = [opt.value for opt in q.options]
            val = str(ans.text_value).strip() if ans.text_value is not None else ""
            if val not in valid_options:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid option '{val}' for question '{q.title}'. Allowed options: {valid_options}"
                )
                
        # Yes/No validity
        elif q.question_type == models.QuestionType.yes_no:
            if ans.boolean_value is None:
                if ans.text_value is not None:
                    t_val = str(ans.text_value).strip().lower()
                    if t_val in ["yes", "true", "1"]:
                        ans.boolean_value = True
                        ans.text_value = "yes"
                    elif t_val in ["no", "false", "0"]:
                        ans.boolean_value = False
                        ans.text_value = "no"
                    else:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid value for yes/no question '{q.title}'. Must be 'yes' or 'no'."
                        )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid value for yes/no question '{q.title}'. Must be 'yes' or 'no'."
                    )
            else:
                if ans.text_value is None:
                    ans.text_value = "yes" if ans.boolean_value else "no"
                    
        # Rating validity (1 to 10 integer)
        elif q.question_type == models.QuestionType.rating:
            val = None
            if ans.number_value is not None:
                val = ans.number_value
            elif ans.text_value is not None:
                try:
                    val = float(str(ans.text_value).strip())
                    ans.number_value = val
                except ValueError:
                    pass
            if val is None or not (1 <= val <= 10 and float(val).is_integer()):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid rating for question '{q.title}'. Rating must be an integer between 1 and 10."
                )

@router.get("/forms/{slug}", response_model=schemas.Form)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    db_form = crud.get_form_by_slug(db, slug=slug)
    if db_form is None or not db_form.is_published:
        raise HTTPException(status_code=404, detail="Form not found or not published")
    return db_form

@router.post("/forms/{slug}/responses", response_model=schemas.Response)
def submit_response(slug: str, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    db_form = crud.get_form_by_slug(db, slug=slug)
    if db_form is None or not db_form.is_published:
        raise HTTPException(status_code=404, detail="Form not found or not published")
        
    validate_submission(db_form, response)
    
    return crud.create_response(db, db_form.id, response)

