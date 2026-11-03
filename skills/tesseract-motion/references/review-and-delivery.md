# Review and delivery

## Review a render, not an intention

There are three different checks:

1. **Structural:** the document saves without errors; assets resolve; output is produced.
2. **Technical:** source frames and intervals are correct; alpha and audio are present as intended; duration, resolution, and codec match the brief; fonts render correctly.
3. **Creative:** the composition communicates the intended idea; hierarchy, timing, and style match the brief and supplied references.

Passing the first two does not justify calling the result excellent. Avoid inflated ratings or unearned claims of professional quality. Be specific about what was reviewed. Scores come from the [critic review](critic-review.md); report them exactly as the critics returned them.

## What to inspect

- Composition: clear hierarchy, readable text, consistent type and palette, and
  enough time to understand the content.
- Placement: intended spatial relationships, framing, and no accidental overlap
  or clipping throughout the relevant interval.
- Appearance: fonts, images, materials, lighting, and effects match the intended
  result at delivery size.
- Motion, when present: entrances, holds, exits, and transitions work at playback
  speed. Sample feature-critical times and inspect full-size frames wherever
  text or detail matters. A filmstrip alone does not establish smooth motion.
- Editability: native elements remain editable, stable IDs and timing are
  preserved, and the saved document can be reopened with its packaged resources.

Inspect the saved output from the current revision. Apply the specialist checks
selected by the skill for the task, and report any checks that could not run.

## Focused technical checks

For transparent overlays, export ProRes 4444 MOV as described in [local operation](local-operation.md).
Extract a representative alpha frame with FFmpeg `-vf alphaextract` and inspect it;
verify both uncovered transparent pixels and the intended opaque content. Composite
over light and dark backgrounds to check edges and shadows. MP4 does not carry alpha.

For fonts, render representative text with the imported files and check it against
[the chosen typography](fx-authoring.md#text-with-an-available-font). Check both
visual fit and glyph/layout correctness; successful export alone proves neither.

## Handoff

After the checks above, hand off the version the [critic review](critic-review.md)
settled on, running the review first if you have not; if anything changed after
its last scored round, say so as described there.
Use the same project root established in [project lifecycle](local-operation.md#project-lifecycle).
Check that the current document, export, and previews correspond and packaged
resources resolve. Review the supporting artifacts: make useful previews visible,
keep retained authoring files within the working subfolder, and tidy disposable
scraps. Retire superseded full document copies, routine checks, and iteration
exports as described in [storage](local-operation.md#storage); keep the JSON
checkpoints of meaningful revisions with the project. Do not turn handoff into a
second workspace containing selected copies.

Show the rendered preview or playable video appropriate to the task and link
the editable document, useful previews, and project folder. Briefly describe the result or changes, the critics' final scores,
and any actual limitations.
Surface actionable review findings rather than listing internal files or raw
measurements. Do not describe generated clips as real footage or mocked workflows
as working integrations.
