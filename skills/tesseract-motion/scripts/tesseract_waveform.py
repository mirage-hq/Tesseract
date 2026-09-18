#!/usr/bin/env python3
"""Timestamped local waveform views and review candidates; never automatic edits."""
from array import array
import json
import math
import os
from pathlib import Path
import statistics
import sys
import tempfile

import tesseract_media as local

RATE = 48000
BIN_MS = 10
MAX_WINDOW_MS = 600000


def db(value):
    return round(20 * math.log10(value), 2) if value > 0 else None


def envelope(raw, channels, start_ms):
    """Keep channels separate: anti-phase stereo must not look like silence."""
    points = []
    frames = 0
    with Path(raw).open('rb') as f:
        while True:
            block = f.read(RATE * BIN_MS // 1000 * channels * 4)
            if not block:
                break
            if len(block) % (channels * 4):
                raise ValueError('Incomplete decoded audio frame.')
            samples = array('f', block)
            if sys.byteorder != 'little':
                samples.byteswap()
            if not all(math.isfinite(s) for s in samples):
                raise ValueError('Audio contains non-finite samples.')
            count = len(samples) // channels
            peaks, rms = [], []
            for c in range(channels):
                values = samples[c::channels]
                peaks.append(max(abs(s) for s in values))
                rms.append(math.sqrt(sum(s*s for s in values) / count))
            points.append({'start_ms': round(start_ms + frames * 1000 / RATE, 3),
                           'end_ms': round(start_ms + (frames + count) * 1000 / RATE, 3),
                           'channel_peak_dbfs': [db(v) for v in peaks],
                           'channel_rms_dbfs': [db(v) for v in rms]})
            frames += count
    if not points:
        raise ValueError('No audio in the requested window.')
    return points, frames


def peak(point):
    return max((v for v in point['channel_peak_dbfs'] if v is not None), default=-160)


def rms(point):
    return max((v for v in point['channel_rms_dbfs'] if v is not None), default=-160)


def candidates(points, mode, quiet_db, min_quiet_ms):
    quiet, begin = [], None
    for i, p in enumerate(points):
        low = peak(p) < quiet_db
        if low and begin is None:
            begin = p['start_ms']
        if begin is not None and (not low or i == len(points)-1):
            end = p['end_ms'] if low else p['start_ms']
            if end - begin >= min_quiet_ms:
                quiet.append({'start_ms': begin, 'end_ms': end})
            begin = None
    result = {'quiet_intervals': quiet}
    if mode != 'music':
        return result
    # Abrupt short-window energy rises, not beat/downbeat or tempo estimation.
    levels = [rms(p) for p in points]
    accents = []
    for i in range(1, len(points)):
        previous = statistics.median(levels[max(0, i-10):i])
        rise = levels[i] - max(previous, -80)
        if levels[i] > -45 and rise >= 6 and levels[i] - levels[i-1] >= 3:
            if not accents or points[i]['start_ms'] - accents[-1]['time_ms'] >= 120:
                accents.append({'time_ms': points[i]['start_ms'], 'rise_db': round(rise, 2)})
    # Compare one-second neighborhoods; do not label these as semantic sections.
    changes = []
    for i in range(100, len(points)-100, 25):
        before = statistics.mean(max(v, -80) for v in levels[i-100:i])
        after = statistics.mean(max(v, -80) for v in levels[i:i+100])
        delta = after - before
        if abs(delta) >= 6:
            changes.append({'time_ms': points[i]['start_ms'], 'energy_change_db': round(delta, 2)})
    selected = []
    for candidate in sorted(changes, key=lambda v: -abs(v['energy_change_db'])):
        if all(abs(candidate['time_ms'] - v['time_ms']) >= 1500 for v in selected):
            selected.append(candidate)
    changes = sorted(selected, key=lambda v: v['time_ms'])
    result.update({'accent_candidates': accents, 'energy_change_candidates': changes})
    return result


def draw_filter(report):
    width, height, left, top = 1320, 360, 60, 86
    start, end = report['window_start_ms'], report['window_end_ms']
    def x(t):
        return left + min(width-1, max(0, round(width * (t-start) / (end-start))))
    diagnostic_font = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
    font_option = f"fontfile='{diagnostic_font}':" if diagnostic_font.is_file() else ''
    def label(text, px, py, size=18, color='0xe5e7eb'):
        # Only internally generated labels/numbers are passed into filter syntax.
        return f"drawtext={font_option}text='{text}':expansion=none:fontsize={size}:fontcolor={color}:x={px}:y={py}"
    filters = [f'showwavespic=s={width}x{height}:split_channels=1:colors=0x7dd3fc|0xc4b5fd|0x86efac|0xfda4af|0xfde68a|0x67e8f9|0xd8b4fe|0xfdba74:scale=sqrt:filter=peak',
               'format=rgb24', f'pad=1440:560:{left}:{top}:color=0x111827']
    for i in range(7):
        px = left + round((width-1)*i/6)
        t = start + (end-start)*i/6
        filters.append(f'drawbox=x={px}:y={top}:w=1:h={height}:color=white@0.15:t=fill')
        filters.append(label(f'{t/1000:.3f}s', f'{px}-text_w/2', top+height+12, 17))
    marks = report['candidates']
    # Overview markers are capped for readability; JSON keeps every candidate.
    for q in marks['quiet_intervals'][:100]:
        filters.append(f"drawbox=x={x(q['start_ms'])}:y={top+height-8}:w={max(1,x(q['end_ms'])-x(q['start_ms']))}:h=8:color=0x86efac:t=fill")
    for q in marks.get('accent_candidates', [])[:100]:
        filters.append(f"drawbox=x={x(q['time_ms'])}:y={top}:w=1:h={height}:color=0xfbbf24@0.55:t=fill")
    for q in marks.get('energy_change_candidates', [])[:100]:
        filters.append(f"drawbox=x={x(q['time_ms'])}:y={top}:w=2:h={height}:color=0xf472b6@0.85:t=fill")
    for t in report['review_markers_ms']:
        filters.append(f'drawbox=x={x(t)}:y={top}:w=2:h={height}:color=white:t=fill')
    for c in range(report['channels']):
        filters.append(label(f'CH {c+1}', left+8, top+c*height//report['channels']+6, 13))
    filters.append(label(f"{report['mode'].upper()} WAVEFORM - {report['clock'].upper()} TIME", 60, 22, 24))
    filters.append(label('Seconds from media start / separate channels / square-root amplitude / no gain normalization', 60, 57, 16, '0x9ca3af'))
    if report['mode'] == 'music':
        legend = 'Gold = accent candidates   Pink = energy shifts   Green = quiet intervals   White = review markers'
    else:
        legend = 'Green = quiet candidates across ALL channels   White = review markers   Quiet does not mean safe to cut'
    filters.append(label(legend, 60, 492, 17))
    filters.append(label('Open and inspect this image. Listen before confirming a beat or edit. Zoom around speech cuts.', 60, 525, 16, '0x9ca3af'))
    return ','.join(filters)


def waveform(path, output, report_path=None, mode='music', start_ms=0, duration_ms=None,
             quiet_db=-45, min_quiet_ms=200, markers_ms=(), clock='source', audio_stream=0):
    if mode not in ('music', 'speech') or clock not in ('source', 'edit'):
        raise ValueError('Use music/speech mode and source/edit clock.')
    if start_ms < 0 or not math.isfinite(quiet_db) or not -90 <= quiet_db <= -15:
        raise ValueError('Start must be nonnegative; quiet threshold must be -90 to -15 dBFS.')
    if min_quiet_ms < BIN_MS or min_quiet_ms > MAX_WINDOW_MS:
        raise ValueError('Quiet duration must be 10 to 600000 ms.')
    src = local.existing(path)
    out = local.output_path(output)
    if out.suffix.lower() != '.png':
        raise ValueError('Use .png for the waveform view.')
    dest = local.output_path(report_path or out.with_suffix('.json'))
    if dest == out or dest.suffix.lower() != '.json':
        raise ValueError('Use a distinct .json report path.')
    meta = json.loads(local.run([local.external('ffprobe'), '-v', 'error', '-show_streams', '-show_format', '-of', 'json', src], 30))
    streams = [s for s in meta.get('streams', []) if s.get('codec_type') == 'audio']
    if audio_stream < 0 or audio_stream >= len(streams):
        raise ValueError('Requested audio stream does not exist; probe the file first.')
    stream = streams[audio_stream]
    channels = int(stream['channels'])
    if not 1 <= channels <= 8:
        raise ValueError('Waveform views support 1 to 8 channels per audio stream.')
    fmt = meta.get('format', {})
    origin = float(fmt.get('start_time') or 0)
    media_duration = float(fmt['duration']) * 1000 if fmt.get('duration') else None
    if duration_ms is None:
        if media_duration is None:
            raise ValueError('Duration unknown; provide --duration-ms.')
        duration_ms = math.ceil(media_duration) - start_ms
    if not 0 < duration_ms <= MAX_WINDOW_MS:
        raise ValueError('Choose a window of 1 to 600000 ms; split long media into labeled ranges.')
    if media_duration is not None and start_ms >= media_duration:
        raise ValueError('Window starts after the end of the media.')
    markers = sorted(set(markers_ms))
    if len(markers) > 48 or any(not math.isfinite(t) or not start_ms <= t < start_ms+duration_ms for t in markers):
        raise ValueError('Use up to 48 review markers within the requested window.')
    with tempfile.TemporaryDirectory(prefix='.tesseract-waveform-', dir=out.parent) as tmp:
        raw = Path(tmp)/'segment.f32'
        # Preserve timestamps relative to the container origin, including delayed audio.
        # Resampling fills timestamp gaps; no mono summing or level normalization occurs.
        af = (f'asetpts=PTS-({origin:.9f})/TB,aresample={RATE}:async=1:first_pts=0,'
              f'atrim=start_sample={start_ms*RATE//1000}:end_sample={(start_ms+duration_ms)*RATE//1000},asetpts=PTS-STARTPTS')
        local.run([local.external('ffmpeg'), '-v', 'error', '-nostdin', '-n', '-copyts', '-i', src,
                   '-map', f'0:a:{audio_stream}', '-vn', '-af', af, '-t', f'{duration_ms/1000:.6f}',
                   '-c:a', 'pcm_f32le', '-f', 'f32le', raw])
        points, frames = envelope(raw, channels, start_ms)
        end = round(start_ms+frames*1000/RATE, 3)
        if any(t >= end for t in markers):
            raise ValueError('A review marker is beyond the decoded audio window.')
        report = {'input': str(src), 'input_sha256': local.sha256(src), 'mode': mode, 'clock': clock,
                  'audio_stream_ordinal': audio_stream, 'container_origin_seconds': origin,
                  'channels': channels, 'analysis_sample_rate': RATE, 'envelope_bin_ms': BIN_MS,
                  'window_start_ms': start_ms, 'window_end_ms': end,
                  'requested_duration_ms': duration_ms, 'decoded_duration_ms': round(frames*1000/RATE, 3),
                  'quiet_threshold_dbfs': quiet_db, 'min_quiet_ms': min_quiet_ms,
                  'review_markers_ms': markers, 'image': str(out), 'report': str(dest),
                  'candidates': candidates(points, mode, quiet_db, min_quiet_ms), 'envelope': points,
                  'interpretation': 'All timestamps are milliseconds from the input media start on the labeled clock. Quiet intervals require every channel below the peak threshold. Accent and energy candidates are heuristics, not beat/downbeat, word-boundary, or section detection. Inspect the PNG, zoom and listen; never auto-delete candidates. No source or project was changed.'}
        png, js = Path(tmp)/'waveform.png', Path(tmp)/'waveform.json'
        local.run([local.external('ffmpeg'), '-v', 'error', '-nostdin', '-n', '-f', 'f32le', '-ar', str(RATE),
                   '-ac', str(channels), '-i', raw, '-filter_complex', draw_filter(report),
                   '-frames:v', '1', '-update', '1', png])
        js.write_text(json.dumps(report, indent=2)+'\n')
        # No incomplete-looking deliverable after processing failure; refuse races too.
        os.link(png, out)
        try:
            os.link(js, dest)
        except OSError:
            out.unlink()
            raise
    # Return small tool output; detailed envelope is in the JSON sidecar.
    return {k:v for k,v in report.items() if k != 'envelope'}
