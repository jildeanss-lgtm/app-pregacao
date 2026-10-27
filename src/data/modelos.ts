export type TipoBloco =
  | 'introducao'
  | 'topico'
  | 'subtopico'
  | 'frase'
  | 'pontos'
  | 'versiculo'
  | 'efeito'
  | 'pergunta'
  | 'palavra'
  | 'ilustracao'
  | 'aplicacao'
  | 'citacao'
  | 'conclusao'
  | 'apelo';

export const nomesBloco: Record<TipoBloco, string> = {
  introducao: 'Introdução',
  topico: 'Tópico',
  subtopico: 'Subtópico',
  frase: 'Frase',
  pontos: 'Pontos',
  versiculo: 'Texto bíblico',
  efeito: 'Frase de efeito',
  pergunta: 'Pergunta',
  palavra: 'Palavra no original',
  ilustracao: 'Ilustração',
  aplicacao: 'Aplicação',
  citacao: 'Citação',
  conclusao: 'Conclusão',
  apelo: 'Apelo',
};

export type Modelo = 'expositivo' | 'tematico' | 'textual';

export const modelos: { id: Modelo; nome: string; descricao: string; blocos: TipoBloco[] }[] = [
  {
    id: 'expositivo',
    nome: 'Expositivo',
    descricao: 'Tópicos tirados da divisão natural da passagem, verso a verso.',
    blocos: [
      'introducao',
      'topico', 'versiculo', 'frase', 'pontos',
      'topico', 'versiculo', 'frase', 'efeito',
      'topico', 'versiculo', 'frase', 'pergunta',
      'conclusao', 'apelo',
    ],
  },
  {
    id: 'tematico',
    nome: 'Temático',
    descricao: 'Um tema, com textos de várias partes da Bíblia.',
    blocos: [
      'introducao', 'pergunta',
      'topico', 'frase', 'versiculo', 'pontos',
      'topico', 'frase', 'versiculo', 'efeito',
      'topico', 'frase', 'versiculo',
      'conclusao', 'apelo',
    ],
  },
  {
    id: 'textual',
    nome: 'Textual',
    descricao: 'Um tópico para cada palavra ou frase-chave de um versículo curto.',
    blocos: ['versiculo', 'introducao', 'topico', 'frase', 'pontos', 'topico', 'frase', 'efeito', 'conclusao', 'apelo'],
  },
];
