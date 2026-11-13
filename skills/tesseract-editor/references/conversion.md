# Convert files from other editing tools

The separate `tsrct-conv` CLI converts between `.tsrct` and other editing tools’
project formats, such as Adobe Premiere Pro and After Effects. Check the
[Tesseract Converter repository](https://github.com/mirage-hq/Tesseract-Converter)
for current supported formats and conversion directions, installation, usage,
releases, and known limitations. The converter is installed and versioned
separately from the Tesseract plugin and `tsrct` rendering CLI.
The converter also turns a Blender `.blend` into the model glb that Scene3D
renders (`tsrct-conv model scene.blend --output scene.glb`). A 3D-enabled
`tsrct` accepts the `.blend` directly in `project import-asset --kind model3d`,
so use the converter only when you need the glb itself. The Tesseract: 3D
Scenes skill places the imported model.

To import the saved Blender scene as a project instead, use
`tsrct-conv convert scene.blend --to tesseract --output converted`
(optional `--pixels-per-meter 100`). This packages geometry as one model, with
native cameras and lights following its nodes and sampled camera/light keys.
`tsrct-conv inspect scene.blend` lists the saved scene. Import is best effort and
one direction only; consult the Blender support ledger before relying on fidelity.
The source frame rate stays in model metadata; project exports choose their own rate.

Conversions may omit or approximate features, so the result can look or behave
differently from the source. Use conversion diagnostics and the repository’s
support documentation to understand those differences. A later converter release
may improve the result without a schema or renderer change.

For compatibility questions or unexpected output, see
[versions and compatibility](versions.md). Keep the original source when converting.
