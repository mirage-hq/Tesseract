import init, { TesseractEngine } from "./runtime/web_api.js";
import {
  bounceActions,
  curveRange,
  GRAVITY_CURVE,
  HALF_BOUNCE_MS,
} from "./motion.js";

const $ = (id) => document.getElementById(id);
let opened, compositionId, curve, height, duration;
let time = 400,
  playing = false,
  dirty = false;
let startTime, startClock, frame, renderTask, drag;
let speed = 1;
const pendingActions = new Map();
const colorLayers = [
  ["ball", 1],
  ["background", 3],
];

function message(text, failed = false) {
  $("status").textContent = text;
  $("status").setAttribute("role", failed ? "alert" : "status");
}

function viewY(value) {
  const [min, max] = curveRange(curve);
  return 24 + ((max - value) / (max - min)) * 232;
}

function drawCurve() {
  $("curve-values").textContent =
    `(${curve.map((value) => value.toFixed(2)).join(", ")})`;
  const [x1, y1, x2, y2] = curve;
  const a = [32 + 256 * x1, viewY(y1)];
  const b = [32 + 256 * x2, viewY(y2)];
  const startY = viewY(0),
    endY = viewY(1);
  $("curve-line").setAttribute("d", `M32 ${startY} C${a} ${b} 288 ${endY}`);
  $("tangents").setAttribute("d", `M32 ${startY} L${a} M288 ${endY} L${b}`);
  $("curve-guide").setAttribute("d", `M32 ${startY} L288 ${endY}`);
  $("curve-start").setAttribute("cy", startY);
  $("curve-end").setAttribute("cy", endY);
  [a, b].forEach(([x, y], i) => {
    $(`handle-${i}`).setAttribute("cx", x);
    $(`handle-${i}`).setAttribute("cy", y);
    $(`handle-${i}`).setAttribute(
      "aria-label",
      `Curve handle ${i + 1}: ${curve[i * 2].toFixed(2)}, ${curve[i * 2 + 1].toFixed(2)}.`,
    );
  });
}
// Read the rendered ball's height so the indicator follows engine easing exactly.
function drawProgress(timeMs) {
  const bounds = opened
    .layerBounds(timeMs)
    .layers.find((layer) => layer.layerId === "1");
  if (!bounds) return;
  const centerY =
    bounds.points.reduce((sum, point) => sum + point[1], 0) /
    bounds.points.length;
  const phase = (timeMs % (2 * HALF_BOUNCE_MS)) / HALF_BOUNCE_MS;
  const x = 32 + 256 * (phase <= 1 ? phase : 2 - phase);
  const y = viewY((830 - centerY) / height);
  $("curve-dot").setAttribute("cx", x);
  $("curve-dot").setAttribute("cy", y);
  $("curve-playhead").setAttribute("d", `M${x} 24V256`);
}

function stop() {
  playing = false;
  cancelAnimationFrame(frame);
  $("play-icon").setAttribute("d", "m8 5 11 7-11 7z");
  $("play").setAttribute("aria-label", "Play");
  $("play").title = "Play";
}
// One render at a time. Rapid input replaces the pending action for that control.
async function render() {
  if (renderTask) return renderTask;
  renderTask = (async () => {
    let rendered;
    do {
      const actions = [...pendingActions.values()].flat();
      pendingActions.clear();
      if (actions.length) opened.applyBatch(actions);
      rendered = time;
      await opened.renderFrame(rendered);
      drawProgress(rendered);
    } while (pendingActions.size || rendered !== time);
  })();
  try {
    await renderTask;
  } finally {
    renderTask = undefined;
  }
}

function fail(error) {
  stop();
  message(error.message ?? String(error), true);
}

function edit(key, action) {
  if (!opened) return;
  pendingActions.set(key, action);
  dirty = true;
  message("");
  void render().catch(fail);
}

function editMotion() {
  drawCurve();
  edit("motion", bounceActions(compositionId, height, curve));
}
$("reset-curve").onclick = () => {
  curve = [...GRAVITY_CURVE];
  editMotion();
};
for (const [id, layerId] of colorLayers) {
  $(id).oninput = () =>
    edit(id, {
      type: "updateRectLayer",
      compositionId,
      layerId,
      values: {
        fillColor: [
          ...$(id)
            .value.slice(1)
            .match(/../g)
            .map((n) => parseInt(n, 16) / 255),
          1,
        ],
      },
    });
}
for (let i = 0; i < 2; i++) {
  const handle = $(`handle-${i}`);
  function update(x, y) {
    curve[i * 2] = Math.max(0, Math.min(1, x));
    curve[i * 2 + 1] = y;
    editMotion();
  }
  handle.onpointerdown = (event) => {
    if (!opened || event.button !== 0 || drag) return;
    event.preventDefault();
    // Keep pointer coordinates stable while the displayed range expands.
    drag = { pointerId: event.pointerId, range: curveRange(curve) };
    handle.setPointerCapture(event.pointerId);
  };
  handle.onpointermove = (event) => {
    if (
      drag?.pointerId !== event.pointerId ||
      !handle.hasPointerCapture(event.pointerId)
    )
      return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      $("curve").getScreenCTM().inverse(),
    );
    const [min, max] = drag.range;
    update((point.x - 32) / 256, max - ((point.y - 24) / 232) * (max - min));
  };
  handle.onpointerup = handle.onpointercancel = (event) => {
    if (drag?.pointerId !== event.pointerId) return;
    drag = undefined;
    if (handle.hasPointerCapture(event.pointerId))
      handle.releasePointerCapture(event.pointerId);
  };
  handle.onlostpointercapture = () => {
    drag = undefined;
  };
}

async function tick(now) {
  if (!playing) return;
  startClock ??= now;
  time = (startTime + (now - startClock) * speed) % duration;
  $("time").value = time;
  try {
    await render();
  } catch (error) {
    fail(error);
    return;
  }
  if (playing) frame = requestAnimationFrame(tick);
}
for (const [id, rate] of [
  ["slow", 0.5],
  ["normal", 1],
  ["fast", 1.5],
]) {
  $(id).onclick = () => {
    speed = rate;
    startTime = time;
    startClock = undefined;
    for (const option of ["slow", "normal", "fast"]) {
      $(option).setAttribute("aria-pressed", String(option === id));
    }
  };
}
$("play").onclick = () => {
  if (playing) return stop();
  playing = true;
  startTime = time;
  startClock = undefined;
  message("");
  $("play-icon").setAttribute("d", "M8 5v14M16 5v14");
  $("play").setAttribute("aria-label", "Pause");
  $("play").title = "Pause";
  frame = requestAnimationFrame(tick);
};
$("time").oninput = () => {
  stop();
  time = $("time").valueAsNumber;
  void render().catch(fail);
};
window.addEventListener("beforeunload", (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
try {
  const response = await fetch("./ball.tsrct");
  if (!response.ok)
    throw new Error(`Could not load ball.tsrct (${response.status})`);
  // The runtime loads WASM and opens the bundled project; edits stay in the engine.
  await init();
  opened = await TesseractEngine.create(await response.blob());
  const snapshot = opened.document();
  compositionId = snapshot.composition.id;
  duration = snapshot.duration * 1000;
  const keys = snapshot.composition.dynamics.entries.find(
    (e) => e.target.layerId === 1 && e.target.propertyType === "positionY",
  ).animator.keyframes;
  const easing = keys[1].easing;
  curve = [easing.x1, easing.y1, easing.x2, easing.y2];
  height = keys[0].value.value - keys[1].value.value;
  for (const [id, layerId] of colorLayers) {
    $(id).value =
      "#" +
      snapshot.composition.layers
        .find((l) => l.id === layerId)
        .rect.fillColor.slice(0, 3)
        .map((n) =>
          Math.round(n * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
  }
  $("time").max = duration - 1;
  drawCurve();
  await opened.connectCanvas($("preview"));
  await opened.loadResources();
  await opened.renderFrame(time);
  drawProgress(time);
  $("controls").disabled = $("play").disabled = $("time").disabled = false;
  message("");
} catch (error) {
  message(error.message ?? String(error), true);
}
