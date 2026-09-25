# Browser API

Import from `./runtime/web_api.js` and initialize WASM once. All runtime files must come from the same release. The generated `.d.ts` describes the bindings; `actionSchema()` describes supported FX-document actions.

```js
import init, { TesseractEngine } from './runtime/web_api.js';

await init();
const engine = await TesseractEngine.create(file); // File or Blob
await engine.connectCanvas(canvas);
await engine.loadResources();
await engine.renderFrame(0);
let snapshot = engine.document();

snapshot = engine.applyAction({
  type: 'setFxCompositionMotionBlur',
  compositionId: snapshot.composition.id,
  settings: { enabled: true },
}).document;
await engine.renderFrame(0);
const saved = await engine.toBlob(); // .tsrct with its original assets

engine.dispose(); // after pending rendering/saving completes
engine.free();
```

## Project and controls

`document()` returns a snapshot, not live mutable state. The composition is `snapshot.composition`, dimensions are `snapshot.dimensions.width/height`, and `snapshot.duration` is in seconds. Preview times are in milliseconds.

`applyAction(action)` and `applyBatch(actions)` return `{ document, historyDepth }`. Update controls from the returned document rather than requesting another snapshot. Batches are atomic and restricted to the file’s FX composition. `historyDepth` contains `undo` and `redo` counts.

Group a continuous interaction into one history entry:

```js
const group = engine.beginEditGroup('Change color');
snapshot = engine.applyBatch(actions).document;
await engine.renderFrame(timeMs);
snapshot = engine.commitEditGroup(group).document;
// To discard the interaction, use cancelEditGroup(group) instead, then render.
```

Only one group may be open. Finish pending edits and close the group before saving or replacing a project. Grouping does not save the file.

## Preview and selection

`renderFrame(timeMs)` waits for resource decoding and rendering. Await it, coalesce rapid input, and schedule playback in the application. Browser GPU and media support are required. The runtime does not export video.

`setMuted(boolean)` mutes preview output without changing the project or playback clock. Call `preloadAudio()` after loading resources. From the Play click handler, call `startPlayback(timeMs)` to start audio and resume the browser audio context. In your render loop, use `audioClockMs()` for the frame time, falling back to elapsed `performance.now()` time when it returns `undefined`. Call `stopPlayback()` on pause, before seeking, and at the document’s end. Rendering continues to be scheduled by the application. `pumpAudioScheduler()` is available for applications that also schedule audio while animation frames are throttled in background tabs.

`layerBounds(timeMs)` returns `{ complete, layers }` with evaluated 2D geometry in project pixels, ordered bottom-to-top. Call it after rendering. Each layer has `layerId`, `points`, `parentTransform`, and `hitTestable`. `parentTransform` uses the six-value browser `DOMMatrix` order; invert it to map canvas drag deltas into layer coordinates. Hidden, inactive, audio, and 3D layers have no polygon. Draw selection overlays in the UI.

Supported canvases are 1080×1920, 1920×1080, 1080×1080, 1080×1350, 810×1080, and 1350×1080. The document background must be absent or opaque black; use an FX shape layer for another background.

## Files and assets

`create(file)` retains the selected File/Blob and reads assets on demand. Embedded fonts are registered automatically. Missing assets or fonts fail locally; there is no network fallback. Asset references must point to packaged assets. The API preserves original assets but does not import new ones.

`toBlob()` captures the current document when called and asynchronously packages it with the original assets. It does not write to disk. Disable edits while saving, or track whether newer edits remain unsaved. Keep the source file available until the session and pending saves finish.

For overwrite saving, obtain write permission, await `toBlob()`, write the Blob, and close the writable stream before reporting success. Overwriting can invalidate reads from the original File: reopen the saved Blob as the next engine session. Preserve the current edits on failure. The [timeline example](../examples/timeline-editor/README.md) demonstrates this flow.
