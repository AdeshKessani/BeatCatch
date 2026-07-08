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
  genre: string;
  match_score: number;
  key: string;
}

interface TasteProfile {
  avgBpm: number;
  avgEnergy: number;
  avgValence: number;
  avgDanceability: number;
  favouriteKey: string;
  favouriteGenre: string;
  totalAnalyses: number;
  totalRecommendations: number;
  moodLabel: string;
  moodDescription: string;
  topKeys: { key: string; count: number }[];
  topGenres: { genre: string; count: number }[];
  bpmRange: { min: number; max: number };
}

function computeProfile(analyses: Analysis[]): TasteProfile {
  const totalAnalyses = analyses.length;
  const totalRecommendations = analyses.reduce((sum, a) => sum + (a.recommendations?.length ?? 0), 0);

  const avgBpm = Math.round(analyses.reduce((sum, a) => sum + a.bpm, 0) / totalAnalyses);
  const avgEnergy = parseFloat((analyses.reduce((sum, a) => sum + a.energy, 0) / totalAnalyses).toFixed(2));
  const avgValence = parseFloat((analyses.reduce((sum, a) => sum + a.valence, 0) / totalAnalyses).toFixed(2));
  const avgDanceability = parseFloat((analyses.reduce((sum, a) => sum + a.danceability, 0) / totalAnalyses).toFixed(2));

  const bpms = analyses.map(a => a.bpm);
  const bpmRange = { min: Math.round(Math.min(...bpms)), max: Math.round(Math.max(...bpms)) };

  // Key frequency
  const keyCounts: Record<string, number> = {};
  analyses.forEach(a => {
    keyCounts[a.key] = (keyCounts[a.key] ?? 0) + 1;
  });
  const topKeys = Object.entries(keyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, count]) => ({ key, count }));
  const favouriteKey = topKeys[0]?.key ?? 'Unknown';

  // Genre frequency from recommendations
  const genreCounts: Record<string, number> = {};
  analyses.forEach(a => {
    a.recommendations?.forEach(r => {
      if (r.genre) genreCounts[r.genre] = (genreCounts[r.genre] ?? 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre, count]) => ({ genre, count }));
  const favouriteGenre = topGenres[0]?.genre ?? 'Unknown';

  // Mood label based on valence + energy
  let moodLabel = '';
  let moodDescription = '';
  if (avgValence > 0.6 && avgDanceability > 0.7) {
    moodLabel = '🔥 High Energy Party';
    moodDescription = 'You gravitate toward upbeat, danceable tracks that keep the energy high.';
  } else if (avgValence > 0.6 && avgDanceability <= 0.7) {
    moodLabel = '☀️ Feel Good Vibes';
    moodDescription = 'Your taste leans positive and uplifting with a relaxed groove.';
  } else if (avgValence <= 0.4 && avgEnergy > 1.5) {
    moodLabel = '⚡ Dark & Intense';
    moodDescription = 'You lean toward intense, emotionally complex music with high drive.';
  } else if (avgValence <= 0.4 && avgEnergy <= 1.5) {
    moodLabel = '🌙 Melancholic & Introspective';
    moodDescription = 'You tend to explore deep, emotional music with a contemplative feel.';
  } else if (avgBpm > 140) {
    moodLabel = '🚀 Fast & Driven';
    moodDescription = 'You favour high-tempo tracks that push the pace.';
  } else {
    moodLabel = '🎵 Eclectic Explorer';
    moodDescription = 'Your taste spans a wide range of moods and energies.';
  }

  return {
    avgBpm, avgEnergy, avgValence, avgDanceability,
    favouriteKey, favouriteGenre,
    totalAnalyses, totalRecommendations,
    moodLabel, moodDescription,
    topKeys, topGenres, bpmRange
  };
}

export default function ProfilePage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      setUser(user);

      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setAnalyses(data ?? []);
      setLoading(false);
    };
    init();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const keyColors: Record<string, string> = {
    'C': '#ff6b6b', 'C#': '#ff8e53', 'D': '#feca57',
    'D#': '#48dbfb', 'E': '#ff9ff3', 'F': '#54a0ff',
    'F#': '#5f27cd', 'G': '#00d2d3', 'G#': '#01aaa4',
    'A': '#10ac84', 'A#': '#ee5a24', 'B': '#0abde3'
  };

  if (loading) return (
    <main style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <p style={{ color: '#555', fontFamily: "'Segoe UI', sans-serif" }}>Building your profile...</p>
    </main>
  );

  const profile = analyses.length > 0 ? computeProfile(analyses) : null;

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
              Your taste profile
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#555', fontSize: '12px', margin: '0 0 8px' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => router.push('/')} style={{
                padding: '8px 16px', background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                border: 'none', borderRadius: '8px', color: '#fff',
                fontSize: '13px', cursor: 'pointer', fontWeight: '600'
              }}>
                ← New Analysis
              </button>
              <button onClick={() => router.push('/history')} style={{
                padding: '8px 16px', background: 'transparent',
                border: '1px solid #2a2a2a', borderRadius: '8px',
                color: '#666', fontSize: '13px', cursor: 'pointer'
              }}>
                History
              </button>
              <button onClick={handleSignOut} style={{
                padding: '8px 16px', background: 'transparent',
                border: '1px solid #2a2a2a', borderRadius: '8px',
                color: '#666', fontSize: '13px', cursor: 'pointer'
              }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 40px' }}>

        {!profile ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: '#111', borderRadius: '16px', border: '1px solid #1a1a1a'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <p style={{ color: '#555', fontSize: '16px', margin: 0 }}>
              Analyse some songs first to build your taste profile.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Mood Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(6,182,212,0.15))',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '16px',
              padding: '32px'
            }}>
              <p style={{ color: '#a855f7', fontSize: '12px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Your Sound
              </p>
              <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 12px', color: '#fff' }}>
                {profile.moodLabel}
              </h2>
              <p style={{ color: '#aaa', fontSize: '15px', margin: '0 0 24px', lineHeight: '1.6' }}>
                {profile.moodDescription}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#a855f7', fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>
                    {profile.totalAnalyses}
                  </p>
                  <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>Songs analysed</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#06b6d4', fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>
                    {profile.totalRecommendations}
                  </p>
                  <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>Recommendations</p>
                </div>
              </div>
            </div>

            {/* Audio Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Average BPM', value: profile.avgBpm, sub: `Range: ${profile.bpmRange.min}–${profile.bpmRange.max}`, color: '#a855f7' },
                { label: 'Average Energy', value: profile.avgEnergy, sub: 'Higher = more intense', color: '#06b6d4' },
                { label: 'Average Valence', value: profile.avgValence, sub: 'Higher = more positive', color: '#10ac84' },
                { label: 'Danceability', value: profile.avgDanceability, sub: 'Higher = more rhythmic', color: '#feca57' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} style={{
                  background: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  padding: '20px'
                }}>
                  <p style={{ color: '#555', fontSize: '12px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {label}
                  </p>
                  <p style={{ color, fontSize: '28px', fontWeight: '800', margin: '0 0 4px' }}>
                    {value}
                  </p>
                  <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Favourite Key */}
            <div style={{
              background: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <p style={{ color: '#555', fontSize: '12px', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Keys You Gravitate Toward
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {profile.topKeys.map(({ key, count }, i) => (
                  <div key={key} style={{
                    background: `${keyColors[key] ?? '#888'}22`,
                    border: `1px solid ${keyColors[key] ?? '#888'}44`,
                    borderRadius: '10px',
                    padding: '12px 20px',
                    textAlign: 'center',
                    opacity: 1 - i * 0.15
                  }}>
                    <p style={{ color: keyColors[key] ?? '#888', fontSize: '20px', fontWeight: '800', margin: '0 0 4px' }}>
                      {key}
                    </p>
                    <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>
                      {count} song{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Genres */}
            {profile.topGenres.length > 0 && (
              <div style={{
                background: '#111',
                border: '1px solid #1a1a1a',
                borderRadius: '14px',
                padding: '24px'
              }}>
                <p style={{ color: '#555', fontSize: '12px', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Genres in Your Recommendations
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profile.topGenres.map(({ genre, count }, i) => {
                    const maxCount = profile.topGenres[0].count;
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={genre}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: '#aaa', fontSize: '14px', textTransform: 'capitalize' }}>{genre}</span>
                          <span style={{ color: '#555', fontSize: '13px' }}>{count} tracks</span>
                        </div>
                        <div style={{ background: '#1a1a1a', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: i === 0
                              ? 'linear-gradient(135deg, #a855f7, #06b6d4)'
                              : '#2a2a2a',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}