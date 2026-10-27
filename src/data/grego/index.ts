// Gerado por scripts/gerar-grego.mjs. Cada livro é carregado sob demanda (no navegador, um arquivo por livro).

import type { Lexico, PalavraOriginal } from '../tipos';

export const livrosNT = [
  { codigo: 'MAT', nome: 'Mateus', capitulos: 28 },
  { codigo: 'MAR', nome: 'Marcos', capitulos: 16 },
  { codigo: 'LUK', nome: 'Lucas', capitulos: 24 },
  { codigo: 'JOH', nome: 'João', capitulos: 21 },
  { codigo: 'ACT', nome: 'Atos', capitulos: 28 },
  { codigo: 'ROM', nome: 'Romanos', capitulos: 16 },
  { codigo: '1CO', nome: '1 Coríntios', capitulos: 16 },
  { codigo: '2CO', nome: '2 Coríntios', capitulos: 13 },
  { codigo: 'GAL', nome: 'Gálatas', capitulos: 6 },
  { codigo: 'EPH', nome: 'Efésios', capitulos: 6 },
  { codigo: 'PHP', nome: 'Filipenses', capitulos: 4 },
  { codigo: 'COL', nome: 'Colossenses', capitulos: 4 },
  { codigo: '1TH', nome: '1 Tessalonicenses', capitulos: 5 },
  { codigo: '2TH', nome: '2 Tessalonicenses', capitulos: 3 },
  { codigo: '1TI', nome: '1 Timóteo', capitulos: 6 },
  { codigo: '2TI', nome: '2 Timóteo', capitulos: 4 },
  { codigo: 'TIT', nome: 'Tito', capitulos: 3 },
  { codigo: 'PHM', nome: 'Filemom', capitulos: 1 },
  { codigo: 'HEB', nome: 'Hebreus', capitulos: 13 },
  { codigo: 'JAM', nome: 'Tiago', capitulos: 5 },
  { codigo: '1PE', nome: '1 Pedro', capitulos: 5 },
  { codigo: '2PE', nome: '2 Pedro', capitulos: 3 },
  { codigo: '1JO', nome: '1 João', capitulos: 5 },
  { codigo: '2JO', nome: '2 João', capitulos: 1 },
  { codigo: '3JO', nome: '3 João', capitulos: 1 },
  { codigo: 'JUD', nome: 'Judas', capitulos: 1 },
  { codigo: 'REV', nome: 'Apocalipse', capitulos: 22 },
] as const;

export type CodigoLivroNT = (typeof livrosNT)[number]['codigo'];

export async function carregarLivroGrego(codigo: CodigoLivroNT): Promise<PalavraOriginal[][][]> {
  switch (codigo) {
    case 'MAT':
      return (await import('./MAT.json')).default as unknown as PalavraOriginal[][][];
    case 'MAR':
      return (await import('./MAR.json')).default as unknown as PalavraOriginal[][][];
    case 'LUK':
      return (await import('./LUK.json')).default as unknown as PalavraOriginal[][][];
    case 'JOH':
      return (await import('./JOH.json')).default as unknown as PalavraOriginal[][][];
    case 'ACT':
      return (await import('./ACT.json')).default as unknown as PalavraOriginal[][][];
    case 'ROM':
      return (await import('./ROM.json')).default as unknown as PalavraOriginal[][][];
    case '1CO':
      return (await import('./1CO.json')).default as unknown as PalavraOriginal[][][];
    case '2CO':
      return (await import('./2CO.json')).default as unknown as PalavraOriginal[][][];
    case 'GAL':
      return (await import('./GAL.json')).default as unknown as PalavraOriginal[][][];
    case 'EPH':
      return (await import('./EPH.json')).default as unknown as PalavraOriginal[][][];
    case 'PHP':
      return (await import('./PHP.json')).default as unknown as PalavraOriginal[][][];
    case 'COL':
      return (await import('./COL.json')).default as unknown as PalavraOriginal[][][];
    case '1TH':
      return (await import('./1TH.json')).default as unknown as PalavraOriginal[][][];
    case '2TH':
      return (await import('./2TH.json')).default as unknown as PalavraOriginal[][][];
    case '1TI':
      return (await import('./1TI.json')).default as unknown as PalavraOriginal[][][];
    case '2TI':
      return (await import('./2TI.json')).default as unknown as PalavraOriginal[][][];
    case 'TIT':
      return (await import('./TIT.json')).default as unknown as PalavraOriginal[][][];
    case 'PHM':
      return (await import('./PHM.json')).default as unknown as PalavraOriginal[][][];
    case 'HEB':
      return (await import('./HEB.json')).default as unknown as PalavraOriginal[][][];
    case 'JAM':
      return (await import('./JAM.json')).default as unknown as PalavraOriginal[][][];
    case '1PE':
      return (await import('./1PE.json')).default as unknown as PalavraOriginal[][][];
    case '2PE':
      return (await import('./2PE.json')).default as unknown as PalavraOriginal[][][];
    case '1JO':
      return (await import('./1JO.json')).default as unknown as PalavraOriginal[][][];
    case '2JO':
      return (await import('./2JO.json')).default as unknown as PalavraOriginal[][][];
    case '3JO':
      return (await import('./3JO.json')).default as unknown as PalavraOriginal[][][];
    case 'JUD':
      return (await import('./JUD.json')).default as unknown as PalavraOriginal[][][];
    case 'REV':
      return (await import('./REV.json')).default as unknown as PalavraOriginal[][][];
  }
}

export async function carregarLexicoGrego(): Promise<Lexico> {
  return (await import('./lexico.json')).default as unknown as Lexico;
}
