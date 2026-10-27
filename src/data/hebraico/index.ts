// Gerado por scripts/gerar-hebraico.mjs. Cada livro é carregado sob demanda (no navegador, um arquivo por livro).

import type { Lexico, PalavraOriginal } from '../tipos';

export const livrosAT = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'] as const;
export type CodigoLivroAT = (typeof livrosAT)[number];

export async function carregarLivroHebraico(codigo: CodigoLivroAT): Promise<PalavraOriginal[][][]> {
  switch (codigo) {
    case 'GEN':
      return (await import('./GEN.json')).default as unknown as PalavraOriginal[][][];
    case 'EXO':
      return (await import('./EXO.json')).default as unknown as PalavraOriginal[][][];
    case 'LEV':
      return (await import('./LEV.json')).default as unknown as PalavraOriginal[][][];
    case 'NUM':
      return (await import('./NUM.json')).default as unknown as PalavraOriginal[][][];
    case 'DEU':
      return (await import('./DEU.json')).default as unknown as PalavraOriginal[][][];
    case 'JOS':
      return (await import('./JOS.json')).default as unknown as PalavraOriginal[][][];
    case 'JDG':
      return (await import('./JDG.json')).default as unknown as PalavraOriginal[][][];
    case 'RUT':
      return (await import('./RUT.json')).default as unknown as PalavraOriginal[][][];
    case '1SA':
      return (await import('./1SA.json')).default as unknown as PalavraOriginal[][][];
    case '2SA':
      return (await import('./2SA.json')).default as unknown as PalavraOriginal[][][];
    case '1KI':
      return (await import('./1KI.json')).default as unknown as PalavraOriginal[][][];
    case '2KI':
      return (await import('./2KI.json')).default as unknown as PalavraOriginal[][][];
    case '1CH':
      return (await import('./1CH.json')).default as unknown as PalavraOriginal[][][];
    case '2CH':
      return (await import('./2CH.json')).default as unknown as PalavraOriginal[][][];
    case 'EZR':
      return (await import('./EZR.json')).default as unknown as PalavraOriginal[][][];
    case 'NEH':
      return (await import('./NEH.json')).default as unknown as PalavraOriginal[][][];
    case 'EST':
      return (await import('./EST.json')).default as unknown as PalavraOriginal[][][];
    case 'JOB':
      return (await import('./JOB.json')).default as unknown as PalavraOriginal[][][];
    case 'PSA':
      return (await import('./PSA.json')).default as unknown as PalavraOriginal[][][];
    case 'PRO':
      return (await import('./PRO.json')).default as unknown as PalavraOriginal[][][];
    case 'ECC':
      return (await import('./ECC.json')).default as unknown as PalavraOriginal[][][];
    case 'SNG':
      return (await import('./SNG.json')).default as unknown as PalavraOriginal[][][];
    case 'ISA':
      return (await import('./ISA.json')).default as unknown as PalavraOriginal[][][];
    case 'JER':
      return (await import('./JER.json')).default as unknown as PalavraOriginal[][][];
    case 'LAM':
      return (await import('./LAM.json')).default as unknown as PalavraOriginal[][][];
    case 'EZK':
      return (await import('./EZK.json')).default as unknown as PalavraOriginal[][][];
    case 'DAN':
      return (await import('./DAN.json')).default as unknown as PalavraOriginal[][][];
    case 'HOS':
      return (await import('./HOS.json')).default as unknown as PalavraOriginal[][][];
    case 'JOL':
      return (await import('./JOL.json')).default as unknown as PalavraOriginal[][][];
    case 'AMO':
      return (await import('./AMO.json')).default as unknown as PalavraOriginal[][][];
    case 'OBA':
      return (await import('./OBA.json')).default as unknown as PalavraOriginal[][][];
    case 'JON':
      return (await import('./JON.json')).default as unknown as PalavraOriginal[][][];
    case 'MIC':
      return (await import('./MIC.json')).default as unknown as PalavraOriginal[][][];
    case 'NAM':
      return (await import('./NAM.json')).default as unknown as PalavraOriginal[][][];
    case 'HAB':
      return (await import('./HAB.json')).default as unknown as PalavraOriginal[][][];
    case 'ZEP':
      return (await import('./ZEP.json')).default as unknown as PalavraOriginal[][][];
    case 'HAG':
      return (await import('./HAG.json')).default as unknown as PalavraOriginal[][][];
    case 'ZEC':
      return (await import('./ZEC.json')).default as unknown as PalavraOriginal[][][];
    case 'MAL':
      return (await import('./MAL.json')).default as unknown as PalavraOriginal[][][];
  }
}

export async function carregarLexicoHebraico(): Promise<Lexico> {
  return (await import('./lexico.json')).default as unknown as Lexico;
}
