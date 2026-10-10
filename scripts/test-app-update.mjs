import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['src/utils/appUpdate.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { parseRelease, compareVersions } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const release = {
  tag_name: 'v0.1.10', draft: false, prerelease: false, body: '新增检查更新',
  assets: [{ name: 'english-spelling-v0.1.10.apk', state: 'uploaded', size: 100,
    browser_download_url: 'https://github.com/guangfengliao-wq/boby-spelling-game/releases/download/v0.1.10/english-spelling-v0.1.10.apk' }],
};
test('versions compare numerically without downgrades', () => {
  assert.equal(compareVersions('0.1.10', '0.1.9'), 1);
  assert.equal(parseRelease(release, '0.1.10'), null);
  assert.equal(parseRelease(release, '1.0.0'), null);
  assert.throws(() => compareVersions('latest', '1.0.0'));
});
test('new stable release includes notes and verified APK URL', () => {
  assert.equal(parseRelease(release, '0.1.2').notes, '新增检查更新');
  assert.equal(parseRelease({ ...release, draft: true }, '0.1.2'), null);
  assert.equal(parseRelease({ ...release, prerelease: true }, '0.1.2'), null);
  assert.throws(() => parseRelease({ ...release, assets: [] }, '0.1.2'), /尚未就绪/);
  assert.throws(() => parseRelease({ ...release, assets: [{ ...release.assets[0], browser_download_url: 'https://example.com/bad.apk' }] }, '0.1.2'), /下载地址/);
});
