import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

const abas: { titulo: string; caminho: '/biblia' | '/estudo' | '/' | '/pregar'; icone: NomeIcone }[] = [
  { titulo: 'Bíblia', caminho: '/biblia', icone: 'book-outline' },
  { titulo: 'Estudar', caminho: '/estudo', icone: 'school-outline' },
  { titulo: 'Sermão', caminho: '/', icone: 'create-outline' },
  { titulo: 'Pregar', caminho: '/pregar', icone: 'mic-outline' },
];

// As abas de baixo também aparecem nas telas abertas por cima delas (novo sermão, sermão, biblioteca),
// para nunca sumirem. Marca a aba de onde a tela veio
export function BarraAbas({ atual = '/' }: { atual?: (typeof abas)[number]['caminho'] }) {
  return (
    <View style={estilos.barra}>
      {abas.map((a) => {
        const ativa = a.caminho === atual;
        return (
          <Pressable
            key={a.caminho}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={a.titulo}
            onPress={() => router.navigate(a.caminho)}
            style={[estilos.aba, ativa && { backgroundColor: cores.destaque }]}
          >
            <Ionicons name={a.icone} size={24} color={ativa ? '#FFFFFF' : cores.textoSuave} />
            <Text style={[estilos.texto, { color: ativa ? '#FFFFFF' : cores.textoSuave }]}>{a.titulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    height: 72,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  aba: { flex: 1, marginHorizontal: 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2 },
  texto: { fontSize: 13, fontWeight: '700' },
});
