import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AjudaIA, ChaveIA } from '../../components/AjudaIA';
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
type ItemEtapa = { id: Aba; nome: string; dica: string; linha: number };
const nomesLinhas = ['Ler', 'Estudar', 'Aprofundar'];

// PRÉVIA: ?nav=a|b|c escolhe o desenho das etapas
const variante = typeof localStorage !== 'undefined' ? (localStorage.getItem('nav') ?? 'a') : 'a';

// Etapas em três linhas, na ordem do estudo: Texto; Observação, Interpretação e Aplicação juntas; Biblioteca e Resumo
function Etapas({ abas, aba, setAba }: { abas: ItemEtapa[]; aba: Aba; setAba: (a: Aba) => void }) {
  const linhas = [0, 1, 2].map((l) => abas.map((a, i) => ({ ...a, n: i + 1 })).filter((a) => a.linha === l));
  return (
    <View style={estilos.etapas}>
      {linhas.map((itens, l) => (
        <View key={l} style={variante === 'a' ? estilos.linhaA : estilos.linhaBC}>
          {variante === 'a' ? <Text style={estilos.nomeLinha}>{nomesLinhas[l]}</Text> : null}
          <View style={[variante === 'b' ? estilos.segmento : estilos.grupo]}>
            {itens.map((a) => {
              const ativa = aba === a.id;
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                  onPress={() => setAba(a.id)}
                  style={[
                    variante === 'a' && [estilos.pilula, ativa && estilos.pilulaAtiva],
                    variante === 'b' && [estilos.parte, ativa && estilos.parteAtiva],
                    variante === 'c' && [estilos.cartaoEtapa, ativa && estilos.cartaoAtivo],
                  ]}
                >
                  <Text
                    style={[
                      estilos.textoEtapa,
                      ativa && estilos.textoEtapaAtiva,
                      variante === 'a' && ativa && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {variante === 'a' ? a.nome : `${a.n}. ${a.nome}`}
                  </Text>
                  {variante === 'c' ? (
                    <Text style={estilos.dicaEtapa} numberOfLines={1}>
                      {a.dica}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// Aba Estudar: o texto escolhido na aba Bíblia, com hebraico e grego, mais Observação, Interpretação e Aplicação
// (que a IA pode responder) e, no fim, o botão que cria o sermão
export default function EstudoAba() {
  const { estudo, mudarEstudo } = useSermoes();
  const [aba, setAba] = useState<Aba>('texto');
  const insets = useSafeAreaInsets();
  const genero = estudo.textoBase
    ? generos.find((g) => g.id === (estudo.genero ?? sugerirGenero(estudo.textoBase)))?.nome
    : undefined;
  const abas: ItemEtapa[] = [
    { id: 'texto', nome: 'Texto', dica: 'Leitura e original', linha: 0 },
    { id: 'observacao', nome: nomesEstudo.observacao, dica: 'O que o texto diz', linha: 1 },
    { id: 'interpretacao', nome: nomesEstudo.interpretacao, dica: 'O que significa', linha: 1 },
    { id: 'aplicacao', nome: nomesEstudo.aplicacao, dica: 'Para a vida hoje', linha: 1 },
    { id: 'biblioteca', nome: 'Biblioteca', dica: 'Livros do Drive', linha: 2 },
    { id: 'resumo', nome: 'Resumo', dica: 'Base do sermão', linha: 2 },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Cabeçalho: o texto em estudo em destaque e as etapas numeradas logo abaixo */}
      <View style={[estilos.cabecalho, { paddingTop: insets.top + 18 }]}>
        <Text style={estilos.sobretitulo}>ESTUDO BÍBLICO</Text>
        <View style={estilos.linhaTitulo}>
          <Text style={estilos.titulo}>{estudo.textoBase || 'Escolha um texto na Bíblia'}</Text>
        </View>
        {genero ? <Text style={estilos.subtitulo}>{genero}</Text> : null}
      </View>
      <Etapas abas={abas} aba={aba} setAba={setAba} />

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
  etapas: {
    backgroundColor: cores.cartao,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  linhaA: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linhaBC: {},
  nomeLinha: {
    width: 92,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: cores.textoSuave,
    textTransform: 'uppercase',
  },
  grupo: { flex: 1, flexDirection: 'row', gap: 6 },
  pilula: {
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: cores.borda,
    justifyContent: 'center',
  },
  pilulaAtiva: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  segmento: { flexDirection: 'row', backgroundColor: cores.neutroFundo, borderRadius: 10, padding: 3, gap: 3 },
  parte: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  parteAtiva: { backgroundColor: cores.cartao, boxShadow: '0 1px 2px rgba(0,0,0,0.12)' },
  cartaoEtapa: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  cartaoAtivo: { borderColor: cores.destaque, borderWidth: 1.5 },
  textoEtapa: { fontSize: 14, fontWeight: '600', color: cores.textoSuave },
  textoEtapaAtiva: { color: cores.destaque },
  dicaEtapa: { fontSize: 11, color: cores.textoSuave },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' },
});
