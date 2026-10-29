import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import type { TipoBloco } from '../data/modelos';
import { destacarTudo, dividirDestaques, dividirQuadro, estiloBloco, linhasParaMostrar, escalaTopico } from '../estilo';
import { fonteEsboco } from '../theme';

type Props = {
  tipo: TipoBloco;
  texto: string;
  // Tamanho da letra: 16 no editor, maior no púlpito
  tamanho?: number;
  // No púlpito o quadro aparece sem a caixa: subtópico com ➔ e os pontos embaixo
  semMoldura?: boolean;
  // Na folha larga a seta fica na margem e o texto começa alinhado com o tópico
  setaNaMargem?: boolean;
};

export function TextoFormatado({ tipo, texto, tamanho = 16, semMoldura = false, setaNaMargem = false }: Props) {
  const e = estiloBloco[tipo];
  if (tipo === 'topico') tamanho = Math.round(tamanho * escalaTopico);
  const base: TextStyle = {
    color: e.cor,
    fontSize: tamanho,
    // Arial com espaçamento simples, como os esboços do Jildean no Google Docs
    lineHeight: Math.round(tamanho * 1.2),
    fontStyle: e.italico ? 'italic' : 'normal',
    fontWeight: e.negrito ? '700' : '400',
    textAlign: e.centralizado ? 'center' : 'left',
    fontFamily: fonteEsboco,
  };

  const larguraSeta = Math.round(tamanho * 1.2);
  const naMargem = setaNaMargem ? { marginLeft: -(larguraSeta + 8) } : null;

  const linha = (conteudo: string, corChave?: string) =>
    dividirDestaques(conteudo).map((p, i) => (
      <Text
        key={i}
        style={[
          p.chave && estilos.chave,
          p.chave && corChave ? { color: corChave } : null,
          p.marca && {
            color: p.marca.cor,
            backgroundColor: p.marca.fundo,
            fontStyle: p.marca.italico ? 'italic' : undefined,
          },
        ]}
      >
        {p.texto}
      </Text>
    ));

  if (e.quadro) {
    const { subtopico, pontos } = dividirQuadro(texto);
    // Os pontos começam embaixo da primeira letra do subtópico, depois da seta
    // A aplicação não leva seta: os pontos começam logo embaixo da frase
    const comSeta = !e.topo?.semSeta;
    const recuo = comSeta ? larguraSeta : 0;
    const topo: TextStyle = {
      color: e.topo?.cor,
      fontStyle: e.topo?.italico ? 'italic' : 'normal',
    };
    return (
      <View style={semMoldura ? { gap: 0 } : estilos.quadro}>
        {/* Sem a linha de cima (objetivos da Aula EBD, que têm o título num subtópico), só os pontos */}
        {subtopico ? (
          <View style={[estilos.item, { paddingLeft: 0 }, !semMoldura && estilos.quadroTopo, comSeta && naMargem]}>
            {comSeta && <Text style={[base, estilos.seta, { width: recuo }]}>➔</Text>}
            <Text style={[base, topo, { flex: 1 }]}>{linha(subtopico, e.topo?.corChave)}</Text>
          </View>
        ) : null}
        {pontos.map((l, i) => (
          <View
            key={i}
            style={[
              estilos.item,
              !semMoldura && estilos.quadroLinha,
              { paddingLeft: recuo + 8 + (semMoldura ? 0 : 10) },
              !semMoldura && i > 0 && estilos.divisoria,
            ]}
          >
            <Text style={[base, e.itensComoTopo && topo, estilos.marcador]}>●</Text>
            <Text style={[base, e.itensComoTopo && topo, { flex: 1 }]}>
              {linha(e.autoDestaque ? destacarTudo(l) : l, e.itensComoTopo ? e.topo?.corChave : undefined)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  const { cabecalho, linhas } = linhasParaMostrar(tipo, texto);

  if (e.lista) {
    return (
      <View style={{ gap: 2 }}>
        {linhas.map((l, i) => (
          // Mesmo recuo e mesma bolinha dos pontos do Texto (quadro)
          <View key={i} style={[estilos.item, { paddingLeft: larguraSeta + 8 }]}>
            <Text style={[base, estilos.marcador]}>●</Text>
            <Text style={[base, { flex: 1 }]}>{linha(l)}</Text>
          </View>
        ))}
      </View>
    );
  }

  // Com seta, as linhas de baixo começam embaixo da primeira letra, depois da seta
  if (e.seta) {
    return (
      <View style={[estilos.comSeta, naMargem]}>
        <Text style={[base, estilos.seta, { width: larguraSeta }]}>{e.simboloSeta ?? '➔'}</Text>
        <Text style={[base, { flex: 1 }]}>
          {/* Com fundo, a cor fica só atrás das palavras, como o realce do documento */}
          <Text style={e.fundo ? { backgroundColor: e.fundo } : undefined}>
            {linha(e.autoDestaque ? destacarTudo(linhas.join('\n')) : linhas.join('\n'))}
          </Text>
        </Text>
      </View>
    );
  }

  // Cada linha escrita fica na sua própria linha, com um respiro entre elas
  const conteudo = (
    <View style={estilos.linhas}>
      {[cabecalho, ...linhas.flatMap((l) => l.split('\n'))]
        .filter((l): l is string => l !== undefined)
        .map((l, i) => (
          // Linha em branco continua ocupando espaço, como no documento
          <Text key={i} style={base}>
            {l.trim() ? linha(l) : ' '}
          </Text>
        ))}
    </View>
  );

  if (e.fundo) {
    return <View style={[estilos.faixa, { backgroundColor: e.fundo }]}>{conteudo}</View>;
  }
  return conteudo;
}

const estilos = StyleSheet.create({
  chave: { fontWeight: '700', textDecorationLine: 'underline' },
  item: { flexDirection: 'row', gap: 8, paddingLeft: 8 },
  // As bolinhas são sempre pretas, como no documento
  marcador: { fontStyle: 'normal', color: '#000000' },
  // As setas são pretas e em negrito
  seta: { fontStyle: 'normal', fontWeight: '700', color: '#000000' },
  comSeta: { flexDirection: 'row', gap: 8 },
  linhas: { gap: 0 },
  quadro: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
    overflow: 'hidden',
  },
  quadroTopo: {
    backgroundColor: '#F1EFE9',
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderColor: '#000000',
  },
  quadroLinha: { paddingHorizontal: 10, paddingVertical: 6 },
  divisoria: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#999999',
  },
  faixa: { alignSelf: 'flex-start', paddingHorizontal: 2 },
});
