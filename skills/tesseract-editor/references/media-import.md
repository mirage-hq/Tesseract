# Import images and audio

Import copies bytes into the portable document. It does not create timeline layers.
Use a unique flat asset ID; existing IDs cannot be replaced accidentally.

```sh
tsrct project import-asset --project project.tsrct --file /absolute/path/logo.png --asset-id logo --kind image
tsrct project import-asset --project project.tsrct --file /absolute/path/music.wav --asset-id music --kind audio
```

Accepted image suffixes: PNG, JPG/JPEG, WebP. Audio: WAV, MP3, M4A, AAC, FLAC, OGG.
The underlying decoder must support the file's encoding; import checks the file
and suffix and packages it, but does not decode or return dimensions/duration.
Probe metadata with local media tools, then verify decoding in a preview/export.
Use `project import-video` for footage and `project import-font --file` for local font files.

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
