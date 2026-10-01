# Versions and compatibility

Use this reference when opening shared or older files, converting projects,
updating tools, or investigating a load failure or unexpected render. Versions
are diagnostic evidence, not a requirement that every component have the same number.

## Where to look

| Component | Evidence |
| --- | --- |
| Skill/plugin release | Installed plugin manifest version, when available, and the skill's `references/cli-version.txt` pin. Follow [installation](installation.md) for its matching CLI. |
| Native CLI and renderer | Resolved `tsrct --version` reports the CLI release and source revision; `tsrct --help` reports its FX schema revision in newer builds. Use that release's build information for the bundled Jerboa renderer. |
| Browser runtime | The loaded module's `version()` and `engineVersion()` report its release and engine build. Check the actual deployed runtime; updating a skill or CLI does not update an existing editor. Keep its JavaScript, types, and WASM from the same release. |
| Converter | Check the installed converter’s version and the [Tesseract Converter repository and releases](https://github.com/mirage-hq/Tesseract-Converter) for how to identify its build and associated schema or engine revisions. Its releases are independent of the plugin and rendering runtime. |
| Saved `.tsrct` | Read the archive's `metadata.json` without modifying it: `formatVersion`, optional `fxSchemaVersion`, and `generator.name`, `version`, `engineVersion`, and optional `gitRevision`. `tsrct project inspect` returns editable project JSON, not this metadata. |

These fields answer different questions: `formatVersion` identifies the `.tsrct`
file format, `fxSchemaVersion` identifies the version of the editable FX data
schema used when saving, and `generator` identifies the tool that last saved it.
They are separate version numbers. Saving again can update the schema and tool
metadata; it does not tell you which tool originally created the project.

## Interpret differences

An FX schema difference alone does not prove incompatibility: an added optional
field may not affect this project. Matching schema revisions do not guarantee
identical rendering or conversion either; renderer behavior and converter mappings
can change independently. Use the actual error or visual difference, installed
schemas, conversion diagnostics, known limitations, and relevant release notes
to decide which component needs attention.

Older files can lack `fxSchemaVersion`; treat it as unknown. Older native writers
could stamp `0.1.0` even when using a later CLI such as `0.3.0`; do not infer the
original release from that stamp. A save by a fixed writer records its own version
and schema revision; it cannot recover the original tool version.

New readers accept legacy files without `fxSchemaVersion`, but older readers may
reject newer metadata fields, including `fxSchemaVersion` itself. An unknown-field
error is a concrete reader compatibility issue even when the FX content is usable.
Do not remove metadata or relabel versions to bypass it.

Choose a targeted remedy supported by the evidence: a compatible skill/runtime
release, a converter release with the relevant fix, or a documented workaround
for unsupported content. Respect the skill's CLI pin; do not replace it with an
arbitrary latest binary. Investigate the versions relevant to the issue; a
version difference alone does not call for an update or a full compatibility test.
