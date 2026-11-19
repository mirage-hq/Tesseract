# Samples and MIDI

Recorded samples make drums, breaks, vocals and acoustic instruments sound far better than synthesized ones. Before you search, tell the user they can supply their own samples, loops or MIDI, and use those first. Use CC0 and public-domain material unless the user asks for something else.

## Find samples and MIDI

- **Freesound** (freesound.org): one-shots, breaks, loops, vocals and field recordings. Search it with the license filter set to Creative Commons 0. Download a sound's HQ preview: its page's player links the `-lq.mp3` preview, and the same URL ending `-hq.mp3` is the HQ one. The original files need a login.
- **VSCO 2: Community Edition** (CC0): multisampled orchestral instruments and percussion as WAVs, in `github.com/sgossner/VSCO-2-CE`. Download single files from `https://raw.githubusercontent.com/sgossner/VSCO-2-CE/master/` followed by their URL-encoded path.
- **MIDI**: the Mutopia Project (mutopiaproject.org) has MIDI files of classical scores, many in the public domain; check each piece's license. Add a file to the document with `import-midi`.

## Prepare samples

Import the raw files and let each zone trim, fade and level them: don't write processed copies.

- **One-shots**: run `tsrct sample-zone --input <file>`. Its `zone` holds the `startMs` (3 ms before the hit), `endMs` (where the tail falls 50 dB below the peak) and `gainDb` (bringing the peak to −2 dBFS) to merge into the zone as they are, and the sampler fades the trimmed edges, so nothing clicks. Add `--no-pitch` for drums and other unpitched hits. For one sound among several in a file, pass `--start-ms` and `--end-ms` around it; a span opening inside an earlier sound's tail starts at the next hit. A file whose noise or DC floor sits within 50 dB of its peak never falls that far, so its `endMs` stays at the end of the span: set it by ear. A stereo file whose channels cancel when summed to mono reads as silent.
- **Kits and multisamples**: each file's `gainDb` normalizes that file alone. Where the files' balance matters, such as a pad's velocity layers or a multisampled instrument's notes, give every zone the lowest of their `gainDb` values, which keeps the loudest at −2 dBFS and the rest below it.
- **Pitch**: for a pitched sample the same `zone` holds the `rootKey` and `tuneCents` that play it in tune. Check the octave by ear and pass `--note` near the note you hear to settle it. Struck glass, metal, cups and timpani have no repeating waveform: add `--method spectrum`.
- **Sustained sounds**: add `--loop <out.wav> --cut` for a `gate` zone's sustain loop, and import that copy: the sampler loops without a crossfade, and the copy has one baked in. `--no-pitch` loops unpitched sounds, such as vinyl crackle.
- **Breaks and chops**: don't cut them into files. `tsrct sample-zone --input <file> --slices onsets` prints `zones`, one per hit of the same file on consecutive keys from `--first-key` (36 by default), each trimmed from just before its hit and all at one gain, so the break keeps its dynamics; `--slices beats` cuts at the beats `detect-tempo` finds instead, each slice holding what falls before the next beat. Give every zone the same `assetId`, an `id`, velocities 1 to 127, `tuneCents` 0 and the `gate` trigger, so a note's length chokes its slice, and play the keys in the order you want. To play a break at the song's tempo instead, detect its tempo with `tsrct detect-tempo --input <file>`, choosing among its `alternatives` the level the genre is written at, and lower each zone's `rootKey`: a 113 BPM break in a 172 BPM song plays 1.522 times faster, so its `rootKey` sits 7 semitones below its key, with `tuneCents` 27.3.

## Load them

Import each WAV with `tsrct project import-asset --kind audio --asset-id <id>`
and name that id in a zone's `assetId`.

- **A drum kit**: give each pad a sample voice, `{"type": "sample", "zones",
  "ampEnvelope"}`, with a zone per velocity layer. The pad keeps its key,
  choke group, gain, pan and tuning.
- **A sampler**: zones by key range, each with its `rootKey` and
  `tuneCents`; `oneShot` for hits, and `gate` with a `loop` for sustained
  notes. A sampled piano's key-up noises and string resonances, which a
  library plays when a note ends (SFZ's `trigger=release`), are `release`
  zones, each with the library's `rt_decay` as its `decayDbPerSecond`.
  Its pedal noises (regions on controller 64, such as `pedalD` and
  `pedalU`) go in the sampler's `pedalNoise`, `down` and `up`, each with
  its group's `volume` as `gainDb`; `resonance` adds the halo of the
  pedal's lifted dampers, modelled, where the library records no notes
  with the pedal down.
- **One sound across the keyboard**, as Ableton's Simpler plays it: one
  zone over keys 0 to 127 with the measured `rootKey`, `tuneCents`,
  `startMs`, `endMs` and `gainDb`. Set the sampler's
  `preserveLength` to keep the sound's length at every key, so a chord's
  notes ring alike; without it, notes above the root play faster and
  shorter, as a tape does. Keep chords within an octave or so of the root:
  larger shifts sound grainy.
