// Gera src/data/hebraico/ a partir da Open Scriptures Hebrew Bible (Códice de Leningrado de Westminster,
// domínio público; morfologia e lemas CC BY 4.0) e do dicionário hebraico de Strong (Open Scriptures, CC BY-SA).
// Os versículos são renumerados para a numeração usada nas Bíblias em português (a mesma da KJV),
// com base no wlc/VerseMap.xml.
//
// Uso:
//   git clone --depth 1 https://github.com/openscriptures/morphhb <pasta-morphhb>
//   curl -o <strongs.js> https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js
//   node scripts/gerar-hebraico.mjs <pasta-morphhb> <strongs.js>

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [pasta, arquivoStrongs] = process.argv.slice(2);
if (!pasta || !arquivoStrongs) {
  console.error('Uso: node scripts/gerar-hebraico.mjs <pasta-morphhb> <strongs.js>');
  process.exit(1);
}

// Arquivo do OSHB -> código usado no app
const livros = [
  ['Gen', 'GEN'], ['Exod', 'EXO'], ['Lev', 'LEV'], ['Num', 'NUM'], ['Deut', 'DEU'], ['Josh', 'JOS'],
  ['Judg', 'JDG'], ['Ruth', 'RUT'], ['1Sam', '1SA'], ['2Sam', '2SA'], ['1Kgs', '1KI'], ['2Kgs', '2KI'],
  ['1Chr', '1CH'], ['2Chr', '2CH'], ['Ezra', 'EZR'], ['Neh', 'NEH'], ['Esth', 'EST'], ['Job', 'JOB'],
  ['Ps', 'PSA'], ['Prov', 'PRO'], ['Eccl', 'ECC'], ['Song', 'SNG'], ['Isa', 'ISA'], ['Jer', 'JER'],
  ['Lam', 'LAM'], ['Ezek', 'EZK'], ['Dan', 'DAN'], ['Hos', 'HOS'], ['Joel', 'JOL'], ['Amos', 'AMO'],
  ['Obad', 'OBA'], ['Jonah', 'JON'], ['Mic', 'MIC'], ['Nah', 'NAM'], ['Hab', 'HAB'], ['Zeph', 'ZEP'],
  ['Hag', 'HAG'], ['Zech', 'ZEC'], ['Mal', 'MAL'],
];

// WLC "Gen.32.1" -> KJV "Gen.31.55"
const mapa = new Map(
  [...readFileSync(join(pasta, 'wlc', 'VerseMap.xml'), 'utf8').matchAll(/wlc="([^"]+)" kjv="([^"]+)"/g)].map((m) => [
    m[1],
    m[2],
  ]),
);

const saida = join('src', 'data', 'hebraico');
mkdirSync(saida, { recursive: true });
const usados = new Set();
let palavrasTotal = 0;

for (const [arquivo, codigo] of livros) {
  const xml = readFileSync(join(pasta, 'wlc', `${arquivo}.xml`), 'utf8');
  const capitulos = [];
  for (const v of xml.matchAll(/<verse osisID="([^"]+)">([\s\S]*?)<\/verse>/g)) {
    const palavras = [...v[2].matchAll(/<w ([^>]*)>([^<]*)<\/w>/g)].map((w) => {
      const lemma = w[1].match(/lemma="([^"]*)"/)?.[1] ?? '';
      const morf = w[1].match(/morph="([^"]*)"/)?.[1] ?? '';
      // O número de Strong principal é a última parte numérica do lema (as anteriores são prefixos)
      const numeros = lemma
        .split('/')
        .map((p) => p.match(/\d+/)?.[0])
        .filter(Boolean);
      const strong = Number(numeros.at(-1) ?? 0);
      if (strong) usados.add(strong);
      // Remove as barras entre prefixos e os acentos de cantilação (U+0591 a U+05AF), mantendo as vogais
      return [w[2].replace(/\//g, '').replace(/[\u0591-\u05AF]/g, ''), strong, morf];
    });
    palavrasTotal += palavras.length;

    const destino = mapa.get(v[1]) ?? v[1];
    const [, cap, ver] = destino.split('.').map(Number);
    capitulos[cap - 1] ??= [];
    // Quando dois versículos hebraicos caem no mesmo versículo em português (ex.: títulos dos Salmos), junta
    const atual = capitulos[cap - 1][ver - 1];
    capitulos[cap - 1][ver - 1] = atual ? (mapa.has(v[1]) ? [...atual, ...palavras] : [...palavras, ...atual]) : palavras;
  }
  const cheio = Array.from(capitulos, (vs) => Array.from(vs ?? [], (p) => p ?? []));
  writeFileSync(join(saida, `${codigo}.json`), JSON.stringify(cheio));
}

const fonte = readFileSync(arquivoStrongs, 'utf8');
const dic = JSON.parse(fonte.slice(fonte.indexOf('{'), fonte.lastIndexOf('}') + 1));
const lexico = {};
for (const n of [...usados].sort((a, b) => a - b)) {
  const e = dic[`H${n}`];
  if (!e) continue;
  lexico[n] = [e.lemma, e.xlit, (e.strongs_def ?? '').trim(), (e.kjv_def ?? '').trim()];
}
writeFileSync(join(saida, 'lexico.json'), JSON.stringify(lexico));

const carregadores = livros
  .map(([, c]) => `    case '${c}':\n      return (await import('./${c}.json')).default as unknown as PalavraOriginal[][][];`)
  .join('\n');
writeFileSync(
  join(saida, 'index.ts'),
  `// Gerado por scripts/gerar-hebraico.mjs. Cada livro é carregado sob demanda (no navegador, um arquivo por livro).

import type { Lexico, PalavraOriginal } from '../tipos';

export const livrosAT = [${livros.map(([, c]) => `'${c}'`).join(', ')}] as const;
export type CodigoLivroAT = (typeof livrosAT)[number];

export async function carregarLivroHebraico(codigo: CodigoLivroAT): Promise<PalavraOriginal[][][]> {
  switch (codigo) {
${carregadores}
  }
}

export async function carregarLexicoHebraico(): Promise<Lexico> {
  return (await import('./lexico.json')).default as unknown as Lexico;
}
`,
);

console.log(`Livros: ${livros.length}. Palavras: ${palavrasTotal}. Verbetes: ${Object.keys(lexico).length}.`);
