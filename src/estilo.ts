// Padrão visual das pregações: cada tipo de bloco tem cor, ênfase e alinhamento próprios,
// e as palavras-chave (escritas entre *asteriscos*) aparecem em negrito sublinhado.
// Usado no editor, no modo púlpito e no PDF.

import { nomesBloco, type TipoBloco } from './data/modelos';

export const coresPregacao = {
  texto: '#000000',
  textoBiblico: '#990000',
  frase: '#1A3BD6',
  efeito: '#38761D',
  pergunta: '#4A86E8',
  fundoTopico: '#00FF00',
};

export type EstiloBloco = {
  cor: string;
  italico?: boolean;
  centralizado?: boolean;
  negrito?: boolean;
  fundo?: string;
  seta?: boolean;
  lista?: boolean;
  // Caixa com o subtópico na linha de cima e os pontos embaixo
  quadro?: boolean;
  // Cor e ênfase das linhas de baixo do quadro, quando diferem do subtópico
  itens?: { cor: string; italico?: boolean };
  nomeItem?: string;
};

export const estiloBloco: Record<TipoBloco, EstiloBloco> = {
  topico: { cor: coresPregacao.texto, negrito: true, fundo: coresPregacao.fundoTopico },
  subtopico: { cor: coresPregacao.texto, negrito: true, seta: true },
  quadro: { cor: coresPregacao.texto, quadro: true, nomeItem: 'Ponto' },
  quadroPerguntas: {
    cor: coresPregacao.texto,
    quadro: true,
    itens: { cor: coresPregacao.pergunta, italico: true },
    nomeItem: 'Pergunta',
  },
  frase: { cor: coresPregacao.frase, seta: true },
  pontos: { cor: coresPregacao.texto, lista: true },
  versiculo: { cor: coresPregacao.textoBiblico, italico: true },
  citacao: { cor: coresPregacao.textoBiblico, italico: true },
  efeito: { cor: coresPregacao.efeito, italico: true, centralizado: true },
  pergunta: { cor: coresPregacao.pergunta, italico: true, seta: true },
  palavra: { cor: coresPregacao.texto },
  saudacao: { cor: coresPregacao.texto },
  objetivo: { cor: coresPregacao.texto },
  explicacao: { cor: coresPregacao.texto },
  exemplo: { cor: coresPregacao.texto },
  introducao: { cor: coresPregacao.texto },
  ilustracao: { cor: coresPregacao.texto },
  aplicacao: { cor: coresPregacao.texto },
  conclusao: { cor: coresPregacao.texto },
  apelo: { cor: coresPregacao.texto },
};

// Blocos sem cor própria levam um rótulo pequeno no púlpito e no PDF (ex.: "Ilustração")
const semCorPropria = new Set<TipoBloco>([
  'saudacao', 'objetivo', 'introducao', 'explicacao', 'exemplo', 'ilustracao', 'aplicacao', 'conclusao', 'apelo', 'palavra',
]);

export function rotuloVisivel(b: { tipo: TipoBloco; rotulo?: string }) {
  return b.rotulo ?? (semCorPropria.has(b.tipo) ? nomesBloco[b.tipo] : undefined);
}

// "Examinai *tudo*" -> [{ texto: 'Examinai ', chave: false }, { texto: 'tudo', chave: true }]
export function dividirDestaques(texto: string) {
  const partes: { texto: string; chave: boolean }[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(/\*([^*\n]+)\*/g)) {
    if (m.index > ultimo) partes.push({ texto: texto.slice(ultimo, m.index), chave: false });
    partes.push({ texto: m[1], chave: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push({ texto: texto.slice(ultimo), chave: false });
  return partes;
}

// Linhas de um bloco: cada linha vira um item quando o bloco é uma lista
export function linhasDoBloco(texto: string) {
  return texto
    .split('\n')
    .map((l) => l.replace(/^\s*[-•]\s*/, '').trimEnd())
    .filter((l) => l.trim());
}

// Quadro: 1ª linha é o subtópico, as demais são os pontos
export const pontosDoQuadro = 3;

export function dividirQuadro(texto: string) {
  const [subtopico = '', ...resto] = texto.split('\n');
  return { subtopico: subtopico.trim(), pontos: linhasDoBloco(resto.join('\n')) };
}
