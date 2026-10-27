import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { modelos } from '../../data/modelos';
import { minutosEstimados, useSermoes } from '../../store/sermoes';
import { cores } from '../../theme';

export default function SermoesTela() {
  const { sermoes, criar, carregado } = useSermoes();
  const [escolhendo, setEscolhendo] = useState(false);

  return (
    <FlatList
      contentContainerStyle={estilos.lista}
      data={sermoes}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 8 }}>
          {escolhendo ? (
            <Cartao style={{ gap: 10 }}>
              <Rotulo>Escolha o modelo</Rotulo>
              {modelos.map((m) => (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  style={estilos.modelo}
                  onPress={() => {
                    const s = criar(m.id);
                    setEscolhendo(false);
                    router.push(`/sermao/${s.id}`);
                  }}
                >
                  <Text style={estilos.titulo}>{m.nome}</Text>
                  <Text style={estilos.suave}>{m.descricao}</Text>
                </Pressable>
              ))}
              <Botao titulo="Cancelar" variante="contorno" onPress={() => setEscolhendo(false)} />
            </Cartao>
          ) : (
            <Botao titulo="+ Novo sermão" onPress={() => setEscolhendo(true)} />
          )}
        </View>
      }
      ListEmptyComponent={
        carregado ? (
          <Text style={[estilos.suave, { textAlign: 'center', marginTop: 24 }]}>
            Nenhum sermão ainda. Comece escolhendo um modelo.
          </Text>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/sermao/${item.id}`)}>
          <Cartao style={{ marginBottom: 10 }}>
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
  modelo: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: cores.destaqueFundo,
    minHeight: 44,
  },
});
