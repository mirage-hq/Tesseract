# Motion

Use editable keyframes for specified poses, entrances, holds, and exits. Use
scripts for periodic motion or relationships that would otherwise require many
keys. Keep the structure editable: move a group for coordinated motion and its
children for independent details.

## Clocks and keyframes

`layerTime` is integer milliseconds from the owning layer's local start, not
project time. Ancestor group playback affects that clock. Keys outside the
visible interval may remain authored; the active window controls visibility.

This fades in group 3 from the FX authoring examples, holds it, then fades out:

```json
[
  {"type":"setFxPropertyKeyframes","compositionId":"main",
   "property":{"layerId":3,"propertyType":"opacity"},
   "keyframes":[
     {"id":"callout-opacity-in","layerTime":0,"value":{"type":"float","value":0},"easing":{"type":"linear"}},
     {"id":"callout-opacity-visible","layerTime":300,"value":{"type":"float","value":100},"easing":{"type":"cubicBezier","x1":0.2,"y1":0,"x2":0.2,"y2":1}},
     {"id":"callout-opacity-hold","layerTime":2500,"value":{"type":"float","value":100},"easing":{"type":"linear"}},
     {"id":"callout-opacity-out","layerTime":2900,"value":{"type":"float","value":0},"easing":{"type":"linear"}}
   ]}
]
```

Easing belongs to the destination key. Before/after the track the first/last
value is held. Keep key times distinct and IDs stable and composition-unique.
`setFxPropertyKeyframes` upserts by ID: omitted keys remain. Use
`removeFxPropertyKeyframes` to remove specific existing keys. Inspect the track
before revising it; do not accidentally append another animation over old keys.
Use `setFxPositionKeyframes` for paired spatial position paths with tangents.
Let the action API maintain the stored animation representation.

## Procedural motion

Check the installed schema before constructing a `setFxPropertyAnimator` action.
A `jsScript` body uses `layerTimeJsCode`, explicitly returns the target's value,
and reads `input.time.seconds` or `input.time.milliseconds`. For a scalar rotation
in degrees, a bounded oscillation body is:

```js
return Math.sin(input.time.seconds * Math.PI * 2) * 3;
```

Animation must evaluate correctly at arbitrary timestamps: do not accumulate
state frame by frame or use wall-clock time. Declare property dependencies when
following another property; dependency values are canonically ordered, not
necessarily in authored array order. Preserve existing relationships when editing.

## Design and review

Choose motion to support the requested emphasis. Keep text still long enough to
read; avoid moving every part independently. Establish the final layout first,
then add motion. Use easing for a deliberate arrival and linear interpolation
for constant-rate movement. Check overshoot against the available space.

Sample the entrance, settled hold, and exit, including just before and after a
transition. For the example, use `--timestamps-ms 0,150,300,1400,2500,2700,2900`.
These are project timestamps: offset them when the layer or its group starts
later. The exact end of a half-open active window is already invisible.

Review both the whole project and `--fx-solo main:3`. A content-bounds crop
helps inspect details but cannot prove correct canvas placement. Filmstrips
show sampled poses; inspect playback of the exported video for pacing, flicker,
and audio that sparse stills can miss.
