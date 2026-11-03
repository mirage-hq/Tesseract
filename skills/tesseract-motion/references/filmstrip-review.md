# Mid-edit review with Tesseract filmstrips

Tesseract can render sampled project frames into a labeled PNG grid without encoding a full MP4. Use this during editing to catch problems before building more work on top of them.

## The review loop

After the rough assembly and after a meaningful visual change (a new graphic, text layout, crop, timing, or transition):

1. Save the current revision of the document. The strip must come from that revision, not a stale document or the source footage.
2. In one chained shell command, render a filmstrip covering the changed beat and its neighboring cuts, plus any [detail views](#choose-the-view-size) the change needs. For a rough edit, first make a sparse overview covering the sequence.
3. **Open the PNGs with the host's image-view tool and inspect the actual pixels.** Open all of a check's images together, in one message. A successful command or an image path alone does not count as review. In Codex, use the available local image viewer, such as `view_image`.
4. Identify the timestamp and observable problem: text collision, premature exit, blank frame, wrong crop, inconsistent scale, missing asset, or distracting repetition. Correct the native project, save, and render a fresh strip of the affected range. Compare before/after side by side with the same sample times.
5. Keep a short note identifying the inspected project revision, strip path, times, issues fixed, and any remaining concern. This can live in the edit notes; no separate formal report is required.

Do not run a new strip after every scalar tweak. Review coherent changes while they are still cheap to correct. Finish by playing a short preview or the final edit with audio; a filmstrip cannot establish sound quality, smooth motion, or lip sync.

## Choose useful samples

- **Assembly overview:** roughly every 1–2 seconds, plus important scene boundaries. Split long edits into readable strips rather than making one giant sheet.
- **A changed beat:** entrance, mid-motion, readable hold, and exit, with context from the preceding/following shot. About 100–250 ms spacing is useful for a short reveal; use explicit times when the important states are known.
- **A suspect cut:** sample the frame just before and just after the cut, as well as the cut time. At 30 fps, a frame is about 33.3 ms; for a cut at 2.0 s, 1967, 2000, and 2033 ms are useful requests. Inspect the resolved labels and source cadence; a rounded millisecond request is not a promise of exact source-frame indexing.
- **Talking-head cuts:** compare outgoing/incoming frames and a few surrounding samples at the same tile size for eye height, horizontal position, and headroom. Inspect the final crop, including punch-ins; apply [eyeline continuity](editorial-decisions.md#talking-head-eyeline-continuity), then re-render and play the join to check for an unnatural face jump.
- **Color grading:** compare the reference with related shots, including nonadjacent ones, as described in the [grading workflow](color-grading.md#workflow). Preserve intentional lighting differences; use full-resolution previews for shadow detail/noise and playback for jumps across cuts.

Uniform sampling can miss a one-frame flash. It also cannot prove a complete absence of overlap between samples. Use denser targeted samples or playback when the behavior is uncertain.

## Choose the view size

- **Timing, motion, cuts, and composition:** default-size cells at the project aspect: 240×135, or 135×240 for portrait. Do not enlarge every tile to see detail.
- **Text, edges, materials, lighting, noise, or grade detail:** a full-size `preview` frame where it matters. Thumbnail text is not enough evidence of final-size legibility. When a reduced view shows enough, one large cell will do, such as a filmstrip of one timestamp in a 960×540 tile, one per row (540×960 for portrait).
- **Small text or matte detail in a known region** (a title, lower third, matte edge, or an artifact already seen): crop that region at 100% from a full-size `preview` with any available local image tool, and inspect the crop instead of the whole frame. Keep each crop, or sheet of one region's crops at several times stacked or side by side, within about 1500 px on its long side and 1 megapixel, or the host's image limit if lower, so the viewer shows it unscaled. For moving text, crop each time where the text actually is.

Crops do not replace full frames for a first look at a new shot, scene, or look, for hunting defects whose location is unknown, or for the final check. Where the cells show enough, prefer one filmstrip of explicit timestamps to a chain of previews; each `preview` reloads the document.

## Sampling a strip

A readable landscape overview samples 0–8 s every 1 s, four per row.

```sh
tsrct filmstrip --project /absolute/path/edit/project.tsrct --start-ms 0 --duration-ms 8000 --interval-ms 1000 --items-per-row 4 --output /absolute/path/edit/Previews/Filmstrip.png
```

A closer review around a cut samples 1700, 1900, 1967, 2000, 2033, 2100, 2300,
and 2600 ms, four per row.

```sh
tsrct filmstrip --project /absolute/path/edit/project.tsrct --timestamps-ms 1700,1900,1967,2000,2033,2100,2300,2600 --items-per-row 4 --output /absolute/path/edit/.tesseract-work/checks/cut.png
```

Keep ranges inside the actual document duration. Range sampling is half-open;
explicit timestamps preserve input order. Do not sample exactly at the edit end
and mistake an inactive end state for a bad final frame. About 8–16 samples are
usually easier to inspect than a giant sheet. Set the number per row so the rows
are full, as with 4 for the 8 samples above.

Strips at the default cell size stay small; full-size `preview` frames are much
larger, so save them only where pixel detail matters. Overwrite routine strips on
the next pass. For a before/after comparison, write the new strip to a second
name and keep both until the comparison is noted (see
[storage](local-operation.md#storage)).

Cells default to 240×135 with five columns and ordinal/time labels. Use
135×240 tiles for portrait; match the project aspect for
square/4:5 work; for detail, see [choose the view size](#choose-the-view-size).
Set them with `--tile-width` and `--tile-height`. The command's JSON output
reports `outputPath`, `frameCount`, and dimensions. `resolvedSampling` and
`resolvedFraming` are populated only when the CLI resolves a target-range or
content-bounds request; they are `null` for ordinary range or explicit-time
sampling and default framing. For `--timestamps-ms`, use the requested times
and strip order; the visible time labels are rounded to tenths of a second, so
nearby requested times can share a label.
Use resolved times when the JSON provides them. For explicit timestamps,
compare the requested times and visible labels for cut-level diagnosis.

## Fonts must match the final render

Import the intended local font file before authoring
text. Preview, filmstrip, and export use that document's imported fonts; there
is no separate runtime-font mapping. Inspect the glyphs, line breaks,
and overflow. If import or font resolution fails, report the exact error and
follow [local operation](local-operation.md); do not silently substitute a font.

## Targeted inspection

A solo strip renders one layer or group by itself. Use an actual
composition/group ID from inspection, such as `main:3`; this example takes up
to 8 frames cropped to the content bounds, in 320×180 tiles four per row.

```sh
tsrct filmstrip --project /absolute/path/edit/project.tsrct --fx-solo main:3 --max-frames 8 --content-bounds --tile-width 320 --tile-height 180 --items-per-row 4 --output /absolute/path/edit/.tesseract-work/checks/graphic.png
```

This samples the selected layer/group's full active window. Skip the
content-bounds crop to preserve its canvas placement. With motion blur enabled,
sample at the export frame rate so each sample uses that frame's shutter.
Solo cannot be combined with `--timestamps-ms`, `preview` has no solo option,
and only one sampling mode applies at a time. Pass the frame rate as
`--frame-rate`. The CLI has no crop or target-offset flags.
A solo strip is for diagnosis: also inspect the graphic in the complete
composition before calling it finished. For a closer view, crop a full-size
`preview`.
