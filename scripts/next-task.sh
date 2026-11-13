#!/usr/bin/env bash
# Prints the one task you are allowed to do this session.
# Reads the first unchecked line in PROGRESS.md: `- [ ] <ID> <title>`
# Then verifies the matching detail heading exists in phases/P<n>.md.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

line=$(grep -m1 -E '^- \[ \] P[0-9]+\.[0-9]+[a-z]? ' PROGRESS.md || true)

if [ -z "$line" ]; then
  echo "ALL TASKS TICKED."
  echo "If PHASE 7 is complete, write qa/REPORT.md and stop. Do not invent work."
  exit 0
fi

task=$(printf '%s' "$line"  | sed -E 's/^- \[ \] (P[0-9]+\.[0-9]+[a-z]?) (.*)$/\1/')
title=$(printf '%s' "$line" | sed -E 's/^- \[ \] (P[0-9]+\.[0-9]+[a-z]?) (.*)$/\2/')
phase=$(printf '%s' "$task" | sed -E 's/^(P[0-9]+)\..*/\1/')
file="phases/${phase}.md"

echo "TASK   $task"
echo "TITLE  $title"
echo "PHASE  $file"

if [ ! -f "$file" ]; then
  echo "DETAIL MISSING — $file does not exist. Stop and report under Blockers."
  exit 2
fi

if ! grep -qE "^#+ ${task}[[:space:]]" "$file"; then
  echo "DETAIL MISSING — no '${task} ' heading in $file. Stop and report under Blockers."
  exit 2
fi

files=$(awk -v id="$task" '
  $0 ~ "^#+ " id "[[:space:]]" { found = 1; next }
  found && /\*\*Files:\*\*/ { sub(/^\*\*Files:\*\*[[:space:]]*/, ""); print; exit }
' "$file")

[ -n "$files" ] && echo "FILES  $files"

cat <<'EOT'

RULES  1 task. Smallest diff. npm run gate must print GATE: PASS.
        Then: tick the box, one DECISIONS row if non-obvious, commit "P<n>.<m> <name>". Stop.
EOT
