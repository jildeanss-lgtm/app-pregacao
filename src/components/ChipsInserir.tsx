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
  'citacao',
];

// Os tipos de bloco para inserir, com a cor de cada um: no fim do sermão e no "Inserir" de cada bloco
export function ChipsInserir({
  onEscolher,
  extras = [],
}: {
  onEscolher: (tipo: TipoBloco) => void;
  // Tipos a mais, depois das caixas do sermão
  extras?: TipoBloco[];
}) {
  return (
    <View style={estilos.linha}>
      {[...tiposParaAdicionar, ...extras].map((tipo) => {
        const e = estiloBloco[tipo];
        return (
          <Pressable
            key={tipo}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${nomesBloco[tipo]}`}
            onPress={() => onEscolher(tipo)}
            style={[estilos.chipBloco, e.fundo ? { backgroundColor: e.fundo, borderColor: e.fundo } : null]}
          >
            <Text
              style={[
                estilos.textoChip,
                { color: e.topo?.cor ?? e.cor, fontStyle: e.topo?.italico || e.italico ? 'italic' : 'normal' },
                // Texto (subtópico e pontos) em caixa alta e azul, como o Jildean pediu
                tipo === 'quadro' && { color: coresPregacao.frase, fontWeight: '800' },
              ]}
            >
              + {tipo === 'quadro' ? nomesBloco[tipo].toUpperCase() : nomesBloco[tipo]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
