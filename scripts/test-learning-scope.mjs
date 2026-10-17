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
    export { useLearningState } from './src/composables/useLearningState';
    export { useGameState } from './src/composables/useGameState';
    export { useSettings } from './src/composables/useSettings';
    export { useSemester } from './src/composables/useSemester';
    export { getAllUnits } from './src/utils/wordLoader';
    export * from './src/utils/customWordSelection';
  `, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const url = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const api = await import(url);
const { selectedSemesterId, selectSemester } = api.useSemester();
const semesterId = selectedSemesterId.value;
const entries = api.getSelectionEntries(semesterId);
const first = entries[0];
const other = entries.find(entry => entry.unitId !== first.unitId);
assert.ok(other, 'Need words from two units');
const learningKey = api.selectionStorageKey(semesterId, true);
const dictationKey = api.selectionStorageKey(semesterId, false);
storage.set(dictationKey, JSON.stringify([entries[1].key]));
storage.set(learningKey, JSON.stringify([other.key, first.key, first.key, 'invalid', 123]));
const learning = api.useLearningState('', true);
assert.deepEqual(learning.questions.value.map(word => word.key), [first.key, other.key], 'Selected words follow unit order, without duplicates or invalid entries');
assert.deepEqual(api.loadSelectionKeys(semesterId, false), [entries[1].key], 'Dictation selection remains independent');
const reloaded = await import(url + '#reload');
assert.deepEqual(reloaded.useLearningState('', true).questions.value, learning.questions.value, 'Custom learning scope survives reload');
const before = new Map(storage);
learning.submitAnswer('incorrect answer');
assert.equal(learning.currentQuestionIndex.value, 0);
while (!learning.isGameEnd.value) learning.submitAnswer(learning.currentQuestion.value.en);
assert.equal(learning.currentQuestionIndex.value, 2);
assert.equal(learning.score.value, 0);
assert.deepEqual(storage, before, 'Learning must not write scores, errors, career records or dictation saves');
const unit = api.getAllUnits(semesterId)[0];
assert.deepEqual(api.useLearningState(unit.id).questions.value, unit.words, 'Regular unit learning remains unchanged');
const anotherSemester = api.getAllUnits().find(unit => unit.semesterId !== semesterId);
assert.ok(anotherSemester);
selectSemester(anotherSemester.semesterId);
assert.equal(api.useLearningState('', true).questions.value.length, 0, 'Selections are isolated by semester');
selectSemester(semesterId);
storage.set(learningKey, '{broken json');
assert.equal(api.useLearningState('', true).questions.value.length, 0, 'Corrupt storage produces an empty selection');
storage.set(learningKey, '{}');
assert.deepEqual(api.loadSelectionKeys(semesterId, true), []);
const game = api.useGameState();
try {
  assert.equal(learning.startDictation(), true, 'Completed custom learning can start dictation');
  assert.equal(game.isCustom.value, true);
  const expected = [first, other].map(({ en, cn, unitId }) => ({ en, cn, unitId }));
  const sorted = words => words.map(word => JSON.stringify(word)).sort();
  assert.deepEqual(sorted(game.questions.value), sorted(expected), 'Use the entire original learning scope even if saved selection changes');
  assert.equal(game.currentQuestionIndex.value, 0);
  assert.equal(game.score.value, 0);
  assert.deepEqual(api.loadSelectionKeys(semesterId, false), [entries[1].key], 'Switching modes must not overwrite saved custom dictation picks');
  const saved = game.loadGameState();
  assert.equal(api.useLearningState('', true).startDictation(), false, 'Empty learning scope cannot replace an active dictation');
  assert.deepEqual(game.loadGameState(), saved);
  const regular = api.useLearningState(unit.id);
  regular.submitAnswer(regular.currentQuestion.value.en);
  assert.equal(regular.startDictation(), true);
  assert.equal(game.isCustom.value, false);
  assert.equal(game.currentUnitId.value, unit.id);
  assert.equal(game.questions.value.length, Math.min(10, unit.words.length), 'Unit dictation follows the existing range preference');
  api.useSettings().toggleDictateAllWords();
  regular.startDictation();
  assert.deepEqual(sorted(game.questions.value), sorted(unit.words));
} finally {
  game.resetGame();
}
console.log('Learning scope tests passed: cross-unit selection, ordering, validation, reload, completion, isolation and regular learning.');
