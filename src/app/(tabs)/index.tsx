import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Botao, Cartao } from '../../components/ui';
import { ETAPA_MONTAGEM, etapaAtual, etapas } from '../../data/etapas';
import { modelos } from '../../data/modelos';
import { minutosEstimados, useSermoes } from '../../store/sermoes';
import { cores } from '../../theme';

export default function SermoesTela() {
  const { sermoes, carregado } = useSermoes();

  return (
    <FlatList
      contentContainerStyle={estilos.lista}
      data={sermoes}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 8 }}>
          <Botao titulo="+ Novo sermão" onPress={() => router.push('/novo')} />
        </View>
      }
      ListEmptyComponent={
        carregado ? (
          <Text style={[estilos.suave, { textAlign: 'center', marginTop: 24 }]}>
            Nenhum sermão ainda. Toque em + Novo sermão para começar.
          </Text>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() =>
            router.push(etapaAtual(item.etapa) < ETAPA_MONTAGEM ? `/estudo/${item.id}` : `/sermao/${item.id}`)
          }>
          <Cartao style={{ marginBottom: 10 }}>
            {item.culto || item.data ? (
              <Text style={estilos.suave}>{[item.culto, item.data].filter(Boolean).join(' · ')}</Text>
            ) : null}
            <Text style={estilos.titulo}>{item.titulo || 'Sermão sem título'}</Text>
            <Text style={estilos.suave}>
              {[item.textoBase, modelos.find((m) => m.id === item.modelo)?.nome, `cerca de ${minutosEstimados(item)} min`]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {etapaAtual(item.etapa) < ETAPA_MONTAGEM && (
              <Text style={estilos.etapa}>Em estudo: {etapas[etapaAtual(item.etapa)].nome}</Text>
            )}
            {item.pregacoes.length > 0 && (
              <Text style={estilos.suave}>Pregado {item.pregacoes.length}x</Text>
            )}
          </Cartao>
        </Pressable>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 20 },
  titulo: { fontSize: 17, fontWeight: '600', color: cores.texto },
  etapa: { fontSize: 13, fontWeight: '600', color: cores.destaque, marginTop: 4 },
  suave: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
});
