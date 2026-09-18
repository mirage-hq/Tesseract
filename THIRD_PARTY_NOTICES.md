# Third-party software in Tesseract

This document describes Tesseract’s packaging. The upstream license and notice
texts are copied separately into `licenses/`; this document does not replace them.
All paths below refer to files inside the CLI download and installed bundle.

Tesseract uses FFmpeg libraries and the FFmpeg/FFprobe programs under the GNU Lesser
General Public License version 2.1 or later. See `licenses/ffmpeg/` for the license
and upstream attribution. In particular, this software is based in part on the
work of the Independent JPEG Group. The three IJG-derived FFmpeg source files
have not been modified by Tesseract.

The exact, unmodified FFmpeg source archive is included in `sources/` together
with its checksum and build instructions. `provenance/ffmpeg-build.json` records
the version and configuration. GPL and nonfree FFmpeg components are disabled.

FDK-AAC remains the native audio encoder. Its Rust wrappers' licenses do not
replace the separate Fraunhofer license for the native codec. The complete native
notice is reproduced in `licenses/fdk-aac-sys-*.txt`; the complete corresponding
source is in `sources/cargo-dependencies.tar.gz`, under `fdk-aac-sys-*/aac/`.
The FDK software license grants no patent license.

The Windows bundle also includes the Microsoft Visual C++ runtime DLLs its
binaries import, copied unmodified from the Visual Studio redistributable
directory as Distributable Code under the Visual Studio license terms; see
`licenses/Microsoft-Visual-C++-Runtime.txt`. They are provided for use with the
accompanying executable and libraries.

`licenses/` also contains the available notices for each external Cargo package
compiled for this build, including build tools. `provenance/cargo-dependencies.json`
records license selections and versions; the corresponding package sources are
included in `sources/cargo-dependencies.tar.gz`. Locally patched dependencies are
marked as modified; their source archive contains the modifications.

## Replacing the FFmpeg libraries

FFmpeg remains dynamically linked. You may replace it with an interface-compatible
modified build. The installed executable resides in a versioned directory under
`~/Library/Application Support/Tesseract/public-cli/`; its `lib/` directory contains
the FFmpeg libraries and `bin/` contains Tesseract and the helpers. The launcher in
`~/Library/Application Support/Tesseract/bin/` is a symlink to that executable.

Keep the installed library filenames and use `@executable_path/../lib/` for
non-system load paths. After replacing libraries, ad-hoc sign the modified files
with `codesign --force --sign - <file>`. Runtime execution does not enforce the
release checksums; the installer verifies checksums only when installing.
Keep a separate copy of a modified installation when upgrading or reinstalling.

On Windows the installed executable resides under
`%LOCALAPPDATA%\Tesseract\public-cli\<version>-x86_64\bin\` together with the FFmpeg
DLLs, the helpers, and the Visual C++ runtime; Windows loads DLLs from that
directory first, so an interface-compatible replacement keeps the filenames. The
launcher `%LOCALAPPDATA%\Tesseract\bin\tsrct.cmd` runs that executable. Nothing
is code signed on Windows.

Nothing in these notices restricts modification for your own use or reverse
engineering for debugging modifications as permitted by the LGPL, or rights
granted by the other included licenses. The corresponding-source archives travel
with the binary bundle and must remain available when redistributing it.
