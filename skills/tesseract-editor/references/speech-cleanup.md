# Clean up talking audio

Read this when dialogue needs clearer tone, steadier levels, or less room noise/reverb. Apply only the processing the recording needs. Keep the speaker's identity, natural breathing, and complete words. A clean source may need only gain adjustment.

## Diagnose before choosing a treatment

Audition representative loud and quiet phrases, sibilant words, pauses, and phrase endings where reflections are audible. Check the source waveform and, when useful, a spectrum/spectrogram. A waveform helps with timing and levels; it cannot distinguish all noise, reflections, or intelligibility problems.

Separate **room tone** (background ambience/noise), **reverb** (the voice's decaying reflections), and **echo** (audible repeats). Also check for clipping, mic handling, plosives, hum, and changing mic distance. Lowering gain does not repair clipping already in the recording.

Probe and listen to available audio streams/channels first. A clean lavalier or boom track is preferable to repairing a distant camera mic. Do not blindly sum different mics: delayed copies can create comb filtering and more apparent room sound. Center a selected mono voice deliberately while preserving meaningful stereo production sound elsewhere.

## Choose a light treatment

These are starting points to audition, not a fixed chain or a requirement to use every processor.

| Problem | Useful first treatment | What to listen for |
|---|---|---|
| Uneven speaking levels | Ride phrase/clip gain before relying on heavy compression; preserve intentional emphasis. | The voice should stay present without making breaths and room tails unnaturally loud. Peak normalization alone does not level speech. |
| Rumble or handling noise | Try a gentle high-pass around 60–90 Hz, lowering the cutoff for a voice with useful bass. Address isolated plosives locally when possible. | Stop before the voice loses body. A high-pass is not a reverb remover. |
| Mud or boxiness | Find the actual resonance; audition a broad 1–3 dB reduction somewhere around 200–500 Hz. | Avoid automatically scooping all low mids or making the voice thin. Room coloration can occur outside this range. |
| Harshness or poor intelligibility | Reduce the offending band modestly before adding brightness. Keep room for speech by reducing competing music. | A presence boost around 2–5 kHz can also amplify harshness, hiss, and reflections; clearer is not always brighter. |
| Steady hiss, fan noise, or hum | Use restrained noise reduction; try roughly 3–6 dB first. A narrow hum notch is appropriate only at a confirmed hum frequency/harmonic. | Listen for watery/bubbly artifacts and lost consonants. Learn a noise profile only from an actual speech-free segment; a changing background is not stationary noise. |
| Excess dynamics after gain rides | Try a soft-knee compressor around 2:1–3:1, attack 10–30 ms, release 100–250 ms. Set threshold from this recording; a few dB of reduction on louder phrases is a useful first audition. | Too-fast attack dulls consonants; a fast release or excessive makeup gain can bring up room sound and cause pumping. Adjust by phrase behavior, not a preset label. |
| Sharp “s” and “sh” sounds | Apply selective de-essing in the actual sibilant region, often roughly 4–10 kHz. Recheck after EQ/compression. | Preserve articulation. Excess de-essing creates a lisp; a permanent large treble cut dulls the whole voice. |
| Audible noise between phrases | Prefer natural room tone, gentle gain rides, or mild expansion when needed. | Hard gates can chop breaths and word tails and make the room switch on/off. Silence detection is not word-boundary detection. |

A useful order to audition is source/channel selection → repair or light noise reduction → corrective EQ → leveling/compression → selective de-essing → mix gain. Change the order or omit stages according to the recording. Avoid stacking several enhancement passes that each remove speech detail. Use [waveform editing](waveform-editing.md) when shortening pauses; processing does not make an unsafe trim safe.

## Room reverb and echo

EQ may reduce room boxiness, but cannot separate all reflections from the direct voice. Gating reduces tails in gaps and does not remove reverb underneath words. Heavy compression often makes the problem more noticeable. Retain some room character if removing it damages the voice.

This plugin has **no bundled dedicated dereverberation or speech-isolation model**. FFmpeg's `afftdn` is a noise reducer; `aecho` adds echo. Neither is a general speech dereverberator. If a suitable local enhancement tool/model is already available and permitted, audition it conservatively on a copy. Do not silently download a model or upload dialogue to an external service. Echo cancellation that requires a clean reference signal is not a general solution when that reference is absent.

Compare a moderate treatment before increasing strength. Check phrase endings, quiet consonants, natural breaths, and voice texture. Back off if it sounds metallic, watery, phasey, or syllables disappear. For a badly reverberant recording, report the remaining limitation honestly; improved intelligibility is a useful result even when the room cannot be fully removed. Missing words and a clean studio recording cannot be guaranteed from damaged source audio.

## Apply locally and preserve timing

Tesseract's native controls are source/active ranges, gain, and gain envelopes. EQ, compression, denoising, and de-essing use a **new local audio derivative**, not invented Tesseract DSP fields. Inspect installed filter options with `ffmpeg -h filter=<name>` before using them. In particular, `acompressor` threshold/makeup use linear amplitude and attack/release use milliseconds; FFmpeg `deesser`'s `f` parameter is normalized, not a frequency in Hz.

This optional example auditions gentle rumble/boxiness reduction and compression on an **already aligned dialogue-only WAV**. Choose its settings from the actual recording, or omit unnecessary filters:

```bash
ffmpeg -nostdin -n -i /absolute/path/edit/dialogue-aligned.wav -map 0:a:0 -vn -af "highpass=f=70:p=2,equalizer=f=300:t=q:w=1:g=-2,acompressor=threshold=0.125:ratio=2:attack=15:release=150:makeup=1" -ar 48000 -c:a pcm_s24le /absolute/path/edit/dialogue-clean-v1.wav
```

`threshold=0.125` is approximately −18 dBFS and may be inappropriate for another input level. This example performs no de-reverb, loudness normalization, or true-peak limiting. For steady noise, the locally available `afftdn` can be auditioned separately with modest `nr` and a noise floor derived from the recording; do not call its defaults a universal cleanup preset. Its noise-only output mode can help reveal whether removed material includes words.

Keep the original file and record the selected stream/channel, processing recipe, source range, and mapping to project time. Favor processing continuous dialogue takes before trimming into many short clips; independent per-clip processing can create changing noise floors and processor transients. If processing an excerpt, include handles and record its offset.

Verify duration, head/tail, channel layout, processing latency, and lip sync before replacing audio in the project. A decoded WAV may start at zero even when its source video's audio starts later. Preserve that offset explicitly. Never time-stretch or trim the source to make a derivative appear aligned. Import the processed derivative with `project import-asset --kind audio` using a new asset ID. Then replace only the intended dialogue or mute its original playback when using an independent Audio layer, avoiding doubled speech. Keep music and SFX separate.

## Decide whether it is actually better

Compare original and processed versions over the **same phrases at matched perceived loudness**. Use integrated/short-term measurements to establish a comparison level, then listen; peak matching alone can bias the comparison. Audition quiet phrases, loud words, “s” sounds, and room tails with music muted, then in the full mix. Change one major treatment at a time when diagnosing artifacts.

Keep the milder version if it preserves more speech detail. Check headphones, mono, and low-volume playback; verify waveform joins and lip sync after processing. Follow [audio and timing](audio-and-timing.md) for final encoded loudness/true-peak checks. Do not normalize each voice clip independently to the complete-program target.

Record the actual benefit and any remaining room sound or artifacts. If audio cannot be auditioned in the host, processing and meter results remain unverified for listening quality; do not describe them as successful cleanup.
