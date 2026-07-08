'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface Track {
  bpm: number;
  key: string;
  energy: number;
  valence: number;
  danceability: number;
  filename: string;
}

interface Recommendation {
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  match_score: number;
  spotify_url: string;
  youtube_url: string;
  why: string;
}

interface RecommendResponse {
  input_track: Track;
  recommendations: Recommendation[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [numResults, setNumResults] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/auth');
      else setUser(user);
      setAuthLoading(false);
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const res = await fetch(
        `http://localhost:8000/recommend?n=${numResults}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      if (!res.ok) throw new Error('Something went wrong');
      const data: RecommendResponse = await res.json();
      setResults(data);
    } catch (err) {
      setError('Failed to get recommendations. Make sure your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const keyColors: Record<string, string> = {
    'C': '#ff6b6b', 'C#': '#ff8e53', 'D': '#feca57',
    'D#': '#48dbfb', 'E': '#ff9ff3', 'F': '#54a0ff',
    'F#': '#5f27cd', 'G': '#00d2d3', 'G#': '#01aaa4',
    'A': '#10ac84', 'A#': '#ee5a24', 'B': '#0abde3'
  };

  if (authLoading) return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{ color: '#555', fontFamily: "'Segoe UI', sans-serif" }}>Loading...</p>
    </main>
  );

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '0 0 80px 0'
    }}>

      {/* Header */}
      <div style={{
        padding: '60px 40px 40px',
        borderBottom: '1px solid #1a1a1a',
        marginBottom: '50px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
            }}>
              Beatcatch
            </h1>
            <p style={{ color: '#555', margin: 0, fontSize: '16px' }}>
              Drop a song. Catch its vibe. Find your next obsession.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#555', fontSize: '12px', margin: '0 0 8px' }}>
              {user?.email}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => router.push('/history')}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#666',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                History
              </button>
              <button
                onClick={() => router.push('/profile')} 
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#666',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Profile
              </button>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#666',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 40px' }}>

        {/* File Drop Zone */}
        <div
          onClick={() => document.getElementById('fileInput')?.click()}
          style={{
            border: `2px dashed ${file ? '#a855f7' : '#2a2a2a'}`,
            borderRadius: '16px',
            padding: '50px 40px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: file ? 'rgba(168, 85, 247, 0.05)' : '#111',
            marginBottom: '24px'
          }}
        >
          <input
            id="fileInput"
            type="file"
            accept=".mp3,.wav,.flac"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎵</div>
          {file ? (
            <>
              <p style={{ color: '#a855f7', fontWeight: '600', margin: '0 0 4px' }}>
                {file.name}
              </p>
              <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
                Click to change file
              </p>
            </>
          ) : (
            <>
              <p style={{ color: '#888', margin: '0 0 4px', fontWeight: '500' }}>
                Click to upload a song
              </p>
              <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>
                MP3, WAV or FLAC
              </p>
            </>
          )}
        </div>

        {/* Number of results */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          background: '#111',
          padding: '20px 24px',
          borderRadius: '12px',
          border: '1px solid #1a1a1a'
        }}>
          <label style={{ color: '#888', fontSize: '14px', whiteSpace: 'nowrap' }}>
            Number of recommendations
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={numResults}
            onChange={(e) => setNumResults(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#a855f7' }}
          />
          <span style={{
            color: '#a855f7',
            fontWeight: '700',
            fontSize: '20px',
            minWidth: '24px',
            textAlign: 'center'
          }}>
            {numResults}
          </span>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '12px',
            border: 'none',
            background: file && !loading
              ? 'linear-gradient(135deg, #a855f7, #06b6d4)'
              : '#1a1a1a',
            color: file && !loading ? '#fff' : '#444',
            fontSize: '16px',
            fontWeight: '700',
            cursor: file && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px'
          }}
        >
          {loading ? 'Analysing your track...' : 'Find Similar Songs →'}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#ef4444',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎧</div>
            <p style={{ color: '#555', fontSize: '14px' }}>
              Analysing BPM, key and mood... asking Claude for explanations...
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ marginTop: '50px' }}>
            <div style={{
              background: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <p style={{ color: '#555', fontSize: '12px', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Analysed Track
              </p>
              <p style={{ color: '#fff', fontWeight: '600', margin: '0 0 16px', fontSize: '15px' }}>
                {results.input_track.filename.replace(/\.[^/.]+$/, '')}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {([
                  { label: 'BPM', value: results.input_track.bpm },
                  { label: 'Key', value: results.input_track.key },
                  { label: 'Energy', value: results.input_track.energy },
                  { label: 'Valence', value: results.input_track.valence },
                  { label: 'Danceability', value: results.input_track.danceability },
                ] as { label: string; value: string | number }[]).map(({ label, value }) => (
                  <div key={label} style={{
                    background: '#1a1a1a',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: '#555' }}>{label}: </span>
                    <span style={{ color: '#a855f7', fontWeight: '600' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color: '#555', fontSize: '12px', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {results.recommendations.length} Recommendations
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.recommendations.map((song, i) => (
                <div key={i} style={{
                  background: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  padding: '24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '17px', color: '#fff' }}>
                        {song.title}
                      </p>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        {song.artist}
                      </p>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      {song.match_score}% match
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#1a1a1a', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#888' }}>
                      {song.bpm} BPM
                    </span>
                    <span style={{
                      background: `${keyColors[song.key] ?? '#888'}22`,
                      border: `1px solid ${keyColors[song.key] ?? '#888'}44`,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: keyColors[song.key] ?? '#888'
                    }}>
                      {song.key}
                    </span>
                    <span style={{ background: '#1a1a1a', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#888' }}>
                      {song.genre}
                    </span>
                  </div>

                  <p style={{
                    margin: '0 0 16px',
                    color: '#aaa',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontStyle: 'italic',
                    borderLeft: '2px solid #a855f7',
                    paddingLeft: '12px'
                  }}>
                    {song.why}
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {song.spotify_url && (
                      <a href={song.spotify_url} target="_blank" rel="noreferrer" style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#1DB954',
                        color: '#000',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}>
                        Spotify ↗
                      </a>
                    )}
                    {song.youtube_url && song.youtube_url !== '' && (
                      <a href={song.youtube_url} target="_blank" rel="noreferrer" style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#FF0000',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}>
                        YouTube ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}