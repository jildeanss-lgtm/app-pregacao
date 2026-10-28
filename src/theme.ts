import { Platform } from 'react-native';

export const cores = {
  fundo: '#F6F5F1',
  cartao: '#FFFFFF',
  borda: '#E3E1DA',
  bordaForte: '#C9CCD1',
  texto: '#1C2430',
  textoSuave: '#5B6470',
  destaque: '#1F6F78',
  destaqueEscuro: '#174F56',
  destaqueFundo: '#EEF5F5',
  apoioFundo: '#FBF3E6',
  apoioTexto: '#6B4510',
  neutroFundo: '#F1EFE9',
  pulpitoFundo: '#12171E',
  pulpitoCartao: '#1C232C',
  pulpitoTexto: '#F2F1EC',
  pulpitoSuave: '#A9B0B9',
  pulpitoDestaque: '#7CC6CC',
  pulpitoApoio: '#E3B26A',
};

export const fonteBiblia = 'Georgia';

// Georgia não tem os acentos do grego politônico (os acentos ficavam soltos, como "προ`ς"); no navegador
// usamos fontes que têm grego e hebraico completos
export const fonteOriginal = Platform.select({
  web: '"Times New Roman", "Palatino Linotype", "Noto Serif", "SBL Greek", "Ezra SIL", serif',
  default: undefined,
});
