# Custom shader effects

Author a new `customShader` when no supported native layer effect expresses the
requested visual operation. It is the general effect primitive underlying many
engine-provided effects.

## Model

```text
CustomShader
├── name             stable upsert label
├── description      agent/human-facing intent
├── wgsl             fragment shader module
├── params[]         scalar uniform inputs
└── textureInputs[]  additional textures bound from layers
```

The owning layer's rendered output is the implicit primary texture.

## Minimal shape

```json
{
  "id": 40,
  "effect": {
    "type": "customShader",
    "name": "exampleTint",
    "description": "Multiplies the layer RGB by an animatable amount.",
    "wgsl": "...complete WGSL module...",
    "params": [
      {
        "name": "amount",
        "description": "Tint multiplier; 0 is unchanged.",
        "min": 0,
        "max": 1,
        "default": 0.5
      }
    ]
  }
}
```

`name` is the upsert key, not the animation address. Animate a parameter using
the enclosing effect instance's stable `id` and the parameter `name`.

## Scalar uniform inputs

Each `params[]` entry declares one scalar `f32` input:

```text
name         shader-local field and animator parameter name
description  explain units and visual meaning
min/max      authoring/interpolation range
default      value used when no animator drives the parameter
```

Parameters are packed into the WGSL `Params` uniform in declaration order.
Keep the JSON order and WGSL struct field order identical. The runtime pads the
uniform payload to the required alignment.

Animate an ordinary effect parameter through the installed action schema's
`setFxPropertyAnimator` effect-property target, using the owning layer ID,
effect ID, and parameter name. Use `layerTimeJsCode` for a script; do not copy an
internal `PropertyTarget` or `animator.code` object into an action. Read
[motion](motion.md) and `tsrct project schema` for the exact wire shape.
A shader that only needs a clock can declare the reserved `animationTime`
parameter instead, subject to support in the installed renderer.

## Parameter naming drives editor controls

Editors classify parameters by **name** and pick an After Effects-style
control. Prefer the explicit control suffix — a `.suffix` on the parameter
name declares the control outright, with no heuristics involved:

```text
<base>.colorR/.colorG/.colorB  color picker — declare each channel 0..1
                               (read as normalized RGB); optional
                               <base>.colorA adds alpha
<base>.x + <base>.y [+ .z]     2- or 3-value row of paired inputs
<base>.angle / .direction /    angle dial in degrees — all six render the
  .rotation / .hue / .phase /  same control; the word records the
  .evolution                   parameter's meaning
<base>.toggle                  on/off switch writing 0 / 1
<base>.slider                  slider paired with a numeric input
<base>.number                  numeric input alone
anything else                  slider + numeric input when the declared
                               range is sweepable, else numeric input alone
```

The suffix never reaches the user: labels strip it (`wet.toggle` reads as
"Wet"; `tint.colorR` as "Tint R" inside the color group; `spin.rotation`
as "Spin"). Choosing among the angle words documents intent for the next
reader of the document — it does not change the control today. WGSL is unaffected —
struct field names are yours and packing is positional; only the JSON `name`
carries the suffix. Grouped suffixes need their sibling set complete
(`.colorR/.colorG/.colorB`; `.x` + `.y`); an incomplete group falls back to
numeric inputs.

The declared range drives the angle dial's write semantics. Declare exactly
`0`/`360` for a modular direction (the shader consumes it through
`sin`/`cos`, so a full turn returns to the same result): the dial and its
numeric input wrap — typing 450 lands on 90. Any other declared range —
including deliberately narrow ones like -45..45 — means the parameter is
consumed linearly (a signed twirl-style amount where -120 and 240 render
differently): both inputs honor the declared `min`/`max` and clamp, so
negative, extended, and narrow values stay exactly as authored. Omitting
`min`/`max` on an angle-suffixed parameter leaves the engine defaults of
exactly 0/1, which editors read as "no range declared" and treat as the
full-turn wrapping encoding — but declare `0`/`360` explicitly so the
intent survives review. Editors only infer a dial for un-suffixed names when
`max` ≤ 360 — multi-turn spans like a 0..720 shutter duration stay numeric
inputs.

Color channels are edited through an 8-bit hex swatch, so a swatch edit
quantizes each channel to 1/255 steps; the per-channel numeric rows keep
full float precision.

The declared range is what earns a plain scalar its slider: bounds must be
finite, `min` below `max`, and both within ±1000. The editor owns that
threshold — `SLIDER_BOUND_LIMIT` in its param classifier — because
`EffectParam` carries no control hint for the engine to be authoritative with;
this document tracks the editor, not the reverse. Past that the bound reads as a
safety cap on a coordinate or technical space (a ±5000-pixel offset, a 0..100000
iteration count) rather than an endpoint anyone sweeps toward, so those get the
numeric input alone. The pair exists because each control reaches what the other
cannot: the slider sweeps the whole range in one control width, the input hits
the exact values the slider's pixel resolution skips.

`.slider` and `.number` force that decision either way — a slider on a range
wider than the guard allows, or a plain input for a parameter meant to be typed
exactly. Unlike the other suffixes they name a widget rather than a meaning,
because a fraction, a level in pixels, and a sample count all want the same
control. Use them only to override; a well-declared range needs neither.

## Reserved parameter names

One parameter name is reserved by the engine: `animationTime`. A parameter
declared with that exact name is not authored, animated, or edited — the engine
overwrites its uniform slot every frame with the owning layer's animation clock
as an `f32` in seconds. It is the same value a `jsScript` effect-parameter
animator on that layer reads as `input.time.seconds`: the local
composition/group clock, rebased to the nearest enclosing Group's in-point and
clamped to that group's duration, with a Group's own effects using the group's
own clock. With no enclosing Group it is the composition playhead. Declare it and
the shader animates with no animator anywhere in the document.

The reservation is total:

- No editor control appears for it. It is filtered out of the effect's parameter
  schema, so agents do not see it either.
- Writes are rejected: effect-parameter update actions refuse the name, and an
  `effectProperty` animator cannot bind to it.
- `min`, `max`, and `default` are documentation only. The engine overwrites the
  packed slot every frame whatever they say — declare a truthful range anyway so
  the intended time domain survives review.
- The parameter must stay declared in `params[]`. Uniform packing is positional,
  so dropping it or reordering around it shifts every later parameter's slot.

```json
{
  "type": "customShader",
  "name": "examplePulse",
  "description": "Pulses the layer brightness on the layer's own clock.",
  "wgsl": "...complete WGSL module...",
  "params": [
    {
      "name": "animationTime",
      "description": "Engine-driven layer animation clock, in seconds.",
      "min": 0,
      "max": 3600,
      "default": 0
    },
    {
      "name": "rate",
      "description": "Pulses per second.",
      "min": 0.1,
      "max": 10,
      "default": 2
    }
  ]
}
```

In WGSL the slot is an ordinary `f32` uniform in the positional `Params` struct —
nothing about reading it differs from any other parameter:

```wgsl
struct Params {
  animationTime: f32,
  rate: f32,
  _pad0: f32,
  _pad1: f32,
};
```

### Shaping time in WGSL

Shape time inside the shader, from `animationTime` plus scalar knob params —
not with an animator. Each pattern is one expression; expose the knob as a
normal parameter so it gets a control:

| Want | WGSL (`let t = params.animationTime;`) | Knob param |
|---|---|---|
| Speed / rate | `t * params.rate` | `rate` (cycles/sec) |
| Offset / delay | `max(t - params.delay, 0.0)` | `delay` (sec) |
| Loop | `fract(t / params.period)` | `period` (sec) |
| Ping-pong | `abs(fract(t / params.period) * 2.0 - 1.0)` | `period` (sec) |
| Hold / stop-motion | `floor(t / params.holdTime)` | `holdTime` (sec/step) |

Use a `jsScript` animator on a normal parameter only for what a pure function
of the clock cannot express: values keyframed by hand, or values driven by
another declared property dependency; there is no automatic audio-analysis input.

## Complete single-texture WGSL template

The owning layer is the only texture when `textureInputs` is empty. This module
is complete and uses the required vertex/fragment entry points, binding layout,
uniform padding, and premultiplied-alpha output contract:

```wgsl
struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) tex_coords: vec2<f32>,
  @location(2) color: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) tex_coords: vec2<f32>,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  out.clip_position = vec4<f32>(input.position, 0.0, 1.0);
  out.tex_coords = input.tex_coords;
  return out;
}

struct Params {
  amount: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var t_texture: texture_2d<f32>;
@group(0) @binding(1) var s_sampler: sampler;
@group(0) @binding(2) var<uniform> params: Params;

fn author_frag(uv: vec2<f32>) -> vec4<f32> {
  let content = textureSample(t_texture, s_sampler, uv);
  let grayscale = vec3<f32>(dot(content.rgb, vec3<f32>(0.299, 0.587, 0.114)));
  return vec4<f32>(mix(content.rgb, grayscale, params.amount), content.a);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let raw = author_frag(input.tex_coords);
  // The renderer uses premultiplied-alpha blending. Transparent pixels must
  // carry zero RGB, and every RGB channel must stay at or below alpha.
  return vec4<f32>(
    clamp(raw.rgb, vec3<f32>(0.0), vec3<f32>(raw.a)),
    raw.a,
  );
}
```

Each scalar parameter adds one `f32` field in `params[]` order. Pad the WGSL
`Params` field count to a multiple of four `f32` values (`_pad0`, `_pad1`, …).

## Additional texture inputs

`textureInputs[]` declares named texture slots supplied by other layers:

```json
"textureInputs": [
  {
    "name": "map",
    "description": "Grayscale displacement map.",
    "sourceLayerId": 12
  }
]
```

- `sourceLayerId` references a layer in the same composition.
- Slots resolve in declared order.
- Every required slot must be bound for the shader to run.
- At most eight additional texture inputs are supported.
- A successfully bound source layer is consumed as shader input and is not
  separately painted in the normal layer stack.
- Unknown references, cycles, unbound slots, or excess inputs make the shader
  fall back to a no-op/pass-through behavior.

### Multi-texture binding layout

For `N` additional inputs, `K = N + 1` total textures:

```text
binding 0       owning layer content texture
binding 1..N    textureInputs[] in declaration order
binding K       shared sampler
binding K + 1   Params uniform
```

For example, one additional displacement map uses content at binding 0, the map
at binding 1, the sampler at binding 2, and `Params` at binding 3:

```wgsl
@group(0) @binding(0) var t_content: texture_2d<f32>;
@group(0) @binding(1) var t_map: texture_2d<f32>;
@group(0) @binding(2) var s_sampler: sampler;
@group(0) @binding(3) var<uniform> params: Params;
```

The `textureInputs[]` names describe logical slots; WGSL variable names are
chosen by the shader author. Declaration order, not the logical name, determines
the binding number.

## Authoring checklist

1. Inspect the installed document schema's layer-effect definitions for an
   existing effect before authoring a `customShader`.
2. Give the shader a stable, descriptive `name` and explain its intent.
3. Describe every parameter, including units and useful range, and declare
   its control with an explicit name suffix (`.colorR/.colorG/.colorB`,
   `.x`/`.y`, `.angle`, `.toggle`) so it gets an intuitive control. Declare a
   real `min`/`max` on every plain scalar — that is what earns it a slider.
4. Keep parameter declaration order aligned with the WGSL `Params` struct.
5. Describe every texture input and bind it to a valid source layer.
6. Preserve premultiplied alpha: output RGB must not exceed output alpha.
7. Keep sampling and loops bounded for render-time performance.
8. Animate knobs through `effectId + paramName`, not by rewriting WGSL per frame.
   When the shader needs a clock, declare the reserved `animationTime` parameter
   rather than an animator.
9. Check `tsrct project schema --document`, save through `project commit` or
   a supported action batch, then render with `tsrct preview` so the renderer
   validates the WGSL and bindings. Inspect the actual effect; a pass-through
   fallback is not a successful shader.

## Prefer self-describing shaders

Descriptions travel with the document and become context for future agents.
Write what an input means, not merely its type:

```text
Bad:  "map texture"
Good: "Grayscale displacement map; lighter pixels shift samples farther right."
```
