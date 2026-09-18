# Edit with the audio waveform

Use the waveform as an editing view, alongside listening and the filmstrip. When music is supplied or generated first, inspect it **before deciding picture and motion timing**. When trimming talking footage, inspect its source audio **before cutting** and check the rendered joins afterward. Generating the image is only preparation: open it with the host's image-view tool and record what it shows.

## Generate an overview, then zoom

The local sound helper accepts audio files or the audio inside a video. It writes a labeled PNG and a JSON sidecar containing 10 ms per-channel peak/RMS measurements and candidate markers. It does not alter the source, transcribe speech, or edit a project.

```bash
# Inspect the selected music before planning the visual beats.
python3 "$SKILL/scripts/tesseract_sound.py" waveform /absolute/path/music.wav --mode music --output /absolute/path/edit/.tesseract-work/checks/music-overview.png

# Inspect a range of talking footage; times remain relative to the SOURCE file.
python3 "$SKILL/scripts/tesseract_sound.py" waveform /absolute/path/talking.mov --mode speech --start-ms 12000 --duration-ms 8000 --output /absolute/path/edit/.tesseract-work/checks/speech-source.png

# Zoom around proposed source cuts, keeping the original timestamps on the axis.
python3 "$SKILL/scripts/tesseract_sound.py" waveform /absolute/path/talking.mov --mode speech --start-ms 14500 --duration-ms 1800 --markers-ms 15080,15720 --output /absolute/path/edit/.tesseract-work/checks/speech-cut-check.png

# Inspect the RENDERED edit around the new join, on the EDIT file's clock.
python3 "$SKILL/scripts/tesseract_sound.py" waveform /absolute/path/edit/dialogue-v2.wav --mode speech --clock edit --start-ms 2000 --duration-ms 2000 --markers-ms 3100 --output /absolute/path/edit/.tesseract-work/checks/join-v2.png
```

Choose ranges and markers from the actual material; the times above are syntax examples. Default is the whole input, up to ten minutes per view. Split longer material into labeled ranges; even shorter overviews need zooms for word boundaries. Use `--audio-stream N` to select a zero-based audio-stream ordinal after probing files with multiple audio tracks. Prefer an isolated dialogue track over a camera scratch mix with background music.

The display separates channels, uses a square-root amplitude scale to expose quieter details, and does not normalize gain. Gold lines are transient/energy-rise candidates, pink lines are approximate energy changes, green bars are low-energy intervals, and white lines are the requested review markers. The plot caps each candidate category at 100 markers for legibility; all candidates remain in JSON. Threshold comparisons use the original decoded sample levels, not display height. Numeric timestamps in JSON are authoritative; use the image to see their context.

A `--clock edit` label means the input is an exported edit or stem. It does **not** convert source time to project time. A short preview file begins at zero on its own clock; add its project-range offset explicitly. The helper preserves delayed audio relative to the container start and fills timestamp gaps for inspection. A requested window can end at audio EOF; check the reported actual window. No audio stream is a missing input, not a silent waveform.

## Music first: give the edit a musical structure

1. Open the overview and listen to the selected track. Identify the first usable downbeat, recurring accents, phrase lengths, builds, breaks/dropouts, drops, arrangement changes, and the ending. The waveform helps locate them; a loud transient might be a snare or sound effect, and a new section can begin without getting louder.
2. Use the helper's accent and energy-change candidates as places to investigate. Zoom around important arrivals and audition them. Confirm a beat grid over several bars if useful; check for half/double-time errors, swing, pickups, and tempo changes. Do not assume every peak is a beat or infer a definitive BPM/section map from these heuristics. A dense mastered track may need listening to establish most of the map.
3. Save a small `audio-map.json` or table with music-source time, edit time, confirmed event, and intended visual action. Plan the opening, scene changes, product reveal, motion arrival, and ending against this map. Choose a few meaningful accents; cuts on every beat quickly become mechanical. Motion can start before a beat so its arrival lands on it.
4. Keep the chosen music and its recognizable phrases intact unless the brief calls for a music edit. When shortening it, cut at compatible phrase boundaries, audition the join, and preserve release/reverb tails. Do not globally time-stretch footage or speech to force alignment.
5. Recheck the picture against the music after timing changes. Pair the audio map with filmstrip samples, then play the assembled video with sound; a still image cannot prove synchronization or rhythm.

For music played at normal speed, `edit_time = layer_edit_start + music_source_time - selected_music_source_start`. For a constant source playback rate `r`, divide that source-time difference by `r`. Variable speed requires the actual time mapping; do not use the simple formula across a speed ramp. Preserve separate source, project, and layer clocks when authoring native timing.

## Talking footage: tighten pauses without damaging words

1. Audition the source and read any supplied transcript. Identify complete thoughts, meaningful emphasis, and pauses that can be shortened. Make a speech waveform view before changing source ranges. Never fabricate a transcript or assume quiet pixels mean no speech.
2. Inspect candidate pauses. By default, a green interval means **all channels** stay below a −45 dBFS sample-peak threshold for at least 200 ms, measured in 10 ms bins. Adjust `--quiet-db` and `--min-quiet-ms` for the recording; these are candidate settings, not universal speech thresholds. Quiet consonants, trailing syllables, breaths, and room tone can sit below a threshold. Constant noise or music can hide real pauses.
3. Zoom to roughly 0.5–2 seconds around each intended boundary and listen to the surrounding words. Choose trims in verified gaps, retaining enough lead-in and tail for consonants and natural breathing. Approximately 50–120 ms of handles is a useful first audition, not guaranteed protection. Keep longer pauses that carry meaning. Shorten an awkward pause rather than automatically deleting all silence.
4. Update video and its linked source audio together. Preserve source in/out points and edit positions. At video-frame boundaries, favor retaining a little more material over clipping a word. Use a deliberate J/L cut or room-tone bridge when it improves continuity, with source handles intact. Tiny fades may prevent clicks; fades and crossfades cannot restore missing phonemes and must not blur adjacent words.
5. Render the changed dialogue and inspect its waveform around every changed join, marked on the edit clock. Listen to the previous word, the join, and the next word at normal speed, with music muted first; inspect video frames for jump cuts and lip sync. Then listen in the full mix. Check word completeness, breathing, pacing, clicks, doubled syllables, and any new silence. Correct and re-render the affected range before continuing.

Use a temporary `.tsrct` copy with music/SFX gains and gain animators muted, export a dialogue-only MP4 with `tsrct export`, and pass that MP4 directly to the waveform helper. Preserve the working mix and original source; the CLI has no audio-only export command. For very short preview exports, retain the offset from preview time to full project time in the review notes.

## Record the actual checks

Record the revision, source file/stream, inspected ranges, confirmed music events
or speech boundaries, source-to-edit mapping, and what changed after review.
Waveforms support visual and auditory judgment; they do not establish intact words or a good mix on their own. If the host cannot audition audio, state that speech cuts and musical timing remain unverified instead of claiming they passed.

All analysis is local with Python's standard library and local FFmpeg/ffprobe. PNG labeling uses FFmpeg's `drawtext` filter and a locally available diagnostic font; project typography still uses fonts packaged with `project import-font`. No new service, model, upload, or paid generation is involved.
