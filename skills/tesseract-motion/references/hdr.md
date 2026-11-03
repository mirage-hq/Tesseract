# HDR output and images

Export, preview and filmstrip are SDR unless you add `--hdr`. Use this reference
for `--hdr` on any of them,
keeping footage that reports `hdrTransfer` `hlg` or
`pq` HDR, revising a project delivered in HDR, `hdrGraphicsWhiteNits`, authored
RGB above 1 as HDR light, and HDR still images.

## HDR export

An HDR export encodes HEVC Main 10 MP4 with a PQ or HLG transfer. By default it
matches the majority transfer of source videos, or HLG when none declare one. Use
PQ for graphics/image-only documents or any content above HLG's approximately
766 cd/m² peak. PQ can represent up to 10,000 cd/m²; HLG is the existing
convention (0.75 = 203 cd/m², peak approximately 766). The transfer changes
encoding, not source luminance.
Select it with `export --hdr [auto|pq|hlg]`; bare `--hdr` means `auto`. `--hdr`
cannot be combined with `--format prores` or `--fx-solo`.
Inspect HDR with a display or tool that reads its color metadata, not an 8-bit
SDR image viewer.

```sh
tsrct export --project project.tsrct --hdr pq --output finished-hdr.mp4
```

In an HDR export, white graphics (text, shapes, images; color 1.0) default to
about 609 cd/m², three times the 203 cd/m² diffuse white of HDR video, so text
reads clearly white on phones. Set the document's `hdrGraphicsWhiteNits`
(100–1000) in the document JSON to change it; 203 puts graphics on the
video's diffuse white (broadcast convention). Above about 766, HLG clips
highlights; choose PQ to preserve them. HDR video and HDR images retain their
source luminance independently of this setting; it does not set the absolute
luminance of ungraded HDR media. SDR output is unaffected.

### Choosing graphics white

Keep the default unless the delivery specification or the intended appearance
calls for a change; it is a product default, not a universal HDR mastering target.

- Follow the recipient's delivery specification first. When it calls for
  BT.2408 reference white, use 203 cd/m². This is the nominal Graphics White in
  [ITU-R BT.2408, section 2.1](https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2408-8-2024-PDF-E.pdf),
  not a requirement shared by every broadcaster or streaming platform.
- If graphics look glaring or detached, especially large white areas over dark
  video, try a lower value and review representative shots on an HDR-aware display.
  Preserve the intended caption legibility rather than matching luminance blindly.
- To measure, render an HDR frame and decode it as in
  [HDR preview and measurement](#hdr-preview-and-measurement).
  Sample the opaque interior of white graphics, avoiding antialiased edges, and
  compare it with a representative diffuse-white object in the video. Avoid
  specular highlights and do not treat skin as a white reference. Lighting and
  creative grading change scene whites, so there is no universal graphics-to-video
  brightness ratio. Re-render and review after changing the value.

For neutral authored RGB, absolute luminance is `linear(value) ×
hdrGraphicsWhiteNits`, where `linear` is the sRGB EOTF continued above 1:
`((value + 0.055) / 1.055)^2.4` for values above 0.04045.

| Encoded RGB value | At graphics white 609 (cd/m²) | At graphics white 203 (cd/m²) |
| --- | ---: | ---: |
| 1.0 | 609 | 203 |
| 1.1 | 757 | 252 |
| 1.35 | 1211 | 404 |
| 2.0 | 3017 | 1006 |

These are intended neutral-paint luminances before output clipping, not a
per-channel luminance formula for colored paint. HLG clips at approximately
766 cd/m², so the default 609 leaves little real headroom. For extended-color
headroom, lower `hdrGraphicsWhiteNits` to around 203 and export with `--hdr pq`.

## HDR preview and measurement

`preview --hdr` and `filmstrip --hdr` write a 16-bit straight-alpha BT.2020 PQ
PNG tagged with `cICP` `[9, 16, 0, 1]` (always PQ, never auto or HLG). Without
the flag they stay 8-bit SDR.
Do not judge HDR luminance from an SDR viewer or an
8-bit decode, and do not measure PQ codes as SDR luma.

```sh
tsrct preview --project project.tsrct --time 1 --hdr --output .tesseract-work/checks/hdr.png
tsrct filmstrip --project project.tsrct --timestamps-ms 0,1000 --hdr --output .tesseract-work/checks/hdr-strip.png
```

Read RGB samples as `E = sample / 65535`; decode to cd/m² using
`10000 * (max(E^(1/m2) - c1, 0) / (c2 - c3 * E^(1/m2)))^(1/m1)` with
`m1=2610/16384`, `m2=2523/32`, `c1=3424/4096`, `c2=2413/128`, `c3=2392/128`.
For physical luminance, use linear BT.2020 weights 0.2627/0.6780/0.0593 after
decoding. Alpha is straight, linear coverage; skip empty pixels. Graphics white
(linear 1.0) is the document's `hdrGraphicsWhiteNits`, or 609 cd/m² by default
(gain × 203 cd/m²); HDR video luminance is independent of this setting.

`filmstrip --hdr` draws its labels at the document's graphics white. Cells are
downsampled in premultiplied linear light before PQ encoding; this is not an
8-bit contact sheet. HDR filmstrips have a 200 MB float-canvas limit
(16 bytes/pixel).

The public CLI exports video, not PNG stills: use preview/filmstrip for PNG
measurements.
If another host supplies export PNGs, inspect their bit depth and
transfer metadata before choosing SDR or PQ measurement.

## Authored RGB above 1

Paint RGB up to 64 (see [FX authoring](fx-authoring.md#paint-colors-above-1))
continues the sRGB transfer function in HDR export: 1 is graphics white and 2 is
about 4.9538 times its linear brightness (luminances in the table above). SDR
export ratio-fits the same color by its largest channel instead, with no extra
brightness. SDR-domain effect colors such as Tint stay 0..1 and cannot produce
light above SDR white. For blend modes over HDR light, see
[HDR blend modes](hdr-blend-modes.md).

## HDR images

Native image import decodes HDR only from these encodings, with the metadata
they need and a native decoder on that platform; a file extension alone is not
an HDR guarantee:

- 16-bit BT.2020 PQ/HLG PNG with full-range RGB `cICP`: supported on native platforms.
- EXR: single non-deep RGB(A) layer, matching data/display windows, Rec.709 or
  BT.2020 D65 primaries. Linear associated alpha is preserved; `whiteLuminance`
  defines cd/m² at 1.0, otherwise 203 cd/m². ACES/custom primaries, deep/multilayer
  images, and nonfinite samples are rejected. Decode limit: 200 MB of float pixels.
- ISO 21496-1 gain-map JPEG and HEIC, plus tagged PQ/HLG HEIC/AVIF: ImageIO on
  macOS 15+/iOS 18+. ImageIO must return a recognized BT.2100 PQ/HLG profile.
  JPEG gain-map reconstruction is required, not the SDR base.
  Native HLG's 1000-nit OOTF is undone to match video/PNG's scene-linear convention
  (0.75 = 203 cd/m², peak ≈766); PQ and gain maps retain absolute luminance.
- XMP-only Ultra HDR JPEG is rejected when ImageIO does not reconstruct its map.
  The existing JPEG decoder has no gain-map reconstruction; adding a separate
  Ultra HDR decoder is not implemented. Prefer ISO 21496-1 sources. AVIF gain-map
  decoding is delegated to ImageIO but has no committed acceptance fixture yet.
- HEIC/AVIF/gain-map HDR is not implemented on Linux/Windows: the existing
  image crate lacks those HDR decoders; no libheif/libultrahdr integration is
  bundled. Untagged/SDR HEIC/AVIF are not accepted by this HDR path.
- Web HDR still decoding is unsupported. Do not use an SDR browser thumbnail as
  evidence of HDR luminance. Native HDR images retain absolute source nits after
  compensating the document's graphics-white gain, just like video/PNG.

Use `preview --hdr` or `filmstrip --hdr` to inspect preserved HDR samples.
