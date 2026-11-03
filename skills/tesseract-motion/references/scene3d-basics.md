# Scene3D basics

Scene3D is an editable 3D scene rendered as one ordinary layer in Tesseract's
composition. Its children are 3D items, not ordinary 2D layers. Cameras select the
view; lights and materials describe illumination and surfaces. Keep 2D titles,
footage and effects outside the scene when that makes the composition clearer.
These capabilities require a Tesseract CLI built with 3D support.

## Coordinates, clocks and identities

X points right, Y down and Z into the screen. Positions and sizes are pixels,
rotations are degrees and scale is a percentage. Imported models keep their own
up axis: a Blender or glTF model already stands upright, so do not add a
corrective 90° or 180° rotation. Material color inputs (`baseColor`,
`emissiveColor`, …) are scene-linear BT.709 RGB: convert a hex or sRGB picker
value with the sRGB transfer function first (#C0392B is about
[0.527, 0.041, 0.024]). Light, fog, world and 2D colors are extended sRGB.
Every Scene3D has one required `pixelsPerMeter`, the scene's only physical
calibration: imported GLB metres, physical-lens apertures, cloth, fog distances
(metres), volume density (per metre) and material lengths (metres) all use it.
It does not rescale authored pixel geometry. With `pixelsPerMeter` 100, one
Blender unit (one metre) is 100 pixels: a 1.8 m figure is 180 pixels tall.
Lights are physical: point, spot
and area lights author emitted `power` in watts; parallel lights author
`irradiance` in W/m². Exposure is in stops: the scene's owned `view` (with its
own item `id`) plus the active camera's `exposure`. An added light or mesh that
omits `castsShadows` casts no shadow; set it to `true` where shadows matter.
Look up each property's range in the installed `project schema`; not every
numeric field animates.

The document duration is seconds. Layer windows and keyframe `layerTime` use
milliseconds. Scene3D has windowed playback; its content clock follows the
mapping and input offset, including ancestor group playback. Use content-clock
key times, not a guessed project-time offset. Preview timestamps are project time.

The owning `layerId` is an ordinary composition-layer identity. Child `itemId`,
material, environment and nested-control IDs are composition-wide item identities.
Choose unused integer IDs after inspection, preserve them during revisions, and
inspect canonical readback after creation because colliding add IDs may be reminted.
The apply report's `actions` lists the actions as applied, with any reminted ID;
later entries in the same batch still address the IDs they name.
Scene contents are flat `scene: {items, data, materials}` tables. Objects carry a
required nullable `parentId`; Mesh/Text/Model/Curve objects reference a `dataId`.
Geometry and model assets belong to Data, while stable material slots belong to
objects. Publish dependent Data and objects atomically with `addFxScene3DFragment`.

`styleProperty` addresses use the owning Scene3D `layerId`, the particular control's
`itemId`, and an exact `propertyName`.

Text Data `bevelSize` rounds glyph edges inward by default, as Cinema 4D does:
the silhouette keeps the outline, the front and back caps shrink, and strokes
thinner than twice the size rise to a ridge. `bevelSegments` sets the profile's
smoothness (1 is a flat chamfer). Set `"bevelOutside": true` to keep the caps
and grow the walls outward instead; if any glyph's walls would touch, the whole
text is clamped to the largest size that clears them. The size is limited to
half `depth`.

## Create a scene and animate a mesh

Start a new document and save the following batch as `scene.json`. It assumes
composition `main` and an otherwise empty document with at least three seconds.
The camera looks along +Z at the box; its orthographic view is 640 pixels wide (`scale` is the span along the camera's sensor-fit axis,
which defaults to horizontal here). Every camera requires a tagged `lens`:
Angle owns its projection and artistic aperture controls; Physical owns focal
length, sensor dimensions and f-number. Animate controls on the camera's item ID.
The layer renders through its active camera, which `setFxScene3DActiveCamera`
selects. Without one (`activeCamera` is `null`), it frames the canvas and ignores
its authored cameras, so camera edits change nothing.
Replacing the lens retains compatible channels; incompatible animation losses
require explicit `pruneAnimation` consent, otherwise the edit rejects atomically.

```json
[
  {"type":"createFxScene3DLayer","compositionId":"main","layerId":1,"name":"Product scene","pixelsPerMeter":100,"view":{"id":9,"exposure":0},"activeRange":{"start":0,"duration":3000},"transform":{"anchorPoint":[0,0],"position":[0,0],"scale":[100,100],"rotation":0,"opacity":100},"world":{"id":2},"renderSettings":{"id":97,"filmGate":null,"overscan":null,"lightGroups":[],"lightCollections":[],"lightLinks":[],"outputs":[],"previewOutput":null}},
  {"type":"addFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Camera3D","id":3,"parentId":null,"name":"Front camera","transform":{"position":[540,960,-1200],"relationships":{"constraints":[{"type":"aim","id":80,"target":{"id":800,"target":{"type":"world"},"offset":[540,960,0],"offsetSpace":"local"},"upSpace":"local","forwardAxis":"positiveZ"}]}},"lens":{"type":"angle","projection":{"type":"orthographic","scale":640}}}},
  {"type":"setFxScene3DActiveCamera","compositionId":"main","layerId":1,"cameraItemId":3},
  {"type":"addFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Light3D","id":4,"parentId":null,"name":"Key light","emitter":{"type":"parallel","irradiance":3}}},
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":100,"name":"Box geometry","geometry":{"type":"box","size":[180,180,180]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Mesh3D","id":5,"parentId":null,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[540,960,0]},"materialSlots":[{"id":101,"name":"Blue","binding":{"id":6,"inputs":{"baseColor":{"type":"constant","value":[0.010022825574869039,0.21404114048223255,0.7874122893956174]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":101},{"region":"side","slotId":101}]}]},
  {"type":"setFxPropertyValue","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":5,"propertyName":"rotationX"},"value":{"type":"float","value":-20}},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":5,"propertyName":"rotationY"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"box-start","layerTime":0,"value":{"type":"float","value":-25},"easing":{"type":"linear"}},{"id":"box-end","layerTime":2500,"value":{"type":"float","value":65},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

```sh
mkdir -p .tesseract-work
tsrct project create --project scene.tsrct
tsrct project apply --project scene.tsrct --actions scene.json
tsrct project inspect --project scene.tsrct --pretty > .tesseract-work/project.json
tsrct preview --project scene.tsrct --time 1 --output scene.png
tsrct filmstrip --project scene.tsrct --timestamps-ms 0,1000,2500 --output scene-filmstrip.png
```

## Rules the validator enforces

Every batch is atomic: a rejected batch changes nothing, and `project apply`
exits non-zero. Chain the following render with `&&` (or check the exit
status) so that a rejection is not followed by a preview of the unchanged
document. Most rejections in practice come from these rules:

- Enum values are exact and case-sensitive. A rotation is tagged:
  `{"type":"euler","order":"XYZ","orientation":[0,0,0],"rotationX":-20,"rotationY":30,"rotationZ":0}`
  (`orientation` is a static base, the three channels animate) or
  `{"type":"quaternion","value":[x,y,z,w]}` with a unit quaternion. Normalize a
  quaternion copied from a rounded report before using it.
- Mesh, Text and Model objects take `{position, rotation, scale, anchorPoint}`;
  cameras and lights take only `{position, rotation}` and optional
  `relationships`.
- `setFxPropertyValue` and `setFxAnimator` have no top-level `layerId`; the
  layer, item and property belong inside `target`.
- Mesh Data `regions` start with `{"key":"primary","name":"Primary"}` then
  `{"key":"side","name":"Side"}` (every region needs a `name`); custom regions
  follow. Text Data regions are exactly `front`, `back`, `side`. The object's
  `regionSlots` map every declared region exactly once; `"packing":"whole"`
  needs every region bound to the same slot, otherwise use `"regions"`.
- Actions apply in order, so an object can reference only objects that an
  earlier action or the same fragment adds (an aim, follow or path target, a
  scatter target). Within one fragment, list a modifier's operand (a
  shrinkwrap, boolean or data-transfer target) before the mesh that uses it.
- Look up a definition instead of guessing its fields. Search the saved schema;
  never read it whole. After
  `tsrct project schema > .tesseract-work/project-action.schema.json`, print
  `json.load(open(".tesseract-work/project-action.schema.json"))["$defs"]["JBSetFxScene3DTiltShiftAction"]`
  (or any `JB…` name that an error or another definition references) with
  Python. Its top-level `discriminator.mapping` lists every action type.

[Scene3D properties](scene3d-properties.md) lists every `propertyName` each kind
of scene item accepts, including the ones that exist only while a control such
as depth of field or fog is present. Names outside that list are rejected.
Search it rather than reading it whole; the section headings in the output show
the kind each hit belongs to:

```sh
grep -n -e '^## ' -e '`<propertyName>`' <skill-root>/references/scene3d-properties.md
```

A repeated name is a separate mode-specific row, possibly with another value
type or unit; if it repeats within one section (modifiers, geometry), read that
section before choosing. Texture, indexed and font-axis names
(`baseColorTextureOffset`, `curveVertex_3`, `opsz`) have no rows of their own:
they are a slot prefix plus a suffix row (`Offset`) or a pattern, all explained
in the file's last section.

`subsurfaceColor` replaces `baseColor` in the subsurface share rather than
tinting it (OpenPBR). Leave it unset to scatter with the base color. The
packaged CLI's action schema does not expose `setFxScene3DMaterialInput`;
inspect its material-edit actions before changing an existing input.

`setFxPropertyValue` changes the static base without detaching animation. Existing
animation can still determine the sampled value. For style targets use
`setFxAnimator` with an editable keyframe animator, as above. Preserve key IDs when
revising motion; do not inadvertently replace a useful animation stack.

## Physical tilt-shift setup

Use the single `setFxScene3DTiltShift` action on a Camera3D, not a 2D blur.
Give the camera a 200mm Physical lens with a 36×24mm sensor, then apply it:

```json
[
  {"type":"updateFxScene3DCameraControls","compositionId":"main","layerId":1,"itemId":3,"changes":{"lens":{"type":"physical","focalLengthMm":200,"sensorMm":[36,24],"fNumber":8}}},
  {"type":"setFxScene3DTiltShift","compositionId":"main","layerId":1,"itemId":3,"focusPlaneTiltDeg":8,"tiltDirectionDeg":90,"focus":{"type":"distance","distanceM":30},"aperture":{"type":"inFocusDepth","inFocusDepthM":4},"circleOfConfusionMm":0.03}
]
```

This writes existing camera controls: focus-plane Euler tilt [8,0], focus
30 metres, f-number about 2.94991, and circular bokeh. The axial near/far depths
are about 28.13275–32.13275m, not 28–32m. The 8° is the **focus plane**, not
mechanical lens tilt. The sharp region is a tilted wedge, not a horizontal band.
`shiftMm` defaults to [0,0]; positive axes frame right/down. A fixed-aperture
request uses `{"type":"fNumber","fNumber":2.8}` instead. Default CoC criterion
is sensor diagonal / 1500 when omitted.

The action never guesses physical dimensions. Switch an Angle camera to a
Physical lens first with `updateFxScene3DCameraControls`, as above; the
action's own `physicalLens` conversion needs a precomputed consent plan that
the CLI cannot produce. To focus on an object instead of a distance, use
`"focus":{"type":"target","itemId":5,"fallbackDistanceM":30}`; the target
must be an existing object of the same scene. The apply report lists the
action as applied; read the resulting `focusPlaneTilt`, `focusDistance`,
`fNumber` and `lensShift` from `project inspect` and judge the sharp region in
a preview.

Zooms and moving shots are supported directly: key `focalLengthMm` (and any
camera or target motion) **before** applying the action, and do not remove the
zoom to apply it. An `inFocusDepth` request holds that depth over the whole
shot: when the zoom or focus distance changes it, the action writes `fNumber`
keyframes solved from the evaluated focal length and focus distance at each
time (report `shot.fNumberKeys`). Never pick one focal length (for example the
median) and solve the aperture yourself. An `fNumber` request stays constant, so
the depth then changes with the zoom, as with a real lens. Do not combine
`physicalLens` with an animated `focalLengthMm`; it is rejected. With
`inFocusDepth`, author the zoom and the camera/target motion as ordinary
keyframes: scripts and animation-layer (property source or model clip) motion
of the camera or target are rejected.

After editing the zoom or motion, rerun the action. An unchanged rerun is a
no-op; replacing different `fNumber` keys needs a consent plan that the CLI
cannot produce, so first clear the camera's `fNumber` animator with
`clearFxAnimator`, then rerun.

The action resets blades/rotation/ratio to a circular pupil and rejects other
affected camera animation, including disabled tracks. Follow up with ordinary
`focusPlaneTilt`, `focusDistance` or `lensShift` keyframes when needed.
No recipe or live depth-width lock is stored. Export retains its existing
aperture integration and Playback retains its approximation.

## Structural edits

`moveFxScene3DLayer` retains item IDs and animation. `toIndex` is an insertion
slot **after removal**; `parentItemId` names a destination Group3D, or omit it for
the scene root. Reparenting normally retains local values and therefore changes
world placement. Request `preserveWorldTransform` only when its supported static
transform can represent the result; unsupported animation or shear rejects.

`duplicateFxScene3DLayer` takes `itemId` and `newItemId`. It copies geometry
independently, with fresh identities for owned children, slots, controls and
animation. Inspect references after copying:
light-link remapping has a known limitation. Shared material definitions are not
necessarily made unique merely by duplicating geometry.

`realizeFxScene3DArray` turns a Group3D's array into ordinary editable copy
groups at content time `time` (default 0); copy 0 keeps the original IDs, for
example `{"type":"realizeFxScene3DArray","compositionId":"main","layerId":1,"itemId":8}`.
It needs `pruneAnimation` only when it would drop animation (animated counts or
seeds, or animation of an inline material the array's per-copy paint replaces);
other animated array controls reject. It cannot read Text3D or Model3D surfaces
yet, so a scatter onto one, or paint on Model3D copies, rejects.

`removeFxScene3DLayer` removes the item/subtree with everything its objects own
and prunes their animation and dependencies. It needs `pruneAnimation` only when
it would drop animation (of the removed items or what they own, or
animation-layer uses and masks naming them) or a reference a surviving item holds
to them, such as a camera's focus; removing static content needs no flag.
Current removal is not uniformly reference-preserving: some references reject,
others are cleaned up or can remain dangling. Inspect dependent items before
removal; retain a backup. Whole-item `updateFxScene3DLayer` can also
prune tracks for omitted controls. Prefer the focused actions listed by
`project schema`; when replacing a whole item, preserve the complete payload and
all unrelated IDs.

For the scene above, save this as `duplicate-move.json`. The original and copy are translated
left and right so both boxes fit; moving changes stack order, not position.

```json
[
  {"type":"duplicateFxScene3DLayer","compositionId":"main","layerId":1,"itemId":5,"newItemId":7},
  {"type":"moveFxScene3DLayer","compositionId":"main","layerId":1,"itemId":7,"toIndex":0},
  {"type":"setFxPropertyValue","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":5,"propertyName":"position"},"value":{"type":"vector3","value":[400,960,0]}},
  {"type":"setFxPropertyValue","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":7,"propertyName":"position"},"value":{"type":"vector3","value":[680,960,0]}}
]
```

```sh
tsrct project apply --project scene.tsrct --actions duplicate-move.json
tsrct project inspect --project scene.tsrct --pretty > .tesseract-work/project.json
tsrct preview --project scene.tsrct --time 1 --output duplicate.png
```

Then save this as `remove-copy.json` and remove only the copy. Its copied
rotation keys need explicit `pruneAnimation` consent; without it, the action
rejects atomically rather than losing those tracks:

```json
[
  {"type":"removeFxScene3DLayer","compositionId":"main","layerId":1,"itemId":7,"pruneAnimation":true}
]
```

```sh
tsrct project apply --project scene.tsrct --actions remove-copy.json
tsrct preview --project scene.tsrct --time 1 --output removed.png
```

## Document edits and resources

Use `project checkout --project scene.tsrct --output editable.json`, edit the
canonical document without discarding unrelated fields, then
`project commit --project scene.tsrct --file editable.json`. Document-level edits
are useful for canvas/duration and blocks without scoped actions. Start from the
checked-out Scene3D JSON rather than a schema; commit validates it. Reload and inspect after commit;
valid JSON alone does not prove the intended picture. Saved JSON omits fields
that equal their default (for example `bevelSegments` 3), so a value you
authored can be absent from readback without being lost.

Inline mesh geometry and baked animation data are stored as text in the document,
so they dominate the size of a detailed scene; each full copy of one, including a
checkout or inspection dump, can take hundreds of megabytes. Keep checkpoints,
checkouts and inspection dumps as described in [storage](local-operation.md#storage).

Import assets before referencing their IDs:
`tsrct project import-asset --project scene.tsrct --file bottle.blend --asset-id bottle --kind model3d`.
You choose `--asset-id`; items then reference that ID. Images must be packaged
as images (a Radiance `.hdr` is accepted for environments); Model3D uses
`--kind model3d` with a binary glTF `.glb` or a Blender `.blend` (see
[imported models](#imported-models)). IES photometry uses `--kind ies` and a
prepared cloth point cache `--kind point-cache`. Arbitrary paths,
network IDs and wrong-kind assets do not substitute for imports. Fonts use the
ordinary `import-font` workflow. See `project import-asset --help` for the other
asset kinds. Layer-source textures must name
an existing layer in the same composition, not a file path or a 3D item ID.

## Imported models

A `.blend` is converted natively without Blender. The import result lists the
model's nodes, materials, clips, `sourceRevision` and bounds, plus
`conversion.diagnostics` for everything that did not carry over. Read the
diagnostics and tell the user about each loss. Typical losses: unapplied
modifiers (Bevel, Subdivision, Cloth; apply them in Blender to keep the
result), Principled features outside glTF's metallic-roughness model
(transmission, coat), area lights, light and shader node trees, drivers and
constraints. A missing glass or coat can be rebuilt as an authored material on
the affected region (`modelRegionSlots`). An imported model is one Model3D
object: it cannot be turned into an editable mesh or take a cloth simulation.

Importing packages the asset only. Add a Model3D object (and its Data) to show
it. Cameras and lights inside the file are listed as model nodes; they are
not scene cameras or lights. Recreate them as Camera3D and Light3D items from
the reported transforms when the user wants the file's framing or lighting, and
say which values (sensor fit, shift, area lights) you had to assume.

To stand a model (or any item) on a floor item, measure it at one time and
write ordinary values. Write `scale` and `position` as whole vectors, starting
from the stored values that `project inspect` shows:
`{"type":"setFxPropertyValue","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":20,"propertyName":"position"},"value":{"type":"vector3","value":[0,74.05,0]}}`.

1. For a real height, read the item's `worldBounds` in `scene3d.items`
   (`tsrct evaluate --project scene.tsrct --time-ms <t>`). Multiply each
   `scale` component by `metres × pixelsPerMeter / (max[1] − min[1])` (the
   height must be above 0) and apply it before you measure the gap.
2. Check the gap to the floor:
   `tsrct evaluate --project scene.tsrct --time-ms <t> --checks scene3d.grounding --check-arg scene3d.grounding:pair=<itemId>=<floorId>`.
   Add the `measured` gap of a `floating` or `penetrating` issue to the
   item's `position` Y (+Y is down). `notOverSupport` means the item is not
   above the floor.
3. Run the check again. The item is grounded only when there is no issue
   and the summary's `notEvaluated` is empty; a pair listed there (a wrong
   ID, or an item that is not drawn at that time) was not measured.

The gap is in world pixels, so under a parent convert it to the parent's
space. `setFxPropertyValue` writes only the base value under an animator. If
`project inspect` shows an animator on `position` or `scale` (constant,
keyframes, a disabled track with a parked value, or a script), change that
animator instead, then measure the height and the gap again. A Mesh3D floor is measured by its box corners (`approximate`), so use
a flat floor such as a box or plane.

A Model3D's stored controls do nothing until its ordered `poseStack` lists
them. A bound `clip` plays only with `{"type":"clip","source":{"type":"primary"}}`
in `poseStack`; a cross-fade `blend` needs `{"type":"clip","source":{"type":"blend"}}`;
a morph (shape key) control needs `{"type":"morph","control":<id>}` and a node
(bone) override `{"type":"localTransform","control":<id>}`. Without these
entries the model renders its rest pose with no error. Check animation with a
filmstrip whose frames must differ.

## Choose the renderer

`preview`, `filmstrip` and `export` render Scene3D layers with `raster` unless
you pass `--renderer path-tracer`. The path tracer traces light paths, so soft
shadows, bounced light, glass and metal reflections and refraction, and media
come from the physics rather than from raster's helpers. It is much slower, and
far slower again without a hardware GPU. The first denoised render downloads
the denoiser's weights. The renderer is a flag of the command, not part of the
document, and it applies to every Scene3D layer that the command renders.
Browser and iOS playback use raster even when a CLI export used the path tracer.

```sh
tsrct preview --project scene.tsrct --time 2 --output frame.png --renderer path-tracer --samples 16
tsrct export --project scene.tsrct --output scene.mp4 --renderer path-tracer --json
```

Choose the path tracer for explicit path-traced requests. Prefer it for realism,
photorealistic product imagery, bounced lighting, glass refraction and metal
reflections. Use raster for stylized graphics and fast layout or motion checks.

Use `--samples 16` with denoising for previews and drafts.
For final review and delivery, try the default 128 with denoising (omit
`--samples`). Before the full export, check the final-settings previews and
any short export (below) at full size for noise, and consecutive frames for
shimmer (flicker in areas that should be still). If either is visible, raise
`--samples`; halving noise takes four times the samples. Render time grows
about in proportion to the samples, so tell the user the new expected time.

Keep other settings at their defaults unless a specific scene requirement
justifies a change. `tsrct preview --help` lists all path-tracer controls and
their defaults, including bounce limits and `--no-denoise`.

Verify representative times with the intended final renderer and settings;
a raster/path-tracer comparison is not required. Preview uses the document's
authored size and a 30 fps shutter cadence. For another export size or frame
rate, check a short export with the final resolution, fps and renderer flags.

Preview reports `renderSeconds`; filmstrip and `export --json` report
`renderSecondsPerFrame`. These measure the render call, including scene building
and first-use shader compilation, but not readback, encoding or file writing.
Filmstrip timing is per rendered thumbnail, not a full-size export estimate.
Export progress also reports `elapsedSeconds` and `etaSeconds`; the ETA updates
when frames complete, not while a frame is still rendering. Use a short export
to estimate a long export's cost and tell the user the expected time. Cold
compilation and different scene content affect timing; an estimate is not an
upper bound.

A path-traced frame fails rather than silently switching to raster. Report
any failure diagnostic; do not change the requested renderer without the
user's approval. `export --json` puts the failure's `code` on its error event:

- `scene3d_device_limit`: the scene's data exceeds one GPU buffer; the message
  names the buffer and both sizes. Reducing copies or subdivision may help.
- `scene3d_path_tracer_frame`: the path tracer could not finish the frame (its
  posed geometry could not be read back, a GPU round or the denoiser failed).
  A retry may succeed.

The path tracer renders like `raster`, except:

- subsurface scattering is a random walk: light crosses thin objects, and base
  color maps stay sharp where raster blurs them;
- glass shadows take the glass's base color and Fresnel;
- there are no caustics: point, spot and sun lights without a size shadow
  through rough glass and refracting solids by the light that passes straight
  through, and a prism does not throw a rainbow onto a wall; area lights and
  lights with a radius or disk reach through glass only along refracted paths;
- a smooth slab shifts what is behind it along the refracted direction and,
  when dispersive, shows color fringes; a rough slab does not shift it;
- a blended caster shadows with its alpha, so a zero-opacity caster casts none;
- material occlusion maps, reflection probes, the indirect-light grid and
  soft-shadow sample counts are ignored (the tracer computes these effects);
- a light-group output includes the indirect light of its lights.

Rendered alpha is coverage: glass over a transparent background is opaque
where it covers, so footage composited behind a transparent render is not
refracted. Place the footage inside the scene (for example as a layer-source
texture) when refraction of it matters.

In the delivery, say which renders used `--renderer path-tracer` and with
which flags, and name any of these differences that affect the scene.

## Review and current limits

Inspect the actual preview, not merely command success. In the example verify a
centered blue box, visible lit faces and changing Y rotation across the filmstrip.
Check canvas placement, clipping, shadows, texture availability and temporal
continuity. Sparse filmstrips do not prove playback smoothness or platform parity.

`project inspect` prints the stored document JSON. Evaluated positions come from
`tsrct evaluate` (below). Resource preparation (model replacement, rigging, clip
bake, cloth bake) is requested inside `project apply`. Scene3D action and request
fields follow the examples here and `project schema`; report missing operations
rather than guessing command names.

### Run placement checks

`tsrct evaluate` reports, per sample, where every drawn Mesh3D, Text3D and
Model3D is (`scene3d.items`: world matrix and bounds, frame bounds, status) and
checks framing, text overlap, grounding and on-screen motion. Run the checks
that match the scene before delivery, correct actionable findings, then run
them again:

```sh
# Check framing and screen motion over an animated shot.
tsrct evaluate --project scene.tsrct \
  --checks scene3d.framing,scene3d.motion \
  --start-ms 0 --duration-ms 4000 --fps 30

# Check a still title for frame clipping and overlap with other Text3D items.
tsrct evaluate --project scene.tsrct --time-ms 0 \
  --checks scene3d.framing,scene3d.text-overlap

# Check that item 12 rests on support item 4 at a given time.
tsrct evaluate --project scene.tsrct --time-ms 0 \
  --checks scene3d.grounding \
  --check-arg 'scene3d.grounding:pair=12=4'
```

Replace the example path and IDs with the project's file, item and support
IDs. Grounding needs one `pair=ITEM_ID=SUPPORT_ID` argument for each expected
contact. Checks emit issues and a summary as JSON Lines. When `--checks` is
present, no measurement report is included by default; add
`--report scene3d.items` if you also need per-item positions and bounds. A
`scene3d.items` report alone measures placement but does not run checks.

These checks are approximate. Text overlap compares Text3D bounds in the same
Scene3D occurrence; it does not check ordinary 2D titles or occlusion. Grounding
uses world bounds and the item's footprint, so confirm the result in the
rendered frame. Framing can flag intentional full-bleed backgrounds and objects
passing the camera in a fly-through. Motion can flag intentionally fast
entrances, spins or near-camera objects; inspect the sampled filmstrip and, when
appropriate, check the settled interval separately. Explain any findings left
unfixed. `scene3d.mesh` and `scene3d.topology` measure a Mesh3D's drawn
triangles and editable polygons. `tsrct evaluate --list` describes every report
and check with its parameters.
`project apply --dry-run` reports a batch, including what each mesh edit moves,
without writing anything.
