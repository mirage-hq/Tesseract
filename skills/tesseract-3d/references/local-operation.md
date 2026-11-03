# Running Tesseract locally

Resolve this skill from the directory containing its `SKILL.md`. In commands,
`SKILL` means that absolute directory, whether installed alone or in a
plugin, and `WORK` means the project's absolute `.tesseract-work` folder (see
[project lifecycle](#project-lifecycle)). Quote paths containing spaces.

Tesseract uses `tsrct` to edit and render portable `.tsrct` projects. Follow
[CLI installation](installation.md) to locate the executable,
check its version, or install the matching CLI release. Use the resolved
executable path in the commands below; it does not have to be on PATH.

See [telemetry and attribution](telemetry.md) for optional CLI attribution and user opt-out.

## Scope

For creating or restructuring layers, read [FX authoring](fx-authoring.md).
For adding or revising animation, read [Motion](motion.md).

Use editable FX compositions, text, shapes, media layers, effects, keyframes,
and procedural scripts. Use existing local media. This CLI has no asset
generation, transcription, dubbing, or cloud job tools.

## Project lifecycle

Choose the intended project before writing. Reuse an existing project only when
the conversation, supplied paths, or project notes establish continuation; a
matching name alone is insufficient. Inspect that destination before modifying it.
Ask only when intent to modify existing work remains ambiguous.

For new work, claim a fresh project root with an atomic operation that fails if
the path already exists, such as `mkdir "$project_root"` without `-p`. Check that
it succeeded before writing any project files or creating subfolders. If the path
exists, leave it untouched and choose another name; do not merge new work into it.
`mkdir -p` is appropriate for subfolders only after the project root has been
claimed or established as the intended existing project. A successful `mkdir -p`
or an earlier existence check is not proof that this task created the directory.

Use one persistent project root for authoring, review, revisions, and handoff.
Keep retained working files in subfolders within that root, not in a separate
workspace left behind at delivery. Hand back the same root. A separate client
package is an additional export when requested; relocating the project means
moving the retained workspace together and checking its references.

For example (names are flexible; create only useful folders):

```text
Project/
  Project.tsrct     current editable document with packaged media and fonts
  Project.mp4        matching current video
  Previews/          useful filmstrips, poster frames, or comparisons
  Versions/          meaningful earlier drafts, when needed
  .tesseract-work/      retained notes, scripts, JSON, and diagnostics
```

Keep a readable filmstrip of the delivered revision visible, even if it began as
an internal check. Retain other artifacts according to their value for reviewing,
reusing, or continuing the work. Schema dumps and temporary debugging renders
belong in the working subfolder (or a version-matched schema cache). The `.tsrct`
document is self-contained; loose copies of embedded assets are not sidecars.
Preserve original user media and retain external sources when independently useful.

Save meaningful checkpoints before substantial revisions and keep enough notes
to resume: intent, decisions, current revision, actual checks, and unresolved issues.
Associate exports and previews with their source revision; avoid saving every
small tweak. Tidy disposable intermediates without deleting useful history.
These are workspace conventions, not file-format requirements or mandatory files.

### Storage

A `.tsrct` carries every packaged image, font, clip, and model, so each full copy
of the document stores all of them again. Review stills, exports, and JSON dumps
accumulate the same way. Keep useful history without repeating it:

- Checkpoint a revision as checked-out JSON, for example
  `tsrct project checkout --project project.tsrct --output Versions/02-layout.json`.
  To return to it, commit that file to the current document; the packaged media it
  references must still be in the document. Keep a full `.tsrct` copy only for a
  milestone the user approved or a state the JSON cannot restore.
- `checkout` and `inspect --pretty` write indented copies of the whole document,
  which can be large for a detailed scene. Reuse their names in `.tesseract-work/`
  instead of keeping one per revision, and keep checkpoints only for meaningful
  revisions.
- Write routine checks to stable names in `.tesseract-work/checks/` and overwrite
  them on the next pass. Name a still for its revision only when it records a
  decision or a before/after comparison you will show. Once a round's findings are
  in the notes, delete that round's checks.
- Keep the current export and the exports the user reviewed. Delete superseded
  iteration exports; their checkpoints can render them again.
- Delete frame dumps, lossless or decoded intermediates, and analysis caches once
  their results are recorded.
- In long sessions, check the size of `.tesseract-work/` and `Versions/` with
  `du -sh` and retire superseded material before it reaches a few gigabytes.

Never delete the user's original media, the current document and export, or a
milestone the user approved.

## Before editing

Run `tsrct --version` and `tsrct project --help` once per session.
If `import-asset` is missing, follow [installation](installation.md).
The examples below run from the chosen project root; adapt filenames to the task.
Create an empty document for new work, or inspect the intended existing document:

```sh
tsrct project create --project project.tsrct
```

Creation makes one empty composition (`main`) on a 1080×1920 canvas, lasting
three seconds. Inspect its ID before adding content. Change canvas, duration,
or composition name by checking out and committing the editable document JSON.
The document `duration` is in seconds; layer ranges and action times are milliseconds.

Preview, filmstrip and export are SDR by default, even for footage that reports
`hdrTransfer` `hlg` or `pq`. Read [HDR](hdr.md) before using `--hdr` on any of
them (16-bit PQ PNGs cannot be judged by eye), when such footage should stay HDR
in the delivery, when revising a project delivered in HDR, when setting
`hdrGraphicsWhiteNits` or RGB above 1, or when importing EXR, HEIC/HEIF, AVIF,
16-bit PNG or gain-map JPEG images.

Native preview renders at the document's authored dimensions, including custom
canvas sizes. Dimensions must be positive, at most 7680 pixels per side and
33,177,600 pixels total, subject to device limits. Set `backgroundColor` for the
canvas background or use a bottom FX shape layer.

Import supplied footage with `project import-video` before adding its video
layer through JSON checkout/commit. Read [local footage](fx-authoring.md#local-footage).
For images, music, sound effects, and processed audio, follow [media import](media-import.md).
Before adding text, choose and obtain the intended font files, then package them
with `project import-font --file`; see [text](fx-authoring.md#text-with-an-available-font).
Handle setup and editing yourself; the user should only describe the result.
For spoken captions, read [bottom captions](fx-authoring.md#bottom-captions).

Inspect before constructing edits:

```sh
mkdir -p .tesseract-work
tsrct project inspect --project project.tsrct --pretty > .tesseract-work/project.json
tsrct project schema > .tesseract-work/project-action.schema.json
tsrct project schema --document > .tesseract-work/document.schema.json
```

The document contains one composition. Use groups for related parts; do not
create extra compositions or base-video, caption, or audio tracks.

Use IDs from `.tesseract-work/project.json`. Search the saved schemas for the
relevant definition; never read them whole (the action schema is over 1 MB).
Do not invent fields.

## Edit loop

For shape, text, grouping, and animation edits, write a JSON array of supported
composition-local actions in `.tesseract-work/edits.json`, applied as one atomic batch.
The action schema excludes operations this standalone document rejects:
project metadata, canvas changes, composition lifecycle, and asset-introducing actions.
For those document edits and media layers, use the editable JSON schema:

```sh
tsrct project checkout --project project.tsrct --output .tesseract-work/editable.json
# Edit dimensions, duration, composition, or layers using .tesseract-work/document.schema.json.
tsrct project commit --project project.tsrct --file .tesseract-work/editable.json
```

Preserve existing animation graphs and unknown fields when editing JSON. Commit
validates the document and packaged asset references before atomically saving.
Re-checkout after action batches so a stale JSON file cannot undo those changes.
Use the working examples in the references, adapting IDs, timing, and geometry
to the inspected project.

Apply, then render a strip across the changed beat's active range (here 0–3 s).
When text or layout changed, also render a full preview at a time the changed
element is visible:

```sh
mkdir -p Previews .tesseract-work/checks
tsrct project apply --project project.tsrct --actions .tesseract-work/edits.json
tsrct filmstrip --project project.tsrct --start-ms 0 --duration-ms 3000 \
  --interval-ms 250 --items-per-row 4 --tile-width 135 --tile-height 240 \
  --output Previews/Filmstrip.png
# Only if text or layout changed:
tsrct preview --project project.tsrct --time 1 --output .tesseract-work/checks/layout.png
```

`project apply` and `project commit` print a JSON result whose `warnings` array
lists authoring mistakes that render without an error but not as intended, such
as a hidden track-matte layer. `project inspect`, `project checkout`, `preview`,
`filmstrip`, and `export` print the same warnings to stderr as `warning:` lines.
Each names the layers and the fix; correct them before reviewing frames.

Open and inspect the generated images together. Correct visible problems, save,
and render the affected range again.

## Finish

Before the first export, run `tsrct export --help`; if `--format` is missing,
follow [installation](installation.md).

```sh
tsrct export \
  --project project.tsrct \
  --output finished.mp4
```

For transparent motion graphics on macOS, export ProRes 4444:

```sh
tsrct export --project project.tsrct --format prores --output finished.mov
tsrct export --project project.tsrct --format prores --fx-solo main:3 --output overlay.mov
```

Full-project export includes the mix and the document background. For alpha,
use solo export of the overlay layer or a group containing the graphic. Solo uses the selected
layer/group's active window, preserves canvas placement, and omits audio. Inspect
its alpha channel and composite over contrasting backgrounds before delivery.

Export defaults to 1080p, 30 fps, and H.264 MP4. Select `--resolution 720p|1080p|4k`,
any positive integer with `--fps`, and `--format mp4|prores`. Resolution preserves the
project aspect ratio: landscape 4K is 3840×2160, portrait 4K is 2160×3840, and square
4K is 2160×2160. Keep the authoring canvas unchanged. MP4 bitrate scales automatically
with output size and frame rate (10 Mbps at 1080p30, up to 60 Mbps); ProRes uses
its codec's quality settings. Fractional/source-matched FPS is not exposed.
Inspect the encoded dimensions, frame rate, audio, and visuals before delivery.

```sh
tsrct export --project project.tsrct --resolution 4k --fps 60 --output finished.mp4
```

Export is SDR unless you add `--hdr [auto|pq|hlg]`. Read [HDR](hdr.md) before an
HDR export, when revising a project delivered in HDR, or when setting
`hdrGraphicsWhiteNits`.

To export only a timeline segment, use milliseconds (for example, 2–5 seconds):

```sh
tsrct export --project project.tsrct --start-ms 2000 --duration-ms 3000 --output segment.mp4
```

Either flag may be omitted: start defaults to zero, and duration defaults to the
remaining timeline. With `--fx-solo`, start is relative to the selected layer's
active window; solo exports still omit audio. An out-of-bounds range fails.

To export only the audio mix as a WAV, use `export-audio`. It takes the same
range flags as `export`:

```sh
tsrct export-audio --project project.tsrct --start-ms 2000 --duration-ms 3000 --output .tesseract-work/checks/mix.wav
```

A long export can take many minutes.
Path-traced Scene3D exports are the usual case.
If the host can run a command in the background, start it that way with `--json` and
stderr (NDJSON progress) sent to a log such as `.tesseract-work/export.log`;
otherwise run it in the foreground with a timeout longer than the render. Wait in
blocking steps of about 4 minutes or less, reading only the log's last line
(`completed`, `total`, `etaSeconds`) between steps. Run one render at a time.
Never split an export or lower its settings to fit a wait. Open or probe the
output only after the command exits, and do not edit the document while it renders.

The `.tsrct` document is the portable editable source. Checked-out JSON becomes
the saved source only through `project commit`; do not edit the ZIP manually.

## Safety and failure behavior

- Never edit `project.tsrct` as text.
- Preserve the input with `--output .tesseract-work/revised.tsrct` when experimenting.
  To keep the change, re-apply it to the project document or move the trial over
  it; delete a discarded trial.
- `project apply` is atomic: a rejected action batch does not publish partial
  project changes.
- Preserve the `.tsrct` document and its packaged resources.
- This release exposes the supported subset of the engine action schema. Use only actions
  required for the user's request.
- For `missing_fonts`, obtain and import the requested files, then retry.
  Follow [font selection and import](fx-authoring.md#text-with-an-available-font);
  names in the error identify the requested faces.
  If import fails, report the actual error. Do not silently replace a requested face.
- FX text style and layout changes go through `project apply`.
- If preview, filmstrip, or export reports a GPU, Vulkan, or encoder error, read
  [runtime failures](install-cli.md#runtime-failures) before changing the environment.
