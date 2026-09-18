# FX authoring

Use `project inspect` for existing content and `project schema` for the installed
CLI's action contract, or `project schema --document` for editable JSON.
The footage example edits document JSON; the other examples are action batches.

## Structure, placement, and resources

- The document owns one composition starting at time zero. Its root `duration`
  is seconds; layer `activeRange` and `sourceRange` values are milliseconds and
  immediate-parent-local. Keep document and ancestor windows long enough.
- Layer IDs are integers unique within a composition. Choose unused IDs after
  inspection; preserve IDs when editing. Names describe visible roles.
- Sibling index zero is frontmost. Create actions append behind siblings when
  `insertIndex` is omitted; use `insertIndex: 0` for a foreground insertion.
- `position` is in parent coordinates; `anchorPoint` is in layer-local coordinates.
  Scale and opacity use percentages (100 is unchanged/opaque); RGBA uses 0–1.
  Read the project's canvas dimensions rather than treating source pixels as
  composition coordinates. Parent transforms also affect children.
- `sourceRange` selects media time; `activeRange` places it in the composition.
  Moving content and trimming its source are different operations.
- Import local footage with `project import-video` before referencing its asset ID.
  An arbitrary path or asset ID in an action does not import its bytes.
  Import audio/images through [media import](media-import.md); package fonts as below.

## Local footage

Package supplied footage first; the command saves the video bytes inside the
project without modifying the source file:

```sh
tsrct project import-video --project project.tsrct \
  --file /path/to/clip.mp4 --asset-id footage-1
```

Use a new ID containing letters, numbers, hyphens, or underscores. Existing IDs
are rejected to avoid replacing another layer's media. The JSON response reports
`assetId`, `durationMs`, `width`, and `height` (display orientation). MP4, MOV, and
M4V containers are accepted; actual decoding uses the engine's supported codecs.
No external metadata tool is required. Import adds the resource; the following
editable document JSON places it on the timeline. Run `project checkout`, append
the layer below to `composition.layers`, set document `duration` to `3` seconds,
then run `project commit --project project.tsrct --file .tesseract-work/editable.json`. Preserve
other layers; append footage behind overlays because index zero is frontmost.

For a three-second clip, for example (adapt duration, IDs, canvas, and transform
to the returned metadata and the user's requested framing):

```json
[
  {"type":"Video","id":1,"name":"Main footage",
   "activeRange":{"start":0,"duration":3000},"sourceRange":{"start":0,"duration":3000},
   "sourceIntrinsicDuration":3000,"volume":1.0,
   "transform":{"anchorPoint":[0,0],"position":[0,0],"scale":[100,100],"rotation":0,"opacity":100},
   "source":{"assetId":"footage-1","fit":"contain"}}
]
```

Import each distinct file once; multiple layers can reference the same asset.
Use the actual clip duration for `sourceIntrinsicDuration`, and select the wanted
section with `sourceRange`. Preserve footage audio unless the user asks to mute
or replace it. Set `volume: 1.0` on new Video layers to enable embedded audio
at unity gain; an omitted/null volume leaves it disabled. Preserve existing
gain and animators on revisions, and verify the exported audio.
Inspect a preview to verify crop, orientation, and composition placement before
adding overlays or exporting. If decoding fails, report the error and source format.

## Rectangle overlay

In the default `main` composition, this adds a blue card. Adapt the inspected
composition ID, unused layer IDs, and geometry to the existing document.

```json
[
  {"type":"createFxRectLayer","compositionId":"main","layerId":1,"name":"Card","insertIndex":0,
   "activeRange":{"start":0,"duration":3000},
   "transform":{"anchorPoint":[0,0],"position":[80,80],"scale":[100,100],"rotation":0,"opacity":100},
   "rect":{"size":[400,160],"fillColor":[0.05,0.25,0.8,1]}}
]
```

## Group related parts

After the previous example, add an accent in front and group the two siblings.
The identity group transform preserves their placement. Animate the group to
move the callout together; animate a child for a detail within it.

```json
[
  {"type":"createFxRectLayer","compositionId":"main","layerId":2,"name":"Accent","insertIndex":0,
   "activeRange":{"start":0,"duration":3000},
   "transform":{"anchorPoint":[0,0],"position":[80,80],"scale":[100,100],"rotation":0,"opacity":100},
   "rect":{"size":[8,160],"fillColor":[1,0.7,0.1,1]}},
  {"type":"groupFxCompositionLayers","compositionId":"main","layerIds":[2,1],"groupLayerId":3,"name":"Callout group",
   "transform":{"anchorPoint":[0,0],"position":[0,0],"scale":[100,100],"rotation":0,"opacity":100}}
]
```

Grouping requires contiguous siblings with the same parent. Use the grouping
operation rather than manually reparenting children and rewriting their timing.

## Text with an available font

Choose typography for the brief before acquiring files. Honor supplied brand
fonts; otherwise choose the character, width, weight, and hierarchy that suit
the actual headline and supporting copy. The example's Inter Bold is a wire-format
example, not a recommended design default. Availability in an OS folder, cache,
or test fixture is not a reason to choose a face.

Use supplied font files or obtain the selected TTF/OTF/TTC from an official
source such as Google Fonts when downloads are allowed. Keep a recognizable
filename and the source/license with the working files. If the requested font
cannot be obtained, explain the gap before substituting it.

Import the selected files into the document before authoring text:

```sh
tsrct project import-font --project project.tsrct --file /path/to/Inter-Bold.ttf
```

Use the returned `fontFamily` and `fontStyle`, not names guessed from the filename.
For a collection, choose the intended entry from `faces`. The filename is a
readable asset label; parsed metadata identifies the face, and the asset ID
identifies the file's bytes. Import only the faces needed for the chosen design.
Repeat import is a no-op. Preview and export use the packaged bytes after the
document moves to another machine.

Before building text-led animation, preview the actual words at their intended
size and placement. Check character, hierarchy, line breaks, and glyph coverage;
if the choice is uncertain, compare a small number of candidates in a scratch
project before importing the selection into the deliverable. A successful import
proves the file is usable, not that its typography fits the brief.

This adds box text to group 3 above using the imported Inter Bold face.

```json
[
  {"type":"createFxTextLayer","compositionId":"main","parentLayerId":3,"insertIndex":0,"layerId":4,"name":"Callout label",
   "activeRange":{"start":0,"duration":3000},
   "transform":{"anchorPoint":[0,0],"position":[112,112],"scale":[100,100],"rotation":0,"opacity":100},
   "sourceText":{"text":"A useful detail","fontFamily":"Inter","fontStyle":"Bold","fontSize":32,
     "fillColor":[1,1,1,1],"justification":"left","boxText":true,"boxPosition":[0,0],"boxSize":[336,96]}}
]
```

Box text wraps but does not automatically shrink or clip overflow. Point text's
local origin is its baseline start, not its visual center. Inspect a rendered
frame for font metrics, line breaks, and overflow before animating the layout.


## Bottom captions

Keep spoken captions editable as FX text layers, with one short phrase per
`activeRange`. Obtain the actual words and timings from a supplied transcript,
reviewed audio, or an available transcription tool; the CLI does not transcribe.
If none is available, ask for the spoken text rather than inventing dialogue.
Map source timestamps through the footage's `sourceRange` and `activeRange`.

Import the selected legible font file first. On a 1080×1920 portrait canvas, a useful
starting point is centered box text at `[90, 1550]`, box size `[900, 220]`,
font size `64`, and white fill. Adapt to the inspected canvas and shot. Keep
phrases to one or two lines and use a dark rounded rectangle behind them when
footage contrast needs it. Put both layers above the footage with matching
active ranges, and keep the text ahead of its background in sibling order.

Review phrase boundaries and the longest caption in the composed filmstrip.
Verify the text stays inside the frame, clears the face and bottom edge, and
matches the audible words. Preserve the video's embedded audio gain.
