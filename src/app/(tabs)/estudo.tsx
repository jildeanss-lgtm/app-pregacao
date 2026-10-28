import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AjudaIA } from '../../components/AjudaIA';
import { LeitorBiblia } from '../../components/LeitorBiblia';
import { ParteDoEstudo, Pilula, partesDoEstudo } from '../../components/PartesEstudo';
import { nomesEstudo, type EtapaEstudo } from '../../data/etapas';
import { Botao } from '../../components/ui';
import { useSermoes } from '../../store/sermoes';
import { coresPregacao } from '../../estilo';
import { cores } from '../../theme';

type Aba = 'texto' | EtapaEstudo;

// Aba Estudar: o texto escolhido na aba Bíblia, com hebraico e grego, mais Observação, Interpretação e Aplicação
// (que a IA pode responder) e, no fim, o botão que cria o sermão
export default function EstudoAba() {
  const { estudo, mudarEstudo } = useSermoes();
  const [aba, setAba] = useState<Aba>('texto');

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.topo}>
        {estudo.textoBase ? <Text style={estilos.base}>{estudo.textoBase}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          <Pilula texto="Texto (hebraico e grego)" ativa={aba === 'texto'} onPress={() => setAba('texto')} />
          {partesDoEstudo.map((p) => (
            <Pilula key={p} texto={nomesEstudo[p]} ativa={aba === p} onPress={() => setAba(p)} />
          ))}
        </ScrollView>
      </View>

      {aba === 'texto' ? (
        <LeitorBiblia />
      ) : (
        <ScrollView key={aba} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <AjudaIA estudo={estudo} mudar={mudarEstudo} />
          <ParteDoEstudo sermao={estudo} mudar={mudarEstudo} parte={aba} nome={nomesEstudo[aba]} />
          {aba === 'aplicacao' && estudo.textoBase ? (
            <Botao titulo="Criar sermão" onPress={() => router.push('/novo')} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: { paddingTop: 10, paddingBottom: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: cores.borda },
  linha: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, alignItems: 'center' },
  base: { fontSize: 18, fontWeight: '700', color: coresPregacao.textoBiblico, paddingHorizontal: 20 },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' },
});
