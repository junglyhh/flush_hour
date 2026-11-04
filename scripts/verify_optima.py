#!/usr/bin/env python3
"""Recompute every exact optimum and independently rule out shorter solutions.

Requires only Python 3 and a C++17 compiler (default: g++). The game, HTML
build, and ordinary QA do not require a compiler. Compiler temporaries,
binaries, and reports remain under the ignored .qa-output directory.
Use --write-fixtures after intentionally changing the campaign to regenerate
its exact rational replay certificates.
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
FIXTURE = ROOT / "tests" / "fixtures" / "verification.json"
MAX_DEPTH = 40


def run(command: list[str], *, input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, input=input_text, text=True, capture_output=True,
                          check=True, timeout=120, cwd=OUTPUT,
                          env={**os.environ, "TMPDIR": str(OUTPUT)})


def problem(level: dict, depth: int) -> str:
    return (f"{len(level['nodes'])} {len(level['edges'])} {level['threshold']} {depth}\n"
            + " ".join(map(str, level["initial"])) + "\n"
            + "\n".join(f"{a} {b}" for a, b in level["edges"]) + "\n")


def threshold(level: dict) -> Fraction:
    return Fraction(str(level["threshold"]))


def replay(level: dict, sequence: list[int]) -> list[list[Fraction]]:
    values = list(map(Fraction, level["initial"]))
    total, target = sum(values), threshold(level)
    states = [values.copy()]
    for step, edge_index in enumerate(sequence, 1):
        if all(value <= target for value in values):
            raise ValueError(f"{level['id']}: sequence continues after an earlier clear")
        if not isinstance(edge_index, int) or not 0 <= edge_index < len(level["edges"]):
            raise ValueError(f"{level['id']}: invalid edge index")
        a, b = level["edges"][edge_index]
        if values[a] == values[b]:
            raise ValueError(f"{level['id']}: sequence includes a no-op")
        values[a] = values[b] = (values[a] + values[b]) / 2
        if sum(values) != total:
            raise ValueError(f"{level['id']}: total changed on move {step}")
        states.append(values.copy())
    if not all(value <= target for value in values):
        raise ValueError(f"{level['id']}: certificate does not clear")
    return states


def validate_inputs(level: dict) -> None:
    optimum, cap = level["optimalMoves"], level["moveLimit"]
    if not 2 <= len(level["nodes"]) <= 7 or not 1 <= optimum <= cap <= MAX_DEPTH:
        raise ValueError("Exact tools support 2-7 vertices and at most 40 moves.")
    if len(level["nodes"]) != len(level["initial"]):
        raise ValueError(f"{level['id']}: initial length does not match nodes")
    if any(type(value) is not int or not 0 <= value <= 100 for value in level["initial"]):
        raise ValueError("Campaign initial percentages must be integers from 0 to 100.")
    target = threshold(level)
    if not 0 < target <= 100 or (target * 100).denominator != 1:
        raise ValueError("Thresholds must be positive percentages with at most two decimal places.")
    if sum(level["initial"]) > len(level["initial"]) * target:
        raise ValueError(f"{level['id']}: average exceeds threshold")


def solve(binaries: dict[str, Path], level: dict, depth: int, *, general: bool = False):
    command = [str(binaries["solver"])] + (["--general"] if general else [])
    result = run(command, input_text=problem(level, depth))
    lines = result.stdout.splitlines()
    if not lines or not lines[0].startswith("minimum "):
        return None, [], result.stderr
    minimum = int(lines[0].split()[1])
    sequence = list(map(int, lines[1].split()))
    if len(sequence) != minimum:
        raise ValueError("Solver returned an inconsistent witness length.")
    return minimum, sequence, result.stderr


def exclude(binaries: dict[str, Path], level: dict, depth: int, *, general: bool = False) -> dict:
    command = [str(binaries["independent"])] + (["--general"] if general else [])
    return json.loads(run(command, input_text=problem(level, depth)).stdout)


def check_solver_contract(binaries: dict[str, Path]) -> list[dict]:
    """Small concrete regression cases for eligibility, relabeling, and equality."""
    cases = [
        ("relabelled-path", [4, 0, 2], [[0, 2], [2, 1]], 2.5, 2, True),
        ("reversed-path", [0, 2, 4], [[0, 1], [1, 2]], 2.5, 2, True),
        ("nonmonotone-path", [4, 0, 2], [[0, 1], [1, 2]], 2.5, 1, False),
        ("branch-is-not-path", [4, 0, 0, 2], [[0, 1], [0, 2], [0, 3]], 2, 1, False),
        ("inclusive-equality", [80, 20], [[0, 1]], 50, 1, True),
    ]
    results = []
    for name, initial, edges, target, optimum, eligible in cases:
        level = {"id": name, "nodes": [{} for _ in initial], "initial": initial,
                 "edges": edges, "threshold": target}
        for general in (False, True):
            minimum, sequence, trace = solve(binaries, level, optimum, general=general)
            if minimum != optimum:
                raise ValueError(f"Solver eligibility regression failed: {name}")
            replay(level, sequence)
            exclusion = exclude(binaries, level, optimum - 1, general=general)
            if exclusion["solutionFound"]:
                raise ValueError(f"Independent eligibility regression failed: {name}")
            expected = "path-failure-dominance" if eligible and not general else "general-exhaustive"
            if exclusion["method"] != expected:
                raise ValueError(f"Wrong independent proof gate for {name}")
            if ("method=path-prefix-dominance" in trace) != (eligible and not general):
                raise ValueError(f"Wrong primary proof gate for {name}")
        results.append({"case": name, "result": "pass", "optimum": optimum})
    guard_input = "2 1 50 41\n80 20\n0 1\n"
    for binary in binaries.values():
        result = subprocess.run([str(binary)], input=guard_input, text=True,
                                capture_output=True, cwd=OUTPUT, timeout=5,
                                env={**os.environ, "TMPDIR": str(OUTPUT)})
        if result.returncode == 0:
            raise ValueError("Exact solver must reject a depth beyond its integer scale.")
    results.append({"case": "precision-depth-guard", "result": "pass"})
    return results


def make_certificate(level: dict, sequence: list[int], states: list[list[Fraction]],
                     trace: str, lower_bound: dict) -> dict:
    target = threshold(level)
    method = trace.splitlines()[0].removeprefix("method=")
    total = sum(level["initial"])
    return {
        "id": level["id"], "name": level["name"],
        "optimalMoves": level["optimalMoves"], "moveLimit": level["moveLimit"],
        "threshold": level["threshold"], "initialTotal": total,
        "average": str(Fraction(total, len(level["nodes"]))),
        "proofMethod": method,
        "sequenceEdgeIndices": sequence,
        "sequenceLabels": [
            f"{level['nodes'][level['edges'][edge][0]]['id']}–"
            f"{level['nodes'][level['edges'][edge][1]]['id']}" for edge in sequence
        ],
        "finalFractions": [str(value) for value in states[-1]],
        "finalPercentages": [float(value) for value in states[-1]],
        "finalEqualsThreshold": [i for i, value in enumerate(states[-1]) if value == target],
        "exactStates": [[str(value) for value in state] for state in states],
        "exhaustiveSearch": trace,
        "independentExhaustiveSearch": lower_bound,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--compiler", default="g++", help="C++17 compiler executable")
    parser.add_argument("--write-fixtures", action="store_true",
                        help="regenerate exact certificates after verifying all optima")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    try:
        binaries = {}
        for name in ("solver", "independent"):
            binary = OUTPUT / name
            run([args.compiler, "-O3", "-std=c++17", str(ROOT / "tools" / f"{name}.cpp"),
                 "-o", str(binary)])
            binaries[name] = binary
        contract = check_solver_contract(binaries)
        levels = json.loads((ROOT / "data" / "levels.json").read_text(encoding="utf-8"))
        certificates = {}
        if not args.write_fixtures:
            fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
            certificates = {item["id"]: item for item in fixture["levels"]}
            if set(certificates) != {level["id"] for level in levels}:
                raise ValueError("Fixture IDs do not match the campaign.")
        reports, regenerated = [], []
        for level in levels:
            validate_inputs(level)
            optimum = level["optimalMoves"]
            minimum, sequence, trace = solve(binaries, level, optimum)
            if minimum != optimum:
                raise ValueError(f"{level['id']}: stated optimum {optimum}, exact search found {minimum}")
            states = replay(level, sequence)
            lower_bound = exclude(binaries, level, optimum - 1)
            if lower_bound["depth"] != optimum - 1 or lower_bound["solutionFound"]:
                raise ValueError(f"{level['id']}: independent search found a shorter solution")
            if not args.write_fixtures:
                certificate = certificates[level["id"]]
                if len(certificate["sequenceEdgeIndices"]) != optimum:
                    raise ValueError(f"{level['id']}: fixture witness length differs from optimum")
                certified_states = replay(level, certificate["sequenceEdgeIndices"])
                if certified_states != [list(map(Fraction, row)) for row in certificate["exactStates"]]:
                    raise ValueError(f"{level['id']}: fixture intermediate states differ from exact replay")
                if certified_states[-1] != list(map(Fraction, certificate["finalFractions"])):
                    raise ValueError(f"{level['id']}: fixture final values differ from exact replay")
                recorded = certificate["independentExhaustiveSearch"]
                if recorded["depth"] != optimum - 1 or recorded["solutionFound"]:
                    raise ValueError(f"{level['id']}: fixture lower bound is inconsistent")
            regenerated.append(make_certificate(level, sequence, states, trace, lower_bound))
            reports.append({"id": level["id"], "optimalMoves": optimum,
                            "sequenceEdgeIndices": sequence,
                            "finalFractions": [str(value) for value in states[-1]],
                            "primaryMethod": trace.splitlines()[0].removeprefix("method="),
                            "independentSearch": lower_bound})
            print(f"{level['id']}: exact optimum {optimum}; all shorter solutions excluded", flush=True)
        if args.write_fixtures:
            fixture = {
                "rule": "every vertex weight <= level threshold",
                "comparison": "<= (equality qualifies); unsafe means > threshold in every bound",
                "method": ("Exact iterative-deepening search for general graphs; exact prefix-dominance "
                           "breadth-first frontiers for complete simple paths with monotone initial values."),
                "independentMethod": ("Separate physical-value depth-first search; general graphs use only "
                                      "unsafe-count and exact-state memoization; eligible paths use "
                                      "failed-state prefix dominance without commuting-edge restrictions."),
                "integerScale": "100 * 2^40 units per percent; decimal inputs parsed exactly",
                "supportedMaximumDepth": MAX_DEPTH,
                "campaignOptima": [level["optimalMoves"] for level in levels],
                "solverContractChecks": contract,
                "levels": regenerated,
            }
            temporary = OUTPUT / "verification.new.json"
            temporary.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            temporary.replace(FIXTURE)
        report = {"result": "pass", "comparison": "every value <= threshold",
                  "solverContractChecks": contract, "levels": reports}
        (OUTPUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                                             encoding="utf-8")
        print(f"Verified all {len(reports)} optima with exact arithmetic and independent lower-bound proofs.")
        return 0
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        print(f"Optimum verification failed: {error}", file=sys.stderr)
        if isinstance(error, subprocess.CalledProcessError) and error.stderr:
            print(error.stderr, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
