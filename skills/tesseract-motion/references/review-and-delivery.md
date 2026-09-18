# Review and delivery

## Review a render, not an intention

There are three different checks:

1. **Structural:** commit/apply accepts the document; assets resolve; output is produced.
2. **Technical:** source frames and intervals are correct; alpha and audio are present as intended; duration, resolution, and codec match the brief; fonts render correctly.
3. **Creative:** the footage tells the intended story; graphics earn their space; pacing and sound work; the result matches the supplied reference and brand.

Passing the first two does not justify calling the result excellent. Avoid inflated ratings or unearned claims of professional quality. Be specific about what was reviewed.

## During editing

Use [filmstrip review](filmstrip-review.md) for visual revisions,
[waveform editing](waveform-editing.md) for music timing and dialogue cuts, and
[ad hooks](ad-hooks.md) when designing an opening. Apply the relevant procedure
to the changed beat and its neighbors before final review.

## What to inspect

- Opening: does the viewer see a meaningful subject/action, or just a generic title?
- Footage: correct source moments, intentional framing, complete actions, no accidental freezes/black gaps, continuity across cuts. For talking heads, check [eyeline continuity](editorial-decisions.md#talking-head-eyeline-continuity) in the final crop: stable eye height/screen position across cuts, natural head movement, and deliberate rather than accidental framing changes.
- Graphics: real hierarchy, sufficient reading time, consistent type/palette, intentional motion, clear value beyond repeating speech.
- Overlays: no collisions with faces, hands, product details, captions, or safe-area boundaries throughout the interval.
- Full scenes: spatial relationships and animation explain the idea; avoid a sequence of static slides with transition effects.
- Audio: speech clear over the bed, meaningful source sound retained, motivated cue density, no double playback or clipped transients, smooth ducks and intended dropouts, lip sync correct. Check mono and low-volume playback; measure the final encoded integrated loudness and true peak against the chosen spec.
- Ending: enough time to understand the final thought/CTA, no accidental audio cut, correct final frame.
- Editability: text and vector layers remain editable; source IDs and timing remain traceable; versioned files can be reopened.

Sample the entrance, readable hold, exit, and frames around every important cut. Then watch at speed with audio. A filmstrip helps coverage but cannot establish the feel of a cut or mix.

## Focused technical checks

Use local `ffprobe` to inspect the final stream and duration. Check that audio exists when it is expected; an AAC stream alone doesn't prove the waveform is non-silent. If needed inspect the mix with `volumedetect`/`ebur128` and listen.

For sound passes, use `python3 <skill-root>/scripts/tesseract_sound.py measure /absolute/path/final.mp4 --report /absolute/path/edit/.tesseract-work/checks/loudness-v1.json`. Use `mobile-preview` to make a separate mono, band-limited listening copy; never replace the deliverable with that diagnostic. Read [sound design](sound-design.md) for working targets and listening criteria.

After speech cleanup, compare the same original/processed phrases at matched loudness, then listen in the full mix. Check consonants, voice identity, breaths, room tails, processing artifacts, and lip sync; use [speech cleanup](speech-cleanup.md) for the procedure.

For transparent overlays, export ProRes 4444 MOV as described in [local operation](local-operation.md).
Extract a representative alpha frame with FFmpeg `-vf alphaextract` and inspect it;
verify both uncovered transparent pixels and the intended opaque content. Composite
over light and dark backgrounds to check edges and shadows. MP4 does not carry alpha.

For fonts, render representative text with the imported files and check it against
[the chosen typography](fx-authoring.md#text-with-an-available-font). Check both
visual fit and glyph/layout correctness; successful export alone proves neither.

## Handoff

Use the same project root established in [project lifecycle](local-operation.md#project-lifecycle).
Check that the current document, export, and previews correspond and packaged
resources resolve. Review the supporting artifacts: make useful previews visible,
keep retained authoring files within the working subfolder, and tidy disposable
scraps. Do not turn handoff into a second workspace containing selected copies.

Show the playable video and link the editable document, useful previews, and
project folder. Briefly describe the result or changes and any actual limitations.
Surface actionable review findings rather than listing internal files or raw
measurements. Do not describe generated clips as real footage or mocked workflows
as working integrations.
