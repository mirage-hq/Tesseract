# Bouncing-ball editor

A small editor for the included `ball.tsrct`, using plain HTML, CSS, and JavaScript.
Change the colors, drag the easing curve, and play or scrub the animation.
Edits stay in memory; refreshing resets the example.

## Run

Place the Tesseract browser release’s `runtime/` directory beside `index.html`.
Keep its JavaScript and WASM files together from the same release. Then run:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open [localhost:8767](http://localhost:8767) in a browser with WebGPU support.

## Code

`app.js` imports `init` and `TesseractEngine` from `runtime/web_api.js`, opens
`ball.tsrct`, and connects the preview canvas. `motion.js` builds keyframe actions
for the ball and shadow. The controls target this project’s layer IDs;
change those mappings to use a different project.
