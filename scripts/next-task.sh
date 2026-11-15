#!/usr/bin/env bash
# Prints the one task you are allowed to do this session.
# Reads the first unchecked line in PROGRESS.md: `- [ ] <ID> <title>`
# Verifies the matching detail heading exists in phases/P<n>.md, prints the exact
# lines to read (phase preamble + task section) and any non-empty Blockers.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

line=$(grep -m1 -E '^- \[ \] P[0-9]+\.[0-9]+[a-z]? ' PROGRESS.md || true)

if [ -z "$line" ]; then
  echo "ALL TASKS TICKED."
  echo "If the final phase is complete, update qa/REPORT.md and stop. Do not invent work."
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

start=$(grep -nE "^#+ ${task}[[:space:]]" "$file" | head -1 | cut -d: -f1)
if [ -z "${start:-}" ]; then
  echo "DETAIL MISSING — no '${task} ' heading in $file. Stop and report under Blockers."
  exit 2
fi

# Preamble = everything before the first task heading; task section ends before the next one.
first_task=$(grep -nE '^#+ P[0-9]+\.[0-9]+[a-z]?[[:space:]]' "$file" | head -1 | cut -d: -f1)
end=$(awk -v s="$start" '
  NR > s && /^#+ P[0-9]+\.[0-9]+[a-z]?[[:space:]]/ { print NR - 1; exit }
' "$file")
[ -z "$end" ] && end=$(wc -l < "$file")

echo "READ   $file lines 1-$((first_task - 1)) (preamble) + $start-$end (task)"

files=$(awk -v id="$task" '
  $0 ~ "^#+ " id "[[:space:]]" { found = 1; next }
  found && /\*\*Files:\*\*/ { sub(/^\*\*Files:\*\*[[:space:]]*/, ""); print; exit }
' "$file")

[ -n "$files" ] && echo "FILES  $files"

blockers=$(awk '
  /^## Blockers/ { found = 1; next }
  found && /^## / { exit }
  found { print }
' PROGRESS.md | sed '/^[[:space:]]*$/d')
if [ -n "$blockers" ] && [ "$blockers" != "None." ]; then
  echo
  echo "BLOCKERS"
  printf '%s\n' "$blockers"
fi

cat <<'EOT'

RULES  Read the preamble + task section. 1 task. Smallest diff.
       Run the task's Done checks, not only npm run gate. Paste the counts.
       Then: tick the box, one line in qa/sessions.md, one DECISIONS row if
       non-obvious, commit "P<n>.<m> <name>". Stop.
EOT
