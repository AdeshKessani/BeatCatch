<div align="center">

# 🎵 Beatcatch

### AI-Powered Song Recommendation Engine

*Drop a song. Catch its vibe. Find your next obsession.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-beatcatch--sepia.vercel.app-a855f7?style=for-the-badge&logo=vercel)](https://beatcatch-sepia.vercel.app)
[![Backend](https://img.shields.io/badge/API-Railway-06b6d4?style=for-the-badge&logo=railway)](https://beatcatch-backend-production.up.railway.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

![Beatcatch Screenshot](https://via.placeholder.com/1200x600/0a0a0a/a855f7?text=Beatcatch)

</div>

---

## What is Beatcatch?

Beatcatch is a full-stack AI-powered music recommendation platform. Upload any MP3, WAV, or FLAC file and Beatcatch will analyse its musical DNA — BPM, key, energy, valence, and danceability — then find the most similar songs from its catalog and explain *why* each one matches, in plain English, powered by Claude AI.

Unlike Spotify's black-box algorithm, Beatcatch shows you exactly what makes two songs similar. Every recommendation comes with a musical explanation: shared keys, tempo ranges, emotional arcs, and energy profiles.

---

## Features

### Core
- **Audio Analysis** — Extracts BPM, musical key, energy, valence, and danceability from any audio file using Librosa
- **Similarity Engine** — Cosine similarity scoring with BPM penalty weighting to find genuinely similar tracks
- **AI Explanations** — Claude (claude-sonnet-4-6) generates a plain-English explanation for every recommendation
- **User-controlled results** — Slider to choose between 1 and 10 recommendations per analysis

### Auth & Security
- **User Authentication** — Email/password signup and login via Supabase Auth
- **JWT Verification** — Every API request is verified against Supabase's JWKS endpoint using ES256
- **Protected Routes** — Frontend redirects unauthenticated users to the login page
- **CORS Lockdown** — Backend only accepts requests from the authorised frontend domain
- **Duplicate Email Detection** — Signup correctly identifies existing accounts
- **Row Level Security** — Supabase RLS ensures users can only access their own data

### Personal Features
- **Listening History** — Every analysis session is saved to Supabase and displayed on a dedicated history page
- **Taste Profile** — Aggregated stats from your listening history: mood label, average BPM, favourite keys, genre breakdown
- **Expandable Sessions** — Click any history entry to see the full recommendations with Claude explanations

### Infrastructure
- **Dockerised Backend** — FastAPI app runs in a reproducible Docker container
- **Cloud Deployment** — Frontend on Vercel, backend on Railway
- **Environment-based Config** — All secrets managed via environment variables, never hardcoded

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.11 | Backend language |
| FastAPI | API framework |
| Uvicorn | ASGI server |
| Librosa | Audio analysis (BPM, key, energy) |
| NumPy / SciKit-Learn | Cosine similarity math |
| Anthropic Claude API | Natural language explanations |
| PyJWT + PyJWKClient | JWT verification |
| Supabase Python SDK | Database operations |
| Docker | Containerisation |
| Railway | Cloud deployment |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework |
| TypeScript | Type safety |
| Supabase SSR | Auth client |
| Vercel | Cloud deployment |

### Data & Auth
| Technology | Purpose |
|---|---|
| Supabase Auth | User authentication |
| Supabase PostgreSQL | Analysis history storage |
| Row Level Security | Per-user data isolation |
| MusicBrainz API | Open music metadata |
| Last.fm API | Listening graph data |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│              Next.js App (Vercel)                        │
│         /          /history        /profile              │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS + JWT Bearer Token
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    API Gateway                           │
│              FastAPI (Railway + Docker)                  │
│         CORS → JWT Verify → Rate Limit                   │
└──────┬──────────────┬────────────────┬───────────────────┘
       │              │                │
┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
│   Audio     │ │ Similarity  │ │   Claude    │
│  Analyser   │ │   Engine   │ │  Explainer  │
│  (Librosa)  │ │  (Cosine)  │ │   (LLM)    │
└──────┬──────┘ └─────┬──────┘ └──────┬──────┘
       │              │                │
┌──────▼──────────────▼────────────────▼──────┐
│                 Data Layer                   │
│    Supabase PostgreSQL + catalog.json        │
│    analyses table (RLS enabled)              │
└─────────────────────────────────────────────┘
```

### Audio Analysis Pipeline

```
Upload MP3/WAV/FLAC
        │
        ▼
  Librosa Load (60s)
        │
        ├──► BPM Detection (beat_track)
        ├──► Key Detection (chroma_cqt + argmax)
        ├──► Energy (RMS mean)
        ├──► Valence (spectral centroid)
        └──► Danceability (beat interval regularity)
        │
        ▼
  7-dimensional feature vector
        │
        ▼
  Cosine similarity vs catalog
        │
        ▼
  BPM penalty weighting
  (>20 BPM diff: -15%, >40 BPM diff: -30%)
        │
        ▼
  Top N results → Claude explanation → Response
```

---

## API Reference

### `GET /`
Health check.

**Response:**
```json
{ "status": "Beatcatch API is running" }
```

---

### `POST /analyze`
Analyse an audio file and return its musical features.

**Auth:** Bearer JWT required

**Body:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| file | File | MP3, WAV, or FLAC audio file |

**Response:**
```json
{
  "bpm": 129.2,
  "key": "F#",
  "energy": 3.148,
  "valence": 0.618,
  "danceability": 0.973,
  "filename": "song.mp3"
}
```

---

### `POST /recommend`
Analyse an audio file and return similar song recommendations with AI explanations.

**Auth:** Bearer JWT required

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| n | int | 5 | Number of recommendations to return (1–10) |

**Body:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| file | File | MP3, WAV, or FLAC audio file |

**Response:**
```json
{
  "input_track": {
    "bpm": 129.2,
    "key": "F#",
    "energy": 3.148,
    "valence": 0.618,
    "danceability": 0.973,
    "filename": "song.mp3"
  },
  "recommendations": [
    {
      "title": "Losing It",
      "artist": "Fisher",
      "bpm": 128.0,
      "key": "F#",
      "genre": "house",
      "match_score": 99.8,
      "spotify_url": "https://open.spotify.com/...",
      "youtube_url": "",
      "why": "Both tracks share the same F# key and nearly identical 128-129 BPM tempos, giving them the same driving, relentless house energy that keeps the dancefloor locked in."
    }
  ],
  "user_id": "uuid"
}
```

---

## Database Schema

```sql
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT,
  bpm FLOAT,
  key TEXT,
  energy FLOAT,
  valence FLOAT,
  danceability FLOAT,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Project Structure

```
BeatCatch/
├── Backend/
│   ├── data/
│   │   └── catalog.json       ← Song catalog (20 seed songs)
│   ├── analyzer.py            ← Librosa audio feature extraction
│   ├── auth.py                ← JWT verification via Supabase JWKS
│   ├── database.py            ← Supabase database operations
│   ├── explainer.py           ← Claude API explanation generation
│   ├── main.py                ← FastAPI app, endpoints, CORS
│   ├── matcher.py             ← Cosine similarity engine
│   ├── requirements.txt       ← Python dependencies
│   ├── Dockerfile             ← Container definition
│   └── .dockerignore
├── Frontend/
│   ├── app/
│   │   ├── auth/
│   │   │   └── page.tsx       ← Login / signup page
│   │   ├── history/
│   │   │   └── page.tsx       ← Analysis history page
│   │   ├── profile/
│   │   │   └── page.tsx       ← Taste profile page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           ← Main recommendation page
│   └── lib/
│       └── supabase.ts        ← Supabase browser client
└── README.md
```

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 20+
- FFmpeg installed and on PATH
- Docker Desktop (optional, for container testing)

### Backend

```bash
cd BeatCatch/Backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in your API keys (see Environment Variables section)

# Run the server
python -m uvicorn main:app --reload
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Frontend

```bash
cd BeatCatch/Frontend

# Install dependencies
npm install

# Create .env.local file
# Add your Supabase and API keys (see Environment Variables section)

# Run the dev server
npm run dev
# App available at http://localhost:3000
```

### Docker (Backend)

```bash
cd BeatCatch/Backend

# Build
docker build -t beatcatch-backend .

# Run
docker run -p 8000:8000 --env-file .env beatcatch-backend
```

---

## Environment Variables

### Backend `.env`

```env
ANTHROPIC_API_KEY=sk-ant-...
LASTFM_API_KEY=your_lastfm_key
LASTFM_SECRET=your_lastfm_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
FRONTEND_URL=http://localhost:3000
PORT=8000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Deployment

### Backend (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialise project
cd BeatCatch/Backend
railway init

# Set environment variables
railway variables set ANTHROPIC_API_KEY=...
railway variables set SUPABASE_URL=...
# (set all variables from the Backend .env section)

# Deploy
railway up

# Get your public URL
railway domain
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd BeatCatch/Frontend
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_API_URL

# Deploy to production
vercel --prod
```

---

## Security Model

| Layer | Implementation |
|---|---|
| Authentication | Supabase Auth — email/password with JWT sessions |
| API Authorization | ES256 JWT verification via Supabase JWKS endpoint |
| Transport Security | HTTPS enforced on Vercel and Railway |
| CORS Policy | Restricted to authorised frontend domain only |
| Data Isolation | Row Level Security — users access only their own data |
| Secret Management | All keys in environment variables, never in source code |
| Input Validation | File type and size validation on upload |

---

## Competitive Landscape

Beatcatch was built to address gaps in the existing music recommendation market:

| Competitor | What They Do | What They're Missing |
|---|---|---|
| Spotify Radio | Behaviour-based recommendations | Black box — no explanation, biased toward popular artists |
| Cyanite.ai | B2B audio similarity for licensing | Not consumer-facing, expensive, no discovery layer |
| TrackRadar | Last.fm + Spotify audio features | Relies on third-party APIs, no explanations |
| Chosic | Basic metadata matching | No real audio analysis, no reasoning shown |
| Tunebat | Audio feature analyser | Analyser only — no recommendation engine |

**Beatcatch's differentiators:**
- Explainable recommendations — every result comes with a musical reason
- User-controlled result count
- Platform-agnostic — links to Spotify, YouTube, Bandcamp
- Independent artist inclusion — not locked to Spotify's catalog
- Persistent history and taste profiling

---

## Roadmap

- [ ] Rate limiting (10 analyses per user per day)
- [ ] Kubernetes orchestration (Minikube → GKE)
- [ ] Mobile-responsive UI
- [ ] Drag and drop file upload
- [ ] Mood filter before recommendation
- [ ] Shareable recommendation sets
- [ ] Admin dashboard
- [ ] Expanded song catalog (100–200 songs)
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Custom domain

---

## Contributing

This is a personal project but suggestions and feedback are welcome. Open an issue or reach out directly.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by [Adesh Kessani](https://github.com/AdeshKessani)

*Powered by Claude AI · Supabase · Railway · Vercel*

</div>
