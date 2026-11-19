# Audio review

You cannot listen to the mix, and neither can the critics. Review it from
measurements and images, fix what they show, and tell the user which qualities
still need a listener.

## Render the evidence

Render the mix and its measurements from the same document state:

```sh
tsrct export-audio --project song.tsrct --output review/mix.wav \
  --stems review/stems --report review/report.json \
  --spectrogram review/spectrogram.png --waveforms review/waveforms.png
```

- `mix.wav` is the mix as delivered, 16-bit PCM.
- `stems/` holds one 32-bit float WAV per bus (the output, each master and each
  track), tapped where the bus feeds its parent and before the parent's effects.
  Stems line up with the mix sample for sample, and may exceed full scale before
  the master's limiter.
- `report.json` lists every bus under `buses`, with its `name`, `stem`, and
  levels over the whole render (`whole`) and per bar (`bars`, with each bar's
  number and times): `integratedLufs`, `maxMomentaryLufs`, `maxShortTermLufs`,
  `samplePeakDbfs`, `truePeakDbtp`, `rmsDbfs`, `clippedSamples` and `bandsDbfs`,
  the RMS of four bands (`sub` below 110 Hz, `low` to 500 Hz, `mid` to 4 kHz,
  `high` above). Levels are dB; `null` is silence. The stereo image comes with
  them: `correlation` and `subCorrelation`, the left and right channels'
  correlation over the whole band and the sub band (1 mono, 0 unrelated, −1
  inverted; `null` when a channel is silent), and `monoLossDb`, how much
  quieter the mono fold-down is (0 nothing lost, −3.01 for unrelated or
  one-sided channels, lower as they cancel). After the sub stops, its band's
  filters ring on for a while, so `subCorrelation` keeps a value in the bars
  that follow: read it only where `bandsDbfs.sub` shows the sub playing. Each bus's `onsetsMs` lists where each of
  its hits starts, in milliseconds on the timeline. Each bus's `tempo` is its
  detected tempo (`bpm`, `alternatives`, `beatsMs`, `firstDownbeatMs`, as
  "Sync to the music's tempo" in the sound design reference describes),
  `null` when it has no beat.
- `spectrogram.png` shows the output from 30 Hz to 16 kHz, with a line at each
  bar and a fainter one at each beat.
- `waveforms.png` has one row per bus, in the order of `buses`: its peak
  (blue) and RMS (orange) envelope on a square-root scale, full scale at the
  row's edges, dotted rows at −6 and −20 dBFS, with the same bar and beat
  lines on the same time axis as the spectrogram.

Measure one section with `--start-ms` and `--duration-ms`. Take the stereo
readings, onsets and waveforms from these outputs instead of computing,
detecting or drawing them with your own scripts.

## Fix what the measurements fail

Treat each failure as a defect to fix before the critics see the mix, unless the
brief asks for it:

| Check | Passes when |
|---|---|
| Clipping | The output has no clipped samples. |
| True peak | The output is at or below −1 dBTP, or the delivery spec. |
| Loudness | The output's integrated loudness is within 1 LU of the delivery spec, else of about −14 LUFS for music and −16 LUFS for speech-led audio. |
| Presence | Every part meant to be heard has a level in the bars where it plays, and its short-term loudness there is not buried under the output's. |
| Gaps | No bar is silent or drops sharply unless the arrangement calls for it. |
| Low end | One part at a time owns the sub band; voices carry little sub-band energy. |
| Mono | The output's `subCorrelation`, and each bass part's, is at least 0.9 in every bar where `bandsDbfs.sub` shows it playing, so the low end stays mono. The output's `correlation` is not negative in any bar, and its `monoLossDb` stays above about −4.5: a wide or one-sided bar reads −3.01 and is fine, while a negative correlation means parts cancel in mono; find the bus whose own readings go negative there. A `null` correlation means one channel is silent: nothing cancels. |
| Harshness | A voice or lead's high band does not jump without reason. |
| Seams | Loop and clip joins show no sample-peak spike in their bar, no spike in their row of the waveforms and no vertical click line in the spectrogram. |
| Cues | For sound to picture, each hit meant to land on a visual event has an onset in its bus's `onsetsMs` within a frame (about 33 ms at 30 fps) of that event's time, and no stray onset sits where nothing happens on screen. |
| Timing | A rhythmic track's or a supplied loop's detected `tempo.bpm`, or one of its `alternatives`, matches the composition's tempo, and its `beatsMs` fall on the spectrogram's beat lines. |

Fix the cause, not the meter: the part's gain and balance, its EQ or dynamics,
or the arrangement. Raise the master's level last. Render and measure again after
each change.

## Critic panel

Use the shared critic review with these roles:

- **Music critic**, in the art director's place for music: whether the piece
  is good, catchy, exciting and compelling, against the brief. For other audio
  a **producer** takes the place: the idea, arrangement, sound choices, groove,
  energy across sections and finish.
- **Mix engineer**, or a podcast producer for spoken audio, or an immersive
  audio engineer for binaural work: balance, low end, dynamics, loudness, stereo
  image and translation to small speakers, or placement and movement around the
  listener.

Give both critics the same evidence: the brief with tempo, key, length and a
section map in bars; `report.json`, whose stereo readings stand in for a
correlation meter; the spectrogram; `waveforms.png`, saying which row is which
bus; and `arrangement.md`, written each round in the critic-input
folder, listing each track, its instrument or source, its effects and its clips
by bar, with each binaural source's azimuth, elevation and distance over time.
For composed music, add `score.md`, written as for the
[composition review](composition-review.md). Give facts, not intent. The critics judge balance, dynamics, structure and
placement from the readings and list what only listening could show under Not
evaluated.

## Report

Give the user the final integrated loudness and true peak, any check that failed
or could not run, and what still needs a listener: timbre, groove and feel,
tuning, binaural placement on headphones, and the mix on real speakers.
