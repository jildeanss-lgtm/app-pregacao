// Caminho de todo sermão, em quatro telas: Bíblia (escolha e leitura do texto), Estudo, Sermão e Pregar
export type EtapaEstudo = 'leitura' | 'observacao' | 'interpretacao' | 'aplicacao';

export const etapas = [
  { id: 'biblia', nome: 'Bíblia', pergunta: 'O que o texto diz?' },
  { id: 'estudo', nome: 'Estudo', pergunta: 'O que eu vejo, o que significa e o que muda em nós?' },
  { id: 'montagem', nome: 'Sermão', pergunta: 'Como vou pregar?' },
  { id: 'pregacao', nome: 'Pregar', pergunta: '' },
] as const;

// Partes do estudo, cada uma com suas perguntas e anotações
export const etapasDeEstudo: EtapaEstudo[] = ['leitura', 'observacao', 'interpretacao', 'aplicacao'];
export const nomesEstudo: Record<EtapaEstudo, string> = {
  leitura: 'Leitura',
  observacao: 'Observação',
  interpretacao: 'Interpretação',
  aplicacao: 'Aplicação',
};
export const ETAPA_BIBLIA = 0;
export const ETAPA_ESTUDO = 1;
export const ETAPA_MONTAGEM = 2;
export const ETAPA_PREGACAO = 3;

// Sermões criados antes das etapas abrem direto na montagem
export function etapaAtual(etapa: number | undefined) {
  return etapa ?? ETAPA_MONTAGEM;
}
