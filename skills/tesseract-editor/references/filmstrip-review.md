# Mid-edit review with Tesseract filmstrips

Tesseract can render sampled project frames into a labeled PNG grid without encoding a full MP4. Use this during editing to catch problems before building more work on top of them.

## The review loop

After the rough assembly and after a meaningful visual change (a new graphic, text layout, crop, timing, or transition):

1. Save the current `.tsrct` revision through `project commit` or `project apply`. The strip must come from that revision, not a stale document or the source footage.
2. Render a filmstrip covering the changed beat and its neighboring cuts. For a rough edit, first make a sparse overview covering the sequence.
3. **Open the PNG with the host's image-view tool and inspect the actual pixels.** A successful command or an image path alone does not count as review. In Codex, use the available local image viewer, such as `view_image`.
4. Identify the timestamp and observable problem: text collision, premature exit, blank frame, wrong crop, inconsistent scale, missing asset, or distracting repetition. Correct the native project, save, and render a fresh strip of the affected range. Compare before/after with the same sample times.
5. Keep a short note identifying the inspected project revision, strip path, times, issues fixed, and any remaining concern. This can live in the edit notes; no separate formal report is required.

Do not run a new strip after every scalar tweak. Review coherent changes while they are still cheap to correct. Finish by playing a short preview or the final edit with audio; a filmstrip cannot establish sound quality, smooth motion, or lip sync.

## Choose useful samples

- **Assembly overview:** roughly every 1–2 seconds, plus important scene boundaries. Split long edits into readable strips rather than making one giant sheet.
- **A changed beat:** entrance, mid-motion, readable hold, and exit, with context from the preceding/following shot. About 100–250 ms spacing is useful for a short reveal; use explicit times when the important states are known.
- **A suspect cut:** sample the frame just before and just after the cut, as well as the cut time. At 30 fps, a frame is about 33.3 ms; for a cut at 2.0 s, 1967, 2000, and 2033 ms are useful requests. Inspect the resolved labels and source cadence; a rounded millisecond request is not a promise of exact source-frame indexing.
- **Talking-head cuts:** compare outgoing/incoming frames and a few surrounding samples at the same tile size for eye height, horizontal position, and headroom. Inspect the final crop, including punch-ins; apply [eyeline continuity](editorial-decisions.md#talking-head-eyeline-continuity), then re-render and play the join to check for an unnatural face jump.
- **Small text or matte detail:** request a larger tile, a native crop, or a full-resolution `preview`. Thumbnail text is not enough evidence of final-size legibility.

Uniform sampling can miss a one-frame flash. It also cannot prove a complete absence of overlap between samples. Use denser targeted samples or playback when the behavior is uncertain.

## Tesseract CLI

A readable landscape overview:

```sh
tsrct filmstrip --project /absolute/path/edit/project.tsrct --start-ms 0 --duration-ms 8000 --interval-ms 1000 --output /absolute/path/edit/Previews/Filmstrip-v2.png
```

A closer review around a cut:

```sh
tsrct filmstrip --project /absolute/path/edit/project.tsrct --timestamps-ms 1700,1900,1967,2000,2033,2100,2300,2600 --output /absolute/path/edit/.tesseract-work/checks/cut-v2.png
```

Keep ranges inside the actual document duration. Range sampling is half-open;
explicit timestamps preserve input order. Do not sample exactly at the edit end
and mistake an inactive end state for a bad final frame. About 8–16 samples are
usually easier to inspect than a giant sheet.

Cells default to 240×135 with five columns and ordinal/time labels. Use
`--tile-width 135 --tile-height 240` for portrait; match the project aspect for
square/4:5 work. Increase tile size or use `tsrct preview --time <seconds>`
when details become too small. Choose fresh output filenames for comparisons.
Stdout JSON reports `outputPath`, `frameCount`, dimensions, `resolvedSampling`,
and `resolvedFraming`. Use resolved times and labels for cut-level diagnosis.

## Fonts must match the final render

Package the intended local file with `project import-font --file` before authoring
text. Preview, filmstrip, and export use that document's packaged fonts; there
is no separate runtime-font mapping flag. Inspect the glyphs, line breaks,
and overflow. If import or font resolution fails, report the exact error and
follow [local operation](local-operation.md); do not silently substitute a font.

## Targeted inspection

Use an actual composition/group ID from inspection:

```sh
tsrct filmstrip --project /absolute/path/edit/project.tsrct --fx-solo main:3 --max-frames 8 --content-bounds --tile-width 320 --tile-height 180 --items-per-row 4 --output /absolute/path/edit/.tesseract-work/checks/graphic-v2.png
```

This samples the selected layer/group's full active window. Omit
`--content-bounds` to preserve its canvas placement. Use one sampling mode at a
time. A solo strip is for diagnosis: also inspect the graphic in the complete
composition before calling it finished. This CLI does not expose arbitrary crop
or target-offset flags.
