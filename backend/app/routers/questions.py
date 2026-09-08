from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models import crud, models
from ..schemas import schemas

router = APIRouter(prefix="/api/questions", tags=["questions"])

def verify_question_ownership(question_id: int, current_user: models.User, db: Session) -> models.Question:
    db_question = crud.get_question_by_id(db, question_id)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check parent form
    db_form = crud.get_form_by_id(db, db_question.form_id)
    if db_form and db_form.user_id is not None and db_form.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify questions in this form."
        )
    return db_question

@router.put("/{question_id}", response_model=schemas.Question)
def update_question(
    question_id: int,
    question_update: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_question_ownership(question_id, current_user, db)
    db_question = crud.update_question(db, question_id, question_update)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question

@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    verify_question_ownership(question_id, current_user, db)
    success = crud.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}
