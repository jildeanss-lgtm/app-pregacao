// Caminho de todo sermão: primeiro a escolha do texto na Bíblia, a leitura, depois o estudo, por fim a montagem e a pregação
export type EtapaEstudo = 'leitura' | 'observacao' | 'interpretacao' | 'aplicacao';

export const etapas = [
  { id: 'biblia', nome: 'Bíblia', pergunta: 'Toque no versículo que vai estudar' },
  { id: 'leitura', nome: 'Leitura', pergunta: 'O que o texto diz?' },
  { id: 'observacao', nome: 'Observação', pergunta: 'O que eu vejo?' },
  { id: 'interpretacao', nome: 'Interpretação', pergunta: 'O que significa?' },
  { id: 'aplicacao', nome: 'Aplicação', pergunta: 'O que muda em nós?' },
  { id: 'montagem', nome: 'Montagem', pergunta: 'Como vou pregar?' },
  { id: 'pregacao', nome: 'Pregação', pergunta: '' },
] as const;

export const etapasDeEstudo = etapas.slice(1, 5).map((e) => e.id as EtapaEstudo);
export const ETAPA_BIBLIA = 0;
export const ETAPA_MONTAGEM = 5;
export const ETAPA_PREGACAO = 6;

// Sermões criados antes das etapas abrem direto na montagem
export function etapaAtual(etapa: number | undefined) {
  return etapa ?? ETAPA_MONTAGEM;
}
