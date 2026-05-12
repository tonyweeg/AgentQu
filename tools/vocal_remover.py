#!/usr/bin/env python3
"""
Vocal Remover Tool
==================
Uses Demucs to separate vocals from audio tracks.

Usage:
    # From project root
    source tools/vocal-remover-venv/bin/activate
    python tools/vocal_remover.py <input_audio_file> [--output_dir <path>]

Examples:
    python tools/vocal_remover.py docs/Audio/song.mp3
    python tools/vocal_remover.py ~/Music/track.wav --output_dir ~/Desktop/separated

Output:
    Creates two files in output_dir/htdemucs/<filename>/
    - no_vocals.wav: Instrumental track (vocals removed)
    - vocals.wav: Isolated vocals
"""

import subprocess
import sys
import argparse
from pathlib import Path


def remove_vocals(input_path: str, output_dir: str = "separated") -> dict:
    """
    Remove vocals from an audio track using Demucs.

    Args:
        input_path: Path to the input audio file (mp3, wav, etc.)
        output_dir: Directory to store separated tracks

    Returns:
        dict with paths to 'vocals' and 'no_vocals' files
    """
    input_path = Path(input_path).resolve()
    output_dir = Path(output_dir).resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    print(f"Processing: {input_path.name}")
    print(f"Output directory: {output_dir}")
    print("-" * 50)

    # Run demucs with two-stems mode (vocals vs no_vocals)
    result = subprocess.run([
        sys.executable, "-m", "demucs",
        "--two-stems=vocals",
        "-o", str(output_dir),
        str(input_path)
    ], check=True)

    # Construct output paths
    stem_name = input_path.stem
    output_folder = output_dir / "htdemucs" / stem_name

    vocals_path = output_folder / "vocals.wav"
    no_vocals_path = output_folder / "no_vocals.wav"

    print("-" * 50)
    print(f"Vocals isolated: {vocals_path}")
    print(f"Instrumental: {no_vocals_path}")

    return {
        "vocals": str(vocals_path),
        "no_vocals": str(no_vocals_path),
        "output_folder": str(output_folder)
    }


def main():
    parser = argparse.ArgumentParser(
        description="Remove vocals from audio tracks using Demucs AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s song.mp3
    %(prog)s ~/Music/track.wav --output_dir ~/Desktop/separated
    %(prog)s concert.flac -o ./output

Supported formats: mp3, wav, flac, ogg, m4a, and more
        """
    )
    parser.add_argument("input", help="Path to input audio file")
    parser.add_argument(
        "-o", "--output_dir",
        default="separated",
        help="Output directory (default: 'separated')"
    )

    args = parser.parse_args()

    try:
        result = remove_vocals(args.input, args.output_dir)
        print(f"\nDone! Check: {result['output_folder']}")
        return 0
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as e:
        print(f"Demucs failed with exit code {e.returncode}", file=sys.stderr)
        return e.returncode


if __name__ == "__main__":
    sys.exit(main())
