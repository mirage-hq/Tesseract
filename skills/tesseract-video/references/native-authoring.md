# Authoring native Tesseract projects

## Local workflow

Use [local operation](local-operation.md) to create or inspect a `.tsrct`
document. `project checkout` writes editable JSON; `project commit` validates
and saves it. Supported composition-local action batches use `project apply`.
Keep the original and stable IDs. A rejected commit or action batch does not
publish partial changes. Never edit the archive manually or use a protobuf
converter for this document format.

Read [FX authoring](fx-authoring.md) before changing project structure, and
[motion](motion.md) before changing animation. These contain working examples;
use `project schema --document` and `project schema` for the installed fields.
The action schema includes only supported standalone operations and their field restrictions.
Use checkout/commit for canvas, duration, and media-layer structure changes.

## Essential invariants

1. `layers[0]` is topmost. Preserve sibling order when inserting footage behind graphics.
2. IDs are identities, not array positions. Layer IDs are unique throughout the composition's nested tree. Effect, mask, style, and text-animator IDs used by dynamics must remain stable.
3. New visual media uses `Video` or `Image`, not the `Media` tag. Import images with `project import-asset --kind image` before placing them; see [media import](media-import.md).
4. FX transform position is in parent pixels; anchor is layer-local. Scale and transform opacity are percentages, with `100` as identity. Authored paint RGB uses finite encoded extended-sRGB `0..64`; coverage alpha remains `0..1`. HDR continues the sRGB transfer function; SDR ratio-fits RGB. AEP/Premiere export clips extended RGB per channel to `1` with diagnostics, losing HDR brightness and ratios; existing alpha/export limitations remain. Intrinsic emoji and baked PAG bytes are not amplified. Audio gain is linear. Check each field's schema rather than applying one universal percentage conversion.
5. The document owns one composition beginning at zero. Document `duration` is seconds; layer `activeRange`/`playback` and `sourceRange` are milliseconds. Nested layer ranges are relative to the immediate parent. Moving a clip must not change its selected source moment.
6. `layerTimeJsCode` reads `input.time.seconds` from the owning layer's start. It must explicitly return a finite scalar/vector/color matching the target. Use stable IDs and declare dependencies. There is no DOM, CSS, or browser timeline.
7. Group related layers with supported grouping actions. Group effects see precomposed children; a normal layer effect sees only that layer. An Adjustment affects siblings below it. Inspect the schema before constructing a nontrivial feature.
8. Never reconstruct an unfamiliar document from a minimal template to make one correction: that drops existing layers, animation, and resources. Preserve unknown fields and re-checkout after actions to avoid committing stale JSON.

## Footage editing

Import each distinct local video once with `project import-video`. Select cuts
using Video layers: a clip from source 2.2–5.7s placed at edit 0–3.5s has
`sourceRange: {start: 2200, duration: 3500}` and a windowed
`playback` with `inputRange: {start: 0, duration: 3500}` and
`inputOffsetMs: 2200` at composition root (Video/Audio/Group use `playback`,
never `activeRange`; see the footage example in fx-authoring). Set
`sourceIntrinsicDuration` to the actual full source duration returned by import.
Set `volume: 1.0` on new Video layers to enable embedded source audio; an
omitted/null volume disables it. Preserve existing gain on revisions unless
deliberately changing the mix. Do not add a second
audible copy of the same sound. Use the Video layer's transform for a footage
push-in, or a Group transform when footage and graphics should move together.

For speed changes, maintain both source and edit duration deliberately. Inspect
the installed playback schema and render the result rather than inferring speed
behavior from different duration values. See [audio and timing](audio-and-timing.md).

### Shot-local corrections without recutting

An imported Video can contain a complete multi-shot edit. Separate native
windows let you correct one shot without replacing media or changing its cut
times. When independent windows are needed on a plain Video layer with no
existing animation, use `splitFxLayer` through `project apply` rather than
manually recalculating its source clock.
Check the installed action schema first. For example, if layer 1 in composition
`main` spans project time 0–10 seconds and ID 2 is unused:

```json
[{"type":"splitFxLayer","compositionId":"main","layerId":1,
  "newLayerId":2,"timeMs":2000}]
```

This creates adjacent windows 0–2s and 2–10s. The original keeps ID 1; the right
part gets ID 2. `timeMs` is project-absolute milliseconds and must be strictly
inside the layer window. Use actual confirmed cut times and unused IDs, not
these example values. Re-inspect after each split: later cuts target the layer
whose window contains them, and copied effect IDs may change.

Video splitting partitions the playback window while retaining the source
asset, source selection and mapping. Do not reset `inputOffsetMs`, restart the
right-hand clip at source zero, or shorten `sourceIntrinsicDuration` to the
shot's length. A source selection wider than a resulting playback window is
expected. Preserve transforms, source framing and audio gain; do not add a
second audible copy of the original full-length layer.

Before grading, preview before, at and after the split and within both windows
against the unsplit project. Confirm identical source frames, no gap/overlap,
unchanged duration/framing and continuous audio. Then add the shot-specific
correction and review the final export too.

Do not blindly apply this plain-layer recipe to an animated, nested or retimed
edit. In particular, composition-level property animators stay on the original
layer when splitting; the right part does not automatically inherit them.
Inspect dependencies and the installed capabilities, preserve the existing
behavior, or use supported time-keyed color controls instead. If preservation
cannot be verified, report the limitation rather than silently losing animation.

## Assets and fonts

Resources are packaged in the `.tsrct` document. A filename or invented asset
ID in JSON does not import bytes. Use the ID returned by `project import-video`.
Choose and obtain fonts using the [text workflow](fx-authoring.md#text-with-an-available-font).
Import a local TTF/OTF/TTC with `project import-font --project project.tsrct
--file /path/to/font.ttf` before creating text. Use the returned `fontFamily`
and `fontStyle`. The command embeds
font bytes in the document. Use `project import-asset` for audio and images.
If rendering returns `{"error":"missing_fonts","fonts":[...]}`, import the
required files and retry. Do not silently replace the requested font.

Preview, filmstrip, and export use the same packaged font bytes. Check rendered
glyphs and spacing; a fallback font is not proof the intended face was used.
