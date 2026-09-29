// The release's JS entry point loads its matching WASM and handles .tsrct assets.
import init, { TesseractEngine } from './runtime/web_api.js';
const $ = (id) => document.getElementById(id);
let opened,
  snapshot,
  selected,
  filename,
  dirty = false,
  busy = false,
  playing = false,
  muted = false,
  rendering = false;
let fileHandle, editGroup, renderPromise, drag;
const pendingEdits = new Map();
let canvasLayers = [];
let requestedTime = 0,
  playStart = 0,
  playFrom = 0;
const message = (text, failed = false) => {
  const status = $('status');
  status.textContent = text;
  status.setAttribute('role', failed ? 'alert' : 'status');
  status.setAttribute('data-error', String(failed));
};
const composition = () => snapshot?.composition;
const duration = () => (snapshot?.duration ?? 0) * 1000;
const allLayers = (layers, depth = 0) =>
  layers.flatMap((layer) => [{ layer, depth }, ...allLayers(layer.layers ?? [], depth + 1)]);
const current = () =>
  allLayers(composition()?.layers ?? []).find((x) => x.layer.id === selected)?.layer;
const updateTypes = {
  Text: 'updateTextLayer',
  Rect: 'updateRectLayer',
  Image: 'updateMediaLayer',
  Video: 'updateMediaLayer',
  Audio: 'updateAudioLayer',
  Group: 'updateGroupLayer',
  Shape: 'updateShapeLayer',
};
// Keep engine mutations, rendering, and file operations from overlapping.
function controls() {
  $('choose').disabled = $('open').disabled = busy || rendering || playing;
  $('reload').disabled = $('download').disabled = !opened || busy || rendering || playing;
  $('save').disabled = !opened || !fileHandle || busy || rendering || playing;
  $('save').setAttribute(
    'aria-label',
    fileHandle ? 'Save .tsrct' : 'Save requires opening with a supported file picker'
  );
  $('play').disabled = $('mute').disabled = !opened || busy;
  $('time').disabled = !opened || busy;
  $('inspector')
    .querySelectorAll('input,textarea')
    .forEach((el) => {
      el.disabled = busy || el.dataset.locked === 'true';
    });
  document.body.dataset.busy = String(busy);
}
function playIcon(active) {
  $('play').innerHTML =
    `<svg viewBox="0 0 24 24" aria-hidden="true">${active ? '<path d="M8 5v14M16 5v14"/>' : '<path d="m8 5 11 7-11 7z"/>'}</svg>`;
  $('play').setAttribute('aria-label', active ? 'Pause' : 'Play');
  $('play').title = active ? 'Pause' : 'Play';
}
function stop() {
  opened?.stopPlayback();
  playing = false;
  playIcon(false);
  controls();
}
function timeUI() {
  $('time').value = requestedTime;
  $('clock').textContent =
    `${(requestedTime / 1000).toFixed(2)} / ${(duration() / 1000).toFixed(2)} s`;
  $('layers').style.setProperty(
    '--playhead',
    `${duration() ? (requestedTime / duration()) * 100 : 0}%`
  );
}
// Share the active render so edits and playback never render concurrently.
function render() {
  if (renderPromise) return renderPromise;
  if (busy || !opened) return Promise.resolve();
  renderPromise = renderFrame().finally(() => {
    renderPromise = undefined;
  });
  return renderPromise;
}
async function renderFrame() {
  rendering = true;
  controls();
  let rendered = requestedTime;
  try {
    do {
      if (pendingEdits.size) {
        const actions = [...pendingEdits.values()];
        pendingEdits.clear();
        snapshot = opened.applyBatch(actions).document;
        if (actions.some((action) => 'name' in action.values)) {
          listLayers();
          const title = $('inspector').querySelector('h2');
          if (title && current()) title.textContent = current().name || `Layer ${selected}`;
        }
        $('saved').textContent = '● Unsaved changes';
        message('Unsaved changes');
      }
      if (playing) {
        requestedTime = Math.min(duration(), opened.audioClockMs() ?? (playFrom + performance.now() - playStart));
        timeUI();
      }
      rendered = requestedTime;
      await opened.renderFrame(rendered);
      canvasLayers = opened.layerBounds(rendered).layers;
      drawSelection();
    } while (pendingEdits.size || (!playing && requestedTime !== rendered));
    if (playing && requestedTime >= duration()) stop();
  } catch (error) {
    pendingEdits.clear();
    stop();
    if (editGroup) {
      snapshot = opened.cancelEditGroup(editGroup).document;
      editGroup = undefined;
    }
    message(String(error?.message ?? error), true);
  } finally {
    rendering = false;
    controls();
  }
}
async function tick(start = playStart) {
  if (!playing || start !== playStart) return;
  await render();
  if (playing) requestAnimationFrame(() => tick(start));
}
async function finishEditing() {
  if (renderPromise) await renderPromise;
  while (pendingEdits.size) await render();
  if (editGroup) {
    snapshot = opened.commitEditGroup(editGroup).document;
    editGroup = undefined;
  }
}
// The timeline, properties, and canvas share one selected layer ID.
function listLayers() {
  const list = $('layers');
  list.replaceChildren();
  const layers = allLayers(composition()?.layers ?? []);
  for (const { layer, depth } of layers) {
    const button = document.createElement('button');
    button.className = 'layer';
    button.setAttribute('aria-pressed', String(layer.id === selected));
    button.style.setProperty('--depth', depth);
    button.dataset.kind = layer.type;
    button.classList.toggle('hidden-layer', Boolean(layer.isHidden));
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = { Text: 'T', Audio: '♪', Rect: '□', Group: '▦' }[layer.type] ?? '◇';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = layer.name || `Layer ${layer.id}`;
    button.title = name.textContent;
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'track-name';
    label.append(icon, name);
    const lane = document.createElement('span');
    lane.className = 'lane';
    const clip = document.createElement('span');
    clip.className = 'clip';
    const range = layer.activeRange;
    const start = Math.max(
      0,
      Math.min(duration(), Number.isFinite(range?.start) ? range.start : 0)
    );
    const end = Math.max(
      start,
      Math.min(
        duration(),
        range && Number.isFinite(range.duration) ? range.start + range.duration : duration()
      )
    );
    clip.style.left = `${duration() ? (start / duration()) * 100 : 0}%`;
    clip.style.width = `${duration() ? ((end - start) / duration()) * 100 : 0}%`;
    clip.title = `${layer.name || layer.type} · ${(start / 1000).toFixed(2)}–${(end / 1000).toFixed(2)} s`;
    lane.append(clip);
    button.append(label, lane);
    button.onclick = () => selectLayer(layer.id);
    list.append(button);
  }
}
function refresh() {
  $('saved').textContent = dirty ? '● Unsaved changes' : '';
  listLayers();
  inspector();
  timeUI();
  drawSelection();
}
function patch(values) {
  if (busy || !opened || !current()) return;
  const type = updateTypes[current().type];
  const key = `${type}:${selected}`;
  pendingEdits.set(key, {
    type,
    compositionId: composition().id,
    layerId: selected,
    values: { ...pendingEdits.get(key)?.values, ...values },
  });
  dirty = true;
  void render();
}
function previewColor(fillColor) {
  if (!editGroup) editGroup = opened.beginEditGroup('Change color');
  patch({ fillColor });
}
function animatedProperties(layerId) {
  return new Set(
    (composition().dynamics?.entries ?? [])
      .filter((e) => e.target?.layerId === layerId && e.animator?.type !== 'constant')
      .map((e) => e.target.propertyType)
  );
}
function inspector() {
  const root = $('inspector');
  root.replaceChildren();
  const layer = current();
  if (!layer) {
    root.textContent = 'Select a layer';
    return;
  }
  const title = document.createElement('h2');
  title.textContent = layer.name || `Layer ${layer.id}`;
  const selectionNote = document.createElement('p');
  selectionNote.id = 'selection-note';
  selectionNote.className = 'muted';
  root.append(title, selectionNote);
  const animated = animatedProperties(selected);
  function field(label, type, value, change, property, options = {}) {
    const wrapper = document.createElement('label');
    wrapper.textContent = label + (animated.has(property) ? ' ◇' : '');
    if (type === 'number') wrapper.className = 'numeric';
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    else input.rows = 3;
    input.value = value ?? '';
    Object.assign(input, options);
    input.dataset.locked = String(
      animated.has(property) || (type === 'number' && typeof value !== 'number')
    );
    input[type === 'color' ? 'oninput' : 'onchange'] = () => {
      if (input.reportValidity()) change(type === 'number' ? input.valueAsNumber : input.value);
    };
    if (type === 'color') {
      input.onchange = input.onblur = () => {
        void finishEditing().catch((error) => message(String(error?.message ?? error), true));
      };
    }
    if (animated.has(property)) wrapper.title = 'Animated property';
    wrapper.append(input);
    root.append(wrapper);
  }
  if (updateTypes[layer.type]) {
    field('Layer name', 'text', layer.name, (v) => patch({ name: v }));
    if (layer.type === 'Text') {
      field('Text', 'textarea', layer.sourceText.text, (v) => patch({ text: v }), 'sourceText');
      field(
        'Font size',
        'number',
        layer.sourceText.fontSize,
        (v) => patch({ fontSize: v }),
        'fontSize',
        { min: 1, step: 1 }
      );
    }
    const color = layer.sourceText?.fillColor ?? layer.rect?.fillColor;
    if (Array.isArray(color))
      field(
        'Fill color',
        'color',
        '#' +
          color
            .slice(0, 3)
            .map((x) =>
              Math.round(x * 255)
                .toString(16)
                .padStart(2, '0')
            )
            .join(''),
        (v) =>
          previewColor([
            ...v
              .slice(1)
              .match(/../g)
              .map((x) => parseInt(x, 16) / 255),
            color[3] ?? 1,
          ]),
        'fillColor'
      );
    if (layer.transform) {
      const t = layer.transform;
      for (const [label, key, value, prop] of [
        ['Position X', 'x', t.position?.[0], 'positionX'],
        ['Position Y', 'y', t.position?.[1], 'positionY'],
        ['Rotation', 'rotation', t.rotation, 'rotation'],
        ['Opacity (%)', 'opacity', t.opacity, 'opacity'],
        ['Scale X (%)', 'scaleX', t.scale?.[0], 'scaleX'],
        ['Scale Y (%)', 'scaleY', t.scale?.[1], 'scaleY'],
      ]) {
        field(label, 'number', value, (v) => patch({ [key]: v }), prop, {
          step: 1,
          ...(key === 'opacity' ? { min: 0, max: 100 } : {}),
        });
      }
    }
  }
  controls();
}
async function selectLayer(id, fromCanvas = false) {
  if (drag) return;
  await finishEditing();
  selected = id;
  listLayers();
  inspector();
  drawSelection();
  if (fromCanvas)
    $('layers').querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
}
function drawSelection() {
  const overlay = $('selection-overlay');
  overlay.replaceChildren();
  if (!opened || !snapshot) return;
  overlay.removeAttribute('hidden');
  const canvas = $('preview').getBoundingClientRect(),
    wrap = $('canvas-wrap').getBoundingClientRect();
  const { width, height } = snapshot.dimensions;
  const scale = Math.min(canvas.width / width, canvas.height / height);
  Object.assign(overlay.style, {
    left: `${canvas.left - wrap.left + (canvas.width - width * scale) / 2}px`,
    top: `${canvas.top - wrap.top + (canvas.height - height * scale) / 2}px`,
    width: `${width * scale}px`,
    height: `${height * scale}px`,
  });
  overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const layers = allLayers(composition().layers);
  for (const bounds of canvasLayers) {
    if (!bounds.hitTestable) continue;
    const layer = layers.find((x) => String(x.layer.id) === bounds.layerId)?.layer;
    // Group bounds enclose their children; select groups from the timeline.
    if (!layer || layer.type === 'Group') continue;
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', bounds.points.map((point) => point.join(',')).join(' '));
    polygon.setAttribute('class', 'hit-area');
    polygon.onpointerdown = (event) => {
      event.stopPropagation();
      void selectLayer(layer.id, true);
    };
    overlay.append(polygon);
  }
  const bounds = canvasLayers.find((layer) => layer.layerId === String(selected));
  if (bounds) {
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    outline.setAttribute('points', bounds.points.map((point) => point.join(',')).join(' '));
    outline.setAttribute('class', 'selection-outline');
    outline.onpointerdown = (event) => {
      event.stopPropagation();
      void startDrag(event).catch((error) => message(String(error), true));
    };
    overlay.append(outline);
  }
  const note = $('selection-note');
  if (note)
    note.textContent =
      !bounds && current()
        ? current().isHidden
          ? 'Hidden layer'
          : current().type === 'Audio'
            ? 'Audio layer'
            : 'No canvas bounds at this frame'
        : '';
}
async function startDrag(event) {
  if (event.button !== 0 || busy || drag) return;
  const layer = current();
  const animated = animatedProperties(selected);
  if (
    !updateTypes[layer?.type] || !layer.transform?.position?.every(Number.isFinite) ||
    animated.has('positionX') || animated.has('positionY')
  ) return;
  const overlay = $('selection-overlay');
  event.preventDefault();
  overlay.setPointerCapture(event.pointerId);
  stop();
  await finishEditing();
  if (!overlay.hasPointerCapture(event.pointerId)) return;
  const bounds = canvasLayers.find((entry) => entry.layerId === String(selected));
  if (!bounds) return;
  // Browser CSS pixels → canvas pixels → the layer's parent coordinates.
  const inverse = new DOMMatrix(bounds.parentTransform).inverse();
  if (![inverse.a, inverse.b, inverse.c, inverse.d].every(Number.isFinite)) return;
  drag = {
    pointerId: event.pointerId,
    x: event.clientX, y: event.clientY,
    scale: snapshot.dimensions.width / overlay.getBoundingClientRect().width,
    inverse,
    position: [...current().transform.position],
  };
}
const overlay = $('selection-overlay');
overlay.onpointerdown = (event) => {
  if (event.target === overlay) void selectLayer(undefined);
};
overlay.onpointermove = (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (!editGroup && Math.hypot(dx, dy) < 3) return;
  if (!editGroup) editGroup = opened.beginEditGroup('Move layer');
  const { inverse: m, scale, position } = drag;
  patch({
    x: position[0] + (m.a * dx + m.c * dy) * scale,
    y: position[1] + (m.b * dx + m.d * dy) * scale,
  });
};
async function endDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag = undefined;
  if (overlay.hasPointerCapture(event.pointerId)) overlay.releasePointerCapture(event.pointerId);
  await finishEditing();
  inspector();
}
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  overlay.addEventListener(type, (event) => {
    void endDrag(event).catch((error) => message(String(error), true));
  });
}

$('canvas-wrap').onclick = (event) => {
  if (event.target === $('canvas-wrap')) selectLayer(undefined);
};
new ResizeObserver(drawSelection).observe($('canvas-wrap'));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !event.target.matches('input,textarea')) selectLayer(undefined);
});
async function open(file, { handle, reload = false } = {}) {
  if (busy || rendering || playing) return;
  await finishEditing();
  if (dirty && !confirm('Discard unsaved edits?')) return;
  const previousTime = requestedTime,
    previousSelection = selected;
  busy = true;
  controls();
  let next;
  try {
    message('Loading engine…');
    await init();
    message('Opening project and fonts…');
    next = await TesseractEngine.create(file);
    if (opened) { opened.dispose(); opened.free(); }
    opened = next;
    next = undefined;
    snapshot = opened.document();
    filename = file.name || 'project.tsrct';
    dirty = false;
    fileHandle = handle;
    canvasLayers = [];
    selected =
      allLayers(composition().layers).find((x) => x.layer.type === 'Text')?.layer.id ??
      composition().layers[0]?.id;
    if (
      reload &&
      allLayers(composition().layers).some((x) => x.layer.id === previousSelection)
    )
      selected = previousSelection;
    requestedTime = reload ? Math.min(previousTime, duration()) : 0;
    $('time').max = duration();
    $('ruler').replaceChildren(
      ...Array.from({ length: 9 }, (_, i) => {
        const tick = document.createElement('span');
        tick.textContent = `${(((duration() / 1000) * i) / 8).toFixed(1)}s`;
        return tick;
      })
    );
    $('filename').textContent = filename;
    $('welcome').hidden = true;
    $('preview').hidden = false;
    $('preview').width = snapshot.dimensions.width;
    $('preview').height = snapshot.dimensions.height;
    refresh();
    message('Preparing canvas…');
    await opened.connectCanvas($('preview'));
    message('Loading preview resources…');
    await opened.loadResources();
    opened.preloadAudio();
    opened.setMuted(muted);
    message('Rendering first frame…');
    await opened.renderFrame(requestedTime);
    canvasLayers = opened.layerBounds(requestedTime).layers;
    drawSelection();
    message('Ready');
    return true;
  } catch (error) {
    if (next) { next.dispose(); next.free(); }
    message(String(error?.message ?? error), true);
  } finally {
    busy = false;
    controls();
  }
}
async function chooseFile() {
  if (busy || rendering || playing) return;
  if (!window.showOpenFilePicker) {
    $('open').click();
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        { description: 'Tesseract project', accept: { 'application/octet-stream': ['.tsrct'] } },
      ],
    });
    await open(await handle.getFile(), { handle });
  } catch (error) {
    if (error.name !== 'AbortError') message(String(error?.message ?? error), true);
  }
}
$('choose').onclick = chooseFile;
$('open').onchange = (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (file) void open(file);
};
$('reload').onclick = async () => {
  if (!opened || busy || rendering || playing) return;
  try {
    if (fileHandle) await open(await fileHandle.getFile(), { handle: fileHandle, reload: true });
    else {
      message('Select the file again to reload it.');
      await chooseFile();
    }
  } catch (error) {
    message(String(error?.message ?? error), true);
  }
};
$('time').oninput = () => {
  stop();
  requestedTime = Number($('time').value);
  timeUI();
  void render();
};
$('mute').onclick = () => {
  muted = !muted;
  opened.setMuted(muted);
  $('mute').title = muted ? 'Unmute' : 'Mute';
  $('mute').setAttribute('aria-label', $('mute').title);
  $('mute').setAttribute('aria-pressed', String(muted));
  $('mute').querySelector('path').setAttribute('d',
    `m11 5-6 5H2v4h3l6 5z${muted ? 'M16 9l6 6m0-6-6 6' : 'M16 8q5 4 0 8'}`);
};
$('play').onclick = () => {
  if (playing) {
    stop();
    return;
  }
  if (requestedTime >= duration()) requestedTime = 0;
  opened.startPlayback(requestedTime);
  playing = true;
  playFrom = requestedTime;
  playStart = performance.now();
  playIcon(true);
  controls();
  void tick();
};
$('download').onclick = async () => {
  if (!opened || busy || rendering || playing) return;
  await finishEditing();
  busy = true;
  controls();
  message('Preparing download…');
  try {
    const blob = await opened.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace(/\.tsrct$/i, '') + '-edited.tsrct';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    dirty = false;
    $('saved').textContent = 'Downloaded';
    message('Download requested. Your original file is unchanged.');
  } catch (error) {
    message(String(error?.message ?? error), true);
  } finally {
    busy = false;
    controls();
  }
};
$('save').onclick = async () => {
  if (!opened || !fileHandle || busy || rendering || playing) return;
  if (!confirm(`Overwrite “${filename}” with your current edits? This replaces the file on disk.`))
    return;
  await finishEditing();
  busy = true;
  controls();
  let writable;
  try {
    if ((await fileHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') {
      message(
        'Save failed: the browser denied permission to overwrite this file. Your file is unchanged and your edits are still open. Use Download to save a copy.',
        true
      );
      return;
    }
    message('Saving…');
    const blob = await opened.toBlob();
    writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    writable = undefined;
    dirty = false;
    // Reopen the saved Blob: overwriting invalidates the original file's asset reads.
    busy = false;
    const restored = await open(new File([blob], filename), { handle: fileHandle, reload: true });
    $('saved').textContent = 'Saved';
    if (!restored)
      message(
        'File saved, but the preview could not reload. Reopen the saved file to continue.',
        true
      );
  } catch (error) {
    if (writable) await writable.abort().catch(() => {});
    message(`Save failed: ${error?.message ?? error}. Your edits are still open.`, true);
  } finally {
    busy = false;
    controls();
  }
};
window.addEventListener('beforeunload', (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});
