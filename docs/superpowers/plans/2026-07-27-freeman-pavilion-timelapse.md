# Freeman Arts Pavilion Timelapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build reproducible landscape and Reel videos that turn the four Freeman construction-image groups, finished photography, approved typography, Gillis Gilkerson branding, and supplied music into the approved Cinematic Build Pulse edit.

**Architecture:** A small Python package scans and validates the read-only source media, creates deterministic selection manifests, composes frames with Pillow, and delegates temporal filtering, audio editing, encoding, and probing to FFmpeg. Generated media stays in a project-local ignored work tree; source files are never mutated.

**Tech Stack:** Python 3.13, Pillow 12.3, standard-library `unittest`, FFmpeg/FFprobe 8.0.1, H.264/AAC, Google Fonts assets pinned to google/fonts commit `7ff85c87f93ea6cca5f41c69f2e4edcb90240f26`.

## Global Constraints

- Treat `/Users/tonyweeg/Downloads/GGI Freeman Backup` as read-only.
- Source counts must remain exactly 3,958 / 9,988 / 3,117 / 4,232 construction JPEGs and 37 Megan Powell finished photographs.
- Source EXIF dates must remain monotonic from 2024-12-09 09:00 through 2026-07-08 09:45.
- Landscape output: 1920×1080, `24000/1001`, 1,870 frames, H.264 High profile, `yuv420p`, AAC stereo.
- Reel output: 1080×1920, `24000/1001`, 1,438 frames, H.264 High profile, `yuv420p`, AAC stereo.
- Landscape construction allocation: 291 / 736 / 230 / 312 frames by group.
- Reel construction allocation: 226 / 571 / 178 / 242 frames by group.
- All title, month, year, and date text is pure white.
- Gillis Gilkerson blue is exactly `#04579E` and appears only in the date rule and supplied logo.
- Fonts are Barlow Condensed ExtraBold and Space Grotesk variable weight; Bebas Neue is prohibited.
- Title copy is `FROM GROUND TO STAGE` with `Freeman Arts Pavilion`.
- Every month from December 2024 through July 2026 must be represented.
- Camera bands are removed with one stable crop per source group.
- Apply FFmpeg `deflicker=size=5:mode=am` before typography.
- Do not use optical-flow interpolation, ghost blending, blurred-fill backgrounds, soft slideshow dissolves, time stretching, pitch shifting, or tempo changes.
- Both videos end on the supplied Gillis Gilkerson logo against pure black.

---

## File map

Create the following focused project under `video-projects/freeman-pavilion-timelapse/`:

```text
video-projects/freeman-pavilion-timelapse/
├── .gitignore                       # Generated-media exclusions
├── README.md                        # Reproduction and output instructions
├── build.py                         # CLI entry point only
├── assets/
│   └── asset-manifest.json          # Pinned URLs, filenames, logo digest
├── freeman_video/
│   ├── __init__.py
│   ├── assets.py                    # Download and validate fonts/logo
│   ├── config.py                    # Immutable source/output/edit specs
│   ├── manifest.py                  # EXIF scan and deterministic selection
│   ├── frames.py                    # Crop, scale, type, title, montage, logo
│   ├── media.py                     # FFmpeg, FFprobe, audio, encode helpers
│   └── pipeline.py                  # Stage orchestration and build state
└── tests/
    ├── test_assets.py
    ├── test_config.py
    ├── test_manifest.py
    ├── test_frames.py
    ├── test_media.py
    └── test_pipeline.py
```

Generated directories are created at runtime and ignored:

```text
assets/downloaded/
manifests/
work/
proofs/
outputs/
verification/
```

---

### Task 1: Project foundation, immutable configuration, and pinned assets

**Files:**
- Create: `video-projects/freeman-pavilion-timelapse/.gitignore`
- Create: `video-projects/freeman-pavilion-timelapse/README.md`
- Create: `video-projects/freeman-pavilion-timelapse/assets/asset-manifest.json`
- Create: `video-projects/freeman-pavilion-timelapse/freeman_video/__init__.py`
- Create: `video-projects/freeman-pavilion-timelapse/freeman_video/config.py`
- Create: `video-projects/freeman-pavilion-timelapse/freeman_video/assets.py`
- Create: `video-projects/freeman-pavilion-timelapse/tests/test_config.py`
- Create: `video-projects/freeman-pavilion-timelapse/tests/test_assets.py`

**Interfaces:**
- Consumes: The approved design specification and user-supplied source paths.
- Produces: `GROUPS`, `FINISHED_DIR`, `MUSIC_PATH`, `FORMATS`, `AssetSpec`, `FormatSpec`, and `ensure_assets(project_root: Path) -> dict[str, Path]`.

- [ ] **Step 1: Write configuration tests**

```python
# tests/test_config.py
import unittest
from fractions import Fraction

from freeman_video.config import FORMATS, FPS, GROUPS, GGI_BLUE


class ConfigTest(unittest.TestCase):
    def test_global_video_constants_are_locked(self):
        self.assertEqual(FPS, Fraction(24000, 1001))
        self.assertEqual(GGI_BLUE, (4, 87, 158))
        self.assertEqual([group.expected_count for group in GROUPS], [3958, 9988, 3117, 4232])

    def test_frame_budgets_are_internally_consistent(self):
        landscape = FORMATS["landscape"]
        reel = FORMATS["reel"]
        self.assertEqual(sum(landscape.segment_frames), landscape.total_frames)
        self.assertEqual(sum(reel.segment_frames), reel.total_frames)
        self.assertEqual(landscape.group_allocations, (291, 736, 230, 312))
        self.assertEqual(reel.group_allocations, (226, 571, 178, 242))
        self.assertEqual((landscape.width, landscape.height), (1920, 1080))
        self.assertEqual((reel.width, reel.height), (1080, 1920))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Write asset-integrity tests**

```python
# tests/test_assets.py
import hashlib
import tempfile
import unittest
from pathlib import Path

from freeman_video.assets import digest_file, validate_asset
from freeman_video.config import AssetSpec


class AssetTest(unittest.TestCase):
    def test_digest_file_returns_sha256(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "asset.bin"
            path.write_bytes(b"ggi")
            self.assertEqual(
                digest_file(path),
                hashlib.sha256(b"ggi").hexdigest(),
            )

    def test_validate_asset_rejects_wrong_digest(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "logo.png"
            path.write_bytes(b"wrong")
            spec = AssetSpec("logo", "logo.png", "https://example.invalid/logo.png", "0" * 64)
            with self.assertRaisesRegex(ValueError, "digest mismatch"):
                validate_asset(path, spec)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests and verify they fail**

Run from `video-projects/freeman-pavilion-timelapse`:

```bash
python3 -m unittest tests.test_config tests.test_assets -v
```

Expected: import failures because `freeman_video.config` and `freeman_video.assets` do not exist.

- [ ] **Step 4: Implement immutable configuration**

```python
# freeman_video/config.py
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path

SOURCE_ROOT = Path("/Users/tonyweeg/Downloads/GGI Freeman Backup")
FINISHED_DIR = SOURCE_ROOT / "Freeman Arts Pavilion - Still Photography" / "Freeman_Arts_Pavilion_MeganPowellPhotography"
MUSIC_PATH = SOURCE_ROOT / "Music" / "ENV1_PUCD_SHORT_01.wav"
FPS = Fraction(24000, 1001)
GGI_BLUE = (4, 87, 158)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)


@dataclass(frozen=True)
class GroupSpec:
    index: int
    directory: Path
    expected_count: int


@dataclass(frozen=True)
class FormatSpec:
    name: str
    width: int
    height: int
    total_frames: int
    teaser_frames: int
    title_frames: int
    construction_frames: int
    finale_frames: int
    logo_frames: int
    group_allocations: tuple[int, int, int, int]
    output_name: str

    @property
    def segment_frames(self) -> tuple[int, int, int, int]:
        return (
            self.teaser_frames,
            self.title_frames,
            self.construction_frames,
            self.finale_frames,
        )


@dataclass(frozen=True)
class AssetSpec:
    key: str
    filename: str
    url: str
    sha256: str | None = None


GROUPS = tuple(
    GroupSpec(index, SOURCE_ROOT / f"Freeman_Group_{index}", count)
    for index, count in enumerate((3958, 9988, 3117, 4232), start=1)
)

FORMATS = {
    "landscape": FormatSpec(
        "landscape", 1920, 1080, 1870, 86, 36, 1569, 179, 42,
        (291, 736, 230, 312),
        "freeman-from-ground-to-stage-landscape.mp4",
    ),
    "reel": FormatSpec(
        "reel", 1080, 1920, 1438, 60, 30, 1217, 131, 36,
        (226, 571, 178, 242),
        "freeman-from-ground-to-stage-reel.mp4",
    ),
}
```

- [ ] **Step 5: Add the pinned asset manifest**

```json
{
  "google_fonts_commit": "7ff85c87f93ea6cca5f41c69f2e4edcb90240f26",
  "assets": [
    {
      "key": "barlow",
      "filename": "BarlowCondensed-ExtraBold.ttf",
      "url": "https://raw.githubusercontent.com/google/fonts/7ff85c87f93ea6cca5f41c69f2e4edcb90240f26/ofl/barlowcondensed/BarlowCondensed-ExtraBold.ttf"
    },
    {
      "key": "space",
      "filename": "SpaceGrotesk-wght.ttf",
      "url": "https://raw.githubusercontent.com/google/fonts/7ff85c87f93ea6cca5f41c69f2e4edcb90240f26/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf"
    },
    {
      "key": "ggi_logo",
      "filename": "gillis-gilkerson-logo.png",
      "url": "https://ggibuilds.com/wp-content/uploads/2023/05/updated-logo-no-space-on-sides.png",
      "sha256": "d9728952154df105410921d9714e0bb97a1410c3f533fc360d5ad36fafda1819"
    }
  ]
}
```

- [ ] **Step 6: Implement asset download and validation**

```python
# freeman_video/assets.py
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

from PIL import Image, ImageFont

from .config import AssetSpec


def digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_asset(path: Path, spec: AssetSpec) -> None:
    if spec.sha256 and digest_file(path) != spec.sha256:
        raise ValueError(f"{spec.key} digest mismatch: {path}")
    if path.suffix.lower() == ".ttf":
        ImageFont.truetype(str(path), 32)
    elif path.suffix.lower() == ".png":
        with Image.open(path) as image:
            image.verify()


def ensure_assets(project_root: Path) -> dict[str, Path]:
    manifest_path = project_root / "assets" / "asset-manifest.json"
    payload = json.loads(manifest_path.read_text())
    output_dir = project_root / "assets" / "downloaded"
    output_dir.mkdir(parents=True, exist_ok=True)
    resolved: dict[str, Path] = {}
    for item in payload["assets"]:
        spec = AssetSpec(**item)
        destination = output_dir / spec.filename
        if not destination.exists():
            with urlopen(spec.url, timeout=30) as response:
                destination.write_bytes(response.read())
        validate_asset(destination, spec)
        resolved[spec.key] = destination
    return resolved
```

- [ ] **Step 7: Add generated-media exclusions**

```gitignore
assets/downloaded/
manifests/
work/
proofs/
outputs/
verification/
__pycache__/
tests/__pycache__/
```

- [ ] **Step 8: Run tests and asset validation**

```bash
python3 -m unittest tests.test_config tests.test_assets -v
python3 -c "from pathlib import Path; from freeman_video.assets import ensure_assets; print(ensure_assets(Path.cwd()))"
```

Expected: four tests pass; asset paths for Barlow, Space Grotesk, and the GGI logo print successfully.

- [ ] **Step 9: Commit the foundation**

```bash
git add video-projects/freeman-pavilion-timelapse
git commit -m "feat: scaffold Freeman video production"
```

---

### Task 2: EXIF scanner and deterministic image-selection manifests

**Files:**
- Create: `video-projects/freeman-pavilion-timelapse/freeman_video/manifest.py`
- Create: `video-projects/freeman-pavilion-timelapse/tests/test_manifest.py`

**Interfaces:**
- Consumes: `GroupSpec`, `FormatSpec`, `GROUPS`, `FORMATS`.
- Produces: `SourceFrame`, `SelectionManifest`, `scan_group(group: GroupSpec) -> list[SourceFrame]`, `select_group(frames: list[SourceFrame], count: int) -> list[SourceFrame]`, `build_manifest(format_spec: FormatSpec) -> SelectionManifest`, and `write_source_inventory(paths: list[Path], destination: Path) -> str`.

- [ ] **Step 1: Write EXIF and selection tests**

```python
# tests/test_manifest.py
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

from PIL import Image

from freeman_video.config import GroupSpec
from freeman_video.manifest import scan_group, select_group


def write_jpeg(path: Path, captured_at: datetime) -> None:
    image = Image.new("RGB", (64, 48), "gray")
    exif = Image.Exif()
    exif[36867] = captured_at.strftime("%Y:%m:%d %H:%M:%S")
    image.save(path, exif=exif)


class ManifestTest(unittest.TestCase):
    def test_scan_group_reads_and_sorts_exif(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            start = datetime(2025, 1, 31, 8, 0)
            for index in range(6):
                write_jpeg(root / f"RCNX{index:04d}.JPG", start + timedelta(days=index))
            frames = scan_group(GroupSpec(1, root, 6))
            self.assertEqual(frames[0].captured_at, start)
            self.assertEqual(frames[-1].captured_at, start + timedelta(days=5))

    def test_select_group_is_uniform_and_forces_month_boundary(self):
        start = datetime(2025, 1, 28, 8, 0)
        frames = [
            type("Frame", (), {
                "path": Path(f"{index}.jpg"),
                "captured_at": start + timedelta(days=index),
                "group_index": 1,
                "source_index": index,
            })()
            for index in range(10)
        ]
        selected = select_group(frames, 4)
        self.assertEqual(len(selected), 4)
        self.assertIn(datetime(2025, 2, 1, 8, 0), [frame.captured_at for frame in selected])
        self.assertEqual(selected, sorted(selected, key=lambda frame: frame.captured_at))

    def test_scan_group_rejects_missing_exif(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            Image.new("RGB", (64, 48), "gray").save(root / "RCNX0001.JPG")
            with self.assertRaisesRegex(ValueError, "missing EXIF capture date"):
                scan_group(GroupSpec(1, root, 1))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
python3 -m unittest tests.test_manifest -v
```

Expected: import failure because `freeman_video.manifest` does not exist.

- [ ] **Step 3: Implement scanning, uniform selection, and boundary replacement**

```python
# freeman_video/manifest.py
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from PIL import Image

from .config import FORMATS, GROUPS, FormatSpec, GroupSpec

EXIF_DATE_TIME_ORIGINAL = 36867


@dataclass(frozen=True)
class SourceFrame:
    path: Path
    captured_at: datetime
    group_index: int
    source_index: int


@dataclass(frozen=True)
class SelectionManifest:
    format_name: str
    frames: tuple[SourceFrame, ...]

    def to_json(self) -> dict:
        return {
            "format": self.format_name,
            "frames": [
                {
                    **asdict(frame),
                    "path": str(frame.path),
                    "captured_at": frame.captured_at.isoformat(),
                }
                for frame in self.frames
            ],
        }


def read_capture_date(path: Path) -> datetime:
    with Image.open(path) as image:
        value = image.getexif().get(EXIF_DATE_TIME_ORIGINAL)
    if not value:
        raise ValueError(f"missing EXIF capture date: {path}")
    return datetime.strptime(value, "%Y:%m:%d %H:%M:%S")


def scan_group(group: GroupSpec) -> list[SourceFrame]:
    paths = sorted(
        path for path in group.directory.iterdir()
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg"}
    )
    if len(paths) != group.expected_count:
        raise ValueError(
            f"group {group.index} expected {group.expected_count} JPEGs, found {len(paths)}"
        )
    frames = [
        SourceFrame(path, read_capture_date(path), group.index, index)
        for index, path in enumerate(paths)
    ]
    if any(left.captured_at >= right.captured_at for left, right in zip(frames, frames[1:])):
        raise ValueError(f"group {group.index} EXIF dates are not strictly monotonic")
    return frames


def uniform_indices(size: int, count: int) -> list[int]:
    if count < 2 or count > size:
        raise ValueError(f"invalid selection count {count} for {size} frames")
    return [round(index * (size - 1) / (count - 1)) for index in range(count)]


def month_starts(frames: list[SourceFrame]) -> list[int]:
    starts = [0]
    for index in range(1, len(frames)):
        previous = frames[index - 1].captured_at
        current = frames[index].captured_at
        if (previous.year, previous.month) != (current.year, current.month):
            starts.append(index)
    return starts


def select_group(frames: list[SourceFrame], count: int) -> list[SourceFrame]:
    selected = set(uniform_indices(len(frames), count))
    for boundary in month_starts(frames):
        if boundary in selected:
            continue
        replaceable = min(
            (index for index in selected if index not in month_starts(frames)),
            key=lambda index: abs(index - boundary),
        )
        selected.remove(replaceable)
        selected.add(boundary)
    return [frames[index] for index in sorted(selected)]


def build_manifest(format_spec: FormatSpec) -> SelectionManifest:
    all_selected: list[SourceFrame] = []
    previous_last: datetime | None = None
    for group, count in zip(GROUPS, format_spec.group_allocations):
        scanned = scan_group(group)
        if previous_last and scanned[0].captured_at <= previous_last:
            raise ValueError(f"group {group.index} overlaps the previous group")
        selected = select_group(scanned, count)
        all_selected.extend(selected)
        previous_last = scanned[-1].captured_at
    if len(all_selected) != format_spec.construction_frames:
        raise ValueError("construction frame allocation mismatch")
    return SelectionManifest(format_spec.name, tuple(all_selected))
```

- [ ] **Step 4: Add deterministic source-inventory evidence**

Add this test:

```python
def test_source_inventory_digest_changes_when_metadata_changes(self):
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        path = root / "frame.jpg"
        path.write_bytes(b"frame")
        first = write_source_inventory([path], root / "before.json")
        path.write_bytes(b"changed frame")
        second = write_source_inventory([path], root / "after.json")
        self.assertNotEqual(first, second)
```

Implement:

```python
import hashlib
import json


def write_source_inventory(paths: list[Path], destination: Path) -> str:
    records = []
    for path in sorted(paths):
        stat = path.stat()
        records.append({
            "path": str(path),
            "size": stat.st_size,
            "mtime_ns": stat.st_mtime_ns,
        })
    serialized = json.dumps(records, indent=2, sort_keys=True)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(serialized)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
```

The scan command writes `manifests/source-inventory-before.json`. The verify command rescans the identical resolved source-path list into `manifests/source-inventory-after.json` and requires the returned SHA-256 digests to match.

- [ ] **Step 5: Run focused tests**

```bash
python3 -m unittest tests.test_manifest -v
```

Expected: all four tests pass.

- [ ] **Step 6: Build and validate real manifests**

```bash
python3 -c "
import json
from pathlib import Path
from freeman_video.config import FORMATS
from freeman_video.manifest import build_manifest
out = Path('manifests')
out.mkdir(exist_ok=True)
for name, spec in FORMATS.items():
    manifest = build_manifest(spec)
    (out / f'{name}.json').write_text(json.dumps(manifest.to_json(), indent=2))
    print(name, len(manifest.frames), manifest.frames[0].captured_at, manifest.frames[-1].captured_at)
"
```

Expected:

```text
landscape 1569 2024-12-09 09:00:00 2026-07-08 09:45:00
reel 1217 2024-12-09 09:00:00 2026-07-08 09:45:00
```

- [ ] **Step 7: Commit scanner and manifests code**

```bash
git add video-projects/freeman-pavilion-timelapse/freeman_video/manifest.py \
  video-projects/freeman-pavilion-timelapse/tests/test_manifest.py
git commit -m "feat: build deterministic Freeman image manifests"
```

---

### Task 3: Frame preparation and typography compositor

**Files:**
- Create: `video-projects/freeman-pavilion-timelapse/freeman_video/frames.py`
- Create: `video-projects/freeman-pavilion-timelapse/tests/test_frames.py`

**Interfaces:**
- Consumes: `SelectionManifest`, `FormatSpec`, resolved font/logo paths.
- Produces: `detect_camera_crop(image: Image.Image) -> tuple[int, int, int, int]`, `cover_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image`, `render_backgrounds(...)`, `overlay_construction_typography(...)`, `render_teaser(...)`, `render_title(...)`, `render_finale(...)`, and `render_logo_splash(...)`.

- [ ] **Step 1: Write crop and typography tests**

```python
# tests/test_frames.py
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageFont

from freeman_video.config import GGI_BLUE, WHITE
from freeman_video.frames import cover_crop, detect_camera_crop, month_alpha


class FrameTest(unittest.TestCase):
    def test_detect_camera_crop_removes_black_bands(self):
        image = Image.new("RGB", (200, 140), "black")
        image.paste((90, 120, 90), (0, 12, 200, 130))
        self.assertEqual(detect_camera_crop(image), (0, 12, 200, 130))

    def test_cover_crop_returns_exact_dimensions(self):
        image = Image.new("RGB", (200, 140), "green")
        self.assertEqual(cover_crop(image, (192, 108)).size, (192, 108))
        self.assertEqual(cover_crop(image, (108, 192)).size, (108, 192))

    def test_month_alpha_has_short_white_text_ramp(self):
        values = [month_alpha(index, 14) for index in range(14)]
        self.assertEqual(values[0], 0)
        self.assertEqual(values[3], 255)
        self.assertEqual(values[-1], 0)
        self.assertTrue(all(0 <= value <= 255 for value in values))
        self.assertEqual(WHITE, (255, 255, 255))
        self.assertEqual(GGI_BLUE, (4, 87, 158))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
python3 -m unittest tests.test_frames -v
```

Expected: import failure because `freeman_video.frames` does not exist.

- [ ] **Step 3: Implement stable crop and cover scaling**

```python
# core of freeman_video/frames.py
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageStat

from .config import BLACK, GGI_BLUE, WHITE, FormatSpec


def detect_camera_crop(image: Image.Image) -> tuple[int, int, int, int]:
    gray = image.convert("L")
    medians = [
        ImageStat.Stat(gray.crop((0, y, gray.width, y + 1))).median[0]
        for y in range(gray.height)
    ]
    content_rows = [index for index, median in enumerate(medians) if median > 12]
    if not content_rows:
        raise ValueError("camera-band detection found no content")
    return (0, content_rows[0], image.width, content_rows[-1] + 1)


def cover_crop(image: Image.Image, size: tuple[int, int], anchor_x: float = 0.5) -> Image.Image:
    target_width, target_height = size
    scale = max(target_width / image.width, target_height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = round((resized.width - target_width) * anchor_x)
    top = round((resized.height - target_height) / 2)
    return resized.crop((left, top, left + target_width, top + target_height))


def month_alpha(index: int, duration: int = 14) -> int:
    ramp = 3
    if index < ramp:
        return round(255 * index / ramp)
    if index >= duration - ramp:
        return round(255 * (duration - 1 - index) / (ramp - 1))
    return 255
```

- [ ] **Step 4: Implement the two-pass construction renderer**

Add functions with these exact signatures:

```python
def render_backgrounds(
    manifest,
    format_spec: FormatSpec,
    raw_directory: Path,
    group_crops: dict[int, tuple[int, int, int, int]],
) -> None:
    """Crop bands, cover-scale, and write clean sequential PNG backgrounds."""


def overlay_construction_typography(
    stabilized_directory: Path,
    manifest,
    format_spec: FormatSpec,
    output_directory: Path,
    barlow_path: Path,
    space_path: Path,
) -> None:
    """Add white month/year hits and the persistent white EXIF date counter."""
```

Implementation requirements:

```python
date_text = frame.captured_at.strftime("%m/%d/%Y")
month_text = frame.captured_at.strftime("%B").upper()
year_text = frame.captured_at.strftime("%Y")

# Only the compact date rule uses brand blue.
draw.rectangle(rule_box, fill=GGI_BLUE)
draw.text(date_position, date_text, font=space_font, fill=WHITE)
draw.text(month_position, month_text, font=barlow_font, fill=(*WHITE, alpha))
draw.text(year_position, year_text, font=barlow_year_font, fill=(*WHITE, alpha))
```

The first 14 selected frames in every new month receive the month/year overlay. Typography is added only after deflicker stabilization.

- [ ] **Step 5: Implement teaser, title, finale, and logo frame generators**

Use these exact public functions:

```python
def render_teaser(
    finished_paths: list[Path],
    format_spec: FormatSpec,
    output_directory: Path,
) -> None:
    """Render 86 landscape or 60 Reel frames from eight or seven reverse-ordered photos."""


def render_title(
    format_spec: FormatSpec,
    output_directory: Path,
    barlow_path: Path,
    space_path: Path,
) -> None:
    """Render the approved staged white-on-black title reveal."""


def render_finale(
    finished_paths: list[Path],
    format_spec: FormatSpec,
    non_logo_frames: int,
    output_directory: Path,
) -> None:
    """Render hard-cut finished-photo frames with restrained linear push-ins."""


def render_logo_splash(
    logo_path: Path,
    format_spec: FormatSpec,
    output_directory: Path,
) -> None:
    """Crop transparent padding and center the unmodified mark on pure black."""
```

Use deterministic photo indices spread through the 37 sorted files:

```python
LANDSCAPE_TEASER_INDICES = (36, 31, 26, 21, 16, 11, 6, 1)
REEL_TEASER_INDICES = (36, 30, 24, 18, 12, 6, 0)
LANDSCAPE_FINALE_INDICES = (0, 4, 8, 12, 16, 20, 24, 28, 32, 36)
REEL_FINALE_INDICES = (0, 6, 12, 18, 24, 30, 36)
```

- [ ] **Step 6: Run focused tests**

```bash
python3 -m unittest tests.test_frames -v
```

Expected: all three tests pass.

- [ ] **Step 7: Render a six-frame typography fixture and inspect it**

```bash
python3 -m unittest tests.test_frames -v
```

Add a test helper that writes representative landscape and Reel PNGs into a temporary directory, then inspect them with the local image viewer. Verify white typography, brand-blue rule only, correct date format, and exact dimensions.

- [ ] **Step 8: Commit frame composition**

```bash
git add video-projects/freeman-pavilion-timelapse/freeman_video/frames.py \
  video-projects/freeman-pavilion-timelapse/tests/test_frames.py
git commit -m "feat: compose Freeman video frames"
```

---

### Task 4: FFmpeg video stabilization, audio edits, encoding, and probing

**Files:**
- Create: `video-projects/freeman-pavilion-timelapse/freeman_video/media.py`
- Create: `video-projects/freeman-pavilion-timelapse/tests/test_media.py`

**Interfaces:**
- Consumes: numbered PNG frame directories, `MUSIC_PATH`, `FPS`, and `FormatSpec`.
- Produces: `run_checked(args: list[str])`, `stabilize_frames(...)`, `build_audio(...)`, `encode_video(...)`, `mux_output(...)`, and `probe_output(path: Path) -> dict`.

- [ ] **Step 1: Write command-construction and duration tests**

```python
# tests/test_media.py
import unittest

from freeman_video.config import FORMATS, FPS
from freeman_video.media import duration_seconds, landscape_audio_filter, reel_audio_filter


class MediaTest(unittest.TestCase):
    def test_frame_durations_are_exact(self):
        self.assertAlmostEqual(duration_seconds(1870), 77.9945833333, places=6)
        self.assertAlmostEqual(duration_seconds(1438), 59.9765833333, places=6)

    def test_landscape_audio_filter_reverses_tail_then_uses_full_track(self):
        expression = landscape_audio_filter(74.425011)
        self.assertIn("areverse", expression)
        self.assertIn("concat=n=2:v=0:a=1", expression)
        self.assertIn("atrim=duration=77.994583", expression)

    def test_reel_audio_filter_preserves_final_five_point_five_seconds(self):
        expression = reel_audio_filter(74.425011)
        self.assertIn("acrossfade=d=0.080", expression)
        self.assertIn("atrim=start=68.925011", expression)
        self.assertIn("atrim=duration=59.976583", expression)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
python3 -m unittest tests.test_media -v
```

Expected: import failure because `freeman_video.media` does not exist.

- [ ] **Step 3: Implement exact duration and audio filters**

```python
# core of freeman_video/media.py
import json
import subprocess
from fractions import Fraction
from pathlib import Path

from .config import FPS, FormatSpec


def duration_seconds(frame_count: int) -> float:
    return float(Fraction(frame_count, 1) / FPS)


def landscape_audio_filter(track_duration: float) -> str:
    output_duration = duration_seconds(1870)
    reverse_duration = output_duration - track_duration
    reverse_start = track_duration - reverse_duration
    return (
        f"[0:a]atrim=start={reverse_start:.6f}:end={track_duration:.6f},"
        "areverse,asetpts=PTS-STARTPTS[reverse];"
        "[0:a]asetpts=PTS-STARTPTS[forward];"
        "[reverse][forward]concat=n=2:v=0:a=1,"
        f"atrim=duration={output_duration:.6f},asetpts=PTS-STARTPTS[aout]"
    )


def reel_audio_filter(track_duration: float) -> str:
    output_duration = duration_seconds(1438)
    reverse_duration = duration_seconds(60)
    forward_duration = output_duration - reverse_duration
    crossfade = 0.080
    tail_duration = 5.500
    head_duration = forward_duration - tail_duration + crossfade
    tail_start = track_duration - tail_duration
    return (
        f"[0:a]atrim=start={track_duration - reverse_duration:.6f}:"
        f"end={track_duration:.6f},areverse,asetpts=PTS-STARTPTS[reverse];"
        f"[0:a]atrim=start=0:end={head_duration:.6f},asetpts=PTS-STARTPTS[head];"
        f"[0:a]atrim=start={tail_start:.6f}:end={track_duration:.6f},"
        "asetpts=PTS-STARTPTS[tail];"
        f"[head][tail]acrossfade=d={crossfade:.3f}:c1=tri:c2=tri[forward];"
        "[reverse][forward]concat=n=2:v=0:a=1,"
        f"atrim=duration={output_duration:.6f},asetpts=PTS-STARTPTS[aout]"
    )


def run_checked(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, check=True, text=True, capture_output=True)
```

- [ ] **Step 4: Implement deflicker and encoding helpers**

Use these exact command structures:

```python
def stabilize_frames(raw_directory: Path, stable_directory: Path, format_spec: FormatSpec) -> None:
    stable_directory.mkdir(parents=True, exist_ok=True)
    run_checked([
        "ffmpeg", "-y",
        "-framerate", "24000/1001",
        "-i", str(raw_directory / "%06d.png"),
        "-vf", "deflicker=size=5:mode=am",
        "-frames:v", str(format_spec.construction_frames),
        str(stable_directory / "%06d.png"),
    ])


def encode_video(frames_directory: Path, frame_count: int, output_path: Path, scale: str | None = None) -> None:
    filters = [scale] if scale else []
    args = [
        "ffmpeg", "-y",
        "-framerate", "24000/1001",
        "-i", str(frames_directory / "%06d.png"),
        "-frames:v", str(frame_count),
    ]
    if filters:
        args += ["-vf", ",".join(filters)]
    args += [
        "-c:v", "libx264", "-preset", "slow", "-crf", "16",
        "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-r", "24000/1001", str(output_path),
    ]
    run_checked(args)
```

Implement `build_audio()` with `-filter_complex` using the appropriate filter expression, map `[aout]`, encode a temporary WAV, run `volumedetect`, and apply only the constant negative gain needed to keep the true peak at or below -1 dB.

Implement `mux_output()` with:

```text
ffmpeg -y -i VIDEO -i AUDIO -c:v copy -c:a aac -b:a 320k -shortest OUTPUT
```

- [ ] **Step 5: Implement FFprobe verification**

```python
def probe_output(path: Path) -> dict:
    result = run_checked([
        "ffprobe", "-v", "error",
        "-count_frames",
        "-show_entries",
        "format=duration:stream=index,codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,channels",
        "-of", "json",
        str(path),
    ])
    return json.loads(result.stdout)
```

Add `verify_probe(payload: dict, format_spec: FormatSpec) -> None` that raises precise errors for incorrect codec, dimensions, pixel format, frame rate, frame count, duration, or missing stereo audio.

- [ ] **Step 6: Run focused tests**

```bash
python3 -m unittest tests.test_media -v
```

Expected: all three tests pass.

- [ ] **Step 7: Run a synthetic FFmpeg integration test**

Generate 48 numbered 320×180 PNGs and a two-second sine-wave WAV in a temporary directory, encode/mux them, and assert with `probe_output()` that H.264 video and stereo AAC audio are present at `24000/1001`.

- [ ] **Step 8: Commit media operations**

```bash
git add video-projects/freeman-pavilion-timelapse/freeman_video/media.py \
  video-projects/freeman-pavilion-timelapse/tests/test_media.py
git commit -m "feat: add Freeman video media pipeline"
```

---

### Task 5: Resumable orchestration CLI and proof builds

**Files:**
- Create: `video-projects/freeman-pavilion-timelapse/build.py`
- Create: `video-projects/freeman-pavilion-timelapse/freeman_video/pipeline.py`
- Create: `video-projects/freeman-pavilion-timelapse/tests/test_pipeline.py`
- Modify: `video-projects/freeman-pavilion-timelapse/README.md`

**Interfaces:**
- Consumes: all interfaces from Tasks 1–4.
- Produces: CLI commands `scan`, `proof`, `final`, and `verify`; `VideoPipeline.run(format_name: str, mode: str) -> Path`.

- [ ] **Step 1: Write orchestration-state tests**

```python
# tests/test_pipeline.py
import tempfile
import unittest
from pathlib import Path

from freeman_video.pipeline import BuildState


class PipelineTest(unittest.TestCase):
    def test_build_state_records_completed_stages(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.json"
            state = BuildState(path)
            state.complete("manifest", "abc123")
            reloaded = BuildState(path)
            self.assertTrue(reloaded.is_complete("manifest", "abc123"))
            self.assertFalse(reloaded.is_complete("manifest", "different"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test and verify it fails**

```bash
python3 -m unittest tests.test_pipeline -v
```

Expected: import failure because `freeman_video.pipeline` does not exist.

- [ ] **Step 3: Implement atomic resumable state**

```python
# core of freeman_video/pipeline.py
import json
from pathlib import Path


class BuildState:
    def __init__(self, path: Path):
        self.path = path
        self.payload = json.loads(path.read_text()) if path.exists() else {}

    def is_complete(self, stage: str, fingerprint: str) -> bool:
        return self.payload.get(stage) == fingerprint

    def complete(self, stage: str, fingerprint: str) -> None:
        self.payload[stage] = fingerprint
        temporary = self.path.with_suffix(".tmp")
        temporary.parent.mkdir(parents=True, exist_ok=True)
        temporary.write_text(json.dumps(self.payload, indent=2, sort_keys=True))
        temporary.replace(self.path)
```

- [ ] **Step 4: Implement `VideoPipeline` stage order**

`VideoPipeline.run()` executes these stages with source/config fingerprints:

```text
assets
manifest
source_inventory_before
camera_crop_validation
construction_backgrounds
construction_deflicker
construction_typography
teaser
title
finale
logo
frame_assembly
audio
encode
mux
probe
evidence_frames
source_inventory_after
```

Each stage writes only to:

```text
work/{format}/
manifests/{format}.json
proofs/
outputs/
verification/
```

Never use a source directory as an output path.

- [ ] **Step 5: Implement the CLI**

```python
# build.py
import argparse
from pathlib import Path

from freeman_video.pipeline import VideoPipeline


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("scan", "proof", "final", "verify"))
    parser.add_argument("--format", choices=("landscape", "reel", "both"), default="both")
    args = parser.parse_args()
    pipeline = VideoPipeline(Path(__file__).resolve().parent)
    formats = ("landscape", "reel") if args.format == "both" else (args.format,)
    for format_name in formats:
        pipeline.run(format_name, args.command)


if __name__ == "__main__":
    main()
```

- [ ] **Step 6: Run all unit and synthetic integration tests**

```bash
python3 -m unittest discover -s tests -v
```

Expected: every test passes.

- [ ] **Step 7: Run the real read-only scan**

```bash
python3 build.py scan --format both
```

Expected:

```text
landscape: 1569 selected construction frames
reel: 1217 selected construction frames
range: 2024-12-09T09:00:00 -> 2026-07-08T09:45:00
months: 20
```

- [ ] **Step 8: Render low-resolution proof files**

```bash
python3 build.py proof --format both
```

Expected outputs:

```text
proofs/freeman-from-ground-to-stage-landscape-proof.mp4  # 960×540
proofs/freeman-from-ground-to-stage-reel-proof.mp4       # 540×960
```

Proofs retain the authoritative frame counts and frame rate.

- [ ] **Step 9: Inspect proof evidence**

Extract and inspect:

```text
verification/landscape/opening.png
verification/landscape/title.png
verification/landscape/december-2024.png
verification/landscape/january-2025.png
verification/landscape/january-2026.png
verification/landscape/july-2026.png
verification/landscape/finale.png
verification/landscape/logo.png
verification/reel/opening.png
verification/reel/title.png
verification/reel/december-2024.png
verification/reel/july-2026.png
verification/reel/finale.png
verification/reel/logo.png
```

Confirm:

- No camera bands.
- No blue text.
- White type remains legible.
- Only the date rule and logo use `#04579E`.
- Dates increase monotonically.
- Month hits last 14 frames.
- Vertical crop stays anchored to the pavilion.
- Deflicker reduces high-frequency exposure pulsing without flattening seasons.
- Reverse teaser snaps cleanly to the true track beginning.
- Reel internal audio cut is not perceptibly discontinuous.

- [ ] **Step 10: Commit orchestrator and proof workflow**

```bash
git add video-projects/freeman-pavilion-timelapse/build.py \
  video-projects/freeman-pavilion-timelapse/freeman_video/pipeline.py \
  video-projects/freeman-pavilion-timelapse/tests/test_pipeline.py \
  video-projects/freeman-pavilion-timelapse/README.md
git commit -m "feat: orchestrate Freeman proof renders"
```

---

### Task 6: Final renders, deterministic verification, and handoff

**Files:**
- Modify only if proof review identifies a verified defect:
  - `video-projects/freeman-pavilion-timelapse/freeman_video/config.py`
  - `video-projects/freeman-pavilion-timelapse/freeman_video/frames.py`
  - `video-projects/freeman-pavilion-timelapse/freeman_video/media.py`
- Generate, do not commit:
  - `video-projects/freeman-pavilion-timelapse/outputs/freeman-from-ground-to-stage-landscape.mp4`
  - `video-projects/freeman-pavilion-timelapse/outputs/freeman-from-ground-to-stage-reel.mp4`
  - `video-projects/freeman-pavilion-timelapse/verification/report.json`

**Interfaces:**
- Consumes: approved proof behavior and the `VideoPipeline`.
- Produces: the two final MP4 deliverables and machine-readable verification evidence.

- [ ] **Step 1: Run the complete test suite immediately before final rendering**

```bash
python3 -m unittest discover -s tests -v
```

Expected: all tests pass.

- [ ] **Step 2: Render both final masters**

```bash
python3 build.py final --format both
```

Expected:

```text
outputs/freeman-from-ground-to-stage-landscape.mp4
outputs/freeman-from-ground-to-stage-reel.mp4
```

- [ ] **Step 3: Run deterministic media verification**

```bash
python3 build.py verify --format both
```

Expected verification facts:

```text
landscape: 1920x1080 | 24000/1001 | 1870 frames | h264 | yuv420p | aac stereo
reel: 1080x1920 | 24000/1001 | 1438 frames | h264 | yuv420p | aac stereo
```

- [ ] **Step 4: Verify source media is unchanged**

Compare the source-inventory digest written during `scan` with the digest after final rendering:

```bash
shasum -a 256 manifests/source-inventory-before.json manifests/source-inventory-after.json
```

Expected: both digests are identical.

- [ ] **Step 5: Inspect the final evidence frames**

Open every PNG listed in Task 5 Step 9. Confirm the final-resolution versions satisfy the same visual checks as the proofs.

- [ ] **Step 6: Inspect final audio boundaries**

Use FFmpeg to extract the first six and final eight seconds of each output:

```bash
ffmpeg -y -i outputs/freeman-from-ground-to-stage-landscape.mp4 -t 6 verification/landscape-opening-review.wav
ffmpeg -y -sseof -8 -i outputs/freeman-from-ground-to-stage-landscape.mp4 verification/landscape-ending-review.wav
ffmpeg -y -i outputs/freeman-from-ground-to-stage-reel.mp4 -t 6 verification/reel-opening-review.wav
ffmpeg -y -sseof -8 -i outputs/freeman-from-ground-to-stage-reel.mp4 verification/reel-ending-review.wav
```

Confirm the reverse pre-roll, forward-track snap, Reel splice, and final cadence are clean.

- [ ] **Step 7: Record the final report**

`verification/report.json` must include:

```json
{
  "source_unchanged": true,
  "landscape": {
    "width": 1920,
    "height": 1080,
    "frame_rate": "24000/1001",
    "frames": 1870,
    "video_codec": "h264",
    "pixel_format": "yuv420p",
    "audio_codec": "aac",
    "channels": 2
  },
  "reel": {
    "width": 1080,
    "height": 1920,
    "frame_rate": "24000/1001",
    "frames": 1438,
    "video_codec": "h264",
    "pixel_format": "yuv420p",
    "audio_codec": "aac",
    "channels": 2
  }
}
```

- [ ] **Step 8: Run repository scope checks**

```bash
git status --short
git diff --check
```

Expected: no generated media staged or tracked; unrelated pre-existing changes remain untouched.

- [ ] **Step 9: Commit only verified implementation and documentation changes**

```bash
git add video-projects/freeman-pavilion-timelapse
git commit -m "feat: deliver Freeman pavilion timelapse videos"
```

Before committing, use `git diff --cached --stat` and `git diff --cached --check` to confirm generated media is excluded and the commit scope is focused.
