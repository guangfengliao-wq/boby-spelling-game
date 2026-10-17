// Rebuild the bundled, offline British IPA catalog. No network needed at app runtime.
// Source and licensing: public/licenses/word-phonetics.txt.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const revision = '43c3570eb3553bdd19fccd2bd0091534889af023';
const source = process.argv[2] ? readFileSync(process.argv[2], 'utf8')
  : await fetch(`https://raw.githubusercontent.com/open-dict-data/ipa-dict/${revision}/data/en_UK.txt`).then(r => {
    if (!r.ok) throw new Error(`Dictionary download failed: ${r.status}`);
    return r.text();
  });
const dictionary = new Map(source.trim().split('\n').map(line => line.trim().split('\t')));
// Curriculum readings, missing entries and conventional learner-dictionary notation.
const overrides = Object.fromEntries(`
activity|ækˈtɪvəti
astronaut|ˈæstrənɔːt
autumn|ˈɔːtəm
basketball|ˈbɑːskɪtbɔːl
because|bɪˈkɒz
dear|dɪə
drawing|ˈdrɔːɪŋ
ear|ɪə
everyone|ˈevriwʌn
excited|ɪkˈsaɪtɪd
goodbye|ˌɡʊdˈbaɪ
hear|hɪə
here|hɪə
idea|aɪˈdɪə
into|ˈɪntuː
monkey|ˈmʌŋki
near|nɪə
nineteen|ˌnaɪnˈtiːn
one|wʌn
really|ˈrɪəli
sixteen|ˌsɪksˈtiːn
the|ðə
trousers|ˈtraʊzəz
umbrella|ʌmˈbrelə
unhappy|ʌnˈhæpi
year|jɪə
zookeeper|ˈzuːkiːpə
am|æm
are|ɑː
ok|ˌəʊˈkeɪ
read|riːd
i|aɪ
a|ə
nice|naɪs
afternoon|ˌɑːftəˈnuːn
fine|faɪn
bye-bye|ˌbaɪˈbaɪ
no|nəʊ
number|ˈnʌmbə
do|duː
have|hæv
put|pʊt
job|dʒɒb
he|hiː
mother|ˈmʌðə
wind|wɪnd
use|juːz
mouse|maʊs
mouth|maʊθ
mr|ˈmɪstə
ms|mɪz
wear|weə
t-shirt|ˈtiː ʃɜːt
windy|ˈwɪndi
monday|ˈmʌndeɪ
tuesday|ˈtjuːzdeɪ
wednesday|ˈwenzdeɪ
thursday|ˈθɜːzdeɪ
friday|ˈfraɪdeɪ
saturday|ˈsætədeɪ
sunday|ˈsʌndeɪ
close|kləʊz
chinese|ˌtʃaɪˈniːz
house|haʊs
real|rɪəl
minute|ˈmɪnɪt
ping-pong|ˈpɪŋ pɒŋ
report|rɪˈpɔːt
live|lɪv
flower|ˈflaʊə
perfect|ˈpɜːfɪkt
address|əˈdres
yeah|jeə
colour|ˈkʌlə
colourful|ˈkʌləfəl
listen|ˈlɪsən
little|ˈlɪtəl
welcome|ˈwelkəm
something|ˈsʌmθɪŋ
be about to do sth|bi əˈbaʊt tə duː ˈsʌmθɪŋ
try sth on|traɪ ˈsʌmθɪŋ ɒn
come on|kʌm ɒn
good morning|ɡʊd ˈmɔːnɪŋ
happy birthday|ˈhæpi ˈbɜːθdeɪ
hurry up|ˈhʌri ʌp
how many|haʊ ˈmeni
get out|ɡet aʊt
have a look|hæv ə lʊk
pencil case|ˈpensəl keɪs
take out|teɪk aʊt
skipping rope|ˈskɪpɪŋ rəʊp
in front of|ɪn frʌnt əv
sports day|ˈspɔːts deɪ
good job|ɡʊd dʒɒb
all right|ɔːl raɪt
well done|wel dʌn
here you are|hɪə ju ɑː
of course|əv kɔːs
chinese chess|ˌtʃaɪˈniːz tʃes
ice cream|ˌaɪs ˈkriːm
there is|ðeər ɪz
pick up|pɪk ʌp
train station|ˈtreɪn ˌsteɪʃən
bus stop|ˈbʌs stɒp
police station|pəˈliːs ˌsteɪʃən
excuse me|ɪkˈskjuːz miː
dream job|driːm dʒɒb
go shopping|ɡəʊ ˈʃɒpɪŋ
thirty-three|ˌθɜːti ˈθriː
forty-four|ˌfɔːti ˈfɔː
sixty-six|ˌsɪksti ˈsɪks
forty-three|ˌfɔːti ˈθriː
flea market|ˈfliː ˌmɑːkɪt
by the way|baɪ ðə weɪ
a lot|ə lɒt
animal shelter|ˈænɪməl ˌʃeltə
`.trim().split('\n').map(line => line.split('|')));

function transcribe(word) {
  if (overrides[word]) return `/${overrides[word]}/`;
  const ipa = dictionary.get(word);
  if (!ipa) throw new Error(`Missing IPA: ${word}`);
  return ipa.replaceAll('ɹ', 'r').replaceAll('ɛ', 'e').replaceAll('ɐ', 'ə')
    // Move stress from immediately before the vowel to before its consonant onset.
    .replace(/([pbtdkɡfvθðszʃʒhmnŋlrwj]+)([ˈˌ])/g, '$2$1')
    // Monosyllables do not need lexical stress marks.
    .replace(/\/([^/]+)\//g, (_, value) => {
      const vowels = value.match(/eɪ|aɪ|ɔɪ|əʊ|aʊ|ɪə|eə|ʊə|[aeiouæɑɒɔəɜɪʊʌ]/g) ?? [];
      return `/${vowels.length === 1 ? value.replace(/[ˈˌ]/g, '') : value}/`;
    });
}
const data = JSON.parse(readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'));
const words = [...new Set(data.semesters.flatMap(s => s.units.flatMap(u => u.words.map(w => w.en.trim().toLowerCase()))))].sort();
const output = Object.fromEntries(words.map(word => [word, transcribe(word)]));
writeFileSync(new URL('../src/data/wordPhonetics.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/data/wordPhonetics.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(`Bundled British IPA for ${words.length} words and phrases.`);
