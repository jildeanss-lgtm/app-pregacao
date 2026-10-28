import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../theme';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];
type Caminho = '/biblia' | '/estudo' | '/' | '/pregar';
export type EtapaEstudar = 'texto' | 'observacao' | 'interpretacao' | 'aplicacao' | 'biblioteca' | 'resumo';

// A barra de baixo segue a ordem do trabalho, da leitura ao púlpito: Bíblia, as 6 etapas do Estudar,
// Sermão e Pregar. As etapas têm número; as outras abas, ícone
const itens: { titulo: string; curto: string; caminho: Caminho; etapa?: EtapaEstudar; icone?: NomeIcone }[] = [
  { titulo: 'Bíblia', curto: 'Bíblia', caminho: '/biblia', icone: 'book-outline' },
  { titulo: 'Texto original', curto: 'Original', caminho: '/estudo', etapa: 'texto' },
  { titulo: 'Observação', curto: 'Observ.', caminho: '/estudo', etapa: 'observacao' },
  { titulo: 'Interpretação', curto: 'Interpr.', caminho: '/estudo', etapa: 'interpretacao' },
  { titulo: 'Aplicação', curto: 'Aplic.', caminho: '/estudo', etapa: 'aplicacao' },
  { titulo: 'Biblioteca', curto: 'Bibliot.', caminho: '/estudo', etapa: 'biblioteca' },
  { titulo: 'Resumo', curto: 'Resumo', caminho: '/estudo', etapa: 'resumo' },
  { titulo: 'Sermão', curto: 'Sermão', caminho: '/', icone: 'create-outline' },
  { titulo: 'Pregar', curto: 'Pregar', caminho: '/pregar', icone: 'mic-outline' },
];

export const etapasEstudar = itens.filter((i) => i.etapa).map((i) => ({ id: i.etapa!, titulo: i.titulo }));

// Usada pelas abas e também nas telas abertas por cima delas (novo sermão, sermão, biblioteca), para nunca sumir
export function BarraAbas({ atual = '/', etapa }: { atual?: Caminho; etapa?: EtapaEstudar }) {
  const largo = useWindowDimensions().width >= 700;
  const insets = useSafeAreaInsets();
  let numero = 0;
  return (
    <View style={[estilos.barra, { paddingBottom: insets.bottom }]}>
      {itens.map((a) => {
        const ativa = a.caminho === atual && (!a.etapa || a.etapa === (etapa ?? 'texto'));
        const cor = ativa ? cores.destaque : '#A3A3A3';
        if (a.etapa) numero++;
        return (
          <Pressable
            key={a.titulo}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={a.titulo}
            onPress={() =>
              a.etapa
                ? router.navigate({ pathname: '/estudo', params: { etapa: a.etapa } })
                : router.navigate(a.caminho)
            }
            style={estilos.aba}
          >
            {a.icone ? (
              <Ionicons name={a.icone} size={22} color={cor} />
            ) : (
              <View style={[estilos.numero, ativa && estilos.numeroAtivo]}>
                <Text style={[estilos.textoNumero, ativa && { color: '#FFFFFF' }]}>{numero}</Text>
              </View>
            )}
            <Text style={[estilos.texto, { color: cor }, largo && { fontSize: 12 }]} numberOfLines={1}>
              {largo ? a.titulo : a.curto}
            </Text>
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
  aba: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 1 },
  numero: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: cores.neutroFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroAtivo: { backgroundColor: cores.destaque },
  textoNumero: { fontSize: 11, fontWeight: '700', color: '#A3A3A3' },
  texto: { fontSize: 9.5, fontWeight: '600', letterSpacing: -0.2 },
});
