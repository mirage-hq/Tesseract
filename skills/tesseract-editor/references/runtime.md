# Browser runtime

Use the version pinned in `cli-version.txt` beside this guide for all browser
runtime files. This is the runtime release version, not the plugin version.
Replace `<VERSION>` below with that pin. If the files are unavailable, stop and
report the missing runtime; do not substitute another release.


Download these two files into `runtime/` beside your editor's `index.html`:

```sh
mkdir -p runtime
curl --fail --location https://captions-cdn.com/tesseract/<VERSION>/web_api.js --output runtime/web_api.js
curl --fail --location https://captions-cdn.com/tesseract/<VERSION>/web_api_bg.wasm --output runtime/web_api_bg.wasm
```

On Windows, download the same URLs with `Invoke-WebRequest`.

Keep both files together. The JavaScript resolves `web_api_bg.wasm` relative to
itself. Serve the editor over HTTP as described in the examples. No GitHub Web
archive is required.

For TypeScript editors or to inspect the typed browser API, also download the
matching declarations beside `web_api.js`:

```sh
curl --fail --location https://captions-cdn.com/tesseract/<VERSION>/web_api.d.ts --output runtime/web_api.d.ts
```

Use the same pinned version as the JavaScript and WASM. The declarations provide
types and signatures; they are not needed to execute the JavaScript examples.

Third-party notices for the same release are available at
`https://captions-cdn.com/tesseract/<VERSION>/THIRD_PARTY_NOTICES.md`.
