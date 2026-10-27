import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { nomesBloco } from '../../data/modelos';
import { minutosEstimados, useSermao, useSermoes, type Bloco } from '../../store/sermoes';
import { cores, fonteBiblia } from '../../theme';

// Divide o sermão em telas: tudo antes do 1º tópico é a abertura,
// cada tópico leva consigo os blocos que vêm depois dele.
function dividirEmPartes(blocos: Bloco[], tituloAbertura: string) {
  const partes: { titulo: string; blocos: Bloco[] }[] = [];
  for (const b of blocos) {
    if (b.tipo === 'topico' || b.tipo === 'conclusao' || partes.length === 0) {
      const titulo = b.tipo === 'topico' ? b.texto : partes.length === 0 ? tituloAbertura : nomesBloco[b.tipo];
      partes.push({ titulo, blocos: b.tipo === 'topico' ? [] : [b] });
    } else {
      partes[partes.length - 1].blocos.push(b);
    }
  }
  return partes;
}

function relogio(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PulpitoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar } = useSermoes();
  const [indice, setIndice] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [terminando, setTerminando] = useState(false);
  const [local, setLocal] = useState('');

  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const partes = useMemo(() => dividirEmPartes(sermao?.blocos ?? [], sermao?.titulo ?? ''), [sermao?.blocos, sermao?.titulo]);

  if (!sermao) return null;

  const total = minutosEstimados(sermao);
  const parte = partes[indice];
  const progresso = Math.min(1, segundos / (total * 60));

  const encerrar = () => {
    atualizar(sermao.id, (s) => ({
      ...s,
      pregacoes: [...s.pregacoes, { data: new Date().toISOString(), local, observacoes: '' }],
    }));
    router.back();
  };

  return (
    <SafeAreaView style={estilos.tela}>
      <StatusBar style="light" />
      <View style={estilos.topo}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={estilos.sair}>
          <Text style={estilos.suave}>Sair</Text>
        </Pressable>
        <Text style={estilos.relogio} accessibilityLabel={`Tempo ${relogio(segundos)}`}>
          {relogio(segundos)}
        </Text>
        <Text style={estilos.suave}>de {total} min</Text>
      </View>
      <View style={estilos.barra}>
        <View style={[estilos.barraCheia, { width: `${progresso * 100}%` }]} />
      </View>

      {terminando ? (
        <View style={{ flex: 1, gap: 16, paddingTop: 32 }}>
          <Text style={estilos.titulo}>Encerrar e arquivar</Text>
          <Text style={estilos.suave}>Onde este sermão foi pregado?</Text>
          <TextInput
            accessibilityLabel="Local da pregação"
            value={local}
            onChangeText={setLocal}
            placeholder="Ex.: Culto de domingo"
            placeholderTextColor={cores.pulpitoSuave}
            style={estilos.entrada}
          />
          <Pressable accessibilityRole="button" onPress={encerrar} style={[estilos.botao, estilos.botaoPrincipal]}>
            <Text style={estilos.textoBotaoPrincipal}>Salvar no arquivo</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 28, gap: 20, paddingBottom: 24 }}>
          <Text style={estilos.contador}>
            PARTE {indice + 1} DE {partes.length}
          </Text>
          <Text style={estilos.titulo}>{parte?.titulo || 'Sem título'}</Text>
          {indice === 0 && sermao.textoBase ? <Text style={estilos.rotuloApoio}>{sermao.textoBase}</Text> : null}
          {parte?.blocos.map((b) =>
            b.tipo === 'versiculo' || b.tipo === 'citacao' ? (
              <View key={b.id} style={estilos.cartao}>
                <Text style={estilos.rotuloApoio}>{nomesBloco[b.tipo].toUpperCase()}</Text>
                <Text style={estilos.versiculo}>{b.texto}</Text>
              </View>
            ) : (
              <View key={b.id}>
                {nomesBloco[b.tipo] !== parte.titulo && <Text style={estilos.rotulo}>{nomesBloco[b.tipo]}</Text>}
                <Text style={estilos.corpo}>{b.texto}</Text>
              </View>
            ),
          )}
        </ScrollView>
      )}

      {!terminando && (
        <View style={estilos.rodape}>
          <Pressable
            accessibilityRole="button"
            disabled={indice === 0}
            onPress={() => setIndice((i) => i - 1)}
            style={[estilos.botao, estilos.botaoContorno, indice === 0 && { opacity: 0.4 }]}
          >
            <Text style={estilos.textoBotao}>Anterior</Text>
          </Pressable>
          {indice < partes.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIndice((i) => i + 1)}
              style={[estilos.botao, estilos.botaoPrincipal]}
            >
              <Text style={estilos.textoBotaoPrincipal}>Próximo</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setTerminando(true)}
              style={[estilos.botao, estilos.botaoPrincipal]}
            >
              <Text style={estilos.textoBotaoPrincipal}>Encerrar</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.pulpitoFundo, paddingHorizontal: 24 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  sair: { minHeight: 44, justifyContent: 'center' },
  relogio: { fontSize: 28, fontWeight: '700', color: cores.pulpitoTexto },
  suave: { fontSize: 15, color: cores.pulpitoSuave },
  barra: { height: 4, backgroundColor: '#2A323C', borderRadius: 2, marginTop: 12 },
  barraCheia: { height: 4, backgroundColor: cores.pulpitoDestaque, borderRadius: 2 },
  contador: { fontSize: 13, fontWeight: '600', letterSpacing: 1, color: cores.pulpitoDestaque },
  titulo: { fontSize: 30, fontWeight: '700', lineHeight: 38, color: cores.pulpitoTexto },
  cartao: { backgroundColor: cores.pulpitoCartao, borderRadius: 14, padding: 18, gap: 8 },
  rotuloApoio: { fontSize: 13, fontWeight: '600', color: cores.pulpitoApoio },
  versiculo: { fontFamily: fonteBiblia, fontSize: 22, lineHeight: 33, color: cores.pulpitoTexto },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.pulpitoSuave },
  corpo: { fontSize: 21, lineHeight: 32, color: '#DCDAD3' },
  rodape: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  botao: { flex: 1, minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  botaoContorno: { borderWidth: 1, borderColor: '#3A434E' },
  botaoPrincipal: { backgroundColor: cores.pulpitoDestaque },
  textoBotao: { fontSize: 16, fontWeight: '600', color: cores.pulpitoTexto },
  textoBotaoPrincipal: { fontSize: 16, fontWeight: '700', color: cores.pulpitoFundo },
  entrada: {
    fontSize: 18,
    color: cores.pulpitoTexto,
    borderWidth: 1,
    borderColor: '#3A434E',
    borderRadius: 12,
    padding: 14,
  },
});
