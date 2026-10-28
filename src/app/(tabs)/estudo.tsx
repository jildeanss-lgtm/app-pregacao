import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AjudaIA, ChaveIA } from '../../components/AjudaIA';
import { etapasEstudar } from '../../components/BarraAbas';
import { LeitorBiblia } from '../../components/LeitorBiblia';
import { PesquisaBiblioteca } from '../../components/PesquisaBiblioteca';
import { ResumoEstudo } from '../../components/ResumoEstudo';
import { ParteDoEstudo } from '../../components/PartesEstudo';
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
  // A etapa vem da barra de baixo (/estudo?etapa=observacao)
  const { etapa } = useLocalSearchParams<{ etapa?: Aba }>();
  const aba: Aba = etapasEstudar.some((e) => e.id === etapa) ? etapa! : 'texto';
  const numero = etapasEstudar.findIndex((e) => e.id === aba) + 1;
  const insets = useSafeAreaInsets();
  const genero = estudo.textoBase
    ? generos.find((g) => g.id === (estudo.genero ?? sugerirGenero(estudo.textoBase)))?.nome
    : undefined;

  return (
    <View style={{ flex: 1 }}>
      {/* Cabeçalho: a etapa atual e o texto em estudo em destaque; as etapas ficam na barra de baixo */}
      <View style={[estilos.cabecalho, { paddingTop: insets.top + 18 }]}>
        <Text style={estilos.sobretitulo}>
          ETAPA {numero} · {etapasEstudar[numero - 1].titulo.toUpperCase()}
        </Text>
        <View style={estilos.linhaTitulo}>
          <Text style={estilos.titulo}>{estudo.textoBase || 'Escolha um texto na Bíblia'}</Text>
        </View>
        {genero ? <Text style={estilos.subtitulo}>{genero}</Text> : null}
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
  cabecalho: { backgroundColor: cores.cartao, paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
  sobretitulo: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: cores.textoSuave },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titulo: { fontSize: 26, fontWeight: '700', color: cores.texto, flexShrink: 1 },
  subtitulo: { fontSize: 14, color: cores.textoSuave },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' },
});
