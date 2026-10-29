import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { modelos } from '../data/modelos';
import { minutosEstimados, useSermoes, type Sermao } from '../store/sermoes';
import { cores, larguraConteudo } from '../theme';
import { ImportarSermao } from './ImportarSermao';
import { PainelNuvem } from './PainelNuvem';
import { Botao, Cartao } from './ui';

// Lista de sermões usada nas abas Estudo, Sermões e Pregar; cada aba decide o que abrir
export function ListaSermoes({
  aoAbrir,
  vazio,
  comNovo = true,
  textoNovo = '+ Novo sermão',
  extra,
  comNuvem = false,
}: {
  aoAbrir: (s: Sermao) => void;
  vazio: string;
  comNovo?: boolean;
  textoNovo?: string;
  extra?: (s: Sermao) => string | undefined;
  comNuvem?: boolean;
}) {
  const { sermoes, carregado } = useSermoes();

  return (
    <FlatList
      contentContainerStyle={estilos.lista}
      data={sermoes}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        comNovo || comNuvem ? (
          <View style={{ gap: 12, marginBottom: 8 }}>
            {comNuvem ? <PainelNuvem /> : null}
            {comNovo ? <Botao titulo={textoNovo} onPress={() => router.push('/novo')} /> : null}
            {comNuvem ? <ImportarSermao /> : null}
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        carregado ? <Text style={[estilos.suave, { textAlign: 'center', marginTop: 24 }]}>{vazio}</Text> : undefined
      }
      renderItem={({ item }) => {
        const nota = extra?.(item);
        return (
          <Pressable accessibilityRole="button" onPress={() => aoAbrir(item)}>
            <Cartao style={{ marginBottom: 10 }}>
              {item.culto || item.data ? (
                <Text style={estilos.suave}>{[item.culto, item.data].filter(Boolean).join(' · ')}</Text>
              ) : null}
              <Text style={estilos.titulo}>{item.titulo || 'Sermão sem título'}</Text>
              <Text style={estilos.suave}>
                {[
                  item.textoBase,
                  modelos.find((m) => m.id === item.modelo)?.nome,
                  `cerca de ${minutosEstimados(item)} min`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {nota ? <Text style={estilos.etapa}>{nota}</Text> : null}
              {item.pregacoes.length > 0 && <Text style={estilos.suave}>Pregado {item.pregacoes.length}x</Text>}
            </Cartao>
          </Pressable>
        );
      }}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 20, ...larguraConteudo },
  titulo: { fontSize: 17, fontWeight: '600', color: cores.texto },
  etapa: { fontSize: 13, fontWeight: '600', color: cores.destaque, marginTop: 4 },
  suave: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
});
