"""
================================================================
  StudyAI — Learning Intelligence Engine
  
  ADD THIS FILE to your backend/ folder.
  
  Features:
    1. generate_study_roadmap()      → Personalized weekly study plan
    2. analyze_performance()         → AI-powered weakness detection
    3. generate_mind_map()           → JSON concept graph for visualization
    4. summarize_session()           → Smart session summary + insights
================================================================
"""

import json
import logging
from gemini_service import generate_content_with_fallback, API_KEY

logger = logging.getLogger(__name__)

FALLBACK_TEXT = "Offline mode: Configure GEMINI_API_KEY to use Learning Intelligence features."


# ─────────────────────────────────────────────────────────────
#  1. PERSONALIZED STUDY ROADMAP
# ─────────────────────────────────────────────────────────────

def generate_study_roadmap(topic: str, level: str, goal: str, weeks: int = 4) -> dict:
    """
    Generates a personalized week-by-week study roadmap.
    
    Args:
        topic   : Subject to study (e.g., "Machine Learning")
        level   : Student's current level ("Beginner" | "Intermediate" | "Advanced")
        goal    : What the student wants to achieve (e.g., "Pass university exam")
        weeks   : Duration of the roadmap (default 4 weeks)
    
    Returns a structured JSON roadmap with milestones, resources, and daily tasks.
    """
    if not API_KEY:
        return {"error": FALLBACK_TEXT}

    prompt = f"""
You are an expert academic curriculum designer and AI tutor. A student wants to master a subject.

STUDENT PROFILE:
- Topic: {topic}
- Current Level: {level}
- Goal: {goal}
- Available Time: {weeks} weeks

Generate a highly personalized, week-by-week study roadmap. Think like a brilliant professor who adapts to the student.

Return ONLY a valid JSON object with this exact structure:
{{
  "title": "Roadmap title (string)",
  "summary": "2-3 sentence overview of the learning journey (string)",
  "total_weeks": {weeks},
  "difficulty_curve": "gradual | steep | plateau-then-spike",
  "weeks": [
    {{
      "week": 1,
      "theme": "Week theme title",
      "focus": "Main focus area this week",
      "daily_tasks": ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"],
      "key_concepts": ["Concept A", "Concept B", "Concept C"],
      "milestone": "What the student should be able to do by end of week",
      "tip": "One specific, actionable study tip for this week",
      "estimated_hours": 10
    }}
  ],
  "ai_reasoning": "Explain in 2-3 sentences WHY you structured the roadmap this way for this specific student profile",
  "prerequisite_check": ["Thing to know 1", "Thing to know 2"],
  "final_goal_alignment": "How this roadmap directly serves the student's stated goal"
}}

Generate all {weeks} weeks. Make it specific, realistic, and motivating.
"""
    try:
        response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response)
    except Exception as e:
        logger.error(f"generate_study_roadmap failed: {e}")
        return {"error": f"Failed to generate roadmap: {str(e)}"}


# ─────────────────────────────────────────────────────────────
#  2. PERFORMANCE PATTERN ANALYZER
# ─────────────────────────────────────────────────────────────

def analyze_performance(quiz_history: list) -> dict:
    """
    Analyzes a student's quiz history to detect weakness patterns
    and generate a personalized improvement plan.
    
    Args:
        quiz_history : List of quiz objects from MongoDB
                       Each: { topic, difficulty, score, total, questions, user_answers }
    
    Returns AI analysis with weakness map, strengths, and targeted study advice.
    """
    if not API_KEY:
        return {"error": FALLBACK_TEXT}

    if not quiz_history:
        return {
            "summary": "No quiz history found. Take some quizzes first to get AI analysis!",
            "weaknesses": [],
            "strengths": [],
            "recommendations": [],
            "overall_trend": "no_data",
            "ai_insight": "Complete at least 2-3 quizzes to unlock personalized performance analysis."
        }

    # Prepare a compact summary for the prompt
    quiz_summary = []
    for q in quiz_history:
        score = q.get("score", 0)
        total = len(q.get("questions", [])) or q.get("total_questions", 5)
        pct = round((score / total) * 100) if total else 0
        quiz_summary.append({
            "topic": q.get("topic", "Unknown"),
            "difficulty": q.get("difficulty", "Medium"),
            "score_percent": pct,
            "score_raw": f"{score}/{total}"
        })

    prompt = f"""
You are an AI academic coach analyzing a student's performance data to provide deep, actionable insights.

STUDENT'S QUIZ HISTORY:
{json.dumps(quiz_summary, indent=2)}

Analyze the patterns, identify cognitive gaps, and produce a diagnostic report.

Return ONLY a valid JSON object with this structure:
{{
  "summary": "2-sentence overall performance summary (string)",
  "overall_trend": "improving | declining | consistent | inconsistent | insufficient_data",
  "performance_score": 72,
  "strengths": [
    {{ "area": "Topic or skill", "evidence": "Why this is a strength" }}
  ],
  "weaknesses": [
    {{ "area": "Topic or skill", "severity": "high | medium | low", "fix": "Specific advice to fix this" }}
  ],
  "cognitive_patterns": "Observed thinking patterns — e.g., struggles with application questions but good at recall",
  "recommendations": [
    {{ "priority": 1, "action": "Specific action to take", "reason": "Why this will help" }}
  ],
  "difficulty_assessment": "Analysis of performance across difficulty levels",
  "ai_insight": "One powerful, personalized insight that would surprise the student and motivate them",
  "next_quiz_suggestion": {{ "topic": "Suggested topic", "difficulty": "Suggested difficulty", "reason": "Why this quiz next" }}
}}
"""
    try:
        response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response)
    except Exception as e:
        logger.error(f"analyze_performance failed: {e}")
        return {"error": f"Analysis failed: {str(e)}"}


# ─────────────────────────────────────────────────────────────
#  3. CONCEPT MIND MAP GENERATOR
# ─────────────────────────────────────────────────────────────

def generate_mind_map(topic: str, depth: int = 2) -> dict:
    """
    Generates a structured concept mind map as a node-link JSON graph.
    The frontend can render this as an interactive visual knowledge graph.
    
    Args:
        topic : Central concept (e.g., "Neural Networks")
        depth : How deep to go (1 = surface, 2 = detailed, 3 = expert)
    
    Returns a node-link graph structure for D3.js / vis.js rendering.
    """
    if not API_KEY:
        return {"error": FALLBACK_TEXT}

    detail_level = {1: "surface-level overview", 2: "detailed with subtopics", 3: "expert-level comprehensive"}
    detail = detail_level.get(depth, "detailed with subtopics")

    prompt = f"""
You are a knowledge architect. Generate a {detail} concept mind map for: "{topic}"

The mind map will be rendered as an interactive visual graph in a web app.

Return ONLY a valid JSON object with this exact structure:
{{
  "central_topic": "{topic}",
  "description": "One sentence describing this topic",
  "nodes": [
    {{
      "id": "node_0",
      "label": "{topic}",
      "type": "root",
      "description": "Brief description",
      "color": "#6366f1"
    }},
    {{
      "id": "node_1", 
      "label": "Main Branch 1",
      "type": "branch",
      "description": "What this branch covers",
      "color": "#8b5cf6"
    }},
    {{
      "id": "node_1_1",
      "label": "Sub-concept",
      "type": "leaf",
      "description": "Specific concept explanation",
      "color": "#a78bfa"
    }}
  ],
  "edges": [
    {{ "from": "node_0", "to": "node_1", "label": "includes" }},
    {{ "from": "node_1", "to": "node_1_1", "label": "contains" }}
  ],
  "learning_order": ["node_0", "node_1", "node_1_1"],
  "total_concepts": 12
}}

Create 4-6 main branches from the central topic, each with 2-4 leaf nodes.
Use meaningful relationship labels on edges. Total 15-25 nodes for depth={depth}.
"""
    try:
        response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response)
    except Exception as e:
        logger.error(f"generate_mind_map failed: {e}")
        return {"error": f"Mind map generation failed: {str(e)}"}


# ─────────────────────────────────────────────────────────────
#  4. SMART SESSION SUMMARIZER
# ─────────────────────────────────────────────────────────────

def summarize_session(messages: list, personality: str = "general") -> dict:
    """
    Analyzes a full chat session and produces an intelligent study summary
    with key concepts learned, gaps identified, and next steps.
    
    Args:
        messages    : List of chat messages [{ sender, content }]
        personality : Tutor persona used in the session
    
    Returns a structured summary with insights, key takeaways, and review questions.
    """
    if not API_KEY:
        return {"error": FALLBACK_TEXT}

    if len(messages) < 2:
        return {
            "summary": "Session too short to summarize.",
            "key_concepts": [],
            "questions_asked": 0,
            "depth_score": 0,
            "review_questions": [],
            "next_steps": []
        }

    # Flatten messages into readable transcript (limit to avoid token overflow)
    transcript_lines = []
    for msg in messages[-30:]:  # Last 30 messages
        role = "Student" if msg.get("sender") == "user" else "Tutor"
        transcript_lines.append(f"{role}: {msg.get('content', '')[:300]}")
    transcript = "\n".join(transcript_lines)

    prompt = f"""
You are an AI academic analyst. Analyze this tutoring session transcript and extract intelligence.

TUTOR PERSONA: {personality}

SESSION TRANSCRIPT:
{transcript}

Generate a comprehensive session debrief. Return ONLY valid JSON:
{{
  "session_title": "Auto-generated descriptive title for this session",
  "summary": "3-4 sentence narrative summary of what was covered and how deeply",
  "subject_detected": "The main subject/topic of the session",
  "key_concepts": [
    {{ "concept": "Concept name", "mastery_level": "introduced | practiced | mastered", "notes": "Brief note" }}
  ],
  "questions_asked": 5,
  "depth_score": 78,
  "engagement_quality": "surface | moderate | deep | exceptional",
  "student_understanding": "Assessment of how well the student grasped the material",
  "knowledge_gaps": ["Gap 1", "Gap 2"],
  "review_questions": [
    {{ "question": "Review question to test retention", "hint": "Brief hint" }}
  ],
  "next_steps": [
    {{ "step": "Recommended action", "priority": "high | medium | low" }}
  ],
  "ai_observation": "One insightful observation about the student's learning style or approach from this session"
}}
"""
    try:
        response = generate_content_with_fallback(
            prompt=prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response)
    except Exception as e:
        logger.error(f"summarize_session failed: {e}")
        return {"error": f"Summary generation failed: {str(e)}"}