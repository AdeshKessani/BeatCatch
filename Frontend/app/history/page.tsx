'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface Analysis {
  id: string;
  filename: string;
  bpm: number;
  key: string;
  energy: number;
  valence: number;
  danceability: number;
  recommendations: Recommendation[];
  created_at: string;
}

interface Recommendation {
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  match_score: number;
  why: string;
  spotify_url: string;
  youtube_url: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      await fetchHistory();
      setLoading(false);
    };
    init();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch history:', error);
    } else {
      setAnalyses(data || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const keyColors: Record<string, string> = {
    'C': '#ff6b6b', 'C#': '#ff8e53', 'D': '#feca57',
    'D#': '#48dbfb', 'E': '#ff9ff3', 'F': '#54a0ff',
    'F#': '#5f27cd', 'G': '#00d2d3', 'G#': '#01aaa4',
    'A': '#10ac84', 'A#': '#ee5a24', 'B': '#0abde3'
  };

  if (loading) return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{ color: '#555', fontFamily: "'Segoe UI', sans-serif" }}>Loading history...</p>
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
              Your listening history
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ← New Analysis
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

      {/* Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 40px' }}>

        {analyses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: '#111',
            borderRadius: '16px',
            border: '1px solid #1a1a1a'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <p style={{ color: '#555', fontSize: '16px', margin: 0 }}>
              No analyses yet. Go find some similar songs!
            </p>
          </div>
        ) : (
          <>
            <p style={{
              color: '#555',
              fontSize: '12px',
              margin: '0 0 20px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {analyses.length} analysis session{analyses.length !== 1 ? 's' : ''}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  style={{
                    background: '#111',
                    border: '1px solid #1a1a1a',
                    borderRadius: '14px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Session header - always visible */}
                  <div
                    onClick={() => setExpanded(expanded === analysis.id ? null : analysis.id)}
                    style={{
                      padding: '20px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{
                        margin: '0 0 4px',
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#fff'
                      }}>
                        {analysis.filename?.replace(/\.[^/.]+$/, '') ?? 'Unknown track'}
                      </p>
                      <p style={{ margin: 0, color: '#555', fontSize: '13px' }}>
                        {formatDate(analysis.created_at)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Audio feature pills */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{
                          background: '#1a1a1a',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#888'
                        }}>
                          {analysis.bpm} BPM
                        </span>
                        <span style={{
                          background: `${keyColors[analysis.key] ?? '#888'}22`,
                          border: `1px solid ${keyColors[analysis.key] ?? '#888'}44`,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: keyColors[analysis.key] ?? '#888'
                        }}>
                          {analysis.key}
                        </span>
                        <span style={{
                          background: '#1a1a1a',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#888'
                        }}>
                          {analysis.recommendations?.length ?? 0} recs
                        </span>
                      </div>
                      <span style={{
                        color: '#555',
                        fontSize: '18px',
                        transition: 'transform 0.2s',
                        transform: expanded === analysis.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'inline-block'
                      }}>
                        ↓
                      </span>
                    </div>
                  </div>

                  {/* Expanded recommendations */}
                  {expanded === analysis.id && (
                    <div style={{
                      borderTop: '1px solid #1a1a1a',
                      padding: '16px 24px 24px'
                    }}>
                      {/* Audio features row */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        {[
                          { label: 'Energy', value: analysis.energy },
                          { label: 'Valence', value: analysis.valence },
                          { label: 'Danceability', value: analysis.danceability },
                        ].map(({ label, value }) => (
                          <div key={label} style={{
                            background: '#1a1a1a',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}>
                            <span style={{ color: '#555' }}>{label}: </span>
                            <span style={{ color: '#a855f7', fontWeight: '600' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {analysis.recommendations?.map((rec, i) => (
                          <div key={i} style={{
                            background: '#0a0a0a',
                            border: '1px solid #1a1a1a',
                            borderRadius: '10px',
                            padding: '16px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '8px'
                            }}>
                              <div>
                                <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '15px', color: '#fff' }}>
                                  {rec.title}
                                </p>
                                <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                                  {rec.artist}
                                </p>
                              </div>
                              <div style={{
                                background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                                borderRadius: '20px',
                                padding: '3px 10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap'
                              }}>
                                {rec.match_score}% match
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                              <span style={{ background: '#1a1a1a', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', color: '#888' }}>
                                {rec.bpm} BPM
                              </span>
                              <span style={{
                                background: `${keyColors[rec.key] ?? '#888'}22`,
                                border: `1px solid ${keyColors[rec.key] ?? '#888'}44`,
                                padding: '3px 8px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                color: keyColors[rec.key] ?? '#888'
                              }}>
                                {rec.key}
                              </span>
                              <span style={{ background: '#1a1a1a', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', color: '#888' }}>
                                {rec.genre}
                              </span>
                            </div>

                            <p style={{
                              margin: '0 0 12px',
                              color: '#aaa',
                              fontSize: '13px',
                              lineHeight: '1.6',
                              fontStyle: 'italic',
                              borderLeft: '2px solid #a855f7',
                              paddingLeft: '10px'
                            }}>
                              {rec.why}
                            </p>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              {rec.spotify_url && (
                                <a href={rec.spotify_url} target="_blank" rel="noreferrer" style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: '#1DB954',
                                  color: '#000',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  textDecoration: 'none'
                                }}>
                                  Spotify ↗
                                </a>
                              )}
                              {rec.youtube_url && rec.youtube_url !== '' && (
                                <a href={rec.youtube_url} target="_blank" rel="noreferrer" style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: '#FF0000',
                                  color: '#fff',
                                  fontSize: '11px',
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
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}