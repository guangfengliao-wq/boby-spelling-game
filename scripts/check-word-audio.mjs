import { readFileSync, existsSync } from 'node:fs';
import { catalog } from './audio-catalog.mjs';

const manifestUrl = new URL('../src/data/wordAudio.json', import.meta.url);
if (!existsSync(manifestUrl)) throw new Error('缺少内置音频清单，请先生成单词音频。');
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));
for (const entry of catalog) {
  const expected = `/audio/words/${entry.file}`;
  if (manifest[entry.text] !== expected) throw new Error(`缺少内置发音：${entry.text}`);
  const file = new URL(`../public${expected}`, import.meta.url);
  if (!existsSync(file)) throw new Error(`缺少音频文件：${entry.text}`);
  const bytes = readFileSync(file);
  const mp3 = bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (bytes.length < 1000 || !mp3) throw new Error(`无效的 MP3：${entry.text}`);
}
console.log(`内置音频检查通过：${catalog.length} 个单词/短语，覆盖全部单词与音标例词。`);
