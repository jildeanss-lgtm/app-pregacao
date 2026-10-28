import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LeitorBiblia } from '../../components/LeitorBiblia';
import { ParteDoEstudo, Pilula, partesDoEstudo } from '../../components/PartesEstudo';
import { Botao } from '../../components/ui';
import { nomesEstudo, type EtapaEstudo } from '../../data/etapas';
import { useSermoes } from '../../store/sermoes';
import { cores } from '../../theme';

type Aba = 'palavras' | EtapaEstudo;

// Aba Estudo: Bíblia com hebraico e grego (palavra por palavra) e as partes do estudo do sermão escolhido
export default function EstudoAba() {
  const params = useLocalSearchParams<{ sermao?: string }>();
  const { sermoes } = useSermoes();
  const [aba, setAba] = useState<Aba>('palavras');
  const [escolhido, setEscolhido] = useState<string>();
  const sermao = sermoes.find((s) => s.id === (escolhido ?? params.sermao)) ?? sermoes[0];

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.topo}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          <Pilula texto="Palavras (hebraico e grego)" ativa={aba === 'palavras'} onPress={() => setAba('palavras')} />
          {partesDoEstudo.map((p) => (
            <Pilula key={p} texto={nomesEstudo[p]} ativa={aba === p} onPress={() => setAba(p)} />
          ))}
        </ScrollView>
        {sermoes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
            <Text style={estilos.rotulo}>Sermão:</Text>
            {sermoes.map((s) => (
              <Pilula
                key={s.id}
                texto={s.titulo || s.textoBase || 'Sem título'}
                ativa={s.id === sermao?.id}
                onPress={() => setEscolhido(s.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {aba === 'palavras' ? (
        <LeitorBiblia key={sermao?.id ?? 'livre'} comOriginal sermaoId={sermao?.id} />
      ) : sermao ? (
        <ScrollView
          key={`${sermao.id}-${aba}`}
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={estilos.base}>{sermao.textoBase || 'Sem texto escolhido'}</Text>
          <ParteDoEstudo sermao={sermao} parte={aba} nome={nomesEstudo[aba]} />
        </ScrollView>
      ) : (
        <View style={estilos.conteudo}>
          <Text style={estilos.suave}>
            Observação, interpretação e aplicação ficam guardadas em cada sermão. Crie um para começar.
          </Text>
          <Botao titulo="+ Novo sermão" onPress={() => router.push('/novo')} />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: { paddingTop: 10, paddingBottom: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: cores.borda },
  linha: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, alignItems: 'center' },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.textoSuave },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48 },
  base: { fontSize: 20, fontWeight: '700', color: cores.texto },
  suave: { fontSize: 14, color: cores.textoSuave },
});
