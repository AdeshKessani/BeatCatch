import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_supabase(user_jwt: str) -> Client:
    """Create a Supabase client authenticated as the user"""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.auth.set_session(user_jwt, "")
    return client

def save_analysis(user_id: str, user_jwt: str, features: dict, recommendations: list):
    """Save an analysis session to the database"""
    try:
        supabase = get_supabase(user_jwt)
        data = {
            "user_id": user_id,
            "filename": features.get("filename"),
            "bpm": features.get("bpm"),
            "key": features.get("key"),
            "energy": features.get("energy"),
            "valence": features.get("valence"),
            "danceability": features.get("danceability"),
            "recommendations": recommendations
        }
        supabase.table("analyses").insert(data).execute()
    except Exception as e:
        print(f"Failed to save analysis: {e}")