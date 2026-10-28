import { livros } from './portugues';

// Roteiro de estudo indutivo: Observação -> Interpretação -> Aplicação.
// As perguntas mudam conforme o gênero literário do texto.

export type Genero = 'exposicao' | 'narrativa' | 'parabola' | 'poesia' | 'sabedoria' | 'profecia';

export const generos: { id: Genero; nome: string; chave: string; perguntas: string[] }[] = [
  {
    id: 'exposicao',
    nome: 'Exposição (cartas)',
    chave: 'Siga o argumento: a estrutura lógica, os conectivos (pois, portanto, mas) e os termos-chave.',
    perguntas: [
      'Qual é o argumento principal do parágrafo?',
      'Que conectivos ligam as ideias (pois, portanto, mas, para que)?',
      'Quais termos o autor repete ou define?',
      'Que problema da igreja original o autor está respondendo?',
    ],
  },
  {
    id: 'narrativa',
    nome: 'Narrativa e biografia',
    chave: 'Observe o enredo, os personagens e o que Deus está fazendo na história.',
    perguntas: [
      'Que movimento há na história: físico, espiritual, relacional, político?',
      'O que mudou no fim, e por quê?',
      'Quem são os personagens, que decisões tomam e como se relacionam com Deus?',
      'Eles progridem ou regridem? Falham? Por quê?',
      'O que eu faria no lugar deles?',
      'O que descobrem sobre Deus?',
      'Que coisas eles enfrentam que devemos evitar?',
    ],
  },
  {
    id: 'parabola',
    nome: 'Parábola',
    chave: 'Busque o princípio central. Não force significado em cada detalhe.',
    perguntas: [
      'Para quem Jesus contou a parábola e o que provocou a história?',
      'Qual é o ponto central que ela ilustra?',
      'Que reação ela queria causar nos ouvintes?',
    ],
  },
  {
    id: 'poesia',
    nome: 'Poesia (Salmos, Cânticos)',
    chave: 'Observe o paralelismo, as imagens e o apelo às emoções. Hipérboles não são literais.',
    perguntas: [
      'Como as linhas se relacionam: repetem, ampliam ou contrastam?',
      'Que imagens e metáforas o poeta usa?',
      'Que sentimento o texto expressa e para onde ele leva?',
    ],
  },
  {
    id: 'sabedoria',
    nome: 'Sabedoria (Provérbios, Jó, Eclesiastes)',
    chave: 'Provérbios são princípios de como a vida costuma funcionar, não promessas garantidas.',
    perguntas: [
      'Que comportamento o texto recomenda ou condena?',
      'Que consequência ele aponta?',
      'Que contraste (sábio x tolo, justo x ímpio) aparece?',
    ],
  },
  {
    id: 'profecia',
    nome: 'Profecia e apocalíptico',
    chave: 'Recrie a situação histórica e use o Antigo Testamento para entender os símbolos.',
    perguntas: [
      'Qual o problema principal ao qual o profeta se refere?',
      'Que imagem ele usa para descrevê-lo?',
      'Qual foi a reação do povo?',
      'O que a mensagem diz sobre Deus?',
      'O que acontece depois que o profeta fala?',
      'Por que Deus incluiu este livro na sua Palavra?',
    ],
  },
];

// Gênero mais comum de cada livro, usado como sugestão
const generoDoLivro: Record<string, Genero> = {};
const grupos: [Genero, string[]][] = [
  ['narrativa', ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'MAT', 'MAR', 'LUK', 'JOH', 'ACT']],
  ['poesia', ['PSA', 'SNG', 'LAM']],
  ['sabedoria', ['JOB', 'PRO', 'ECC']],
  ['profecia', ['ISA', 'JER', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'REV']],
];
for (const [g, codigos] of grupos) for (const c of codigos) generoDoLivro[c] = g;

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// "Êxodo 8" -> 'EXO'; o nome mais longo vence, para "1 João" não virar "João"
export function livroDoTexto(texto: string) {
  const t = normalizar(texto);
  return livros
    .filter((l) => t.startsWith(normalizar(l.nome)) || (l.codigo === 'PSA' && t.startsWith('salmo')))
    .sort((a, b) => b.nome.length - a.nome.length)[0];
}

// "João 3:16-21" -> livro, capítulo 3, versículos 16 a 21. Sem versículo, o capítulo inteiro.
export function referenciaDoTexto(texto: string) {
  const livro = livroDoTexto(texto);
  if (!livro) return undefined;
  const resto = texto.slice(livro.nome.length);
  const m = resto.match(/(\d+)(?:\s*:\s*(\d+)(?:\s*[-–]\s*(\d+))?)?/);
  const capitulo = m ? Number(m[1]) : 1;
  if (capitulo < 1 || capitulo > livro.capitulos) return undefined;
  const de = m?.[2] ? Number(m[2]) : undefined;
  const ate = m?.[3] ? Number(m[3]) : de;
  return { livro, capitulo, de, ate };
}

export const leitura = [
  'Leia devagar, como se fosse a primeira vez.',
  'Leia mais de uma vez, de preferência em voz alta.',
  'Leia com oração: peça a Deus entendimento antes, durante e depois.',
  'Leia o capítulo inteiro e, se puder, o livro todo, para ver o contexto.',
  'Leia em outra tradução (NVT, NAA) e anote as diferenças.',
  'Leia com as seis perguntas: quem, o quê, onde, quando, por quê, para quê.',
];

export function sugerirGenero(textoBase: string): Genero | undefined {
  const livro = livroDoTexto(textoBase);
  if (!livro) return undefined;
  return generoDoLivro[livro.codigo] ?? 'exposicao';
}

export const observacao = {
  contexto: [
    'Quem escreveu?',
    'Para quem foi escrito?',
    'Quando foi escrito?',
    'O que aconteceu antes?',
    'Por que foi escrito? Qual problema o autor enfrentava?',
  ],
  pistas: [
    'Coisas enfatizadas: espaço dado, ordem, propósito declarado',
    'Coisas repetidas: termos, expressões, padrões',
    'Coisas relacionadas: geral e específico, pergunta e resposta, causa e efeito',
    'Coisas semelhantes: comparações com "como" e metáforas',
    'Coisas diferentes: contrastes com "mas" ou "porém", ironia',
    'Coisas da vida real: o que se repete na experiência humana de hoje',
  ],
  perguntas: ['Quem?', 'O quê?', 'Onde?', 'Quando?', 'Por quê?', 'Para quê?'],
};

export const interpretacao = [
  { nome: 'Conteúdo', texto: 'Termos-chave, estrutura gramatical e literária, gênero e atmosfera do texto.' },
  { nome: 'Contexto', texto: 'Versículos vizinhos, momento histórico, cultura, geografia e teologia da época.' },
  { nome: 'Comparação', texto: 'Escritura interpreta Escritura: que outras passagens falam deste assunto ou personagem?' },
  { nome: 'Cultura', texto: 'O que isso significava para eles? O que é verdade eterna e o que é prática da época?' },
  { nome: 'Consulta', texto: 'Só depois do texto: dicionários, atlas, comentários e a sua biblioteca.' },
];

export const sentidoFigurado = [
  'Fique com o sentido literal, a menos que haja boa razão para o figurado.',
  'Use o figurado quando o próprio texto indicar (sonhos, visões).',
  'Use o figurado quando o literal for impossível, absurdo ou imoral.',
  'Use o figurado quando for claramente figura de linguagem ("como", metáforas).',
  'Use o figurado quando o literal contrariar o contexto, o estilo do livro ou o propósito do autor.',
  'Use o figurado quando o literal contradisser outras partes das Escrituras ou a doutrina.',
];
