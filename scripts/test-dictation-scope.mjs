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
    export { useSemester } from './src/composables/useSemester';
    export { loadCareer } from './src/utils/career';
  `, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const url = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const { useSettings, useGameState, getAllUnits, useSemester, loadCareer } = await import(url);
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
  useSemester().selectSemester(unit.semesterId);
  const otherUnit = getAllUnits(unit.semesterId).find(other => other.id !== unit.id && other.words.length);
  assert.ok(otherUnit, 'Need another unit in the same semester');
  const picks = [
    ...unit.words.slice(0, 11).map((_, wordIndex) => ({ unitId: unit.id, wordIndex })),
    { unitId: otherUnit.id, wordIndex: 0 },
  ];
  const expected = picks.map(pick => ({ ...getAllUnits().find(unit => unit.id === pick.unitId).words[pick.wordIndex], unitId: pick.unitId }));
  assert.equal(game.startCustomGame([...picks, picks[0], { unitId: unit.id, wordIndex: -1 }]), true);
  assert.equal(game.isCustom.value, true);
  assert.deepEqual(entries(game.questions.value), entries(expected), 'Custom scope includes every chosen entry, preserves source units, and ignores duplicate or invalid picks');
  const customSaved = game.loadGameState();
  assert.equal(game.startCustomGame([]), false, 'Empty selections must not replace the active game');
  assert.deepEqual(game.loadGameState(), customSaved);
  settings.toggleDictateAllWords();
  game.startCustomGame(picks.slice(0, 2));
  assert.equal(game.questions.value.length, 2, 'Custom scope ignores the all-words setting');
  game.restoreGameState(customSaved);
  assert.equal(game.isCustom.value, true);
  assert.deepEqual(entries(game.questions.value), entries(expected), 'Custom scope survives restore');
  game.submitAnswer(game.currentQuestion.value.en);
  const partial = game.loadGameState();
  game.startGame(unit.id);
  assert.equal(game.isCustom.value, false);
  game.restoreGameState(partial);
  assert.equal(game.currentQuestionIndex.value, 1);
  assert.equal(game.score.value, 10);
  while (!game.isGameEnd.value) game.submitAnswer(game.currentQuestion.value.en);
  const record = loadCareer().at(-1);
  assert.equal(record.unitName, '自定义默写');
  assert.equal(record.totalQuestions, expected.length);
  assert.equal(record.completed, true);
  assert.equal(game.loadGameState(), null);
  game.restoreGameState(saved);
  assert.equal(game.isCustom.value, false, 'Legacy regular saves must not restore as custom');
  console.log('Dictation scope tests passed: regular and custom scopes, cross-unit provenance, settings, persistence, resume, completion, and legacy saves.');
} finally {
  game.resetGame();
}
