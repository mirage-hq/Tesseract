"""Local file and FFmpeg helpers used by the sound and waveform tools."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


def emit(value):
    print(json.dumps(value, indent=2, ensure_ascii=False))


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def existing(value):
    p = Path(value).expanduser().resolve()
    if not p.is_file():
        raise ValueError(f"Local file does not exist: {p}")
    return p


def external(name):
    p = shutil.which(name)
    if p:
        return p
    for parent in ("/opt/homebrew/bin", "/usr/local/bin"):
        p = Path(parent) / name
        if p.is_file():
            return str(p)
    raise ValueError(f"{name} is needed for media inspection. It was not found locally.")


def run(command, timeout=600):
    result = subprocess.run([str(x) for x in command], capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f"{Path(str(command[0])).name} failed ({result.returncode}):\n{result.stderr[-6000:]}\n{result.stdout[-2000:]}")
    if result.stderr:
        print(result.stderr[-4000:], file=sys.stderr)
    return result.stdout


def output_path(value):
    p = Path(value).expanduser().resolve()
    if p.exists():
        raise ValueError(f"Output already exists: {p}. Choose a new versioned filename.")
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def atomic_run(output, command):
    p = output_path(output)
    with tempfile.TemporaryDirectory(prefix=".tesseract-", dir=p.parent) as tmp:
        temporary = Path(tmp) / p.name
        run(command(temporary))
        if not temporary.is_file() or not temporary.stat().st_size:
            raise RuntimeError("Media command returned without producing a nonempty output.")
        # Do not overwrite a concurrently-created output.
        os.link(temporary, p)
    return p


def write_json(path, data):
    p = output_path(path)
    with p.open("x") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return p
