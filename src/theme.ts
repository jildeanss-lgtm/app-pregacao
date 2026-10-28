import { Platform } from 'react-native';

export const cores = {
  // Visual minimalista: tudo branco, linhas finas em cinza e quase preto como cor principal
  fundo: '#FFFFFF',
  cartao: '#FFFFFF',
  borda: '#EDEDED',
  bordaForte: '#D4D4D4',
  texto: '#171717',
  textoSuave: '#737373',
  destaque: '#171717',
  destaqueEscuro: '#0A0A0A',
  destaqueFundo: '#F5F5F5',
  apoioFundo: '#FFF8EB',
  apoioTexto: '#6B4510',
  neutroFundo: '#F5F5F5',
  pulpitoFundo: '#12171E',
  pulpitoCartao: '#1C232C',
  pulpitoTexto: '#F2F1EC',
  pulpitoSuave: '#A9B0B9',
  pulpitoDestaque: '#7CC6CC',
  pulpitoApoio: '#E3B26A',
};

// Largura máxima do conteúdo no computador, para as telas não ficarem esticadas
export const larguraConteudo = { maxWidth: 880, width: '100%', alignSelf: 'center' } as const;

export const fonteBiblia = 'Georgia';
// Fonte dos esboços (editor e púlpito): Arial, como nos documentos do Jildean
export const fonteEsboco = Platform.select({ web: 'Arial, Helvetica, sans-serif', default: undefined });

// Georgia não tem os acentos do grego politônico (os acentos ficavam soltos, como "προ`ς"); no navegador
// usamos fontes que têm grego e hebraico completos
export const fonteOriginal = Platform.select({
  web: '"Times New Roman", "Palatino Linotype", "Noto Serif", "SBL Greek", "Ezra SIL", serif',
  default: undefined,
});
