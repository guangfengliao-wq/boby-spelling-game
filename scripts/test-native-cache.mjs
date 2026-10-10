import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync('android/app/src/main/assets/native-cache-cleanup.js', 'utf8');
test('legacy native SW and resource caches are removed without touching learning data', async () => {
  let unregistered = 0;
  let reloads = 0;
  const deleted = [];
  const caches = { keys: async () => ['workbox-precache-v2', 'html-cache', 'other-cache'], delete: async key => { deleted.push(key); } };
  await vm.runInNewContext(script, {
    navigator: { serviceWorker: { controller: {}, getRegistrations: async () => [{ unregister: async () => { unregistered++; } }] } },
    caches, window: { caches }, location: { reload: () => { reloads++; } }, console,
    localStorage: new Proxy({}, { get() { throw new Error('must preserve learning data'); } }),
  });
  assert.equal(unregistered, 1);
  assert.deepEqual(deleted, ['workbox-precache-v2', 'html-cache']);
  assert.equal(reloads, 1);
});
test('clean native startup does not reload', async () => {
  await vm.runInNewContext(script, {
    navigator: { serviceWorker: { getRegistrations: async () => [] } },
    window: {}, location: { reload: () => assert.fail('unexpected reload') }, console,
  });
});
