# Sound design for social video and ads

Sound helps establish rhythm, direct attention, and make the edit feel intentional. Design it with the pictures, not as decoration added after every animation. Keep speech understandable on small speakers at low volume.

## Permission and source selection

When making a new edit or when asked to improve its sound, add appropriate local sounds without asking for each cue. Use the user's supplied audio, meaningful production sound from the footage, an available local sound library cleared for the project, or this plugin's procedural accents. Preserve an explicitly chosen track and obey requests for silence or a clean dialogue-only edit. A narrow visual revision does not authorize restyling the whole mix.

The sound helper offers eight procedural accents. List them with `python3 <skill-root>/scripts/tesseract_sound.py list` and use `make` to generate a WAV with the desired duration, seed, or level locally. These are synthesized design accents, not recordings of the actual product. Do not imply that a synthetic click is factual evidence of how something sounds. For documentary/product claims, prefer authentic source sound.

Import selected supplied or generated files with `project import-asset --kind audio`, then use separate native Audio layers and keep source/gain/timing traceable. Follow [audio and timing](audio-and-timing.md) for placement and mixing. Do not bake all sound into a replacement video or change the source footage. The local-only plugin does not contact a music, voice, or sound-generation service. If a bespoke soundtrack is essential and no suitable local track exists, identify that missing input; do not invent narration or silently replace the user's music.

For an ad opening, follow [ad hooks](ad-hooks.md) to map the chosen visual event to the music and a motivated sound accent. Align perceptual arrivals/transients, preserve speech, and use the existing music hit alone when it already provides the impact.

## Five roles to consider

These are five possible roles, not five compulsory tracks. Use only the layers that improve the piece; absence and silence are useful decisions.

| Role | What it contributes | How to mix and place it |
|---|---|---|
| Primary dialogue / voiceover | Meaning, character, narrative clarity | First priority. Keep the main voice centered; use clip gain and, when needed, compression for consistent intelligibility. Preserve breaths and natural emphasis. Heavy compression is a choice for uneven material, not an automatic preset. |
| Background music | Emotional direction, pacing, continuity | Establish a useful bed level, then duck it around speech. A gentle presence-region dip around 1–3 kHz can help if the music masks consonants; listen rather than hollowing out the track. Use lifts or dropouts to support a reveal or punchline. |
| Micro-SFX / UI accents | Points attention at a particular event | Pops, taps, clicks, paper sounds, and pings should match meaningful motion or interaction. Short upper-mid/high-frequency detail often reads on a phone; avoid piercing transients or repeated notification-like pings. |
| Structural transitions | Marks a change in scene, energy, or argument | Choose a whoosh, riser, downlifter, impact, or deliberate pause when the transition earns emphasis. Align the arrival/peak with the reveal, not automatically the sound file's beginning. Low impacts need audible harmonics so their meaning survives small speakers. |
| Diegetic foley / ambience | Gives footage physical context and continuity | Prefer source product clicks, handling, room tone, and environmental texture. For background texture, roughly 18–24 dB below dialogue is a starting relationship, not an absolute fader setting. Featured product sounds can come forward in speech gaps. |

For a fast ad, reassess attention every 2–4 seconds; that does not mean inserting a whoosh every 2–4 seconds. Avoid stacking a pop, hit, whoosh, and bass drop on the same trivial text entry. One deliberate cue often reads more clearly.

For speech that needs repair or tonal/level improvement, use [speech cleanup](speech-cleanup.md). Establish a natural, intelligible voice before building the mix around it; avoid amplifying room sound with excessive compression.

## Stack the mix around the voice

1. Establish the timing anchor. For talking-led work, tighten and verify the dialogue/source edit before mixing around it. When music was supplied or generated first, map its beats, phrases, and major changes before planning picture timing. Follow [waveform editing](waveform-editing.md) in either case; listen to confirm the waveform candidates. Speech remains intelligible and complete even in a music-led edit.
2. Place the music to establish the arc. Start a music duck around 3–6 dB below its unducked level, adjusting by ear to the actual tracks. Begin the reduction just before speech; use a short smooth attack and a slower release so the bed does not pump between syllables. As a starting point, try about 30–80 ms down and 150–350 ms back up.
3. Add micro-SFX only to actions the viewer should notice. Shape their tails and reduce them during important words.
4. Add structural cues to the few major changes. Check the sequence with those cues muted; they should improve the cut rather than conceal a weak one.
5. Restore subtle ambience/foley where it helps the footage feel connected. Retain useful production sound rather than burying it under added effects.

The relative duck is a multiplier: −3 dB ≈ 0.708 and −6 dB ≈ 0.501. Apply it to the selected bed gain. A fader value of 0.2 does not mean the bed is a fixed number of dB below the voice; the input waveforms determine that relationship.

## A brief drop in density

An 80–200 ms pause in music and background texture before a reveal can create contrast. Treat it as an option to audition, not a universal retention technique. Preserve any word or authentic sound carrying the meaning. If actual silence is intended, account for all audible layers and lingering tails; muting music alone may not create silence. Short 5–20 ms ramps can avoid clicks while still feeling abrupt. Let the reveal's cue/music return make the payoff legible.

## Frequency and mobile translation

- Protect the speech's presence, broadly in the mids. Start with level and arrangement before EQ; do not remove the entire 500 Hz–4 kHz region from every background track.
- Reserve deep low end for the music's bass/kick or a selected impact, and avoid overlapping several bass-heavy effects. Do not depend on sub-bass for information a phone listener must hear.
- Micro sounds can use upper-mid/high detail, often around 2–8 kHz, but brightness is not permission to boost everything above 5 kHz. Check sibilance and fatigue.
- Center the narrative voice and keep essential cues audible in mono. Check headphones, low playback volume, and a phone when available. The helper's mono/band-limited preview is a diagnostic aid, not an exact device simulation.

## Loudness and delivery

Use approximately −15 LUFS integrated, with an acceptable starting range of −16 to −14 LUFS, when there is no explicit delivery spec. This is a working social-video target, not a claim that every feed has the same normalization policy. Preserve intended contrast rather than forcing every short cue or quiet passage to that loudness.

Keep the **final encoded** true peak at or below **−1 dBTP**. True peak is measured in dBTP, not the sample-peak dBFS reading. Leaving a little extra margin before AAC encoding, such as −1.5 dBTP, can help, but remeasure the actual deliverable. Follow a supplied platform/client spec over this default.

Listen to the completed muxed video. Check speech clarity, cue density, abrupt edges, unintended silence, bass clutter, and the head/tail. Measure the final audio and keep the report with the project. A good meter reading is not proof of a good mix.

For exact local operations, native envelopes, and the distinction between timed ducking and signal-driven compression, read [audio and timing](audio-and-timing.md).
