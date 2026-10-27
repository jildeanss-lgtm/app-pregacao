// Traduz os códigos de morfologia de Robinson (ex.: V-AAI-3S, N-ASM) para português.

const classes: Record<string, string> = {
  V: 'Verbo',
  N: 'Substantivo',
  A: 'Adjetivo',
  T: 'Artigo',
  P: 'Pronome pessoal',
  R: 'Pronome relativo',
  C: 'Pronome recíproco',
  D: 'Pronome demonstrativo',
  K: 'Pronome correlativo',
  I: 'Pronome interrogativo',
  X: 'Pronome indefinido',
  Q: 'Pronome correlativo ou interrogativo',
  F: 'Pronome reflexivo',
  S: 'Pronome possessivo',
  ADV: 'Advérbio',
  CONJ: 'Conjunção',
  COND: 'Partícula condicional',
  PREP: 'Preposição',
  PRT: 'Partícula',
  INJ: 'Interjeição',
  HEB: 'Palavra hebraica',
  ARAM: 'Palavra aramaica',
};

const tempos: Record<string, string> = {
  P: 'presente',
  I: 'imperfeito',
  F: 'futuro',
  A: 'aoristo',
  R: 'perfeito',
  L: 'mais-que-perfeito',
};

const vozes: Record<string, string> = {
  A: 'ativa',
  M: 'média',
  P: 'passiva',
  E: 'média ou passiva',
  D: 'média depoente',
  O: 'passiva depoente',
  N: 'média ou passiva depoente',
  Q: 'ativa impessoal',
  X: 'sem voz',
};

const modos: Record<string, string> = {
  I: 'indicativo',
  S: 'subjuntivo',
  O: 'optativo',
  M: 'imperativo',
  N: 'infinitivo',
  P: 'particípio',
  R: 'particípio imperativo',
};

const casos: Record<string, string> = { N: 'nominativo', G: 'genitivo', D: 'dativo', A: 'acusativo', V: 'vocativo' };
const numeros: Record<string, string> = { S: 'singular', P: 'plural' };
const generos: Record<string, string> = { M: 'masculino', F: 'feminino', N: 'neutro' };

function casoNumeroGenero(codigo: string) {
  const m = codigo.match(/^([123])?([NGDAV])([SP])([MFN])?/);
  if (!m) return [];
  return [m[1] && `${m[1]}ª pessoa`, casos[m[2]], numeros[m[3]], m[4] && generos[m[4]]].filter(Boolean) as string[];
}

export function descreverMorfologia(codigo: string) {
  const [classe, ...resto] = codigo.split('-');
  const partes = [classes[classe] ?? classe];

  if (classe === 'V' && resto[0]) {
    const m = resto[0].match(/^2?([PIFARL])([AMPEDONQX])([ISOMNPR])$/);
    if (m) partes.push(tempos[m[1]], vozes[m[2]], modos[m[3]]);
    const pessoa = resto[1]?.match(/^([123])([SP])$/);
    if (pessoa) partes.push(`${pessoa[1]}ª pessoa`, numeros[pessoa[2]]);
    else if (resto[1]) partes.push(...casoNumeroGenero(resto[1]));
  } else if (resto[0]) {
    partes.push(...casoNumeroGenero(resto[0]));
  }
  return partes.filter(Boolean).join(', ');
}
