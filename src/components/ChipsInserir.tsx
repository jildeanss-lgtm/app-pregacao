import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nomesBloco, type TipoBloco } from '../data/modelos';
import { coresPregacao, estiloBloco } from '../estilo';
import { cores } from '../theme';

// Blocos sempre à vista para adicionar, na ordem do JILDEAN
export const tiposParaAdicionar: TipoBloco[] = [
  'topico',
  'quadro',
  'efeito',
  'versiculo',
  'quadroPerguntas',
  'aplicacao',
  'subtopico',
  'subtopicoVerde',
  'citacao',
];

// Os pontos de cada cor ficam juntos, na última linha
export const tiposPontos: TipoBloco[] = ['pontos', 'pontosRoxo', 'pontosVermelho', 'pontosAzul'];
// Nomes curtos para os quatro caberem numa linha só no celular: a cor do botão já diz qual é
const nomeCurto: Partial<Record<TipoBloco, string>> = {
  pontos: 'Pontos',
  pontosRoxo: 'Roxo',
  pontosVermelho: 'Vermelho',
  pontosAzul: 'Azul claro',
};

// Os tipos de bloco para inserir, com a cor de cada um: no fim do sermão e no "Inserir" de cada bloco
export function ChipsInserir({
  onEscolher,
  extras = [],
  sem,
}: {
  onEscolher: (tipo: TipoBloco) => void;
  // Tipos a mais, depois das caixas do sermão
  extras?: TipoBloco[];
  // Tipo que não aparece (o da própria caixa, ao mudar o tipo dela)
  sem?: TipoBloco;
}) {
  const chip = (tipo: TipoBloco, curto = false) => {
    const e = estiloBloco[tipo];
    return (
      <Pressable
        key={tipo}
        accessibilityRole="button"
        accessibilityLabel={`Adicionar ${nomesBloco[tipo]}`}
        onPress={() => onEscolher(tipo)}
        style={[
          estilos.chipBloco,
          e.fundo ? { backgroundColor: e.fundo, borderColor: e.fundo } : null,
          curto && estilos.chipCurto,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            estilos.textoChip,
            curto && estilos.textoCurto,
            { color: e.topo?.cor ?? e.cor, fontStyle: e.topo?.italico || e.italico ? 'italic' : 'normal' },
            // Texto (subtópico e pontos) em caixa alta e azul, como o Jildean pediu
            tipo === 'quadro' && { color: coresPregacao.frase, fontWeight: '800' },
          ]}
        >
          + {curto ? nomeCurto[tipo] : tipo === 'quadro' ? nomesBloco[tipo].toUpperCase() : nomesBloco[tipo]}
        </Text>
      </Pressable>
    );
  };
  const pontos = tiposPontos.filter((t) => t !== sem);
  return (
    <View style={estilos.linha}>
      {[...tiposParaAdicionar, ...extras].filter((t) => t !== sem).map((t) => chip(t))}
      {pontos.length ? <View style={estilos.linhaPontos}>{pontos.map((t) => chip(t, true))}</View> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linhaPontos: { flexDirection: 'row', gap: 6, width: '100%' },
  chipCurto: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', paddingHorizontal: 6, alignItems: 'center' },
  textoCurto: { fontSize: 13 },
  chipBloco: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    justifyContent: 'center',
  },
  textoChip: { fontSize: 15, fontWeight: '600' },
});
