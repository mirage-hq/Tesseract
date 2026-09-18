# Running Tesseract locally

Resolve this skill from the directory containing its `SKILL.md`. In the sound
examples, `SKILL` means that absolute directory, whether installed alone or in a
plugin. Quote paths containing spaces. The optional sound/waveform tools use
Python 3.9+ and local FFmpeg/ffprobe; they do not install a renderer. If a tool is
missing, report the specific unavailable check and use the host's available
media tools where they can establish the same result.

Tesseract uses `tsrct` to edit and render portable `.tsrct` projects. Follow
[CLI installation](installation.md) to locate the executable,
check its version, or install the matching CLI release. Use the resolved
executable path in the commands below; it does not have to be on PATH.

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

## Before editing

Run `tsrct --version`, `tsrct project --help`, and `tsrct export --help`.
If `import-asset` or `--codec` is missing, follow [installation](installation.md).
The examples below run from the chosen project root; adapt filenames to the task.
Create an empty document for new work, or inspect the intended existing document:

```sh
tsrct project create --project project.tsrct
```

Creation makes one empty composition (`main`) on a 1080×1920 canvas, lasting
three seconds. Inspect its ID before adding content. Change canvas, duration,
or composition name by checking out and committing the editable document JSON.
The document `duration` is in seconds; layer ranges and action times are milliseconds.
Native rendering currently supports 1080×1920, 1920×1080, 1080×1080, 1080×1350,
810×1080, and 1350×1080 canvases. Leave `backgroundColor` absent or opaque black;
use a bottom FX shape layer for another background.

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

Use IDs from `.tesseract-work/project.json`. Read the relevant action definition from the
schema; do not invent fields.

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

Apply and review:

```sh
mkdir -p Previews .tesseract-work/checks
tsrct project apply --project project.tsrct --actions .tesseract-work/edits.json
tsrct preview \
  --project project.tsrct \
  --time 1 \
  --output .tesseract-work/checks/layout.png
```

Inspect `.tesseract-work/checks/layout.png` for layout. Review motion across its active range:

```sh
tsrct filmstrip --project project.tsrct \
  --start-ms 0 --duration-ms 3000 --interval-ms 250 --output Previews/Filmstrip.png
```

Open and inspect the generated images. Follow [filmstrip review](filmstrip-review.md)
for sampling, solo diagnostics, and the correction loop.

## Finish

```sh
tsrct export \
  --project project.tsrct \
  --output finished.mp4
```

For transparent motion graphics on macOS, export ProRes 4444:

```sh
tsrct export --project project.tsrct --codec prores4444 --output finished.mov
tsrct export --project project.tsrct --codec prores4444 --fx-solo main:3 --output overlay.mov
```

Full-project export includes the mix and the black canvas background. For alpha,
use solo export of the overlay layer or a group containing the graphic. Solo uses the selected
layer/group's active window, preserves canvas placement, and omits audio. Inspect
its alpha channel and composite over contrasting backgrounds before delivery.

Export uses the renderer's automatic resolution and frame rate; canvas dimensions
do not guarantee matching encoded dimensions. Inspect the resulting MP4 against
the delivery brief. This CLI does not expose resolution or FPS override flags.

Follow [review and delivery](review-and-delivery.md#handoff) for final checks and
presenting the result from this project root.

The `.tsrct` document is the portable editable source. Checked-out JSON becomes
the saved source only through `project commit`; do not edit the ZIP manually.

## Safety and failure behavior

- Never edit `project.tsrct` as text.
- Preserve the input with `--output .tesseract-work/revised.tsrct` when experimenting.
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

## Media inspection and optional audio helpers

Import reports metadata, not what a shot depicts or what its audio means. Inspect
source frames and listen through the host's media tools before choosing cuts.
For local metadata when FFmpeg tools are available:

```sh
ffprobe -v error -show_streams -show_format -of json /absolute/path/footage.mov
```

Use [waveform editing](waveform-editing.md) for source and rendered audio views,
and [audio and timing](audio-and-timing.md) for sound helpers and gain envelopes.
The helpers synthesize WAV accents on demand and inspect audio; they do not
import media or mutate a project. Import their output with `project import-asset --kind audio`,
then place editable Audio layers. Audio-only and arbitrary range export are not
exposed by this CLI. Use the CLI to modify documents; do not edit the ZIP directly.

For a dialogue-only diagnostic, check out the working document and commit a
separate `.tsrct` copy with music/SFX gains and any gain animators muted. Export
that copy to MP4 and inspect its audio directly with the waveform helper. Preserve
the working mix and source files; do not claim unperformed listening checks.
