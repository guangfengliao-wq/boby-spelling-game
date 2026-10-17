import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const bundled = await build({
  stdin: { contents: `
    export { getAllUnits } from './src/utils/wordLoader';
    export { getWordPhonetic } from './src/utils/wordPhonetics';
    export { hasWordAudio } from './src/utils/wordAudio';
  `, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { getAllUnits, getWordPhonetic, hasWordAudio } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
let count = 0;
for (const unit of getAllUnits()) {
  for (const word of unit.words) {
    assert.match(getWordPhonetic(word.en), /^\/[^/]+\/$/, `${unit.name}: ${word.en} needs IPA`);
    assert.equal(hasWordAudio(word.en), true, `${word.en} needs a local recording`);
    count++;
  }
}
assert.equal(getWordPhonetic(' ICE   Cream '), '/ˌaɪs ˈkriːm/');
assert.equal(getWordPhonetic('read'), '/riːd/');
assert.equal(getWordPhonetic('wind'), '/wɪnd/');
assert.equal(getWordPhonetic('live'), '/lɪv/');
assert.equal(getWordPhonetic('not-in-catalog'), '');
assert.equal(readFileSync('src/data/wordPhonetics.json', 'utf8'), readFileSync('public/data/wordPhonetics.json', 'utf8'), 'Distributed editable data must match the bundled data');
console.log(`Wordbook checks passed: all ${count} curriculum entries have IPA and audio; normalization and curriculum readings verified.`);
