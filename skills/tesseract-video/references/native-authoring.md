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
4. FX transform position is in parent pixels; anchor is layer-local. Scale and transform opacity are percentages, with `100` as identity. Color channels are `0..1`. Audio gain is linear. Check each field's schema rather than applying one universal percentage conversion.
5. The document owns one composition beginning at zero. Document `duration` is seconds; layer `activeRange` and `sourceRange` are milliseconds. Nested layer ranges are relative to the immediate parent. Moving a clip must not change its selected source moment.
6. `layerTimeJsCode` reads `input.time.seconds` from the owning layer's start. It must explicitly return a finite scalar/vector/color matching the target. Use stable IDs and declare dependencies. There is no DOM, CSS, or browser timeline.
7. Group related layers with supported grouping actions. Group effects see precomposed children; a normal layer effect sees only that layer. An Adjustment affects siblings below it. Inspect the schema before constructing a nontrivial feature.
8. Never reconstruct an unfamiliar document from a minimal template to make one correction: that drops existing layers, animation, and resources. Preserve unknown fields and re-checkout after actions to avoid committing stale JSON.

## Footage editing

Import each distinct local video once with `project import-video`. Select cuts
using Video layers: a clip from source 2.2–5.7s placed at edit 0–3.5s has
`sourceRange: {start: 2200, duration: 3500}` and
`activeRange: {start: 0, duration: 3500}` at composition root. Set
`sourceIntrinsicDuration` to the actual full source duration returned by import.
Set `volume: 1.0` on new Video layers to enable embedded source audio; an
omitted/null volume disables it. Preserve existing gain on revisions unless
deliberately changing the mix. Do not add a second
audible copy of the same sound. Use the Video layer's transform for a footage
push-in, or a Group transform when footage and graphics should move together.

For speed changes, maintain both source and edit duration deliberately. Inspect
the installed playback schema and render the result rather than inferring speed
behavior from different duration values. See [audio and timing](audio-and-timing.md).

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
