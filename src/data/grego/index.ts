// Gerado a partir de scripts/gerar-grego.mjs. Os JSON só são carregados quando o livro é aberto.

export type PalavraGrega = [grego: string, strong: number, morfologia: string];
export type Capitulo = PalavraGrega[][];

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

export type CodigoLivro = (typeof livrosNT)[number]['codigo'];

export function carregarLivro(codigo: CodigoLivro): Capitulo[] {
  switch (codigo) {
    case 'MAT':
      return require('./MAT.json');
    case 'MAR':
      return require('./MAR.json');
    case 'LUK':
      return require('./LUK.json');
    case 'JOH':
      return require('./JOH.json');
    case 'ACT':
      return require('./ACT.json');
    case 'ROM':
      return require('./ROM.json');
    case '1CO':
      return require('./1CO.json');
    case '2CO':
      return require('./2CO.json');
    case 'GAL':
      return require('./GAL.json');
    case 'EPH':
      return require('./EPH.json');
    case 'PHP':
      return require('./PHP.json');
    case 'COL':
      return require('./COL.json');
    case '1TH':
      return require('./1TH.json');
    case '2TH':
      return require('./2TH.json');
    case '1TI':
      return require('./1TI.json');
    case '2TI':
      return require('./2TI.json');
    case 'TIT':
      return require('./TIT.json');
    case 'PHM':
      return require('./PHM.json');
    case 'HEB':
      return require('./HEB.json');
    case 'JAM':
      return require('./JAM.json');
    case '1PE':
      return require('./1PE.json');
    case '2PE':
      return require('./2PE.json');
    case '1JO':
      return require('./1JO.json');
    case '2JO':
      return require('./2JO.json');
    case '3JO':
      return require('./3JO.json');
    case 'JUD':
      return require('./JUD.json');
    case 'REV':
      return require('./REV.json');
  }
}

// Número de Strong -> [lema, transliteração, definição (inglês), tradução na KJV (inglês)]
export function carregarLexico(): Record<string, [string, string, string, string]> {
  return require('./lexico.json');
}
