from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from analyzer import analyze_audio
from matcher import find_similar
from explainer import explain_match
from auth import verify_token
import shutil, os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    user=Depends(verify_token)
):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        features = analyze_audio(temp_path)
        features["filename"] = file.filename
        matches = find_similar(features, n=n)
        for match in matches:
            match["why"] = explain_match(features, match)
        return {
            "input_track": features,
            "recommendations": matches,
            "user_id": user.get("sub")
        }
    finally:
        os.remove(temp_path)