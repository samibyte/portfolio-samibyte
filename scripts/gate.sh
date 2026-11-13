#!/usr/bin/env bash
# One-command gate. Fail-fast: the first failing step stops the run.
#   npm run gate            → typegen, typecheck, lint, build, c5-grep, contrast, content (warn)
#   STRICT=1 npm run gate   → content also fails on any leftover [USER] (P7 only)
#   GATE_ALL=1 npm run gate → run every step, report all failures
# Prints PASS/FAIL per step and only the tail of a failure. Full log: qa/gate.log
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
mkdir -p qa
LOG=qa/gate.log
: > "$LOG"

if [ -t 1 ]; then R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'; D=$'\033[2m'; X=$'\033[0m'; else R=; G=; Y=; D=; X=; fi

BIN=./node_modules/.bin
STEP_TIMEOUT=${STEP_TIMEOUT:-420}
TIMEOUT=()
command -v timeout >/dev/null 2>&1 && TIMEOUT=(timeout "$STEP_TIMEOUT")

FAILED=""
SKIPPED=0

run() {
  local name="$1"; shift
  local out rc
  out=$("${TIMEOUT[@]+"${TIMEOUT[@]}"}" "$@" 2>&1); rc=$?
  { printf '### %s\n%s\n\n' "$name" "$out"; } >> "$LOG"
  if [ "$rc" -eq 0 ]; then
    printf '%sPASS%s %s\n' "$G" "$X" "$name"
    return 0
  fi
  printf '%sFAIL%s %s\n' "$R" "$X" "$name"
  [ "$rc" -eq 124 ] && printf '     timed out after %ss\n' "$STEP_TIMEOUT"
  printf '%s\n' "$out" | grep -v '^[[:space:]]*$' | tail -n 12 | sed 's/^/     /'
  FAILED="$name"
  return 1
}

skip() { printf '%sSKIP%s %s %s(%s)%s\n' "$Y" "$X" "$1" "$D" "$2" "$X"; SKIPPED=$((SKIPPED + 1)); }

step() {
  local name="$1"; shift
  run "$name" "$@"
  local rc=$?
  if [ "$rc" -ne 0 ] && [ "${GATE_ALL:-0}" != "1" ]; then
    finish
  fi
  return $rc
}

finish() {
  if [ -n "$FAILED" ]; then
    printf '\n%sGATE: FAIL%s at "%s" — full output in %s\n' "$R" "$X" "$FAILED" "$LOG"
    exit 1
  fi
  printf '\n%sGATE: PASS%s%s\n' "$G" "$X" "$([ "$SKIPPED" -gt 0 ] && printf ' (%s skipped)' "$SKIPPED")"
  exit 0
}

# --- preconditions -----------------------------------------------------------
if [ ! -f package.json ]; then
  printf '%sGATE: FAIL%s no package.json — run P0.1 first\n' "$R" "$X"
  exit 1
fi
if [ ! -d node_modules ]; then
  printf '%sGATE: FAIL%s node_modules missing — run npm ci\n' "$R" "$X"
  exit 1
fi
if [ ! -x "$BIN/next" ]; then
  printf '%sGATE: FAIL%s next not installed — run npm ci\n' "$R" "$X"
  exit 1
fi

# --- steps -------------------------------------------------------------------
step "typegen"    "$BIN/next" typegen
step "typecheck"  "$BIN/tsc" --noEmit
step "lint"       "$BIN/eslint" .
step "build"      "$BIN/next" build

if [ -f scripts/check-c5.sh ]; then
  step "c5-grep"    bash scripts/check-c5.sh
else
  skip "c5-grep" "scripts/check-c5.sh missing"
fi

if [ -f lib/zones.ts ] && [ -f scripts/contrast.ts ]; then
  step "contrast" "$BIN/tsx" scripts/contrast.ts
else
  skip "contrast" "lib/zones.ts not written yet"
fi

if [ -d lib ] && [ -f scripts/check-content.ts ]; then
  if [ "${STRICT:-0}" = "1" ]; then
    step "content" "$BIN/tsx" scripts/check-content.ts --strict
  else
    step "content" "$BIN/tsx" scripts/check-content.ts
  fi
else
  skip "content" "lib/ not written yet"
fi

finish
