# Import images and audio

Import copies bytes into the portable document. It does not create timeline layers.

Use a unique flat asset ID; existing IDs cannot be replaced accidentally.

```sh
tsrct project import-asset --project project.tsrct --file /absolute/path/logo.png --asset-id logo --kind image
tsrct project import-asset --project project.tsrct --file /absolute/path/music.wav --asset-id music --kind audio
```

Accepted image suffixes: PNG, JPG/JPEG, WebP, EXR, HEIC/HEIF, AVIF.
Audio: WAV, MP3, M4A, AAC, FLAC, OGG.

Before importing an EXR, HEIC/HEIF, AVIF, 16-bit PNG or gain-map (Ultra HDR)
JPEG, or when an image fails to decode, read [HDR images](hdr.md#hdr-images) for
the supported encodings, platforms and rejected forms.
The underlying decoder must support the file's encoding.
Import checks the file and suffix and packages it, but does not decode or
return dimensions/duration.
Probe metadata with local media tools, then verify decoding in a preview/export.
Footage, local font files, and 3D `.cube` color LUTs are imported too; for
LUTs, see [color grading](color-grading.md).
Use `project import-video` for footage, `project import-font --file` for font
files, and `--kind lut` for LUTs.
A 3D-enabled CLI also imports models, IES photometry, cloth point caches and
HDR environment images; [Scene3D basics](scene3d-basics.md) lists the kinds.

After import, add an Image or Audio layer to the document JSON using the
installed document schema and the imported asset ID.
Check out the document first and commit it afterwards.
Preserve existing layers and use unused numeric layer IDs. For a 200×100 image:

```json
{"type":"Image","id":1,"name":"Logo","activeRange":{"start":0,"duration":3000},"transform":{"anchorPoint":[100,50],"position":[320,180],"scale":[100,100],"rotation":0,"opacity":100},"source":{"assetId":"logo","fit":"contain"}}
```

Use actual image dimensions for the anchor and choose placement for the canvas.
For Audio layer fields, source timing, gain, and envelopes, read
[audio and timing](audio-and-timing.md). Generated cues and FFmpeg-processed
derivatives follow the same import path. Keep originals and processing recipes;
mute the original dialogue when replacing it to avoid doubled playback.
