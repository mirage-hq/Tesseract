# Motion design: full scenes and overlays

## Design the motion before the syntax

State one visual idea in concrete terms: a number grows into a comparison; a line reveals the flow through a process; a label follows the subject's direction; typography is revealed by the product's silhouette. If the only idea is “things fade in,” reconsider the design.

Decide the focal element, its relationship to the footage, and how the composition changes over time. A full scene should have composition, progression, and a payoff, not just a centered heading above three rounded boxes.

For motion that opens a paid-social or YouTube ad, read [ad hooks](ad-hooks.md) for concept selection, placement context, music/SFX synchronization, and the early opening review.

## Overlays

- Start with the footage's actual safe area. Account for the face, hands, product, subtitles, and platform cropping. Check placement across the whole interval, not one still.
- Prefer a small label or shape that points to meaningful evidence. A large opaque panel is appropriate only if the brief calls for that treatment.
- Animate in, hold long enough to read, animate out. Entrance and exit should relate to the cut or the subject's movement.
- Use contrast from placement first, then a subtle scrim/stroke/shadow as needed. Do not blanket every shot in a heavy gradient.
- For graphics behind a person, use a person matte when its required local model/resource is available, and confirm its polarity. Verify support on an actual frame first; the skill does not install segmentation models. A person-white matte with **lumaInverted** reveals graphics outside the person; **luma** reveals them inside the person. Some engine recipe prose describes the latter without stating the intended visual relationship—pick and test the polarity for the actual design.
- For a tracked pointer, do not describe it as tracked unless there are actual time-varying positions aligned to observed footage. Static arrows are fine when appropriate.

## Full-frame scenes

Build a hierarchy: focal content, supporting context, environment. Use spatial and temporal relationships to explain meaning. Possibilities include a native vector schematic, dimensional arrangements of 2D layers, split-screen comparisons, mask-driven type reveals, data with accurate values, or footage integrated into a composited scene.

Reserve motion for changes that guide attention. Give the viewer a stable interval to understand the result. Avoid defaulting every scene to parallax, glow, particles, bouncing labels, and a camera push at once.

## Native mechanism map

| Design need | Tesseract mechanism | Look up |
|---|---|---|
| Type hierarchy / editable text | `Text.sourceText` and imported font files | [FX authoring](fx-authoring.md#text-with-an-available-font) and the document schema |
| Per-character reveals | Text Animator and selectors; drive fields with dynamics | [FX authoring](fx-authoring.md#text-with-an-available-font) and [motion](motion.md) |
| Coordinated movement | `Group` with child layers and stable parent IDs | [FX authoring](fx-authoring.md) |
| Drawn paths / linework | `Shape` paths, fills, strokes; animate supported path fields | the document schema's Shape definitions |
| A moving reveal | Track matte or path mask using a real layer reference | the document schema's mask and track-matte definitions |
| Treatment across several layers | Group effects or an Adjustment layer above the affected siblings | the document schema's effect definitions |
| Soft lighting, blur, grade | Ordered typed layer effects | the document schema's effect definitions |
| 3D-looking layer arrangement | Supported 3D transform properties and depth ordering | the document schema and [motion](motion.md) |
| Custom pixel treatment | Bounded premultiplied-alpha WGSL custom shader | [custom shader contract](custom-shader.md) |

This is not a Blender runtime. Distinguish transforming 2D layers in 3D from general meshes, physics, or a full 3D scene.

## Timing and motion character

Tesseract FX uses editable keyframe actions and `AnimationGraph` expressions, not CSS or AE keyframe-array JSON. Read [motion](motion.md) for the installed action workflow. Use `layerTimeJsCode` and the owning layer's clock. An expression returns its value; it is not a general browser script.

For a simple reveal, 200–450ms is a useful starting range, adjusted to the scale of movement and edit. Give secondary details a small deliberate offset. Choose easing based on mass and purpose; a restrained ease-out usually reads more deliberately than an automatic spring. Overshoot can fit playful material but should be intentional.

Use standard motion blur only where it improves fast transforms; enable both composition and layer switches. Long tails of blur can erase text or mask a timing error. Render the actual movement before committing to the treatment.

## Brand application

Use supplied fonts, palette, logo geometry, and references. Keep exact logo art separate from generated scenery. This plugin's Mirage icon is not a default asset for client work. With no supplied style, choose a restrained, legible direction appropriate to the footage and describe it briefly.

## Reusable examples

[FX authoring](fx-authoring.md) contains editable examples for footage, a card, grouped labels, and captions. [Motion](motion.md) shows keyframes and procedural animation. Adapt the composition and motion to the brief rather than copying the entire example look.
