# CLI installation

The skills and plugin contain instructions, not the CLI. First look for the installed
command (`~/Library/Application Support/Tesseract/bin/tsrct` on macOS,
`%LOCALAPPDATA%\Tesseract\bin\tsrct.cmd` on Windows), then `tsrct` on PATH,
and run `--version`.

Read the required CLI version from `cli-version.txt` beside the installed
installation guide. If the pin is missing, report an incomplete release package
and stop installation. Check the executable's reported version against the pin;
do not substitute the latest release or an internal build.

The CLI supports macOS and 64-bit Windows. Pick the bundle before installing:

- macOS: `arm64` for Apple Silicon and `x86_64` for Intel. Check `uname -s` and
  `uname -m`. `sysctl -in sysctl.proc_translated` returning 1 means Apple
  Silicon under Rosetta; use the `arm64` bundle.
- Windows: `windows-x86_64` for 64-bit Windows 10 or later. Check
  `$env:PROCESSOR_ARCHITEW6432` when set (a 32-bit PowerShell on 64-bit Windows),
  otherwise `$env:PROCESSOR_ARCHITECTURE`; either must be `AMD64`. Nothing
  needs to be preinstalled; the bundle carries its runtime libraries.

On any other host, report that this host is unsupported and stop installation.

For a missing or mismatched pinned CLI, download the required bundle, then
verify and install it as described below.

## Public CLI downloads

Read the exact required version from `cli-version.txt` beside the installation guide.
If the pin is missing, report an incomplete release package and stop installation.
Do not substitute the latest release or an internal build.

Download these two files from
`https://github.com/mirage-hq/tesseract/releases/download/v<VERSION>/`:

- `tesseract-<VERSION>-<PLATFORM>-<ARCH>.zip`
- `tesseract-<VERSION>-<PLATFORM>-<ARCH>.zip.sha256`

Use `darwin-arm64`, `darwin-x86_64`, or `windows-x86_64` for
`<PLATFORM>-<ARCH>`, following the host checks in [installation](#cli-installation).
Use an available downloader (for example, `curl -fL` on macOS or
`Invoke-WebRequest` on Windows) or a browser. GitHub login and GitHub CLI are
not required. Save both files in a fresh download directory.

If network permissions block the download, use the agent's normal permission
flow. If the release or platform asset is unavailable, report the exact URL and
error and stop installation; do not request private repository access or guess
another version. The release page is
`https://github.com/mirage-hq/tesseract/releases/tag/v<VERSION>`.

Return to [installation](#cli-installation) to verify the checksum, extract,
install, and check the executable's version. Downloaded archives are not installed
until those checks pass.

## Verify and install

1. macOS: from the download directory run `shasum -a 256 -c <archive>.zip.sha256`,
   extract with `ditto -x -k <archive>.zip <destination>`, then run
   `bash <extracted-CLI-folder>/install.sh`.
   Windows: compare `(Get-FileHash <archive>.zip -Algorithm SHA256).Hash` with the
   `.sha256` file, extract with `Expand-Archive <archive>.zip <destination>`, then run
   `powershell -ExecutionPolicy Bypass -File <extracted-CLI-folder>\install.ps1`.
2. Run the installed command with `--version` using its quoted absolute path
   (`"$HOME/Library/Application Support/Tesseract/bin/tsrct"` or
   `"$env:LOCALAPPDATA\Tesseract\bin\tsrct.cmd"`) and use that path for
   subsequent commands.

The installers check platform, architecture, minimum OS version, and bundle
checksums before switching the installed command. No sudo, administrator rights,
Rust, Homebrew, or Node is needed. Mac releases are Developer ID signed and
Apple notarized; first launch may require
internet access for notarization checks, and macOS may still block launch
depending on device policy. The Windows bundles are unsigned, so SmartScreen may
warn. If blocked, let the user review the warning and follow their
organization's approval process. Do not bypass Gatekeeper or
SmartScreen or delete quarantine attributes. Report the exact error if a download,
installation, or launch fails.
