from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..models.models import QuestionType

class QuestionOptionBase(BaseModel):
    value: str
    order_index: int = 0

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionUpdate(BaseModel):
    id: Optional[int] = None
    value: str
    order_index: Optional[int] = 0


class QuestionOption(QuestionOptionBase):
    id: int
    question_id: int
    model_config = ConfigDict(from_attributes=True)

class LogicRuleBase(BaseModel):
    condition_value: str
    action: str = "jump"  # "jump" | "end" | "next"
    destination_question_id: Optional[int] = None

class LogicRuleCreate(LogicRuleBase):
    pass

class LogicRuleUpdate(BaseModel):
    id: Optional[int] = None
    condition_value: str
    action: str = "jump"
    destination_question_id: Optional[int] = None

class LogicRule(LogicRuleBase):
    id: int
    question_id: int
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    title: str
    description: Optional[str] = None
    question_type: QuestionType
    is_required: bool = False
    order_index: int = 0

class QuestionCreate(QuestionBase):
    options: Optional[List[QuestionOptionCreate]] = []
    logic_rules: Optional[List[LogicRuleCreate]] = []

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    question_type: Optional[QuestionType] = None
    is_required: Optional[bool] = None
    order_index: Optional[int] = None
    options: Optional[List[QuestionOptionUpdate]] = None
    logic_rules: Optional[List[LogicRuleUpdate]] = None

class Question(QuestionBase):
    id: int
    form_id: int
    options: List[QuestionOption] = []
    logic_rules: List[LogicRule] = []
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None

class FormBase(BaseModel):
    title: str
    description: Optional[str] = None
    thank_you_title: Optional[str] = None
    thank_you_message: Optional[str] = None

class FormCreate(FormBase):
    pass

class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thank_you_title: Optional[str] = None
    thank_you_message: Optional[str] = None
    is_published: Optional[bool] = None

class Form(FormBase):
    id: int
    user_id: Optional[int] = None
    slug: str
    is_published: bool
    created_at: datetime
    updated_at: datetime
    questions: List[Question] = []
    response_count: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class AnswerBase(BaseModel):
    question_id: int
    text_value: Optional[str] = None
    number_value: Optional[float] = None
    boolean_value: Optional[bool] = None

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    id: int
    response_id: int
    model_config = ConfigDict(from_attributes=True)

class ResponseBase(BaseModel):
    pass

class ResponseCreate(ResponseBase):
    answers: List[AnswerCreate]
    submitted_at: Optional[datetime] = None

class Response(ResponseBase):
    id: int
    form_id: int
    submitted_at: datetime
    answers: List[Answer] = []
    model_config = ConfigDict(from_attributes=True)

class QuestionReorder(BaseModel):
    question_ids: List[int]

class QuestionStats(BaseModel):
    question_id: int
    title: str
    question_type: QuestionType
    response_count: int
    option_counts: Optional[Dict[str, int]] = None
    yes_no_counts: Optional[Dict[str, int]] = None
    rating_stats: Optional[Dict[str, Any]] = None
    number_stats: Optional[Dict[str, Any]] = None
    text_answers: Optional[List[str]] = None

class FormStats(BaseModel):
    form_id: int
    title: str
    total_responses: int
    questions: List[QuestionStats]

class CSVImportRow(BaseModel):
    submitted_at: Optional[str] = None
    answers: Dict[str, Any]  # question title or ID -> value

class CSVImportRequest(BaseModel):
    csv_content: Optional[str] = None
    rows: Optional[List[CSVImportRow]] = None

class CSVImportResponse(BaseModel):
    imported_count: int
    total_responses: int
    message: str

