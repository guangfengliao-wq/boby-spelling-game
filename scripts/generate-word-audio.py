"""One-time asset generation; never needed by npm run pack or the installed app.
Install edge-tts==7.3.1 and imageio-ffmpeg==0.6.0 into .audio-tools,
then run this script with Python 3. Use --refresh-letters to rebuild letter clips.
"""
import asyncio
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / '.audio-tools'))
import edge_tts
import imageio_ffmpeg

VOICE = 'en-GB-SoniaNeural'
RATE = '-15%'
LETTER_RATE = '+15%'
OUT = ROOT / 'public/audio/words'


def trim_letter(path):
    # Trim only the outer silence; preserve quiet consonants and internal pauses (W).
    trimmed = path.with_suffix('.trimmed.mp3')
    trim = 'silenceremove=start_periods=1:start_duration=0.01:start_threshold=-48dB:start_silence=0.015'
    try:
        subprocess.run([
            imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error',
            '-y', '-i', str(path), '-af', f'{trim},areverse,{trim},areverse',
            '-codec:a', 'libmp3lame', '-b:a', '64k', str(trimmed),
        ], check=True)
        if trimmed.stat().st_size < 1000:
            raise RuntimeError(f'Empty trimmed letter: {path}')
        trimmed.replace(path)
    finally:
        trimmed.unlink(missing_ok=True)


async def main():
    catalog = json.loads(subprocess.check_output(
        ['node', str(ROOT / 'scripts/audio-catalog.mjs'), '--json'], cwd=ROOT, encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(16)
    completed = 0

    async def generate(entry):
        nonlocal completed
        target = OUT / entry['file']
        async with semaphore:
            is_letter = len(entry['text']) == 1 and entry['text'].isascii() and entry['text'].isalpha()
            refresh_letter = '--refresh-letters' in sys.argv and is_letter
            if refresh_letter or not target.exists() or target.stat().st_size < 1000:
                temporary = target.with_suffix('.mp3.part')
                for attempt in range(4):
                    try:
                        await asyncio.wait_for(edge_tts.Communicate(
                            entry['spoken'], VOICE, rate=LETTER_RATE if is_letter else RATE, receive_timeout=20
                        ).save(str(temporary)), timeout=35)
                        if temporary.stat().st_size < 1000:
                            raise RuntimeError(f"Empty audio: {entry['text']}")
                        if is_letter:
                            await asyncio.to_thread(trim_letter, temporary)
                        temporary.replace(target)
                        break
                    except Exception as error:
                        print(f"Retry {entry['text']}: {type(error).__name__}", flush=True)
                        if attempt == 3:
                            raise
                        await asyncio.sleep(2 ** attempt)
            completed += 1
            if completed % 25 == 0 or completed == len(catalog):
                print(f'Audio: {completed}/{len(catalog)}', flush=True)

    await asyncio.gather(*(generate(entry) for entry in catalog))
    manifest = {e['text']: '/audio/words/' + e['file'] for e in catalog}
    (ROOT / 'src/data/wordAudio.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUT / 'SOURCE.txt').write_text(
        f'Synthetic English speech generated with Microsoft Edge TTS ({VOICE}, rate {RATE}).\n'
        f'Letter clips: rate {LETTER_RATE}, leading/trailing silence trimmed with FFmpeg.\n'
        f'Generation tool: edge-tts {edge_tts.__version__}, https://github.com/rany2/edge-tts\n'
        'These MP3 files are bundled assets. Playback does not contact any speech service.\n'
        'Pronunciation expansions: Mr -> Mister; Ms -> Ms.; try sth on -> try something on; '
        'be about to do sth -> be about to do something.\n', encoding='utf-8')


asyncio.run(main())
