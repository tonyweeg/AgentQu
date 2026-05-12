# No-Vocals - Audio Tools (YouTube + Vocal Removal)

You are the audio processing specialist. You help download audio from YouTube and separate vocals from tracks using AI.

## OVERVIEW

This skill provides two main features:
1. **YouTube Audio Download** - Extract MP3 from YouTube videos
2. **Vocal Separation** - Split audio into vocals + instrumental using Demucs AI

Output files:
- **MP3** - Downloaded YouTube audio
- **vocals.wav** - Isolated vocals
- **no_vocals.wav** - Instrumental track (karaoke)

## QUICK START

**When user invokes this skill, determine what they need:**

### Option A: YouTube Download Only
User wants to download audio from YouTube.
- Ask for the YouTube URL

### Option B: Vocal Removal Only
User has a local file and wants vocals separated.
- Ask for the file path

### Option C: Both (Download + Remove Vocals)
User wants to download from YouTube AND remove vocals.
- Ask for the YouTube URL
- Will do both in one step

## COMMANDS

### 1. Download YouTube Audio

```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py youtube "<YOUTUBE_URL>"
```

**With custom output directory:**
```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py youtube "<YOUTUBE_URL>" -o ~/Music
```

**Example:**
```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py youtube "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 2. Remove Vocals from Local File

```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py vocals "<FILE_PATH>"
```

**Example:**
```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py vocals "docs/Audio/song.mp3"
```

### 3. Download AND Remove Vocals (One Step)

```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py both "<YOUTUBE_URL>"
```

**Example:**
```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py both "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## EXPECTED OUTPUT

### YouTube Download
```
Downloading audio from YouTube...
URL: https://www.youtube.com/watch?v=...
--------------------------------------------------
Downloaded: Song Title.mp3 (4.2 MB)

==================================================
COMPLETE!
==================================================

Downloaded MP3:
  docs/Audio/Song Title.mp3 (4.2 MB)
```

### Vocal Separation
```
Processing vocals separation...
Input: song.mp3
--------------------------------------------------
[Progress bar showing separation]

==================================================
COMPLETE!
==================================================

Vocal Separation:
  Vocals:       docs/Audio/separated/htdemucs/song/vocals.wav (30.1 MB)
  Instrumental: docs/Audio/separated/htdemucs/song/no_vocals.wav (30.1 MB)
```

## REPORT TO USER

After completion, report:
```
✅ Audio processing complete!

📂 Files created:
- [MP3 file if downloaded]
- vocals.wav - Isolated vocals
- no_vocals.wav - Instrumental (karaoke track)

📍 Location: docs/Audio/separated/htdemucs/<name>/

🎵 You can now:
- Use no_vocals.wav as a karaoke track
- Use vocals.wav for remixing/sampling
- Import into your DAW for further editing
```

## SUPPORTED YOUTUBE FORMATS

These URL formats work:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

## SUPPORTED AUDIO FORMATS

For local files:
| Format | Extension | Notes |
|--------|-----------|-------|
| MP3 | .mp3 | Most common |
| WAV | .wav | Lossless |
| FLAC | .flac | Lossless compressed |
| OGG | .ogg | Open format |
| M4A | .m4a | Apple format |

## TROUBLESHOOTING

### Error: yt-dlp not found

```bash
source tools/vocal-remover-venv/bin/activate
pip install yt-dlp
```

### Error: ffmpeg not found

```bash
brew install ffmpeg
```

### Error: Video unavailable

- Check if video is region-locked
- Check if video is age-restricted
- Verify the URL is correct

### Error: Virtual environment not found

```bash
# Recreate the venv
~/.pyenv/versions/3.11.9/bin/python3 -m venv tools/vocal-remover-venv
source tools/vocal-remover-venv/bin/activate
pip install --upgrade pip
pip install demucs 'numpy<2' yt-dlp
```

### Error: NumPy version conflict

```bash
source tools/vocal-remover-venv/bin/activate
pip install 'numpy<2'
```

### Error: Out of memory (long audio)

For very long audio files (>10 min):
```bash
source tools/vocal-remover-venv/bin/activate && python -m demucs --two-stems=vocals --segment 10 -o "docs/Audio/separated" "<input_file>"
```

## BATCH PROCESSING

### Multiple YouTube URLs
```bash
source tools/vocal-remover-venv/bin/activate

urls=(
  "https://youtube.com/watch?v=VIDEO1"
  "https://youtube.com/watch?v=VIDEO2"
)

for url in "${urls[@]}"; do
  python tools/audio_tools.py both "$url"
done
```

### Multiple Local Files
```bash
source tools/vocal-remover-venv/bin/activate

for f in docs/Audio/*.mp3; do
  python tools/audio_tools.py vocals "$f"
done
```

## TOOL LOCATIONS

| Tool | Path |
|------|------|
| Combined Tool | `tools/audio_tools.py` |
| YouTube Only | `tools/youtube_audio.py` |
| Vocals Only | `tools/vocal_remover.py` |
| Virtual Env | `tools/vocal-remover-venv/` |
| Python | 3.11.9 (via pyenv) |

## EXAMPLE CONVERSATIONS

**User:** "Download this YouTube video as audio"
**You:** Ask for URL, then run:
```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py youtube "URL"
```

**User:** "Make a karaoke track from this YouTube link"
**You:** Use the combined command:
```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py both "URL"
```

**User:** "Remove vocals from docs/Audio/song.mp3"
**You:**
```bash
source tools/vocal-remover-venv/bin/activate && python tools/audio_tools.py vocals "docs/Audio/song.mp3"
```

## IMPORTANT NOTES

- **Rights**: Only download content you have rights to use
- **Processing Time**: ~1.5 sec per second of audio for vocal separation
- **First Run**: Downloads Demucs model (~80MB) - cached after
- **Output Format**: Separated files are always WAV (lossless)
- **Quality**: Best results on studio-quality recordings
