#!/usr/bin/env python3
"""
YouTube Audio Extractor
=======================
Downloads audio from YouTube videos as MP3 files.

Usage:
    source tools/vocal-remover-venv/bin/activate
    python tools/youtube_audio.py <youtube_url> [--output_dir <path>]

Examples:
    python tools/youtube_audio.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    python tools/youtube_audio.py "https://youtu.be/dQw4w9WgXcQ" -o ~/Music

Output:
    Creates an MP3 file named after the video title in the output directory.

Note: Only use for content you have rights to download.
"""

import subprocess
import sys
import argparse
import re
from pathlib import Path


def sanitize_filename(name: str) -> str:
    """Remove invalid characters from filename."""
    # Remove characters that aren't allowed in filenames
    sanitized = re.sub(r'[<>:"/\\|?*]', '', name)
    # Replace multiple spaces with single space
    sanitized = re.sub(r'\s+', ' ', sanitized)
    return sanitized.strip()


def extract_audio(url: str, output_dir: str = "docs/Audio") -> dict:
    """
    Extract audio from a YouTube video as MP3.

    Args:
        url: YouTube video URL
        output_dir: Directory to save the MP3 file

    Returns:
        dict with 'file' path and 'title'
    """
    output_dir = Path(output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Downloading audio from: {url}")
    print(f"Output directory: {output_dir}")
    print("-" * 50)

    # Use yt-dlp to extract audio as MP3
    # Output template: video title with sanitized filename
    output_template = str(output_dir / "%(title)s.%(ext)s")

    result = subprocess.run([
        sys.executable, "-m", "yt_dlp",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",  # Best quality
        "--output", output_template,
        "--no-playlist",  # Don't download playlists
        "--print", "after_move:filepath",  # Print final filename
        url
    ], capture_output=True, text=True, check=True)

    # Get the output file path from yt-dlp output
    output_lines = result.stdout.strip().split('\n')
    output_file = output_lines[-1] if output_lines else None

    if output_file and Path(output_file).exists():
        file_path = Path(output_file)
        file_size = file_path.stat().st_size / (1024 * 1024)  # MB

        print("-" * 50)
        print(f"Downloaded: {file_path.name}")
        print(f"Size: {file_size:.1f} MB")
        print(f"Location: {file_path}")

        return {
            "file": str(file_path),
            "title": file_path.stem,
            "size_mb": round(file_size, 1)
        }
    else:
        raise RuntimeError("Failed to determine output file path")


def main():
    parser = argparse.ArgumentParser(
        description="Extract audio from YouTube videos as MP3",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s "https://www.youtube.com/watch?v=VIDEO_ID"
    %(prog)s "https://youtu.be/VIDEO_ID" -o ~/Music
    %(prog)s "https://www.youtube.com/watch?v=VIDEO_ID" --output_dir ./downloads

Note: Only use for content you have rights to download.
        """
    )
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument(
        "-o", "--output_dir",
        default="docs/Audio",
        help="Output directory (default: 'docs/Audio')"
    )

    args = parser.parse_args()

    try:
        result = extract_audio(args.url, args.output_dir)
        print(f"\nDone! File saved: {result['file']}")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"yt-dlp error: {e.stderr}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
