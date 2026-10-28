import { router } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { ETAPA_MONTAGEM, ETAPA_PREGACAO, etapas } from '../data/etapas';
import { useSermoes } from '../store/sermoes';
import { cores } from '../theme';

// Barra com as etapas do sermão: Bíblia, Estudo, Sermão e Pregar
export function Etapas({ sermaoId, atual }: { sermaoId: string; atual: number }) {
  const { atualizar } = useSermoes();
  const barra = useRef<ComponentRef<typeof ScrollView>>(null);

  const ir = (indice: number) => {
    if (indice === ETAPA_PREGACAO) {
      router.push(`/pregar/${sermaoId}`);
      return;
    }
    atualizar(sermaoId, (s) => ({ ...s, etapa: indice }));
    if (indice === ETAPA_MONTAGEM) router.replace(`/sermao/${sermaoId}`);
    else router.replace(`/estudo/${sermaoId}`);
  };

  return (
    <ScrollView ref={barra} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.barra}>
      {etapas.map((e, i) => (
        <Pressable
          key={e.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === atual }}
          accessibilityLabel={`Etapa ${i + 1}: ${e.nome}`}
          onPress={() => ir(i)}
          // Deixa a etapa atual à vista quando a barra não cabe na tela
          onLayout={
            i === atual
              ? (ev) =>
                  barra.current?.scrollTo({
                    x: Math.max(0, ev.nativeEvent.layout.x - 40),
                    animated: false,
                  })
              : undefined
          }
          style={[estilos.etapa, i === atual && estilos.ativa, i < atual && estilos.feita]}
        >
          <Text style={[estilos.texto, i === atual && { color: '#FFFFFF' }]}>
            {i < atual ? '✓' : i + 1} {e.nome}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  barra: { gap: 6, paddingVertical: 2 },
  etapa: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    justifyContent: 'center',
  },
  ativa: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  feita: { borderColor: cores.destaque },
  texto: { fontSize: 14, fontWeight: '600', color: cores.texto },
});
