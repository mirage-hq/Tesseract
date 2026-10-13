# Import images and audio

Import copies bytes into the portable document. It does not create timeline layers.
Use a unique flat asset ID; existing IDs cannot be replaced accidentally.

```sh
tsrct project import-asset --project project.tsrct --file /absolute/path/logo.png --asset-id logo --kind image
tsrct project import-asset --project project.tsrct --file /absolute/path/music.wav --asset-id music --kind audio
```

Accepted image suffixes: PNG, JPG/JPEG, WebP, EXR, HEIC/HEIF, AVIF.
Audio: WAV, MP3, M4A, AAC, FLAC, OGG.

Native HDR image decoding:
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
The underlying decoder must support the file's encoding; import checks the file
and suffix and packages it, but does not decode or return dimensions/duration.
Probe metadata with local media tools, then verify decoding in a preview/export.
Use `project import-video` for footage and `project import-font --file` for local font files.
Import 3D `.cube` color LUTs with `--kind lut`; see [color grading](color-grading.md).

Check out the document after import. Add an Image or Audio layer using the
installed document schema and the imported asset ID, then commit. Preserve
existing layers and use unused numeric layer IDs. For a 200×100 image:

```json
{"type":"Image","id":1,"name":"Logo","activeRange":{"start":0,"duration":3000},"transform":{"anchorPoint":[100,50],"position":[320,180],"scale":[100,100],"rotation":0,"opacity":100},"source":{"assetId":"logo","fit":"contain"}}
```

Use actual image dimensions for the anchor and choose placement for the canvas.
For Audio layer fields, source timing, gain, and envelopes, read
[audio and timing](audio-and-timing.md). Generated cues and FFmpeg-processed
derivatives follow the same import path. Keep originals and processing recipes;
mute the original dialogue when replacing it to avoid doubled playback.
