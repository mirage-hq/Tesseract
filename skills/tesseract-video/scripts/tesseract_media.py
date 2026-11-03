"""Local file and FFmpeg helpers used by the sound and waveform tools."""
import contextlib
import errno
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tempfile

if os.name == "nt":
    import msvcrt
else:
    import fcntl

WORK = ".tesseract-work"
PUBLISH_LOCK = ".tesseract-publish.lock"
# Errors that mean the filesystem has no advisory locks (some network shares).
NO_LOCKS = {errno.ENOLCK, errno.ENOTSUP, errno.EOPNOTSUPP, errno.EINVAL}


def emit(value):
    # Compact: agents read this stdout. Keep every field.
    print(json.dumps(value, ensure_ascii=False, separators=(",", ":")))


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


def output_path(value, overwrite=False, source=None):
    p = Path(value).expanduser().resolve()
    # samefile also catches case variants, symlinks and hard links of the input.
    if source is not None and p.exists() and p.samefile(source):
        raise ValueError(f"Output would replace the input: {p}.")
    if p.exists():
        if not overwrite:
            raise ValueError(f"Output already exists: {p}. Choose a new versioned filename, "
                             "or pass --overwrite to refresh a routine check in .tesseract-work/.")
        if work_root(p) is None:
            raise ValueError(f"--overwrite only replaces files in a .tesseract-work folder: {p}.")
        if not p.is_file():
            raise ValueError(f"Output exists and is not a file: {p}.")
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def work_root(path):
    """The innermost .tesseract-work folder that contains path, or None."""
    parents = path.parts[:-1]
    for end in range(len(parents), 0, -1):
        if parents[end - 1] == WORK:
            return Path(*parents[:end])
    return None


def _lock(fd):
    if os.name == "nt":
        os.lseek(fd, 0, os.SEEK_SET)
        while True:
            try:
                # LK_LOCK retries for about 10 s, then raises EDEADLOCK; keep waiting.
                msvcrt.locking(fd, msvcrt.LK_LOCK, 1)
                return
            except OSError as error:
                if error.errno != errno.EDEADLOCK:
                    raise
    try:
        fcntl.flock(fd, fcntl.LOCK_EX)
    except OSError as error:
        if error.errno not in NO_LOCKS:
            raise
        # Some network shares support only POSIX record locks.
        fcntl.lockf(fd, fcntl.LOCK_EX)


def _unlock(fd):
    if os.name == "nt":
        os.lseek(fd, 0, os.SEEK_SET)
        msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)


@contextlib.contextmanager
def publish_lock(outputs, required):
    """Hold the publish lock of every .tesseract-work folder among outputs.

    Concurrent publishes into the same folder then run one whole set at a time, so two
    refreshes of a PNG and its JSON sidecar never leave a mixed pair. The lock is released
    when the process exits, so a crash leaves no stale lock. Where the filesystem has no
    advisory locks, a replacing (required) publish is refused; an exclusive-create publish
    still refuses any output a concurrent run created."""
    roots = sorted({root for root in map(work_root, outputs) if root is not None}, key=str)
    with contextlib.ExitStack() as stack:
        for root in roots:
            path = root / PUBLISH_LOCK
            fd = os.open(path, os.O_RDWR | os.O_CREAT, 0o666)
            stack.callback(os.close, fd)
            try:
                _lock(fd)
            except OSError as error:
                if error.errno not in NO_LOCKS:
                    raise
                if required:
                    raise ValueError(f"--overwrite needs a file lock, which this filesystem does not "
                                     f"support: {path}. Write a new versioned filename instead.") from error
                continue
            stack.callback(_unlock, fd)
        yield


def regular_file(path):
    try:
        return stat.S_ISREG(os.lstat(path).st_mode)
    except FileNotFoundError:
        return False


def publish(staged, overwrite=False):
    """Move (temporary, output) pairs into place; stage each temporary beside its output.

    Replace only a regular file that already exists in a .tesseract-work folder, and only
    with overwrite; refuse any other existing output, even one a concurrent run created. The
    whole set is published under the publish lock of its .tesseract-work folders, so
    concurrent refreshes land one complete set after another: the last one wins whole. On
    any failure or interrupt, undo the outputs already placed, restoring replaced ones, so a
    failed refresh keeps the previous result."""
    with publish_lock([output for _, output in staged], overwrite):
        _publish(staged, overwrite)


def _publish(staged, overwrite):
    placed = []
    try:
        for temporary, output in staged:
            if overwrite and work_root(output) is not None and regular_file(output):
                backup = temporary.with_name(temporary.name + ".previous")
                try:
                    os.link(output, backup)
                except OSError:
                    # No hard links here (exFAT, FAT32, some shares): copy, so the output stays
                    # in place until the replace below.
                    shutil.copy2(output, backup)
                placed.append((output, backup))
                os.replace(temporary, output)
                continue
            try:
                os.link(temporary, output)
            except FileExistsError:
                raise
            except OSError:
                # No hard links here. Reserve the name first so a concurrent output is still refused.
                os.close(os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL))
                placed.append((output, None))
                os.replace(temporary, output)
            else:
                placed.append((output, None))
    except BaseException:
        for output, backup in reversed(placed):
            try:
                if backup:
                    os.replace(backup, output)
                else:
                    output.unlink()
            except OSError as error:
                print(f"Could not restore {output}: {error}", file=sys.stderr)
        raise


def staged_write(output, write, overwrite=False):
    with tempfile.TemporaryDirectory(prefix=".tesseract-", dir=output.parent) as tmp:
        temporary = Path(tmp) / output.name
        write(temporary)
        publish([(temporary, output)], overwrite)
    return output


def atomic_run(output, command, overwrite=False, source=None):
    def render(temporary):
        run(command(temporary))
        if not temporary.is_file() or not temporary.stat().st_size:
            raise RuntimeError("Media command returned without producing a nonempty output.")
    return staged_write(output_path(output, overwrite, source), render, overwrite)


def write_json(path, data, overwrite=False, source=None):
    def dump(temporary):
        with temporary.open("x") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
    return staged_write(output_path(path, overwrite, source), dump, overwrite)
