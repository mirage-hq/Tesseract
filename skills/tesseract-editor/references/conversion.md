# Convert files from other editing tools

The separate `tsrct-conv` CLI converts between `.tsrct` and other editing tools’
project formats, such as Adobe Premiere Pro and After Effects. Check the
[Tesseract Converter repository](https://github.com/mirage-hq/Tesseract-Converter)
for current supported formats and conversion directions, installation, usage,
releases, and known limitations. The converter is installed and versioned
separately from the Tesseract plugin and `tsrct` rendering CLI.

Conversions may omit or approximate features, so the result can look or behave
differently from the source. Use conversion diagnostics and the repository’s
support documentation to understand those differences. A later converter release
may improve the result without a schema or renderer change.

For compatibility questions or unexpected output, see
[versions and compatibility](versions.md). Keep the original source when converting.
