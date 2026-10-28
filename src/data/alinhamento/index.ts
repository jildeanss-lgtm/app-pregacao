// Gerado por scripts/gerar-alinhamento.mjs. Para cada versículo, a posição da palavra do original ligada a cada
// palavra do português (-1 quando não há), e por Strong as traduções da Bíblia Livre e onde a palavra aparece.

// [traduções com quantas vezes, total de versículos, exemplos "LIVRO.cap.ver"]
export type Glosa = [[string, number][], number, string[]];

// Mesma divisão de palavras usada para gerar o alinhamento
export const dividirPalavras = (texto: string) => texto.split(/([\p{L}\p{M}]+)/u);

export async function carregarAlinhamento(codigo: string): Promise<number[][][] | undefined> {
  switch (codigo) {
    case 'GEN':
      return (await import('./GEN.json')).default as unknown as number[][][];
    case 'EXO':
      return (await import('./EXO.json')).default as unknown as number[][][];
    case 'LEV':
      return (await import('./LEV.json')).default as unknown as number[][][];
    case 'NUM':
      return (await import('./NUM.json')).default as unknown as number[][][];
    case 'DEU':
      return (await import('./DEU.json')).default as unknown as number[][][];
    case 'JOS':
      return (await import('./JOS.json')).default as unknown as number[][][];
    case 'JDG':
      return (await import('./JDG.json')).default as unknown as number[][][];
    case 'RUT':
      return (await import('./RUT.json')).default as unknown as number[][][];
    case '1SA':
      return (await import('./1SA.json')).default as unknown as number[][][];
    case '2SA':
      return (await import('./2SA.json')).default as unknown as number[][][];
    case '1KI':
      return (await import('./1KI.json')).default as unknown as number[][][];
    case '2KI':
      return (await import('./2KI.json')).default as unknown as number[][][];
    case '1CH':
      return (await import('./1CH.json')).default as unknown as number[][][];
    case '2CH':
      return (await import('./2CH.json')).default as unknown as number[][][];
    case 'EZR':
      return (await import('./EZR.json')).default as unknown as number[][][];
    case 'NEH':
      return (await import('./NEH.json')).default as unknown as number[][][];
    case 'EST':
      return (await import('./EST.json')).default as unknown as number[][][];
    case 'JOB':
      return (await import('./JOB.json')).default as unknown as number[][][];
    case 'PSA':
      return (await import('./PSA.json')).default as unknown as number[][][];
    case 'PRO':
      return (await import('./PRO.json')).default as unknown as number[][][];
    case 'ECC':
      return (await import('./ECC.json')).default as unknown as number[][][];
    case 'SNG':
      return (await import('./SNG.json')).default as unknown as number[][][];
    case 'ISA':
      return (await import('./ISA.json')).default as unknown as number[][][];
    case 'JER':
      return (await import('./JER.json')).default as unknown as number[][][];
    case 'LAM':
      return (await import('./LAM.json')).default as unknown as number[][][];
    case 'EZK':
      return (await import('./EZK.json')).default as unknown as number[][][];
    case 'DAN':
      return (await import('./DAN.json')).default as unknown as number[][][];
    case 'HOS':
      return (await import('./HOS.json')).default as unknown as number[][][];
    case 'JOL':
      return (await import('./JOL.json')).default as unknown as number[][][];
    case 'AMO':
      return (await import('./AMO.json')).default as unknown as number[][][];
    case 'OBA':
      return (await import('./OBA.json')).default as unknown as number[][][];
    case 'JON':
      return (await import('./JON.json')).default as unknown as number[][][];
    case 'MIC':
      return (await import('./MIC.json')).default as unknown as number[][][];
    case 'NAM':
      return (await import('./NAM.json')).default as unknown as number[][][];
    case 'HAB':
      return (await import('./HAB.json')).default as unknown as number[][][];
    case 'ZEP':
      return (await import('./ZEP.json')).default as unknown as number[][][];
    case 'HAG':
      return (await import('./HAG.json')).default as unknown as number[][][];
    case 'ZEC':
      return (await import('./ZEC.json')).default as unknown as number[][][];
    case 'MAL':
      return (await import('./MAL.json')).default as unknown as number[][][];
    case 'MAT':
      return (await import('./MAT.json')).default as unknown as number[][][];
    case 'MAR':
      return (await import('./MAR.json')).default as unknown as number[][][];
    case 'LUK':
      return (await import('./LUK.json')).default as unknown as number[][][];
    case 'JOH':
      return (await import('./JOH.json')).default as unknown as number[][][];
    case 'ACT':
      return (await import('./ACT.json')).default as unknown as number[][][];
    case 'ROM':
      return (await import('./ROM.json')).default as unknown as number[][][];
    case '1CO':
      return (await import('./1CO.json')).default as unknown as number[][][];
    case '2CO':
      return (await import('./2CO.json')).default as unknown as number[][][];
    case 'GAL':
      return (await import('./GAL.json')).default as unknown as number[][][];
    case 'EPH':
      return (await import('./EPH.json')).default as unknown as number[][][];
    case 'PHP':
      return (await import('./PHP.json')).default as unknown as number[][][];
    case 'COL':
      return (await import('./COL.json')).default as unknown as number[][][];
    case '1TH':
      return (await import('./1TH.json')).default as unknown as number[][][];
    case '2TH':
      return (await import('./2TH.json')).default as unknown as number[][][];
    case '1TI':
      return (await import('./1TI.json')).default as unknown as number[][][];
    case '2TI':
      return (await import('./2TI.json')).default as unknown as number[][][];
    case 'TIT':
      return (await import('./TIT.json')).default as unknown as number[][][];
    case 'PHM':
      return (await import('./PHM.json')).default as unknown as number[][][];
    case 'HEB':
      return (await import('./HEB.json')).default as unknown as number[][][];
    case 'JAM':
      return (await import('./JAM.json')).default as unknown as number[][][];
    case '1PE':
      return (await import('./1PE.json')).default as unknown as number[][][];
    case '2PE':
      return (await import('./2PE.json')).default as unknown as number[][][];
    case '1JO':
      return (await import('./1JO.json')).default as unknown as number[][][];
    case '2JO':
      return (await import('./2JO.json')).default as unknown as number[][][];
    case '3JO':
      return (await import('./3JO.json')).default as unknown as number[][][];
    case 'JUD':
      return (await import('./JUD.json')).default as unknown as number[][][];
    case 'REV':
      return (await import('./REV.json')).default as unknown as number[][][];
  }
  return undefined;
}

export async function carregarGlosas(lingua: 'grego' | 'hebraico'): Promise<Record<string, Glosa>> {
  return lingua === 'grego'
    ? ((await import('./glosas-grego.json')).default as unknown as Record<string, Glosa>)
    : ((await import('./glosas-hebraico.json')).default as unknown as Record<string, Glosa>);
}
