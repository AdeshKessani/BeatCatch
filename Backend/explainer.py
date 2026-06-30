import anthropic
import os
from dotenv import load_dotenv

load_dotenv()
print("KEY:", os.getenv("ANTHROPIC_API_KEY"))

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def explain_match(input_track: dict, recommended_track: dict) -> str:
    prompt = f"""You are a music expert. A user uploaded a song with these audio characteristics:
- BPM: {input_track['bpm']}
- Key: {input_track['key']}
- Energy: {input_track['energy']}
- Valence (happiness): {input_track['valence']}
- Danceability: {input_track['danceability']}

You recommended: "{recommended_track['title']}" by {recommended_track['artist']} ({recommended_track['genre']})
- BPM: {recommended_track['bpm']}
- Key: {recommended_track['key']}
- Match score: {recommended_track['match_score']}%

Write exactly 2 sentences explaining why this is a good match. Be specific about the musical reasons — mention BPM, key, energy or vibe. Keep it conversational, like a knowledgeable friend explaining it."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text