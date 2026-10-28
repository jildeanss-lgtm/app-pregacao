import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarraAbas } from '../components/BarraAbas';
import { PesquisaBiblioteca } from '../components/PesquisaBiblioteca';
import { Cartao, Rotulo } from '../components/ui';
import { useSermoes } from '../store/sermoes';
import { cores, larguraConteudo } from '../theme';

export default function BibliotecaTela() {
  const { sermoes, estudo, mudarEstudo } = useSermoes();
  const pregados = sermoes.filter((s) => s.pregacoes.length > 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <PesquisaBiblioteca estudo={estudo} mudar={mudarEstudo} />
        <Rotulo>Sermões pregados</Rotulo>
        {pregados.length === 0 ? (
          <Text style={estilos.suave}>Os sermões aparecem aqui depois de pregados no modo púlpito.</Text>
        ) : (
          pregados.map((s) => (
            <Pressable key={s.id} accessibilityRole="button" onPress={() => router.push(`/sermao/${s.id}`)}>
              <Cartao>
                <Text style={estilos.titulo}>{s.titulo || 'Sermão sem título'}</Text>
                {s.pregacoes.map((p, i) => (
                  <Text key={i} style={estilos.suave}>
                    {new Date(p.data).toLocaleDateString('pt-BR')}
                    {p.local ? ` · ${p.local}` : ''}
                  </Text>
                ))}
              </Cartao>
            </Pressable>
          ))
        )}
      </ScrollView>
      <BarraAbas atual="/estudo" etapa="biblioteca" />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 10, paddingBottom: 48, ...larguraConteudo },
  titulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  suave: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
});
