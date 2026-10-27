// Gera src/data/portugues/ a partir da Bíblia Livre (BLIVRE, CC BY 4.0), arquivo "verso por linha" do eBible.org.
//
// Uso:
//   curl -O https://ebible.org/Scriptures/porbr2018_vpl.zip && unzip porbr2018_vpl.zip
//   node scripts/gerar-portugues.mjs porbr2018_vpl.txt

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [arquivo] = process.argv.slice(2);
if (!arquivo) {
  console.error('Uso: node scripts/gerar-portugues.mjs <porbr2018_vpl.txt>');
  process.exit(1);
}

// Código do eBible -> [código usado no app, nome em português]
const livros = [
  ['GEN', 'GEN', 'Gênesis'], ['EXO', 'EXO', 'Êxodo'], ['LEV', 'LEV', 'Levítico'], ['NUM', 'NUM', 'Números'],
  ['DEU', 'DEU', 'Deuteronômio'], ['JOS', 'JOS', 'Josué'], ['JDG', 'JDG', 'Juízes'], ['RUT', 'RUT', 'Rute'],
  ['1SA', '1SA', '1 Samuel'], ['2SA', '2SA', '2 Samuel'], ['1KI', '1KI', '1 Reis'], ['2KI', '2KI', '2 Reis'],
  ['1CH', '1CH', '1 Crônicas'], ['2CH', '2CH', '2 Crônicas'], ['EZR', 'EZR', 'Esdras'], ['NEH', 'NEH', 'Neemias'],
  ['EST', 'EST', 'Ester'], ['JOB', 'JOB', 'Jó'], ['PSA', 'PSA', 'Salmos'], ['PRO', 'PRO', 'Provérbios'],
  ['ECC', 'ECC', 'Eclesiastes'], ['SOL', 'SNG', 'Cânticos'], ['ISA', 'ISA', 'Isaías'], ['JER', 'JER', 'Jeremias'],
  ['LAM', 'LAM', 'Lamentações'], ['EZE', 'EZK', 'Ezequiel'], ['DAN', 'DAN', 'Daniel'], ['HOS', 'HOS', 'Oséias'],
  ['JOE', 'JOL', 'Joel'], ['AMO', 'AMO', 'Amós'], ['OBA', 'OBA', 'Obadias'], ['JON', 'JON', 'Jonas'],
  ['MIC', 'MIC', 'Miquéias'], ['NAH', 'NAM', 'Naum'], ['HAB', 'HAB', 'Habacuque'], ['ZEP', 'ZEP', 'Sofonias'],
  ['HAG', 'HAG', 'Ageu'], ['ZEC', 'ZEC', 'Zacarias'], ['MAL', 'MAL', 'Malaquias'],
  ['MAT', 'MAT', 'Mateus'], ['MAR', 'MAR', 'Marcos'], ['LUK', 'LUK', 'Lucas'], ['JOH', 'JOH', 'João'],
  ['ACT', 'ACT', 'Atos'], ['ROM', 'ROM', 'Romanos'], ['1CO', '1CO', '1 Coríntios'], ['2CO', '2CO', '2 Coríntios'],
  ['GAL', 'GAL', 'Gálatas'], ['EPH', 'EPH', 'Efésios'], ['PHI', 'PHP', 'Filipenses'], ['COL', 'COL', 'Colossenses'],
  ['1TH', '1TH', '1 Tessalonicenses'], ['2TH', '2TH', '2 Tessalonicenses'], ['1TI', '1TI', '1 Timóteo'],
  ['2TI', '2TI', '2 Timóteo'], ['TIT', 'TIT', 'Tito'], ['PHM', 'PHM', 'Filemom'], ['HEB', 'HEB', 'Hebreus'],
  ['JAM', 'JAM', 'Tiago'], ['1PE', '1PE', '1 Pedro'], ['2PE', '2PE', '2 Pedro'], ['1JO', '1JO', '1 João'],
  ['2JO', '2JO', '2 João'], ['3JO', '3JO', '3 João'], ['JUD', 'JUD', 'Judas'], ['REV', 'REV', 'Apocalipse'],
];
const porCodigo = new Map(livros.map(([ebible, app]) => [ebible, app]));

const textos = new Map();
for (const linha of readFileSync(arquivo, 'utf8').split('\n')) {
  const m = linha.match(/^(\w{3}) (\d+):(\d+) (.*?)\r?$/);
  if (!m) continue;
  const codigo = porCodigo.get(m[1]);
  if (!codigo) throw new Error(`Livro desconhecido: ${m[1]}`);
  const capitulos = textos.get(codigo) ?? [];
  capitulos[Number(m[2]) - 1] ??= [];
  capitulos[Number(m[2]) - 1][Number(m[3]) - 1] = m[4].trim();
  textos.set(codigo, capitulos);
}

const saida = join('src', 'data', 'portugues');
mkdirSync(saida, { recursive: true });
let versiculos = 0;
for (const [codigo, capitulos] of textos) {
  // Versículos ausentes na tradução viram texto vazio, para manter a numeração
  const cheio = Array.from(capitulos, (vs) => Array.from(vs ?? [], (v) => v ?? ''));
  versiculos += cheio.reduce((t, c) => t + c.length, 0);
  writeFileSync(join(saida, `${codigo}.json`), JSON.stringify(cheio));
}

const lista = livros
  .map(([, codigo, nome], i) => {
    const caps = textos.get(codigo).length;
    return `  { codigo: '${codigo}', nome: '${nome}', capitulos: ${caps}, testamento: '${i < 39 ? 'AT' : 'NT'}' },`;
  })
  .join('\n');
const carregadores = livros
  .map(([, c]) => `    case '${c}':\n      return (await import('./${c}.json')).default as unknown as string[][];`)
  .join('\n');

writeFileSync(
  join(saida, 'index.ts'),
  `// Gerado por scripts/gerar-portugues.mjs. Texto: Bíblia Livre (BLIVRE), Copyright © Diego Santos, Mario Sérgio
// e Marco Teles, fevereiro de 2018. Licença Creative Commons Atribuição 4.0 Brasil.

export const livros = [
${lista}
] as const;

export type CodigoLivro = (typeof livros)[number]['codigo'];

// Cada livro é carregado sob demanda (no navegador, um arquivo por livro)
export async function carregarTexto(codigo: CodigoLivro): Promise<string[][]> {
  switch (codigo) {
${carregadores}
  }
}
`,
);

console.log(`Livros: ${textos.size}. Versículos: ${versiculos}.`);
