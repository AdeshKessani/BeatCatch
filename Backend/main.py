from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from analyzer import analyze_audio
from matcher import find_similar
from explainer import explain_match
from auth import verify_token, security
from database import save_analysis
import shutil, os

app = FastAPI()

import os

origins = [
    "http://localhost:3000",
    "https://beatcatch-sepia.vercel.app",
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Beatcatch API is running"}

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    user=Depends(verify_token)
):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        result = analyze_audio(temp_path)
        result["filename"] = file.filename
        return result
    finally:
        os.remove(temp_path)

@app.post("/recommend")
async def recommend(
    file: UploadFile = File(...),
    n: int = 5,
    user=Depends(verify_token),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        # Analyse audio
        features = analyze_audio(temp_path)
        features["filename"] = file.filename

        # Find similar songs
        matches = find_similar(features, n=n)

        # Generate Claude explanations
        for match in matches:
            match["why"] = explain_match(features, match)

        # Save to database
        user_id = user.get("sub")
        save_analysis(
            user_id=user_id,
            user_jwt=credentials.credentials,
            features=features,
            recommendations=matches
        )

        return {
            "input_track": features,
            "recommendations": matches,
            "user_id": user_id
        }
    finally:
        os.remove(temp_path)