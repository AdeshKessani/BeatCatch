import librosa
import numpy as np

def analyze_audio(file_path: str) -> dict:
    # Load the audio file
    y, sr = librosa.load(file_path, duration=60, mono=True)

    # BPM - handle both scalar and array return types
    tempo_result = librosa.beat.beat_track(y=y, sr=sr)[0]
    if hasattr(tempo_result, '__len__'):
        bpm = round(float(tempo_result[0]), 1)
    else:
        bpm = round(float(tempo_result), 1)

    # Key detection
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    key_index = int(np.argmax(np.mean(chroma, axis=1)))
    keys = ['C', 'C#', 'D', 'D#', 'E', 'F',
            'F#', 'G', 'G#', 'A', 'A#', 'B']
    key = keys[key_index]

    # Energy (RMS)
    rms = librosa.feature.rms(y=y)
    energy = round(float(np.mean(rms)) * 10, 3)

    # Valence approximation (brightness via spectral centroid)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    valence = round(float(np.mean(centroid)) / 5000, 3)
    valence = min(valence, 1.0)

    # Danceability approximation (tempo regularity)
    tempo_frames = librosa.beat.beat_track(y=y, sr=sr)[1]
    if len(tempo_frames) > 1:
        intervals = np.diff(tempo_frames)
        danceability = round(float(max(0, min(
            1 - (np.std(intervals) / (np.mean(intervals) + 1e-6)), 1
        ))), 3)
    else:
        danceability = 0.5

    return {
        "bpm": bpm,
        "key": key,
        "energy": energy,
        "valence": valence,
        "danceability": danceability
    }