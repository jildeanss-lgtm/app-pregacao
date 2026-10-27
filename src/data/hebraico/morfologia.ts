// Traduz os códigos de morfologia da Open Scriptures Hebrew Bible (ex.: HVqp3ms, HR/Ncfsa) para português.

const generos: Record<string, string> = { m: 'masculino', f: 'feminino', c: 'comum', b: 'masc. ou fem.' };
const numeros: Record<string, string> = { s: 'singular', p: 'plural', d: 'dual' };
const estados: Record<string, string> = { a: 'absoluto', c: 'construto', d: 'determinado' };
const pessoas: Record<string, string> = { '1': '1ª pessoa', '2': '2ª pessoa', '3': '3ª pessoa' };

const troncos: Record<string, string> = {
  q: 'qal', N: 'nifal', p: 'piel', P: 'pual', h: 'hifil', H: 'hofal', t: 'hitpael', o: 'polel', O: 'polal',
  r: 'hitpolel', m: 'poel', M: 'poal', k: 'palel', K: 'pulal', Q: 'qal passivo', l: 'pilpel', L: 'polpal',
  f: 'hitpalpel', D: 'nitpael', j: 'pealal', i: 'pilel', u: 'hotpaal', c: 'tifil', v: 'hishtafel',
  w: 'nitpalel', y: 'nitpoel', z: 'hitpoel',
};

const formasVerbais: Record<string, string> = {
  p: 'perfeito', q: 'perfeito consecutivo', i: 'imperfeito', w: 'imperfeito consecutivo', h: 'coortativo',
  j: 'jussivo', v: 'imperativo', r: 'particípio ativo', s: 'particípio passivo', a: 'infinitivo absoluto',
  c: 'infinitivo construto',
};

const particulas: Record<string, string> = {
  a: 'Partícula afirmativa', d: 'Artigo definido', e: 'Partícula exortativa', i: 'Partícula interrogativa',
  j: 'Interjeição', m: 'Partícula demonstrativa', n: 'Partícula negativa', o: 'Marcador de objeto direto',
  r: 'Partícula relativa',
};

const pronomes: Record<string, string> = {
  d: 'Pronome demonstrativo', f: 'Pronome indefinido', i: 'Pronome interrogativo', p: 'Pronome pessoal',
  r: 'Pronome relativo',
};

const sufixos: Record<string, string> = {
  d: 'Sufixo direcional', h: 'He paragógico', n: 'Nun paragógico', p: 'Sufixo pronominal',
};

// Lê pessoa/gênero/número/estado que aparecem nessa ordem no fim de um código
function flexao(resto: string) {
  return [...resto]
    .map((c, i) => (i === 0 && pessoas[c]) || (/[mfcb]/.test(c) && generos[c]) || (/[sdp]/.test(c) && numeros[c]))
    .filter(Boolean)
    .join(', ');
}

function nominal(resto: string) {
  // gênero, número, estado
  const [g, n, e] = resto;
  return [generos[g], numeros[n], estados[e]].filter(Boolean).join(', ');
}

function descreverParte(codigo: string) {
  const classe = codigo[0];
  const tipo = codigo[1] ?? '';
  const resto = codigo.slice(2);
  switch (classe) {
    case 'V': {
      const forma = codigo[2] ?? '';
      const depois = codigo.slice(3);
      const detalhes = forma === 'r' || forma === 's' ? nominal(depois) : flexao(depois);
      return ['Verbo', troncos[tipo], formasVerbais[forma], detalhes].filter(Boolean).join(', ');
    }
    case 'N': {
      const nome = tipo === 'p' ? 'Nome próprio' : tipo === 'g' ? 'Gentílico' : 'Substantivo';
      return [nome, tipo === 'p' ? flexao(resto) : nominal(resto)].filter(Boolean).join(', ');
    }
    case 'A':
      return ['Adjetivo', nominal(resto)].filter(Boolean).join(', ');
    case 'P':
      return [pronomes[tipo] ?? 'Pronome', flexao(resto)].filter(Boolean).join(', ');
    case 'S':
      return [sufixos[tipo] ?? 'Sufixo', flexao(resto)].filter(Boolean).join(', ');
    case 'T':
      return particulas[tipo] ?? 'Partícula';
    case 'R':
      return tipo === 'd' ? 'Preposição com artigo' : 'Preposição';
    case 'C':
      return 'Conjunção';
    case 'D':
      return 'Advérbio';
    default:
      return codigo;
  }
}

export function descreverMorfologiaHebraica(codigo: string) {
  if (!codigo) return '';
  const lingua = codigo[0] === 'A' ? 'Aramaico' : 'Hebraico';
  const partes = codigo.slice(1).split('/').map(descreverParte);
  return `${partes.join(' + ')} (${lingua.toLowerCase()})`;
}
