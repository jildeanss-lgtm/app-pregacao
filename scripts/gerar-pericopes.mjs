// Gera src/data/pericopes.json: onde começa cada perícope (seção) de cada livro, para delimitar
// o trecho em volta do versículo escolhido. Fonte: os títulos de seção (\s1) da Berean Standard
// Bible (domínio público) em USFM, do eBible.org. Só as posições são usadas, não os títulos.
//
// Uso:
//   curl -O https://ebible.org/Scriptures/engbsb_usfm.zip && unzip engbsb_usfm.zip -d engbsb
//   node scripts/gerar-pericopes.mjs engbsb

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [pasta] = process.argv.slice(2);
if (!pasta) {
  console.error('Uso: node scripts/gerar-pericopes.mjs <pasta-usfm-bsb>');
  process.exit(1);
}

// Código USFM -> código usado no app (os demais são iguais)
const codigos = { MRK: 'MAR', JHN: 'JOH', JAS: 'JAM', '1JN': '1JO', '2JN': '2JO', '3JN': '3JO' };
const livrosDoApp = JSON.parse(
  JSON.stringify([...readFileSync('src/data/portugues/index.ts', 'utf8').matchAll(/codigo: '([0-9A-Z]{3})'/g)].map((m) => m[1])),
);

const saida = {};
for (const arquivo of readdirSync(pasta).filter((a) => a.endsWith('.usfm'))) {
  const texto = readFileSync(join(pasta, arquivo), 'utf8');
  const id = texto.match(/^\\id (\S+)/m)?.[1];
  const codigo = codigos[id] ?? id;
  if (!livrosDoApp.includes(codigo)) continue;

  const inicios = [];
  let capitulo = 0;
  let pendente = false;
  for (const linha of texto.split('\n')) {
    const c = linha.match(/^\\c (\d+)/);
    if (c) capitulo = Number(c[1]);
    if (/^\\s1?\s/.test(linha)) pendente = true;
    const v = linha.match(/\\v (\d+)/);
    if (v && pendente) {
      inicios.push([capitulo, Number(v[1])]);
      pendente = false;
    }
  }
  if (!inicios.length || inicios[0][0] !== 1 || inicios[0][1] !== 1) inicios.unshift([1, 1]);
  saida[codigo] = inicios;
}

const faltando = livrosDoApp.filter((c) => !saida[c]);
if (faltando.length) console.warn('Livros sem perícopes:', faltando.join(', '));
writeFileSync('src/data/pericopes.json', JSON.stringify(saida));
console.log(`${Object.keys(saida).length} livros, ${Object.values(saida).reduce((t, l) => t + l.length, 0)} perícopes`);
