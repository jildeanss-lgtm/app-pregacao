export type TipoBloco =
  | 'saudacao'
  | 'objetivo'
  | 'introducao'
  | 'topico'
  | 'subtopico'
  | 'subtopicoVerde'
  | 'quadro'
  | 'quadroPerguntas'
  | 'frase'
  | 'pontos'
  | 'pontosRoxo'
  | 'pontosVermelho'
  | 'pontosAzul'
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
  subtopicoVerde: 'Subtópico verde',
  quadro: 'Texto',
  quadroPerguntas: 'Pergunta',
  frase: 'Frase',
  pontos: 'Pontos',
  pontosRoxo: 'Pontos roxo',
  pontosVermelho: 'Pontos vermelho',
  pontosAzul: 'Pontos azul claro',
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

export type BlocoInicial = {
  tipo: TipoBloco;
  texto?: string;
  rotulo?: string;
  dica?: string;
  novaPagina?: boolean;
  // Caixa da capa do tipo de sermão (ver camposCapa), refeita quando os dados do sermão mudam
  capa?: string;
  // Sem o espaço que separa esta caixa da de cima
  colado?: boolean;
};

export type OpcoesNovoSermao = {
  modelo: Modelo;
  textoBase: string;
  objetivo: string;
  tipoObjetivo?: string;
  // Texto dos versículos, que já entra no bloco Texto referência
  versos?: string;
  introducao: OpcaoIntroducao;
  // A opção de introdução como o JILDEAN editou (descrição e texto que já entra na caixa)
  introducaoEditada?: { dica: string; texto: string };
  // Blocos da saudação escolhida (já com as edições do JILDEAN); sem ela, o sermão começa no texto
  saudacao?: BlocosSaudacao;
  // O que foi preenchido na capa do tipo de sermão
  capa?: Record<string, string>;
};

// Capa de cada tipo de sermão: o que vai na primeira folha além do título, do texto e do objetivo. Cada tipo terá
// a sua (JILDEAN, 29/10/2026); por enquanto só a Aula EBD, como na revista da lição
export type CampoCapa = { id: string; nome: string; dica: string; linhas?: number };
export const camposCapa: Record<string, CampoCapa[]> = {
  'Aula EBD': [
    { id: 'verdade', nome: 'Verdade aplicada', dica: 'A verdade central da lição', linhas: 2 },
    { id: 'oracao', nome: 'Momento de oração', dica: 'Pelo que orar no fim da aula', linhas: 2 },
    {
      id: 'versiculo',
      nome: 'Versículo do dia',
      dica: 'Ex.: Gn 1.27 - E criou Deus o homem à sua imagem...',
      linhas: 2,
    },
  ],
};

// Na Aula EBD o quadro do objetivo não tem frase em cima: o título OBJETIVOS DA LIÇÃO vem num subtópico verde,
// como os outros da capa (JILDEAN, 29/10/2026)
export const inicioObjetivo = (tipo?: string) => (tipo === 'Aula EBD' ? '\n' : 'O *OBJETIVO* deste *SERMÃO* é:\n');

// Caixas da capa, com os títulos em fundo verde como os tópicos (JILDEAN, 29/10/2026): as que vão antes do quadro do objetivo e as que vêm depois dele (ordem da revista da EBD)
export function blocosDaCapa(tipo: string | undefined, capa: Record<string, string> | undefined) {
  const valor = (id: string) => (camposCapa[tipo ?? '']?.some((c) => c.id === id) ? (capa?.[id] ?? '').trim() : '');
  const comTitulo = (id: string, titulo: string, tipoBloco: TipoBloco): BlocoInicial[] =>
    valor(id)
      ? [
          { tipo: 'subtopicoVerde', texto: `*${titulo}*`, capa: id },
          { tipo: tipoBloco, rotulo: '', texto: valor(id), capa: id, colado: true },
        ]
      : [];
  // Os objetivos abrem a capa; as outras caixas vêm logo depois deles (JILDEAN, 29/10/2026)
  return {
    antes:
      tipo === 'Aula EBD'
        ? [{ tipo: 'subtopicoVerde' as const, texto: '*OBJETIVOS DA LIÇÃO*', capa: 'objetivos' }]
        : [],
    depois: [
      ...comTitulo('verdade', 'VERDADE APLICADA', 'efeito'),
      ...comTitulo('oracao', 'MOMENTO DE ORAÇÃO', 'palavra'),
      ...comTitulo('versiculo', 'VERSÍCULO DO DIA', 'versiculo'),
      // O texto bíblico do Texto de referência, que a tela já guarda pronto na capa
      ...(tipo === 'Aula EBD' && capa?.texto?.trim()
        ? [
            { tipo: 'subtopicoVerde' as const, texto: '*TEXTO DE REFERÊNCIA*', capa: 'texto' },
            { tipo: 'versiculo' as const, texto: capa.texto.trim(), capa: 'texto', colado: true },
          ]
        : []),
    ],
  };
}

// Saudações salvas para escolher ao criar o sermão. "antes" vai na página da saudação (saudação, qual texto,
// agradecimentos); "depois" vem logo após a leitura do texto. Cores dentro da linha: [fundo verde]...[/] etc.
export type Saudacao = {
  id: string;
  nome: string;
  resumo: string;
  antes: (textoBase: string) => BlocoInicial[];
  depois: BlocoInicial[];
};

const depoisPadrao: BlocoInicial[] = [
  {
    tipo: 'frase',
    texto: '[fundo verde]*ASSENTE-SE E DIGA IRMÃO*[/]: [fundo verde]*DEUS TEM* uma *PALAVRA* ao seu *CORAÇÃO*[/]',
  },
  {
    tipo: 'aplicacao',
    texto: [
      '*PARA ISSO*, eu *PRECISO* dos *próximos minutos* de sua *atenção*',
      '*Nós já cantamos*, *alegramos*, *Esqueça Celular*, *Irmão*',
      'Para você *ENTENDER* a *MENSAGEM* que *DEUS* tem',
    ].join('\n'),
  },
  {
    tipo: 'versiculo',
    texto:
      'Mateus 13:19 - *Alguém ouve* a *palavra do reino* e *não entende*, *vem o maligno* e *arrebata* o que foi *semeado* no *coração*',
  },
  {
    tipo: 'efeito',
    texto: '*PALAVRA* de Deus *NÃO VOLTA VAZIA*,\nMas a *TERRA* do seu *CORAÇÃO* tem que *SER BOA*',
  },
];

const agradecimentos: BlocoInicial[] = [
  { tipo: 'frase', texto: '[fundo verde]*AGRADECIMENTOS*[/]:' },
  {
    tipo: 'pontos',
    rotulo: 'Enquanto você procura, eu queria',
    texto: [
      '[azul]*Tributar a Deus* a *minha gratidão* pelo *privilégio de estar* com os irmãos para juntos adorarmos aquele que é digno de toda honra, glória e louvor[/]',
      '[azul]*Estender meus agradecimentos* ao *anjo* da igreja, ao *líder espiritual* desta casa, ao *mui digno* e *nobre* Pr. ...[/]',
      '[azul]*Minha gratidão se estende* a todo o *corpo de obreiros* e *membros desta casa*. *É uma honra servir* a essa *casa*[/]',
    ].join('\n'),
  },
];

// Na saudação guardada, o lugar do texto do sermão (ex.: "ABRA sua BÍBLIA: {texto}")
export const MARCA_TEXTO = '{texto}';
export type BlocosSaudacao = { antes: BlocoInicial[]; depois: BlocoInicial[] };
export const saudacaoOriginal = (id: string): BlocosSaudacao | undefined => {
  const s = saudacoes.find((x) => x.id === id);
  return s && { antes: s.antes(MARCA_TEXTO), depois: s.depois };
};

export const saudacoes: Saudacao[] = [
  {
    id: 'louvado',
    nome: 'Louvado seja o nome de Jesus',
    resumo: 'Louvado seja, quem veio adorar, abra sua Bíblia, gratidão',
    antes: (textoBase) => [
      {
        tipo: 'saudacao',
        texto: [
          '*LOUVADO* para *SEMPRE* o *NOME SANTO* de *JESUS*',
          'Porque *DELE* e *POR ELE* são *TODAS* as *COISAS*, *GLÓRIA* pois *SOMENTE* a ele *ETERNAMENTE*',
          'Queridos irmãos, *MINHA SAUDAÇÃO* é com a *PAZ DO SENHOR*!',
        ].join('\n'),
      },
      { tipo: 'pergunta', texto: '*QUEM VEIO ADORAR* ao *SENHOR*?' },
      { tipo: 'frase', texto: `[fundo verde]*ABRA* sua *BÍBLIA*[/]: [vermelho]*${textoBase || '...'}*[/]` },
      ...agradecimentos,
    ],
    depois: depoisPadrao,
  },
  {
    id: 'adoracao',
    nome: 'Jesus está neste lugar (adoração)',
    resumo: 'Paz do Senhor, Jesus está neste lugar, Deus não precisa da nossa adoração',
    antes: (textoBase) => [
      { tipo: 'frase', texto: '[fundo verde]*Meus irmãos, recebam todos a PAZ DO SENHOR!!*[/]' },
      { tipo: 'frase', texto: '*JESUS* está *NESTE LUGAR*' },
      {
        tipo: 'pontos',
        texto:
          '[vermelho]*Onde estiver* 2 *ou* 3, *Reunidos* em *meu nome* *Ali me faço presente*[/]\n*Não é qualquer reunião*, *ajuntamento*',
      },
      { tipo: 'efeito', texto: '*QUANTOS VIERAM ADORAR*?' },
      { tipo: 'frase', texto: '*APRENDI* na *BÍBLIA* que' },
      {
        tipo: 'pontos',
        texto: [
          '*Deus só vem* em *um lugar quando:*',
          '*Preparamos* o *ambiente* para Ele',
          '*A glória só desceu* depois *tabernáculo* todo *preparado*',
        ].join('\n'),
      },
      { tipo: 'frase', texto: '*DEUS* não *PRECISA* da *NOSSA ADORAÇÃO*' },
      {
        tipo: 'pontos',
        texto: '*Se eu não adorar*\n*Ele continua* sendo *adorado*\n*ANJOS*: [vermelho]*Santo*, *Santo*, *Santo*[/]',
      },
      { tipo: 'frase', texto: '*SABE POR QUE, ELE PEDE* para você *ADORAR*?' },
      { tipo: 'efeito', texto: '*ADORAÇÃO DEIXA* você *PARECIDO*\n*COM AQUILO* que você *ADORA*' },
      { tipo: 'palavra', rotulo: '', texto: '[verde]*SE ADORA*[/]' },
      {
        tipo: 'pontos',
        texto: [
          '[verde]*COISAS*, se torna *IDOLATRA*[/]',
          '[verde]*DINHEIRO*, se torna *AVARENTA*[/]',
          '[verde]*DEUS*, se torna *AQUILO NASCEU SER*:[/] [vermelho]*IMAGEM* e *SEMELHANÇA*[/]',
        ].join('\n'),
      },
      { tipo: 'frase', texto: `[fundo verde]*ABRA* sua *BÍBLIA*[/]: [fundo amarelo]*${textoBase || '...'}*[/]` },
      ...agradecimentos,
    ],
    depois: depoisPadrao,
  },
  {
    id: 'autoridade',
    nome: 'Quem tem autoridade (corpo, alma e espírito)',
    resumo: 'Paz do Senhor, quem tem autoridade no ambiente, repita esse versículo',
    antes: (textoBase) => [
      { tipo: 'frase', texto: '[fundo verde]*Meus irmãos, recebam todos a PAZ DO SENHOR!!*[/]' },
      { tipo: 'frase', texto: '*JESUS* está *NESTE LUGAR*' },
      {
        tipo: 'pontos',
        texto:
          '[vermelho]*Onde estiver* 2 *ou* 3[/]\n[vermelho]*Reunidos* em *meu nome*[/]\n[vermelho]*Ali me faço presente*[/] (*Não é qualquer reunião*, *ajuntamento*)',
      },
      { tipo: 'efeito', texto: '[roxo]*QUANTOS VIERAM ADORAR?*[/]' },
      { tipo: 'frase', texto: '*APRENDI* na *BÍBLIA* que' },
      {
        tipo: 'pontos',
        texto: [
          '*Deus só vem* em *um lugar quando:*',
          '*Preparamos* o *ambiente* para Ele',
          '*A glória só desceu* depois *tabernáculo* todo *preparado*',
        ].join('\n'),
      },
      { tipo: 'frase', texto: 'Sabe *QUEM TEM AUTORIDADE* em um *AMBIENTE*?' },
      { tipo: 'pontos', texto: 'Quem é *Adorado*/ *Reverenciado* naquele *ambiente*' },
      { tipo: 'frase', texto: '*SABE POR QUE*, Deus *PEDE* para você *ADORAR*?' },
      { tipo: 'efeito', texto: '[roxo]*ADORAÇÃO DEIXA* você *PARECIDO*\n*COM AQUILO* que você *ADORA*[/]' },
      {
        tipo: 'efeito',
        texto:
          '[roxo]*SE VOCÊ ADORA*\n*COISAS* se torna *IDOLATRA*\n*DINHEIRO* se torna *AVARENTO*\n*DEUS*, se torna *AQUILO NASCEU SER*:[/] [vermelho]*IMAGEM* e *SEMELHANÇA*[/]',
      },
      {
        tipo: 'frase',
        texto: `[fundo verde]*ENQUANTO VOCÊ ABRE* sua *BÍBLIAS*[/]: [fundo amarelo]*${textoBase || '...'}*[/]`,
      },
      { tipo: 'frase', texto: '[fundo verde]*EU QUERIA*[/]' },
      {
        tipo: 'pontos',
        texto: [
          '[azul]*QUERIA TRIBUTAR*[/] [fundo laranja]*DEUS*[/][azul], *minha gratidão* pelo *privilégio estar* com irmãos, juntos *adorarmos Aquele* é *digno* toda *honra*, *glória* e *louvor*[/]',
          '[azul]*QUERIA ESTENDER* meus *AGRADECIMENTOS* ao[/] [fundo laranja]*IR. ...*[/] [azul]pelo *convite* e ao[/] [fundo laranja]*PR. ...*[/] [azul]pela *confiança*[/]',
          '[azul]*É sempre uma honra servir* a essa *casa*[/]',
        ].join('\n'),
      },
    ],
    depois: [
      { tipo: 'palavra', rotulo: '', texto: '*SE VOCÊ AMA* a *PALAVRA DE DEUS* “*REPITA ESSE VERSÍCULO*!!”' },
      { tipo: 'frase', texto: '[fundo verde]*ASSENTE-SE*[/] e [fundo verde]*DIGA AO IRMÃO*[/]:' },
      { tipo: 'palavra', rotulo: '', texto: '[roxo]*DEUS* tem uma *PALAVRA* *CORAÇÃO*[/]' },
      {
        tipo: 'aplicacao',
        texto:
          '*PARA ISSO*, eu *PRECISO*:\n*PRÓXIMOS MINUTOS*\nPara você *COMPREENDER*. (*OBJETIVO* - *EMOÇÕES*. X *INTELECTO*)',
      },
      depoisPadrao[2],
      depoisPadrao[3],
    ],
  },
];

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
// Nome do botão + TEXTO, usado nas caixas da introdução e da conclusão
export const ROTULO_TEXTO = 'Texto';

export function montarBlocos(o: OpcoesNovoSermao): BlocoInicial[] {
  const intro = opcoesIntroducao.find((i) => i.id === o.introducao)!;
  const comTexto = (b: BlocoInicial) => ({ ...b, texto: b.texto?.split(MARCA_TEXTO).join(o.textoBase || '...') });
  const capa = blocosDaCapa(o.tipoObjetivo, o.capa);
  return [
    ...capa.antes,
    {
      tipo: 'objetivo',
      rotulo: o.tipoObjetivo ? `Objetivo do sermão: ${o.tipoObjetivo}` : 'Objetivo do sermão',
      texto: o.objetivo.trim() ? `${inicioObjetivo(o.tipoObjetivo)}${o.objetivo.trim()}` : '',
      // Na capa da EBD as caixas ficam coladas no título de cima (JILDEAN, 29/10/2026)
      ...(o.tipoObjetivo === 'Aula EBD' ? { colado: true } : {}),
    },
    ...capa.depois,
    ...(o.saudacao?.antes ?? []).map(comTexto),
    {
      tipo: 'versiculo',
      rotulo: 'Texto',
      // Texto de referência já escrito à mão ("Salmos 139:6 - TAL...") entra como está
      texto: o.textoBase.includes(' - ') ? o.textoBase.trim() : o.versos ? `${o.textoBase} - ${o.versos}` : '',
      dica: o.textoBase ? `${o.textoBase} - cole ou escreva o texto` : undefined,
    },
    ...(o.saudacao?.depois ?? []).map(comTexto),
    // No corpo só entram caixas com os nomes dos botões do fim do editor (JILDEAN, 29/10/2026). Introdução e
    // conclusão continuam abrindo as suas páginas, mas a caixa aparece como TEXTO
    {
      tipo: 'introducao',
      rotulo: ROTULO_TEXTO,
      dica: o.introducaoEditada?.dica || intro.dica,
      texto: o.introducaoEditada?.texto,
    },
    ...[1, 2, 3].flatMap((n) => topico(n, o.modelo)),
    { tipo: 'conclusao', rotulo: ROTULO_TEXTO },
    { tipo: 'efeito' },
    { tipo: 'aplicacao' },
    { tipo: 'quadro', dica: 'Chamado e convite' },
    { tipo: 'quadroPerguntas', dica: 'Reflexão' },
  ];
}
