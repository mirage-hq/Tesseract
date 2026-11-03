# Scene3D for Blender users

Use this map when the user describes the work in Blender terms. It names the
closest Tesseract control, or says plainly that there is none. Exact fields
come from `tsrct project schema`; [Scene3D basics](scene3d-basics.md) explains
the rules every batch must follow and [recipes](scene3d-recipes.md) has
copy-ready batches. When a Blender feature has no equivalent, tell the user
which approximation you used, or ask, rather than silently substituting.

## Scene, units and axes

| Blender | Tesseract |
| --- | --- |
| Unit scale, 1 unit = 1 m | Positions and sizes are pixels; `pixelsPerMeter` on the Scene3D layer converts. With 100, a 1.8 m figure is 180 px. Imported models, lens apertures, fog and material lengths use metres through it. |
| Z up, −Y forward | X right, Y down, Z into the screen. Imported `.blend`/`.glb` models already stand upright. |
| Scene camera | `setFxScene3DActiveCamera`; with none, the layer frames the canvas and ignores cameras. |
| Objects / Empties / parenting | Flat `scene.items` with `parentId`; an Empty is a `Group3D`. |
| Collections, View Layers | No equivalent. Use `Group3D` for hierarchy and `renderSettings.lightCollections` for light-linking selections. |
| Object data, linked duplicates | Objects reference shared Data by `dataId`; several objects may share one Data. |
| Frame rate, frame range | Document duration in seconds; layer windows and keyframes in milliseconds; export `--fps`. |
| Drivers, Python expressions | No equivalent; keyframe the controls instead. |

## Modeling

| Blender | Tesseract |
| --- | --- |
| Cube, UV sphere, cylinder, cone, torus, plane | Mesh Data `geometry` `box`, `sphere`, `cylinder`, `cone`, `torus`, `plane`. Segment counts and an icosphere are not primitive options; author an `editable` mesh for faceted shapes. |
| Edit-mode mesh | `editable` geometry (vertices, faces with a region per face); `editFxScene3DMesh` edits it; `makeFxScene3DMeshEditable` converts a primitive or curve-built mesh. |
| Sculpt Mode (Grab, Smooth, Inflate, Draw) | An `editFxScene3DMesh` `sculpt` operation on an editable mesh: an ordered list of brush dabs with explicit centers, plus symmetry and a vertex mask. No other brushes and no dynamic topology; subdivide first for detail. Dry-run dabs with `tsrct mesh3d preview`. |
| Shade Smooth / Flat | Mesh `normalMode`. |
| Curve with bevel, Screw, Loft | Mesh geometry `sweep` (along a `Curve3D` Data), `lathe`, `loft`, `extrude`. A `Curve3D` object itself does not render. |
| Text object (extrude, bevel) | `Text3D` with front, back and side regions; per-character animators and selectors. |
| Array modifier | `Group3D.array` `linear`, `grid`, `radial`, `curve`, `scatter`; offsets are pixels (no relative offset); count and seed animate. `realizeFxScene3DArray` makes copies editable. |
| Bevel, Solidify, Mirror, Boolean, Decimate, Remesh, Displace, Simple Deform (Bend/Twist), Lattice, Shrinkwrap, UV Project, Data Transfer, Vertex Weight Edit/Mix/Proximity | Mesh `modifiers` `bevel`, `solidify`, `mirror`, `boolean`, `decimate`, `remesh`, `displace`, `bend`, `twist`, `lattice`, `shrinkwrap`, `uvProject`, `dataTransfer`, `vertexWeightEdit`, `vertexWeightMix`, `vertexWeightProximity`, in stack order. |
| Subdivision Surface | `smoothSubdivide` is Loop subdivision, not Catmull–Clark; `subdivide` splits without smoothing. Quads come out slightly different from Blender. |
| Geometry Nodes scatter (Distribute Points / Instance on Points) | `Group3D.array` `scatter` on a mesh, text or model target with a seed. Other node trees have no equivalent. |
| Shape keys | Editable-mesh shape keys, or a model's morph controls (listed in `poseStack`). |
| Cloth | `cloth` modifier on an editable Mesh3D, baked with the `prepareScene3dCloth` apply request. A `.blend` cloth modifier is not imported. |

## Materials and lighting

| Blender | Tesseract |
| --- | --- |
| Principled BSDF | One material per slot with inputs `baseColor`, `metallic`, `roughness`, `transmission`, `ior`, `subsurface`…, `clearcoat`…, `sheen`…, `emissiveColor`; colors are scene-linear (convert hex values). The material section of [Scene3D properties](scene3d-properties.md) lists them all. |
| Image Texture + Mapping node | `setFxScene3DMaterialTexture` (image, procedural, layer or UDIM source) with a UV transform; `editFxScene3DMaterialGraph` for connections. Arbitrary shader node trees have no equivalent. |
| World color / HDRI | `world.background` and `world.light` (an `.hdr` image with `rotation`, or a color). |
| Film > Transparent | Leave `world.background` unset; preview PNGs keep alpha; export ProRes 4444 with `--fx-solo <composition>:<layer>` for a transparent video. |
| Point / Spot / Area light, Power in W | `Light3D` `emitter` `point`, `spot`, `area` with `power` in watts. IES profiles attach to `point` emitters only. |
| Sun, Strength in W/m² | `parallel` emitter with `irradiance` in W/m². |
| Light linking, shadow linking | `setFxScene3DLightLinks` (illuminated objects, shadow casters and receivers). |
| Exposure (Color Management) | The layer `view.exposure` plus the active camera's `exposure`, in stops. |
| Volume Scatter, Mist | `Volume3D` objects (with world lighting set to `integration: "sampled"`) and world fog distances in metres. |
| Eevee Reflection Cubemap, Irradiance Volume | `ReflectionProbe3D`, `IrradianceVolume3D` (raster only; the path tracer computes these effects). |
| Bloom / Glare | A Glow effect on the Scene3D layer in the composition. |

## Cameras and rendering

| Blender | Tesseract |
| --- | --- |
| Focal length, sensor, f-stop, Depth of Field, focus object | Camera `lens` `physical` (`focalLengthMm`, `sensorMm`, `fNumber`), `focusDistance` or a focus target. `angle` lenses cover perspective, orthographic, fisheye and equirectangular projections. |
| Shift X/Y | `lensShift`. |
| Tilt-shift look | `setFxScene3DTiltShift` (a real tilted focus plane). |
| Track To / Damped Track | `setFxScene3DAim`. |
| Child Of, Copy Location/Rotation | An `attachment` constraint in the object's `relationships` (`setFxScene3DAttachmentBinding` rebinds an existing one), `setFxScene3DFollowTarget`, space switches (`prepareScene3dSpaceSwitch` apply request). |
| Follow Path | `setFxScene3DFollowPath` with a `Curve3D` and animated `progress`. |
| Cycles | `--renderer path-tracer`, `--samples`, bounce flags, `--no-denoise`; a command flag, not saved in the document. |
| Eevee | The default `raster` renderer; browser and iOS playback always use it. |
| Motion blur, shutter | The composition's `motionBlur` (`enabled`, `shutterAngle`, `shutterPhase`, `samplesPerFrame` 2–64) and the Scene3D layer's `motionBlur` switch, edited through checkout and commit. A 180° Blender shutter (0.5 frames) is `shutterAngle` 180. Pass the export frame rate (`filmstrip --frame-rate`) when sampling blurred frames. |
| Render passes, AOVs, Cryptomatte, multilayer EXR | Besides the beauty image, only a light group's direct light (`directLightGroupRgb`) can be selected for preview and export, one product per render, and it needs the ACES scene color domain. Depth, normal and Cryptomatte passes and EXR output are not available. |

## Characters and animation

| Blender | Tesseract |
| --- | --- |
| Armature, skinning, Actions | Import a `.blend` or `.glb` (`import-asset --kind model3d`); bind clips on the Model3D and list them in `poseStack`. Skins keep four influences per vertex. |
| NLA strips, action blending | Model `blend` clip with `blendWeight`, or ordered animation layers and masks (`addFxScene3DAnimationLayer`, `addFxScene3DAnimationMask`). |
| Pose-mode bone keys | Model `nodes` overrides listed as `localTransform` entries in `poseStack`. |
| IK, bone Track To | Model `constraints` `twoBoneIk`, `lookAt`, `transform`. |
| Root motion | Clip `rootMotion` (`source`, `inPlace`, `accumulate`). |
| Bake Action | `prepareScene3dModelBake` apply request. |
| Graph Editor curves | Keyframe `easing` per key; see `project schema` for the easing kinds. |

## What a `.blend` import keeps

Meshes, armatures and skins, shape keys, Actions (sampled), metallic-roughness
materials with their textures, and node transforms are converted. Unapplied
modifiers, transmission and coat, area lights, light and shader node trees,
drivers and constraints are not; `conversion.diagnostics` lists each loss.
Cameras and lights appear only as model nodes. See
[imported models](scene3d-basics.md#imported-models) for the follow-up work.
