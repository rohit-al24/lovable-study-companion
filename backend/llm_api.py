from fastapi import APIRouter, Request
from pydantic import BaseModel
from fastapi.responses import JSONResponse



import requests
import os

router = APIRouter()

# Ollama API config
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:8b")

class LLMRequest(BaseModel):
    question: str
    context: str
    subject: str = ""
    topic: str = ""


class UnitsRequest(BaseModel):
    context: str
    subject: str = ""

class ScheduleRequest(BaseModel):
    units: list[str]
    study_days: int = 7
    exam_date: str = ""

class QuizRequest(BaseModel):
    context: str
    subject: str = ""
    topic: str = ""
    num_questions: int = 5
    difficulty: str | None = None

@router.post("/api/llm/ask")
async def ask_llm(req: LLMRequest):
    # General prompt: allow LLM to answer freely, using notes as context if available
    prompt = (
        "You are a helpful, precise study assistant. Use the provided notes as context if they are relevant, but you may answer any question to the best of your ability. "
        "If the answer is in the notes, prefer quoting or referencing them, but you are not limited to the notes. "
        "Be concise and use the user's subject and topic for context when possible.\n\n"
        f"Notes (optional):\n{req.context}\n\nQuestion: {req.question}\n\nAnswer:"
    )
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        if response.ok:
            data = response.json()
            answer = data.get("response") or data.get("message", "Sorry, no answer.")
            return {"answer": answer.strip()}
        else:
            return JSONResponse(status_code=500, content={"answer": "LLM error: " + response.text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"answer": f"Error: {str(e)}"})


@router.post("/api/llm/units")
async def analyze_units(req: UnitsRequest):
    prompt = (
        "Analyze the following study notes and break them into logical units or chapters. For each unit, provide: Unit title and a brief summary. Respond ONLY with a JSON list: [{ 'unit': 'Unit Title', 'summary': '...' }]\n\n"
        f"Notes:\n{req.context}\n"
    )
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120,
        )
        if not response.ok:
            return JSONResponse(status_code=500, content={"error": "LLM error: " + response.text})
        data = response.json()
        text = data.get("response") or data.get("message") or str(data)
        import json as _json
        try:
            units = _json.loads(text)
            return units
        except Exception:
            import re
            m = re.search(r"\[\s*{[\s\S]*?}\s*\]", text)
            if m:
                try:
                    units = _json.loads(m.group(0))
                    return units
                except Exception as e:
                    return JSONResponse(status_code=500, content={"error": "Failed to parse JSON from LLM response: " + str(e), "raw": text})
            return JSONResponse(status_code=500, content={"error": "No JSON found in LLM response.", "raw": text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"LLM request failed: {str(e)}"})


@router.post("/api/llm/schedule")
async def generate_schedule(req: ScheduleRequest):
    units_str = "\n".join(req.units)
    prompt = (
        "Given these units and a target exam date (or number of study days), create a day-by-day study schedule to cover all units efficiently. List each day with the unit(s) to study. Respond ONLY with a JSON list: [{ 'day': 1, 'units': ['Unit 1', 'Unit 2'] }]\n\n"
        f"Units:\n{units_str}\n"
        f"Study days: {req.study_days}\n"
        f"Exam date: {req.exam_date}\n"
    )
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120,
        )
        if not response.ok:
            return JSONResponse(status_code=500, content={"error": "LLM error: " + response.text})
        data = response.json()
        text = data.get("response") or data.get("message") or str(data)
        import json as _json
        try:
            schedule = _json.loads(text)
            return schedule
        except Exception:
            import re
            m = re.search(r"\[\s*{[\s\S]*?}\s*\]", text)
            if m:
                try:
                    schedule = _json.loads(m.group(0))
                    return schedule
                except Exception as e:
                    return JSONResponse(status_code=500, content={"error": "Failed to parse JSON from LLM response: " + str(e), "raw": text})
            return JSONResponse(status_code=500, content={"error": "No JSON found in LLM response.", "raw": text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"LLM request failed: {str(e)}"})
@router.post("/api/llm/quiz")
async def generate_quiz(req: QuizRequest):
    # Ask Ollama to produce a JSON quiz strictly from the notes
    prompt = (
        "You are a helpful assistant that creates short multiple-choice quizzes from study notes. "
        "Using only the information in the provided notes, generate a quiz with the requested number of questions. "
        "Each question should include 3-4 plausible options and indicate the index (0-based) of the correct option. "
        "Respond ONLY with a single valid JSON object and no additional text, in the format:\n"
        "{\"questions\":[{\"question\":\"...\",\"options\":[\"...\"],\"answer\":0,\"explanation\":\"...\"}, ...]}\n\n"
        f"Notes:\n{req.context}\n\nGenerate {req.num_questions} questions."
    )
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120,
        )
        if not response.ok:
            return JSONResponse(status_code=500, content={"error": "LLM error: " + response.text})
        data = response.json()
        # Ollama may return {"response": "..."} or similar; find the generated text
        text = data.get("response") or data.get("message") or str(data)
        # Try to extract JSON from the text
        import json as _json
        try:
            quiz = _json.loads(text)
            return quiz
        except Exception:
            # attempt to find first JSON object in text
            import re
            m = re.search(r"\{\s*\"questions\"[\s\S]*\}", text)
            if m:
                try:
                    quiz = _json.loads(m.group(0))
                    return quiz
                except Exception as e:
                    return JSONResponse(status_code=500, content={"error": "Failed to parse JSON from LLM response: " + str(e), "raw": text})
            return JSONResponse(status_code=500, content={"error": "No JSON found in LLM response.", "raw": text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"LLM request failed: {str(e)}"})
