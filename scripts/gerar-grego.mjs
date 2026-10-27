// Gera src/data/grego/ a partir do Novo Testamento grego de Robinson-Pierpont
// (texto bizantino, domínio público) e do dicionário grego de Strong (Open Scriptures).
//
// Uso:
//   git clone --depth 1 https://github.com/byztxt/byzantine-majority-text <pasta-byz>
//   curl -o <strongs.js> https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js
//   node scripts/gerar-grego.mjs <pasta-byz> <strongs.js>

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [pastaByz, arquivoStrongs] = process.argv.slice(2);
if (!pastaByz || !arquivoStrongs) {
  console.error('Uso: node scripts/gerar-grego.mjs <pasta-byz> <strongs.js>');
  process.exit(1);
}

const livrosNT = [
  ['MAT', 'Mateus'], ['MAR', 'Marcos'], ['LUK', 'Lucas'], ['JOH', 'João'], ['ACT', 'Atos'],
  ['ROM', 'Romanos'], ['1CO', '1 Coríntios'], ['2CO', '2 Coríntios'], ['GAL', 'Gálatas'],
  ['EPH', 'Efésios'], ['PHP', 'Filipenses'], ['COL', 'Colossenses'], ['1TH', '1 Tessalonicenses'],
  ['2TH', '2 Tessalonicenses'], ['1TI', '1 Timóteo'], ['2TI', '2 Timóteo'], ['TIT', 'Tito'],
  ['PHM', 'Filemom'], ['HEB', 'Hebreus'], ['JAM', 'Tiago'], ['1PE', '1 Pedro'], ['2PE', '2 Pedro'],
  ['1JO', '1 João'], ['2JO', '2 João'], ['3JO', '3 João'], ['JUD', 'Judas'], ['REV', 'Apocalipse'],
];

// Lê um CSV simples "capitulo,versiculo,texto" (texto pode vir entre aspas)
function lerCsv(caminho) {
  return readFileSync(caminho, 'utf8')
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map((linha) => {
      const m = linha.match(/^(\d+),(\d+),"?(.*?)"?\r?$/);
      if (!m) throw new Error(`Linha inesperada em ${caminho}: ${linha}`);
      return { cap: Number(m[1]), ver: Number(m[2]), texto: m[3].replace(/""/g, '"') };
    });
}

const semAcento = (p) => p.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ');

const saida = join('src', 'data', 'grego');
mkdirSync(saida, { recursive: true });

const usados = new Set();
let versosAlinhados = 0;
let versosTotal = 0;

for (const [codigo] of livrosNT) {
  const acentuado = lerCsv(join(pastaByz, 'csv-unicode', 'ccat', 'no-variants', `${codigo}.csv`));
  const marcado = lerCsv(join(pastaByz, 'csv-unicode', 'strongs', 'with-parsing', `${codigo}.csv`));
  const porRef = new Map(acentuado.map((v) => [`${v.cap}:${v.ver}`, v.texto]));

  // capítulos -> versículos -> palavras [grego, strong, morfologia]
  const capitulos = [];
  for (const v of marcado) {
    const tokens = [...v.texto.matchAll(/(\S+) ((?:\d+ )+)\{([^}]+)\}/g)].map((m) => ({
      palavra: m[1],
      strong: Number(m[2].trim().split(' ')[0]),
      morf: m[3],
    }));
    // Usa o texto acentuado quando as palavras batem uma a uma
    const comAcento = (porRef.get(`${v.cap}:${v.ver}`) ?? '').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean);
    const alinhado =
      comAcento.length === tokens.length && comAcento.every((p, i) => semAcento(p) === semAcento(tokens[i].palavra));
    versosTotal += 1;
    if (alinhado) versosAlinhados += 1;

    capitulos[v.cap - 1] ??= [];
    capitulos[v.cap - 1][v.ver - 1] = tokens.map((t, i) => {
      usados.add(t.strong);
      return [alinhado ? comAcento[i] : t.palavra, t.strong, t.morf];
    });
  }
  writeFileSync(join(saida, `${codigo}.json`), JSON.stringify(capitulos));
}

// Dicionário: só as entradas usadas no texto, com os campos que o app mostra
const fonte = readFileSync(arquivoStrongs, 'utf8');
const json = fonte.slice(fonte.indexOf('{'), fonte.lastIndexOf('}') + 1);
const dic = JSON.parse(json);
const lexico = {};
for (const n of [...usados].sort((a, b) => a - b)) {
  const e = dic[`G${n}`];
  if (!e) continue;
  lexico[n] = [e.lemma, e.translit, (e.strongs_def ?? '').trim(), (e.kjv_def ?? '').trim()];
}
writeFileSync(join(saida, 'lexico.json'), JSON.stringify(lexico));

console.log(`Livros: ${livrosNT.length}. Versículos com acentuação: ${versosAlinhados}/${versosTotal}. Verbetes: ${Object.keys(lexico).length}.`);
