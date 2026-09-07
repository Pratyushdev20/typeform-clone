from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..core.database import get_db
from ..models import crud
from ..schemas import schemas

router = APIRouter(prefix="/api/forms", tags=["forms"])

@router.get("/", response_model=List[schemas.Form])
def read_forms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    forms = crud.get_forms(db, skip=skip, limit=limit)
    for form in forms:
        form.response_count = len(form.responses)
    return forms

@router.post("/", response_model=schemas.Form)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    slug = str(uuid.uuid4())[:8] # Simple slug generation
    return crud.create_form(db=db, form=form, slug=slug)

@router.get("/{form_id}", response_model=schemas.Form)
def read_form(form_id: int, db: Session = Depends(get_db)):
    db_form = crud.get_form_by_id(db, form_id=form_id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    db_form.response_count = len(db_form.responses)
    return db_form


@router.put("/{form_id}", response_model=schemas.Form)
def update_form(form_id: int, form_update: schemas.FormUpdate, db: Session = Depends(get_db)):
    db_form = crud.update_form(db, form_id, form_update)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.delete("/{form_id}")
def delete_form(form_id: int, db: Session = Depends(get_db)):
    success = crud.delete_form(db, form_id)
    if not success:
        raise HTTPException(status_code=404, detail="Form not found")
    return {"message": "Form deleted successfully"}

@router.post("/{form_id}/questions", response_model=schemas.Question)
def add_question(form_id: int, question: schemas.QuestionCreate, db: Session = Depends(get_db)):
    db_form = crud.get_form_by_id(db, form_id=form_id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.create_question(db, form_id, question)

@router.get("/{form_id}/responses", response_model=List[schemas.Response])
def get_responses(form_id: int, db: Session = Depends(get_db)):

    db_form = crud.get_form_by_id(db, form_id=form_id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return crud.get_responses_for_form(db, form_id)

@router.post("/{form_id}/duplicate", response_model=schemas.Form)

def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    db_form = crud.duplicate_form(db, form_id=form_id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return db_form

@router.put("/{form_id}/questions/reorder")
def reorder_questions(form_id: int, reorder_data: schemas.QuestionReorder, db: Session = Depends(get_db)):
    success = crud.reorder_questions(db, form_id=form_id, question_ids=reorder_data.question_ids)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder questions. Ensure all question IDs belong to this form.")
    return {"message": "Questions reordered successfully"}

@router.get("/{form_id}/stats", response_model=schemas.FormStats)
def get_form_stats(form_id: int, db: Session = Depends(get_db)):
    stats = crud.get_form_stats(db, form_id=form_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return stats

@router.put("/{form_id}/questions/{question_id}", response_model=schemas.Question)
def update_form_question(
    form_id: int,
    question_id: int,
    question_update: schemas.QuestionUpdate,
    db: Session = Depends(get_db)
):
    db_form = crud.get_form_by_id(db, form_id=form_id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    db_question = crud.update_question(db, question_id, question_update)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question

@router.delete("/{form_id}/questions/{question_id}")
def delete_form_question(form_id: int, question_id: int, db: Session = Depends(get_db)):
    db_form = crud.get_form_by_id(db, form_id=form_id)
    if db_form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    success = crud.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}

