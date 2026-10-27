export type TipoBloco =
  | 'saudacao'
  | 'objetivo'
  | 'introducao'
  | 'topico'
  | 'subtopico'
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
  frase: 'Frase',
  pontos: 'Pontos',
  versiculo: 'Texto bíblico',
  explicacao: 'Explicação',
  exemplo: 'Exemplo bíblico',
  efeito: 'Frase de efeito',
  pergunta: 'Pergunta',
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

export const verbosObjetivo = ['Exibir', 'Mostrar', 'Advertir', 'Explicar'];

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

function topico(n: number, modelo: Modelo): BlocoInicial[] {
  return [
    { tipo: 'topico', dica: modelo === 'tematico' ? 'Responda ao tema: O quê? Quem? Quando? Onde? Como? Por quê?' : undefined },
    { tipo: 'versiculo', rotulo: 'Texto', dica: modelo === 'tematico' ? 'Versículo que fundamenta este tópico' : `Parte ${n} do texto` },
    { tipo: 'explicacao' },
    { tipo: 'versiculo', rotulo: 'Versículo de apoio' },
    { tipo: 'exemplo' },
    { tipo: 'aplicacao' },
  ];
}

function versoAVerso(n: number): BlocoInicial[] {
  return [
    { tipo: 'topico', dica: `Versículo ${n}: a ideia principal` },
    { tipo: 'versiculo', rotulo: `Versículo ${n}` },
    { tipo: 'explicacao' },
    { tipo: 'aplicacao' },
  ];
}

// Monta o esqueleto do sermão a partir do modelo de pregação do Jildean:
// saudação, objetivo, texto, introdução, três tópicos e conclusão.
export function montarBlocos(o: OpcoesNovoSermao): BlocoInicial[] {
  const intro = opcoesIntroducao.find((i) => i.id === o.introducao)!;
  const corpo = [1, 2, 3].flatMap((n) => (o.modelo === 'lectio' ? versoAVerso(n) : topico(n, o.modelo)));
  return [
    ...(o.comSaudacao ? saudacao(o.textoBase) : []),
    { tipo: 'objetivo', texto: o.objetivo, dica: 'O objetivo desta lição é...' },
    { tipo: 'versiculo', rotulo: 'Texto referência', dica: o.textoBase ? `${o.textoBase} - cole ou escreva o texto` : undefined },
    { tipo: 'introducao', rotulo: `Introdução: ${intro.nome}`, dica: intro.dica },
    ...corpo,
    { tipo: 'conclusao' },
    { tipo: 'efeito' },
    { tipo: 'aplicacao' },
    { tipo: 'apelo', rotulo: 'Chamado e convite' },
    { tipo: 'pergunta', rotulo: 'Reflexão' },
  ];
}
