<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/wordmark-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="docs/images/wordmark-light.svg" />
    <img src="docs/images/wordmark-light.svg" alt="Tesseract by Mirage" width="478" />
  </picture>
</p>

<p align="center">
  <strong>The creative suite built for your AI agent.</strong><br />
  Editing, motion, and sound. Connected in one local project.
</p>

<p align="center">
  <a href="#get-started">Get started</a> ·
  <a href="#what-you-can-make">What you can make</a> ·
  <a href="#manual-downloads">Downloads</a> ·
  <a href="https://mirage.app">Mirage</a>
</p>

<img src="docs/images/hero.png" alt="An illustration of video layers, keyframes, and audio, with the direction: Apply heat refraction. Ease it in with the music." width="912" />

Tesseract brings professional creative tools into your agent workflow. Work with video layers, compositions, keyframes, and audio in one connected project. Preview the result, direct a revision, and render the finished video locally.

## Get started

**macOS, Windows, or Linux x86_64**, including compatible cloud-agent environments.
Your agent needs file and command access.
See the [installation guide](skills/tesseract-video/references/installation.md) for platform requirements.

### Install with one command

```sh
npx skills add mirage-hq/Tesseract
```

Choose both Tesseract skills and your agent. Requires Node.js/npm for this installer; the Tesseract CLI itself does not require Node.

Then [ask it to make a video](#what-you-can-make). The skills guide your agent through CLI setup when needed.

### Or let your agent install it

```text
Install the Tesseract skills from https://github.com/mirage-hq/Tesseract.
Follow their installation guide to set up the matching CLI for my
computer, verify its checksum, and confirm it runs.
Then ask me for my footage or the video I want to make.
```

### Plugins

[ChatGPT/Codex plugin →](https://chatgpt.com/plugins/plugins_6ab148f4986c819198f6a08c7fb30f3e?open_in_app)
Claude Code plugin coming soon

### Manual downloads

**[Download a release →](https://github.com/mirage-hq/Tesseract/releases)** · **[Installation guide →](skills/tesseract-video/references/installation.md)**

| Download | Choose this for |
| --- | --- |
| CLI ZIP — `linux-x86_64` | Linux PCs and compatible cloud-agent environments |
| CLI ZIP — `darwin-arm64` | Apple Silicon Mac |
| CLI ZIP — `darwin-x86_64` | Intel Mac |
| CLI ZIP — `windows-x86_64` | 64-bit Windows PC |
| Matching `.sha256` | Verify your ZIP before installing |

Use the CLI version required by your skills. Install either the plugin or the skills; you don't need both.

## What you can make

| Skill | Use it for |
| --- | --- |
| **Tesseract: Edit Video** | Cut footage, adjust framing, and combine dialogue and music. |
| **Tesseract: Motion Graphics** | Animate titles, typography, diagrams, and overlays. |

Attach your material, then copy a prompt:

```text
Use Tesseract to turn these clips into a 30-second product video.
Keep the opening quick, add a clean title, and finish on the logo.
```

```text
Use Tesseract to animate a diagram of these three steps.
Use our brand colors and keep the text editable.
```

Preview, then direct a revision:

```text
Make the title arrive earlier and soften the motion.
Render a preview before exporting the finished video.
```

Keep the editable `.tsrct` project for your next revision.

## Terms

[Product terms](TERMS.md) · [Tesseract terms](https://mirage.app/legal/tesseract-terms) · [Privacy policy](https://mirage.app/legal/privacy-policy) · [Third-party notices](THIRD_PARTY_NOTICES.md)

Each CLI ZIP includes third-party notices, licenses, and matching dependency sources.
