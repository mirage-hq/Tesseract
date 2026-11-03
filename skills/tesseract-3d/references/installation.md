# CLI installation

The skills and plugin contain instructions, not the CLI. First look for the installed
command (`~/Library/Application Support/Tesseract/bin/tsrct` on macOS,
`%LOCALAPPDATA%\Tesseract\bin\tsrct.cmd` on Windows, or
`${XDG_DATA_HOME:-$HOME/.local/share}/Tesseract/bin/tsrct` on Linux), then `tsrct` on PATH,
and run `--version`.

`cli-version.txt` beside this guide pins the required CLI version for normal
installations. Check the executable's reported version against it. If the user
explicitly supplies a CLI path or build for the task, use that executable even
when its version differs; do not replace it with the pinned version or another
build. Verify that it supports the requested features and explain any limits.

If the CLI is missing, reports another version, or fails to launch or is
blocked, follow [installing the CLI](install-cli.md). If launch is blocked, let
the user review the warning and follow their organization's approval process. Do
not bypass Gatekeeper or SmartScreen or delete quarantine attributes. Report the
exact error.

If preview, filmstrip, or export reports a GPU, Vulkan, or encoder error, read
[runtime failures](install-cli.md#runtime-failures) before changing the
environment. The Linux bundle has no H.264 encoder: for H.264 MP4 export, add
`--encoder-backend external-ffmpeg-command --ffmpeg-path <absolute path to an FFmpeg with libx264 and AAC>`
([Linux requirements](install-cli.md#linux-requirements)).
