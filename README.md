# Typeform Clone

A full-stack Typeform-inspired form builder application that allows users to create interactive forms, collect responses, analyze results, and share forms publicly.

The project replicates the core experience of modern form-building platforms with a clean Typeform-inspired user interface, authentication, multiple question types, conditional logic, response analytics, and CSV functionality.

## 🚀 Live Demo

🌐 **Frontend:** https://typeform-clone-woad.vercel.app/

🔗 **Backend API:** https://typeform-clone-onp6.onrender.com

---

# ✨ Features

## 🔐 Authentication

- Email and Password Signup
- Email and Password Login
- Google Authentication
- Microsoft Authentication
- Firebase Authentication integration
- Protected routes for authenticated users
- Logout functionality
- Persistent authentication sessions

---

## 📋 Form Management

- Create new forms
- Edit existing forms
- Delete forms
- Duplicate forms
- Dashboard for managing forms
- Automatic starter forms for new users
- Form ownership protection
- Each user's forms are isolated from other users

---

## ❓ Multiple Question Types

The form builder supports multiple interactive question types:

- Short Text
- Long Text
- Multiple Choice
- Dropdown
- Yes / No
- Rating
- Email
- Number

Users can:

- Add questions
- Edit question titles
- Add optional descriptions
- Change question types
- Add and remove answer choices
- Mark questions as required
- Delete questions
- Reorder and manage form questions

---

## 🔀 Conditional Logic / Question Branching

The application supports conditional question logic.

Based on a respondent's answer, the form can:

- Continue to the next question
- Jump to a specific question
- End the form immediately

Conditional logic is supported for appropriate question types such as:

- Multiple Choice
- Dropdown
- Yes / No
- Rating

The public form runner tracks the respondent's path through the form, allowing skipped questions to remain skipped without generating invalid answers.

---

## 🌍 Public Form Sharing

Forms can be shared publicly using a unique URL.

Respondents can:

- Open forms without logging in
- Answer questions one at a time
- Navigate through the form
- Submit responses
- View the completion / thank-you screen

---

## 📊 Responses and Analytics

Form creators can view collected responses and analytics.

Features include:

- Total response statistics
- Response data table
- Answer tracking
- Rating statistics
- Automatic analytics updates
- Support for responses containing skipped questions due to conditional branching

---

## 📁 CSV Functionality

### CSV Import

Responses can be imported from CSV files.

The system supports:

- CSV parsing
- Header matching with form questions
- Validation of supported answer types
- Handling quoted values and commas
- Importing responses into the existing response system
- Automatic refresh of results and analytics

### CSV Export

Form responses can also be exported as a CSV file.

The exported CSV includes:

- Response ID
- Submission timestamp
- Answers for each question

Skipped questions are exported as empty cells.

---

# 🛠️ Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- CSS Modules
- Firebase SDK

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

## Database

- SQLite

## Authentication

- Firebase Authentication
- Email/Password Authentication
- Google OAuth
- Microsoft OAuth

## Deployment

- Frontend: Vercel
- Backend: Render

---

# 📂 Project Structure

```text
typeform-clone/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── types/
│   │
│   ├── package.json
│   └── .env.local
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   └── schemas/
│   │
│   ├── main.py
│   └── requirements.txt
│
└── README.md