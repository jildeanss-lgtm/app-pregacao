export type TipoBloco =
  | 'saudacao'
  | 'objetivo'
  | 'introducao'
  | 'topico'
  | 'subtopico'
  | 'quadro'
  | 'quadroPerguntas'
  | 'frase'
  | 'pontos'
  | 'versiculo'
  | 'explicacao'
  | 'exemplo'
  | 'efeito'
  | 'pergunta'
  | 'palavra'
  | 'ilustracao'
  | 'aplicacao'
  | 'citacao'
  | 'conclusao'
  | 'apelo';

export const nomesBloco: Record<TipoBloco, string> = {
  saudacao: 'Saudação',
  objetivo: 'Objetivo',
  introducao: 'Introdução',
  topico: 'Tópico',
  subtopico: 'Subtópico',
  quadro: 'Texto',
  quadroPerguntas: 'Pergunta',
  frase: 'Frase',
  pontos: 'Pontos',
  versiculo: 'Texto bíblico',
  explicacao: 'Explicação',
  exemplo: 'Exemplo bíblico',
  efeito: 'Frase de efeito',
  pergunta: 'Pergunta (só a linha)',
  palavra: 'Palavra no original',
  ilustracao: 'Ilustração',
  aplicacao: 'Aplicação',
  citacao: 'Citação',
  conclusao: 'Conclusão',
  apelo: 'Apelo',
};

export type Modelo = 'tematico' | 'textual' | 'expositivo' | 'lectio';

export const modelos: { id: Modelo; nome: string; descricao: string }[] = [
  {
    id: 'tematico',
    nome: 'Temático',
    descricao:
      'Os tópicos são desenvolvidos em torno de um tema, com versículos que tratam do mesmo assunto. Faça perguntas ao tema: O quê? Quem? Quando? Onde? Como? Por quê?',
  },
  {
    id: 'textual',
    nome: 'Textual',
    descricao:
      'Os tópicos saem de um texto específico, usando as divisões do próprio texto. Os subtópicos podem se apoiar em outros versículos.',
  },
  {
    id: 'expositivo',
    nome: 'Expositivo',
    descricao:
      'Os tópicos seguem o propósito original de um texto específico, explicando pela hermenêutica o que o autor quis dizer.',
  },
  {
    id: 'lectio',
    nome: 'Lectio continua',
    descricao: 'Pregação em sequência, verso após verso, como um comentário explicativo na ordem do texto.',
  },
];

export const objetivosSermao = ['Pregação', 'Doutrinário', 'Estudo', 'Aula EBD'];

export type OpcaoIntroducao = 'citacoes' | 'analise' | 'tema';

export const opcoesIntroducao: { id: OpcaoIntroducao; nome: string; dica: string }[] = [
  {
    id: 'citacoes',
    nome: 'Citações',
    dica: 'O que teólogos, escritores e os pais da igreja disseram sobre o livro ou o assunto. Quem escreveu, o que registrou, em que período.',
  },
  {
    id: 'analise',
    nome: 'Análise de hoje',
    dica: 'Vivemos em uma época de... Mostre como o mundo pensa hoje (minha vida, meus planos, meus direitos) e a tensão com o texto.',
  },
  {
    id: 'tema',
    nome: 'Tema',
    dica: 'Este é um dos temas mais claros da Bíblia, e ainda assim muitos vivem o contrário. Apresente o tema e por que ele importa.',
  },
];

export type BlocoInicial = { tipo: TipoBloco; texto?: string; rotulo?: string; dica?: string };

export type OpcoesNovoSermao = {
  modelo: Modelo;
  textoBase: string;
  objetivo: string;
  tipoObjetivo?: string;
  // Texto dos versículos, que já entra no bloco Texto referência
  versos?: string;
  introducao: OpcaoIntroducao;
  comSaudacao: boolean;
};

function saudacao(textoBase: string): BlocoInicial[] {
  return [
    {
      tipo: 'saudacao',
      texto: [
        '*LOUVADO* para *SEMPRE* o *NOME SANTO* de *JESUS*',
        'Porque *DELE* e *POR ELE* são *TODAS* as *COISAS*, *GLÓRIA* pois *SOMENTE* a ele *ETERNAMENTE*',
        'Queridos irmãos, *MINHA SAUDAÇÃO* é com a *PAZ DO SENHOR*!',
      ].join('\n'),
    },
    { tipo: 'pergunta', texto: '*QUEM VEIO ADORAR* ao *SENHOR*?' },
    { tipo: 'frase', texto: `*ABRA* sua *BÍBLIA*: ${textoBase || '...'}` },
    {
      tipo: 'pontos',
      rotulo: 'Enquanto você procura, eu queria',
      texto: [
        '*TRIBUTAR* a Deus a minha gratidão pelo privilégio de estar com os irmãos',
        '*ESTENDER GRATIDÃO* ao pastor ... pelo convite',
        '*DEIXAR MEU RESPEITO* aos homens de Deus que já ministraram aqui',
        '*TRAGO* o *ABRAÇO* do meu pastor',
      ].join('\n'),
    },
    { tipo: 'frase', texto: '*DIGA AO SEU IRMÃO*: Deus tem uma *PALAVRA* para o seu *CORAÇÃO*' },
    {
      tipo: 'pontos',
      rotulo: 'Para isso, eu preciso',
      texto: 'Dos próximos minutos da sua *atenção*\nPara você *ENTENDER* a *MENSAGEM* que *DEUS* tem',
    },
    {
      tipo: 'versiculo',
      texto:
        'Mateus 13:19 - Quando alguém ouve a *palavra do Reino* e *não a entende*, o maligno vem e *arranca* o que foi semeado em seu *coração*',
    },
    { tipo: 'efeito', texto: '*PALAVRA* de Deus *NÃO VOLTA VAZIA*, mas a *TERRA* do seu *CORAÇÃO* tem que *SER BOA*' },
  ];
}

// Cada tópico: Tópico, Texto (subtópico e pontos), Texto bíblico, Frase de efeito, Aplicação e Pergunta
function topico(n: number, modelo: Modelo): BlocoInicial[] {
  const dicaTopico =
    modelo === 'tematico'
      ? 'Responda ao tema: O quê? Quem? Quando? Onde? Como? Por quê?'
      : modelo === 'lectio'
        ? `Versículo ${n}: a ideia principal`
        : undefined;
  return [
    { tipo: 'topico', rotulo: `Tópico ${n}`, dica: dicaTopico },
    { tipo: 'quadro' },
    { tipo: 'versiculo', dica: modelo === 'tematico' ? 'Versículo que fundamenta este tópico' : `Parte ${n} do texto` },
    { tipo: 'efeito' },
    { tipo: 'aplicacao' },
    { tipo: 'quadroPerguntas' },
  ];
}

// Monta o esqueleto do sermão a partir do modelo de pregação do Jildean: objetivo no cabeçalho, saudação,
// texto referência, introdução, três tópicos e conclusão
export function montarBlocos(o: OpcoesNovoSermao): BlocoInicial[] {
  const intro = opcoesIntroducao.find((i) => i.id === o.introducao)!;
  return [
    {
      tipo: 'objetivo',
      rotulo: o.tipoObjetivo ? `Objetivo do sermão: ${o.tipoObjetivo}` : 'Objetivo do sermão',
      texto: o.objetivo.trim() ? `O *OBJETIVO* deste *SERMÃO* é:\n${o.objetivo.trim()}` : '',
    },
    ...(o.comSaudacao ? saudacao(o.textoBase) : []),
    {
      tipo: 'versiculo',
      rotulo: 'Texto referência',
      texto: o.versos ? `${o.textoBase} - ${o.versos}` : '',
      dica: o.textoBase ? `${o.textoBase} - cole ou escreva o texto` : undefined,
    },
    { tipo: 'introducao', rotulo: `Introdução: ${intro.nome}`, dica: intro.dica },
    ...[1, 2, 3].flatMap((n) => topico(n, o.modelo)),
    { tipo: 'conclusao' },
    { tipo: 'efeito' },
    { tipo: 'aplicacao' },
    { tipo: 'apelo', rotulo: 'Chamado e convite' },
    { tipo: 'pergunta', rotulo: 'Reflexão' },
  ];
}
