from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import io
import os
from typing import List
import json


from .llm_api import router as llm_router

app = FastAPI()

# Enable CORS for frontend
# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:5173"],  # Vite dev server(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount LLM API
API_KEY = os.getenv('BACKEND_API_KEY')

def require_api_key(x_api_key: str | None = Header(None)):
    # If API_KEY is set in the environment, require it; otherwise allow (development)
    if API_KEY:
        if not x_api_key or x_api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return True


app.include_router(llm_router, dependencies=[Depends(require_api_key)])

# Store extracted text (in production, use database)
notes_storage = {}  # {user_id: {course_name: [notes]}}

from fastapi import Form

@app.post("/upload-pdf/{user_id}/{course_name}")
async def upload_pdf(user_id: str, course_name: str, file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return {"error": "Only PDF files are allowed"}

    # Read PDF content
    content = await file.read()

    # Extract text using pdfplumber if available; otherwise attempt OCR if available
    text = ""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception:
        # pdfplumber not available or failed; try OCR path
        try:
            from pdf2image import convert_from_bytes
            import pytesseract
            images = convert_from_bytes(content)
            ocr_text = ""
            for image in images:
                ocr_text += pytesseract.image_to_string(image) + "\n"
            text = ocr_text
        except Exception as e:
            # If both approaches fail, return a helpful error message
            return {"error": "PDF text extraction failed on server. Install pdfplumber or pdf2image+pytesseract to enable PDF uploads.", "details": str(e)}

    # Store the extracted text per user and course
    if user_id not in notes_storage:
        notes_storage[user_id] = {}
    if course_name not in notes_storage[user_id]:
        notes_storage[user_id][course_name] = []
    notes_storage[user_id][course_name].append({
        "filename": file.filename,
        "text": text,
        "summary": text[:500] + "..." if len(text) > 500 else text  # Basic summary
    })

    return {
    # Enable CORS for frontend
    # Enable CORS for frontend

        "filename": file.filename,

        "text": text,

        "text_length": len(text),
        "summary": text[:500] + "..." if len(text) > 500 else text
    }

@app.get("/notes/{user_id}/{course_name}")
async def get_notes(user_id: str, course_name: str):
    return notes_storage.get(user_id, {}).get(course_name, [])

@app.post("/ask-question/{course_name}")
async def ask_question(course_name: str, question: str):
    # Placeholder for LLM integration
    # In future, use OpenAI or similar to answer based on notes
    notes = notes_storage.get(course_name, [])
    if not notes:
        return {"answer": "No notes available for this course."}

    # Simple keyword matching for now
    all_text = " ".join([note["text"] for note in notes])
    if question.lower() in all_text.lower():
        return {"answer": "Based on your notes, yes, this topic is covered."}
    else:
        return {"answer": "I couldn't find information about this in your notes. Please check your uploaded materials."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)