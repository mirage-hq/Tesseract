---
name: tesseract-editor
description: Build or modify a custom browser editor for Tesseract .tsrct files. Use for editor controls, previews, and saving projects; use the motion or video skill for direct project authoring.
---

# Build a Tesseract editor

If the editor needs to import or export other tools’ project formats, such as Premiere Pro or After Effects, read [conversion](references/conversion.md). When opening shared or older `.tsrct` files, updating tools, or investigating load/render differences, read [versions and compatibility](references/versions.md).

The browser engine opens, previews, edits, and saves `.tsrct` projects locally. A static HTML application is sufficient; no backend or native CLI is required. The browser runtime does not export video.

The [browser API reference](references/browser-api.md) covers initialization, actions, playback, and saving. Example: [general layer controls](examples/timeline-editor/README.md).

## Runtime and serving

Download the browser runtime from [the CDN](references/runtime.md) into a local `runtime/` directory beside `index.html`. Use both files from the specified version. No npm installation or native CLI is needed. `version()` returns the runtime release.

The editor needs HTTP serving and browser GPU/media support. Its HTML depends on the runtime files; attachment viewers may not execute WASM. CLI or skill updates do not require upgrading an existing editor’s runtime.

## Editing and saving

`actionSchema()` describes supported engine actions. UI controls, playback scheduling, and selection gestures belong to the application. Await rendering so frames do not overlap; edit groups combine continuous changes into one history entry.

`TesseractEngine.create(file)` accepts a File or Blob. `toBlob()` packages the current document with its original assets; it does not write to disk. Overwriting the source file can invalidate asset reads; the API reference describes reopening the saved Blob. Page refresh discards unsaved edits.

## Review before handoff

Read and follow the [critic review](references/critic-review.md): two independent critics, an art director and a creative-tool UX designer, score the running editor, and you revise between rounds until both rate it at least 8.5/10, for at most three review rounds. Tell the user the review plan, each round's scores and feedback, and the final score.

The art director judges the editor's own visual design (layout, hierarchy, typography, color, and control states) and whether the preview shows the document without visible defects; the opened `.tsrct` is the user's content and outside the review, so give the critics this scope. Test and capture on a copy of the project, never the user's file. Between rounds, revise the editor source, reload it, and recapture the screenshots. If a step cannot be captured, such as a permission prompt or a canvas left blank because the automated browser lacks WebGPU (confirm that `navigator.gpu` is missing or `requestAdapter()` returns null there), tell the critics so they list it under Not evaluated.
