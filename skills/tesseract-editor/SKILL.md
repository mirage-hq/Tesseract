---
name: tesseract-editor
description: Build or modify a custom browser editor for Tesseract .tsrct files. Use for editor controls, previews, and saving projects; use the motion or video skill for direct project authoring.
---

# Build a Tesseract editor

Build the controls requested using the browser engine. Start with a static HTML application that opens a `.tsrct`, previews it, and downloads edited files. Projects stay in the browser; no backend or native CLI is required.

Read [the browser API](references/browser-api.md). Adapt [the timeline editor](examples/timeline-editor/README.md) for general layer controls, or [the bouncing-ball editor](examples/bouncing-ball/README.md) for controls tailored to a bundled project. These are examples, not required layouts or feature sets.

## Runtime and serving

Read `references/cli-version.txt` when present; its release pin also applies to the browser runtime. Use [the installation reference](references/installation.md) to find the repository and release tag. Download `tesseract-<VERSION>-web.zip` and its `.sha256`, verify the checksum, and place the extracted `runtime/` beside `index.html`. Keep the release’s generated JavaScript, types, and WASM together. No npm installation is needed. Without a release pin, select an available release or build locally; do not invent a version.

Serve the directory over HTTP using a local static server or the environment’s preview mechanism. Share the whole editor directory or host it as a static site; the HTML alone does not contain the runtime, and attachment viewers may not execute WASM.

Keep an existing editor’s runtime pinned. `version()` identifies its release; do not create extra version metadata. When an upgrade is requested, replace the runtime files together, adapt to that release’s bindings, and verify preview and save/reopen using a copy of the project before adopting it. CLI or skill updates do not require upgrading existing editors.

## Editing and saving

Use engine actions, not CLI commands. `actionSchema()` describes supported actions. UI controls, playback scheduling, and selection gestures belong to the application. Coalesce continuous input and await rendering so frames do not overlap. Use edit groups for a continuous interaction.

Default to file selection and Blob download. Add overwrite saving only when requested, using browser file permissions and the reopen flow in the API reference. Show failures and preserve unsaved edits. Page refresh discards the editing session.

Verify with a representative file: open, preview, edit, save, and reopen. Confirm the edit and required assets remain usable. Deliver the editor directory or preview URL separately from edited `.tsrct` files.
