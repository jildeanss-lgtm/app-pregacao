import { router } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AjudaIA, ChaveIA } from '../../components/AjudaIA';
import { LeitorBiblia } from '../../components/LeitorBiblia';
import { PesquisaBiblioteca } from '../../components/PesquisaBiblioteca';
import { ResumoEstudo } from '../../components/ResumoEstudo';
import { ParteDoEstudo, partesDoEstudo } from '../../components/PartesEstudo';
import { generos, sugerirGenero } from '../../data/roteiro';
import { nomesEstudo, type EtapaEstudo } from '../../data/etapas';
import { Botao } from '../../components/ui';
import { useSermoes } from '../../store/sermoes';
import { cores } from '../../theme';

type Aba = 'texto' | EtapaEstudo | 'biblioteca' | 'resumo';

// Aba Estudar: o texto escolhido na aba Bíblia, com hebraico e grego, mais Observação, Interpretação e Aplicação
// (que a IA pode responder) e, no fim, o botão que cria o sermão
export default function EstudoAba() {
  const { estudo, mudarEstudo } = useSermoes();
  const [aba, setAba] = useState<Aba>('texto');
  const insets = useSafeAreaInsets();
  const genero = estudo.textoBase
    ? generos.find((g) => g.id === (estudo.genero ?? sugerirGenero(estudo.textoBase)))?.nome
    : undefined;
  const abas: { id: Aba; nome: string }[] = [
    { id: 'texto', nome: 'Texto' },
    ...partesDoEstudo.map((p) => ({ id: p, nome: nomesEstudo[p] })),
    { id: 'biblioteca', nome: 'Biblioteca' },
    { id: 'resumo', nome: 'Resumo' },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Cabeçalho: o texto em estudo em destaque e as etapas numeradas logo abaixo */}
      <View style={[estilos.cabecalho, { paddingTop: insets.top + 18 }]}>
        <Text style={estilos.sobretitulo}>ESTUDO BÍBLICO</Text>
        <View style={estilos.linhaTitulo}>
          <Ionicons name="book" size={22} color="#FFFFFF" />
          <Text style={estilos.titulo}>{estudo.textoBase || 'Escolha um texto na Bíblia'}</Text>
        </View>
        {genero ? <Text style={estilos.subtitulo}>{genero}</Text> : null}
      </View>
      <View style={estilos.etapas}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          {abas.map((a, i) => (
            <Pressable
              key={a.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === a.id }}
              onPress={() => setAba(a.id)}
              style={[estilos.etapa, aba === a.id && estilos.etapaAtiva]}
            >
              <View style={[estilos.numero, aba === a.id && estilos.numeroAtivo]}>
                <Text style={[estilos.textoNumero, aba === a.id && { color: '#FFFFFF' }]}>{i + 1}</Text>
              </View>
              <Text style={[estilos.textoEtapa, aba === a.id && estilos.textoEtapaAtiva]}>{a.nome}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {aba === 'texto' ? (
        <LeitorBiblia />
      ) : aba === 'biblioteca' ? (
        <ScrollView key={aba} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <PesquisaBiblioteca estudo={estudo} mudar={mudarEstudo} />
        </ScrollView>
      ) : aba === 'resumo' ? (
        <ScrollView key={aba} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <ResumoEstudo estudo={estudo} mudar={mudarEstudo} />
          <ChaveIA />
        </ScrollView>
      ) : (
        <ScrollView key={aba} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <AjudaIA estudo={estudo} mudar={mudarEstudo} />
          <ParteDoEstudo sermao={estudo} mudar={mudarEstudo} parte={aba} nome={nomesEstudo[aba]} />
          {aba === 'aplicacao' && estudo.textoBase ? (
            <Botao titulo="Criar sermão" onPress={() => router.push('/novo')} />
          ) : null}
          <ChaveIA />
        </ScrollView>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { backgroundColor: cores.destaque, paddingHorizontal: 20, paddingBottom: 18, gap: 4 },
  sobretitulo: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(255,255,255,0.7)' },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', flexShrink: 1 },
  subtitulo: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  etapas: { backgroundColor: cores.cartao, borderBottomWidth: 1, borderBottomColor: cores.borda },
  linha: { flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
  etapa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    minHeight: 48,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  etapaAtiva: { borderBottomColor: cores.destaque },
  numero: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: cores.neutroFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroAtivo: { backgroundColor: cores.destaque },
  textoNumero: { fontSize: 12, fontWeight: '700', color: cores.textoSuave },
  textoEtapa: { fontSize: 15, fontWeight: '600', color: cores.textoSuave },
  textoEtapaAtiva: { color: cores.destaque },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' },
});
