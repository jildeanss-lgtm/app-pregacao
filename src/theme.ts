import { Platform } from 'react-native';

export const cores = {
  // Visual limpo: fundo cinza bem claro, cartões brancos e um azul-marinho sóbrio como cor principal
  fundo: '#F5F6F8',
  cartao: '#FFFFFF',
  borda: '#E5E7EB',
  bordaForte: '#D1D5DB',
  texto: '#111827',
  textoSuave: '#6B7280',
  destaque: '#1E3A5F',
  destaqueEscuro: '#152A45',
  destaqueFundo: '#EEF2F7',
  apoioFundo: '#FFF8EB',
  apoioTexto: '#6B4510',
  neutroFundo: '#F3F4F6',
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
