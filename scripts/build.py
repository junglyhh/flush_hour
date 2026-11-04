#!/usr/bin/env python3
"""Build both dependency-free Flush Hour entry points from the maintained source.

Run from any directory. --check verifies generated outputs without writing them.
The output is deterministic: no timestamps, environment paths, or network access.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = (ROOT / "index.html", ROOT / "flush_hour.html")


def build_bytes() -> bytes:
    template = (ROOT / "src" / "template.html").read_bytes()
    level_data = (ROOT / "data" / "levels.json").read_bytes()
    levels = json.loads(level_data)
    if not isinstance(levels, list) or len(levels) != 30:
        raise ValueError("The campaign must contain exactly 30 levels.")
    if len({level["id"] for level in levels}) != len(levels):
        raise ValueError("Every campaign level must have a unique ID.")
    if any(a["optimalMoves"] >= b["optimalMoves"] for a, b in zip(levels, levels[1:])):
        raise ValueError("The verified minimum move count must increase at every level.")
    if b"</script" in level_data.lower():
        raise ValueError("Level data must not contain an unescaped closing script tag.")
    quip_data = (ROOT / "data" / "victory-quips.json").read_bytes()
    quips = json.loads(quip_data)
    if not isinstance(quips, list) or len(quips) != 50:
        raise ValueError("The victory collection must contain exactly 50 bilingual quips.")
    for language, limit in (("en", 45), ("zh", 16)):
        texts = []
        for quip in quips:
            if not isinstance(quip, dict) or set(quip) != {"en", "zh"}:
                raise ValueError("Every victory quip must contain English and Chinese text.")
            text = quip[language]
            if (not isinstance(text, str) or not text.strip() or text != text.strip()
                    or len(text) > limit or "\n" in text or "\r" in text):
                raise ValueError(f"Victory quips in {language} must stay within {limit} characters on one line.")
            texts.append(text)
        if len(set(texts)) != len(texts):
            raise ValueError(f"Victory quips in {language} must be distinct.")
    if b"</script" in quip_data.lower():
        raise ValueError("Victory quips must not contain an unescaped closing script tag.")
    substitutions = {
        b"__LEVEL_DATA__": level_data,
        b"__VICTORY_QUIPS__": quip_data,
        b"__RULES_CODE__": (ROOT / "src" / "game-core.js").read_bytes(),
        b"__TOILET_CODE__": (ROOT / "src" / "toilet-visual.js").read_bytes(),
        b"__CAMPAIGN_CODE__": (ROOT / "src" / "campaign.js").read_bytes(),
        b"__LEGACY_CODE__": (ROOT / "src" / "legacy-levels.js").read_bytes(),
        b"__SHARE_CODE__": (ROOT / "src" / "share.js").read_bytes(),
    }
    for token, content in substitutions.items():
        if template.count(token) != 1:
            raise ValueError(f"Expected exactly one {token.decode()} placeholder.")
        template = template.replace(token, content)
    template.decode("utf-8")  # Fail clearly on invalid source encoding.
    return template


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if either generated HTML file is stale")
    args = parser.parse_args()
    try:
        result = build_bytes()
    except (OSError, ValueError) as exc:
        print(f"Build failed: {exc}", file=sys.stderr)
        return 1
    if args.check:
        stale = [file.name for file in OUTPUTS if not file.is_file() or file.read_bytes() != result]
        if stale:
            print("Generated files are stale: " + ", ".join(stale), file=sys.stderr)
            print("Run: python3 scripts/build.py", file=sys.stderr)
            return 1
    else:
        for file in OUTPUTS:
            file.write_bytes(result)
    action = "Verified" if args.check else "Built"
    print(f"{action} index.html and flush_hour.html: {len(result):,} identical UTF-8 bytes")
    print("SHA-256 " + hashlib.sha256(result).hexdigest())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
