# Static visual designs

Use the executable located through the installation reference. Commands below use
`tsrct` as shorthand for that absolute path. Check `project --help` and
`preview --help` in the installed version when needed.

## Create and save

For new work, create a fresh project root with `mkdir` without `-p` and verify
success before writing into it. If it exists, choose another name. For revisions,
use the project established by the conversation, preserve originals and stable
IDs, and save a checkpoint before substantial changes.

Inside that root:

```sh
mkdir -p .tesseract-work
tsrct project create --project Design.tsrct
tsrct project schema --document > .tesseract-work/document.schema.json
tsrct project schema > .tesseract-work/actions.schema.json
tsrct project checkout --project Design.tsrct --output .tesseract-work/layout.json
```

Edit the checked-out JSON, then save it with:

```sh
tsrct project commit --project Design.tsrct --file .tesseract-work/layout.json
```

The document owns one composition. Set `dimensions.width` and `dimensions.height`
to the requested design size, for example 1080×1080, 1440×1000, or 390×844; preview uses those
authored dimensions. The renderer currently accepts positive dimensions up to
7680 pixels per side and at most 33,177,600 pixels total, subject to device limits.
If a requested design exceeds those limits, explain the constraint and agree on
a smaller render or separate boards appropriate to the deliverable. Do not
silently resize the design or split a single composition.

Creation defaults to three seconds. Keep a static design visible throughout that
window and preview at one second. Document `duration` is seconds; layer
`activeRange` is milliseconds, relative to its parent. There is no need to animate
or put different designs on a timeline: separate documents make variants
straightforward to revise.

## Editable layers and assets

Read only the needed definitions from the saved schemas. Geometry, text, groups,
images, and supported effects are native FX layers.

- Layer IDs are unique throughout the composition tree. `layers[0]` is frontmost.
- Position is in parent pixels; anchor is layer-local. Scale and opacity use
  percentages (`100` is identity); RGBA channels use `0..1`.
- Set a document background color or place a full-canvas shape behind content.
- Use supported grouping actions for related layers; preserve existing unknown
  fields and re-checkout after action batches before making further JSON edits.
- `project apply --project Design.tsrct --actions .tesseract-work/edits.json`
  applies an array of supported composition-local actions atomically. Canvas and
  media-layer structure edits use checkout/commit instead.

For example, an action batch to create a static card in the default composition
(adapt IDs, geometry, and styling to the design):

```json
[
  {"type":"createFxRectLayer","compositionId":"main","layerId":1,"name":"Card",
   "activeRange":{"start":0,"duration":3000},
   "transform":{"anchorPoint":[0,0],"position":[80,80],"scale":[100,100],"rotation":0,"opacity":100},
   "rect":{"size":[400,160],"fillColor":[0.05,0.25,0.8,1]}}
]
```

Choose fonts for the brand and actual text, then obtain the needed TTF/OTF/TTC
files from supplied assets or an authorized source. Import before authoring text:

```sh
tsrct project import-font --project Design.tsrct --file /absolute/path/Brand-Regular.ttf
```

Use the returned `fontFamily` and `fontStyle`, not names guessed from filenames.
For missing fonts, import the requested files and retry; explain unavailable faces
before substituting. Keep source/license information with acquired fonts. Box text
wraps but does not automatically shrink or clip overflow. Point text's origin is
its baseline. Preview the actual copy to check metrics and line breaks.

Import images before referring to them in layers:

```sh
tsrct project import-asset --project Design.tsrct --file /absolute/path/logo.png --asset-id logo --kind image
```

PNG, JPG/JPEG, and WebP are accepted; verify actual decoding in preview. Import
packages bytes but does not create a layer. Re-checkout after import, add an
`Image` layer using the installed document schema and imported asset ID, and
commit. Do not use a filesystem path as an asset ID or edit the `.tsrct` ZIP by hand.

## Render and inspect the saved design

```sh
tsrct preview --project Design.tsrct --time 1 --output Design.png
```

Open the PNG and inspect its dimensions and visible content. Correct the editable
source and rerender, including after the last revision. Preview output is a
standalone image; it does not require an MP4 export. If rendering fails, preserve
the project, report the actual error, and resolve it through the installed CLI's
supported workflow rather than switching renderers without the user's direction.
