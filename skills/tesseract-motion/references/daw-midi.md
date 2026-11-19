# DAW MIDI: clips, notes, instruments and tempo

These actions write music: MIDI tracks and their instruments, MIDI clips, their notes and sustain pedal, and the composition's tempo and time signatures. Read [daw/tracks](daw-tracks.md) for tracks in general and [daw/mixer](daw-mixer.md) for gain, pan and effects.

## Ticks, tempo and bars

MIDI is placed in ticks: 960 per quarter note. Each composition has one tempo map, `tempo`; without one it plays at 120 BPM in 4/4. Tick 0 sits at the map's `anchorMs` in composition time, 0 for a new composition. `bpm` always counts quarter notes per minute.

Bars and beats follow the time signatures. A beat is the meter's denominator note: 4/4 has four beats of 960 ticks, 6/8 six beats of 480 ticks. At 120 BPM in 4/4 a beat lasts 500 ms and a bar 3840 ticks (2 s); bar 3 starts at tick 7680.

## Positions

Clip edges and split points are positions, each resolved to a whole tick on
the tempo map when the action applies:

- `{"type": "tick", "tick": 7680}`: a composition tick.
- `{"type": "barBeat", "bar": 3, "beat": 1, "tick": 0}`: bar and beat from 1,
  plus ticks into the beat (`tick` defaults to 0). A beat past its bar's
  meter, or a tick past its beat, is rejected.
- `{"type": "time", "timeMs": 4000}`: project time in milliseconds, at the
  nearest tick. It must not fall before the composition's start or the tempo
  map's anchor.

## MIDI tracks and instruments

`createFxTrackLayer` with `"kind": "midi"` creates a MIDI track with its `instrument`. `setFxMidiTrackInstrument` replaces a MIDI track's instrument (`trackLayerId`, `instrument`), keeping its clips, gain, mixer and `preset` provenance. Instrument, oscillator, modulation-envelope, LFO, modulation-route, sampler-zone and drum-pad ids share the composition's FX item-id space with EQ bands; new ones must be unused (an instrument replacement may reuse the old instrument's ids).

An oscillator instrument (`"type": "oscillator"`) is a subtractive synth with FM between its oscillators, two filters and a modulation matrix. Every field is required except `envelopes`, `lfos`, `modulations`, `glideMode`, `filter2`, `filterRouting`, an oscillator's `fm`, `feedback` and `filterRoute`, and a filter's `drive` and `vowel`:

- `oscillators`: at least one `{"id", "waveform", "level", "octave",
  "semitone", "detuneCents", "unisonVoices", "unisonDetuneCents", "fm",
  "feedback", "filterRoute"}`.
  `waveform` is `sine`, `triangle`, `saw`, `square` or `noise`; `level` is 0
  to 1; `unisonVoices` at least 1. Transpositions and detunes may be negative.
  An oscillator may play a `wavetable` instead of a `waveform` (exactly one
  of the two).
- `wavetable`: `{"source", "position", "spectralMorph", "phaseWarp"}`, all
  but `source` optional. `source` is `{"type": "builtIn", "table"}`, `table`
  being `basicShapes` (sine, triangle, saw, square), `pulseWidth` (a square
  narrowing to a thin pulse), `hardSync` (a saw synced 1 to 8 times its
  pitch) or `fmGrowl` (a sine growing an FM buzz), which need no asset; or
  `{"type": "asset", "assetId"}`, an audio asset of 2048-sample cycles (a
  Serum or Vital wavetable WAV, up to 256 cycles, left channel). `position`
  (0 to 1, 0 by default) scans the frames, crossfading neighbours: automate
  it for a growl that moves. `spectralMorph` `{"type", "amount"}`:
  `formantScale` moves the formants `amount` octaves (a talking sweep),
  `lowPass` and `highPass` keep harmonics below or above a point (`amount`
  0 to 1). `phaseWarp` `{"type", "amount"}`: `sync` (`amount` octaves of
  hard sync), `bend` and `squeeze` (`amount` -1 to 1) reshape each cycle.
  An `amount` of 0 changes nothing.
- `fm`: `{"oscillatorId", "index"}` phase-modulates the oscillator by
  another one, which must be listed before it (so chains work and loops
  can't). The modulator's own `octave`, `semitone` and `detuneCents` set
  the frequency ratio; its `level` only sets what it adds to the mix, so a
  modulator at level 0 modulates without sounding. `index` is radians of
  phase deviation: about 1 to 3 brightens, 5 and up growls.
- `feedback` (0) phase-modulates the oscillator by its own output, in radians
  as `index`: a sine turns towards a saw as it rises to about 1.5; more
  roughens it into noise.
- `filterRoute` picks the filters an oscillator passes through: `filter1`
  (the default), `filter2`, `both` or `none` (straight to the amp envelope).
- `ampEnvelope`, `filterEnvelope`: `{"attackMs", "decayMs", "sustain",
  "releaseMs"}` with `sustain` 0 to 1.
- `filter`: `{"mode", "cutoffHz", "resonance", "envelopeOctaves",
  "keyTracking", "drive", "vowel"}`; `mode` is `lowPass`, `highPass`,
  `bandPass`, `comb`, `negativeComb` or `formant`; `resonance`, `keyTracking`
  and `drive` are 0 to 1; `envelopeOctaves` may be negative.
  - `comb` peaks at every harmonic of the cutoff (metallic), `negativeComb`
    halfway between them (hollow, an octave down); `resonance` is how far.
    With `"keyTracking": 1` and `"cutoffHz": 261.63` (middle C) the comb
    follows the note.
  - `formant` speaks a vowel, a bass voice's: `vowel` 0 is `a`, 1 `e`, 2 `i`,
    3 `o`, 4 `u`, morphing in between. It ignores the cutoff, its envelope and
    `resonance`; automate or route `vowel` to make a bass talk.
  - `drive` (0) saturates each note at the filter's input: warm at 0.25,
    square at 1.
- `filter2`: an optional second filter, as `filter`. `filterRouting` is
  `series` (the default: filter 1 feeds filter 2) or `parallel` (each takes
  only its oscillators, and their outputs add). Oscillators routed to
  `filter2` without one pass unfiltered. The filter envelope moves both
  cutoffs, each by its own `envelopeOctaves`.
- `lfos`: `{"id", "waveform", "rateHz"}`. Add `"sync": true` and
  `cycleBeats` for a rate in beats at the song's tempo: 0.5 is an
  eighth-note wobble, 0.25 a sixteenth. An LFO runs on the timeline, the
  same for every note; `"trigger": "note"` starts its cycle with each note
  instead.
- `envelopes`: modulation envelopes each note starts, `{"id", "delayMs",
  "attackMs", "holdMs", "decayMs", "sustain", "releaseMs"}` (delay and hold
  0, the rest as `ampEnvelope`'s by default).
- `modulations`: the routes that make LFOs and envelopes do anything,
  `{"id", "source", "target", "amount", "bipolar"}`. `source` is
  `{"type": "envelope", "itemId"}`, `{"type": "lfo", "itemId"}`,
  `{"type": "velocity"}` or `{"type": "key"}` (the note's over 127).
  `target` is `{"itemId", "propertyName"}` as in automation: on the
  instrument's id `filter.cutoffHz` (`amount` in octaves),
  `filter.resonance`, `filter.drive` or `filter.vowel`, the same under
  `filter2` when it has one; on an oscillator `level`, `detuneCents`
  (cents), `feedback` (radians), with `fm` `fm.index` (radians), and with
  a `wavetable` `wavetable.position` and, where it has them,
  `wavetable.spectralMorph.amount` and `wavetable.phaseWarp.amount`: an
  envelope on the position sweeps each note through its frames. Each note
  moves its own target by the source times `amount`, within the target's
  range; routes on one target add. Sources go from 0 to 1 (an LFO from its
  trough to its peak); `"bipolar": true` centres them, -1 to 1, as a
  vibrato needs. A tremolo routes an LFO to the oscillators' levels with a
  negative `amount`.
- `voiceMode`: `poly`, or `mono` with `glideMs` portamento. In mono,
  `glideMode` picks which notes glide: `legato` (the default) glides only
  from a held note, and a note after a release starts at its own pitch;
  `always` glides to every note.

```json
{"type": "createFxTrackLayer", "compositionId": "song", "layerId": 10,
 "name": "Bass", "kind": "midi",
 "instrument": {"type": "oscillator", "id": 500,
  "oscillators": [{"id": 501, "waveform": "saw", "level": 0.8, "octave": -1,
   "semitone": 0, "detuneCents": 0, "unisonVoices": 1, "unisonDetuneCents": 0}],
  "ampEnvelope": {"attackMs": 5, "decayMs": 200, "sustain": 0.7, "releaseMs": 120},
  "filterEnvelope": {"attackMs": 1, "decayMs": 250, "sustain": 0, "releaseMs": 100},
  "filter": {"mode": "lowPass", "cutoffHz": 800, "resonance": 0.2,
   "envelopeOctaves": 2, "keyTracking": 0},
  "voiceMode": "mono", "glideMs": 40, "glideMode": "legato"}}
```

A dubstep growl on the Bass track: a silent sine an octave above its saw
modulating it, the index and cutoff wobbling in eighth notes, and each note's
envelope throwing both up as it starts (distortion and a multiband compressor
on the track's mixer finish it, see `daw/mixer`):

```json
{"type": "setFxMidiTrackInstrument", "compositionId": "song", "trackLayerId": 10,
 "instrument": {"type": "oscillator", "id": 500,
  "oscillators": [
   {"id": 520, "waveform": "sine", "level": 0, "octave": 0, "semitone": 0,
    "detuneCents": 0, "unisonVoices": 1, "unisonDetuneCents": 0},
   {"id": 501, "waveform": "saw", "level": 0.7, "octave": -1, "semitone": 0,
    "detuneCents": 0, "unisonVoices": 3, "unisonDetuneCents": 18,
    "fm": {"oscillatorId": 520, "index": 1}}],
  "envelopes": [{"id": 523, "attackMs": 0, "holdMs": 30, "decayMs": 300,
   "sustain": 0, "releaseMs": 100}],
  "lfos": [{"id": 521, "waveform": "sine", "rateHz": 1, "sync": true,
   "cycleBeats": 0.5}],
  "modulations": [
   {"id": 524, "source": {"type": "lfo", "itemId": 521},
    "target": {"itemId": 501, "propertyName": "fm.index"}, "amount": 5},
   {"id": 525, "source": {"type": "lfo", "itemId": 521},
    "target": {"itemId": 500, "propertyName": "filter.cutoffHz"}, "amount": 1.5,
    "bipolar": true},
   {"id": 526, "source": {"type": "envelope", "itemId": 523},
    "target": {"itemId": 501, "propertyName": "fm.index"}, "amount": 3},
   {"id": 527, "source": {"type": "envelope", "itemId": 523},
    "target": {"itemId": 500, "propertyName": "filter.cutoffHz"}, "amount": 2}],
  "ampEnvelope": {"attackMs": 3, "decayMs": 100, "sustain": 0.9, "releaseMs": 80},
  "filterEnvelope": {"attackMs": 0, "decayMs": 0, "sustain": 0, "releaseMs": 0},
  "filter": {"mode": "lowPass", "cutoffHz": 900, "resonance": 0.35,
   "envelopeOctaves": 0, "keyTracking": 0},
  "voiceMode": "mono", "glideMs": 30, "glideMode": "legato"}}
```

A wavetable growl on the Bass track, its position swept by automation
(`wavetable.position`, see `daw/automation`):

```json
{"type": "setFxMidiTrackInstrument", "compositionId": "song", "trackLayerId": 10,
 "instrument": {"type": "oscillator", "id": 500,
  "oscillators": [
   {"id": 501, "level": 0.7, "octave": -1, "semitone": 0, "detuneCents": 0,
    "unisonVoices": 3, "unisonDetuneCents": 18,
    "wavetable": {"source": {"type": "builtIn", "table": "fmGrowl"}, "position": 0.3,
     "spectralMorph": {"type": "formantScale", "amount": 0.5},
     "phaseWarp": {"type": "bend", "amount": 0.3}}}],
  "ampEnvelope": {"attackMs": 3, "decayMs": 100, "sustain": 0.9, "releaseMs": 80},
  "filterEnvelope": {"attackMs": 0, "decayMs": 0, "sustain": 0, "releaseMs": 0},
  "filter": {"mode": "lowPass", "cutoffHz": 2500, "resonance": 0.3,
   "envelopeOctaves": 0, "keyTracking": 0},
  "voiceMode": "mono", "glideMs": 30, "glideMode": "legato"}}
```

A talking bass instead: a driven saw through a low-pass into a formant filter,
whose `vowel` the automation sweeps (see `daw/automation`), over a sine sub
that feedback roughens, routed past both filters:

```json
{"type": "setFxMidiTrackInstrument", "compositionId": "song", "trackLayerId": 10,
 "instrument": {"type": "oscillator", "id": 500,
  "oscillators": [
   {"id": 501, "waveform": "saw", "level": 0.8, "octave": -1, "semitone": 0,
    "detuneCents": 0, "unisonVoices": 2, "unisonDetuneCents": 12},
   {"id": 520, "waveform": "sine", "level": 0.4, "octave": -2, "semitone": 0,
    "detuneCents": 0, "unisonVoices": 1, "unisonDetuneCents": 0,
    "feedback": 0.6, "filterRoute": "none"}],
  "ampEnvelope": {"attackMs": 3, "decayMs": 150, "sustain": 0.8, "releaseMs": 80},
  "filterEnvelope": {"attackMs": 0, "decayMs": 0, "sustain": 0, "releaseMs": 0},
  "filter": {"mode": "lowPass", "cutoffHz": 2500, "resonance": 0.2,
   "envelopeOctaves": 0, "keyTracking": 0, "drive": 0.4},
  "filter2": {"mode": "formant", "cutoffHz": 20000, "resonance": 0,
   "envelopeOctaves": 0, "keyTracking": 0, "vowel": 0},
  "voiceMode": "mono", "glideMs": 25, "glideMode": "legato"}}
```

A sampler (`"type": "sampler"`) plays audio assets. It has an `id`, an
`ampEnvelope`, an optional `preserveLength` (false), optional `resonance`
and `pedalNoise`, and at least one zone
`{"id", "assetId", "keyLow", "keyHigh", "rootKey", "velocityLow",
"velocityHigh", "tuneCents", "gainDb", "trigger", "decayDbPerSecond", "loop",
"startMs", "endMs"}`. Each zone maps a key range and a velocity range (keys 0
to 127, velocities 1 to 127, low at most high) to its sample, pitched from
`rootKey`, which may lie outside the key range. `trigger` is `gate`
(stops with the note), `oneShot` (plays the whole sample, as drums need) or
`release` (plays the whole sample from the note off, chosen by the note's
key and note-on velocity: a piano's key-up thud and string noise, SFZ's
`trigger=release`). A `release` zone may set `decayDbPerSecond` (0), SFZ's
`rt_decay`: it plays that many dB quieter for each second the note was
held; other triggers reject it. Under the sustain pedal it plays once for
each key, when its latest note's damper falls: at the lift, or at that
note's key-up after it; never when a key is struck again.
`resonance`, `{"gainDb"}`, gives a sampled piano the halo of its pedal: a
string for each key the zones cover rings in sympathy with what plays
while the sustain pedal is down or its key is held, modelled, so it needs
no pedal-down recordings, and lifting the pedal damps them; at about −20
dB it sits some 14 dB under a pedalled passage. `pedalNoise`,
`{"down": [...], "up": [...]}`, each `{"id", "assetId", "gainDb"}` and at
least one in all, plays one of `down` as the pedal goes down and one of `up`
as it comes up, whole and at its own pitch, picked at random as SFZ's
`lorand` picks a piano's pedal noises; its ids share the item-id space.
`loop` is an optional `{"startMs", "endMs"}` with start before end.
`startMs` and `endMs`, each optional, trim the sample to what the zone
plays, in the sample's milliseconds, start before end: one recording of
several hits can give each zone its own. A start inside the sample fades in
over 1 ms and an end inside it fades out over the 5 ms before it, so a trim
never clicks. `assetId` names an audio asset.

By default a note re-pitches its sample, as a tape does: above `rootKey` it
plays faster and shorter, below it slower and longer. With
`"preserveLength": true` every note plays at the sample's own length and
speed, its pitch moved by grains, so one recording played across the
keyboard (a spoon on a cup, a vocal stab) gives chords whose notes ring
alike. Large shifts sound grainy. `tsrct sample-zone --input <file>`
measures a sample's `startMs` (3 ms before its first hit), `endMs` (where
its tail falls 50 dB below its peak), `gainDb` (bringing that peak to
−2 dBFS), `rootKey` and `tuneCents`, and prints them under `zone`, ready to
merge into a zone, so the raw file plays without a processed copy: add
`--no-pitch` for drums, `--method spectrum` for struck, inharmonic sounds
(glass, metal, timpani), `--note` to search near a note you hear,
`--start-ms` and `--end-ms` to analyse one sound among several, and
`--loop out.wav --cut` for a held sound's sustain loop, with its crossfade
baked into a copy to import instead. `--slices onsets` (or `beats`) prints
`zones` instead: one per hit (or beat) of a break or chop, all over the same
file, on consecutive keys from `--first-key` (36), each played as recorded
and all at the gain of the loudest. To play one recording across the
keyboard, give it one zone from `keyLow` 0 to `keyHigh` 127, with the
`rootKey` and `tuneCents` that `tsrct sample-zone` measures.

```json
{"type": "createFxTrackLayer", "compositionId": "song", "layerId": 30,
 "name": "Drums", "kind": "midi",
 "instrument": {"type": "sampler", "id": 700,
  "ampEnvelope": {"attackMs": 0, "decayMs": 0, "sustain": 1, "releaseMs": 50},
  "zones": [{"id": 701, "assetId": "kick-sample", "keyLow": 36, "keyHigh": 36,
   "rootKey": 36, "velocityLow": 1, "velocityHigh": 127, "tuneCents": 0,
   "gainDb": 0, "trigger": "oneShot"}]}}
```

A drum kit (`"type": "drums"`) has an `id` and `pads`, one per key:
`{"id", "key", "pan", "voice", "gainDb", "tuneCents", "chokeGroup"}`, the last
three optional (0, 0 and none). A note at a pad's `key` plays its `voice` once,
whatever the note's length, and drums ignore pitch bends. `gainDb` and `pan`
apply to the pad's output and `tuneCents` retunes it. A note on a pad in a
`chokeGroup` (any number) silences the group's other pads, as a closed hi-hat
cuts an open one. No two pads share a key. MIDI-file import plays channel-10
parts on the default General MIDI kit: synth pads on keys 35 to 51, the
hi-hats in one choke group.

A pad's `voice` is a sample or a synth:

- `{"type": "sample", "zones", "ampEnvelope"}` plays its zones as a sampler
  with them does, so a pad can hold velocity layers.
- `{"type": "synth", "tone", "noise"}` is a general drum voice; either part
  may be omitted. `tone` is `{"waveform", "frequencyHz", "sweepOctaves",
  "sweepMs", "decayMs", "level"}`, `sweepOctaves` optional (0): `waveform` is
  `sine`, `triangle`, `saw` or `square`, and the pitch starts `sweepOctaves`
  above `frequencyHz` and falls into it over `sweepMs`. `noise` is filtered
  white noise `{"mode", "cutoffHz", "resonance", "decayMs", "level", "bursts",
  "burstMs"}`, `mode` `lowPass`, `highPass` or `bandPass`, restarting `bursts`
  times `burstMs` apart.
  A kick is a swept sine, a snare a tone under noise, a hi-hat bright noise
  and a clap a few noise bursts.

A kick, a snare and closed and open hi-hats that choke each other:

```json
{"type": "createFxTrackLayer", "compositionId": "song", "layerId": 40,
 "name": "Kit", "kind": "midi",
 "instrument": {"type": "drums", "id": 800, "pads": [
  {"id": 801, "key": 36, "pan": 0, "voice": {"type": "synth",
   "tone": {"waveform": "sine", "frequencyHz": 55, "sweepOctaves": 2.5,
    "sweepMs": 35, "decayMs": 450, "level": 0.8}}},
  {"id": 802, "key": 38, "pan": 0, "voice": {"type": "synth",
   "tone": {"waveform": "triangle", "frequencyHz": 185, "sweepOctaves": 0.6,
    "sweepMs": 20, "decayMs": 150, "level": 0.45},
   "noise": {"mode": "highPass", "cutoffHz": 1500, "resonance": 0,
    "decayMs": 220, "level": 0.35, "bursts": 1, "burstMs": 10}}},
  {"id": 803, "key": 42, "pan": -0.3, "chokeGroup": 1, "voice": {"type": "synth",
   "noise": {"mode": "highPass", "cutoffHz": 8000, "resonance": 0.2,
    "decayMs": 45, "level": 0.3, "bursts": 1, "burstMs": 10}}},
  {"id": 804, "key": 46, "pan": -0.3, "chokeGroup": 1, "voice": {"type": "synth",
   "noise": {"mode": "highPass", "cutoffHz": 7500, "resonance": 0.2,
    "decayMs": 450, "level": 0.3, "bursts": 1, "burstMs": 10}}}]}}
```

## MIDI clips

A clip is a `MidiItem` in its MIDI track's `items`: not a layer, but its id
is a layer id. It sits on the track over `startTick` and `lengthTicks`.
Its notes are in content ticks: content tick `t` sounds at composition tick
`startTick - contentOffsetTicks + t / rate`. The clip's window decides what
is heard: a note crossing the clip's start or end sounds only inside it. A
clip may also loop a region of its content (see Loops). Tempo edits never
move clips: they keep their ticks, so they follow the new tempo.

- `createFxMidiItem` puts a clip on `trackLayerId` over `[start, end)`, with
  `layerId`, `name`, an optional `description` and `notes`, at rate 1, with
  its content starting at `start` and no loop.
- `retimeFxMidiItem` takes an `operation` and a position `to`: `move` starts
  the clip at `to`, keeping its length and content; `trimStart` starts it
  there and `trimEnd` ends it there, every note staying where it sounds. A
  start trim may not start the clip before its content's origin.
- `splitFxMidiItem` splits the clip at a position `at` strictly inside it;
  the clip keeps the part before and the new clip `newLayerId` the rest.
- `setFxMidiItemRate` sets `rate`, the content speed: 2 plays double time,
  0.5 half time. The content heard at the clip's start stays there, and the
  clip's length scales with the content, rounded to the nearest tick.
- `deleteFxCompositionLayer` deletes a clip. The millisecond actions
  `retimeFxLayer`, `splitFxLayer` and `animatorDuplicateLayer` also work on
  clips, rounding each edge they move to the nearest tick. `setFxLayerHidden`
  and `updateLayerField` (`name`, `description`) also take a clip's id.

A track keeps its clips sorted by start tick, so a clip moved past another
goes after it; a clip that would overlap another fails with `TrackInvalid`.
A new clip grows the composition to cover it, and timing, rate and tempo
edits fit the composition to its content.

After the first example below, the Bass track stores its clip as an item,
with no `type` and no `parent`; `items` is always written, even empty:

```text
{"type": "Track", "id": 10, "name": "Bass", "kind": "midi", "instrument": {…},
 "items": [{"id": 11, "name": "Bassline", "startTick": 0, "lengthTicks": 7680,
  "contentOffsetTicks": 0, "notes": [{"pitch": 36, "velocity": 100,
  "startTick": 0, "lengthTicks": 960}, …]}]}
```

```json
{"type": "createFxMidiItem", "compositionId": "song", "trackLayerId": 10,
 "layerId": 11, "name": "Bassline",
 "start": {"type": "barBeat", "bar": 1, "beat": 1},
 "end": {"type": "barBeat", "bar": 3, "beat": 1},
 "notes": [
  {"pitch": 36, "velocity": 100, "startTick": 0, "lengthTicks": 960},
  {"pitch": 43, "velocity": 90, "startTick": 1920, "lengthTicks": 960},
  {"pitch": 36, "velocity": 100, "startTick": 3840, "lengthTicks": 960},
  {"pitch": 41, "velocity": 90, "startTick": 5760, "lengthTicks": 960}]}
```

```json
{"type": "retimeFxMidiItem", "compositionId": "song", "layerId": 11,
 "operation": "move", "to": {"type": "barBeat", "bar": 5, "beat": 1}}
```

```json
{"type": "splitFxMidiItem", "compositionId": "song", "layerId": 11,
 "newLayerId": 12, "at": {"type": "barBeat", "bar": 6, "beat": 1}}
```

```json
{"type": "setFxMidiItemRate", "compositionId": "song", "layerId": 12,
 "rate": 0.5}
```

## Notes

A note is `{"pitch", "velocity", "startTick", "lengthTicks"}`: `pitch` 0 to
127 (60 is middle C), `velocity` 1 to 127, `startTick` in content ticks from
the clip's content origin and `lengthTicks` at least 1. Notes have no ids:
as in a piano roll, a note is addressed by its pitch and start tick, and no
edit names one note twice.

A note may also have a `bend`: its own pitch bend, a list of points
`{"tick", "semitones"}`. `tick` counts content ticks from the note's start;
`semitones` is the pitch offset, up to ±96, positive up. The pitch moves in
a straight line between points, holds the first point's value before it and
the last one's after it, and jumps where two points share a tick. Points are
ordered by tick, at most two at one tick. The release keeps the bend the
note ended with. A bend only bends its own note, so chords can bend apart;
drum kits ignore it.

A note can be written by time instead, to put it on a time such as a
`detect-tempo` beat or a cut: `startMs`, in project milliseconds, and
`lengthMs` replace `startTick` and `lengthTicks`. The action stores it in
content ticks: it starts at the content tick nearest `startMs` and ends at
the one nearest `startMs + lengthMs`, through the tempo map and the clip's
start, content offset and rate, so a tempo change during the note is
respected. It must not start before the composition, the tempo map's anchor
or the clip's content origin, and must last at least a tick. In a looping
clip it must start in the clip's first pass, its lead-in or first loop pass:
a note in a later pass would sound on every pass. A `bend` stays in content
ticks. `createFxMidiItem`, `addFxMidiNotes` and `updateFxMidiNote` take
notes in either form; edits still name a note by `pitch` and `startTick`.

- `addFxMidiNotes` adds `notes` to the clip `layerId`. A note where the clip
  already has one of the same pitch and start replaces it; the others are
  appended.
- `updateFxMidiNote` replaces the note of `pitch` starting at `startTick`
  with `note`, and any note that `note` lands on.
- `removeFxMidiNotes` removes `notes`, each `{"pitch", "startTick"}`; every
  note named must exist.

`addFxMidiNotes` and `updateFxMidiNote` replace the whole note: a note
written without `bend` has none, so restate a bent note's `bend` to keep
it, or change only the bend with `setFxMidiNoteBend`.

```json
{"type": "addFxMidiNotes", "compositionId": "song", "layerId": 11,
 "notes": [{"pitch": 48, "velocity": 80, "startTick": 2880, "lengthTicks": 480}]}
```

The clip starts at bar 5, 8 s at 120 BPM, so a note at 9.25 s lasting a
quarter of a second is stored as content ticks 2400 to 2880:

```json
{"type": "addFxMidiNotes", "compositionId": "song", "layerId": 11,
 "notes": [{"pitch": 50, "velocity": 90, "startMs": 9250, "lengthMs": 250}]}
```

```json
{"type": "updateFxMidiNote", "compositionId": "song", "layerId": 11,
 "pitch": 43, "startTick": 1920,
 "note": {"pitch": 45, "velocity": 90, "startTick": 1920, "lengthTicks": 960}}
```

`setFxMidiNoteBend` sets the `bend` of the note of `pitch` starting at
`startTick`; omit `bend` or pass `[]` to clear it. A slide up a whole tone
over half a beat, then back down at the note's end:

```json
{"type": "setFxMidiNoteBend", "compositionId": "song", "layerId": 11,
 "pitch": 45, "startTick": 1920,
 "bend": [{"tick": 0, "semitones": 0}, {"tick": 480, "semitones": 2},
  {"tick": 840, "semitones": 2}, {"tick": 960, "semitones": 0}]}
```

```json
{"type": "removeFxMidiNotes", "compositionId": "song", "layerId": 11,
 "notes": [{"pitch": 48, "startTick": 2880}]}
```

## Sustain pedal

A clip's optional `sustain` is its sustain pedal: the spans
`{"startTick", "lengthTicks"}` it is held down, in content ticks like its
notes, ordered and apart. While it is down, a note whose key comes up keeps
sounding until the pedal lifts, as a piano's does; a key that comes up just
as the pedal goes down is not held. A key struck again under the pedal ends
its held note there, with no key-up sound: a sampler's `release` zones play
once for each key, when its latest note's damper falls, at the lift or at
that note's key-up after it. A held note keeps the bend it had when its key
came up. Two spans may touch: the pedal lifts there and goes down again,
damping what it held, as a pianist re-pedals at each chord. The pedal
moves, loops and stretches with the clip's content, and the clip's end and
its loop's end lift it. It is down or up only. MIDI-file import reads
controller 64 into it, and export writes it back. A sampler with
`resonance` or `pedalNoise` hears it too: its strings ring while it is
down, and its noises play as it goes down and comes up.

- `addFxMidiSustain` holds the pedal of the clip `layerId` down over `spans`
  too. Spans that overlap merge; spans that only touch stay apart.
- `removeFxMidiSustain` lifts it over `spans`: a span reaching past them
  keeps its parts outside.

The pedal down for a beat, then re-pedalled for three more:

```json
{"type": "addFxMidiSustain", "compositionId": "song", "layerId": 11,
 "spans": [{"startTick": 0, "lengthTicks": 960},
  {"startTick": 960, "lengthTicks": 2880}]}
```

Lifted over the last beat:

```json
{"type": "removeFxMidiSustain", "compositionId": "song", "layerId": 11,
 "spans": [{"startTick": 2880, "lengthTicks": 960}]}
```

## Loops

A clip's optional `loop` is `{"startTick", "lengthTicks"}`, a region of its
content in content ticks (`lengthTicks` at least 1), as Ableton's clip loop:
a one-bar pattern fills eight bars without copying notes. The content plays
from the clip's start; at the loop's end it jumps back to the loop's start,
for the rest of the clip.

- Content before the loop plays once, as a lead-in. A note there sounds once,
  even if it crosses the loop's start.
- A note inside the loop sounds once per pass, cut at the loop's end.
- A note at or after the loop's end stays stored but is silent while the clip
  loops.
- The loop may lie anywhere in the content, even past the last note. A
  longer clip loops more, and trims and splits keep the loop. Being in
  content ticks, it scales with the clip's `rate`.

`setFxMidiClipLoop` sets the `loop` of the clip `layerId`; omit `loop` or
pass `null` to clear it. It moves no note and changes no window. Other layers
are rejected.

```json
{"type": "setFxMidiClipLoop", "compositionId": "song", "layerId": 11,
 "loop": {"startTick": 0, "lengthTicks": 1920}}
```

## Tempo and time signatures

`setFxCompositionTempo` replaces the composition's `tempos`
(`{"tick", "bpm"}`) and `timeSignatures` (`{"tick", "numerator",
"denominator"}`), keeping the anchor. Each list starts at tick 0 with
strictly increasing ticks. `bpm` is positive; `numerator` at least 1;
`denominator` a power of two up to 256. A time-signature change must fall on
a bar line of the meter before it. Tempo changes are steps.

```json
{"type": "setFxCompositionTempo", "compositionId": "song",
 "tempos": [{"tick": 0, "bpm": 128}],
 "timeSignatures": [{"tick": 0, "numerator": 4, "denominator": 4}]}
```

Clips keep their ticks, so a slower tempo lengthens the composition to cover
them and a faster one shrinks it back, never past other content such as a
longer video. Effect tails and instrument releases never lengthen it.

To follow a supplied song, detect its tempo: `tsrct detect-tempo --input
<file>` (or `--project <doc> --layer <id>` for an Audio layer's or audio
clip's source) prints its `tempos`, `timeSignature` and `firstDownbeatMs`,
with half, double, ⅔ and 3⁄2 time among its `alternatives`. Pass the
`tempos` and time signature to `setFxCompositionTempo`, and set `anchorMs`
to the composition time of the first downbeat. `export-audio --report`
gives every bus's tempo, with its `anchorMs` already in composition time.

## Writing a song

1. Set the tempo with `setFxCompositionTempo`.
2. Create a MIDI track per part with `createFxTrackLayer`, each with its instrument.
3. Add clips with `createFxMidiItem`, placing them by bar and beat and writing their notes. Loop a short pattern across a long clip with `setFxMidiClipLoop`. Pedal a piano part with `addFxMidiSustain`.
4. Shape the mix with the `daw/mixer` actions: gain, pan and effects per track, and a limiter on the master.
5. Move the mix and the instruments over time with the `daw/automation` actions: filter sweeps, pans, fades and effect bypasses.
