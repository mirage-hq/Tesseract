# Build a visual hook for an ad

For a new paid-social, YouTube, or other video ad, deliberately design its opening few seconds. Derive the hook from the actual product, footage, audience, promise, and evidence. Make it visually compelling from the first frame, with a clear reason for the intended viewer to keep watching. Sound and transitions should strengthen that idea. A hook may be a powerful shot, an overlay, or a complete motion scene; it need not be an extra intro card.

Apply this when creating an ad or improving its opening. A narrow revision elsewhere does not require rebuilding the hook. Preserve an opening the user has explicitly chosen unless changing it is part of the request.

## Choose the idea before the treatment

Inspect the source material and brief. Identify the viewer's relevant problem/desire, the strongest truthful benefit or surprising moment, and where the body of the ad delivers on it. Use the most compelling source moment even if it occurs late in the footage, provided reordering does not distort what happened or what the speaker meant.

For a substantial new ad, consider a few distinct concepts—usually two or three is enough—then select and build the strongest within the authorized edit. Compare concepts by immediate clarity, relevance, visual interest, available evidence, fit with the brand/music, and the transition into the body. Different fonts or whooshes on the same opening are treatment variations, not different hook ideas. No separate approval is needed for each ordinary creative choice; render multiple variants when requested or when a close choice makes a short comparison useful.

| Hook approach | What the viewer sees | Use it when |
|---|---|---|
| Result first | The best real outcome or most impressive working moment, then its explanation. | The supplied result is immediately legible and credible. |
| Recognizable friction | A specific frustrating task, awkward moment, or bottleneck in action. | The audience can recognize its relevance without a long setup. |
| Visible contrast | An A/B, a matched comparison, or a transformation that makes the difference obvious. | Both sides are supported by the material; labels and timing make the comparison fair. |
| Unexpected perspective | A tight detail, unusual crop, scale shift, or reveal that resolves into the product/use case. | The surprise helps the viewer understand the offering instead of becoming unrelated spectacle. |
| A visual question | An incomplete action, interrupted process, or concealed detail whose answer begins to emerge quickly. | The ad actually supplies the answer; suspense does not postpone all meaning until later. |
| A distinctive human moment | A revealing expression, direct statement, or action already present in the footage, framed around its meaning. | The person and moment carry more interest than an effects sequence. |
| An idea made visible | Editable type, objects, paths, or supplied assets collide, sort, multiply, connect, or transform to explain the benefit. | Motion graphics communicate something the available footage cannot. |
| Evidence up close | An actual product interaction, useful detail, or supported demonstration becomes the opening focal point. | The evidence itself is compelling enough to carry attention. |

These are prompts, not an exhaustive library or a mandated style. Combine approaches only when the opening still has one clear idea. Avoid generic “stop scrolling” copy, unsupported superlatives, fabricated metrics/testimonials, unrelated shock footage, and mystery that never connects to the product. A stronger hook can come from better shot selection or a better opening line without adding more effects.

## Give the opening a small narrative

Choose its duration from the placement and material; roughly the first 2–5 seconds is a useful working range, not a universal rule. Start with meaningful visual information rather than black, a slow fade, or a logo-only wait. In the first few seconds establish the relevant tension/result, reveal enough to orient the viewer, and hand off naturally into the demonstration or explanation. Integrate brand/product recognition into the action when possible.

Keep one dominant focal point. Use concise text only where it adds context, with enough stable reading time at the actual display size. A caption, hook headline, UI screen, and animated label should not all compete. Fit the supplied brand and ad style: a direct creator-led opening and an elaborate launch-film opening require different treatments. A quiet but surprising image can work; maximum speed and volume are not the objective.

Match the placement:

- **Scrolling feeds, Reels, and Shorts:** make the first frame meaningful and the proposition visually understandable without audio; sound-on playback should add impact. Preserve UI safe areas and readable phone-scale text. TikTok recommends introducing the proposition within the first three seconds and developing the hook in the first six; treat these as planning guidance, not a requirement to spend six seconds on an intro. [TikTok creative guidance](https://ads.tiktok.com/resources/help/article/creative-best-practices?lang=en)
- **YouTube skippable in-stream:** give a clear reason to keep watching and establish product/brand relevance before the skip opportunity. Google documents skipping after five seconds; this is not the timing model for every YouTube placement. [Google ad formats](https://support.google.com/google-ads/answer/2375464?hl=en)
- **Very short ads:** let the hook and main benefit form the same concise action; do not spend most of the runtime on setup. Across formats, Google's creative guidance emphasizes entering the story quickly, early branding, and audio/text that reinforce rather than compete with the message. [Google ABCDs](https://support.google.com/google-ads/answer/14783551?hl=en)

Use the specified placement/delivery brief. If unspecified, make a sensible assumption from the request and state it in the edit plan; do not block creative work with a platform questionnaire.

## Time the hook to the actual music

When music is supplied or already generated, follow [waveform editing](waveform-editing.md) **before authoring the hook timing**. Inspect and audition the beginning of the music segment actually used by the edit. Zoom into its useful opening accents, pickup, first downbeat, build, dropout, or change in texture. The candidate detector helps locate events; confirm them by listening.

Record a compact cue map: `music source time → project time → visual event → SFX event`. Specify the actual reveal/arrival/impact, not just “sync to beat.” Include the selected music in-point and its project start so source, project, and layer clocks stay distinct.

For each chosen cue:

1. Set the perceptual visual event on that cue: a cut, fully exposed result, shutter reopening, key word settling, or meaningful motion arrival. Animate the lead-in before it and leave a useful hold afterward.
2. Compute SFX placement from its own perceptual event. A riser may start earlier so it resolves on the cue; a downlifter may begin on the cue and trail afterward; a shutter or ping aligns its audible transient. File starts and largest sample peaks are not automatically the right anchors.
3. Quantize picture events to the actual project frame rate, keeping the error within the nearest representable frame and aligning the audible event as closely as the runtime permits. Check the rendered result; matching JSON timestamps alone does not prove perceptual synchronization.

For example, if listening confirms an opening accent at **0.8 s in project time**, show a meaningful close-up from frame zero, begin the reveal shortly beforehand, expose the result at 0.8 s, and let the next shot explain it. This timing is illustrative; derive real values from the track. If the music starts softly or the first big hit comes late, create immediate visual interest and use an earlier subtle cue or motivated SFX. Do not make viewers wait through an empty intro for the drop. Preserve explicitly chosen music/in-points; do not silently replace or retime them. Without music, derive rhythm from speech, action, and selected sound accents; do not invent a soundtrack requirement.

## Use diverse sound and transition treatments

Choose by the hook's idea and physical motion. Possible treatments include a match cut, object wipe, shutter close/reopen, brief light sweep or leak, freeze-and-release, mask reveal, whip movement, split-screen change, directional blur, or a hard cut into an unexpected scale. Keep useful subject/product detail visible and resolve into readable content. A light leak or shutter should earn its place in this particular ad, not become the plugin's default opening.

Sounds can include bass downlifters, impacts with audible upper harmonics, pings, pops, clicks, camera shutters, paper/physical textures, or a short pause in the bed. Choose compatible cues and leave space for the music and voice. A subtle transient may beat a pile of risers, hits, and whooshes; a strong existing musical hit may need no additional accent. Check that the hook still communicates when muted and that low-frequency cues translate beyond headphones.

Use supplied/local audio or prepare and import procedural accents through [sound design](sound-design.md). The procedural set includes `downlifter`, `soft-impact`, `clear-ping`, `soft-pop`, and `dry-click`; it does not include a literal `camera-shutter` preset. Use an available local shutter asset or an intentional stylized accent rather than inventing a helper command. Follow [motion design](motion-design.md) and the actual schema to build transitions with editable shapes, masks, transforms, and supported effects. There is no assumed one-click `lightLeak` or `cameraShutter` field. Use native constructs or permitted local assets, with the timing kept editable.

## Review the opening as its own deliverable

Render the opening plus its transition into the body early, before polishing the entire ad. Inspect a filmstrip containing the first frame, setup, key reveal, readable hold, and the next scene. Around synchronized events, inspect neighboring frames and the rendered audio waveform; play the result at speed with sound. If timing is off, correct the responsible layer/cue and re-render the affected interval.

Then review it muted and at phone scale. Ask: Is there a clear focal point immediately? Why would this audience care? What benefit or question does the opening establish? Does the body deliver on it? Is the product/brand connection clear enough? Are text and motion readable? Do music and SFX strengthen the same event without masking words? Reject openings that are impressive but confusing, misleading, disconnected, or slow to reveal relevance.

Record the selected concept, source evidence, actual cue times, and what was inspected in the edit notes. Describe the intended mechanism rather than claiming guaranteed retention, conversion, or virality. If campaign results are later supplied, assess early retention alongside the campaign's downstream objective; attention alone does not establish a successful ad. No publishing, ad spend, or campaign changes are part of this hook-authoring workflow.
