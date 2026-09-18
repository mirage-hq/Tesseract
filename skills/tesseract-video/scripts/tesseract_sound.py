#!/usr/bin/env python3
"""Local sound accents and mix inspection; no account, download, or paid service."""
import argparse
from array import array
import json
import math
from pathlib import Path
import random
import re
import subprocess
import sys
import wave

import tesseract_media as local
import tesseract_waveform

RATE = 48000
PRESETS = {
    "soft-tap": (100, "micro", "Muted tactile accent for a button or product contact."),
    "dry-click": (65, "micro", "Short bright tick for a precise graphic event."),
    "soft-pop": (180, "micro", "Rounded accent for a small reveal; avoid every text entry."),
    "clear-ping": (480, "micro", "Light two-partial tone for a meaningful confirmation."),
    "air-whoosh": (450, "transition", "Filtered air sweep; align its peak to the movement."),
    "short-riser": (1100, "transition", "Brief building texture into a reveal, with a clean end."),
    "downlifter": (800, "transition", "Descending texture after a scene change."),
    "soft-impact": (400, "transition", "Low hit with audible upper harmonics for small speakers."),
}


def synthesize(name, duration_ms, peak_db=-12.0, seed=0):
    if name not in PRESETS or not 40 <= duration_ms <= 4000:
        raise ValueError("Use a listed preset and a duration from 40 to 4000 ms.")
    if not math.isfinite(peak_db) or not -60 <= peak_db <= -3:
        raise ValueError("Cue peak must be between -60 and -3 dBFS; leave mix headroom.")
    rng = random.Random(seed)
    count = round(RATE * duration_ms / 1000)
    samples, phase, smooth = [], 0.0, 0.0
    duration = count / RATE
    for i in range(count):
        t = i / RATE
        u = i / (count - 1)
        noise = rng.uniform(-1.0, 1.0)
        smooth += 0.12 * (noise - smooth)
        bright = noise - smooth
        if name == "soft-tap":
            value = (0.8 * smooth + 0.2 * math.sin(2 * math.pi * 420 * t)) * math.exp(-8 * u)
        elif name == "dry-click":
            value = bright * math.exp(-15 * u)
        elif name == "soft-pop":
            phase += 2 * math.pi * (210 + 850 * math.exp(-20 * u)) / RATE
            value = (math.sin(phase) + 0.13 * bright) * math.exp(-7 * u)
        elif name == "clear-ping":
            value = (math.sin(2 * math.pi * 1100 * t) + 0.25 * math.sin(2 * math.pi * 1650 * t)) * math.exp(-6 * u)
        elif name == "soft-impact":
            phase += 2 * math.pi * (65 + 170 * math.exp(-12 * u)) / RATE
            value = (math.sin(phase) + 0.3 * math.sin(2 * phase) + 0.25 * bright * math.exp(-35 * u)) * math.exp(-7 * u)
        else:
            amount = u if name == "short-riser" else 1-u if name == "downlifter" else math.sin(math.pi * u)
            phase += 2 * math.pi * (500 + 1900 * amount * amount) / RATE
            value = (0.7 * smooth + 0.12 * bright + 0.06 * math.sin(phase)) * amount ** 1.7
        # Brief ramps remove hard waveform discontinuities without dulling the cue.
        fade = min(1.0, t / 0.002, (duration - 1/RATE - t) / 0.008)
        samples.append(value * max(0.0, fade))
    peak = max(abs(x) for x in samples)
    scale = 10 ** (peak_db / 20) / peak
    return array("h", (round(x * scale * 32767) for x in samples))


def save_cue(name, path, duration_ms=None, peak_db=-12.0, seed=0):
    duration_ms = PRESETS[name][0] if duration_ms is None else duration_ms
    samples = synthesize(name, duration_ms, peak_db, seed)
    output = local.output_path(path)
    if output.suffix.lower() != ".wav":
        raise ValueError("Local procedural cues are PCM WAV files; use .wav.")
    if sys.byteorder != "little":
        samples.byteswap()
    with output.open("xb") as f:
        with wave.open(f, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(samples.tobytes())
    return {"path": str(output), "preset": name, "duration_ms": duration_ms,
            "sample_peak_dbfs": peak_db, "seed": seed,
            "origin": "Locally synthesized from oscillators and seeded noise; no recorded samples."}


def measure(path):
    src = local.existing(path)
    result = subprocess.run([local.external("ffmpeg"), "-hide_banner", "-nostdin", "-i", str(src),
        "-map", "0:a:0", "-af", "loudnorm=I=-15:TP=-1:LRA=7:print_format=json",
        "-f", "null", "-"], capture_output=True, text=True, timeout=600)
    if result.returncode:
        raise RuntimeError(result.stderr[-2500:])
    candidates = re.findall(r'\{\s*"input_i".*?\}', result.stderr, re.S)
    if not candidates:
        raise RuntimeError("FFmpeg did not return loudness measurements.")
    raw = json.loads(candidates[-1])
    def finite(key):
        v = float(raw[key])
        return v if math.isfinite(v) else None
    il, tp = finite("input_i"), finite("input_tp")
    return {"path": str(src), "audio_stream": "first audio stream", "integrated_lufs": il,
            "true_peak_dbtp": tp, "loudness_range_lu": finite("input_lra"),
            "working_target": {"integrated_lufs": [-16, -14], "true_peak_max_dbtp": -1},
            "within_working_target": il is not None and tp is not None and -16 <= il <= -14 and tp <= -1,
            "note": "Measurement only. Targets are a social-edit starting point, not a platform guarantee. Listen to the mix; silence/very short cues may not have meaningful integrated loudness."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list")
    p = sub.add_parser("make")
    p.add_argument("--preset", choices=PRESETS, required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--duration-ms", type=int)
    p.add_argument("--peak-db", type=float, default=-12)
    p.add_argument("--seed", type=int, default=0)
    p = sub.add_parser("measure")
    p.add_argument("input")
    p.add_argument("--report")
    p = sub.add_parser("waveform", help="Labeled waveform PNG + JSON candidates for music or speech review")
    p.add_argument("input")
    p.add_argument("--output", required=True)
    p.add_argument("--report")
    p.add_argument("--mode", choices=("music", "speech"), required=True)
    p.add_argument("--start-ms", type=int, default=0)
    p.add_argument("--duration-ms", type=int)
    p.add_argument("--quiet-db", type=float, default=-45)
    p.add_argument("--min-quiet-ms", type=int, default=200)
    p.add_argument("--markers-ms", help="Comma-separated times on the input file clock; mark proposed cuts or accents")
    p.add_argument("--clock", choices=("source", "edit"), default="source")
    p.add_argument("--audio-stream", type=int, default=0, help="Zero-based audio stream ordinal")
    p = sub.add_parser("mobile-preview")
    p.add_argument("input")
    p.add_argument("--output", required=True)
    args = parser.parse_args()
    if args.command == "list":
        local.emit([{"preset": k, "duration_ms": v[0], "role": v[1], "use": v[2]} for k,v in PRESETS.items()])
    elif args.command == "make":
        local.emit(save_cue(args.preset, args.output, args.duration_ms, args.peak_db, args.seed))
    elif args.command == "measure":
        report = measure(args.input)
        if args.report:
            local.write_json(args.report, report)
        local.emit(report)
    elif args.command == "waveform":
        markers = [float(x) for x in args.markers_ms.split(",")] if args.markers_ms else []
        local.emit(tesseract_waveform.waveform(args.input, args.output, args.report, args.mode,
            args.start_ms, args.duration_ms, args.quiet_db, args.min_quiet_ms, markers,
            args.clock, args.audio_stream))
    else:
        src = local.existing(args.input)
        if Path(args.output).suffix.lower() != ".wav":
            raise ValueError("Use .wav for the diagnostic listening copy.")
        p = local.atomic_run(args.output, lambda tmp: [local.external("ffmpeg"), "-hide_banner", "-nostdin", "-n",
            "-i", src, "-map", "0:a:0", "-vn", "-af", "aformat=channel_layouts=mono,highpass=f=150,lowpass=f=7000",
            "-ar", "48000", "-c:a", "pcm_s16le", tmp])
        local.emit({"output": str(p), "purpose": "Mono, band-limited diagnostic copy. Not the deliverable or an exact phone simulation."})
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError, OSError, subprocess.TimeoutExpired) as error:
        print(f"tesseract-sound: {error}", file=sys.stderr)
        raise SystemExit(1)
