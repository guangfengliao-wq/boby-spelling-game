import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Supply fixture assets so playback lifecycle tests do not require real speakers.
const bundled = await build({
  entryPoints: ['src/utils/wordAudio.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'audio-fixture', setup(build) {
    build.onResolve({ filter: /wordAudio\.json$/ }, () => ({ path: 'fixture', namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
      contents: JSON.stringify({ cat: '/audio/words/cat.mp3', 'ice cream': '/audio/words/ice.mp3' }), loader: 'json',
    }));
  } }],
});
const instances = [];
globalThis.Audio = class {
  constructor(src) { this.src = src; instances.push(this); }
  play() { return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; }); }
  pause() { this.paused = true; }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  load() {}
};
const { createWordAudioPlayer, hasWordAudio } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
assert.equal(hasWordAudio(' Ice   Cream '), true);
assert.equal(hasWordAudio('missing'), false);
const player = createWordAudioPlayer();
const errors = [];
player.play('cat', e => errors.push(e));
const first = instances.at(-1);
player.play('ice cream', e => errors.push(e));
assert.equal(first.paused, true, 'A new click must stop earlier audio');
first.reject(new Error('play interrupted'));
await Promise.resolve();
assert.equal(errors.length, 0, 'Old play rejection must not affect the new word');
const second = instances.at(-1);
second.onerror();
second.reject(new Error('decode failed'));
await Promise.resolve();
assert.equal(errors.length, 1, 'A failed clip reports one error');
player.play('cat', e => errors.push(e));
const third = instances.at(-1);
player.stop();
third.reject(new Error('page left'));
await Promise.resolve();
assert.equal(third.paused, true);
assert.equal(errors.length, 1, 'Leaving the page must silence stale callbacks');
player.play('missing', e => errors.push(e));
assert.equal(errors.length, 2);
let ended = 0;
player.play('cat', e => errors.push(e), () => ended++);
const completed = instances.at(-1);
const complete = completed.onended;
completed.resolve();
await Promise.resolve();
assert.equal(ended, 0, 'Starting playback must not advance the question');
complete();
complete();
assert.equal(ended, 1, 'Natural completion advances exactly once');
assert.equal(completed.paused, true);
player.play('cat', e => errors.push(e), () => ended++);
const staleComplete = instances.at(-1).onended;
player.stop();
staleComplete();
assert.equal(ended, 1, 'Leaving the page must not advance an old question');
player.play('cat', e => errors.push(e), () => ended++);
instances.at(-1).onerror();
assert.equal(ended, 1, 'Playback errors use the error callback, not completion');
assert.equal(errors.length, 3);
let feedbackStarted = false;
player.play('cat', e => errors.push(e));
const lastLetter = instances.at(-1);
const pendingFeedback = player.whenFinished().then(() => { feedbackStarted = true; });
lastLetter.resolve();
await Promise.resolve();
assert.equal(feedbackStarted, false, 'Submission must wait for the final letter to end');
assert.notEqual(lastLetter.paused, true, 'Waiting must not interrupt the final letter');
lastLetter.onended();
await pendingFeedback;
assert.equal(feedbackStarted, true, 'Feedback may start after the final letter ends');
player.play('cat', e => errors.push(e));
const failedPlayback = player.whenFinished();
instances.at(-1).onerror();
await failedPlayback;
player.play('cat', e => errors.push(e));
const cancelledPlayback = player.whenFinished();
player.stop();
await cancelledPlayback;
console.log('Audio lifecycle tests passed: normalization, replacement, errors, completion, and page cleanup.');
