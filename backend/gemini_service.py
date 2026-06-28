import os
import json
import logging
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

# Load env file relative to the script's directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

# Configure the SDK
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
    logger.info("Gemini API key loaded successfully.")
else:
    logger.warning("GEMINI_API_KEY environment variable not found. AI features will fail unless configured.")

# Fallback models list in prioritized order
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")
FALLBACK_MODELS = [
    PRIMARY_MODEL,
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest"
]

# Default fallback prompt if Gemini is completely unavailable
FALLBACK_TEXT = "I am currently running in offline mode. Please configure your GEMINI_API_KEY in the backend .env file to activate the AI Tutor features."

PERSONA_PROMPTS = {
    "general": (
        "You are StudyAI, an empathetic, highly knowledgeable, and patient AI Tutor for students. "
        "Your goal is to guide students to understand concepts deeply rather than just giving direct answers. "
        "Use Socratic questioning where appropriate. Break down complex topics into digestible steps. "
        "Format your responses cleanly using markdown. Use lists, bold text, and blockquotes to make information readable. "
        "Encourage the student and validate their efforts."
    ),
    "math": (
        "You are Sigma, a brilliant and precise Mathematics Specialist. "
        "You explain mathematical concepts logically, step-by-step. "
        "Always use LaTeX notation for mathematical equations, using double dollar signs $$ for block math and single dollar signs $ for inline math. "
        "Explain the 'why' behind each theorem or formula. Provide a step-by-step walkthrough for sample problems, "
        "and invite the student to try a simple test problem at the end of your explanation."
    ),
    "science": (
        "You are Newton, an enthusiastic Science Guru. You cover Physics, Chemistry, and Biology. "
        "Use vivid real-world analogies and visualize experiments to make abstract scientific concepts concrete. "
        "Break down complex biological processes, chemical reactions, or physical equations. "
        "Emphasize the scientific method, and ask the student what they predict will happen under different conditions."
    ),
    "history": (
        "You are Athena, a historical storyteller and History Guide. "
        "Instead of dry lists of dates and names, tell the story of the past. "
        "Focus on cause-and-effect relationships, social and cultural contexts, and historical significance. "
        "Draw connections between past events and the modern world. Use timelines (using markdown lists) "
        "to structure chronological information."
    ),
    "coding": (
        "You are Ada, a veteran Software Engineer and Coding Coach. "
        "You help students write, debug, and understand code (Python, JS, HTML/CSS, C++, Java, etc.). "
        "Explain programming logic and algorithms clearly. "
        "When explaining solutions, outline the logic in bullet points first, display clean code blocks with syntax highlighting, "
        "and explain the Time and Space Complexity (Big-O notation). "
        "Suggest best practices, code readability improvements, and common pitfalls."
    )
}

def generate_content_with_fallback(prompt: str, generation_config: dict = None, system_instruction: str = None) -> str:
    """
    Utility that tries to call generate_content on each fallback model in sequence.
    Handles rate limits, quotas, and model unavailability transparently.
    """
    last_error = None
    for model_name in FALLBACK_MODELS:
        try:
            logger.info(f"Attempting generate_content with model: {model_name}")
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt, generation_config=generation_config)
            return response.text
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}. Trying fallback...")
            last_error = e
            continue
            
    # If we tried all and they failed, raise the last exception
    raise last_error

def generate_chat_response(messages: list, personality: str = "general") -> str:
    """
    Generates a response from Gemini given the conversation history and tutor personality.
    Cycles through fallback models if primary model fails.
    """
    if not API_KEY:
        return FALLBACK_TEXT
        
    system_instruction = PERSONA_PROMPTS.get(personality, PERSONA_PROMPTS["general"])
    
    # Translate stored DB messages format to Gemini API format
    gemini_history = []
    for msg in messages[:-1]:
        role = "user" if msg["sender"] == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg["content"]]})
        
    last_message = messages[-1]["content"]
    
    last_error = None
    for model_name in FALLBACK_MODELS:
        try:
            logger.info(f"Attempting chat response with model: {model_name}")
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            )
            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(last_message)
            return response.text
        except Exception as e:
            logger.warning(f"Chat failed with model {model_name}: {e}. Trying fallback...")
            last_error = e
            continue
            
    return f"Sorry, all available Gemini models are currently rate-limited or unavailable. Details: {str(last_error)}"

def generate_quiz(topic: str, difficulty: str = "Medium", num_questions: int = 5) -> list:
    """
    Generates a structured multiple choice quiz on a topic using Gemini's JSON output capabilities.
    """
    if not API_KEY:
        return []
        
    prompt = (
        f"Generate a multiple-choice quiz about '{topic}' with a difficulty level of '{difficulty}'. "
        f"Generate exactly {num_questions} questions. "
        "Return the output as a JSON list of question objects. "
        "Each object MUST have these exact fields:\n"
        "- 'question': The text of the question (string)\n"
        "- 'options': A list of exactly 4 choices/options (strings)\n"
        "- 'correct_option': The 0-based index of the correct option in the options array (integer, 0 to 3)\n"
        "- 'explanation': A detailed explanation of why the correct option is right and others are wrong (string)\n"
        "Do not include markdown wrappers (like ```json) in the raw response text, only valid JSON."
    )
    
    try:
        text_response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        questions = json.loads(text_response)
        # Ensure it returns a list
        if isinstance(questions, dict) and "questions" in questions:
            return questions["questions"]
        return questions
    except Exception as e:
        logger.error(f"All models failed for generate_quiz: {e}")
        return []

def evaluate_quiz(questions: list, user_answers: list) -> dict:
    """
    Analyzes quiz results and returns a score and constructive explanation/feedback using Gemini.
    """
    if not API_KEY:
        return {"score": 0, "feedback": "Offline mode: evaluation unavailable."}
        
    prompt = (
        "You are an AI Tutor grading a student's quiz. "
        f"Here is the quiz layout (questions, options, correct answers):\n{json.dumps(questions)}\n\n"
        f"Here are the student's selected options (0-based indices matching questions sequentially):\n{json.dumps(user_answers)}\n\n"
        "Calculate the score (number of correct answers) out of the total. "
        "Analyze the questions the student got wrong, identify their conceptual misunderstandings, and write a very helpful, "
        "encouraging, and constructive explanation for each wrong answer. Also provide overall study advice based on their performance. "
        "Return the output as a JSON object with these exact fields:\n"
        "- 'score': The calculated score (integer)\n"
        "- 'total': The total number of questions (integer)\n"
        "- 'feedback': Markdown formatted tutor notes, explaining where they went wrong, highlighting what they did right, and giving study tips."
    )
    
    try:
        text_response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(text_response)
    except Exception as e:
        logger.error(f"All models failed for evaluate_quiz: {e}")
        # Standard fallback calculation if API fails JSON format
        score = 0
        wrong_notes = []
        for i, q in enumerate(questions):
            ans = user_answers[i] if i < len(user_answers) else None
            correct = q["correct_option"]
            if ans == correct:
                score += 1
            else:
                wrong_notes.append(f"- **Q{i+1}**: You chose '{q['options'][ans]}' but the correct answer was '{q['options'][correct]}'. {q['explanation']}")
        
        feedback = "### Offline Grade Summary (Rate Limit/API Down)\n\n" + "\n".join(wrong_notes)
        return {"score": score, "total": len(questions), "feedback": feedback}

def generate_flashcards(topic: str, count: int = 6) -> list:
    """
    Generates educational flashcard content (Front/Back) on a topic as JSON.
    """
    if not API_KEY:
        return []
        
    prompt = (
        f"Generate {count} educational flashcards on the topic '{topic}'. "
        "The flashcards should cover key terminology, equations, definitions, or critical concepts. "
        "Return the output as a JSON list of objects. Each object MUST have these exact fields:\n"
        "- 'front': The question, term, or prompt on the front of the flashcard (string)\n"
        "- 'back': The answer, definition, or explanation on the back of the flashcard (string)\n"
        "Ensure definitions are clear, concise, and easy to memorize."
    )
    
    try:
        text_response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(text_response)
    except Exception as e:
        logger.error(f"All models failed for generate_flashcards: {e}")
        return []

def explain_code_snippet(code: str, language: str) -> dict:
    """
    Explains a code snippet. Returns an explanation, complexity analysis, and a refactored version.
    """
    if not API_KEY:
        return {
            "explanation": "Offline mode: explanation unavailable.",
            "complexity": "Unknown",
            "refactored": "Configure API Key"
        }
        
    prompt = (
        f"You are Ada, the Code Explainer. Analyze the following {language} code snippet:\n\n"
        f"```\n{code}\n```\n\n"
        "Provide a detailed step-by-step explanation of what the code does, its time and space complexity in Big-O notation, "
        "and a refactored/optimized version of the code that follows best practices (e.g. better variable names, cleaner logic, or speed improvements). "
        "Return your analysis as a JSON object with these exact fields:\n"
        "- 'explanation': A detailed step-by-step markdown breakdown of the code (string)\n"
        "- 'complexity': The time and space complexity description, e.g., 'Time: O(N log N), Space: O(N)' (string)\n"
        "- 'refactored': The refactored version of the code including markdown code fences (string)\n"
        "Do not include markdown wrappers around the JSON output."
    )
    
    try:
        text_response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(text_response)
    except Exception as e:
        logger.error(f"All models failed for explain_code_snippet: {e}")
        return {
            "explanation": f"Failed to analyze code due to API error: {str(e)}",
            "complexity": "Unknown",
            "refactored": code
        }
