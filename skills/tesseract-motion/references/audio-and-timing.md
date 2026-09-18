# Audio and timing

Read [waveform editing](waveform-editing.md) before timing an edit to music or trimming dialogue. Use its local `waveform` command for timestamped overview/zoom PNGs, inspect those views, and verify music events and word boundaries by listening. Recheck changed speech joins on the rendered edit clock before final mixing.

## Listen to the source before mixing

Probe for audio streams, then audition the dialogue, important production sounds, and music. Preserve speech intelligibility and meaningful foley. A clip with an audio stream is not necessarily usable sound. Add appropriate local sound design as described in [sound design](sound-design.md); do not invent narration or replace deliberately chosen music.

When a transcript is supplied, align cuts to its actual source timestamps. If there is no local transcription tool and speech cannot be understood reliably, ask for the transcript or flag the limitation. Never invent spoken words or caption timing.

For uneven, noisy, boxy, or reverberant dialogue, read [speech cleanup](speech-cleanup.md) before processing. It covers source selection, EQ, dynamics, de-essing, room-sound limits, and matched-loudness review of local derivatives.

## Select or make a local accent

```bash
python3 "$SKILL/scripts/tesseract_sound.py" list
python3 "$SKILL/scripts/tesseract_sound.py" make --preset air-whoosh --duration-ms 600 --seed 12 --output /absolute/path/edit/.tesseract-work/whoosh-v1.wav
```

Generate a fresh WAV with `make`; no preset WAV files or rendering binaries are bundled. The helper contains soft-tap, dry-click, soft-pop, clear-ping, air-whoosh, short-riser, downlifter, and soft-impact. Each is a small procedural accent, not a music track or recorded foley. Listen in context before choosing it; the default file peak is −12 dBFS and does not establish its perceived mix level.

The helper creates and inspects local files. Import a selected cue, music track,
or cleaned dialogue derivative with `project import-asset --kind audio` before
adding its editable Audio layer. See [media import](media-import.md) for commands.
Import packages the bytes; placement and mixing are separate checkout/commit edits.

Use the imported asset ID in an Audio layer, with `captionsEnabled: false` for music/effects. Keep the cue's source interval inside the actual file and its active interval inside the composition. A cue peaking 300 ms into the file should start 300 ms before the visual event it punctuates. Trim/fade a tail near the edit's end rather than unintentionally extending the project.

## Local mix

New Video layers need `volume: 1.0` to enable embedded source audio at unity gain; omitted/null volume disables it. Preserve existing gains on revisions. FX `Audio` layers can place music, a supplied sound effect, or dialogue independently. They have no visual transform. A minimal source carries `assetId`; source and active ranges are explicit.

```json
{
  "id": 90,
  "name": "Supplied music bed",
  "type": "Audio",
  "activeRange": {"start": 0, "duration": 8000},
  "sourceRange": {"start": 1500, "duration": 8000},
  "sourceIntrinsicDuration": 30000,
  "source": {"assetId": "local-music-id"},
  "volume": 0.2,
  "captionsEnabled": false
}
```

Use the schema to check additional source metadata or per-channel features. Do not infer all audio effects of a DAW from the presence of an Audio layer.

`volume` is linear: unity is `1.0`; `0.5` is approximately −6 dB. Convert dB with `10 ** (dB / 20)`. A fixed value such as `0.2` is a starting point, not a calibrated mix target. Loud source material needs different gain.

## Envelopes and ducking

For an FX Audio layer, target `propertyType: "volume"` using `layerTimeJsCode`. This is called `AudioVolume` in Rust, but the JSON wire name is `volume`, not `audioVolume`. Explicit ramps prevent clicks and allow a music bed to duck under dialogue. For example, fade in, hold quietly during speech, then lift:

```js
var t = input.time.seconds;
function lerp(a,b,p){return a+(b-a)*Math.max(0,Math.min(1,p));}
if(t < 0.2) return lerp(0,0.12,t/0.2);
if(t < 3.8) return 0.12;
if(t < 4.2) return lerp(0.12,0.30,(t-3.8)/0.4);
if(t < 7.5) return 0.30;
return lerp(0.30,0,(t-7.5)/0.5);
```

A `volume` animator supplies the **final linear layer gain**, overriding the static `volume`; it is not automatically multiplied by that static value. Include the chosen bed level in every returned value.

Use `setFxPropertyAnimator` for the script, or supported volume keyframe actions
from the installed action schema. Apply them with `tsrct project apply`. For a
bed at −14 dB that ducks by 6 dB, return the linear equivalent of −20 dB during
speech. Set times from the actual dialogue, not the illustrative script above.
If a root Audio layer starts at project time 5s, its local 950 ms duck occurs at
project time 5.95s; account for ancestor playback when nested.

For another duration, change the envelope accordingly. The times are owner-layer-local. Moving the Audio layer should move the envelope with it.

## Native controls versus local audio preparation

This package supports native Audio layers, source/active timing, linear gain, and time-varying volume. Use envelopes for predictable ducking, fades, and planned dropouts. This is **timed ducking**, not an audio-reactive sidechain compressor.

Do not invent native `compressor`, `sidechain`, `EQ`, `pan`, or `truePeakLimiter` fields. When the source needs EQ/compression, prepare a new **local audio derivative** with installed FFmpeg, keep the original source and processing recipe, and import it with `project import-asset --kind audio` and mix it through Tesseract. Do not flatten the editable project or quietly change the original media.

For example, a gentle music presence dip can be auditioned with:

```bash
ffmpeg -nostdin -n -i /absolute/path/music.wav -af "equalizer=f=2000:t=q:w=0.8:g=-3" -ar 48000 -c:a pcm_s24le /absolute/path/music-presence-v1.wav
```

Real signal-driven ducking, when needed, can be prepared with FFmpeg `sidechaincompress` using **aligned full-length** music and dialogue stems, both starting at the same edit zero. Its first input is the music to process; the second is the dialogue detector. Preserve the separate dialogue track when assembling the Tesseract mix. Adjust threshold/ratio from the source, check attack/release and actual reduction, and do not apply both the preprocessed duck and a second unplanned native duck. Misaligned, trimmed, or short detector stems need alignment/padding first. A source with music and voice already mixed together is not a clean dialogue detector.

Use `ffmpeg -h filter=<name>` to verify the locally installed filter/options before processing. Filter behavior and available controls are described in the [official FFmpeg filter reference](https://ffmpeg.org/ffmpeg-filters.html#sidechaincompress).

## Editing sound

- An audio prelap or tail uses independent placement and source selection. Do not detach dialogue without retaining lip sync where the speaker is visible.
- Avoid duplicate playback from both a Video layer and a copied Audio layer. If moving sound into independent layers, deliberately mute the corresponding original audio.
- Use whooshes/impacts only for a movement or transition that benefits from them. A sound on every text entrance quickly becomes distracting.
- Preserve the selected music track's identity. Do not replace, regenerate, or globally retime supplied music unless the user asks.
- Speed-changing a group also changes descendant audio clocks. Check source duration and pitch/time-stretch behavior in the actual render instead of assuming a silent visual retime.

## Review

Listen to the final muxed video, not just separate audio files. Check the head and tail, dialogue-to-music balance, abrupt gain edges, and source synchronization. Measure loudness/peaks locally with FFmpeg if needed; for example `ffmpeg -i edit.mp4 -af ebur128=peak=true -f null -`. Treat readings as measurements, not proof that speech is intelligible. Keep reasonable peak headroom and follow an explicit delivery spec when one is provided.

## Measure and check the final delivery

```bash
python3 "$SKILL/scripts/tesseract_sound.py" measure /absolute/path/edit-v1.mp4 --report /absolute/path/edit/.tesseract-work/checks/loudness-v1.json
python3 "$SKILL/scripts/tesseract_sound.py" mobile-preview /absolute/path/edit-v1.mp4 --output /absolute/path/edit/.tesseract-work/checks/mobile-v1.wav
```

`measure` reports the first audio stream's integrated LUFS, true peak in dBTP, and loudness range; it does not normalize or modify the input. The working range is −16 to −14 LUFS and true peak at most −1 dBTP, subject to the actual delivery spec. Short isolated effects or silence may not have meaningful integrated measurements. If the deliverable has several audio programs, measure the intended stream explicitly with FFmpeg.

For mastering, first adjust the native mix. If final normalization is needed, preserve the editable mix, use a measured two-pass `loudnorm` process on a derived deliverable, and record the recipe. Check the local [loudnorm options](https://ffmpeg.org/ffmpeg-filters.html#loudnorm): use the measured input loudness, range, peak, threshold, and target offset from pass one in pass two, then remeasure the encoded output. Do not normalize each individual cue to the full-program LUFS target or erase an intentional dropout to satisfy a meter.

`mobile-preview` creates a separate mono, 150 Hz–7 kHz listening copy. It is useful for noticing disappearing bass-dependent cues, phase cancellation, or poor voice balance, but it is not the final mix and does not replace listening on an actual phone.
