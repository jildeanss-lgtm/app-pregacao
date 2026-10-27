import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import type { TipoBloco } from '../data/modelos';
import { dividirDestaques, estiloBloco, linhasDoBloco } from '../estilo';
import { fonteBiblia } from '../theme';

type Props = {
  tipo: TipoBloco;
  texto: string;
  // Tamanho da letra: 16 no editor, maior no púlpito
  tamanho?: number;
};

export function TextoFormatado({ tipo, texto, tamanho = 16 }: Props) {
  const e = estiloBloco[tipo];
  const base: TextStyle = {
    color: e.cor,
    fontSize: tamanho,
    lineHeight: Math.round(tamanho * 1.45),
    fontStyle: e.italico ? 'italic' : 'normal',
    fontWeight: e.negrito ? '700' : '400',
    textAlign: e.centralizado ? 'center' : 'left',
    fontFamily: tipo === 'versiculo' || tipo === 'citacao' ? fonteBiblia : undefined,
  };

  const linha = (conteudo: string) =>
    dividirDestaques(conteudo).map((p, i) => (
      <Text key={i} style={p.chave ? estilos.chave : undefined}>
        {p.texto}
      </Text>
    ));

  if (e.lista) {
    return (
      <View style={{ gap: 2 }}>
        {linhasDoBloco(texto).map((l, i) => (
          <View key={i} style={estilos.item}>
            <Text style={[base, estilos.marcador]}>•</Text>
            <Text style={[base, { flex: 1 }]}>{linha(l)}</Text>
          </View>
        ))}
      </View>
    );
  }

  const conteudo = (
    <Text style={base}>
      {e.seta ? '➔ ' : ''}
      {linha(texto)}
    </Text>
  );

  if (e.fundo) {
    return <View style={[estilos.faixa, { backgroundColor: e.fundo }]}>{conteudo}</View>;
  }
  return conteudo;
}

const estilos = StyleSheet.create({
  chave: { fontWeight: '700', textDecorationLine: 'underline' },
  item: { flexDirection: 'row', gap: 8, paddingLeft: 8 },
  marcador: { fontStyle: 'normal' },
  faixa: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2 },
});
