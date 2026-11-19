# Audio and timing

The optional [sound helper](../scripts/tesseract_sound.py) uses Python 3.9+ and local FFmpeg/ffprobe.
It creates and inspects local files; it does not install a renderer or mutate a
project. If a tool is missing, report the unavailable check and use the host's
media tools where they can establish the same result.

Read [waveform editing](waveform-editing.md) before timing an edit to music or trimming dialogue. Use its local `waveform` command for timestamped overview/zoom PNGs, inspect those views, and verify music events and word boundaries by listening. Recheck changed speech joins on the rendered edit clock before final mixing.

## Listen to the source before mixing

Import reports metadata, not what a shot depicts or what its audio means. Probe
for streams with local FFmpeg tools:

```sh
ffprobe -v error -show_streams -show_format -of json /absolute/path/footage.mov
```

Then audition the dialogue, important production sounds, and music. Preserve speech intelligibility and meaningful foley. A clip with an audio stream is not necessarily usable sound. Add appropriate local sound design as described in [sound design](sound-design.md); do not invent narration or replace deliberately chosen music.

When a transcript is supplied, align cuts to its actual source timestamps. If there is no local transcription tool and speech cannot be understood reliably, ask for the transcript or flag the limitation. Never invent spoken words or caption timing.

For uneven, noisy, boxy, or reverberant dialogue, read [speech cleanup](speech-cleanup.md) before processing. It covers source selection, EQ, dynamics, de-essing, room-sound limits, and matched-loudness review of local derivatives.

## Select or make a local accent

```bash
python3 "$SKILL/scripts/tesseract_sound.py" list
python3 "$SKILL/scripts/tesseract_sound.py" make --preset air-whoosh --duration-ms 600 --seed 12 --output "$WORK/whoosh-v1.wav"
```

Generate a fresh WAV with `make`; no preset WAV files or rendering binaries are bundled. The helper contains soft-tap, dry-click, soft-pop, clear-ping, air-whoosh, short-riser, downlifter, and soft-impact. Each is a small procedural accent, not a music track or recorded foley. Listen in context before choosing it; the default file peak is −12 dBFS and does not establish its perceived mix level.

The helper creates and inspects local files. Import a selected cue, music track,
or cleaned dialogue derivative as audio before
adding its editable Audio layer. See [media import](media-import.md) for commands.
Import packages the bytes; placement and mixing are separate document edits.

Use the imported asset ID in an Audio layer, with `captionsEnabled: false` for music/effects. Keep the cue's source interval inside the actual file and its active interval inside the composition. A cue peaking 300 ms into the file should start 300 ms before the visual event it punctuates. Trim/fade a tail near the edit's end rather than unintentionally extending the project.

## Local mix

New Video layers need `volume: 1.0` to enable embedded source audio at unity gain; omitted/null volume disables it. Preserve existing gains on revisions. FX `Audio` layers can place music, a supplied sound effect, or dialogue independently. They have no visual transform. A minimal source carries `assetId`; in document JSON, the source range and windowed `playback` are explicit (Audio has no `activeRange`).

```json
{
  "id": 90,
  "name": "Supplied music bed",
  "type": "Audio",
  "playback": {"type": "windowed", "inputRange": {"start": 0, "duration": 8000},
    "mapping": {"type": "linear", "input": {"start": 0, "duration": 8000},
      "output": {"start": 0, "duration": 8000}}, "inputOffsetMs": 1500},
  "sourceRange": {"start": 1500, "duration": 8000},
  "sourceIntrinsicDuration": 30000,
  "source": {"assetId": "local-music-id"},
  "volume": 0.2,
  "captionsEnabled": false
}
```

Use the schema to check additional source metadata or per-channel features.
Every Audio and Video layer also has a mixer channel with pan, insert effects and automation; see [native processing](#native-controls-versus-local-audio-preparation).

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
from the installed action schema. Apply them as an action batch. For a
bed at −14 dB that ducks by 6 dB, return the linear equivalent of −20 dB during
speech. Set times from the actual dialogue, not the illustrative script above.
If a root Audio layer starts at project time 5s, its local 950 ms duck occurs at
project time 5.95s; account for ancestor playback when nested.

For another duration, change the envelope accordingly. The times are owner-layer-local. Moving the Audio layer should move the envelope with it.

## Native controls versus local audio preparation

This package supports native Audio layers, source/active timing, linear gain, and time-varying volume. Use envelopes for predictable ducking, fades, and planned dropouts. This is **timed ducking**, not an audio-reactive sidechain compressor.

Every track, Audio and Video layer and the master also has a native mixer channel: a trim, pan, mute and solo and an ordered chain of insert effects (EQ, compressor, limiter, gate, de-esser, plosive remover, noise reduction, multiband compressor, reverb, delay, chorus, flanger, phaser, distortion and binaural placement), and automation moves them over time. Use these for EQ, dynamics, pan and peak limiting instead of FFmpeg derivatives, for example a gentle presence dip as an EQ bell on the music. To rebalance a layer whose `volume` is animated or keyed, set its mixer `trimDb` (a static gain in dB the animation doesn't replace) instead of rewriting the envelope or rescaling its keys. Read [DAW mixer](daw-mixer.md) and [DAW automation](daw-automation.md), and take exact fields from the action schema. To duck music under speech, key a compressor on the music's track by the dialogue's track or layer ([sidechain](daw-mixer.md#sidechain)); use gain automation or envelopes for a planned duck. There is no dereverberation; see [speech cleanup](speech-cleanup.md).

## Editing sound

- An audio prelap or tail uses independent placement and source selection. Do not detach dialogue without retaining lip sync where the speaker is visible.
- Avoid duplicate playback from both a Video layer and a copied Audio layer. If moving sound into independent layers, deliberately mute the corresponding original audio.
- Use whooshes/impacts only for a movement or transition that benefits from them. A sound on every text entrance quickly becomes distracting.
- Preserve the selected music track's identity. Do not replace, regenerate, or globally retime supplied music unless the user asks.
- Speed-changing a group also changes descendant audio clocks. Check source duration and pitch/time-stretch behavior in the actual render instead of assuming a silent visual retime.

## Review

Listen to the final muxed video, not just separate audio files. Check the head and tail, dialogue-to-music balance, abrupt gain edges, and source synchronization.
Measure loudness and peaks from `tsrct export --json`'s `encodedAudio`, as [measure and check the final delivery](#measure-and-check-the-final-delivery) describes.
Treat readings as measurements, not proof that speech is intelligible. Keep reasonable peak headroom and follow an explicit delivery spec when one is provided.

For a dialogue-only diagnostic, check out the working document and commit a
separate `.tsrct` copy with music/SFX gains and any gain animators muted. Export
that copy's audio with `export-audio` and inspect it with the waveform helper.
Preserve the working mix and source files; do not claim unperformed listening checks.

## Measure and check the final delivery

Measure the file you deliver, not the mix: AAC can raise a limited mix's true peak by half a decibel. `tsrct export --json` reports the encoded audio's levels in its result's `encodedAudio`: `integratedLufs` and `truePeakDbtp`, measured as the `export-audio` report measures the mix, after decoding the AAC the export wrote (`null` when it has no audio). Set the AAC bitrate with `--audio-bitrate` in kb/s: 128 by default, 256 or 320 for music; `tsrct export --help` lists the rates it takes.

```bash
tsrct export --project /absolute/path/edit.tsrct --output /absolute/path/edit-v1.mp4 --audio-bitrate 256 --json
python3 "$SKILL/scripts/tesseract_sound.py" mobile-preview /absolute/path/edit-v1.mp4 --output "$WORK/checks/mobile.wav" --overwrite
```

The helper never replaces an existing file unless you pass `--overwrite`, which works only inside `WORK`; use it for routine checks such as this, which each pass refreshes.

The working range is −16 to −14 LUFS and true peak at most −1 dBTP, subject to the actual delivery spec. Short isolated effects or silence may not have meaningful integrated measurements.

When the encoded audio misses the spec, fix the native mix and export again: lower the master's limiter ceiling or output gain for the true peak, and adjust the master's gain for loudness. Do not re-encode, normalize or replace the exported audio with FFmpeg, and do not normalize each individual cue to the full-program LUFS target or erase an intentional dropout to satisfy a meter.

`mobile-preview` creates a separate mono, 150 Hz–7 kHz listening copy. It is useful for noticing disappearing bass-dependent cues, phase cancellation, or poor voice balance, but it is not the final mix and does not replace listening on an actual phone.
