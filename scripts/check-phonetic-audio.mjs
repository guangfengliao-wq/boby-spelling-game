import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';

async function load(name) {
  const source = readFileSync(new URL(`../src/data/${name}.ts`, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const { phoneticAudio } = await load('phoneticAudio');
const { phoneticGroups } = await load('phonetics');
const clusters = new Set(['ts', 'dz', 'tr', 'dr']);
const clips = JSON.parse(readFileSync(new URL('../public/audio/phonetics/bbc/clips.json', import.meta.url), 'utf8'));
const symbols = phoneticGroups.flatMap(g => g.entries.map(e => e[0]));
assert.equal(symbols.length, 48);
assert.equal(Object.keys(phoneticAudio).length, 48);
assert.equal(Object.keys(clips).length, 44);
for (const symbol of symbols) {
  const path = phoneticAudio[symbol];
  assert.ok(path, `缺少音标映射：${symbol}`);
  assert.equal(path.includes('/bbc/'), !clusters.has(symbol), `音源不符合约定：${symbol}`);
  if (clusters.has(symbol)) assert.equal(path, `/audio/phonetics/consonant_${symbol}.mp3`);
  const bytes = readFileSync(new URL(`../public${path}`, import.meta.url));
  assert.ok(bytes.length > 1000 && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)), `无效 MP3：${symbol}`);
  if (!clusters.has(symbol)) {
    const clip = clips[symbol];
    assert.equal(clip.file, path);
    assert.equal(clip.sha256, createHash('sha256').update(bytes).digest('hex'), `音频校验失败：${symbol}`);
    assert.ok(clip.samples / clip.sampleRate > 0.1 && clip.samples / clip.sampleRate < 3, `音频长度异常：${symbol}`);
  }
}
console.log('音标检查通过：44 个 BBC 原版男声 + 4 个原版组合音，映射、文件和校验和完整。');
