# Usage telemetry

The CLI may send basic usage telemetry for some commands. Telemetry is enabled
by default in releases.

- `tsrct telemetry disable`: turn telemetry off.
- `tsrct telemetry enable`: turn telemetry on.
- `tsrct telemetry status`: check the current setting.

The setting persists across runs. Respect the CLI's opt-out setting; never enable
telemetry on the user's behalf. Do not reset settings or request additional
network permissions just to send telemetry.
See the [privacy policy](https://mirage.app/legal/privacy-policy).

## Agent attribution

The CLI emits telemetry itself. You can optionally pass these attribution variables
with CLI calls made through the skill:

| Variable | Value |
| --- | --- |
| `TESSERACT_CALLER` | `agent-skill` |
| `TESSERACT_SKILL` | `tesseract-motion` or `tesseract-video` |
| `TESSERACT_HOST` | `chatgpt`, `codex`, `claude`, or `cursor`, when known |
| `TESSERACT_DISTRIBUTION` | `openai-plugin` or `standalone-skill`, when known |

Missing/unrecognized values become `unknown`. Do not infer the host from
`.codex-plugin`; several agents support it. Set attribution in each shell call,
not in persistent user/system variables or profiles.

Shell example (use the actual host and skill):

```sh
TESSERACT_CALLER=agent-skill TESSERACT_HOST=codex \
TESSERACT_SKILL=tesseract-motion TESSERACT_DISTRIBUTION=unknown \
"/absolute/path/to/tsrct" project create --project Project.tsrct
```

PowerShell:

```powershell
$env:TESSERACT_CALLER = 'agent-skill'
$env:TESSERACT_HOST = 'codex'
$env:TESSERACT_SKILL = 'tesseract-motion'
$env:TESSERACT_DISTRIBUTION = 'unknown'
& 'C:\absolute\path\to\tsrct.cmd' project create --project Project.tsrct
```

Attribution is self-reported, not proof of skill loading. The CLI emits events;
do not send analytics HTTP requests from the skill.

## Collected data

Only `project.create`, `export`, `preview`, and `filmstrip` emit start/completion
events. Other commands and installation are not tracked.

Collected information includes the command, CLI version, operating system,
architecture, optional attribution, and random IDs for events, command runs,
and the installation. Completion events include success/failure and duration.
The installation ID is saved locally and reused across runs.

No prompts, contents, filenames, paths, raw arguments, or error text are sent.

## Saved settings

Preferences and the installation ID are stored in `settings.json` under:

- macOS: `~/Library/Application Support/Tesseract/telemetry`
- Windows: `%LOCALAPPDATA%\Tesseract\telemetry`
- Linux: `$XDG_CONFIG_HOME/tesseract/telemetry`, or
  `~/.config/tesseract/telemetry` if XDG_CONFIG_HOME is absent or not absolute.

Telemetry failures do not prevent editing or rendering. If the CLI cannot read
or save its settings, it skips telemetry; settings commands report an error.
The service may also disable telemetry for a CLI version or installation.
If status reports it as retired, leave it disabled.
