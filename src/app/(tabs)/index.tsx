import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Botao, Cartao } from '../../components/ui';
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
        <Pressable accessibilityRole="button" onPress={() => router.push(`/sermao/${item.id}`)}>
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
  suave: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
});
