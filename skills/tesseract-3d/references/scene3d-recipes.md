# Scene3D recipes

Copy-ready starting points for the 3D-enabled CLI; see [basics](scene3d-basics.md)
for clocks, coordinates and renderer tradeoffs, and [properties](scene3d-properties.md)
for valid animation addresses. Use `tsrct project schema` for your installed build.

## Start each recipe in a fresh scene

Save this batch as `base.json`; it creates a camera and above-front sun, but no geometry.
The examples reserve their IDs for an empty `main` composition with a three-second duration.
Do not concatenate every recipe into one document: their IDs intentionally overlap.

```json
[
  {"type":"createFxScene3DLayer","compositionId":"main","layerId":1,"name":"Recipe","pixelsPerMeter":100,"view":{"id":9,"exposure":0},"activeRange":{"start":0,"duration":3000},"transform":{"anchorPoint":[0,0],"position":[0,0],"scale":[100,100],"rotation":0,"opacity":100},"world":{"id":2},"renderSettings":{"id":97,"filmGate":null,"overscan":null,"lightGroups":[],"lightCollections":[],"lightLinks":[],"outputs":[],"previewOutput":null}},
  {"type":"addFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Camera3D","id":3,"parentId":null,"name":"Camera","transform":{"position":[300,-220,-1000],"relationships":{"constraints":[{"type":"aim","id":80,"target":{"id":81,"target":{"type":"world"},"offset":[0,0,0],"offsetSpace":"local"},"up":[0,1,0],"upSpace":"world","forwardAxis":"positiveZ","influence":1}]}},"lens":{"type":"angle","projection":{"type":"orthographic","scale":640}}}},
  {"type":"setFxScene3DActiveCamera","compositionId":"main","layerId":1,"cameraItemId":3},
  {"type":"addFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Light3D","id":4,"parentId":null,"name":"Sun","transform":{"rotation":{"type":"euler","order":"XYZ","orientation":[0,0,0],"rotationX":-45,"rotationY":0,"rotationZ":0}},"emitter":{"type":"parallel","irradiance":3}}}
]
```

```sh
tsrct project create --project scene.tsrct
tsrct project apply --project scene.tsrct --actions base.json
```

Unless stated otherwise, save a recipe's JSON as `recipe.json` and apply it after
`base.json`; recipes marked **box first** also need the primitive batch below.
Model follow-ups each start from the model-placement recipe, not from each other.
For `setFxPropertyValue` and `setFxAnimator`, put `layerId` **inside `target`**,
not beside `compositionId`; their style targets also require `itemId` and `propertyName`.
For a landscape canvas, checkout the document, change `dimensions` to
`{"width":640,"height":480}`, then commit it; the examples were checked at that size.

```sh
tsrct project apply --project scene.tsrct --actions recipe.json &&
  tsrct filmstrip --project scene.tsrct --timestamps-ms 0,1250,2500 \
    --frame-rate 30 --output check.png
```

Check the actual picture, not just successful apply output. `filmstrip --fx-solo main:1`
samples the layer's active window; it cannot be combined with `--timestamps-ms`.

## 1. Mesh rotations, poses and an above-front sun

Place two boxes using equivalent Euler and quaternion rotations, with an explicitly directed sun.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":100,"name":"Geometry","geometry":{"type":"box","size":[140,180,90]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Mesh3D","id":5,"parentId":null,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[-120,0,0],"scale":[100,100,100],"rotation":{"type":"euler","order":"XYZ","orientation":[0,0,0],"rotationX":0,"rotationY":25,"rotationZ":0}},"materialSlots":[{"id":150,"name":"Finish","binding":{"id":151,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":150},{"region":"side","slotId":150}]},{"type":"Mesh3D","id":6,"parentId":null,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[120,0,0],"scale":[100,100,100],"rotation":{"type":"quaternion","value":[0,0.21643961393810288,0,0.9762960071199334]}},"materialSlots":[{"id":160,"name":"Finish","binding":{"id":161,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":160},{"region":"side","slotId":160}]}]},
  {"type":"updateFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Light3D","id":4,"parentId":null,"name":"Above-front sun","transform":{"position":[0,0,0],"rotation":{"type":"euler","order":"XYZ","orientation":[0,0,0],"rotationX":-45,"rotationY":0,"rotationZ":0}},"emitter":{"type":"parallel","irradiance":3}}}
]
```

Check matching box orientations and illuminated top/front faces, not an upside-down camera.
Euler `order` is uppercase (`XYZ`); quaternion values are unit-length `[x,y,z,w]`.

Mesh transforms accept `position`, `rotation`, `scale` (percent) and `anchorPoint`;
camera/light poses accept position and rotation, **not scale**. The starter camera
shows an aim pose: `up:[0,1,0]` gives an upright view even though Y points down;
`[0,-1,0]` turns it upside down. The hint names the camera's positive local Y basis,
not a literal world-space “sky” direction.

A parallel, spot or area light shines along **local +Z** at zero rotation
(area: its emitting side); the parallel light's position does not affect direction.
With Y down, `rotationX:-45` sends rays down-forward (`+Y,+Z`), so light arrives
from above-front (`-Y,-Z`) and illuminates top faces. `rotationX:+45` sends rays
up-forward and leaves those tops dark. For targeted spots/areas, aim positive Z
at the illuminated point, as in the fog recipe.

## 2. Primitive regions and material slots

Create a box whose two canonical regions share one editable finish.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":100,"name":"Geometry","geometry":{"type":"box","size":[180,180,180]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Mesh3D","id":5,"parentId":null,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[0,0,0]},"materialSlots":[{"id":150,"name":"Finish","binding":{"id":151,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":150},{"region":"side","slotId":150}]}]}
]
```

Save this as `box.json` for recipes marked **box first**; check a blue box with lit faces.
Mesh Data regions begin with `primary`, then `side`; assign one `regionSlots` row
per declared region to an existing object-owned material slot. A slot's `binding`
is the material, not a top-level `material` field.

In one table, put referenced objects **before** their users: parents before children,
Curve3D before a follower, and a shrinkwrap target before its decal. Put shared Data
in the same fragment's `data` table; avoid forward references between objects.

## 3. Extruded text with front/back/side finishes

Give an extruded title separate face, back and side materials.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"text","id":200,"name":"Type geometry","text":"UP","fontFamily":"Inter","fontStyle":"Regular","fontSize":120,"depth":30,"regions":[{"key":"front","name":"Front"},{"key":"back","name":"Back"},{"key":"side","name":"Side"}]}],"items":[{"type":"Text3D","id":20,"parentId":null,"name":"Extruded title","dataId":200,"transform":{"position":[0,40,0]},"materialSlots":[{"id":210,"name":"Finish","binding":{"id":211,"inputs":{"baseColor":{"type":"constant","value":[0.9,0.5,0.05]},"roughness":{"type":"constant","value":0.4}}}},{"id":212,"name":"Finish","binding":{"id":213,"inputs":{"baseColor":{"type":"constant","value":[0.1,0.2,0.7]},"roughness":{"type":"constant","value":0.4}}}},{"id":214,"name":"Finish","binding":{"id":215,"inputs":{"baseColor":{"type":"constant","value":[0.05,0.08,0.1]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"front","slotId":210},{"region":"back","slotId":212},{"region":"side","slotId":214}]}]}
]
```

First package a real font: `tsrct project import-font --project scene.tsrct --file /path/to/Inter-Regular.ttf`.
Check upright gold lettering with dark extrusion; turn it around to inspect the blue back.
Text Data regions are exactly `front`, `back`, `side`, each with one region-slot row;
do not copy Mesh Data's `primary` key into Text Data.

## 4. Import a model and play a clip

Import a `.blend` or `.glb` before placing its Model3D object, retaining native materials
except for an optional torso override.

```sh
tsrct project import-asset --project scene.tsrct --file character_rig.blend \
  --asset-id character --kind model3d > character-import.json
```

`--asset-id` is required. Use the report's node/material/animation/morph identities,
not guesses based on visible labels. These examples use a rig with `Idle`, `Wave`,
`Face/Smile` and a `RobotRig/.../head` bone; another model needs its own bindings.
The slot source below identifies node 1, primitive 0 of this imported revision.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"model","id":200,"name":"Character","assetId":"character"}],"items":[{"type":"Model3D","id":20,"parentId":null,"name":"Character","dataId":200,"transform":{"position":[0,150,0],"scale":[100,100,100]},"materialSlots":[{"id":310,"name":"Finish","binding":{"id":311,"inputs":{"baseColor":{"type":"constant","value":[0.7,0.15,0.03]},"roughness":{"type":"constant","value":0.4}}}}],"modelRegionSlots":[{"source":{"sourceRevision":"ae98e808db968c076c1a0ed826a804f5f157eb6bd8f9a4f30285e28a023ee846","node":1,"primitive":0},"slotId":310}],"clip":{"animation":"animation:path:Wave","loop":true,"time":0},"poseStack":[{"type":"clip","source":{"type":"primary"}}]}]},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":20,"propertyName":"clipTime"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"clipTime-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"clipTime-end","layerTime":2500,"value":{"type":"float","value":2.5},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

Save as `model.json`; refresh its revision from the import report before applying:

```sh
python3 - <<'PY'
import json
p = 'model.json'
actions = json.load(open(p))
source = actions[0]['items'][0]['modelRegionSlots'][0]['source']
source['sourceRevision'] = json.load(open('character-import.json'))['model']['sourceRevision']
with open(p, 'w') as f:
    json.dump(actions, f)
PY
tsrct project apply --project scene.tsrct --actions model.json &&
  tsrct filmstrip --project scene.tsrct --timestamps-ms 0,1250,2500 --output model.png
```

Check a waving arm and orange torso; unmapped primitives keep native materials.
For no overrides, set both `materialSlots` and `modelRegionSlots` to `[]`.
`clipTime` values are seconds, keyframe `layerTime` values are milliseconds.
The clip binding alone is inert: `poseStack` must contain `clip` / `primary`.
A clip named Idle may be static; a successful time write does not prove visible motion.

The following three batches replace the complete model item; retain unrelated controls
when adapting them. Refresh their `sourceRevision` from the same report too, or remove
both material arrays if you do not want the override. Each starts after `model.json`.

## 5. Cross-fade to a second clip

Blend the waving clip toward Idle while advancing both clip clocks.

```json
[
  {"type":"updateFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Model3D","id":20,"parentId":null,"name":"Character","dataId":200,"transform":{"position":[0,150,0],"scale":[100,100,100]},"materialSlots":[{"id":310,"name":"Finish","binding":{"id":311,"inputs":{"baseColor":{"type":"constant","value":[0.7,0.15,0.03]},"roughness":{"type":"constant","value":0.4}}}}],"modelRegionSlots":[{"source":{"sourceRevision":"ae98e808db968c076c1a0ed826a804f5f157eb6bd8f9a4f30285e28a023ee846","node":1,"primitive":0},"slotId":310}],"clip":{"animation":"animation:path:Wave","loop":true,"time":0},"poseStack":[{"type":"clip","source":{"type":"primary"}},{"type":"clip","source":{"type":"blend"}}],"blend":{"clip":{"animation":"animation:path:Idle","loop":true,"time":0},"weight":0}}},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":20,"propertyName":"blendClipTime"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"blendClipTime-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"blendClipTime-end","layerTime":2500,"value":{"type":"float","value":2.5},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":20,"propertyName":"blendWeight"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"blendWeight-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"blendWeight-end","layerTime":2500,"value":{"type":"float","value":1},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

Check the raised arm settling toward the idle pose as `blendWeight` approaches 1.
Both `primary` and `blend` entries must be in `poseStack`; merely adding `blend`
or animating its weight does not activate it.

## 6. Animate a model morph / shape key

Add a Smile morph after the sampled clip pose.

```json
[
  {"type":"updateFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Model3D","id":20,"parentId":null,"name":"Character","dataId":200,"transform":{"position":[0,150,0],"scale":[100,100,100]},"materialSlots":[{"id":310,"name":"Finish","binding":{"id":311,"inputs":{"baseColor":{"type":"constant","value":[0.7,0.15,0.03]},"roughness":{"type":"constant","value":0.4}}}}],"modelRegionSlots":[{"source":{"sourceRevision":"ae98e808db968c076c1a0ed826a804f5f157eb6bd8f9a4f30285e28a023ee846","node":1,"primitive":0},"slotId":310}],"clip":{"animation":"animation:path:Wave","loop":true,"time":0},"poseStack":[{"type":"clip","source":{"type":"primary"}},{"type":"morph","control":30}],"morphs":[{"id":30,"node":"node:path/RobotRig/Face","mode":"replace","weights":[{"target":"morph:mesh:path:Face/Smile","weight":0}]}]}},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":30,"propertyName":"morphWeight0"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"morphWeight0-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"morphWeight0-end","layerTime":2500,"value":{"type":"float","value":1},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

Check the mouth changing from neutral to smiling across the filmstrip.
Use the imported morph key (`Face/Smile` here, not an older asset's `Cube.002/Smile`);
the `morph` pose-stack entry is required and its control points to the morph record ID.

## 7. Animate a bone-local transform

Apply an additive head turn after the native clip.

```json
[
  {"type":"updateFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Model3D","id":20,"parentId":null,"name":"Character","dataId":200,"transform":{"position":[0,150,0],"scale":[100,100,100]},"materialSlots":[{"id":310,"name":"Finish","binding":{"id":311,"inputs":{"baseColor":{"type":"constant","value":[0.7,0.15,0.03]},"roughness":{"type":"constant","value":0.4}}}}],"modelRegionSlots":[{"source":{"sourceRevision":"ae98e808db968c076c1a0ed826a804f5f157eb6bd8f9a4f30285e28a023ee846","node":1,"primitive":0},"slotId":310}],"clip":{"animation":"animation:path:Wave","loop":true,"time":0},"poseStack":[{"type":"clip","source":{"type":"primary"}},{"type":"localTransform","control":30}],"nodes":[{"id":30,"source":"node:path/RobotRig/root/hips/spine/chest/head","mode":"additive","transform":{"position":[0,0,0],"scale":[100,100,100],"rotation":{"type":"euler","order":"XYZ","orientation":[0,0,0],"rotationX":0,"rotationY":0,"rotationZ":0}}}]}},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":30,"propertyName":"rotationY"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"rotationY-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"rotationY-end","layerTime":2500,"value":{"type":"float","value":45},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

Check the head turning independently of the torso and arm motion.
The node uses its imported source key, and `localTransform` must list its control ID
in `poseStack`; order matters when a later clip would otherwise overwrite the pose.

## 8. HDRI background and illumination

Use one imported HDR environment for visible background and sampled world lighting (**box first**).

```json
[
  {"type":"setFxScene3DWorld","compositionId":"main","layerId":1,"world":{"id":2,"background":{"type":"image","assetId":"studio","rotation":90},"light":{"source":{"type":"image","assetId":"studio","rotation":90},"intensity":1,"integration":"sampled"}}}
]
```

First run `tsrct project import-asset --project scene.tsrct --file studio.hdr --asset-id studio --kind image`.
Check both the environment background and its effect on the box; background rotation
and light-source rotation are independent, so set both when rotating the entire world.

## 9. Transparent overlay and ProRes 4444

Keep world illumination but remove the world background for compositing (**box first**).

```json
[
  {"type":"setFxScene3DWorld","compositionId":"main","layerId":1,"world":{"id":2,"light":{"source":{"type":"color","color":[1,1,1,1]},"intensity":0.2,"integration":"sampled"}}}
]
```

Check transparency outside the box in the PNG's alpha channel, not just a black viewer backdrop;
remove any separate opaque composition background too. For delivery, use ProRes 4444 MOV:

```sh
tsrct export --project scene.tsrct --output overlay.mov --format prores --fx-solo main:1 --fps 30
```

This is an export command, not an export verification result; check the delivered alpha
in your editor. A whole-project export composites onto the black canvas;
`--fx-solo` keeps the layer's alpha. MP4 is not the transparent-overlay format.

## 10. Fog with a spotlight beam

Scatter a downward spotlight through a bounded volume (**box first**).

```json
[
  {"type":"setFxScene3DWorld","compositionId":"main","layerId":1,"world":{"id":2,"background":{"type":"color","color":[0.01,0.01,0.02,1]},"light":{"source":{"type":"color","color":[1,1,1,1]},"intensity":0.02,"integration":"sampled"}}},
  {"type":"updateFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Light3D","id":4,"parentId":null,"name":"Beam","transform":{"position":[-180,-350,-100],"relationships":{"constraints":[{"type":"aim","id":82,"target":{"id":83,"target":{"type":"world"},"offset":[0,80,0],"offsetSpace":"local"},"up":[0,1,0],"upSpace":"world","forwardAxis":"positiveZ","influence":1}]}},"emitter":{"type":"spot","power":300,"coneAngle":30,"coneFeather":0.2,"sourceRadius":2}}},
  {"type":"addFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Volume3D","id":30,"parentId":null,"name":"Fog","transform":{"position":[0,-100,0]},"size":[900,800,900],"density":0.08,"scatteringColor":[0.8,0.9,1,1],"anisotropy":0.2}}
]
```

Check a visible beam and the box interrupting it, using the path tracer:

```sh
tsrct preview --project scene.tsrct --time 1 --output fog.png --renderer path-tracer --samples 16
```

With world lighting present, Volume3D requires `light.integration:"sampled"`;
a plain ambient environment is not a substitute. Density is per metre at the scene's
`pixelsPerMeter`; avoid hiding a scale mistake with an enormous density.

## 11. Light linking and a light-group preview

Restrict the sun to the box and preview its direct contribution (**box first**).

```json
[
  {"type":"setColorManagement","colorManagement":{"workingSpace":"acescct","outputTransform":"aces2.0","compositing":"wholeProgram"}},
  {"type":"setFxScene3DRenderSettings","compositionId":"main","layerId":1,"settings":{"id":97,"filmGate":null,"overscan":null,"lightGroups":[{"id":40,"name":"Key","exposure":0}],"lightCollections":[],"lightLinks":[{"lightId":4,"illuminatedObjects":{"type":"objects","items":[5]},"shadowCasters":{"type":"all"},"shadowReceivers":{"type":"all"}}],"outputs":[{"type":"directLightGroupRgb","id":41,"group":40}],"previewOutput":41}},
  {"type":"updateFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Light3D","id":4,"parentId":null,"name":"Grouped sun","transform":{"rotation":{"type":"euler","order":"XYZ","orientation":[0,0,0],"rotationX":-45,"rotationY":0,"rotationZ":0}},"emitter":{"type":"parallel","irradiance":3},"lightGroup":40}}
]
```

Check the box in the selected direct-light pass; add another object outside the selection
to check exclusion. All three link roles are explicit; illumination selection does not
implicitly select shadow casters or receivers.

A selected light-group preview requires a scene color domain: this uses ACES with
`wholeProgram` compositing, which changes color management for the whole
document, including 2D layers and grading; tell the user before switching it. Only `directLightGroupRgb` is selectable as a light-group
preview here; declaring `lightGroupRgb` or `indirectLightGroupRgb` does not make them
selectable. Set `previewOutput:null` to restore the ordinary beauty view.

## 12. IES point light

Shape a point light with an imported photometric distribution (**box first**).

```json
[
  {"type":"updateFxScene3DLayer","compositionId":"main","layerId":1,"item":{"type":"Light3D","id":4,"parentId":null,"name":"IES point","transform":{"position":[0,-200,-300],"relationships":{"constraints":[{"type":"aim","id":82,"target":{"id":83,"target":{"type":"world"},"offset":[0,0,0],"offsetSpace":"local"},"up":[0,1,0],"upSpace":"world","forwardAxis":"positiveZ","influence":1}]}},"emitter":{"type":"point","power":100,"sourceRadius":0,"iesProfile":"photometry"}}}
]
```

First run `tsrct project import-asset --project scene.tsrct --file lamp.ies --asset-id photometry --kind ies`.
Check the profile's directional falloff on a receiving surface, not just whether the light exists.
IES is supported on **point** emitters only; a spot/area emitter cannot own `iesProfile`.
The accepted import is LM-63-2002 Type C with `TILT=NONE`.

## 13. Scene3D shutter motion blur

Spin a thin blade during an explicit shutter interval.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":100,"name":"Geometry","geometry":{"type":"box","size":[260,20,30]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Mesh3D","id":5,"parentId":null,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[0,0,0]},"materialSlots":[{"id":150,"name":"Finish","binding":{"id":151,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":150},{"region":"side","slotId":150}]}]},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":5,"propertyName":"rotationZ"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"rotationZ-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"rotationZ-end","layerTime":2500,"value":{"type":"float","value":7200},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]},
  {"type":"setFxCompositionMotionBlur","compositionId":"main","settings":{"enabled":true,"shutterAngle":180,"shutterPhase":-90,"samplesPerFrame":8,"adaptiveSampleLimit":16}},
  {"type":"setFxLayerMotionBlur","compositionId":"main","layerId":1,"enabled":true}
]
```

The shutter lives at `composition.motionBlur`, not in the Scene3D render settings;
the ordinary Scene3D layer also needs `motionBlur:true`. `samplesPerFrame` controls
temporal integration, whereas CLI `--samples` controls path-tracer camera samples.

```sh
tsrct filmstrip --project scene.tsrct --timestamps-ms 500,1250,2000 --frame-rate 30 \
  --renderer path-tracer --samples 16 --output shutter.png
tsrct preview --project scene.tsrct --time 1.25 --renderer path-tracer --samples 16 --output shutter-frame.png
```

Check swept blade edges rather than a single sharp pose. Preview uses 30fps shutter
cadence. Filmstrip sample spacing is **not** a frame rate: without `--frame-rate 30`,
this path-traced filmstrip fails with “Scene3D shutter exposure requires valid explicit
output frame timing.” Use the intended delivery cadence, matching export `--fps`.

## 14. Animate an array count

Grow a row from one to five copies using a Group3D array.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":100,"name":"Geometry","geometry":{"type":"box","size":[60,60,60]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Group3D","id":10,"parentId":null,"name":"Copies","transform":{},"array":{"type":"linear","id":11,"count":1,"offset":[90,0,0]}},{"type":"Mesh3D","id":5,"parentId":10,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[-200,0,0]},"materialSlots":[{"id":150,"name":"Finish","binding":{"id":151,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":150},{"region":"side","slotId":150}]}]},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":11,"propertyName":"count"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"count-start","layerTime":0,"value":{"type":"float","value":1},"easing":{"type":"linear"}},{"id":"count-end","layerTime":2500,"value":{"type":"float","value":5},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

Check one, three and five boxes across the filmstrip; count is stepped to an integer.
The array belongs to the group and the source mesh is its child, with the parent
listed first; animate the array's ID 11, not the group's ID 10.

## 15. Bevel then subdivide

Round a box by evaluating an ordered modifier stack.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":100,"name":"Geometry","geometry":{"type":"box","size":[180,180,180]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Mesh3D","id":5,"parentId":null,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[0,0,0]},"materialSlots":[{"id":150,"name":"Finish","binding":{"id":151,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":150},{"region":"side","slotId":150}],"modifiers":[{"type":"bevel","id":30,"width":15,"segments":3,"profile":0.5,"limitAngle":30},{"type":"smoothSubdivide","id":31,"levels":2,"creaseAngle":180}]}]}
]
```

Check rounded corners and narrow edge highlights; reversing modifier order is not equivalent.
The modifier records live on Mesh3D, not on its shared geometry Data.

## 16. Shrinkwrap a decal

Subdivide an orange patch and project it onto a sphere.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":100,"name":"Geometry","geometry":{"type":"sphere","radius":120},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]},{"type":"mesh","id":101,"name":"Geometry","geometry":{"type":"plane","size":[140,140]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Mesh3D","id":5,"parentId":null,"name":"Target sphere","dataId":100,"packing":"whole","transform":{"position":[0,0,0]},"materialSlots":[{"id":150,"name":"Finish","binding":{"id":151,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":150},{"region":"side","slotId":150}]},{"type":"Mesh3D","id":6,"parentId":null,"name":"Decal","dataId":101,"packing":"whole","transform":{"position":[0,0,-130]},"materialSlots":[{"id":160,"name":"Finish","binding":{"id":161,"inputs":{"baseColor":{"type":"constant","value":[1,0.25,0.04]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":160},{"region":"side","slotId":160}],"modifiers":[{"type":"subdivide","id":30,"levels":4},{"type":"shrinkwrap","id":31,"target":5,"wrapMethod":"nearestSurfacePoint","wrapMode":"aboveSurface","offset":1.3,"positiveDirection":true,"cullFace":"off"}]}]}
]
```

Check the orange patch curving around the blue sphere without z-fighting.
List target 5 before decal 6, subdivide before shrinkwrap, and use a small positive
surface offset; a coarse un-subdivided patch cannot follow the curvature.

## 17. Curve3D, FollowPath and aim

Move a box along a shared curve while aiming it at a fixed point.

```json
[
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"curve","id":200,"name":"Route","curve":{"vertices":[[-180,-80,-100],[180,80,-100]],"inTangents":[[0,0,0],[0,0,0]],"outTangents":[[0,0,0],[0,0,0]],"closed":false}},{"type":"mesh","id":100,"name":"Geometry","geometry":{"type":"box","size":[70,50,110]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Curve3D","id":20,"parentId":null,"name":"Route","dataId":200,"transform":{}},{"type":"Mesh3D","id":5,"parentId":null,"name":"Box","dataId":100,"packing":"whole","transform":{"position":[0,0,0],"relationships":{"constraints":[{"type":"followPath","id":30,"curve":{"id":31,"target":{"type":"item","item":20},"offset":[0,0,0],"offsetSpace":"local"},"metric":"localArcLength","positionMode":"replace","boundary":"clamp","forwardAxis":"positiveZ","frame":{"type":"worldUp"},"up":[0,1,0],"influence":1,"orient":false,"progress":0},{"type":"aim","id":32,"target":{"id":33,"target":{"type":"world"},"offset":[0,0,200],"offsetSpace":"local"},"up":[0,1,0],"upSpace":"world","forwardAxis":"positiveZ","influence":1}]}},"materialSlots":[{"id":150,"name":"Finish","binding":{"id":151,"inputs":{"baseColor":{"type":"constant","value":[0.2,0.5,0.8]},"roughness":{"type":"constant","value":0.4}}}}],"regionSlots":[{"region":"primary","slotId":150},{"region":"side","slotId":150}]}]},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":30,"propertyName":"progress"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"progress-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"progress-end","layerTime":2500,"value":{"type":"float","value":1},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

Check travel from upper-left to lower-right with a changing aim toward `[0,0,200]`.
Curve3D itself is nonrendering; its `dataId` owns the spline. FollowPath runs before
aim in this stack, and progress animation addresses constraint ID 30.

## 18. Glow on the rendered Scene3D layer

Add a screen-space glow to the Scene3D result (**box first**).

```json
[
  {"type":"addFxLayerEffect","compositionId":"main","layerId":1,"effectId":50,"effect":{"type":"glow","glowThreshold":35,"glowRadius":30,"glowIntensity":1.5}}
]
```

Check a halo around bright box edges; lower the threshold if the source is too dim.
The effect belongs to ordinary composition layer 1, not to a Mesh3D child;
this is post-processing, not a light that illuminates other 3D objects.

## 19. Exposure

Set a static view exposure and animate the camera exposure (**box first**).

```json
[
  {"type":"setFxPropertyValue","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":9,"propertyName":"exposure"},"value":{"type":"float","value":0.5}},
  {"type":"setFxAnimator","compositionId":"main","target":{"type":"styleProperty","layerId":1,"itemId":3,"propertyName":"exposure"},"animator":{"type":"keyframes","enabled":true,"keyframes":[{"id":"exposure-start","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},{"id":"exposure-end","layerTime":2500,"value":{"type":"float","value":1},"easing":{"type":"linear"}}]},"dependencies":[],"layerRefBindings":[]}
]
```

Check increasing brightness while the box stays in place; camera and view exposure add in stops.
The view (ID 9 here) is the scene's own exposure; the camera's travels with that camera.

## 20. Clear product glass with a refraction target

Make a clear solid glass sphere against a checker backdrop, with a ground to anchor it.
Start after `base.json` on the 640×480 canvas described above; save as `glass.json`.

```json
[
  {"type":"setFxScene3DWorld","compositionId":"main","layerId":1,"world":{"id":2,"background":{"type":"color","color":[0.08,0.08,0.08,1]},"light":{"source":{"type":"color","color":[1,1,1,1]},"intensity":0.35,"integration":"sampled"}}},
  {"type":"addFxScene3DFragment","compositionId":"main","layerId":1,"data":[{"type":"mesh","id":105,"name":"Glass geometry","geometry":{"type":"sphere","radius":120},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]},{"type":"mesh","id":106,"name":"Backdrop geometry","geometry":{"type":"plane","size":[1000,700]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]},{"type":"mesh","id":107,"name":"Ground geometry","geometry":{"type":"box","size":[1000,20,900]},"regions":[{"key":"primary","name":"Primary"},{"key":"side","name":"Side"}]}],"items":[{"type":"Mesh3D","id":5,"parentId":null,"name":"Glass","dataId":105,"packing":"whole","transform":{"position":[0,0,0]},"materialSlots":[{"id":160,"name":"Clear glass","binding":{"id":161,"transmissionMedium":{"type":"volume"},"volumeMode":"solid","inputs":{"baseColor":{"type":"constant","value":[1,1,1]},"metallic":{"type":"constant","value":0},"roughness":{"type":"constant","value":0.02},"transmission":{"type":"constant","value":1},"ior":{"type":"constant","value":1.5},"thickness":{"type":"constant","value":0},"attenuationColor":{"type":"constant","value":[1,1,1]},"attenuationDistance":{"type":"constant","value":1}}}}],"regionSlots":[{"region":"primary","slotId":160},{"region":"side","slotId":160}]},{"type":"Mesh3D","id":6,"parentId":null,"name":"Checker backdrop","dataId":106,"packing":"whole","transform":{"position":[0,0,240]},"materialSlots":[{"id":162,"name":"Checker","binding":{"id":163,"unlit":true,"doubleSided":true,"inputs":{"baseColor":{"type":"texture","factor":[1,1,1],"sample":{"texture":{"source":{"type":"procedural","texture":{"size":[512,512],"generator":{"type":"checker","cellSize":[0.125,0.125],"offset":[0,0]}}}},"interpretation":{"type":"color"},"selection":{"type":"rgb"}}},"roughness":{"type":"constant","value":1}}}}],"regionSlots":[{"region":"primary","slotId":162},{"region":"side","slotId":162}]},{"type":"Mesh3D","id":7,"parentId":null,"name":"Ground","dataId":107,"packing":"whole","transform":{"position":[0,130,0]},"materialSlots":[{"id":164,"name":"Ground","binding":{"id":165,"inputs":{"baseColor":{"type":"constant","value":[0.3,0.3,0.3]},"roughness":{"type":"constant","value":0.3}}}}],"regionSlots":[{"region":"primary","slotId":164},{"region":"side","slotId":164}]}]},
  {"type":"makeFxScene3DMeshEditable","compositionId":"main","layerId":1,"itemId":5,"newDataId":200}
]
```

```sh
tsrct project apply --project scene.tsrct --actions glass.json &&
  tsrct preview --project scene.tsrct --time 1 --output glass.png --renderer path-tracer --samples 16
```

Check a crisp, strongly warped checker inside the sphere, reflective rim and ground
contact. This is a solid glass test object, not a hollow bottle or a glass of water.
The checker is inside Scene3D so rays can refract it; its unlit, double-sided finish
keeps the contrast readable. Keep the base sun: it supplies sharp highlights, while
the sampled white world fills reflections and the ground.

- `transmission:1` removes the diffuse share; `metallic:0` keeps dielectric transmission.
  White `baseColor` and `attenuationColor` keep the glass neutral rather than gray or tinted.
- `roughness:0.02` keeps transmitted detail sharp; `ior:1.5` gives visible bending
  and reflective edges. Leave alpha coverage opaque: transmission is not opacity.
- Make Editable supplies a closed polygon boundary for `volumeMode:"solid"`;
  its actual entry/exit geometry determines the optical path. `thickness:0` here
  is not a zero-thickness wall. At `pixelsPerMeter:100`, the radius is 1.2 metres.
  `attenuationDistance:1` is metres; white attenuation adds no absorption.
- Sheet/slab transport is a different model: `thickness` is camera-path thickness,
  while `transmissionThickness` is Sheet-only light-path thickness, both in metres.
  Omit `transmissionThickness` on this Volume material; a nonzero value rejects.
  The tested primitive/slab alternatives did not produce the solid's strong checker bending.

Avoid these observed failure modes:

- `roughness:0.4` blurred away the checker and looked frosted gray; `transmission:0.5`
  left a bright milky diffuse body even with low roughness.
- Gray `baseColor:[0.2,0.2,0.2]` darkened the transmitted pattern; neutral glass did
  not need a gray tint. Colored attenuation also visibly tinted the solid.
- `ior:1` nearly erased the rim and transmitted the pattern almost unchanged;
  a plain dark backdrop likewise gave much weaker evidence of refraction than the checker.

## 21. Stop on rejected edits

Do not render an old document after a rejected batch: `project apply` exits non-zero.

```sh
#!/bin/sh
set -eu
tsrct project apply --project scene.tsrct --actions recipe.json
tsrct preview --project scene.tsrct --time 1 --output check.png
```

Check the apply report before trusting the image; with `set -e` (or `&&`), a failed
apply prevents the preview from running. Inspect stored values with `project inspect`;
it shows the saved document, not evaluated poses, so judge results from renders.
