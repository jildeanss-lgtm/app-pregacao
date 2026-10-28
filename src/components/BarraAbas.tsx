import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../theme';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];
type Caminho = '/biblia' | '/estudo' | '/' | '/pregar';
export type EtapaEstudar = 'texto' | 'observacao' | 'interpretacao' | 'aplicacao' | 'biblioteca' | 'resumo';

// As abas de baixo seguem a ordem do trabalho: ler a Bíblia, estudar, montar o sermão e pregar
const itens: { titulo: string; caminho: Caminho; icone: NomeIcone }[] = [
  { titulo: 'Bíblia', caminho: '/biblia', icone: 'book-outline' },
  { titulo: 'Estudar', caminho: '/estudo', icone: 'school-outline' },
  { titulo: 'Sermão', caminho: '/', icone: 'create-outline' },
  { titulo: 'Pregar', caminho: '/pregar', icone: 'mic-outline' },
];

// As 6 etapas do Estudar, em ordem, com a pergunta que cada uma responde
export const etapasEstudar: { id: EtapaEstudar; titulo: string; dica: string }[] = [
  { id: 'texto', titulo: 'Texto original', dica: 'Leia o texto e as palavras no original' },
  { id: 'observacao', titulo: 'Observação', dica: 'O que o texto diz?' },
  { id: 'interpretacao', titulo: 'Interpretação', dica: 'O que o texto significa?' },
  { id: 'aplicacao', titulo: 'Aplicação', dica: 'O que ele pede de nós hoje?' },
  { id: 'biblioteca', titulo: 'Biblioteca', dica: 'O que os seus livros dizem' },
  { id: 'resumo', titulo: 'Resumo', dica: 'Tudo junto, já em forma de sermão' },
];

// Usada pelas abas e também nas telas abertas por cima delas (novo sermão, sermão, biblioteca), para nunca sumir
export function BarraAbas({ atual = '/' }: { atual?: Caminho }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[estilos.barra, { paddingBottom: insets.bottom }]}>
      {itens.map((a) => {
        const ativa = a.caminho === atual;
        const cor = ativa ? cores.destaque : '#A3A3A3';
        return (
          <Pressable
            key={a.titulo}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={a.titulo}
            onPress={() => router.navigate(a.caminho)}
            style={estilos.aba}
          >
            <Ionicons name={a.icone} size={24} color={cor} />
            <Text style={[estilos.texto, { color: cor }]}>{a.titulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  aba: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 2 },
  texto: { fontSize: 11, fontWeight: '600' },
});
