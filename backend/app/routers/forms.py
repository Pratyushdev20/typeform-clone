import csv
import io
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models import crud, models
from ..schemas import schemas

router = APIRouter(prefix="/api/forms", tags=["forms"])

def verify_form_ownership(form_id: int, current_user: models.User, db: Session) -> models.Form:
    db_form = crud.get_form_by_id(db, form_id=form_id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    
    if db_form.user_id is not None and db_form.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this form."
        )
    
    # Auto-claim unowned legacy seeded form for the first accessing user
    if db_form.user_id is None:
        db_form.user_id = current_user.id
        db.commit()
        db.refresh(db_form)
        
    return db_form

@router.get("/", response_model=List[schemas.Form])
def read_forms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Auto-claim legacy unowned forms if user has none
    user_forms = crud.get_forms(db, user_id=current_user.id, skip=skip, limit=limit)
    if not user_forms:
        unowned = db.query(models.Form).filter(models.Form.user_id == None).all()
        for f in unowned:
            f.user_id = current_user.id
        if unowned:
            db.commit()
        user_forms = crud.get_forms(db, user_id=current_user.id, skip=skip, limit=limit)
        
    for form in user_forms:
        form.response_count = len(form.responses)
    return user_forms

@router.post("/", response_model=schemas.Form)
def create_form(
    form: schemas.FormCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    slug = str(uuid.uuid4())[:8]
    return crud.create_form(db=db, form=form, slug=slug, user_id=current_user.id)

@router.get("/{form_id}", response_model=schemas.Form)
def read_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_form = verify_form_ownership(form_id, current_user, db)
    db_form.response_count = len(db_form.responses)
    return db_form

@router.put("/{form_id}", response_model=schemas.Form)
def update_form(
    form_id: int,
    form_update: schemas.FormUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    db_form = crud.update_form(db, form_id, form_update, user_id=current_user.id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.delete("/{form_id}")
def delete_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    success = crud.delete_form(db, form_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Form not found")
    return {"message": "Form deleted successfully"}

@router.post("/{form_id}/questions", response_model=schemas.Question)
def add_question(
    form_id: int,
    question: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    return crud.create_question(db, form_id, question)

@router.get("/{form_id}/responses", response_model=List[schemas.Response])
def get_responses(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    return crud.get_responses_for_form(db, form_id)

@router.post("/{form_id}/duplicate", response_model=schemas.Form)
def duplicate_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    db_form = crud.duplicate_form(db, form_id=form_id, user_id=current_user.id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.put("/{form_id}/questions/reorder")
def reorder_questions(
    form_id: int,
    reorder_data: schemas.QuestionReorder,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    success = crud.reorder_questions(db, form_id=form_id, question_ids=reorder_data.question_ids)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder questions. Ensure all question IDs belong to this form.")
    return {"message": "Questions reordered successfully"}

@router.get("/{form_id}/stats", response_model=schemas.FormStats)
def get_form_stats(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    stats = crud.get_form_stats(db, form_id=form_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return stats

@router.put("/{form_id}/questions/{question_id}", response_model=schemas.Question)
def update_form_question(
    form_id: int,
    question_id: int,
    question_update: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    db_question = crud.update_question(db, question_id, question_update)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question

@router.delete("/{form_id}/questions/{question_id}")
def delete_form_question(
    form_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_form_ownership(form_id, current_user, db)
    success = crud.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}

# ----------------------------------------------------
# CSV IMPORT ENDPOINT
# ----------------------------------------------------
@router.post("/{form_id}/import-csv", response_model=schemas.CSVImportResponse)
def import_responses_csv(
    form_id: int,
    payload: schemas.CSVImportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_form = verify_form_ownership(form_id, current_user, db)
    
    if not payload.csv_content and not payload.rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No responses found in this CSV file."
        )

    # Normalize questions mapping by normalized lowercase title
    questions = db_form.questions
    question_map = {q.title.strip().lower(): q for q in questions}
    # Also allow matching by question ID or prefix
    for q in questions:
        question_map[str(q.id)] = q

    responses_to_create: List[schemas.ResponseCreate] = []

    if payload.csv_content:
        csv_text = payload.csv_content.strip()
        if not csv_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No responses found in this CSV file."
            )
        
        f = io.StringIO(csv_text)
        reader = csv.reader(f)
        try:
            headers = next(reader, None)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid CSV file format: {str(e)}"
            )

        if not headers or len(headers) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No responses found in this CSV file."
            )

        # Match column indices to questions
        col_to_question = {}
        submitted_at_col = None
        unmatched_headers = []

        for idx, h in enumerate(headers):
            h_clean = h.strip()
            if not h_clean:
                continue
            h_lower = h_clean.lower()
            if h_lower in ["submitted at", "submitted_at", "submission time", "timestamp", "date"]:
                submitted_at_col = idx
            elif h_lower in question_map:
                col_to_question[idx] = question_map[h_lower]
            else:
                # Check for partial match or normalized punctuation
                found = False
                for q_title, q_obj in question_map.items():
                    if h_lower == q_title or h_lower.replace("?", "").strip() == q_title.replace("?", "").strip():
                        col_to_question[idx] = q_obj
                        found = True
                        break
                if not found:
                    unmatched_headers.append(h_clean)

        if not col_to_question:
            form_q_titles = [f"'{q.title}'" for q in questions]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV headers do not match any questions in this form. Unmatched: {', '.join(unmatched_headers)}. Form questions: {', '.join(form_q_titles)}"
            )

        row_index = 1
        for row in reader:
            row_index += 1
            # Skip completely empty rows
            if not row or all(str(cell).strip() == "" for cell in row):
                continue

            parsed_submitted_at = None
            if submitted_at_col is not None and submitted_at_col < len(row):
                raw_time = row[submitted_at_col].strip()
                if raw_time:
                    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
                        try:
                            parsed_submitted_at = datetime.strptime(raw_time, fmt).replace(tzinfo=timezone.utc)
                            break
                        except ValueError:
                            pass

            answers: List[schemas.AnswerCreate] = []

            for col_idx, question in col_to_question.items():
                if col_idx >= len(row):
                    continue
                raw_val = row[col_idx].strip()
                if not raw_val:
                    continue

                # Type-specific validation
                text_val = None
                number_val = None
                bool_val = None

                if question.question_type == models.QuestionType.rating:
                    try:
                        num = float(raw_val)
                        if not num.is_integer() or not (1 <= num <= 10):
                            raise ValueError()
                        number_val = num
                        text_val = str(int(num))
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Row {row_index}: Invalid rating '{raw_val}' for question '{question.title}'. Must be an integer between 1 and 10."
                        )

                elif question.question_type == models.QuestionType.yes_no:
                    t_lower = raw_val.lower()
                    if t_lower in ["yes", "true", "1", "y"]:
                        bool_val = True
                        text_val = "yes"
                    elif t_lower in ["no", "false", "0", "n"]:
                        bool_val = False
                        text_val = "no"
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Row {row_index}: Invalid yes/no value '{raw_val}' for question '{question.title}'. Must be 'yes' or 'no'."
                        )

                elif question.question_type in [models.QuestionType.multiple_choice, models.QuestionType.dropdown]:
                    valid_options = [opt.value for opt in question.options]
                    # Check case-insensitive match
                    matched_opt = None
                    for opt in valid_options:
                        if opt.strip().lower() == raw_val.lower():
                            matched_opt = opt
                            break
                    if matched_opt:
                        text_val = matched_opt
                    elif valid_options:
                        # Reject if doesn't match available options
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Row {row_index}: Invalid option '{raw_val}' for question '{question.title}'. Allowed options: {valid_options}"
                        )
                    else:
                        text_val = raw_val

                elif question.question_type == models.QuestionType.number:
                    try:
                        number_val = float(raw_val)
                        text_val = str(number_val)
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Row {row_index}: Invalid number '{raw_val}' for question '{question.title}'."
                        )

                elif question.question_type == models.QuestionType.email:
                    email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
                    if not re.match(email_regex, raw_val):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Row {row_index}: Invalid email '{raw_val}' for question '{question.title}'."
                        )
                    text_val = raw_val

                else:
                    # short_text, long_text
                    text_val = raw_val

                answers.append(schemas.AnswerCreate(
                    question_id=question.id,
                    text_value=text_val,
                    number_value=number_val,
                    boolean_value=bool_val
                ))

            if answers:
                responses_to_create.append(schemas.ResponseCreate(
                    answers=answers,
                    submitted_at=parsed_submitted_at or datetime.now(timezone.utc)
                ))

    if not responses_to_create:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No responses found in this CSV file."
        )

    imported_count = crud.bulk_create_responses(db, form_id, responses_to_create)
    all_responses = crud.get_responses_for_form(db, form_id)

    return {
        "imported_count": imported_count,
        "total_responses": len(all_responses),
        "message": f"Successfully imported {imported_count} response(s)."
    }
