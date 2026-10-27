// Amostra de referências cruzadas para o protótipo. Chave: "LIVRO.capitulo.versiculo".
export const referenciasCruzadas: Record<string, string[]> = {
  'JOH.3.16': ['Romanos 5:8', '1 João 4:9-10', 'João 1:14', 'Efésios 2:8'],
  'ROM.5.8': ['João 3:16', '1 João 4:10'],
};

export const chaveVersiculo = (livro: string, cap: number, ver: number) => `${livro}.${cap}.${ver}`;
