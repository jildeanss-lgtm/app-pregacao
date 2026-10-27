export type TipoBloco =
  | 'introducao'
  | 'topico'
  | 'subtopico'
  | 'versiculo'
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
  versiculo: 'Versículo de apoio',
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
    blocos: ['introducao', 'topico', 'topico', 'topico', 'conclusao', 'apelo'],
  },
  {
    id: 'tematico',
    nome: 'Temático',
    descricao: 'Um tema, com textos de várias partes da Bíblia.',
    blocos: ['introducao', 'topico', 'versiculo', 'topico', 'versiculo', 'topico', 'versiculo', 'conclusao', 'apelo'],
  },
  {
    id: 'textual',
    nome: 'Textual',
    descricao: 'Um tópico para cada palavra ou frase-chave de um versículo curto.',
    blocos: ['introducao', 'topico', 'topico', 'conclusao', 'apelo'],
  },
];
