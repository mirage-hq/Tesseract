# DAW tracks, audio clips and fades

These actions arrange a song in an FX
composition: tracks, the audio clips on them (a video's sound among them),
clip fades and crossfades.
Read [daw/mixer](daw-mixer.md) for gain, pan and insert effects,
and [daw/midi](daw-midi.md) for MIDI clips, notes, instruments
and tempo. Every action names an existing FX composition with `compositionId`.
The examples in the `daw/` topics build one song in a composition `song`,
read in order: tracks, then mixer, then MIDI.

## Model

The root composition is the master. Each track is a bus feeding it.

- A `Track` layer is audio (`"kind": "audio"`) or MIDI (`"kind": "midi"`),
  never both. An audio track holds audio clips in its `items`, and its
  `crossfades`; a MIDI track holds MIDI clips in its `items` and plays them
  through its `instrument` (see `daw/midi`). A clip is not a layer, but its
  id is a layer id, and actions name it by `layerId` as they name a layer.
- An audio clip (`AudioItem`) has an `Audio` layer's fields except
  `parent`, `startTime` and `activeRange` (it stores `playback`), plus an
  optional `sourceTempo`. An `Audio` layer has no `sourceTempo`.
- Tracks sit only at the composition root, never in a Group or another
  track. A track has no visual fields and no timing: it spans the whole
  composition, and its clips' windows are in composition time. Hiding a track
  silences its clips.
- A track holds any number of clips, sorted by start. Windows are half-open
  (start included, end excluded), so one clip may end exactly where the next
  starts, but two clips never overlap. A track places its clips itself: the
  actions below take no index for a clip.
- A clip's edges are hard: nothing outside its window is heard, except
  inside a crossfade.
- Audio and video layers outside tracks mix straight into the master,
  through their own `volume` and `mixer`. Groups have no audio controls and
  pass their children's audio through at unity.

An edit that would break a track rule fails with `TrackInvalid`, whose reason
names the track, the clips and the rule. Nothing changes on failure.

## Ids

Allocate each new layer id before building the action, as for any layer
(Python: `project.allocate_layer_ids(scope, keys)`). The caller also chooses
the other new ids, each unused in its composition-wide id space:

- Instrument, oscillator, LFO, sampler-zone and EQ band ids are FX item ids,
  one space shared with every other FX item: pick values above the largest FX
  item id of any kind in the composition.
- Audio effect ids share the effect-id space with visual layer effects: pick
  values above the largest effect id.
- Layer ids: pick values above the largest layer id. Clip ids, audio and
  MIDI, are layer ids too.

## Create a track

`createFxTrackLayer` adds an empty track at the composition root. It takes
`layerId`, `name`, an optional `description`, `kind` and an optional
`insertIndex` among the root layers (omit it to place the track below every
root layer). A MIDI track requires `instrument`; an audio track takes none.
Read `daw/midi` for instruments.

```json
{"type": "createFxTrackLayer", "compositionId": "song", "layerId": 20,
 "name": "Vocals", "kind": "audio"}
```

`deleteFxCompositionLayer` deletes a track together with its clips.

## Put audio clips on a track

- `createFxAudioItem` creates a clip on the audio track `trackLayerId`. It
  takes `createFxAudioLayer`'s fields except `parentLayerId` and
  `insertIndex`; `activeRange` is in composition time.
  `createFxAudioLayer` cannot create a clip on a track.
- `moveFxLayerToTrack` moves an audio layer onto an audio track from the
  root or a Group, keeping its composition time: the layer becomes a clip of
  the track. It also moves a clip from another track; a clip leaving a track
  loses the crossfades that name it.
- `moveFxCompositionLayer` moves a clip off its track, to the root or a
  Group, where it is an `Audio` layer again, keeping its composition time;
  it never moves anything onto a track. Its crossfades go, and its neighbour
  then has a hard edge, or its own fade. A clip that follows the tempo map
  cannot leave its track, and a clip's `sourceTempo` without `follow` is
  dropped.
- `deleteFxCompositionLayer` deletes a clip and its crossfades.
- Actions that edit an audio layer by `layerId` edit a clip the same way:
  timing (`retimeFxLayer`, `splitFxLayer`, `animatorDuplicateLayer`),
  volume, mixer, automation, fades and captions. The clip stays sorted, and
  an overlap fails with `TrackInvalid`.

```json
{"type": "createFxAudioItem", "compositionId": "song", "trackLayerId": 20,
 "layerId": 21, "name": "Verse vocal",
 "activeRange": {"start": 0, "duration": 4000},
 "sourceRange": {"start": 0, "duration": 4000},
 "sourceIntrinsicDuration": 4300, "source": {"assetId": "vocal-take"}}
```

The track then stores the clip in its `items`, with no `type` and no
`parent`:

```text
{"type": "Track", "kind": "audio", "id": 20, "name": "Vocals",
 "items": [{"id": 21, "name": "Verse vocal", "volume": 1.0, "windowMs": 50,
   "source": {"assetId": "vocal-take"},
   "sourceRange": {"start": 0, "duration": 4000},
   "playback": {...}, "sourceIntrinsicDuration": 4300}]}
```

Then move the root audio layer 22, which starts at 4 s where clip 21 ends,
onto the same track:

```json
{"type": "moveFxLayerToTrack", "compositionId": "song", "layerId": 22,
 "trackLayerId": 20}
```

## Detach a video's sound

A video's sound plays straight into the master; only audio clips go on
tracks. `detachFxVideoSound` moves the sound of the video `layerId` into a
new `Audio` layer `newLayerId`, which plays the same asset (its enhanced
audio when enabled), window, source timing, `preserveAudioPitch`, `volume`
and `mixer`, and takes the automation of the video's volume, pan, mute and
insert effects. The video keeps its picture and is silent: it loses its
`volume` and `mixer`. The clip lands directly below the video, under the same
parent, so a Group's window, time remap and visibility still apply. With
`trackLayerId` it is created as a clip of that audio track instead, keeping
its composition time, as `moveFxLayerToTrack` moves a layer; an overlap fails
with `TrackInvalid`. The clip and the video are independent afterwards:
trimming or moving one leaves the other. A video without sound (no `volume`
and no `volume` animator) is rejected, as is a video already detached.

The song's root video 23 carries an interview's sound. Put it on a track of
its own:

```json
{"type": "createFxTrackLayer", "compositionId": "song", "layerId": 24,
 "name": "Dialogue", "kind": "audio"}
```

```json
{"type": "detachFxVideoSound", "compositionId": "song", "layerId": 23,
 "newLayerId": 25, "trackLayerId": 24}
```

## Tempo-following audio clips

A clip on an audio track may carry `sourceTempo`, its source's tempo: `bpm`
(> 0) and `firstBeatMs`, the source millisecond of a beat on its grid; an
`Audio` layer has none. With `follow` (`startTick`, `lengthTicks`,
`contentOffsetTicks`), the clip is placed in ticks of the composition's
tempo map, as a MIDI clip is, and stretches to follow the tempo, so a tempo
edit never rewrites it; its `playback` and `sourceRange` are then not read.
A track's clips all follow or none do. Timing
actions in milliseconds snap a following clip's edited edges to the nearest
tick. No action turns following on or off yet. `tsrct detect-tempo --project
<doc> --layer <id>` measures a clip's whole source: its `bpm` and
`firstDownbeatMs` are `sourceTempo`'s `bpm` and `firstBeatMs`.

## Clip fades

`setFxAudioClipFade` sets or clears the `fadeIn` (`"edge": "start"`) or
`fadeOut` (`"edge": "end"`) of an audio clip or an `Audio` layer. `fade` is
`{"durationMs", "curve"}` with `curve` `linear` or `equalPower`. Omit `fade` or
pass `null` to clear it; a zero `durationMs` is no fade. Fades are measured
from the clip's heard edges: a fade-in rises from silence at its start, a
fade-out falls to silence at its end. Other layers are rejected.

```json
{"type": "setFxAudioClipFade", "compositionId": "song", "layerId": 21,
 "edge": "end", "fade": {"durationMs": 500, "curve": "equalPower"}}
```

A keyframed `volume` keeps working alongside a fade.

## Crossfades

A crossfade joins two clips of one audio track where the first ends exactly
at the second's start. Its window is centred on that edge: half of
`durationMs` (rounded down) on each side. Inside it the earlier clip keeps
playing past its end while fading out, and the later one starts early while
fading in. `linear` gains sum to 1; `equalPower` gains are each -3 dB at the
edge. A crossfade shorter than 2 ms leaves a hard edge.

- `addFxTrackCrossfade` takes `trackLayerId`, `beforeLayerId`,
  `afterLayerId`, a positive `durationMs` and `curve`. Neither clip may
  already have a crossfade at that edge.
- `updateFxTrackCrossfade` replaces the `durationMs` and `curve` of the
  crossfade the three ids name.
- `removeFxTrackCrossfade` removes it; the clips then meet with hard edges or
  their own fades.

```json
{"type": "addFxTrackCrossfade", "compositionId": "song", "trackLayerId": 20,
 "beforeLayerId": 21, "afterLayerId": 22, "durationMs": 40,
 "curve": "equalPower"}
```

Each half must fit inside both clips' windows, and each clip needs source
audio past its edge for the half: its source mapping, continued past the
edge, must stay inside its asset. For a plain clip, the earlier clip's asset
must run on after its `sourceRange` ends and the later clip's must start
before its `sourceRange` does. A crossfade that does not fit fails with
`TrackInvalid`; trim the clips' source ranges to leave room. While a crossfade exists it
replaces the clips' own fades at that edge; they are kept and heard again once
it is removed.
