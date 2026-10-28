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
import { Botao } from '../../components/ui';
import { useSermoes } from '../../store/sermoes';
import { cores } from '../../theme';

type Aba = 'texto' | EtapaEstudo | 'biblioteca' | 'resumo';

// PRÉVIA: localStorage "passo" = a | b | c escolhe o desenho das etapas
const variante = typeof localStorage !== 'undefined' ? (localStorage.getItem('passo') ?? 'a') : 'a';

function Rolagem({ children, fim }: { children: ReactNode; fim: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      {children}
      {fim}
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

  const botaoFim =
    variante === 'b' ? (
      <Botao
        titulo={proxima ? `Concluir ${atual.titulo} e ir para ${proxima.titulo} →` : 'Concluir e criar o sermão →'}
        onPress={avancar}
      />
    ) : null;

  return (
    <View style={{ flex: 1 }}>
      {/* Cabeçalho: o nome da etapa em destaque e o caminho das 6 etapas, em ordem */}
      <View style={[estilos.cabecalho, { paddingTop: insets.top + 14 }]}>
        <Text style={estilos.referencia} numberOfLines={1}>
          {estudo.textoBase || 'Escolha um texto na Bíblia'}
          {genero ? ` · ${genero}` : ''}
        </Text>
        {variante === 'a' && (
          <>
            <View style={estilos.progresso}>
              {etapasEstudar.map((e, i) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="tab"
                  accessibilityLabel={e.titulo}
                  accessibilityState={{ selected: i === indice }}
                  onPress={() => irPara(e.id)}
                  style={[estilos.segmento, i <= indice && estilos.segmentoFeito]}
                />
              ))}
            </View>
            <Text style={estilos.contador}>
              ETAPA {indice + 1} DE {etapasEstudar.length}
            </Text>
            <Text style={estilos.nomeEtapa}>{atual.titulo}</Text>
            <Text style={estilos.dica}>{atual.dica}</Text>
          </>
        )}
        {variante === 'b' && (
          <>
            <View style={estilos.trilha}>
              {etapasEstudar.map((e, i) => (
                <View key={e.id} style={estilos.passoTrilha}>
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
            <Text style={estilos.nomeEtapa}>{atual.titulo}</Text>
            <Text style={estilos.dica}>{atual.dica}</Text>
          </>
        )}
        {variante === 'c' && (
          <View style={estilos.capitulo}>
            <Text style={estilos.numeroGrande}>{String(indice + 1).padStart(2, '0')}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={estilos.nomeEtapa}>{atual.titulo}</Text>
              <Text style={estilos.dica}>{atual.dica}</Text>
              <View style={estilos.pontos}>
                {etapasEstudar.map((e, i) => (
                  <Pressable
                    key={e.id}
                    accessibilityRole="tab"
                    accessibilityLabel={e.titulo}
                    accessibilityState={{ selected: i === indice }}
                    onPress={() => irPara(e.id)}
                    style={[estilos.ponto, i === indice && estilos.pontoAtual]}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {aba === 'texto' ? (
        <LeitorBiblia />
      ) : aba === 'biblioteca' ? (
        <Rolagem fim={botaoFim}>
          <PesquisaBiblioteca estudo={estudo} mudar={mudarEstudo} />
        </Rolagem>
      ) : aba === 'resumo' ? (
        <Rolagem fim={botaoFim}>
          <ResumoEstudo estudo={estudo} mudar={mudarEstudo} />
          <ChaveIA />
        </Rolagem>
      ) : (
        <Rolagem fim={botaoFim}>
          <AjudaIA estudo={estudo} mudar={mudarEstudo} />
          <ParteDoEstudo sermao={estudo} mudar={mudarEstudo} parte={aba} nome={nomesEstudo[aba]} />
          <ChaveIA />
        </Rolagem>
      )}

      {/* Botão fixo embaixo (opções A e C; na B fica no fim da página, menos na leitura do texto) */}
      {variante === 'a' && (
        <View style={estilos.rodape}>
          {indice > 0 ? (
            <Botao
              titulo="←"
              variante="contorno"
              onPress={() => irPara(etapasEstudar[indice - 1].id)}
              acessivel="Etapa anterior"
            />
          ) : null}
          <Botao titulo={`${textoProximo} →`} onPress={avancar} style={{ flex: 1 }} />
        </View>
      )}
      {variante === 'b' && aba === 'texto' && (
        <View style={estilos.rodape}>
          <Botao titulo={`Concluir e ir para ${proxima?.titulo} →`} onPress={avancar} style={{ flex: 1 }} />
        </View>
      )}
      {variante === 'c' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textoProximo}
          onPress={avancar}
          style={estilos.flutuante}
        >
          <Text style={estilos.textoFlutuante}>{proxima ? proxima.titulo : 'Criar sermão'} →</Text>
        </Pressable>
      )}
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
  contador: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: cores.textoSuave, marginTop: 4 },
  progresso: { flexDirection: 'row', gap: 4, marginTop: 6 },
  segmento: { flex: 1, height: 5, borderRadius: 3, backgroundColor: cores.neutroFundo },
  segmentoFeito: { backgroundColor: cores.destaque },
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
  pontos: { flexDirection: 'row', gap: 6, marginTop: 6 },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.borda },
  pontoAtual: { width: 22, backgroundColor: cores.destaque },
  rodape: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    backgroundColor: cores.cartao,
  },
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
