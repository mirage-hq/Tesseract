# Timeline editor

A plain HTML, CSS, and JavaScript editor for `.tsrct` files, with a timeline,
layer selection, property controls, and preview playback with audio.

## Run

Place the Tesseract browser release’s `runtime/` directory beside `index.html`.
Keep its JavaScript and WASM files together from the same release. Then run:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open [localhost:8767](http://localhost:8767) in a browser with WebGPU support
and choose a `.tsrct` file.

Save overwrites the opened file when the browser supports it and grants permission.
Download saves a separate copy. Save or download before refreshing the page.

## Code

`app.js` imports `init` and `TesseractEngine` from `runtime/web_api.js`.
It opens files with `create()`, edits through `applyBatch()`, previews with
`renderFrame()`, and saves with `toBlob()`. `layerBounds()` supplies canvas
selection geometry. `index.html` and `style.css` define the interface.
