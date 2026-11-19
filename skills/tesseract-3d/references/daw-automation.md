# DAW automation: keyframes on audio controls

Automation moves an audio control over time:
the gain, pan or mute of the master, a track or a source, an effect's
parameter or bypass, or a property of an EQ band or an instrument, such as a
filter sweep. Read [daw/mixer](daw-mixer.md) for the controls
and [daw/midi](daw-midi.md) for ticks and instruments.

## Controls

Every action names its owner with `layerId`: a track, an audio layer or
clip, or a video layer, or omitted (or `null`) for the master, as the mixer
actions do. `control`
names one of its controls:

- `{"type": "channel", "propertyType": "volume"}`: the owner's own
  `volume`, `pan` or `mute`. Volume keys replace the static `volume`; to
  rebalance an owner whose volume is automated, set its `trimDb`
  (`daw/mixer`) rather than rescaling its keys.
- `{"type": "effect", "effectId": 900, "paramName": "thresholdDb"}`: a
  parameter of an effect in the owner's insert chain, by its name in the
  effect table of `daw/mixer`, or `enabled`, the effect's bypass. Every
  number of an effect is automatable. A delay automates `timeMs` and
  `timeBeats` alike, and `rightTimeMs` and `rightTimeBeats`, and a chorus,
  flanger or phaser `rateHz` and `cycleBeats`; the one its `sync` selects
  is heard, a right time only while it is stored. A reverb's `lowCutHz`
  and `highCutHz` are automatable where it has them. A reverb's or
  delay's `freeze` is a switch, as `enabled` is. A multiband compressor's
  band numbers are named by their path: `low.thresholdDb`, `mid.ratio`,
  `high.makeupDb` and so on. A binaural effect's `azimuthDegrees`,
  `elevationDegrees` and `distanceMeters` move its source; with `doppler`
  its distance curve bends the pitch too. In a room,
  `room.listenerXMeters`, `room.listenerYMeters` and `room.listenerZMeters`
  move the listener, and `room.reflectionsDb` and `room.reverbDb` set its
  levels. A noise reduction's
  `reductionDb` and `smoothing` are automatable, its `profileDb` is not.
- `{"type": "item", "itemId": 951, "propertyName": "gainDb"}`: a property of
  an EQ band in the owner's chain, or of a MIDI track's instrument, by its
  path from the item:
  - an EQ band: `frequencyHz`, `gainDb` and `q`, and on a band with
    dynamics `dynamics.thresholdDb`, `.ratio`, `.attackMs`, `.releaseMs`,
    `.kneeDb` and `.rangeDb`;
  - an oscillator instrument, on its id: `ampEnvelope.attackMs`,
    `.decayMs`, `.sustain` and `.releaseMs`, the same under
    `filterEnvelope`, `filter.cutoffHz`, `.resonance`, `.envelopeOctaves`,
    `.keyTracking`, `.drive` and `.vowel`, the same under `filter2` when it
    has one, and `glideMs`;
  - each oscillator: `waveform` (unless it plays a wavetable), `level`,
    `octave`, `semitone`, `detuneCents`, `unisonVoices`,
    `unisonDetuneCents` and `feedback`, with `fm` `fm.index`, and with a
    `wavetable` `wavetable.position` and, where it has them,
    `wavetable.spectralMorph.amount` and `wavetable.phaseWarp.amount`;
  - each LFO: `waveform`, `rateHz` and `cycleBeats`; the rate its `sync`
    selects is heard, so a synced LFO's wobble speeds up when its
    `cycleBeats` keys go down (0.5, then 0.25);
  - each modulation envelope: `delayMs`, `attackMs`, `holdMs`, `decayMs`,
    `sustain` and `releaseMs`; each modulation route: `amount`, so a
    wobble deepens over a build;
  - a sampler: `ampEnvelope.*` on its id; each zone `tuneCents`, `gainDb`
    and, on a looping zone, `loop.startMs` and `loop.endMs`;
  - a drum kit: each pad's `gainDb`, `pan` and `tuneCents`, and on a synth
    voice `voice.tone.waveform`, `.frequencyHz`, `.sweepOctaves`,
    `.sweepMs`, `.decayMs` and `.level`, and `voice.noise.cutoffHz`,
    `.resonance`, `.decayMs`, `.level`, `.bursts` and `.burstMs`.

Not automated: `trimDb`, `solo`, `channels`, a band's `shape`, `enabled`,
`slopeDbPerOct` and whether it has `dynamics`, a compressor's or multiband band's `detection`, a limiter's `truePeak`, filter
and noise modes, filter routing and oscillators' `filterRoute`, FM modulators, wavetable sources and morph and warp types, LFO triggers, a route's source, target and `bipolar`, voice and glide modes, triggers, `pingPong`,
`sync`, an effect's `mode` and `waveform`, note mappings (key and velocity ranges, root keys, pad keys, choke
groups) and a sample pad's envelope. Change them with the edit actions.

## Clocks

Keys are timed on the owner's clock, so automation moves with what it
shapes:

- The master, a track and what it holds (its mixer and its instrument) take
  tick keys, `{"id", "tick", "value", "easing"}`, in composition ticks (960
  per quarter note, see `daw/midi`). They follow tempo edits, as notes do.
- An audio clip that follows the tempo map (`daw/tracks`) and its mixer
  take tick keys in the clip's content ticks, so they stay on its audio
  through moves, trims and splits.
- An audio layer, an audio clip placed in milliseconds, a video layer's
  sound and their mixers take millisecond keys, `{"id", "layerTime",
  "value", "easing"}`, `layerTime` on the owner's own clock (on the
  composition's clock for a clip), as other FX keyframes.

Keys on the other clock fail with `AutomationInvalid`, which names the
control and the rule.

## Values and easing

`value` is in the control's own units, as its stored field: a number
(`{"type": "float", "value": 0.5}`) checked as the field is, a boolean for
`mute`, `enabled` and `freeze` (`{"type": "bool", "value": true}`), or a
waveform's name (`{"type": "string", "value": "square"}`). Whole-number fields
(`octave`, `semitone`, `unisonVoices`, `stages`, `bursts`) take whole
values.

`easing` shapes the segment that ends at its key: `{"type": "hold"}`,
`{"type": "linear"}` or `{"type": "cubicBezier", "x1", "y1", "x2", "y2"}`.
Booleans and waveforms take `hold` only. Frequencies (every `…Hz`) move by
octaves; other values move in their units. Before the first key the control
holds the first value, and after the last the last.

## Set, move and remove keys

Callers choose keyframe ids, unique among every keyframe of the composition,
visual ones included.

- `setFxAutomationKeyframes` adds or replaces `keyframes` of a control: a
  new id adds a key, an existing one replaces it, moving it to its new tick
  or time. The control's other keys stay. A batch may swap two keys; two
  keys at one tick are rejected. A control driven by another animator, such
  as a clip `volume` script, or by keys on the other clock, takes the new
  keys alone.
- `removeFxAutomationKeyframes` removes `keyframeIds`, each of which must be
  one of the control's keys. Removing the last removes its automation.
- `clearFxAutomation` removes all of a control's automation.

Without automation a control has its stored value, set with the mixer and
instrument actions. Removing an effect, band or instrument, or deleting a
layer, removes its automation; splitting and duplicating a clip copy its
automation with new keyframe ids.

The bass filter opens over bars 5 and 6, easing in:

```json
{"type": "setFxAutomationKeyframes", "compositionId": "song", "layerId": 10,
 "control": {"type": "item", "itemId": 500, "propertyName": "filter.cutoffHz"},
 "keyframes": [
  {"id": "cutoff-a", "tick": 15360, "value": {"type": "float", "value": 400},
   "easing": {"type": "linear"}},
  {"id": "cutoff-b", "tick": 23040, "value": {"type": "float", "value": 3200},
   "easing": {"type": "cubicBezier", "x1": 0.42, "y1": 0, "x2": 1, "y2": 1}}]}
```

The bass talks over bar 2: its formant filter says `a`, `i`, `o`, then `e`:

```json
{"type": "setFxAutomationKeyframes", "compositionId": "song", "layerId": 10,
 "control": {"type": "item", "itemId": 500, "propertyName": "filter2.vowel"},
 "keyframes": [
  {"id": "vowel-a", "tick": 3840, "value": {"type": "float", "value": 0},
   "easing": {"type": "linear"}},
  {"id": "vowel-b", "tick": 4800, "value": {"type": "float", "value": 2},
   "easing": {"type": "linear"}},
  {"id": "vowel-c", "tick": 5760, "value": {"type": "float", "value": 3},
   "easing": {"type": "linear"}},
  {"id": "vowel-d", "tick": 6720, "value": {"type": "float", "value": 1},
   "easing": {"type": "linear"}}]}
```

The vocals pan from left to right over the first two bars, and their EQ is
bypassed from bar 3:

```json
{"type": "setFxAutomationKeyframes", "compositionId": "song", "layerId": 20,
 "control": {"type": "channel", "propertyType": "pan"},
 "keyframes": [
  {"id": "pan-a", "tick": 0, "value": {"type": "float", "value": -0.3},
   "easing": {"type": "linear"}},
  {"id": "pan-b", "tick": 7680, "value": {"type": "float", "value": 0.3},
   "easing": {"type": "linear"}}]}
```

```json
{"type": "setFxAutomationKeyframes", "compositionId": "song", "layerId": 20,
 "control": {"type": "effect", "effectId": 901, "paramName": "enabled"},
 "keyframes": [
  {"id": "eq-on", "tick": 0, "value": {"type": "bool", "value": true},
   "easing": {"type": "hold"}},
  {"id": "eq-off", "tick": 7680, "value": {"type": "bool", "value": false},
   "easing": {"type": "hold"}}]}
```

The vocals circle the listener once over bars 1 to 4, from ahead, by the
right:

```json
{"type": "setFxAutomationKeyframes", "compositionId": "song", "layerId": 20,
 "control": {"type": "effect", "effectId": 902, "paramName": "azimuthDegrees"},
 "keyframes": [
  {"id": "orbit-a", "tick": 0, "value": {"type": "float", "value": 0},
   "easing": {"type": "linear"}},
  {"id": "orbit-b", "tick": 15360, "value": {"type": "float", "value": 360},
   "easing": {"type": "linear"}}]}
```

Clip 21 is placed in milliseconds, so its gain dips in its own time:

```json
{"type": "setFxAutomationKeyframes", "compositionId": "song", "layerId": 21,
 "control": {"type": "channel", "propertyType": "volume"},
 "keyframes": [
  {"id": "dip-a", "layerTime": 1000, "value": {"type": "float", "value": 1},
   "easing": {"type": "linear"}},
  {"id": "dip-b", "layerTime": 1500, "value": {"type": "float", "value": 0.4},
   "easing": {"type": "linear"}}]}
```

Move the pan's second key to bar 2, then remove its first, and clear the
bypass:

```json
{"type": "setFxAutomationKeyframes", "compositionId": "song", "layerId": 20,
 "control": {"type": "channel", "propertyType": "pan"},
 "keyframes": [
  {"id": "pan-b", "tick": 3840, "value": {"type": "float", "value": 0.3},
   "easing": {"type": "linear"}}]}
```

```json
{"type": "removeFxAutomationKeyframes", "compositionId": "song", "layerId": 20,
 "control": {"type": "channel", "propertyType": "pan"},
 "keyframeIds": ["pan-a"]}
```

```json
{"type": "clearFxAutomation", "compositionId": "song", "layerId": 20,
 "control": {"type": "effect", "effectId": 901, "paramName": "enabled"}}
```
