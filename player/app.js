const $ = (id) => document.getElementById(id);
let engine, renderPromise;
const runtimeReady = import('./runtime/0.3.0/web_api.js').then(async (runtime) => {
  await runtime.default();
  return runtime;
});
runtimeReady.catch(() => message('Could not load the playback engine. Reload to retry.', true));
let busy = false, playing = false, muted = false;
let time = 0, duration = 0, playFrom = 0, playStart = 0, frame = 0;
const format = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
function message(text, error = false) {
  $('status').textContent = text;
  $('status').dataset.error = String(error);
}
function update() {
  $('play').disabled = $('seek').disabled = $('mute').disabled = !engine || busy;
  $('seek').value = time;
  $('seek').setAttribute('aria-valuetext', `${format(time)} of ${format(duration)}`);
  $('clock').textContent = `${format(time)} / ${format(duration)}`;
  $('play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  $('play').title = `${playing ? 'Pause' : 'Play'} (Space)`;
  $('play-path').setAttribute('d', playing ? 'M8 5v14M16 5v14' : 'm9 5 11 7-11 7Z');
}
function pause() {
  playing = false;
  cancelAnimationFrame(frame);
  engine?.stopPlayback();
  update();
}
// Coalesce scrub requests and await every frame before rendering or disposing again.
function render() {
  if (renderPromise) return renderPromise;
  renderPromise = (async () => {
    let rendered;
    do {
      rendered = time;
      await engine.renderFrame(Math.min(rendered, Math.max(0, duration - 0.01)));
    } while (!busy && rendered !== time);
  })().catch((error) => {
    pause();
    message(`Playback failed: ${error.message ?? error}`, true);
  }).finally(() => { renderPromise = undefined; });
  return renderPromise;
}
async function tick(start = playStart) {
  if (!playing || busy || start !== playStart) return;
  time = Math.min(duration, engine.audioClockMs() ?? (playFrom + performance.now() - playStart));
  update();
  await render();
  if (start !== playStart) return;
  if (time >= duration) pause();
  if (playing) frame = requestAnimationFrame(() => tick(start));
}
function togglePlay() {
  if (!engine || busy) return;
  if (playing) return pause();
  try {
    if (time >= duration) time = 0;
    engine.startPlayback(time);
    playFrom = time;
    playStart = performance.now();
    playing = true;
    message('');
    update();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => tick());
  } catch (error) { pause(); message(`Could not play: ${error.message ?? error}`, true); }
}
async function open(file) {
  if (busy) return;
  if (!file.name.toLowerCase().endsWith('.tsrct')) return message('Choose a .tsrct project file.', true);
  pause();
  busy = true;
  $('open').disabled = $('welcome').disabled = true;
  $('controls').inert = true;
  $('player').setAttribute('aria-busy', 'true');
  try {
    if (renderPromise) await renderPromise;
    if (!navigator.gpu) throw new Error('This browser needs WebGPU to play projects. Try a current browser with hardware acceleration enabled.');
    message('Loading playback engine…');
    const runtime = await runtimeReady;
    if (engine) { engine.dispose(); engine.free(); engine = undefined; }
    $('canvas').hidden = true;
    $('welcome').hidden = false;
    message('Opening project…');
    engine = await runtime.TesseractEngine.create(file);
    const doc = engine.document();
    duration = doc.duration * 1000;
    time = 0;
    // A new canvas gives each engine its own GPU context when replacing a file.
    const canvas = $('canvas').cloneNode();
    $('canvas').replaceWith(canvas);
    canvas.width = doc.dimensions.width;
    canvas.height = doc.dimensions.height;
    await engine.connectCanvas(canvas);
    message('Preparing media…');
    await engine.loadResources();
    engine.preloadAudio();
    engine.setMuted(muted);
    await engine.renderFrame(0);
    $('seek').max = duration;
    $('filename').textContent = file.name;
    canvas.hidden = false;
    $('welcome').hidden = true;
    message('');
  } catch (error) {
    if (engine) { engine.dispose(); engine.free(); engine = undefined; }
    $('canvas').hidden = true;
    $('welcome').hidden = false;
    time = duration = 0;
    $('filename').textContent = '';
    message(`Could not open this project. ${error.message ?? error}`, true);
  } finally {
    busy = false;
    update();
    $('open').disabled = $('welcome').disabled = false;
    $('controls').inert = false;
    $('player').setAttribute('aria-busy', 'false');
  }
}
$('open').onclick = $('welcome').onclick = () => $('file').click();
$('file').onchange = (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (file) void open(file);
};
$('play').onclick = togglePlay;
$('stage').addEventListener('click', (event) => {
  if (event.target.id === 'canvas') togglePlay();
});
$('seek').oninput = () => {
  if (!engine || busy) return;
  const requestedTime = Number($('seek').value);
  pause();
  time = requestedTime;
  update();
  void render();
};
$('mute').onclick = () => {
  if (!engine || busy) return;
  muted = !muted;
  engine.setMuted(muted);
  $('mute').setAttribute('aria-pressed', String(muted));
  $('mute').setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  $('mute').title = `${muted ? 'Unmute' : 'Mute'} (M)`;
  $('mute-path').setAttribute('d', `m11 5-6 5H2v4h3l6 5Z${muted ? 'M16 9l6 6m0-6-6 6' : 'M16 8q5 4 0 8'}`);
};
$('fullscreen').hidden = !document.fullscreenEnabled;
$('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('player').requestFullscreen();
  } catch (error) { message(`Fullscreen unavailable: ${error.message ?? error}`, true); }
};
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (!event.repeat) togglePlay();
    return;
  }
  if (event.repeat || event.target.closest('button, input, a')) return;
  if (event.key.toLowerCase() === 'm') $('mute').click();
  if (event.key.toLowerCase() === 'f' && engine && !busy) $('fullscreen').click();
});
let dragDepth = 0;
document.addEventListener('dragenter', (event) => {
  if (!event.dataTransfer.types.includes('Files')) return;
  event.preventDefault();
  dragDepth++;
  document.body.classList.add('dragging');
});
document.addEventListener('dragover', (event) => { event.preventDefault(); });
document.addEventListener('dragleave', (event) => {
  if (!event.dataTransfer.types.includes('Files')) return;
  if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('dragging'); }
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  const files = event.dataTransfer.files;
  if (files.length !== 1) return message('Drop one .tsrct project at a time.', true);
  void open(files[0]);
});
