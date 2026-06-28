import logging
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

import database as db
import gemini_service as gemini
import auth
import learning_intelligence as ai_engine   # ← NEW LINE ADDED

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StudyAI API Backend",
    description="Python FastAPI backend powering StudyAI tutor chatbot with Authentication",
    version="1.1.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas for Authentication
class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str = Field(...)
    password: str = Field(...)

# Pydantic Schemas for App Features
class SessionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    personality: str = Field("general")

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

class QuizCreate(BaseModel):
    topic: str = Field(..., min_length=1)
    difficulty: str = Field("Medium")
    num_questions: int = Field(5, ge=1, le=10)

class QuizEvaluate(BaseModel):
    answers: List[int]

class FlashcardsCreate(BaseModel):
    topic: str = Field(..., min_length=1)
    count: int = Field(6, ge=1, le=12)

class CodeExplainRequest(BaseModel):
    code: str = Field(..., min_length=1)
    language: str = Field("python")

# ── NEW SCHEMAS ADDED BELOW (do not touch anything above) ──────
class RoadmapRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    level: str = Field("Beginner")
    goal: str = Field(..., min_length=1)
    weeks: int = Field(4, ge=1, le=12)

class MindMapRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    depth: int = Field(2, ge=1, le=3)
# ── END NEW SCHEMAS ─────────────────────────────────────────────


# Endpoints
@app.get("/")
def read_root():
    return {"message": "StudyAI API Backend is running! Access the frontend to use the app."}

@app.get("/api/health")
def health_check():
    db_status = "Connected" if db.get_database() is not None else "Disconnected (Fallback Mode)"
    ai_status = "Available" if gemini.API_KEY else "Unavailable (No Key)"
    return {
        "status": "healthy",
        "database": db_status,
        "gemini_api": ai_status
    }

# Authentication Endpoints
@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup):
    # Check if username or email already exists
    if db.get_user_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username is already taken")
    if db.get_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    password_hash = auth.hash_password(user_data.password)
    user = db.create_user(user_data.username, user_data.email, password_hash)
    
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create account (database offline)")
        
    token = auth.create_access_token(user["user_id"], user["username"])
    return {
        "token": token,
        "username": user["username"],
        "email": user["email"],
        "user_id": user["user_id"]
    }

@app.post("/api/auth/login")
def login(login_data: UserLogin):
    # Resolve user by username or email
    user = db.get_user_by_username(login_data.username_or_email)
    if not user:
        user = db.get_user_by_email(login_data.username_or_email)
        
    if not user or not auth.verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    token = auth.create_access_token(user["user_id"], user["username"])
    return {
        "token": token,
        "username": user["username"],
        "email": user["email"],
        "user_id": user["user_id"]
    }

@app.get("/api/auth/me")
def get_me(user_id: str = Depends(auth.get_current_user_id)):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Session Management (Scoped by user_id)
@app.post("/api/sessions", status_code=status.HTTP_201_CREATED)
def create_new_session(session_data: SessionCreate, user_id: str = Depends(auth.get_current_user_id)):
    try:
        new_session = db.create_session(session_data.title, session_data.personality, user_id)
        return new_session
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error creating session")

@app.get("/api/sessions")
def list_sessions(user_id: str = Depends(auth.get_current_user_id)):
    try:
        return db.get_all_sessions(user_id)
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error listing sessions")

@app.get("/api/sessions/{session_id}")
def get_session_detail(session_id: str, user_id: str = Depends(auth.get_current_user_id)):
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Security check: Ensure user owns this session (unless it's legacy data)
    if session.get("user_id") and session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    return session

@app.delete("/api/sessions/{session_id}")
def delete_chat_session(session_id: str, user_id: str = Depends(auth.get_current_user_id)):
    session = db.get_session(session_id)
    if session and session.get("user_id") and session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this session")
        
    success = db.delete_session(session_id)
    if not success:
        return {"success": False, "message": "Failed to delete session (database offline)"}
    return {"success": True, "message": "Session and messages deleted"}


# Message Operations (Validated by session ownership)
@app.get("/api/sessions/{session_id}/messages")
def get_messages(session_id: str, user_id: str = Depends(auth.get_current_user_id)):
    session = db.get_session(session_id)
    if not session:
        return []
    if session.get("user_id") and session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access messages")
        
    return db.get_session_messages(session_id)

@app.post("/api/sessions/{session_id}/chat")
def send_chat_message(session_id: str, message: MessageCreate, user_id: str = Depends(auth.get_current_user_id)):
    session = db.get_session(session_id)
    if not session:
        session = {"session_id": session_id, "personality": "general"}
    elif session.get("user_id") and session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to chat in this session")
        
    # Save user message
    db.save_message(session_id, "user", message.content)
    
    # Retrieve history
    history = db.get_session_messages(session_id)
    if not history:
        history = [{"sender": "user", "content": message.content}]
        
    # Call Gemini AI
    ai_reply = gemini.generate_chat_response(history, session.get("personality", "general"))
    
    # Save AI message
    saved_reply = db.save_message(session_id, "assistant", ai_reply)
    return saved_reply


# Quiz Operations (Scoped by user_id)
@app.post("/api/quizzes")
def create_quiz(quiz_data: QuizCreate, user_id: str = Depends(auth.get_current_user_id)):
    questions = gemini.generate_quiz(quiz_data.topic, quiz_data.difficulty, quiz_data.num_questions)
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate quiz. Check API key.")
    
    saved_quiz = db.save_quiz(quiz_data.topic, quiz_data.difficulty, questions, user_id)
    return saved_quiz

@app.post("/api/quizzes/{quiz_id}/evaluate")
def grade_quiz(quiz_id: str, evaluation_data: QuizEvaluate, user_id: str = Depends(auth.get_current_user_id)):
    quiz = db.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.get("user_id") and quiz["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to grade this quiz")
        
    results = gemini.evaluate_quiz(quiz["questions"], evaluation_data.answers)
    
    db.update_quiz_results(
        quiz_id,
        results["score"],
        evaluation_data.answers,
        results["feedback"]
    )
    return {
        "quiz_id": quiz_id,
        "score": results["score"],
        "total": len(quiz["questions"]),
        "feedback": results["feedback"]
    }

@app.get("/api/quizzes")
def get_quizzes_history(user_id: str = Depends(auth.get_current_user_id)):
    return db.get_all_quizzes(user_id)

@app.get("/api/quizzes/{quiz_id}")
def get_quiz_details(quiz_id: str, user_id: str = Depends(auth.get_current_user_id)):
    quiz = db.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.get("user_id") and quiz["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this quiz")
    return quiz


# Flashcard Operations (Scoped by user_id)
@app.post("/api/flashcards")
def create_flashcards(flashcard_data: FlashcardsCreate, user_id: str = Depends(auth.get_current_user_id)):
    cards = gemini.generate_flashcards(flashcard_data.topic, flashcard_data.count)
    if not cards:
        raise HTTPException(status_code=500, detail="Failed to generate flashcards. Check API key.")
        
    saved_set = db.save_flashcard_set(flashcard_data.topic, cards, user_id)
    return saved_set

@app.get("/api/flashcards")
def get_flashcard_sets(user_id: str = Depends(auth.get_current_user_id)):
    return db.get_all_flashcard_sets(user_id)

@app.get("/api/flashcards/{set_id}")
def get_flashcard_set_detail(set_id: str, user_id: str = Depends(auth.get_current_user_id)):
    card_set = db.get_flashcard_set(set_id)
    if not card_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    if card_set.get("user_id") and card_set["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this flashcard set")
    return card_set


# Analytics using MongoDB Aggregation Pipeline
@app.get("/api/analytics")
def get_analytics(user_id: str = Depends(auth.get_current_user_id)):
    try:
        stats = db.get_user_analytics(user_id)
        return stats
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching analytics")


# Code Explainer (Authenticated)
@app.post("/api/explain-code")
def explain_code(request: CodeExplainRequest, user_id: str = Depends(auth.get_current_user_id)):
    explanation = gemini.explain_code_snippet(request.code, request.language)
    return explanation


# ── NEW: Learning Intelligence Engine Routes ───────────────────

@app.post("/api/ai/roadmap")
def create_study_roadmap(request: RoadmapRequest, user_id: str = Depends(auth.get_current_user_id)):
    """Generate a personalized AI study roadmap."""
    result = ai_engine.generate_study_roadmap(
        topic=request.topic,
        level=request.level,
        goal=request.goal,
        weeks=request.weeks
    )
    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])
    return result


@app.get("/api/ai/performance")
def get_performance_analysis(user_id: str = Depends(auth.get_current_user_id)):
    """Analyze quiz history and return AI-powered performance insights."""
    quiz_history = db.get_all_quizzes(user_id)
    result = ai_engine.analyze_performance(quiz_history)
    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])
    return result


@app.post("/api/ai/mindmap")
def create_mind_map(request: MindMapRequest, user_id: str = Depends(auth.get_current_user_id)):
    """Generate a concept mind map as a node-link graph."""
    result = ai_engine.generate_mind_map(topic=request.topic, depth=request.depth)
    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])
    return result


@app.post("/api/ai/summarize-session/{session_id}")
def summarize_chat_session(session_id: str, user_id: str = Depends(auth.get_current_user_id)):
    """Summarize a chat session with AI insights and review questions."""
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") and session["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = db.get_session_messages(session_id)
    result = ai_engine.summarize_session(messages, session.get("personality", "general"))
    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])
    return result

# ── END NEW Routes ─────────────────────────────────────────────


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)