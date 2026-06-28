import os
import logging
from datetime import datetime
import uuid
from pathlib import Path
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load env file relative to the script's directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "studyai")

client = None
db = None

def get_database():
    global client, db
    if db is not None:
        return db
    
    try:
        # 3-second timeout for server selection so the app doesn't hang if Mongo isn't running
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
        # Trigger connection check
        client.admin.command('ping')
        db = client[DB_NAME]
        logger.info(f"Successfully connected to MongoDB at {MONGODB_URI.split('@')[-1]}") # redact credentials if any
        return db
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        return None

# User Operations
def create_user(username: str, email: str, password_hash: str) -> dict:
    database = get_database()
    if database is None:
        return None
        
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "username": username.lower(),
        "email": email.lower(),
        "password_hash": password_hash,
        "created_at": datetime.utcnow()
    }
    database.users.insert_one(user_doc)
    
    if "_id" in user_doc:
        del user_doc["_id"]
    return user_doc

def get_user_by_email(email: str) -> dict:
    database = get_database()
    if database is None:
        return None
    return database.users.find_one({"email": email.lower()})

def get_user_by_username(username: str) -> dict:
    database = get_database()
    if database is None:
        return None
    return database.users.find_one({"username": username.lower()})

def get_user_by_id(user_id: str) -> dict:
    database = get_database()
    if database is None:
        return None
    return database.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})

# Sessions Operations (Scoped by user_id)
def create_session(title: str, personality: str = "general", user_id: str = None) -> dict:
    database = get_database()
    if database is None:
        return {
            "session_id": str(uuid.uuid4()), 
            "title": title, 
            "personality": personality, 
            "user_id": user_id, 
            "created_at": datetime.utcnow()
        }
        
    session_id = str(uuid.uuid4())
    session_doc = {
        "session_id": session_id,
        "title": title,
        "personality": personality,
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    database.sessions.insert_one(session_doc)
    if "_id" in session_doc:
        del session_doc["_id"]
    return session_doc

def get_all_sessions(user_id: str = None) -> list:
    database = get_database()
    if database is None:
        return []
    
    # Filter by user_id, support legacy documents (no user_id) for backward compatibility
    query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}]} if user_id else {}
    sessions = list(database.sessions.find(query, {"_id": 0}).sort("updated_at", -1))
    return sessions

def get_session(session_id: str) -> dict:
    database = get_database()
    if database is None:
        return None
    return database.sessions.find_one({"session_id": session_id}, {"_id": 0})

def delete_session(session_id: str) -> bool:
    database = get_database()
    if database is None:
        return False
    
    database.sessions.delete_one({"session_id": session_id})
    database.messages.delete_many({"session_id": session_id})
    return True

# Messages Operations
def save_message(session_id: str, sender: str, content: str) -> dict:
    database = get_database()
    message_id = str(uuid.uuid4())
    message_doc = {
        "message_id": message_id,
        "session_id": session_id,
        "sender": sender,
        "content": content,
        "timestamp": datetime.utcnow()
    }
    
    if database is not None:
        database.messages.insert_one(message_doc)
        database.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        if "_id" in message_doc:
            del message_doc["_id"]
    return message_doc

def get_session_messages(session_id: str) -> list:
    database = get_database()
    if database is None:
        return []
    messages = list(database.messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1))
    return messages

# Quizzes Operations (Scoped by user_id)
def save_quiz(topic: str, difficulty: str, questions: list, user_id: str = None) -> dict:
    database = get_database()
    quiz_id = str(uuid.uuid4())
    quiz_doc = {
        "quiz_id": quiz_id,
        "topic": topic,
        "difficulty": difficulty,
        "questions": questions,
        "user_id": user_id,
        "score": None,
        "answers": None,
        "feedback": None,
        "created_at": datetime.utcnow()
    }
    if database is not None:
        database.quizzes.insert_one(quiz_doc)
        if "_id" in quiz_doc:
            del quiz_doc["_id"]
    return quiz_doc

def update_quiz_results(quiz_id: str, score: int, answers: list, feedback: str) -> bool:
    database = get_database()
    if database is None:
        return False
    result = database.quizzes.update_one(
        {"quiz_id": quiz_id},
        {"$set": {
            "score": score,
            "answers": answers,
            "feedback": feedback
        }}
    )
    return result.modified_count > 0

def get_quiz(quiz_id: str) -> dict:
    database = get_database()
    if database is None:
        return None
    return database.quizzes.find_one({"quiz_id": quiz_id}, {"_id": 0})

def get_all_quizzes(user_id: str = None) -> list:
    database = get_database()
    if database is None:
        return []
    
    query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}]} if user_id else {}
    return list(database.quizzes.find(query, {"_id": 0}).sort("created_at", -1))

# Flashcard Operations (Scoped by user_id)
def save_flashcard_set(topic: str, cards: list, user_id: str = None) -> dict:
    database = get_database()
    set_id = str(uuid.uuid4())
    set_doc = {
        "set_id": set_id,
        "topic": topic,
        "cards": cards,
        "user_id": user_id,
        "created_at": datetime.utcnow()
    }
    if database is not None:
        database.flashcards.insert_one(set_doc)
        if "_id" in set_doc:
            del set_doc["_id"]
    return set_doc

def get_flashcard_set(set_id: str) -> dict:
    database = get_database()
    if database is None:
        return None
    return database.flashcards.find_one({"set_id": set_id}, {"_id": 0})

def get_all_flashcard_sets(user_id: str = None) -> list:
    database = get_database()
    if database is None:
        return []
    
    query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}]} if user_id else {}
    return list(database.flashcards.find(query, {"_id": 0}).sort("created_at", -1))

def get_user_analytics(user_id: str = None) -> dict:
    """
    Computes dashboard metrics using a MongoDB Aggregation Pipeline.
    Aggregates sessions count, flashcards count, and quiz scores.
    """
    database = get_database()
    if database is None:
        return {
            "session_count": 0,
            "quiz_count": 0,
            "completed_quizzes": 0,
            "flashcard_count": 0,
            "avg_score": 0
        }
    
    # 1. Count sessions
    session_query = {"user_id": user_id} if user_id else {}
    session_count = database.sessions.count_documents(session_query)
    
    # 2. Count flashcard sets
    flashcard_query = {"user_id": user_id} if user_id else {}
    flashcard_count = database.flashcards.count_documents(flashcard_query)
    
    # 3. Use an Aggregation Pipeline on Quizzes to calculate average score and total count
    match_stage = {"user_id": user_id} if user_id else {}
    
    quiz_pipeline = [
        # Stage 1: Filter by user
        {"$match": match_stage},
        # Stage 2: Project necessary fields and calculate individual percentage score
        {
            "$project": {
                "quiz_id": 1,
                "score": 1,
                "num_questions": {"$size": {"$ifNull": ["$questions", []]}}
            }
        },
        # Stage 3: Group and aggregate metrics
        {
            "$group": {
                "_id": None,
                "total_generated": {"$sum": 1},
                "total_completed": {
                    "$sum": {"$cond": [{"$ne": ["$score", None]}, 1, 0]}
                },
                "avg_score": {
                    "$avg": {
                        "$cond": [
                            {"$and": [{"$ne": ["$score", None]}, {"$gt": ["$num_questions", 0]}]},
                            {"$multiply": [{"$divide": ["$score", "$num_questions"]}, 100]},
                            None
                        ]
                    }
                }
            }
        }
    ]
    
    try:
        agg_results = list(database.quizzes.aggregate(quiz_pipeline))
    except Exception as e:
        logger.error(f"Aggregation pipeline failed: {e}")
        agg_results = []
        
    if agg_results:
        res = agg_results[0]
        quiz_count = res.get("total_generated", 0)
        completed_quizzes = res.get("total_completed", 0)
        avg_score = round(res.get("avg_score") or 0)
    else:
        quiz_count = 0
        completed_quizzes = 0
        avg_score = 0
        
    return {
        "session_count": session_count,
        "quiz_count": quiz_count,
        "completed_quizzes": completed_quizzes,
        "flashcard_count": flashcard_count,
        "avg_score": avg_score
    }

