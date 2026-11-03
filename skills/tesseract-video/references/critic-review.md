# Critic review

Before you present a finished deliverable, have two independent critics score it,
and revise between rounds until both rate it at least 8.5/10, for at most three
review rounds. This applies to new work and to revisions; each new request from
the user gets its own rounds. A preview shared only to agree on a direction does
not need a panel; the result you deliver does. The panel runs once, on the piece
you deliver: when you build part of a larger piece with another Tesseract skill,
such as a 3D scene for a motion graphic, that part is reviewed within the larger
piece. Skip the panel only when the user explicitly asks you to; then say that the
result was not reviewed and give no score.

The panel adds to the checks the skill already requires. It does not replace
technical checks such as export validity, alpha, loudness, or font rendering, or
your own playback and listening. Finish those first so the critics judge the work
rather than a broken render.

## Choose the panel

- **Art director:** judges craft against the brief and the supplied references:
  the idea, composition, hierarchy, typography, color, motion and pacing,
  consistency, and finish.
- **Specialist:** an expert in what the deliverable must achieve for its audience
  and channel. Choose the role from the brief, for example:

| Deliverable | Specialist and focus |
|---|---|
| YouTube video | YouTube strategist: hook, retention, pacing, payoff, call to action |
| Paid social ad or short-form video | Performance creative strategist: the opening seconds, sound-off clarity, offer, call to action |
| Product launch or brand film | Product marketing lead: message, proof, positioning |
| Explainer or tutorial | Instructional designer: clarity, sequence, what the viewer can do afterward |
| Interview, documentary, or event edit | Story editor: structure, continuity, emotional arc |
| Titles, lower thirds, or overlays on footage | Broadcast designer: legibility over picture, safe areas, timing with the cut |
| Data animation or diagram | Information designer: accuracy, clarity, honest scales |
| 3D product shot or scene | Product visualization lead: form, materials, lighting, camera |
| Poster or print-style graphic | Campaign designer for its venue: legibility at distance, message at a glance |
| Social graphic | Social media strategist for that platform: stopping power in the feed, crop safety, copy |
| Slide layout | Presentation designer: one idea per slide, readability in the room |
| Web or app mockup | Product designer: task flow, hierarchy, accessibility, responsive layout |
| Custom browser editor | Creative-tool UX designer: workflow, feedback, error states, saving |

When the channel is unclear, choose the specialist whose success criteria the
brief states. Keep the same two roles for every round.

## Prepare the evidence

The critics' folders and your review notes go in the working folder.
That is the project's `.tesseract-work/`.
For each user request, before its first round, create or empty
`critic-input/<deliverable>/` there, copy
[critic-instructions.md](critic-instructions.md) into it unchanged (the critics'
rules, score anchors, and reply form, with no pass mark), and write the brief
there as `brief.md`; keep review notes and scores out of that folder. Reuse the
brief unchanged in every round unless the user changes the request; rebuild the
rest of the evidence from the current version each round, first removing earlier
views from that folder. Give both critics the same evidence, each file as an
absolute path, with names that do not reveal a version or round:

- **The brief:** the user's request in their own words; the audience, channel,
  format, and duration or size; the choices the user fixed (such as music, copy,
  colors, or footage), which are not to be changed; content the user has not
  supplied, shown as placeholders; and the supplied brand assets and references
  (logos, palettes, guidelines, fonts, reference images or videos), each marked
  as required or for inspiration. Give a reference video as a few stills or a
  strip, and name fonts rather than passing font files. List each reference
  file, such as a logo, still, or guideline PDF, in the evidence list too,
  labeled as a required or inspiration reference. For a social format,
  name the platform's crop and safe areas. For a revision, give the original
  brief when known and the user's change request, and list the parts the user
  did not ask to change as fixed.
- **The deliverable:** the exported video, the rendered PNGs, or the editor's
  source. Critics see a video through its views, so they need not get the video
  file itself.
- **Views at review resolution:**
  - Moving work: an overview filmstrip of the whole piece, about every 1–2 s for
    short pieces and every 5–10 s for pieces over two minutes, plus denser strips
    around the opening, the ending, each key reveal, and the cuts most likely to
    show a join or carry the story. Add a full-size frame of each distinct scene
    or look, typically one to three, for finish and defects anywhere in the
    frame. For small text or fine detail in a known region, add 100% crops
    instead of more full frames: cut them from full-size `preview` PNGs with any
    available image tool, following the region if it moves, with one region's
    crops at several times stacked or side by side in one sheet within about
    1500 px on its long side and 1 megapixel, or the host's image limit if lower,
    so it is viewed unscaled. Keep each strip to about 8–16 samples and the
    whole set to about 20 images; for a long piece, widen the overview spacing
    to stay within that, and favor the opening, the ending, and the riskiest
    cuts.
  - An overlay or graphic on longer footage: instead of the whole-piece
    overview, its active window plus a second or two on each side, showing the
    entrance, the hold over the busiest background, and the exit, with a
    full-size frame of the hold.
  - Static designs: each PNG at full size and downscaled to its intended viewing
    size, such as phone width for a social graphic; for designs larger than about
    2000 px on a side, 100% crops of text-dense regions made with any available
    image tool, each within about 1500 px on its long side and 1 megapixel, or
    the host's image limit if lower.
  - Work with sound: the loudness measurements and waveform images (for an
    overlay, of its window).
  - An editor: screenshots of a loaded project, an edit, playback, a save, and an
    error message you can trigger, such as opening an invalid file. If you cannot
    capture the running editor, say so; the critics then review the code and
    layout only.
- **Words and structure, for speech-led or narrated work,** written each round to
  `words.md` in the input folder: what is said against the current edit times,
  from a supplied transcript, the project's caption text, or words you verified
  by listening, with unverified parts marked; which source clip and range plays
  when; and the usable footage left out of the edit. Give facts only, not your
  intent, your judgment, or how the audio sounds. Without a reliable transcript,
  say so; the critics then list spoken content under Not evaluated.
- **Sources:** when the work uses the CLI, the `.tsrct` document, the resolved
  `tsrct` executable, the supplied strips' tile size, matched to the
  project's aspect, and the render flags the supplied views used, so a critic
  can render more frames to its own folder (critic-instructions.md has the
  commands). A critic that cannot run commands reviews the views you supplied.

Critics review stills and measurements; they cannot judge playback feel or sound
by ear, so your own playback and listening checks still apply.

Reuse views you already opened in your own checks of this version where they
fit, copied to a neutral name if theirs marks a version, round, fix, or
before/after.
Use the strip's stdout JSON to confirm `outputPath`, `frameCount`, and
dimensions. Inspect `resolvedSampling` when it is non-null; it is normally
null for explicit `--timestamps-ms` requests. Those samples follow the
requested times, while the visible labels are rounded to tenths of a second.
Open the strip to catch a blank or stale render and assess the actual image.
Open every view no JSON describes, such as a preview frame, crop, design view,
or screenshot, before listing it.

## Run the critics independently

Start each critic as a separate agent with fresh context (a subagent, task, or
worker, depending on the host), and run both at the same time when the host
allows. Neither critic sees the other's review, anything from earlier rounds
(scores, feedback, or what you changed), your own assessment or intent, or the
pass mark, and neither is told about earlier rounds. Its prompt holds only its
role and focus (with any scope note from the skill), these must-do lines, and the
evidence list:

```text
You are the <role>. Focus: <focus, with any scope note>.
First read in full: <input>/critic-instructions.md, <input>/brief.md, <input>/words.md.
Open every image listed below with your image-viewing tool before scoring, or reply `Cannot view images` with no score.
Open only the files listed here and frames you render; write only to <frames>.
Do not load the Tesseract skills or their references, or change the project or deliverable.
Reply in the form in critic-instructions.md, listing Viewed items by ID.
Evidence:
E1 <absolute path> — <what it shows>
Renderer: <tsrct> for <each document>; strip tiles <w>×<h>; flags <render flags, or none>
```

`<input>` is the critic-input folder and `<frames>` the critic's own folder in the
working folder, such as `critic-frames/<deliverable>/art-director/`, both absolute.
Name `words.md` only when you wrote it.
Omit the Renderer line when the work does
not use the CLI, and its strip tiles when you supplied no strips.
Label each
view by what it shows and its times, such as "100% crops of the title at 0:03,
0:05, and 0:07", never by version, round, or judgment. Replies give Score,
Verdict, Issues, Keep, Needs the user, Viewed, and Not evaluated, with one block
per design for a set.

If a critic's Viewed line leaves out the ID of an image you supplied of the
deliverable (its PNGs, strips, frames, crops, or screenshots) or of a required
reference, ask it once to open those images and update its reply. If the host
cannot start separate agents, or a critic still cannot view images, say so,
review the evidence yourself in that role from the brief and the evidence alone,
opening every view and following critic-instructions.md, and label that score as
self-assessed rather than independent. Use this only when the host cannot run
an independent critic, never to save time. A self-assessed score can end the
loop, but report it as self-assessed and never describe the work as
independently reviewed.

## Iterate

1. Assemble the evidence, run both critics, and report the round.
2. The panel score is the lower of the two critics' scores. For a set, each
   design has its own panel score, and the set's panel score is the lowest of
   them. If the panel score is at least 8.5, the panel passes; deliver that
   version.
3. Otherwise, save a checkpoint of the version the critics reviewed, one per
   design for a set (for an editor, a copy of its source), and name it in the
   round note.
   For a `.tsrct`, use `tsrct project checkout --project <document> --output Versions/<name>-<request>-round-<n>.json`,
   where `<name>` is the document's base name and `<request>` a short label for
   the user's request.
   Then:
   - If three rounds have run, or none of this round's issues can be fixed
     within the user's scope, stop and deliver as in step 4. List the remaining
     notes as suggestions, and ask about anything only the user can supply.
   - Otherwise, revise. Open the view each note cites, fix the issues with the
     most impact first, especially those both critics raise, and keep what they
     list under Keep. Resolve conflicting notes in favor of the brief. Stay
     within the user's scope: do not change choices the user fixed, invent
     footage, claims, or assets, or add work the user did not ask for. When the
     user names a choice loosely, such as "coral", you may tune the exact value;
     say what you picked. Put anything only the user can supply, such as new
     footage or approval to change the scope, in the round report as a question,
     and keep fixing the rest.
   - Re-render, repeat the skill's own checks, and start the next round with
     fresh critics, the same roles, and the same brief. Never start a round on
     an unchanged deliverable.
4. To deliver after a round that did not pass, choose the reviewed version with
   the highest panel score; on a tie, the later one. If that is not the latest
   version, restore the chosen checkpoint, re-render it, repeat the skill's
   checks, and tell the user which later changes were dropped and which
   checkpoint holds them. Restoring a reviewed checkpoint is not a change; its
   scores still apply.

If anything else changes after the last scored round, for example to pass a
technical check, start a new round if one remains; the changed version's earlier
score no longer counts, so step 4 cannot choose it. If no round remains, tell the
user what changed since the reviewed version, and that the scores apply to the
reviewed version.

Report each score exactly as returned. Never edit a critic's score or reply,
coach a critic toward a higher score, or rerun a round or replace a critic to get
a better result. If a critic fails to return a review, restart it once with the
same evidence and say so; if it fails again, use the self-assessed fallback for
that role.

## Keep the user informed

Report the loop in short messages as it runs:

- **Before the first round:** the review plan: the two roles and why that
  specialist fits, the pass mark of 8.5/10 from both critics, and the limit of
  three rounds.
- **After each round:** each critic's score (for a set, per design) and main
  feedback in a few concrete points with times or locations, then what you will
  change next and any note you will not act on and why, or that the panel
  passed.
- **At delivery:** the delivered version's scores from both critics and its
  panel score (for a set, per design), naming its round; how the scores moved
  across rounds; what you changed in response; feedback you did not address and
  why; and what the critics could not evaluate. If the panel did not reach 8.5,
  say so plainly and name what holds it back.

For example:

```text
Review plan: an art director and a YouTube strategist, each a separate agent,
will score the export; the strategist because the video must hold viewers on
your channel. It passes at 8.5/10 from both, with up to three rounds.

Round 1: art director 7.5/10, YouTube strategist 6.5/10.
Art director: the title at 0:03 collides with the speaker's face.
YouTube strategist: the first five seconds never show the promised result; the
call to action comes after most viewers have left.
Next: open on the result and move the title clear of the face. Not changing:
the call to action stays at the end, as you asked.

Round 2: art director 8.8/10, YouTube strategist 8.6/10. The panel passes.
Art director: the lower third at 2:10 sits slightly low on a phone.
YouTube strategist: the middle section, 1:20 to 2:40, could be tighter.

Final: art director 8.8/10, YouTube strategist 8.6/10, panel score 8.6/10 after
two rounds, up from 6.5/10. Not addressed: the call to action, as you asked; the
lower third and the middle section, left as suggestions. Not evaluated: the
sound by ear and the feel at full speed.
```

Scores are the critics' judgment of the evidence they saw. Present them as that,
alongside the checks you actually ran, not as proof of quality.

Keep a short note of each round's replies, with the version they reviewed, in
`review-notes/` in the working folder, where critics are never pointed. Empty each
critic's frame folder before its round, and delete the critic-input and frame
folders after delivery.
Keep the round checkpoints with the project so the user can return to a reviewed
version, and retire them later under the skill's storage guidance; checkpoints of
a detailed scene can be large.
