# backend/main.py (Updated for Vercel)
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# Load environment variables. Vercel will inject these directly,
# so .env won't be used at runtime on Vercel, but good for local development.
load_dotenv()

# --- Configure Gemini ---
# Vercel environment variables are accessed directly from os.environ
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    # On Vercel, this should be set in Project Settings -> Environment Variables
    raise ValueError("❌ Missing GOOGLE_API_KEY environment variable")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("models/gemini-flash-latest") # Or "models/gemini-pro-latest"

# --- FastAPI setup ---
app = FastAPI(
    title="LeetCode Hint Generator API",
    description="Backend server that generates AI hints using Google Gemini",
    version="2.0.0",
)

# Crucial for browser extensions to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In a real production app, you might restrict this to your extension ID or specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic model ---
class Question(BaseModel):
    title: str
    desc: str

# --- Routes ---
@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Gemini API backend running successfully"}

@app.post("/hint")
async def get_hint(q: Question):
    print(f"📘 Received request for: {q.title}")
    try:
        prompt = (
            f"Provide 2-3 concise, step-by-step hints for solving this programming problem. "
            f"Each hint should be a numbered item (e.g., '1. Start by...'). "
            f"Each hint should progressively guide the user without giving the final answer.\n\n"
            f"Title: {q.title}\n"
            f"Description:\n{q.desc}"
        )
        response = model.generate_content(prompt)

        hint_text = None
        if hasattr(response, "text") and response.text:
            hint_text = response.text.strip()
        elif hasattr(response, "candidates") and response.candidates:
            if response.candidates[0].content and response.candidates[0].content.parts:
                parts = response.candidates[0].content.parts
                if parts and hasattr(parts[0], "text"):
                    hint_text = parts[0].text.strip()

        if not hint_text:
            print(f"WARNING: Gemini returned empty or no text for {q.title}. Response object: {response}")
            if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                 print(f"WARNING: Gemini prompt feedback: {response.prompt_feedback}")
            raise ValueError("Empty or malformed response from Gemini API. Check prompt or model output.")

        return {"hint": hint_text}

    except Exception as e:
        print(f"[Gemini Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))

# No need for uvicorn.run(__name__ == '__main__':) because Vercel handles serving