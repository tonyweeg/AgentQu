#!/usr/bin/env python3
"""
Audio Tools - YouTube Download + Vocal Removal
===============================================
Combined tool for downloading YouTube audio and separating vocals.

Usage:
    source tools/vocal-remover-venv/bin/activate

    # Download YouTube audio only
    python tools/audio_tools.py youtube "https://youtube.com/watch?v=..."

    # Remove vocals from local file
    python tools/audio_tools.py vocals /path/to/audio.mp3

    # Download AND remove vocals in one step
    python tools/audio_tools.py both "https://youtube.com/watch?v=..."

Commands:
    youtube  - Download audio from YouTube as MP3
    vocals   - Remove vocals from a local audio file
    both     - Download from YouTube then remove vocals

Note: Only download content you have rights to use.
"""

import subprocess
import sys
import argparse
from pathlib import Path


def download_youtube(url: str, output_dir: str = "docs/Audio") -> str:
    """Download audio from YouTube and return the file path."""
    output_dir = Path(output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Downloading audio from YouTube...")
    print(f"URL: {url}")
    print("-" * 50)

    output_template = str(output_dir / "%(title)s.%(ext)s")

    result = subprocess.run([
        sys.executable, "-m", "yt_dlp",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", output_template,
        "--no-playlist",
        "--print", "after_move:filepath",
        url
    ], capture_output=True, text=True, check=True)

    output_file = result.stdout.strip().split('\n')[-1]

    if output_file and Path(output_file).exists():
        size_mb = Path(output_file).stat().st_size / (1024 * 1024)
        print(f"Downloaded: {Path(output_file).name} ({size_mb:.1f} MB)")
        return output_file
    else:
        raise RuntimeError("Download failed - could not find output file")


def remove_vocals(input_path: str, output_dir: str = "docs/Audio/separated") -> dict:
    """Remove vocals using Demucs and return paths to output files."""
    input_path = Path(input_path).resolve()
    output_dir = Path(output_dir).resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    print(f"\nProcessing vocals separation...")
    print(f"Input: {input_path.name}")
    print("-" * 50)

    subprocess.run([
        sys.executable, "-m", "demucs",
        "--two-stems=vocals",
        "-o", str(output_dir),
        str(input_path)
    ], check=True)

    stem_name = input_path.stem
    output_folder = output_dir / "htdemucs" / stem_name

    return {
        "vocals": str(output_folder / "vocals.wav"),
        "no_vocals": str(output_folder / "no_vocals.wav"),
        "output_folder": str(output_folder)
    }


def print_results(downloaded_file: str = None, vocal_results: dict = None):
    """Print final results summary."""
    print("\n" + "=" * 50)
    print("COMPLETE!")
    print("=" * 50)

    if downloaded_file:
        size = Path(downloaded_file).stat().st_size / (1024 * 1024)
        print(f"\nDownloaded MP3:")
        print(f"  {downloaded_file} ({size:.1f} MB)")

    if vocal_results:
        vocals_size = Path(vocal_results['vocals']).stat().st_size / (1024 * 1024)
        no_vocals_size = Path(vocal_results['no_vocals']).stat().st_size / (1024 * 1024)
        print(f"\nVocal Separation:")
        print(f"  Vocals:       {vocal_results['vocals']} ({vocals_size:.1f} MB)")
        print(f"  Instrumental: {vocal_results['no_vocals']} ({no_vocals_size:.1f} MB)")


def main():
    parser = argparse.ArgumentParser(
        description="Audio Tools - YouTube Download + Vocal Removal",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # YouTube download command
    yt_parser = subparsers.add_parser("youtube", help="Download audio from YouTube")
    yt_parser.add_argument("url", help="YouTube video URL")
    yt_parser.add_argument("-o", "--output_dir", default="docs/Audio",
                          help="Output directory (default: docs/Audio)")

    # Vocal removal command
    vocals_parser = subparsers.add_parser("vocals", help="Remove vocals from audio file")
    vocals_parser.add_argument("input", help="Input audio file path")
    vocals_parser.add_argument("-o", "--output_dir", default="docs/Audio/separated",
                              help="Output directory (default: docs/Audio/separated)")

    # Combined command
    both_parser = subparsers.add_parser("both", help="Download from YouTube AND remove vocals")
    both_parser.add_argument("url", help="YouTube video URL")
    both_parser.add_argument("-o", "--output_dir", default="docs/Audio",
                            help="Base output directory (default: docs/Audio)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    try:
        if args.command == "youtube":
            output_file = download_youtube(args.url, args.output_dir)
            print_results(downloaded_file=output_file)

        elif args.command == "vocals":
            results = remove_vocals(args.input, args.output_dir)
            print_results(vocal_results=results)

        elif args.command == "both":
            # Download first
            output_file = download_youtube(args.url, args.output_dir)
            # Then remove vocals
            separated_dir = str(Path(args.output_dir) / "separated")
            results = remove_vocals(output_file, separated_dir)
            print_results(downloaded_file=output_file, vocal_results=results)

        return 0

    except subprocess.CalledProcessError as e:
        print(f"\nCommand failed with exit code {e.returncode}", file=sys.stderr)
        if e.stderr:
            print(e.stderr, file=sys.stderr)
        return e.returncode
    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
