# Color grading

Tesseract grades footage with native, editable color operations. Measure first,
change one thing at a time, and check the result with numbers and frames.

Exact fields and limits come from `project schema`; search it for the effect or
action you need. Every grading value is an ordinary effect field, so the result
stays editable in Tesseract.

## What is available

| Need | Mechanism | Where |
|---|---|---|
| Scene-referred ACES color management (filmic highlights, light-like compositing, one grade for SDR and HDR) | document `colorManagement` plus layer `renderDomain`; see [ACES](#aces-scene-referred-color-management) | whole document |
| Normalize camera log footage | `source.inputTransform` on a Video or Image layer (a technical 3D LUT; in ACES a LUT-less `cameraInput`) | before every effect of that layer |
| Exposure, white balance, contrast, saturation | `primaryGrade` effect | layer effect stack |
| Global/shadows/midtones/highlights color balance (not Lift/Gamma/Gain) | `tonalColor` effect | layer effect stack |
| Tone and channel curves | `colorCurves` effect | layer effect stack |
| Hue-selective curves | `hueCurves` (five static linear curves) | layer effect stack |
| Cross-channel mixing / monochrome | `channelMixer` (RGB rows and constants) | layer effect stack |
| Subtractive range correction | `selectiveColor` (`relative` or `absolute`; Approximate Adobe mapping) | layer effect stack |
| A creative look from a `.cube` file | `lookTransform` effect (Creative LUT) with `mix` 0–1 | layer effect stack |
| Adjust only some colors or areas | `compositingOptions` on any of the grading effects above: `qualifier` (hue/saturation/luminance selection), `maskReferences`, `effectOpacity` | that effect |
| Measure the picture | `preview` / `filmstrip` PNGs, measured with local tools | read-only |
| Spatial denoise | `noiseReduction` (`luminance`, `chrominance`); no temporal mode | layer effect stack |
| Finishing | `halation` (warm highlight bloom), existing `vignette`, `grain`, `sharpen`, `levels`, `vibrance`, `hueSaturation`, `tintTritone` effects | layer effect stack |

Grade one shot by adding effects to its Video layer. Grade everything below a
point by adding them to an Adjustment layer. Effects run in stack order; keep the
usual order: Input Transform (fixed, first), then `primaryGrade`, `tonalColor`,
`colorCurves`, and finally `lookTransform`. This effect order is a recommendation,
not an automatic reorder. The Input Transform belongs to the media source, not
the effect stack: use it to normalize camera footage, and use `lookTransform`
for a creative look after correction. Do not apply the same camera conversion
again as a Creative LUT. Neither HDR output nor `hdrGraphicsWhiteNits` replaces
camera normalization or exposure correction.

In a default (`legacyDisplay`) document, grading controls operate on
display-referred SDR Rec.709. HDR exports are available with `export --hdr pq|hlg`;
HDR preview/filmstrip use `--hdr`. These do not turn the grading controls into a
scene-linear HDR grading system. For scene-referred grading with filmic
highlights and a managed SDR/HDR output, opt the document into
[ACES](#aces-scene-referred-color-management).

## Static hue curves, channel mixer and selective color

All three use `semanticVersion: 1`, preserve alpha and bypass exact identity without a render pass. Use `addFxLayerEffect`/`updateFxLayerEffect` with complete payloads. They do not expose animatable scalar parameters in v1. In an ACES scene group they run unchanged on ACEScct, not scene-linear RGB; HDR otherwise uses the existing SDR-domain split.

- Hue curves: `{"type":"hueCurves","semanticVersion":1,"hueVsSaturation":[{"x":0,"y":0.4},{"x":0.5,"y":0.6},{"x":1,"y":0.4}]}`. y=0.5 is neutral. All five curves sample original qualifier H, HSV S and Rec.709 L; hue wraps, saturation gains multiply and clamp, then luminance offsets. Reconstruction scales HSV(H,S,1) to requested luminance before RGB clipping, which may shift hue/saturation in highlights.
- Channel mixer: for an R/G swap, use red row `{red:0,green:1,blue:0,constant:0}`, green row `{red:1,green:0,blue:0,constant:0}`, blue row `{red:0,green:0,blue:1,constant:0}` and `monochrome:false`. Weights are -2..2, constants -1..1. `monochrome:true` uses the red row for all outputs.
- Selective color: initialize all nine ranges with `{cyan:0,magenta:0,yellow:0,black:0}`, choose `method:"relative"`, then try `reds.cyan=0.2`. Inks subtract RGB, with original-input range weights; relative positive ink scales by value and negative ink by headroom. This is an approximation; do not assume an exact match to After Effects or Photoshop.

## What Primary Grade controls do

Controls work on display-referred code values (0 black, 1 white), in this order:

| Control | Range | Effect |
|---|---|---|
| `temperature` | −1..1 | Red ×2^(0.5·T), blue ×2^(−0.5·T). +1 makes red one full stop stronger than blue (warmer). |
| `tint` | −1..1 | Green ×2^(0.5·t), red and blue ×2^(−0.25·t). Positive is greener, negative more magenta. |
| `exposure` | −5..5 | Stops: multiplies RGB by 2^stops. +1 doubles code values. |
| `contrast` | −2..2 | Stops of slope around code value 0.5. +1 doubles the distance from mid-gray. |
| `blacks` / `shadows` | −1..1 | Adds up to ±0.25 code value to pixels with luma below 0.25 / 0.5. |
| `highlights` / `whites` | −1..1 | Adds up to ±0.25 code value to pixels with luma above 0.5 / 0.75. |
| `saturation` | −1..1 | Scales color about Rec.709 luma by 1+s. −1 is grayscale. |
| `vibrance` | −1..1 | Like saturation, but strongest on muted colors. |

In SDR rendering, the grade's output is contained to 0..1. In HDR rendering,
the SDR-domain grade is applied while excess highlight light carries through:
darkening can reduce highlights, but brightening cannot raise them beyond the
SDR-domain ceiling. Use exposure for overall brightness and tonal controls for
one tonal range. This is the stable released behaviour.

**SDR-domain effect colors: 0..1** — Tint/TintTritone shadow, midtone and
highlight RGB, Hue/Saturation Colorize scalar controls, and similar engine color
shaders remain in `SdrDisplay` in HDR. Their validation/output clamps are
unchanged: widening cannot create light above SDR white. Content-painting
Fill/solid paint and layer-style colors retain the extended paint contract.

Grades are not the extended authored-paint contract: shapes, text, style colors, gradients and
backgrounds accept encoded-sRGB RGB 0..64 with alpha 0..1; HDR continues the
transfer function and SDR ratio-fits headroom. Native Adobe export clips paint
RGB per channel to 1 with diagnostics. Custom-shader controls are scalar and
remain subject to their declarations/WGSL; a `colorR/G/B` control can declare
0..64, but its name does not trigger automatic transfer conversion.

## Workflow

Shot-to-shot consistency is part of grading, even when the user only asks for
a look. Consistency means a coherent scene, not identical pixel values. Keep
intentional differences such as shade, backlight, practical lighting and changes
of location or time of day. Keep the work within the requested scope; a local
correction does not require regrading unrelated scenes.

1. **Inspect and group.** Open representative source frames from every shot.
   A file or Video layer may contain many shots; do not treat a baked edit as
   one shot. Identify cut ranges, then group related shots by environment,
   lighting conditions and subject, including shots separated in the edit.
   The same location can have different lighting; do not group by filename or
   proximity alone. Briefly note the relevant references, differences to retain
   and corrections needed; no particular table or report format is required.
   For a genuine single shot, skip cross-shot matching.
2. **Normalize and measure.** Choose color management and, for log footage, set
   its Input Transform before judging correction. Measure brightness, clipping
   and useful neutral/skin regions; retain source frames for before/after checks.
   A neutral-colored object under colored light need not appear neutral.
3. **Set a scene reference.** Pick a representative, usable shot for each group,
   not an unusually dark, clipped or atypically lit frame. Balance exposure and
   white balance with `primaryGrade`, then establish the intended key look with
   wheels, curves or a Creative LUT. Lower a LUT's `mix` rather than stacking
   corrections to undo it. Record the reference shot and sample time briefly.
4. **Match the group.** Compare each shot with the scene reference, then turn
   observed mismatches into shot-local corrections before the look. Use
   [shot-local control](#baked-edits-and-shot-local-control) even when the input
   is a single imported video. A shared creative look does not perform shot
   balancing. Leave a shot unchanged when comparison supports that decision,
   not merely because it shares a layer or preset with the reference. Compare
   corresponding subjects under comparable light using [Matching shots](#matching-shots);
   preserve motivated lighting differences instead of equalizing every shot.
5. **Refine and protect.** For skin, sky or a product color, add a qualifier
   when needed and inspect an exaggerated correction to verify its selection.
   Compare source/output shadow detail and noise at full resolution. If the
   grade crushes useful detail or exposes noise, revise that shot's correction
   or look strength before reaching for denoise; do not trade useful detail for
   a match. Disclose any remaining problem the tools cannot resolve.
6. **Review together and in sequence.** Open a side-by-side filmstrip of every
   group's graded shots, including nonadjacent ones, then review playback across
   cuts for unintended exposure, white-balance or saturation jumps. Inspect
   multiple moments when lighting changes within a shot. Correct outliers,
   re-render and repeat on the final export. Numbers support this review; they
   do not replace looking at frames or justify removing intentional contrast.

Ask before a strong stylistic change the user did not request. Keep corrections
subtle unless asked otherwise. Apply consistency checks to each delivered look,
not just one variant.

## Baked edits and shot-local control

A baked edit has cuts inside one media asset. "Keep the existing edit" means
preserve the visible frames, cut times, framing and audio; it does not require
keeping one Video layer. A static grade on that layer affects every shot.

Choose native controls to suit the edit. Correct an existing shot layer, use
[separate playback windows](native-authoring.md#shot-local-corrections-without-recutting)
for a plain baked Video, or use supported time-keyed corrections. At cuts,
avoid interpolating corrections across unrelated shots. A shared creative look
can sit on an Adjustment layer, with shot-local balance applied before it.
A single shared grade is sufficient when visual comparison shows the shots
already work together; do not split layers merely to follow this workflow.

When local windows are needed, inspect around candidate cuts to confirm their
boundaries; a sparse filmstrip or scene-change score can miss short inserts or
mistake movement for a cut. Preserve the source clock, framing and audio, and
compare the reference and corrected shot together afterward. Do not render
replacement media or rebuild the edit just to obtain local color control.

## Measuring the picture

Render the saved document with `preview` (one full-resolution frame) or
`filmstrip` (several frames; set `--tile-width`/`--tile-height` to the project's
aspect ratio, for example 135×240 for portrait; `--fx-solo composition:layer` isolates one layer
over its active window, with transparent pixels around it), then measure the
PNG with tools available on the host, for example Python. Look at the frames
as well; numbers do not replace seeing the picture.

```sh
tsrct preview --project project.tsrct --time 2.5 --output /absolute/path/edit/.tesseract-work/checks/grade-2500.png
```

Without `--hdr`, preview and filmstrip PNGs are 8-bit display-referred SDR
Rec.709 code values. Divide by 255
for normalized values (0 black, 1 white). Pixels with alpha 0 are empty canvas:
exclude them, or footage that does not fill the frame reads as black.

| Measurement | How | Typical check |
|---|---|---|
| Brightness | Luma `Y = 0.2126 R + 0.7152 G + 0.0722 B`; mean and 1st/50th/99th percentiles | Compare source/output and comparable scene regions; no universal mean target |
| Clipping | Share of pixels with any channel at 255 (or all channels at 0 for crushed shadows); luma alone misses single-channel clipping | Above about 0.01 is usually visible |
| Color cast | `cb = (B − Y) / 1.8556`, `cr = (R − Y) / 1.5748` averaged over a region | Near 0 for something neutral; about ±0.02 is noticeable |
| Saturation | Mean `sqrt(cb² + cr²)` (chroma). `primaryGrade.saturation` scales this chroma linearly; HSV saturation does not change by the same ratio | Compare shots when matching |
| Hue for a qualifier | HSV hue (degrees) and saturation of the region's mean color | The same definitions the qualifier uses |

### Source-relative neutral and skin checks

Identify a genuinely neutral region and a skin region on the **original source
frame**; record their coordinates, source/edit timestamps and any mapping for
crop or scale. Sample the same regions on the output at the same source moment,
away from cuts and fades. Use full-resolution frames, not resized filmstrip tiles.

Decode each pixel using all four signalled stream properties (ffprobe
`color_range`, `color_space`, `color_transfer`, `color_primaries`), in this order:

1. Normalize code values according to `color_range` (limited or full), including
   the chroma offset and scaling.
2. Apply the `color_space` matrix coefficients to convert Y′CbCr to nonlinear
   R′G′B′ (for example BT.709 vs BT.2020 non-constant luminance).
3. Invert `color_transfer` to get linear RGB.
4. Use `color_primaries` for the RGB→XYZ conversion, then convert to CIE Lab
   with D65 white.

A color-managed decoder that honours all four properties is also acceptable. Matrix
coefficients can be signalled independently of the primaries, and getting the
order or the matrix wrong skews Lab and ΔE. For SDR use a 100-nit
reference white; for HDR decode PQ to absolute nits or HLG with a documented
reference display/system gamma, not an SDR transfer. Use the same documented
Lab reference white for both sides. Report component-wise **median per-pixel
Lab**, not mean Lab or Lab of mean/median encoded RGB. Report neutral a*/b*
(target |a*| and |b*| ≲ 5), skin hue
`atan2(b*, a*)` in degrees (typically ≈ 40–70°, undefined near zero chroma),
and ΔE76 between source/output median Lab vectors. Keep the region, statistic,
transfer assumptions and ΔE definition identical across checks.

For these source-preservation checks, compare against the original source,
**not an earlier preview of your own grade**. This is separate from comparing
graded shots against the selected scene reference for consistency. Preview checks
are provisional: repeat on frames decoded from the final export. Different
statistics or baselines can pass a self-check while independent checks fail. If a task specifies a different frozen statistic (for example mean
per-pixel ΔE), report that separately; do not substitute this median recipe.
Source-HDR → SDR ΔE includes delivery tone mapping, not just grading changes;
disclose that limitation rather than claiming a failed preservation target passed.

### Neutralizing a cast

For an initial code-value gain estimate only (not the Lab acceptance check),
average a region that should be neutral (white or gray wall, paper, gray card),
measured where the `primaryGrade` will apply: before any later look or LUT
(temporarily disable later effects in a working copy if needed). With that mean
color `R, G, B` (all strictly positive), the white-balance gains above give the
exact neutralizing values:

```text
temperature = log2(B) − log2(R)
tint        = (4/3) · ((log2(R) + log2(B)) / 2 − log2(G))
exposure    = log2(target / Y')   (optional; Y' is the luma after the gains)
```

Both `temperature` and `tint` are limited to −1..1; a stronger cast needs a
second correction or a different approach. Add the values to the
`primaryGrade` (keep its other fields), render again, and confirm `cb` and
`cr` near 0.

In an ACES document the gains act on scene light, while `preview` PNGs show
output-transformed display values. The formulas then give an estimate, not
exact values: apply them, re-render, re-measure the same region, and refine
with the remaining difference. The same applies to the shot-matching formulas
below. Because the gain is constant in scene light, a neutral patch that
measures neutral stays neutral across the patch's brighter and darker areas.

### Matching shots

Choose the scene reference and the lighting differences to preserve using the
[workflow](#workflow) before calculating corrections. Compare corresponding
regions under comparable illumination (the same wall or person's skin, for
example), not merely any two regions labeled "skin" or "sky". Do not force a
shaded subject to match a sunlit one. If no comparable region exists, use visual
scene context and conservative adjustments rather than forcing a numeric match.

For regions that should match, measure representative times in both shots. For
source `s = (Rs, Gs, Bs)` and reference target `t = (Rt, Gt, Bt)`, use these
source-to-target corrections, not the neutralizing formulas above. These are
balance estimates before the look, not a way to infer a complete creative grade
from a final styled reference:

```text
temperature = log2(Bs/Rs) − log2(Bt/Rt)
tint        = (4/3) · (((log2(Rs) + log2(Bs))/2 − log2(Gs))
                      − ((log2(Rt) + log2(Bt))/2 − log2(Gt)))
exposure    = log2(Yt / Ys')
```

`Ys'` is source luma after these white-balance gains; `Yt` is target luma.
The gains match channel ratios; exposure then matches brightness. Identical
source and target give zero correction; a neutral target reduces to the
neutralizing formulas. A colored target preserves the reference's color
rather than driving the source toward gray.

Use strictly positive, unclipped straight RGB code values measured at the same
SDR grading stage, before later looks/LUTs. Zero or negative channels make the
logarithms undefined; very dark samples are unstable. These formulas describe
white-balance/exposure gains only, with other grading controls neutral. If
measuring an already white-balanced/exposed source, the values are adjustments
to those existing controls, not replacements; nonneutral contrast, tonal or
saturation controls require separate measurement/verification. Final
`temperature` and `tint` must each stay in −1..1 and `exposure` in −5..5;
out-of-range corrections or output clipping prevent an exact match. Re-render
and verify instead of assuming clamped values match.
Compare whole-frame percentiles only when both content and illumination are
comparable; otherwise their distributions should differ. For unwanted residual
tonal differences, `colorCurves` can help, but do not mechanically align channel
percentiles: that can erase motivated contrast or alter colors. Re-render and
compare the final look side by side and across cuts, checking shadow detail,
highlights and noise against the source. Matching cannot recover clipped detail;
a sky shot and an interior need not share a brightness distribution.

## Creative LUTs

Import a 3D `.cube` file, then reference its asset ID:

```sh
tsrct project import-asset --project project.tsrct --file /absolute/path/look.cube --asset-id film-look --kind lut
```

```json
[{"type":"addFxLayerEffect","compositionId":"main","layerId":4,"effectId":20,
  "effect":{"type":"lookTransform","semanticVersion":1,"mix":0.7,
    "transform":{"type":"lut3d","assetId":"film-look",
      "inputEncoding":"jerboa:sdr-rec709-display:v1",
      "outputEncoding":"jerboa:sdr-rec709-display:v1",
      "interpolation":"trilinear"}}}]
```

`"transform": null` is a Creative LUT with no LUT yet; it changes nothing.
Replace the look with `updateFxLayerEffect`; keep `mix` unless asked to change it.
Only use LUT files the user supplied or is licensed to use.

## Log footage (Input Transform)

`project import-video` reports `cameraEncoding`. `"camera:apple-log:v1"` means
the file declares Apple Log; `null` means unknown, not "not log" (exported
copies often drop the declaration). Confirm a flat, low-contrast look in a frame
before treating unknown footage as log.

Registered camera labels (`CAMERA_INPUT_ENCODINGS`):

| `inputEncoding` | Curve / gamut expected by the vendor LUT |
|---|---|
| `camera:apple-log:v1` | Apple Log / Rec.2020 |
| `camera:sony-slog3-sgamut3-cine:v1` | Sony S-Log3 / S-Gamut3.Cine |
| `camera:sony-slog3-sgamut3:v1` | Sony S-Log3 / S-Gamut3 |
| `camera:panasonic-vlog:v1` | Panasonic V-Log / V-Gamut |
| `camera:canon-log3-cinema-gamut:v1` | Canon Log 3 / Cinema Gamut |
| `camera:fujifilm-flog2:v1` | Fujifilm F-Log2 / F-Gamut |
| `camera:nikon-nlog:v1` | Nikon N-Log / Rec.2020 |
| `camera:dji-dlog-m:v1` | DJI D-Log M / D-Gamut |
| `camera:arri-logc3:v1` | ARRI LogC3 (EI 800) / Wide Gamut 3 |
| `camera:arri-logc4:v1` | ARRI LogC4 / Wide Gamut 4 |
| `camera:blackmagic-film-gen5:v1` | Blackmagic Film Gen 5 / Wide Gamut Gen 5 |
| `camera:red-log3g10:v1` | RED Log3G10 / REDWideGamutRGB |

These labels do not detect or convert the footage automatically.

In an ACES document, do not use a LUT: declare the camera with `cameraInput`
(see [Camera log footage in ACES](#camera-log-footage-in-aces)). The rest of this
section is for legacy documents.

Tesseract CLI does not bundle camera conversion LUTs. Use the camera maker's
official conversion `.cube` (for Apple Log, Apple's Apple Log to Rec.709 LUT):
one the user supplies, or the maker's free download when you have network
access. Never author or approximate a conversion LUT yourself. Import it with
`--kind lut`, then set it on the layer:

```json
[{"type":"updateLayerField","compositionId":"main","layerId":4,"propertyName":"inputTransform",
  "value":{"semanticVersion":1,"transform":{"type":"lut3d","assetId":"apple-log-709",
    "inputEncoding":"camera:apple-log:v1",
    "outputEncoding":"jerboa:sdr-rec709-display:v1",
    "interpolation":"trilinear"}}}]
```

Use `"value": null` to remove it. If no conversion LUT is available, say so
instead of approximating log conversion with contrast and saturation.

## ACES (scene-referred color management)

By default a document is `legacyDisplay`: everything below in this guide that
says "display-referred SDR" describes that mode. A document can instead opt in
to ACES. Then footage is treated as scene light, composited in linear ACEScg,
graded on ACEScct, and shown through the ACES 2.0 output transform. That output
is SDR BT.1886 by default, and HDR 1000-nit (P3-D65 limited) with
`export --hdr pq|hlg`.

**Choose ACES** when footage is camera log or HDR, when highlights should roll
off filmically instead of clipping, when glows, dissolves and light leaks should
add like light, or when one grade must serve both SDR and HDR deliveries. **Keep
legacy** for graphics-led edits that need exact sRGB brand colors, or when the
user did not ask for a cinematic or managed look. Switching changes the picture
of every existing grade, so decide before grading.

### Turning it on

`colorManagement` is a document setting. Set it with `project apply`:

```json
[{"type":"setColorManagement","colorManagement":{"workingSpace":"acescct","outputTransform":"aces2.0","compositing":"footageOnly"}}]
```

Use `{"workingSpace":"legacyDisplay"}` to return to legacy. Editing the root
`colorManagement` field through `project checkout` / `project commit` also
works. ACES requires both `outputTransform` and `compositing`; omit them in
legacy mode. Use only fields and values supported by the installed schema.

| `compositing` | What renders in ACES |
|---|---|
| `footageOnly` (start here) | Video, Image and PAG-image footage, plus Groups marked `renderDomain: "scene"`. Text, shapes and graphics stay display-referred, so white text stays 255. |
| `perClip` | Only layers and Groups marked `renderDomain: "scene"`. |
| `wholeProgram` | Everything, including graphics. sRGB white 1.0 renders at about 184/255 in SDR, and `renderDomain: "display"` is ignored. |

`renderDomain` overrides one Video, Image or Group: `"scene"` puts it, and for a
Group its whole subtree, in ACES; `"display"` keeps that layer legacy (for
example a graphic on top of footage). Set it with `project apply`:

```json
[{"type":"updateLayerField","compositionId":"main","layerId":4,"propertyName":"renderDomain","value":"scene"}]
```

Use `"value": null` to inherit the preset. Put footage plus the glows, blurs,
dissolves and light layers that should mix as light in one `"scene"` Group.
A `"display"` override inside a scene Group cannot take the child out of ACES;
place display graphics outside that Group. Legacy mode ignores these overrides
but retains them when switching color-management modes.

### What changes inside ACES

- **Light effects** (compositing, blend modes inside the Group, blurs, glow,
  halation, the `exposure` effect, `vignette`, luma mattes) work on linear
  scene light. Both `primaryGrade.exposure` and the separate `exposure` effect
  adjust scene light in stops: +1 doubles it and -1 halves it, including near
  black and above white. `primaryGrade` temperature/tint are the same
  documented gains applied to scene light, so a correction shifts shadows,
  midtones and highlights equally. Primary Grade applies exposure and white
  balance before its other controls.
- **Other grade controls** (`primaryGrade` contrast, tone and saturation;
  `tonalColor`, `colorCurves`, qualifiers, keys and `lookTransform`) run on
  ACEScct log values. Values tuned for legacy can look stronger. Curve and
  channel-mixer weights multiply log values, changing contrast rather than
  applying uniform scene exposure. Start from small values and judge by
  measured frames.
- **Authored colors** (solids, text, gradients) are sRGB values brought into
  ACES, so sRGB white is not SDR white under `wholeProgram`.
- **Above-white light** (RGB above 1, glows) rolls off
  smoothly through the output transform instead of clipping.

### Practical ACES notes

- **SDR footage tops out at scene 1.0.** Rec.709 clips enter ACES with highlights
  at linear 1.0, so they look dimmer and flatter than in legacy, and neon or sky
  cannot bloom or roll off by itself. Add a few tenths of a stop with the
  `exposure` effect per shot, and/or lift highlights with a curve, before glow
  or halation.
- **Offsets are exposure-like; gains change contrast.** Adding a constant to
  an ACEScct channel shifts it by constant stops only while both values remain
  in the unclipped log branch: 1/17.52 ACEScct per stop. This equivalence does
  not hold in the linear toe near black. Multiplying ACEScct values (gain or
  diagonal channel-mixer weights) changes log contrast, producing input-dependent
  stop shifts; cross-channel weights also mix colors. For uniform stop
  adjustments, use `primaryGrade.exposure`, or the separate `exposure` effect
  with `offset: 0` and `gammaCorrection: 1`. Both multiply scene-linear RGB by
  2^exposure without clipping to white, including signed values. Alpha is
  preserved; the finite half-float storage limit still applies. The separate
  effect's offset and gamma operate on straight, not premultiplied, scene RGB.
- **Luminance-preserving desaturation darkens saturated colors.** Lowering
  `luminanceVsSaturation` or `hueVsSaturation` on bright reds keeps their Rec.709
  luminance, which is low for red, so they get much darker.
- **Grain** runs on ACEScct values inside ACES, like the grades; tune its
  amount by eye there.
- **HDR.** `primaryGrade`, `tonalColor`, `colorCurves`, the three color tools
  and looks render in HDR export too: inside ACES on ACEScct values; in legacy
  documents in the SDR display domain with highlights carried through.

### Looks (LMT)

A Creative LUT inside ACES must map ACEScct to ACEScct (an ACES LMT):

```json
[{"type":"addFxLayerEffect","compositionId":"main","layerId":4,"effectId":25,
  "effect":{"type":"lookTransform","semanticVersion":1,"mix":0.8,
    "transform":{"type":"lut3d","assetId":"aces-look",
      "inputEncoding":"aces:acescct:v1",
      "outputEncoding":"aces:acescct:v1",
      "interpolation":"trilinear"}}}]
```

`addFxLayerEffect` accepts this only in an ACES document. An ordinary
`jerboa:sdr-rec709-display:v1` look is refused inside ACES; put it on a layer or
Group with `renderDomain: "display"`. Only use LUTs that are actually built for
ACEScct.

### Camera log footage in ACES

Do not import a vendor LUT. Declare the camera, and ACES applies the camera's
published log curve and gamut from the ACES reference config:

```json
[{"type":"updateLayerField","compositionId":"main","layerId":4,"propertyName":"inputTransform",
  "value":{"semanticVersion":1,"transform":{"type":"cameraInput","inputEncoding":"camera:sony-slog3-sgamut3-cine:v1"}}}]
```

`cameraInput` supports Apple Log, ARRI LogC3 (EI 800) and LogC4, Blackmagic
Film Gen 5, Canon Log 3, Panasonic V-Log, RED Log3G10, and Sony S-Log3
(S-Gamut3 and S-Gamut3.Cine). Fujifilm F-Log2, Nikon N-Log and DJI D-Log M have
no ACES input transform: keep their vendor `lut3d` Input Transform and set the
layer to `renderDomain: "display"`. A `lut3d` Input Transform with a supported
camera encoding also works in ACES (the LUT is ignored there), but `cameraInput`
is the clearer form. `cameraInput` is refused in legacy documents.

### Checking ACES pictures

Measure the exported frames as usual. Reference points in SDR for colors that
pass through ACES: sRGB grey 0.5 renders at about 106/255, sRGB white 1.0 at
about 184/255, and RGB 4.0 at about 251/255 (rolled off, not clipped). Graphics under `footageOnly` keep their legacy values. In HDR
export, ACES content peaks near 1000 nits. Typed errors name the fix: a display
look or unsupported camera inside ACES, an ACES look outside ACES, or HDR/log
media whose display rendition cannot enter ACES.

## Secondary selections

Add `compositingOptions.qualifier` to a `primaryGrade`, `tonalColor`,
`colorCurves`, or `lookTransform` effect to apply it only to matching pixels.
Hue is in degrees (0–360); saturation and luminance are 0–1 with a soft edge;
`refine` cleans the selection (`denoise` 0–10, `blurRadius` 0–100, `choke`
−50–50); `invert` selects everything else. `maskReferences` further limits the
correction to the layer's masks, and `effectOpacity` blends it. Use
`setFxLayerEffectCompositingOptions` to change them. For example, to halve the
saturation of a blue sky only:

```json
[{"type":"addFxLayerEffect","compositionId":"main","layerId":4,"effectId":21,
  "effect":{"type":"primaryGrade","semanticVersion":1,"temperature":0,"tint":0,"exposure":0,
    "contrast":0,"highlights":0,"shadows":0,"whites":0,"blacks":0,"saturation":-0.5,"vibrance":0},
  "compositingOptions":{"effectOpacity":1,"maskReferences":[],
    "qualifier":{"semanticVersion":1,"hue":{"center":215,"width":40,"softness":10},
      "saturation":{"low":0.3,"high":1,"softness":0.05},"luminance":{"low":0,"high":1,"softness":0},
      "refine":{"denoise":0,"blurRadius":0,"choke":0},"invert":false}}}]
```

Measure the target's HSV hue and saturation first and center the range on them.

Dedicated secondary matte preview is not available in the current engine or
public CLI. Inspect the selection with this visual diagnostic instead; do not
promise a matte-only readback.
Mask references identify masks on the same layer; use mask mode `none` for an
effect-only mask. Unknown mask IDs are rejected by authoring.

Check the selection before judging the correction: temporarily exaggerate the
correction (for example `saturation: -1` or a large exposure change) in a
working copy, render `preview`, and compare it with an unchanged frame. The
affected area is the selection. Widen or soften the range when the subject is
patchy; narrow it when the background leaks in. Then set the intended values.

### Keeping skin natural under a look

Apply the look, then protect skin with a secondary: start with HSV hue about
15–60° plus saturation and luminance ranges measured on the actual skin.
These HSV selection angles are not the Lab hue angles above. Use an inverted
skin qualifier on the look to move the background while excluding skin, or add
a qualified skin-restore correction after the look. Tune softness and inspect
an exaggerated correction for leakage; qualifiers do not track subjects.

Verify source-relative skin ΔE76 ≤ about 10–15 with the median Lab recipe above,
plausible skin hue, and a measurable background change at several timestamps.
A plausible hue alone does not prove preserved skin brightness or color.
If delivery tone mapping prevents the preservation target, report it explicitly.

## Highlight finishing

Add `halation` to a shot's Video layer or a finishing Adjustment layer after
the grade for a warm highlight halo:

```json
[{"type":"addFxLayerEffect","compositionId":"main","layerId":4,"effectId":26,
  "effect":{"type":"halation","threshold":0.8,"radius":24,"intensity":0.5,"tintRed":1,"tintGreen":0.25,"tintBlue":0.1}}]
```

The six controls shown are animatable. Optional `saturation` defaults to 1;
0 makes the halo neutral. `threshold` is relative to SDR white (1), `radius`
is in composition pixels, and `intensity: 0` bypasses the effect. In ACES,
halation works on scene light and retains above-white highlights. Start subtly
and inspect bright edges and skin. Native After Effects/Premiere conversion
omits halation with a diagnostic.

## Noise reduction

`noiseReduction` is spatial only. Use **one instance**; do not stack instances
to chase a noise score: repeated passes smear detail before removing more noise.
Compare the same low-texture regions and edge measurements against the original
source, using identical decoding, scale and statistics on the final export.
Check edge retention (for example ≥ 85% of source edge magnitude) and visually
inspect face texture, hair and clothing; a lower spatial residual alone is not
proof of successful noise removal. If one instance cannot meet both noise and
detail targets, report the limit. Temporal noise reduction is unavailable; do
not invent a temporal field.

## Final-export picture checks

Decode and inspect several timestamps of the exported file, safely inside each
shot and away from cuts/fades, with matching original-source frames. Sources
may fade in from black; encoder timestamp rounding near a fade boundary can
select a neighboring black frame. Confirm actual frame timestamps and move
sampling into stable picture before diagnosing missing footage. Never deliver
if a frame that should show picture is black; investigate rather than dismissing
it as an HDR viewing artifact. Verify footage as well as overlays.

## HDR output and stills

`preview --hdr` and `filmstrip --hdr` write 16-bit straight-alpha BT.2020 PQ
PNGs (`cICP` [9,16,0,1]), not SDR code values. Decode RGB samples to cd/m²:
with `E = sample/65535`, use
`10000 * (max(E^(1/m2)-c1,0)/(c2-c3*E^(1/m2)))^(1/m1)`, where
`m1=2610/16384`, `m2=2523/32`, `c1=3424/4096`, `c2=2413/128`, `c3=2392/128`.
Alpha is linear coverage; skip empty pixels. Do not measure PQ codes as SDR luma.
For physical luminance, use linear BT.2020 weights 0.2627/0.6780/0.0593 after decoding.

`export --hdr` (or `--hdr auto`) writes HEVC Main 10 MP4 using the majority
source-video transfer, HLG when none declares one. `--hdr pq` / `--hdr hlg`
selects it explicitly; ProRes and `--fx-solo` cannot be combined with HDR export.
The document's `hdrGraphicsWhiteNits` (100–1000; default about 609 cd/m²) sets
white graphics luminance, not the absolute luminance of ungraded HDR media.
Keep the default unless the delivery specification or the intended appearance
calls for a change. For reference-white guidance and a measurement workflow,
see [choosing graphics white](local-operation.md#choosing-graphics-white).

Native image import supports HDR cICP-tagged 16-bit PNG, EXR, gain-map JPEG,
HEIC/HEIF and AVIF. Actual HDR decoding depends on supported metadata and native
decoder availability; a file extension alone is not an HDR guarantee. These HDR
image paths are not supported on web. Use an HDR-aware viewer to review output.
The public CLI exports video, not PNG stills: use preview/filmstrip for PNG
measurements. If another host supplies export PNGs, inspect their bit depth and
transfer metadata before choosing SDR or PQ measurement.

## Limitations

- In legacy documents grades remain SDR-domain in HDR export: highlights carry
  through but cannot be brightened above the grade's SDR ceiling. Use ACES for
  scene-referred grading with a managed SDR/HDR output.
- No tracking; masks and qualifiers do not follow subjects automatically.
- No built-in automatic shot-matching command: the agent must compare frames
  and author native shot-local corrections where needed. This is not a limit
  on correcting individual shots inside a baked edit.
- No Dolby Vision or MaxCLL metadata export.
- Noise reduction is spatial only; temporal NR is absent.
- HDR images are unsupported on web.
- Camera detection reads metadata and recognizes Apple Log only; declare other
  cameras explicitly. In legacy documents a camera encoding label declares what
  the supplied vendor LUT expects, not a built-in conversion: use official vendor
  LUTs only, never approximate one. In ACES, `cameraInput` is the built-in
  conversion for the supported cameras.
- LUTs must be 3D `.cube` files; measure representative frames and review visually.
