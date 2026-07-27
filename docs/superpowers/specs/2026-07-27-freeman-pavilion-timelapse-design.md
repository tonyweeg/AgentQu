# Freeman Arts Pavilion Timelapse Video Design

**Date:** 2026-07-27
**Status:** Approved for implementation
**Edit direction:** Cinematic Build Pulse

## Objective

Create two fast, music-driven videos that show the Freeman Arts Pavilion construction progressing chronologically from December 2024 through July 2026:

1. A 16:9 landscape film approximately 78 seconds long.
2. A 9:16 social Reel no longer than 60 seconds.

Both edits use the same narrative structure, typography, brand treatment, and proportional image-selection rules. The Reel is an independent recut rather than a crop or truncation of the landscape film.

## Scope

This project produces the two approved videos and the scripts, manifests, and verification evidence needed to reproduce them.

The future general-purpose directory-to-video application is explicitly out of scope. Lessons from this production may inform that separate project later.

## Verified inputs

### Construction timelapse

| Folder | JPEG count | Verified boundary |
|---|---:|---|
| `Freeman_Group_1` | 3,958 | 2024-12-09 09:00 through 2025-04-08 08:00 |
| `Freeman_Group_2` | 9,988 | 2025-04-08 08:15 through 2026-01-10 07:00 |
| `Freeman_Group_3` | 3,117 | 2026-01-10 07:15 through 2026-03-27 07:15 |
| `Freeman_Group_4` | 4,232 | 2026-03-27 07:45 through 2026-07-08 09:45 |
| **Total** | **21,295** | **2024-12-09 through 2026-07-08** |

The source JPEGs are 2048×1440 RECONYX HF2 SECURITY frames. They contain usable EXIF capture timestamps and embedded camera bands at the top and bottom.

### Finished-venue photography

The Megan Powell folder contains 37 polished Freeman Arts Pavilion photographs:

- 24 standard finished-venue photographs.
- 13 finished-venue drone photographs.

These photographs are reserved for the reversed opening teaser and finished-venue finale. They do not interrupt the chronological construction sequence.

### Music

`ENV1_PUCD_SHORT_01.wav` is:

- PCM 16-bit little-endian.
- 44.1 kHz.
- Stereo.
- 74.425011 seconds.

### Gillis Gilkerson brand

- Official site: `https://ggibuilds.com/`
- Supplied logo: `https://ggibuilds.com/wp-content/uploads/2023/05/updated-logo-no-space-on-sides.png`
- Sampled brand blue: RGB `4, 87, 158`, hex `#04579E`

The downloaded logo file is the authoritative final-splash asset. Transparent padding may be cropped, but the mark itself must not be redrawn, recolored, stretched, or otherwise altered.

## Deliverables

### Landscape

- Container: MP4
- Video: H.264, High profile, `yuv420p`
- Audio: AAC stereo
- Resolution: 1920×1080
- Frame rate: `24000/1001` fps
- Total frames: 1,870
- Nominal duration: 77.995 seconds

### Reel

- Container: MP4
- Video: H.264, High profile, `yuv420p`
- Audio: AAC stereo
- Resolution: 1080×1920
- Frame rate: `24000/1001` fps
- Total frames: 1,438
- Nominal duration: 59.977 seconds

Final delivery filenames:

- `freeman-from-ground-to-stage-landscape.mp4`
- `freeman-from-ground-to-stage-reel.mp4`

## Narrative structure

### Landscape frame allocation

| Segment | Frames | Approximate duration |
|---|---:|---:|
| Reversed finished-image teaser | 86 | 3.587 s |
| Black title card | 36 | 1.502 s |
| Chronological construction | 1,569 | 65.440 s |
| Finished-venue finale, including logo | 179 | 7.466 s |
| **Total** | **1,870** | **77.995 s** |

The final 42 landscape frames, approximately 1.752 seconds, display the Gillis Gilkerson logo splash.

### Reel frame allocation

| Segment | Frames | Approximate duration |
|---|---:|---:|
| Reversed finished-image teaser | 60 | 2.503 s |
| Black title card | 30 | 1.251 s |
| Chronological construction | 1,217 | 50.755 s |
| Finished-venue finale, including logo | 131 | 5.463 s |
| **Total** | **1,438** | **59.977 s** |

The final 36 Reel frames, approximately 1.502 seconds, display the Gillis Gilkerson logo splash.

## Opening teaser

The teaser rapidly flashes selected finished-venue and drone photographs in reverse visual order. It is an intentional premonition of the completed venue, not a conventional slideshow.

- Landscape uses eight finished photographs over 86 frames.
- Reel uses seven finished photographs over 60 frames.
- Cuts accelerate toward the title card.
- Images use restrained push-ins or reframes; there are no soft dissolves.
- The teaser audio is the final portion of the source track played in reverse.
- The teaser snaps directly to black and the source track's true beginning.

The landscape reversed-audio pre-roll is trimmed so the complete forward 74.425-second track fits the 1,870-frame master. The Reel uses a 2.503-second reversed pre-roll.

## Title card

The title card appears between the reversed teaser and the first construction image.

- Background: pure black.
- Primary copy: `FROM GROUND TO STAGE`
- Identifier: `Freeman Arts Pavilion`
- Primary font: Barlow Condensed, heavy weight.
- Identifier font: Space Grotesk, medium or semibold weight.
- Text color: pure white.
- No logo, blue text, gradients, or additional promotional copy.
- The typography adapts compositionally between 16:9 and 9:16 while preserving the approved hierarchy.

The card uses a sharp staged reveal rather than a dissolve:

1. `FROM GROUND`
2. `TO STAGE`
3. Brief full-card hold before the first construction frame

## Construction sampling

### Equal retention

The construction sequence uses the same retention percentage across all four groups, subject only to integer rounding.

Landscape retains 1,569 of 21,295 construction images, a global rate of approximately 7.3679 percent:

| Group | Selected frames |
|---|---:|
| Group 1 | 291 |
| Group 2 | 736 |
| Group 3 | 230 |
| Group 4 | 312 |

Reel retains 1,217 of 21,295 construction images, a global rate of approximately 5.7150 percent:

| Group | Selected frames |
|---|---:|
| Group 1 | 226 |
| Group 2 | 571 |
| Group 3 | 178 |
| Group 4 | 242 |

Selection within each group is uniformly distributed from the first through last frame. The implementation uses deterministic index spacing and preserves chronological order.

### Month boundaries

The first selected frame in each calendar month from December 2024 through July 2026 is guaranteed to appear. If uniform sampling misses a month boundary, the nearest selected frame is replaced by the boundary frame. This replacement preserves the allocated count for that group and format.

### Capture dates

The live date counter uses each selected JPEG's EXIF capture timestamp. The renderer must not infer dates from filesystem modification times or OCR the embedded camera timestamp.

Missing or malformed EXIF capture dates are fatal manifest errors and are reported with exact filenames.

## Image treatment

### Camera-band removal

The embedded top and bottom HF2 SECURITY bands are removed before aspect-ratio framing. The crop is detected and validated from representative frames, then held constant across all construction images to prevent visible vertical jitter.

### Flicker control

The accelerated daytime cycle is stabilized with FFmpeg `deflicker=size=5:mode=am` before typography is applied. This reduces high-frequency exposure pulsing while preserving real weather and seasonal changes.

The construction sequence does not use optical-flow interpolation, artificial motion synthesis, or multi-frame ghost blending. Every displayed construction frame remains traceable to one selected source JPEG.

### Landscape

Construction frames receive a stable 16:9 crop and are scaled to 1920×1080. The pavilion remains anchored consistently through all four source groups.

### Reel

Construction frames use the approved full-bleed 9:16 treatment. The crop remains centered on the pavilion, with per-group anchor adjustments allowed only when necessary to maintain the same subject position. Crop coordinates must not vary frame by frame.

### Finished photography

Finished photographs retain their color. They use hard musical cuts, restrained push-ins, and intentional reframing. They do not use blurred-fill backgrounds, soft slideshow dissolves, or arbitrary color filters.

## Date and month typography

### Persistent date counter

- Position: bottom right.
- Format: `MM/DD/YYYY`.
- Font: Space Grotesk semibold.
- Text: pure white.
- Background: compact semi-opaque black field.
- Accent: a thin Gillis Gilkerson blue rule using `#04579E`.

### Month change

Each new month receives an oversized month/year hit without pausing the timelapse.

- Font: Barlow Condensed heavy.
- Text: pure white.
- Duration: 14 frames, approximately 0.584 seconds.
- Entry and exit: short opacity ramps.
- The first construction month, December 2024, receives the same treatment.

No month, year, title, or date text is blue.

## Ending

The construction sequence resolves into a short polished finished-venue montage. The last musical cadence cuts to a Gillis Gilkerson logo splash:

- Background: pure black.
- Logo: centered and proportionally scaled.
- Landscape logo duration: 42 frames.
- Reel logo duration: 36 frames.
- No added copy, URL, slogan, glow, or competing animation.

The supplied logo's blue is the only blue field on the final splash.

## Audio

### Landscape

1. Play the source track's final approximately 3.57 seconds in reverse beneath the opening teaser.
2. Snap to the source track at 0:00 beneath the title card.
3. Play the complete 74.425-second track forward.
4. Trim only sub-frame excess required to match the 1,870-frame video master.

### Reel

1. Play the source track's final 2.503 seconds in reverse beneath the opening teaser.
2. Snap to the source track at 0:00 beneath the title card.
3. Preserve the source track's opening and final 5.5 seconds.
4. Remove one internal section to fit the 1,438-frame master.
5. Place the internal splice on compatible musical transients and use an equal-power crossfade no longer than 80 milliseconds.
6. Do not time-stretch, pitch-shift, or change tempo.

Audio is peak-safe and encoded to AAC without clipping. Loudness normalization may reduce gain uniformly but must not alter musical dynamics.

## Implementation boundaries

The one-off production lives under:

`video-projects/freeman-pavilion-timelapse/`

It contains:

- A deterministic source scanner and manifest builder.
- A Python/Pillow frame compositor.
- FFmpeg assembly commands or an orchestration script.
- Pinned Barlow Condensed and Space Grotesk font files.
- A local copy of the supplied Gillis Gilkerson logo.
- Machine-readable manifests.
- Low-resolution proof outputs.
- Final delivery files and verification reports.

Generated frames, intermediates, and final media are not committed to Git. The design specification and implementation scripts may be committed.

All source directories under `/Users/tonyweeg/Downloads/GGI Freeman Backup` are read-only inputs. The implementation must never rename, rewrite, move, or delete source media.

## Failure handling

The build stops and reports exact files when it encounters:

- Missing input directories.
- Unexpected image counts.
- Unreadable or corrupt JPEGs.
- Missing or malformed EXIF capture timestamps.
- Non-monotonic capture dates.
- Missing music, fonts, or logo.
- FFmpeg or compositor failures.
- Incorrect output frame counts, duration, dimensions, frame rate, or audio streams.

There is no silent image skipping.

## Verification

### Manifest checks

- Source counts match 3,958 / 9,988 / 3,117 / 4,232.
- Capture dates are monotonic across and between groups.
- Selection counts match the allocations in this specification.
- Every month from December 2024 through July 2026 is represented.
- The same proportional-selection rule is used for both formats.

### Proof renders

Create low-resolution proof cuts before final encoding:

- Landscape proof: 960×540.
- Reel proof: 540×960.

Inspect:

- Reversed opener and audio snap.
- Title reveal.
- First construction frame.
- All four group boundaries.
- Every month hit.
- Date-counter formatting and monotonicity.
- Exposure stability and absence of high-frequency luminance strobing.
- Finished-photo transition.
- Final logo size, duration, and clean musical ending.

### Final media checks

Use `ffprobe` to verify:

- Landscape: 1920×1080, `24000/1001`, 1,870 frames, H.264, AAC.
- Reel: 1080×1920, `24000/1001`, 1,438 frames, H.264, AAC.
- Both outputs use `yuv420p`.
- Both contain stereo audio.
- Durations do not exceed their specified frame budgets.

Extract representative final frames for visual evidence:

- Opening teaser.
- Title card.
- First month.
- One middle month.
- Final construction month.
- Finished-venue montage.
- Gillis Gilkerson splash.

## Acceptance criteria

The project is accepted when:

1. Both proof cuts pass visual review.
2. Both final files pass automated media verification.
3. Construction progresses chronologically with equal per-group retention percentages.
4. Date counters derive from EXIF and remain monotonic.
5. Every month receives a white month/year hit.
6. No embedded security-camera bands remain.
7. Barlow Condensed and Space Grotesk render correctly.
8. No text is blue.
9. Gillis Gilkerson blue is `#04579E` wherever a blue accent is used.
10. Both videos end on the supplied Gillis Gilkerson logo against black.
11. Source media remains unchanged.
