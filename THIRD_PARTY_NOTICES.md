# Third-party software in Tesseract

This document describes Tesseract’s packaging. The upstream license and notice
texts are copied separately into `licenses/`; this document does not replace them.
All paths below refer to files inside the CLI download and installed bundle.

Tesseract uses FFmpeg libraries under the GNU Lesser General Public License
version 2.1 or later. See `licenses/ffmpeg/` for the license
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

The Windows bundle also includes the DirectX Shader Compiler's `dxcompiler.dll`,
copied unmodified beside `tsrct.exe`, under the University of Illinois/NCSA Open
Source License; it contains SPIRV-Tools (Apache-2.0) and SPIRV-Headers (MIT) code.
See `licenses/DirectXShaderCompiler/` for these licenses and DXC's third-party
notices. `provenance/dxc-build.json` records the DXC release.

With Scene3D, the path tracer's denoiser runs the unmodified weights of Intel
Open Image Denoise's `rt_hdr_alb_nrm` network, release 2.5.1. They are not in
the bundle: Tesseract downloads them from the Captions CDN, as
`models/oidn_rt_hdr_alb_nrm.oidn-2.5.1.tza`, when a render first uses the
denoiser. The weights are licensed under the Apache License, Version 2.0; see
`licenses/OIDN-weights.txt`. Their repository has no NOTICE file.

The `personMatte` effect runs neural networks whose graphs are compiled into
Tesseract: Google's MediaPipe Selfie Segmentation (general) and PaddleSeg's
PP-HumanSegV2-Lite portrait model. Each is licensed under the Apache License,
Version 2.0. Their weights are not in the bundle: Tesseract downloads them from
the Captions CDN, under `models/`, when a render first uses the effect.
Tesseract runs modified copies: the graphs were converted to ONNX and then to
Burn, some with fixed input shapes and equivalent operator rewrites, and the
weights were converted to Burn's burnpack format. See `licenses/models/` for
each model's license and source, and `provenance/models.json`. Their
repositories have no NOTICE files.

`licenses/` also contains the available notices for each external Cargo package
compiled for this build, including build tools. `provenance/cargo-dependencies.json`
records license selections and versions; the corresponding package sources are
included in `sources/cargo-dependencies.tar.gz`. Locally patched dependencies are
marked as modified; their source archive contains the modifications.

## Replacing the FFmpeg libraries

FFmpeg remains dynamically linked. You may replace it with an interface-compatible
modified build. The installed executable resides in a versioned directory under
`~/Library/Application Support/Tesseract/public-cli/`; its `lib/` directory contains
the FFmpeg libraries and `bin/` contains Tesseract. The launcher in
`~/Library/Application Support/Tesseract/bin/` is a symlink to that executable.

Keep the installed library filenames and use `@executable_path/../lib/` for
non-system load paths. After replacing libraries, ad-hoc sign the modified files
with `codesign --force --sign - <file>`. Runtime execution does not enforce the
release checksums; the installer verifies checksums only when installing.
Keep a separate copy of a modified installation when upgrading or reinstalling.

On Windows the installed executable resides under
`%LOCALAPPDATA%\Tesseract\public-cli\<version>-x86_64\bin\` together with the FFmpeg
DLLs, the Visual C++ runtime and `dxcompiler.dll`; Windows loads DLLs from that
directory first, so an interface-compatible replacement keeps the filenames. The
launcher `%LOCALAPPDATA%\Tesseract\bin\tsrct.cmd` runs that executable. Nothing
is code signed on Windows.

On Linux, the default installation is under
`~/.local/share/Tesseract/public-cli/<version>-x86_64/` (or under
`$XDG_DATA_HOME/Tesseract/`). Replace interface-compatible FFmpeg `.so` files in
`lib/`, retaining their SONAME filenames and `$ORIGIN` RUNPATH. Executables use
`$ORIGIN/../lib`; there is no global library-path wrapper. Linux system libraries
and the Vulkan loader/driver are host prerequisites, not part of this bundle.

Nothing in these notices restricts modification for your own use or reverse
engineering for debugging modifications as permitted by the LGPL, or rights
granted by the other included licenses. The corresponding-source archives travel
with the binary bundle and must remain available when redistributing it.
