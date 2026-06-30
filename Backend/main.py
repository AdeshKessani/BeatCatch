from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from analyzer import analyze_audio
from matcher import find_similar
from explainer import explain_match
import shutil, os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "BeatCatch API is running"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
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
async def recommend(file: UploadFile = File(...), n: int = 5):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        # Step 1: analyse the uploaded song
        features = analyze_audio(temp_path)
        features["filename"] = file.filename

        # Step 2: find similar songs
        matches = find_similar(features, n=n)

        # Step 3: add Claude explanation to each match
        for match in matches:
            match["why"] = explain_match(features, match)

        return {
            "input_track": features,
            "recommendations": matches
        }
    finally:
        os.remove(temp_path)