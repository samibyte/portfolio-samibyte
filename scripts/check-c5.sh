#!/usr/bin/env bash
# C5 (SPEC §1): native scroll only, one animation system.
# Fails on a scroll-hijack library or a second animation library in shipped code.
# This checks imports; the behavioural half of C5 lives in tests/c5.spec.ts.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

if [ ! -d app ]; then
  echo "c5: app/ not created yet — skipped"
  exit 0
fi

PATTERN="(from|import|require\()['\"](lenis|locomotive-scroll|embla|gsap|framer-motion|motion|three)(['\"/])"
HITS=$(grep -rnE "$PATTERN" app components lib 2>/dev/null || true)

if [ -n "$HITS" ]; then
  printf '%s\n' "$HITS"
  echo "C5: banned scroll/animation import. See SPEC §1 C5." >&2
  exit 1
fi

echo "c5: no banned scroll/animation imports"
