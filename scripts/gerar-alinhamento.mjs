// Liga cada palavra da Bíblia Livre à palavra do original (grego ou hebraico/aramaico) no mesmo versículo.
// Não existe interlinear português livre, então o alinhamento é estatístico (IBM Model 1, com a palavra
// "nula" para preposições e artigos que não têm par), treinado na Bíblia inteira, com preferência
// pela posição parecida no versículo. Também gera, para cada número de Strong, as traduções mais
// usadas pela Bíblia Livre (glosas em português).
//
// Uso: node scripts/gerar-alinhamento.mjs   (lê src/data/portugues, grego e hebraico)

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dados = 'src/data';
const ler = (p) => JSON.parse(readFileSync(join(dados, p), 'utf8'));
// Códigos dos livros listados no index.ts de cada pasta (antes das funções de carga)
const indice = (pasta) => {
  const fonte = readFileSync(join(dados, pasta, 'index.ts'), 'utf8').split('export type')[0];
  return [...fonte.matchAll(/'([0-9A-Z]{3})'/g)].map((m) => m[1]);
};

// Artigos, preposições e contrações quase nunca têm uma palavra própria no original
const semPar = new Set(
  'a o as os ao aos à às de do da dos das em no na nos nas num numa um uma uns umas pelo pela pelos pelas'.split(' '),
);

// Mesma divisão de palavras do app (src/data/alinhamento.ts)
const palavrasPt = (texto) => texto.match(/[\p{L}\p{M}]+/gu) ?? [];
const chavePt = (p) =>
  p.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().slice(0, 6);

const ITERACOES = 8;
const PESO_POSICAO = 3;

function alinhar(livros, pastaOriginal) {
  // Pares de versículos: palavras do português (chaves) e números de Strong do original
  const versos = [];
  for (const codigo of livros) {
    const pt = ler(`portugues/${codigo}.json`);
    const orig = ler(`${pastaOriginal}/${codigo}.json`);
    pt.forEach((cap, c) =>
      cap.forEach((texto, v) => {
        const palavras = orig[c]?.[v];
        if (!texto || !palavras?.length) return;
        const formas = palavrasPt(texto);
        versos.push({ codigo, c, v, formas, e: formas.map(chavePt), f: palavras.map((p) => p[1]) });
      }),
    );
  }

  // t(e|f), com f = 0 para a palavra nula
  const t = new Map();
  const k = (f, e) => `${f}\u0001${e}`;
  const uniforme = 1e-3;
  for (let it = 0; it < ITERACOES; it++) {
    const conta = new Map();
    const total = new Map();
    for (const { e, f } of versos) {
      const fs = [0, ...f];
      for (const ej of e) {
        let soma = 0;
        for (const fi of fs) soma += t.get(k(fi, ej)) ?? uniforme;
        for (const fi of fs) {
          const p = (t.get(k(fi, ej)) ?? uniforme) / soma;
          conta.set(k(fi, ej), (conta.get(k(fi, ej)) ?? 0) + p);
          total.set(fi, (total.get(fi) ?? 0) + p);
        }
      }
    }
    t.clear();
    for (const [chave, c] of conta) {
      const fi = Number(chave.split('\u0001')[0]);
      t.set(chave, c / total.get(fi));
    }
    console.log(`${pastaOriginal}: iteração ${it + 1}`);
  }

  // Alinhamento de cada versículo e contagem das traduções por Strong
  const saida = {};
  const glosas = {};
  // Versículos onde cada Strong aparece, para mostrar como a palavra é usada
  const ocorrencias = {};
  for (const { codigo, c, v, formas, e, f } of versos) {
    const J = e.length;
    const I = f.length;
    const ligacoes = e.map((ej, j) => {
      if (semPar.has(formas[j].toLowerCase())) return -1;
      let melhor = -1;
      let pontos = (t.get(k(0, ej)) ?? 0) * 0.5;
      f.forEach((fi, i) => {
        const distancia = Math.abs((j + 0.5) / J - (i + 0.5) / I);
        const p = (t.get(k(fi, ej)) ?? 0) * Math.exp(-PESO_POSICAO * distancia);
        if (p > pontos) {
          pontos = p;
          melhor = i;
        }
      });
      return melhor;
    });
    for (const fi of new Set(f)) (ocorrencias[fi] ??= []).push(`${codigo}.${c + 1}.${v + 1}`);
    ligacoes.forEach((i, j) => {
      if (i < 0) return;
      const g = (glosas[f[i]] ??= {});
      const forma = formas[j].toLowerCase();
      g[forma] = (g[forma] ?? 0) + 1;
    });
    ((saida[codigo] ??= [])[c] ??= [])[v] = ligacoes;
  }

  for (const [codigo, caps] of Object.entries(saida)) {
    const limpo = Array.from(caps, (cap) => Array.from(cap ?? [], (lig) => lig ?? []));
    writeFileSync(join(dados, 'alinhamento', `${codigo}.json`), JSON.stringify(limpo));
  }

  // Por Strong: até 4 traduções mais usadas (com quantas vezes), total de versículos e até 6 exemplos
  // espalhados pela Bíblia
  const resumo = {};
  for (const [strong, versiculos] of Object.entries(ocorrencias)) {
    const formas = Object.entries(glosas[strong] ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .filter(([, n], i) => i === 0 || n >= 2);
    const passo = Math.max(1, Math.floor(versiculos.length / 6));
    const exemplos = versiculos.filter((_, i) => i % passo === 0).slice(0, 6);
    resumo[strong] = [formas, versiculos.length, exemplos];
  }
  writeFileSync(join(dados, 'alinhamento', `glosas-${pastaOriginal}.json`), JSON.stringify(resumo));
}

alinhar(indice('grego'), 'grego');
alinhar(indice('hebraico'), 'hebraico');

// Carregadores com import fixo por livro (o Metro só divide arquivos com caminho literal)
const todos = [...indice('hebraico'), ...indice('grego')];
const casos = todos
  .map((c) => `    case '${c}':\n      return (await import('./${c}.json')).default as unknown as number[][][];`)
  .join('\n');
writeFileSync(
  join(dados, 'alinhamento', 'index.ts'),
  `// Gerado por scripts/gerar-alinhamento.mjs. Para cada versículo, a posição da palavra do original ligada a cada
// palavra do português (-1 quando não há), e por Strong as traduções da Bíblia Livre e onde a palavra aparece.

// [traduções com quantas vezes, total de versículos, exemplos "LIVRO.cap.ver"]
export type Glosa = [[string, number][], number, string[]];

// Mesma divisão de palavras usada para gerar o alinhamento
export const dividirPalavras = (texto: string) => texto.split(/([\\p{L}\\p{M}]+)/u);

export async function carregarAlinhamento(codigo: string): Promise<number[][][] | undefined> {
  switch (codigo) {
${casos}
  }
  return undefined;
}

export async function carregarGlosas(lingua: 'grego' | 'hebraico'): Promise<Record<string, Glosa>> {
  return lingua === 'grego'
    ? ((await import('./glosas-grego.json')).default as unknown as Record<string, Glosa>)
    : ((await import('./glosas-hebraico.json')).default as unknown as Record<string, Glosa>);
}
`,
);
