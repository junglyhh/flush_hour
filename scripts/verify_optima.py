#!/usr/bin/env python3
"""Independently re-check every level's exact shortest solution.

Optional developer tool; requires a C++17 compiler (default: g++). The game,
HTML build, and normal QA do not require a compiler. All generated files go
under the ignored .qa-output directory. No network or third-party package is used.
"""
from __future__ import annotations

import argparse
from fractions import Fraction
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".qa-output" / "optima"


def run(command: list[str], *, input_text: str | None = None) -> str:
    return subprocess.run(command, input=input_text, text=True, capture_output=True,
                          check=True, timeout=120, cwd=OUTPUT,
                          env={**os.environ, "TMPDIR": str(OUTPUT)}).stdout


def problem(level: dict, depth: int) -> str:
    return (f"{len(level['nodes'])} {len(level['edges'])} {level['threshold']} {depth}\n"
            + " ".join(map(str, level["initial"])) + "\n"
            + "\n".join(f"{a} {b}" for a, b in level["edges"]) + "\n")


def replay(level: dict, sequence: list[int]) -> list[Fraction]:
    values = list(map(Fraction, level["initial"]))
    total = sum(values)
    for step, edge_index in enumerate(sequence, 1):
        if all(value <= level["threshold"] for value in values):
            raise ValueError(f"{level['id']}: sequence continues after an earlier clear")
        a, b = level["edges"][edge_index]
        if values[a] == values[b]:
            raise ValueError(f"{level['id']}: sequence includes a no-op")
        values[a] = values[b] = (values[a] + values[b]) / 2
        if sum(values) != total:
            raise ValueError(f"{level['id']}: total was not conserved on move {step}")
    if not all(value <= level["threshold"] for value in values):
        raise ValueError(f"{level['id']}: certificate does not clear")
    return values


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--compiler", default="g++", help="C++17 compiler executable")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    try:
        binaries = {}
        for name in ("solver", "independent"):
            binary = OUTPUT / name
            run([args.compiler, "-O3", "-std=c++17", str(ROOT / "tools" / f"{name}.cpp"), "-o", str(binary)])
            binaries[name] = binary
        levels = json.loads((ROOT / "data" / "levels.json").read_text(encoding="utf-8"))
        fixtures = json.loads((ROOT / "tests" / "fixtures" / "verification.json").read_text(encoding="utf-8"))
        certificates = {item["id"]: item for item in fixtures["levels"]}
        reports = []
        for level in levels:
            optimum = level["optimalMoves"]
            if not 1 <= len(level["nodes"]) <= 7 or not 1 <= optimum <= 24:
                raise ValueError("The bundled exact solvers support 1–7 vertices and depths up to 24.")
            if any(not isinstance(value, int) for value in [*level["initial"], level["threshold"]]):
                raise ValueError("The bundled exact solvers require integral initial percentages and thresholds.")
            lines = run([str(binaries["solver"])], input_text=problem(level, optimum)).splitlines()
            if not lines or lines[0] != f"minimum {optimum}":
                raise ValueError(f"{level['id']}: the stated optimum does not match exact search")
            sequence = list(map(int, lines[1].split()))
            final = replay(level, sequence)
            certificate = certificates[level["id"]]
            if len(certificate["sequenceEdgeIndices"]) != optimum:
                raise ValueError(f"{level['id']}: certificate length does not match optimum")
            certified_final = replay(level, certificate["sequenceEdgeIndices"])
            if certified_final != list(map(Fraction, certificate["finalFractions"])):
                raise ValueError(f"{level['id']}: certificate final values do not match exact replay")
            lower_bound = json.loads(run([str(binaries["independent"])], input_text=problem(level, optimum - 1)))
            if lower_bound["solutionFound"]:
                raise ValueError(f"{level['id']}: independent search found a shorter solution")
            reports.append({"id": level["id"], "optimalMoves": optimum,
                            "sequenceEdgeIndices": sequence, "finalFractions": [str(x) for x in final],
                            "independentSearch": lower_bound})
            print(f"{level['id']}: exact optimum {optimum}; all shorter paths excluded")
        report = {"result": "pass", "comparison": "every value <= threshold", "levels": reports}
        (OUTPUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Verified all {len(reports)} optima with exact arithmetic and independent search.")
        return 0
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        print(f"Optimum verification failed: {exc}", file=sys.stderr)
        if isinstance(exc, subprocess.CalledProcessError) and exc.stderr:
            print(exc.stderr, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
