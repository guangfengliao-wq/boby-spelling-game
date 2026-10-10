import assert from 'node:assert/strict';
import { build } from 'esbuild';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};
const bundled = await build({
  stdin: { contents: `
    export { useSettings } from './src/composables/useSettings';
    export { useGameState } from './src/composables/useGameState';
    export { getAllUnits } from './src/utils/wordLoader';
  `, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const url = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const { useSettings, useGameState, getAllUnits } = await import(url);
const settings = useSettings();
const game = useGameState();
const unit = getAllUnits().find(unit => unit.words.length > 10);
assert.ok(unit, 'Need a unit with more than 10 entries');
try {
  assert.equal(settings.dictateAllWords.value, false, 'Default must remain 10 words');
  game.startGame(unit.id);
  assert.equal(game.questions.value.length, 10);
  const saved = game.loadGameState();
  settings.toggleDictateAllWords();
  assert.equal(storage.get('dictateAllWords'), 'true');
  assert.equal(game.questions.value.length, 10, 'Changing settings must not change an active test');
  game.startGame(unit.id);
  assert.equal(game.questions.value.length, unit.words.length);
  const entries = list => list.map(word => JSON.stringify(word)).sort();
  assert.deepEqual(entries(game.questions.value), entries(unit.words), 'All entries must appear exactly once');
  game.restoreGameState(saved);
  assert.equal(game.questions.value.length, 10, 'Continuing an old test must preserve its questions');
  const reloaded = await import(url + '#reload');
  assert.equal(reloaded.useSettings().dictateAllWords.value, true, 'Preference must survive reload');
  settings.toggleDictateAllWords();
  game.startGame(unit.id);
  assert.equal(game.questions.value.length, 10);
  assert.equal(storage.get('dictateAllWords'), 'false');
  const smallUnit = getAllUnits().find(unit => unit.words.length > 0 && unit.words.length < 10);
  if (smallUnit) {
    game.startGame(smallUnit.id);
    assert.deepEqual(entries(game.questions.value), entries(smallUnit.words));
  }
  console.log('Dictation scope tests passed: defaults, all entries, persistence, saved games, and short units.');
} finally {
  game.resetGame();
}
