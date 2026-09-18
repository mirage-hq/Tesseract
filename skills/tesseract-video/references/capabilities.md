# Capability map for Tesseract

This skill uses the installed Tesseract CLI and its version-matched schemas.
Instructions describe intent; exact fields come from `project schema` (actions)
and `project schema --document` (editable JSON). A successful save is not proof
that every requested combination renders correctly; inspect the actual result.

| Area | Tesseract mechanism | Read |
|---|---|---|
| Footage editing | Imported Video layers; independent source/active ranges, source audio, transform and framing | [native authoring](native-authoring.md), [FX authoring](fx-authoring.md#local-footage) |
| Compositing | Native text, shapes, groups, media, masks, adjustments, and effects supported by the document schema | [FX authoring](fx-authoring.md) |
| Motion graphics | Editable keyframe actions, procedural scripts, and coordinated groups | [motion](motion.md), [motion design](motion-design.md) |
| Type | Local TTF/OTF/TTC import, editable text, paragraph layout and schema-supported text animators | [text](fx-authoring.md#text-with-an-available-font) |
| Captions | Editable phrase text layers with actual words/timing from supplied or verified material | [bottom captions](fx-authoring.md#bottom-captions) |
| Custom effects | Bounded premultiplied-alpha WGSL with declared parameters and layer texture inputs | [custom shader contract](custom-shader.md) |
| Audio | Embedded video sound; imported Audio layers, source timing, linear gain and envelopes | [audio and timing](audio-and-timing.md) |
| Local sound tools | Procedural WAV accents, source/edit waveform PNGs, loudness measurements and mono listening copies | [sound design](sound-design.md), [waveform editing](waveform-editing.md) |
| Inspection/output | PNG preview, labeled project/solo filmstrips, H.264/AAC MP4, ProRes 4444 MOV (transparent with silent solo), portable `.tsrct` document | [local operation](local-operation.md), [filmstrip review](filmstrip-review.md) |

## Current boundaries

- A document owns one FX composition. Use groups for scenes and Video layers for
  cuts, not `baseVideoTrack`, `fxCompositions`, or caption/audio tracks.
- Import commands package local MP4/MOV/M4V footage and TTF/OTF/TTC font files.
  Installed system fonts are not discovered
  automatically. Audio and images use [media import](media-import.md).
  Import helper-generated files before placing layers.
- The CLI exports MP4 or ProRes 4444 MOV at automatic resolution/frame rate; inspect
  encoded dimensions rather than assuming they equal the canvas. Audio-only export, range export,
  and geometry inspection are not exposed.
- Canvas choices are listed in [local operation](local-operation.md). A bottom
  shape provides a different background; the renderer requires an absent or
  opaque-black document background.
- Native masks/mattes, effects, and supported 3D layer transforms are available
  only as allowed by the installed schema and required local resources. Verify
  person segmentation's model/resource availability and a real matte before
  planning around it. Do not approximate a person with a hand-drawn silhouette.
- JS animation is not HTML/React rendering. 3D layer transforms are not mesh
  import, rigging, simulation, or ray tracing.
- No generative video, avatar service, transcription, dedicated dereverberation
  model, cloud rendering, publishing, or editable Premiere/AE export is bundled.
- Native gain envelopes are timed ducking, not signal-driven compression. Do not
  invent DSP fields. Local derivatives use available FFmpeg and `project import-asset --kind audio`; see [speech cleanup](speech-cleanup.md).
- CLI setup follows [installation](installation.md). Optional audio helpers need
  Python 3.9+ and local FFmpeg/ffprobe. Font import requires a local TTF/OTF/TTC file;
  subsequent rendering uses the document's packaged bytes.

## Look up only what the edit needs

Save the two schemas locally and search for the specific layer, property, effect,
or action definition. Preserve existing fields and animation relationships.
The action schema includes only supported standalone operations; use
checkout/commit for document-level edits and media placement. Use the installed CLI’s schemas and available tools. If the requested feature is unavailable, explain the specific
limit and continue supported work without switching engines silently.
