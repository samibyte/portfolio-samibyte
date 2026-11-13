// Fails the build when shipped code still contains an unresolved content slot.
//   tsx scripts/check-content.ts            → report, exit 0 (P0–P6)
//   tsx scripts/check-content.ts --strict   → exit 1 on any hit (P7 only)
//
// Slots are `[USER: ...]`. `[VERIFY]` is accepted as a legacy alias so an old
// tag is never silently ignored. This file is excluded from its own scan.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['app', 'components', 'lib'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx']);
const SKIP = new Set(['node_modules', '.next', 'qa', '.git', 'test-results', 'playwright-report']);
const SLOT = /\[(USER|VERIFY)[:\]]/g;

const strict = process.argv.includes('--strict');
const hits: string[] = [];

function walk(dir: string): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return; // root not created yet
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!EXT.has(name.slice(name.lastIndexOf('.')))) continue;
    const text = readFileSync(path, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (SLOT.test(line)) hits.push(`${relative('.', path)}:${i + 1}: ${line.trim().slice(0, 120)}`);
      SLOT.lastIndex = 0;
    });
  }
}

for (const root of ROOTS) walk(root);

if (hits.length === 0) {
  console.log('content: 0 unresolved slots');
  process.exit(0);
}

console.log(`content: ${hits.length} unresolved slot(s)`);
for (const hit of hits.slice(0, 20)) console.log('  ' + hit);
if (hits.length > 20) console.log(`  … and ${hits.length - 20} more`);

if (strict) {
  console.log('\nSTRICT=1: every slot must be resolved or its field removed. See CONTENT.md.');
  process.exit(1);
}
console.log('\nNon-strict run: unresolved slots are allowed until P7.1.');
