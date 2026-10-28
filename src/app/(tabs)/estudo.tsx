import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AjudaIA, ChaveIA } from '../../components/AjudaIA';
import { etapasEstudar } from '../../components/BarraAbas';
import { LeitorBiblia } from '../../components/LeitorBiblia';
import { PesquisaBiblioteca } from '../../components/PesquisaBiblioteca';
import { ResumoEstudo } from '../../components/ResumoEstudo';
import { ParteDoEstudo } from '../../components/PartesEstudo';
import { generos, sugerirGenero } from '../../data/roteiro';
import { nomesEstudo, type EtapaEstudo } from '../../data/etapas';
import { useSermoes } from '../../store/sermoes';
import { cores } from '../../theme';

type Aba = 'texto' | EtapaEstudo | 'biblioteca' | 'resumo';

function Rolagem({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

// Aba Estudar: o texto escolhido na aba Bíblia, com hebraico e grego, mais Observação, Interpretação e Aplicação
// (que a IA pode responder) e, no fim, o botão que cria o sermão
export default function EstudoAba() {
  const { estudo, mudarEstudo } = useSermoes();
  // A etapa fica no endereço (/estudo?etapa=observacao), para voltar a ela ao reabrir
  const { etapa } = useLocalSearchParams<{ etapa?: Aba }>();
  const aba: Aba = etapasEstudar.some((e) => e.id === etapa) ? etapa! : 'texto';
  const indice = etapasEstudar.findIndex((e) => e.id === aba);
  const atual = etapasEstudar[indice];
  const proxima = etapasEstudar[indice + 1];
  const irPara = (id: Aba) => router.setParams({ etapa: id });
  const avancar = () => (proxima ? irPara(proxima.id) : router.push('/novo'));
  const textoProximo = proxima ? `Próximo: ${proxima.titulo}` : 'Criar sermão';
  const insets = useSafeAreaInsets();
  const genero = estudo.textoBase
    ? generos.find((g) => g.id === (estudo.genero ?? sugerirGenero(estudo.textoBase)))?.nome
    : undefined;

  return (
    <View style={{ flex: 1 }}>
      {/* Cabeçalho: o nome da etapa em destaque e o caminho das 6 etapas, em ordem */}
      <View style={[estilos.cabecalho, { paddingTop: insets.top + 14 }]}>
        <Text style={estilos.referencia} numberOfLines={1}>
          {estudo.textoBase || 'Escolha um texto na Bíblia'}
          {genero ? ` · ${genero}` : ''}
        </Text>
        <View style={estilos.trilha}>
          {etapasEstudar.map((e, i) => (
            <View key={e.id} style={[estilos.passoTrilha, i === 0 && { flex: 0 }]}>
              {i > 0 && <View style={[estilos.linhaTrilha, i <= indice && estilos.linhaFeita]} />}
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={e.titulo}
                accessibilityState={{ selected: i === indice }}
                onPress={() => irPara(e.id)}
                style={[estilos.bolinha, i < indice && estilos.bolinhaFeita, i === indice && estilos.bolinhaAtual]}
              >
                <Text style={[estilos.numeroBolinha, i <= indice && { color: '#FFFFFF' }]}>
                  {i < indice ? '✓' : i + 1}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={estilos.capitulo}>
          <Text style={estilos.numeroGrande}>{String(indice + 1).padStart(2, '0')}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={estilos.nomeEtapa}>{atual.titulo}</Text>
            <Text style={estilos.dica}>{atual.dica}</Text>
          </View>
        </View>
      </View>

      {aba === 'texto' ? (
        <LeitorBiblia />
      ) : aba === 'biblioteca' ? (
        <Rolagem>
          <PesquisaBiblioteca estudo={estudo} mudar={mudarEstudo} />
        </Rolagem>
      ) : aba === 'resumo' ? (
        <Rolagem>
          <ResumoEstudo estudo={estudo} mudar={mudarEstudo} />
          <ChaveIA />
        </Rolagem>
      ) : (
        <Rolagem>
          <AjudaIA estudo={estudo} mudar={mudarEstudo} />
          <ParteDoEstudo sermao={estudo} mudar={mudarEstudo} parte={aba} nome={nomesEstudo[aba]} />
          <ChaveIA />
        </Rolagem>
      )}

      {/* Botão flutuante que leva à próxima etapa; na última, cria o sermão */}
      {
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textoProximo}
          onPress={avancar}
          style={estilos.flutuante}
        >
          <Text style={estilos.textoFlutuante}>{proxima ? proxima.titulo : 'Criar sermão'} →</Text>
        </Pressable>
      }
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    backgroundColor: cores.cartao,
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  referencia: { fontSize: 13, fontWeight: '600', color: cores.textoSuave },
  nomeEtapa: { fontSize: 28, fontWeight: '800', color: cores.texto, letterSpacing: -0.5 },
  dica: { fontSize: 14, color: cores.textoSuave },
  trilha: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  passoTrilha: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  linhaTrilha: { flex: 1, height: 2, backgroundColor: cores.borda },
  linhaFeita: { backgroundColor: cores.destaque },
  bolinha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolinhaFeita: { backgroundColor: '#525252', borderColor: '#525252' },
  bolinhaAtual: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  numeroBolinha: { fontSize: 12, fontWeight: '700', color: cores.textoSuave },
  capitulo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  numeroGrande: { fontSize: 64, fontWeight: '800', color: '#E5E5E5', letterSpacing: -3, lineHeight: 68 },
  flutuante: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: cores.destaque,
    borderRadius: 26,
    minHeight: 52,
    paddingHorizontal: 20,
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
  },
  textoFlutuante: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  conteudo: { padding: 20, gap: 12, paddingBottom: 96, maxWidth: 760, width: '100%', alignSelf: 'center' },
});
