import json
import numpy as np
from pathlib import Path

# Load catalog once at startup
CATALOG_PATH = Path(__file__).parent.parent / "data" / "catalog.json"

def load_catalog():
    with open(CATALOG_PATH, "r") as f:
        return json.load(f)

def song_to_vector(song: dict) -> np.ndarray:
    return np.array([
        song["bpm"] / 200.0,        # weight: 1x
        song["bpm"] / 200.0,        # weight BPM twice — most important factor
        song["energy"] / 5.0,
        song["energy"] / 5.0,       # weight energy twice
        song["valence"],
        song["danceability"],
        song["danceability"]         # weight danceability twice
    ])

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(dot / norm)

def find_similar(input_features: dict, n: int = 5) -> list:
    catalog = load_catalog()
    input_vector = song_to_vector(input_features)

    results = []
    for song in catalog:
        # Skip exact BPM + key match (self-recommendation)
        if (song["bpm"] == input_features["bpm"] and
            song["key"] == input_features["key"]):
            continue

        song_vector = song_to_vector(song)
        score = cosine_similarity(input_vector, song_vector)

        bpm_diff = abs(song["bpm"] - input_features["bpm"])
        if bpm_diff > 20:
            score *= 0.85
        if bpm_diff > 40:
            score *= 0.70

        results.append({
            "title": song["title"],
            "artist": song["artist"],
            "bpm": song["bpm"],
            "key": song["key"],
            "genre": song["genre"],
            "match_score": round(score * 100, 1),
            "spotify_url": song["spotify_url"],
            "youtube_url": song["youtube_url"]
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:n]
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:n]

    # Sort by match score descending, return top N
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:n]