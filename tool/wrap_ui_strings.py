#!/usr/bin/env python3
"""Wrap leftover hardcoded UI strings in lib/screens and lib/components with .tr."""

import re
from pathlib import Path

ROOT = Path("/home/ian/Documents/Apps/Kalro-App/lib")
TARGETS = [ROOT / "screens", ROOT / "components", ROOT / "utils"]
SKIP_EXACT = {
    "",
    "en",
    "sw",
    "id",
    "ok",
    "g",
    "kg",
    "KSh",
    "DFL",
    "RH",
    "CSV",
    "PDF",
    "JSON",
    "HTTP",
    "PIN",
    "CRC",
    "SWR",
    "ASR",
    "RSP",
}

IMPORT = "import 'package:kalro/l10n/translator.dart';"


def should_skip(s: str) -> bool:
    if s in SKIP_EXACT:
        return True
    if len(s) < 2:
        return True
    if "$" in s or r"\n" in s:
        return True
    if s.startswith("assets/") or s.startswith("package:"):
        return True
    if re.fullmatch(r"[0-9.\-/%°]+", s):
        return True
    return False


def wrap_file(path: Path) -> bool:
    src = path.read_text(encoding="utf-8")
    original = src

    def repl_text(m: re.Match) -> str:
        prefix, quote, body = m.group(1), m.group(2), m.group(3)
        if should_skip(body):
            return m.group(0)
        # drop const — .tr is not a const expression
        prefix = prefix.replace("const Text(", "Text(")
        return f"{prefix}{quote}{body}{quote}.tr"

    src = re.sub(
        r"(const Text\(|Text\()\s*(['\"])([^'\"$\n]{2,200})\2(?!\s*\.tr)",
        repl_text,
        src,
    )

    def repl_named(m: re.Match) -> str:
        key, quote, body = m.group(1), m.group(2), m.group(3)
        if should_skip(body):
            return m.group(0)
        return f"{key}{quote}{body}{quote}.tr"

    for key in (
        "title:",
        "subtitle:",
        "hintText:",
        "labelText:",
        "message:",
        "actionLabel:",
        "confirmLabel:",
        "tooltip:",
        "primaryLabel:",
        "secondaryLabel:",
        "semanticsLabel:",
    ):
        src = re.sub(
            rf"({re.escape(key)}\s*)(['\"])([^'\"$\n]{{2,200}})\2(?!\s*\.tr)",
            repl_named,
            src,
        )

    # KalroPrimaryButton / buttons: label: 'Foo'  (not label: Text)
    src = re.sub(
        r"(label:\s*)(['\"])([^'\"$\n]{2,120})\2(?!\s*\.tr)(?!\s*,\s*icon)",
        lambda m: m.group(0)
        if should_skip(m.group(3)) or m.group(0).strip().endswith("Text")
        else f"{m.group(1)}{m.group(2)}{m.group(3)}{m.group(2)}.tr",
        src,
    )

    if src == original:
        return False

    if "translator.dart" not in src and ".tr" in src:
        # insert import after last import
        last = None
        for m in re.finditer(r"^import .*;\s*$", src, re.M):
            last = m
        if last:
            src = src[: last.end()] + "\n" + IMPORT + src[last.end() :]
        else:
            src = IMPORT + "\n" + src

    path.write_text(src, encoding="utf-8")
    return True


def main() -> None:
    changed = []
    for folder in TARGETS:
        for path in folder.rglob("*.dart"):
            if wrap_file(path):
                changed.append(str(path.relative_to(ROOT)))
    print(f"Updated {len(changed)} files")
    for p in changed:
        print(" ", p)


if __name__ == "__main__":
    main()
