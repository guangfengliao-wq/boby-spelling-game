// One-time import of the BBC's original 44 sound-chart recordings.
// Usage: node scripts/import-bbc-phonetics.mjs [downloaded-chart.swf]
// Does not run during builds, and does not alter voice pitch or speed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const source = 'https://www.bbc.co.uk/staticarchive/5236618f7a3a0c5b2675049ac8bc206bd9037caa.swf';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
let swf;
if (process.argv[2]) swf = readFileSync(process.argv[2]);
else {
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`BBC download failed: ${response.status}`);
  swf = Buffer.from(await response.arrayBuffer());
}
if (swf.toString('ascii', 0, 3) === 'CWS') {
  swf = Buffer.concat([Buffer.from('FWS'), swf.subarray(3, 8), inflateSync(swf.subarray(8))]);
}
assert.equal(swf.toString('ascii', 0, 3), 'FWS', 'Expected an uncompressed SWF');
const sourceSha256 = digest(swf);
assert.equal(sourceSha256, '7820fc8977e8ee53161900a12261105af9685fc313df9f97b2be18fc1050f851',
  'BBC chart changed; verify symbol mapping before importing another version');
// Mapping verified against the chart's exported symbols and embedded font/text records.
const groups = {
  vow: ['iː', 'ɪ', 'e', 'æ', 'ɑː', 'ʌ', 'ɒ', 'ɔː', 'ʊ', 'uː', 'ɜː', 'ə'],
  dip: ['eɪ', 'aɪ', 'ɔɪ', 'əʊ', 'aʊ', 'eə', 'ɪə', 'ʊə'],
  con: ['p', 'b', 't', 'd', 'k', 'ɡ', 'm', 'n', 'ŋ', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h', 'tʃ', 'dʒ', 'r', 'l', 'j', 'w'],
};
const sounds = new Map(), exported = new Map();
let offset = 8 + Math.ceil((5 + 4 * (swf[8] >> 3)) / 8) + 4;
while (offset + 2 <= swf.length) {
  const header = swf.readUInt16LE(offset); offset += 2;
  const type = header >> 6;
  let length = header & 63;
  if (length === 63) { length = swf.readUInt32LE(offset); offset += 4; }
  assert.ok(offset + length <= swf.length, 'Truncated SWF');
  const data = swf.subarray(offset, offset + length); offset += length;
  if (type === 14) {
    assert.equal(data[2] >> 4, 2, 'Expected MP3 sound');
    sounds.set(data.readUInt16LE(0), {
      bytes: data.subarray(9), samples: data.readUInt32LE(3),
      sampleRate: [5512, 11025, 22050, 44100][(data[2] >> 2) & 3],
    });
  }
  if (type === 56) {
    let p = 2;
    for (let i = 0; i < data.readUInt16LE(0); i++) {
      const id = data.readUInt16LE(p); p += 2;
      const end = data.indexOf(0, p);
      assert.ok(end >= p);
      exported.set(data.toString('utf8', p, end), id); p = end + 1;
    }
  }
}
const output = new URL('../public/audio/phonetics/bbc/', import.meta.url);
mkdirSync(output, { recursive: true });
const clips = {}, manifest = {};
for (const [group, symbols] of Object.entries(groups)) {
  for (const [i, symbol] of symbols.entries()) {
    const name = `${group}_${i + 1}`, soundId = exported.get(`${name}s`);
    const sound = sounds.get(soundId);
    assert.ok(sound?.bytes.length > 1000, `Missing ${name}: ${symbol}`);
    const file = `/audio/phonetics/bbc/${name}.mp3`;
    writeFileSync(new URL(`${name}.mp3`, output), sound.bytes);
    clips[symbol] = { file, source, sourceSha256, soundId, exportName: `${name}s`,
      samples: sound.samples, sampleRate: sound.sampleRate, sha256: digest(sound.bytes) };
    manifest[symbol] = file;
  }
}
assert.equal(Object.keys(clips).length, 44);
for (const symbol of ['ts', 'dz', 'tr', 'dr']) manifest[symbol] = `/audio/phonetics/consonant_${symbol}.mp3`;
writeFileSync(new URL('clips.json', output), JSON.stringify(clips, null, 2) + '\n');
writeFileSync(new URL('../src/data/phoneticAudio.ts', import.meta.url),
  '// See public/audio/phonetics/bbc/ATTRIBUTION.txt for the BBC sound-chart source.\n' +
  '// Four consonant clusters retain the original recordings.\n' +
  `export const phoneticAudio: Record<string, string> = ${JSON.stringify(manifest, null, 2)}\n\n` +
  `export function phoneticAudioSource(symbol: string): string {\n` +
  `  return phoneticAudio[symbol]?.includes('/bbc/') ? 'BBC 男声 · 英式发音' : '组合音 · 原录音'\n}\n`);
console.log('Imported 44 original BBC sound-chart MP3 recordings; retained 4 original clusters.');
