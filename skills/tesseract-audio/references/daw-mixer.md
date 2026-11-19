# DAW mixer: gain, pan and insert effects

These actions set the channel strip of the master and of every track, audio
layer, audio clip and video layer: gain, trim, pan, mute, solo, channel
mapping and an ordered chain of audio effects, which ready-made presets can
fill. Read [daw/tracks](daw-tracks.md) for tracks and clips, and
[daw/automation](daw-automation.md) to change these controls over
time.

## Owners

The root composition's own controls are the master. Every action except the
two gain actions names its owner with `layerId`: a track, an audio layer, an
audio clip (an audio track's item) or a video layer, or omitted (or `null`)
for the master. Groups, other layers and MIDI clips (a MIDI track's items)
have no audio controls and are rejected.

Each owner processes its audio in this order: channel mapping, insert effects
in order (skipping disabled ones), `trimDb`, `volume`, pan, then mute and
solo. Clip fades and crossfades shape a clip's audio before all of these.

## Gain

`setFxMasterVolume` sets the master's `volume`. `animatorSetLayerVolume` sets
a track's, audio layer's, audio clip's or video layer's. Both take a finite,
non-negative linear gain: `1.0` is unity, `0.5` about -6 dB, `0` silent.

```json
{"type": "setFxMasterVolume", "compositionId": "song", "volume": 0.8}
```

```json
{"type": "animatorSetLayerVolume", "compositionId": "song", "layerId": 20,
 "volume": 0.7}
```

## Channel controls

String-enum definitions in the action schema include the documented meaning of
individual choices, including DAW channel mappings and effect modes. Follow a
field's schema reference to read those descriptions before choosing a value;
this metadata does not change the accepted wire values or their defaults.

`updateFxMixerChannel` sets any of `trimDb`, `pan`, `mute`, `solo` and
`channels` in `values`; omitted fields stay unchanged.

- `trimDb` is a static gain in dB, from -120 to 120, 0 (the default) at
  unity: -6 about halves the level. It applies after the insert effects and
  before `volume`, and isn't automatable, so volume keys never replace it.
  Like `volume`, it moves everything the owner sends on: what it sends as a
  sidechain key, the track and master effects it feeds, and the meters,
  stems and `export-audio` report levels of the track and master it reaches
  (a track's or the master's own included; clips have none). It doesn't
  change how the owner's own effects respond.
- `pan` is -1 (left) to 1 (right), 0 at centre. A mono signal pans with
  constant power; a stereo one balances.
- `mute` silences this owner only. Hiding a layer removes it from the mix
  altogether.
- `solo`: when any track or source in the composition is soloed, a source is
  heard only if it or its track is soloed. The master's `solo` is stored but
  ignored.
- `channels` maps the input: `stereo` (unchanged), `left` or `right` (that
  channel on both sides), `swap`, or `mono` (the mean of both).

```json
{"type": "updateFxMixerChannel", "compositionId": "song", "layerId": 20,
 "values": {"pan": -0.3, "channels": "mono"}}
```

Volume keys (`daw/automation`) replace an owner's static `volume`, so
changing that value (`animatorSetLayerVolume`, `setFxMasterVolume`) changes
nothing while its volume is automated. To balance such an owner, set its
`trimDb` and leave its keys alone: the level moves by exactly the trim and
the automation keeps its shape.

```json
{"type": "updateFxMixerChannel", "compositionId": "song", "layerId": 20,
 "values": {"trimDb": -4.5}}
```

A neutral strip (0 trim, centre pan, no mute or solo, `stereo`, no effects)
is stored as no `mixer`, so switching a control back off restores the
document.

## Insert effects

An owner's `mixer.effects` is an ordered chain of
`{"id", "enabled", "effect": {"type", ...parameters}}`. `enabled` defaults to
`true`. Effect ids share the composition's effect-id space with visual layer
effects.

- `addFxMixerEffect` inserts a complete record at `index`, or appends it when
  `index` is omitted.
- `removeFxMixerEffect` removes the effect `effectId`.
- `moveFxMixerEffect` moves it to `toIndex`, an existing position.
- `setFxMixerEffectEnabled` enables or bypasses it, keeping its parameters.
- `updateFxMixerEffect` replaces its `effect` (kind and parameters), keeping
  its id, position and `enabled`.

```json
{"type": "addFxMixerEffect", "compositionId": "song", "layerId": 20,
 "effect": {"id": 900, "effect": {"type": "compressor", "thresholdDb": -20,
  "ratio": 3}}}
```

```json
{"type": "updateFxMixerEffect", "compositionId": "song", "layerId": 20,
 "effectId": 900, "effect": {"type": "compressor", "thresholdDb": -24,
  "ratio": 4, "attackMs": 5}}
```

Omitted parameters take the defaults below, except an EQ's `bands` and a
distortion's `mode`, which are required. Units are in the names. `mix`,
`depth`, `size`, `damping`, `width`, `feedback`, `stereoLink`,
`sensitivity` and `smoothing` are 0 to 1;
frequencies, `ratio`, `q` and `timeBeats` are positive; `*Ms` times, `kneeDb`
and `hysteresisDb` are non-negative; other dB values may be any finite
number.

| `type` | Parameters (default) |
|---|---|
| `eq` | `bands`: see EQ bands; `outputDb` (0), gain after the bands |
| `compressor` | `thresholdDb` (-18), `ratio` (4), `attackMs` (10), `releaseMs` (100), `kneeDb` (6), `makeupDb` (0), `detection`: `peak` (default) or `rms`, `mix` (1; lower for parallel compression), `belowThresholdDb` (-40), `belowRatio` (1: no upward compression), `belowRangeDb` (24, at least 0), `sidechain` (none: `{"layerId": …}` keys it, see Sidechain) |
| `limiter` | `ceilingDb` (-1), `releaseMs` (100), `lookaheadMs` (5), `truePeak` (false; true also holds peaks between samples, adding 6 frames of latency), `inputDb` (0), `stereoLink` (1; 0 limits each channel on its own) |
| `gate` | `thresholdDb` (-50), `rangeDb` (-80), `attackMs` (1), `holdMs` (20), `releaseMs` (100), `hysteresisDb` (6), `detectorFallMs` (20), `lookaheadMs` (0; opens the gate before a transient, adding the same latency) |
| `reverb` | `decayMs` (2000), `preDelayMs` (10), `size` (0.5), `damping` (0.5), `width` (1), `mix` (0.25), `lowCutHz` and `highCutHz` (input filters, none when omitted), `diffusion` (0.8), `earlyReflections` (0), `modulationRateHz` (1), `modulationDepth` (0), `freeze` (false) |
| `delay` | `timeMs` (375), or `timeBeats` (0.75) when `sync` is true; `sync` (false), `feedback` (0.4), `pingPong` (false), `lowCutHz` (100), `highCutHz` (8000), `mix` (0.25), `rightTimeMs` or `rightTimeBeats` (the right channel's own time, selected by `sync`; omitted, the right follows the left), `modulationRateHz` (0.5), `modulationDepthMs` (0), `freeze` (false) |
| `distortion` | `mode`: `soft`, `hard`, `saturate`, `fold` or `bitcrush`; `driveDb` (12), `toneHz` (6000), `outputDb` (-6), `mix` (1), `bias` (0), `bits` (8, `bitcrush` only) |
| `chorus` | `rateHz` (0.5), or `cycleBeats` (4) when `sync` is true; `sync` (false), `waveform` (`sine`), `depth` (0.5), `delayMs` (10), `mix` (0.5), `stereoPhaseDegrees` (90) |
| `flanger` | `rateHz` (0.25), or `cycleBeats` (8) when `sync` is true; `sync` (false), `waveform` (`sine`), `depth` (0.7), `delayMs` (1), `feedback` (0.5), `mix` (0.5), `stereoPhaseDegrees` (90), `feedbackCeiling` (0.9, at most 0.98) |
| `phaser` | `rateHz` (0.5), or `cycleBeats` (4) when `sync` is true; `sync` (false), `waveform` (`sine`), `depth` (0.6), `stages` (4, at least 1), `feedback` (0.3), `mix` (0.5), `stereoPhaseDegrees` (90), `feedbackCeiling` (0.9, at most 0.98), `frequencyHz` (200, at least 100), `sweepOctaves` (4) |
| `multibandCompressor` | `lowCrossoverHz` (120), `highCrossoverHz` (2500), `low`, `mid` and `high` (each a `compressor`'s parameters, with its defaults), `outputDb` (0), gain after the bands |
| `deEsser` | `frequencyHz` (4000), `thresholdDb` (0), `reductionDb` (6, at least 0) |
| `plosiveRemover` | `frequencyHz` (150), `sensitivity` (0.5), `reductionDb` (18, at least 0); adds 5 ms of latency |
| `binaural` | `azimuthDegrees` (0), `elevationDegrees` (0, from -90 to 90), `distanceMeters` (1), `widthDegrees` (0), `rolloff` (1), `doppler` (0, from 0 to 1), `room` (none) |
| `noiseReduction` | `reductionDb` (24, at least 0), `smoothing` (0.5), `profileDb` (the noise: 43 band levels in dB, each -80 until learned with `learn-noise`); adds 1799 frames (37.5 ms) of latency |

A chorus, flanger or phaser `waveform` is `sine`, `triangle`, `saw`,
`square` or `noise` (a random value held each cycle). `cycleBeats` is how
many beats one sweep lasts (4 is a bar of 4/4). `stereoPhaseDegrees` is how
far the right channel's sweep runs ahead of the left's: 0 moves both
together, 180 in opposition. `feedbackCeiling` is the loop gain at full
`feedback`: higher rings and resonates more. The phaser sweeps from
`frequencyHz` up `depth` × `sweepOctaves` octaves. A distortion's `bias`
shifts the signal before the curve, adding even harmonics; `fold` folds
peaks back instead of clipping them, and `bitcrush` rounds to `bits` of
depth.

A multiband compressor splits the signal at its crossovers into a low, a
mid and a high band and compresses each with its own compressor, then sums
them; uncompressed, the bands add back up to the input's level at every
frequency. Each band takes a compressor's parameters, and omitted ones take
the compressor's defaults: `{"type": "multibandCompressor", "low":
{"thresholdDb": -24, "ratio": 2, "attackMs": 30, "releaseMs": 200}, "mid":
{"ratio": 1}, "high": {"thresholdDb": -30, "ratio": 3}}` tames the lows and
highs and leaves the mids alone (a ratio of 1 never compresses).

A compressor also compresses upward: below `belowThresholdDb` it raises
the level by `1 − 1/belowRatio` of how far it falls short, at most
`belowRangeDb`, so quiet sounds come up while loud ones go down. A
`belowRatio` of 1, the default, raises nothing. Attack is how fast the
raise comes in as the level drops, release how fast it lets go as it
returns. With both stages on every band, a multiband compressor squashes a
sound's dynamics from both sides, the loud, dense, bright OTT sound: the
`ott` preset below is Ableton's OTT. Its Depth is the bands' `mix`, set
all three together (0.3 for a subtle blend); its Time is the bands'
`attackMs` and `releaseMs`, and its Amount their ratios.

A `deEsser` tames harsh "s" and "sh" sounds in a voice. Everything above
`frequencyHz` is the sibilance band. Whenever that band is louder than the
rest of the signal at that moment by more than `thresholdDb`, it comes down
by the excess, at most `reductionDb` (6 cuts it by at most 6 dB; it never
boosts); the rest of the voice passes unchanged. The cut eases in through
a 6 dB knee, starting a little below the threshold. Because it compares the
band with the rest rather than with a fixed level, it catches quiet
sibilants and leaves loud, bright vowels alone, whatever the voice's level;
hiss between words (below about -42 dBFS) is left alone too. The defaults
suit typical speech: lower `thresholdDb` (-6) to catch softer sibilance,
raise it to catch only the harshest, and raise `reductionDb` (10) for more
reduction. Put it on the voice's own track or clip, before compression.

`plosiveRemover` takes the pops out of a voice ("p" and "b" thumping the
microphone): it cuts the low end below `frequencyHz` by up to
`reductionDb`, only while the band below `frequencyHz` is loud and stands
far above the voice from a fourth up, as a pop does and voiced sound
doesn't. A quiet rumble between words is left alone. The defaults suit
speech; raise `sensitivity` to catch softer pops, lower it if a deep,
close voice's own low end is cut, and raise `frequencyHz` for pops near
it. Put it early in a voice's chain, before compression.

`noiseReduction` brings a steady noise down under a voice: hiss, a mains
hum, a fan or a room's tone. It needs to know the noise: `profileDb` is its
level in 43 bands from the lowest frequencies up. Add the effect, then
measure the noise where it plays alone (room tone before the first word or
in a pause, at least 0.5 s, the longer the better) with
`tsrct learn-noise --project song.tsrct --effect 860 --start-ms 5850
--duration-ms 850`, which writes the profile into the effect's record.
Each frequency is then turned down by how far it stands above the
profile, by at most `reductionDb`, so the noise comes down while the voice
stays. Until its profile is learned it cuts next to nothing: learn it.
24 dB (the default) takes steady noise most of the way out; 12 leaves
more of the room, and 6 only takes the edge off. If a quiet, twittering
residue appears, raise `smoothing` (0.5), which trades it against how
quickly the reduction lets a quiet sound back in: lower it if soft word
endings disappear. The voice
itself is never cut where it hides the noise. Put it first on the voice's
own clip or track, before compression and EQ, so the profile measures the
noise as it arrives. It adds 1799 frames (37.5 ms) of latency.

A synced delay's `timeBeats` and `rightTimeBeats`, and a synced chorus's,
flanger's or phaser's `cycleBeats`, follow the composition's tempo at tick
0 (see `daw/midi`): `{"timeBeats": 0.5, "rightTimeBeats": 0.75, "sync":
true}` echoes an eighth note left and a dotted eighth right. `freeze` holds
the reverb's tail, or the delay's repeats, at their level and keeps new
input out of them.

`binaural` places the owner's audio around the listener's head, for
headphones (3D or "8D" audio). `azimuthDegrees` is the direction, clockwise
seen from above: 0 ahead, 90 to the right, 180 behind, -90 to the left; any
number, so 0 to 720 goes round twice. `elevationDegrees` is the height, 90
overhead. `distanceMeters` is from the centre of the head, and the level
follows `(1 m / distance)^rolloff`: at the default `rolloff` of 1 it falls 6
dB each time the distance doubles, and 0 keeps it. Within about 1 m the near
ear grows louder than the far one, as with a whisper, and far away air dulls
the highs. A stereo input becomes two sources `widthDegrees` apart, centred
on the azimuth; at 0 it is one. Put it last in the chain and leave the
owner's `pan` at the centre: effects after it, and pan, would blur where it
puts the sound. It adds 19 frames (0.4 ms) of latency. Automate the position
to move a source (see `daw/automation`). `doppler` bends the pitch of a
source moving towards or away from the listener, as a passing car's: 1 as
sound does, 0 (the default) not at all. The sound is on time when the
source is at the nearest distance its automation reaches, and later the
farther it is, by the time sound takes.

```json
{"type": "addFxMixerEffect", "compositionId": "song", "layerId": 20,
 "effect": {"id": 902, "effect": {"type": "binaural", "azimuthDegrees": -30,
  "elevationDegrees": 10, "distanceMeters": 1.5}}}
```

`room` puts the source and the listener in a room, for an environment: a box
`widthMeters` wide (left wall to right), `lengthMeters` long (back wall to
front; the listener faces the front wall) and `heightMeters` high, the
listener's ears `listenerXMeters` from the left wall, `listenerYMeters` from
the back wall and `listenerZMeters` above the floor. Each of `leftWall`,
`rightWall`, `backWall`, `frontWall`, `floor` and `ceiling` is `open` (no
surface) or a material: `acousticTile`, `brick`, `paintedBrick`,
`concreteBlock`, `paintedConcreteBlock`, `heavyCurtain`, `fiberglass`,
`thinGlass`, `thickGlass`, `grass`, `linoleum`, `marble`, `metal`,
`parquet`, `roughPlaster`, `smoothPlaster`, `tile`, `drywall`, `water`,
`wood` or `woodPanel`. The source stays where the azimuth, elevation and
distance put it from the listener, at most at a wall. Each surface adds its
reflection, coloured by its material, and a room closed along some direction
reverberates for as long as its size and materials make it: hard surfaces
ring, curtains and acoustic tile deaden. Outdoors is a room whose only
surface is a `grass` floor. `reflectionsDb` and `reverbDb` (0) raise or
lower the reflections and the reverberation. The listener's place and those
two levels are automatable; the size and the surfaces are not. For a scene's
environment, put the binaural effect on each clip: at a cut, a crossfade
lets the old room ring out as the new one fills.

A room preset is a ready-made environment for a binaural effect.
`applyFxMixerRoomPreset` sets the `room` of the binaural effect `effectId` to
a copy of the preset's, by `presetId`, replacing any room it had. The
effect's other parameters stay, and it keeps no link to the preset: read its
`room` to see what the preset set, then edit it like any other parameter.

```json
{"type": "applyFxMixerRoomPreset", "compositionId": "song", "layerId": 20,
 "effectId": 902, "presetId": "large-hall"}
```

The built-in room presets follow.

| `presetId` | Name | Category | Description |
|---|---|---|---|
| `outdoors` | Outdoors | Outdoors | An open field: the sound and its reflection from the grass, with no reverberation. For a shot in the open, away from buildings. |
| `street` | City street | Outdoors | A street between brick buildings, on the pavement: reflections from the road and the facades and a reverberation of about 2 s between them, open to the sky. |
| `small-room` | Small room | Rooms | A small office of plasterboard walls, a parquet floor and an acoustic-tile ceiling, seated: close, dry reflections and a short 0.4 s reverberation. |
| `living-room` | Living room | Rooms | A living room with curtained windows at both ends and a parquet floor, seated on the sofa: a warm room with about 0.6 s of reverberation. |
| `classroom` | Classroom | Rooms | A classroom with windows down one side, a linoleum floor and an acoustic-tile ceiling, seated: about 0.5 s of reverberation. |
| `tiled-bathroom` | Tiled bathroom | Small spaces | A small bathroom tiled from floor to ceiling, with a wooden door and a mirror, standing: bright, close reflections and almost 2 s of reverberation. |
| `car` | Car | Small spaces | Inside a car, in the driver's seat: glass all round, soft seats, floor and roof lining. Very close and dead, under 0.1 s of reverberation. |
| `small-metal-room` | Small metal room | Small spaces | Inside a steel shipping container, standing: hard, ringing reflections and 1.5 s of bright reverberation. |
| `stairwell` | Stairwell | Large spaces | A tall concrete stairwell, standing at the bottom: about 2 s of reverberation rising from below. |
| `concrete-garage` | Parking garage | Large spaces | A low, wide concrete parking garage open at one end: strong reflections from the floor and ceiling and about 3.5 s of reverberation. |
| `large-hall` | Large hall | Large spaces | A concert hall with wood-panelled walls and upholstered seating, in the stalls: distant reflections and a smooth 2.2 s reverberation. |
| `cathedral` | Cathedral | Large spaces | A stone cathedral with stained glass at both ends, in the nave: a vast space with about 8 s of reverberation. |

## Sidechain

A compressor's `sidechain` makes its detector read a key instead of its own
input: `{"layerId": 20}` names the track, audio layer, audio clip or video
layer whose audio is the key. The gain still applies to the compressor's
own audio. A compressor on a music track keyed by the dialogue track turns
the music down while someone speaks, and lets it back up with its
`releaseMs` when they stop: ducking. A video
layer's sound can be the key, as a talking-head video's often is.

The key is what that layer sends its track or the master, after its own
effects, `trimDb`, `volume`, pan and mute: turning the dialogue down ducks the music
less, and muting it, hiding it or soloing another track stops the ducking.

Set it with `addFxMixerEffect` or `updateFxMixerEffect`, like the other
parameters. For music under speech, start from `thresholdDb` -36 to -30,
`ratio` 4 to 8, `attackMs` 10 to 20, `detection` `rms` and `releaseMs` 300
to 600: a shorter release lets the music jump back up between words, a
longer one holds it down across short pauses and brings it back slowly.

```json
{"type": "createFxTrackLayer", "compositionId": "song", "layerId": 50,
 "name": "Music", "kind": "audio"}
```

```json
{"type": "addFxMixerEffect", "compositionId": "song", "layerId": 50,
 "effect": {"id": 903, "effect": {"type": "compressor", "thresholdDb": -36,
  "ratio": 6, "attackMs": 10, "releaseMs": 400, "detection": "rms",
  "sidechain": {"layerId": 20}}}}
```

- The key is a track, audio layer, audio clip or video layer of the same
  composition. A track's compressor may be keyed by one of its own clips.
- A compressor never hears its own output through its key: keyed by its own
  layer, by the track its clip is on, or round a loop of keys (track A keyed
  by B while B is keyed by A) is rejected with the reason.
- The master's compressors and a multiband compressor's bands take no
  `sidechain`.
- Deleting the key layer leaves the sidechain on with no key, `{}`, as
  Ableton's "No Input": the compressor hears silence, reduces nothing and
  applies only its `makeupDb`. Give it a new `layerId`, or remove the
  `sidechain` to compress its own input.
- Latency after the compressor delays its audio but not its key, so it ducks
  that much late: put the keyed compressor after any effect with latency on
  its owner (a limiter, a plosive remover, a noise reduction).
- Put the ducker on the music's track rather than on a clip: a clip's
  effects start from rest when the clip starts, so a clip starting while
  the voice already speaks ducks only after the compressor's attack.

## EQ bands

An EQ band is `{"id", "shape", "frequencyHz", "gainDb", "q", "enabled"}`.
`shape` is `lowCut`, `highCut`, `lowShelf`, `highShelf`, `bell` or `notch`;
a cut also takes `slopeDbPerOct`, 6, 12 (default), 24 or 48;
`frequencyHz` defaults to 1000, `gainDb` to 0, `q` to 0.707 and `enabled` to
`true`. Band ids share the composition's FX item-id space with instruments.

A bell or shelf can also take `dynamics`, which make its gain follow the
level in its band: `{"thresholdDb": -30, "ratio": 4, "attackMs": 5,
"releaseMs": 100, "kneeDb": 6, "rangeDb": -6}`. Those are the defaults, so
`"dynamics": {}` takes them all. As the band's level rises above
`thresholdDb`, its gain moves from `gainDb` by `1 - 1/ratio` of the excess,
as a compressor's gain reduction does, at most `rangeDb`: a negative range
cuts the band only while it is loud (a harsh resonance, sibilance, boomy
notes), a positive one lifts it. A bell reads the level around its
frequency, a low shelf below it and a high shelf above it. Cuts and notches
ignore `dynamics`; omit it for a static band.

- `addFxMixerEqBand` inserts `band` into the EQ `effectId` at `index`, or
  appends it.
- `removeFxMixerEqBand` removes the band `bandId`.
- `updateFxMixerEqBand` replaces the band whose id is `band.id`.

```json
{"type": "addFxMixerEffect", "compositionId": "song", "layerId": 20,
 "effect": {"id": 901, "effect": {"type": "eq", "bands": [
  {"id": 950, "shape": "lowCut", "frequencyHz": 80},
  {"id": 951, "shape": "bell", "frequencyHz": 3000, "gainDb": 2, "q": 1}]}},
 "index": 0}
```

```json
{"type": "updateFxMixerEqBand", "compositionId": "song", "layerId": 20,
 "effectId": 901, "band": {"id": 951, "shape": "bell", "frequencyHz": 2500,
  "gainDb": 3, "q": 1.4}}
```

```json
{"type": "addFxMixerEqBand", "compositionId": "song", "layerId": 20,
 "effectId": 901, "band": {"id": 952, "shape": "highShelf",
  "frequencyHz": 6000, "dynamics": {"thresholdDb": -28, "rangeDb": -8}}}
```

## Presets

`addFxMixerPreset` inserts a ready-made effect chain, by `presetId`, into an
owner's insert chain at `index`, or appends it when `index` is omitted. The
owner gets copies of the preset's effects, in order, with new effect and band
ids, so one preset can go on any number of owners. It keeps no link to the
preset: read its `mixer.effects` for the new ids, then edit, bypass, move or
remove the copies like any other effect.

The built-in presets follow, each effect without its ids; omitted
parameters take their defaults.

| `presetId` | Name | Category | Description | Effects, in order |
|---|---|---|---|---|
| `master-bus-glue` | Master bus glue | Master | A louder, denser mix that sticks together; for the master. | `{"type": "compressor", "thresholdDb": -24, "ratio": 3, "attackMs": 10, "releaseMs": 120, "kneeDb": 6, "makeupDb": 8}`; `{"type": "limiter", "ceilingDb": -1, "releaseMs": 100, "lookaheadMs": 5}` |
| `podcast-voice` | Podcast voice | Voice | Clear, close, even speech without rumble or boom; for a voice track or clip. Lower the compressor's threshold for a quiet recording. | `{"type": "eq", "bands": [{"shape": "lowCut", "frequencyHz": 80, "slopeDbPerOct": 24}, {"shape": "bell", "frequencyHz": 300, "gainDb": -3, "q": 1}, {"shape": "bell", "frequencyHz": 3500, "gainDb": 3, "q": 1}, {"shape": "highShelf", "frequencyHz": 10000, "gainDb": 2}]}`; `{"type": "compressor", "thresholdDb": -20, "ratio": 3, "attackMs": 5, "releaseMs": 100, "kneeDb": 6, "makeupDb": 4, "detection": "rms"}`; `{"type": "limiter", "ceilingDb": -1, "releaseMs": 50, "lookaheadMs": 5}` |
| `telephone` | Telephone | Creative | The thin, boxy sound of a phone line; for a voice, or for music heard through one. | `{"type": "eq", "bands": [{"shape": "lowCut", "frequencyHz": 600, "q": 0.71}, {"shape": "highCut", "frequencyHz": 2800, "q": 0.71}, {"shape": "bell", "frequencyHz": 1400, "gainDb": 6, "q": 1.2}]}` |
| `ott` | OTT | Creative | Ableton's OTT: hard three-band compression, down above and up below, for the loud, bright, in-your-face sound of a dubstep bass; also for leads and drums. For less of it, lower all three bands' mix together, as OTT's Depth does. | `{"type": "multibandCompressor", "lowCrossoverHz": 88.3, "highCrossoverHz": 2500, "low": {"thresholdDb": -39, "ratio": 66.7, "attackMs": 47.8, "releaseMs": 282, "kneeDb": 6, "makeupDb": 15.5, "detection": "rms", "belowThresholdDb": -46, "belowRatio": 4.17}, "mid": {"thresholdDb": -35.4, "ratio": 66.7, "attackMs": 22.4, "releaseMs": 282, "kneeDb": 6, "makeupDb": 10.9, "detection": "rms", "belowThresholdDb": -47, "belowRatio": 4.17}, "high": {"thresholdDb": -40.7, "ratio": 1000, "attackMs": 13.5, "releaseMs": 132, "kneeDb": 6, "makeupDb": 15.5, "detection": "rms", "belowThresholdDb": -46, "belowRatio": 4.17}}` |

```json
{"type": "addFxMixerPreset", "compositionId": "song",
 "presetId": "master-bus-glue"}
```

## Ids

The caller chooses every new effect and band id, except the copies
`addFxMixerPreset` makes. An add rejects an id the composition already uses,
on any layer, the master or a visual effect, and one its record repeats. An
effect update checks only the bands the effect did not already own.
