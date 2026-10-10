import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const words = JSON.parse(readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../src/data/phonetics.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { phoneticGroups } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
export const normalize = text => text.trim().toLowerCase().replace(/\s+/g, ' ');
const entries = [
  ...'abcdefghijklmnopqrstuvwxyz',
  ...words.semesters.flatMap(s => s.units.flatMap(u => u.words.map(w => w.en))),
  ...phoneticGroups.flatMap(g => g.entries.map(e => e[1])),
];
export const catalog = [...new Set(entries.map(normalize))].sort().map(text => ({
  text,
  spoken: /^[a-z]$/.test(text) ? text.toUpperCase() : ({ mr: 'Mister', ms: 'Ms.', 'try sth on': 'try something on', 'be about to do sth': 'be about to do something' })[text] || text,
  file: `${createHash('sha256').update(text).digest('hex').slice(0, 16)}.mp3`,
}));
if (process.argv.includes('--json')) console.log(JSON.stringify(catalog));
