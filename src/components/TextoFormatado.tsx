import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import type { TipoBloco } from '../data/modelos';
import { coresPregacao, dividirDestaques, dividirQuadro, estiloBloco, linhasDoBloco } from '../estilo';
import { fonteBiblia } from '../theme';

type Props = {
  tipo: TipoBloco;
  texto: string;
  // Tamanho da letra: 16 no editor, maior no púlpito
  tamanho?: number;
  // No púlpito o quadro aparece sem a caixa: subtópico com ➔ e os pontos embaixo
  semMoldura?: boolean;
};

export function TextoFormatado({ tipo, texto, tamanho = 16, semMoldura = false }: Props) {
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

  const linha = (conteudo: string, corChave?: string) =>
    dividirDestaques(conteudo).map((p, i) => (
      <Text key={i} style={p.chave ? [estilos.chave, corChave ? { color: corChave } : null] : undefined}>
        {p.texto}
      </Text>
    ));

  if (e.quadro) {
    const { subtopico, pontos } = dividirQuadro(texto);
    const itens: TextStyle | undefined = e.itens && { color: e.itens.cor, fontStyle: e.itens.italico ? 'italic' : 'normal' };
    return (
      <View style={semMoldura ? { gap: 2 } : estilos.quadro}>
        <View style={!semMoldura && estilos.quadroTopo}>
          <Text style={base}>➔ {linha(subtopico, coresPregacao.frase)}</Text>
        </View>
        {pontos.map((l, i) => (
          <View key={i} style={[estilos.item, !semMoldura && estilos.quadroLinha, !semMoldura && i > 0 && estilos.divisoria]}>
            <Text style={[base, itens, estilos.marcador]}>•</Text>
            <Text style={[base, itens, { flex: 1 }]}>{linha(l)}</Text>
          </View>
        ))}
      </View>
    );
  }

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
  quadro: { borderWidth: 1.5, borderColor: '#000000', borderRadius: 6, overflow: 'hidden' },
  quadroTopo: { backgroundColor: '#F1EFE9', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1.5, borderColor: '#000000' },
  quadroLinha: { paddingHorizontal: 10, paddingVertical: 6 },
  divisoria: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#999999' },
  faixa: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2 },
});
