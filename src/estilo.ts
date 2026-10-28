// Padrão visual das pregações: cada tipo de bloco tem cor, ênfase e alinhamento próprios,
// e as palavras-chave (escritas entre *asteriscos*) aparecem em negrito sublinhado.
// Usado no editor, no modo púlpito e no PDF.

import { nomesBloco, type TipoBloco } from './data/modelos';

export const coresPregacao = {
  texto: '#000000',
  textoBiblico: '#990000',
  frase: '#0000FF',
  efeito: '#38761D',
  pergunta: '#3C78D8',
  aplicacao: '#7030A0',
  citacao: '#B45F06',
  // Sugestão para o subtópico: azul petróleo, distinto do azul das frases e do azul claro das perguntas
  subtopico: '#134F5C',
  fundoTopico: '#00FF00',
  // Subtópico: letra preta em fundo verde claro, como no documento do Jildean
  fundoSubtopico: '#B6D7A8',
};

export type EstiloBloco = {
  cor: string;
  italico?: boolean;
  centralizado?: boolean;
  negrito?: boolean;
  fundo?: string;
  seta?: boolean;
  // Seta própria (o subtópico usa ➢; o padrão é ➔)
  simboloSeta?: string;
  lista?: boolean;
  // Caixa com o subtópico na linha de cima e os pontos embaixo
  quadro?: boolean;
  // Linha de cima do quadro: cor, itálico e cor das palavras-chave
  topo?: { cor: string; italico?: boolean; corChave: string; nome: string; semSeta?: boolean };
  nomeItem?: string;
  // Os pontos usam a mesma cor e ênfase da linha de cima
  itensComoTopo?: boolean;
  // Sem destaque à mão, todas as palavras (menos conectivos) viram palavra-chave
  autoDestaque?: boolean;
  // Texto bíblico: livro e capítulo em cima, versículo e texto embaixo
  referencia?: boolean;
};

export const estiloBloco: Record<TipoBloco, EstiloBloco> = {
  topico: { cor: coresPregacao.texto, fundo: coresPregacao.fundoTopico },
  subtopico: {
    cor: coresPregacao.texto,
    fundo: coresPregacao.fundoSubtopico,
    seta: true,
    simboloSeta: '➢',
    autoDestaque: true,
  },
  quadro: {
    cor: coresPregacao.texto,
    quadro: true,
    topo: { cor: coresPregacao.texto, corChave: coresPregacao.frase, nome: 'Subtópico' },
    nomeItem: 'Ponto',
    autoDestaque: true,
  },
  quadroPerguntas: {
    cor: coresPregacao.texto,
    quadro: true,
    // Só a pergunta fica em azul claro; os pontos embaixo são pretos, como no Texto
    topo: { cor: coresPregacao.pergunta, italico: true, corChave: coresPregacao.pergunta, nome: 'Pergunta' },
    nomeItem: 'Ponto',
    autoDestaque: true,
  },
  frase: { cor: coresPregacao.frase, seta: true },
  pontos: { cor: coresPregacao.texto, lista: true, autoDestaque: true },
  versiculo: { cor: coresPregacao.textoBiblico, italico: true, autoDestaque: true, referencia: true },
  citacao: { cor: coresPregacao.citacao, italico: true },
  efeito: { cor: coresPregacao.efeito, italico: true, centralizado: true },
  pergunta: { cor: coresPregacao.pergunta, italico: true, seta: true },
  palavra: { cor: coresPregacao.texto },
  saudacao: { cor: coresPregacao.texto },
  // Objetivo no mesmo estilo do corpo: a frase em cima e os três objetivos embaixo
  objetivo: {
    cor: coresPregacao.texto,
    quadro: true,
    topo: { cor: coresPregacao.texto, corChave: coresPregacao.frase, nome: 'O objetivo deste sermão é' },
    nomeItem: 'Objetivo',
    autoDestaque: true,
  },
  explicacao: { cor: coresPregacao.texto },
  exemplo: { cor: coresPregacao.texto },
  introducao: { cor: coresPregacao.texto },
  ilustracao: { cor: coresPregacao.texto },
  // Aplicação no estilo do corpo: a frase em cima e três pontos embaixo, em roxo itálico
  aplicacao: {
    cor: coresPregacao.aplicacao,
    italico: true,
    quadro: true,
    topo: {
      cor: coresPregacao.aplicacao,
      italico: true,
      corChave: coresPregacao.aplicacao,
      nome: 'Aplicação',
      semSeta: true,
    },
    nomeItem: 'Ponto',
    itensComoTopo: true,
  },
  conclusao: { cor: coresPregacao.texto },
  apelo: { cor: coresPregacao.texto },
};

// Blocos sem cor própria levam um rótulo pequeno no púlpito e no PDF (ex.: "Ilustração")
const semCorPropria = new Set<TipoBloco>([
  'saudacao',
  'objetivo',
  'introducao',
  'explicacao',
  'exemplo',
  'ilustracao',
  'aplicacao',
  'conclusao',
  'apelo',
  'palavra',
]);

export function rotuloVisivel(b: { tipo: TipoBloco; rotulo?: string }) {
  return b.rotulo ?? (semCorPropria.has(b.tipo) ? nomesBloco[b.tipo] : undefined);
}

// "Examinai *tudo*" (ou "Examinai TUDO") -> [{ texto: 'Examinai ', chave: false }, { texto: 'tudo', chave: true }]
export function dividirDestaques(texto: string) {
  const partes: { texto: string; chave: boolean }[] = [];
  let ultimo = 0;
  texto = marcarMaiusculas(texto);
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

// O subtópico pode ter mais de uma linha (Enter): elas ficam juntas na 1ª linha, separadas por este caractere
export const quebraNoTopo = '\u2028';

export function dividirQuadro(texto: string) {
  const [subtopico = '', ...resto] = texto.split('\n');
  return {
    subtopico: subtopico
      .split(quebraNoTopo)
      .map((l) => l.trim())
      .join('\n')
      .trim(),
    pontos: linhasDoBloco(resto.join('\n')),
  };
}

// Palavras em MAIÚSCULAS (2 letras ou mais) já viram palavra-chave, sem precisar de asteriscos
export function marcarMaiusculas(texto: string) {
  // Trechos já entre asteriscos (ex.: *PAZ DO SENHOR*) ficam como estão
  return texto
    .split(/(\*[^*\n]+\*)/)
    .map((parte, i) => (i % 2 ? parte : parte.replace(/(?<!\p{L})(\p{Lu}{2,})(?!\p{L})/gu, '*$1*')))
    .join('');
}

// Palavras pequenas que ficam fora do destaque automático
const conectivos = new Set(
  (
    'a o as os e de do da dos das em no na nos nas num numa um uma uns umas que se com por pelo pela pelos pelas ' +
    'para pra ao aos à às ou mas nem como seu sua seus suas lhe lhes me te nos vos eu tu ele ela eles elas ' +
    'isso isto este esta esse essa aquele aquela'
  ).split(' '),
);

// Pontos do Corpo e texto bíblico: sem destaque marcado à mão, todas as palavras
// (menos os conectivos) viram palavra-chave
export function destacarTudo(linha: string) {
  if (/\*|\p{Lu}{2,}/u.test(linha)) return linha;
  return linha.replace(/\p{L}+(?:-\p{L}+)*/gu, (p) => (conectivos.has(p.toLowerCase()) ? p : `*${p}*`));
}

// "1 Tessalonicenses 5:21 - Examinai tudo" -> cabeçalho "1 Tessalonicenses 5" e linha "21 - Examinai tudo"
export function dividirVersiculo(texto: string) {
  const [primeira = '', ...resto] = texto.split('\n');
  const m = primeira.match(/^(.*?\p{L}.*?)\s+(\d+):(\d+(?:\s*[-–,]\s*\d+)*)\s*(?:[-–—:]\s*)?(.*)$/u);
  if (!m) return { cabecalho: undefined, linhas: texto.split('\n') };
  const [, livro, capitulo, versos, conteudo] = m;
  const faixa = versos.match(/^(\d+)\s*[-–]\s*(\d+)/);
  if (!faixa) {
    return {
      cabecalho: `${livro} ${capitulo}`,
      linhas: [conteudo ? `${versos} - ${conteudo}` : versos, ...resto],
    };
  }
  // Vários versículos: cada um na sua linha, começando pelo número ("15 - Porque...", "16 - E...")
  const [de, ate] = [Number(faixa[1]), Number(faixa[2])];
  // Em "15-17 - 15 Porque..." o número do primeiro versículo pode ter ficado junto com a faixa
  const sobra = versos.slice(faixa[0].length).replace(/^\s*[-–]\s*/, '');
  let corpo = [`${sobra} ${conteudo}`, ...resto].join('\n').trim();
  if (!corpo) return { cabecalho: `${livro} ${capitulo}`, linhas: [versos] };
  corpo = corpo.startsWith(`${de} `)
    ? `${de} - ${corpo.slice(`${de} `.length).replace(/^-\s*/, '')}`
    : `${de} - ${corpo}`;
  for (let n = de + 1; n <= ate; n++) {
    corpo = corpo.replace(new RegExp(`(^|\\s)${n}\\s+(?:-\\s*)?(?=\\S)`), `\n${n} - `);
  }
  return {
    cabecalho: `${livro} ${capitulo}`,
    linhas: corpo
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  };
}

// Linhas como aparecem na tela e no PDF, já com o destaque automático aplicado
export function linhasParaMostrar(tipo: TipoBloco, texto: string) {
  const e = estiloBloco[tipo];
  const auto = (l: string) => (e.autoDestaque ? destacarTudo(l) : l);
  if (e.referencia) {
    const { cabecalho, linhas } = dividirVersiculo(texto);
    return { cabecalho: cabecalho && `*${cabecalho}*`, linhas: linhas.map(auto) };
  }
  return { cabecalho: undefined, linhas: (e.lista ? linhasDoBloco(texto) : [texto]).map(auto) };
}
