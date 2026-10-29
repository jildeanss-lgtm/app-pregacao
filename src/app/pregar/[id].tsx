import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextoFormatado } from '../../components/TextoFormatado';
import { nomesBloco } from '../../data/modelos';
import { coresPregacao, rotuloVisivel, tituloDaPagina } from '../../estilo';
import { minutosEstimados, useSermao, useSermoes, type Bloco } from '../../store/sermoes';
import { cores } from '../../theme';

// Divide o sermão em telas: tudo antes do 1º tópico é a abertura,
// cada tópico leva consigo os blocos que vêm depois dele.
function dividirEmPartes(blocos: Bloco[], tituloAbertura: string) {
  const partes: { titulo: string; topico: boolean; blocos: Bloco[] }[] = [];
  for (const b of blocos) {
    if (b.tipo === 'topico' || b.tipo === 'conclusao' || partes.length === 0) {
      const titulo = b.tipo === 'topico' ? b.texto : partes.length === 0 ? tituloAbertura : nomesBloco[b.tipo];
      partes.push({ titulo, topico: b.tipo === 'topico', blocos: b.tipo === 'topico' ? [] : [b] });
    } else {
      partes[partes.length - 1].blocos.push(b);
    }
  }
  return partes;
}

// Largura da folha A4 (210 mm) e letra do esboço, como no Google Docs
const larguraA4 = 794;
const tamanhoLetra = 15;

// Rolagem automática: velocidades em pixels da tela por segundo, da mais lenta à mais rápida
const velocidades = [8, 12, 16, 22, 30, 40, 55, 75];
const CHAVE_VELOCIDADE = 'pregar:velocidade';

// Rola a folha sozinha enquanto está ligada. Se o pregador rolar com o dedo, a rolagem continua de onde ele parou
function useRolagemAutomatica(rolagem: RefObject<ScrollViewInstance | null>) {
  const [rolando, setRolando] = useState(false);
  const [nivel, setNivel] = useState(2);
  const posicao = useRef(0);
  const alturas = useRef({ tela: 0, conteudo: 0 });

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_VELOCIDADE).then((v) => {
      if (v !== null && velocidades[Number(v)]) setNivel(Number(v));
    });
  }, []);

  useEffect(() => {
    if (!rolando) return;
    let quadro = 0;
    let antes = 0;
    const passo = (agora: number) => {
      if (antes) {
        const limite = Math.max(0, alturas.current.conteudo - alturas.current.tela);
        posicao.current = Math.min(limite, posicao.current + (velocidades[nivel] * (agora - antes)) / 1000);
        rolagem.current?.scrollTo({ y: posicao.current, animated: false });
        // No fim da folha a rolagem para sozinha
        if (posicao.current >= limite) return setRolando(false);
      }
      antes = agora;
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [rolando, nivel, rolagem]);

  const mudarVelocidade = (delta: number) =>
    setNivel((n) => {
      const novo = Math.max(0, Math.min(velocidades.length - 1, n + delta));
      AsyncStorage.setItem(CHAVE_VELOCIDADE, String(novo));
      return novo;
    });

  return {
    rolando,
    nivel,
    alternar: () => setRolando((v) => !v),
    mudarVelocidade,
    // A tela avisa onde a folha está; um salto maior que 2 px é o dedo do pregador
    aoRolar: (y: number) => {
      if (Math.abs(y - posicao.current) > 2) posicao.current = y;
    },
    medirTela: (altura: number) => (alturas.current.tela = altura),
    medirConteudo: (altura: number) => (alturas.current.conteudo = altura),
  };
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
  // A folha tem sempre a largura de um A4 (794 px) e é reduzida para caber na largura da tela, como um doc
  const largura = useWindowDimensions().width;
  const escala = Math.min(1, (largura - 16) / larguraA4);
  const [alturaFolha, setAlturaFolha] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [terminando, setTerminando] = useState(false);
  const [local, setLocal] = useState('');
  const rolagem = useRef<ScrollViewInstance>(null);
  const auto = useRolagemAutomatica(rolagem);

  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const partes = useMemo(
    () => dividirEmPartes(sermao?.blocos ?? [], sermao?.titulo ?? ''),
    [sermao?.blocos, sermao?.titulo],
  );

  if (!sermao) return null;

  const total = minutosEstimados(sermao);
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
      <StatusBar style="dark" />
      <View style={estilos.topo}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={estilos.sair}>
          <Text style={estilos.suave}>Sair</Text>
        </Pressable>
        <Text style={estilos.relogio} accessibilityLabel={`Tempo ${relogio(segundos)}`}>
          {relogio(segundos)}
        </Text>
        <Text style={estilos.suave}>de {total} min</Text>
        <Pressable accessibilityRole="button" onPress={() => setTerminando(true)} style={estilos.sair}>
          <Text style={[estilos.suave, { color: cores.destaque, fontWeight: '700' }]}>Encerrar</Text>
        </Pressable>
      </View>
      <View style={estilos.barra}>
        <View style={[estilos.barraCheia, { width: `${progresso * 100}%` }]} />
      </View>

      {terminando ? (
        <View style={{ flex: 1, gap: 16, paddingTop: 32, paddingHorizontal: 24 }}>
          <Text style={estilos.titulo}>Encerrar e arquivar</Text>
          <Text style={estilos.suave}>Onde este sermão foi pregado?</Text>
          <TextInput
            accessibilityLabel="Local da pregação"
            value={local}
            onChangeText={setLocal}
            placeholder="Ex.: Culto de domingo"
            placeholderTextColor={cores.textoSuave}
            style={estilos.entrada}
          />
          <Pressable accessibilityRole="button" onPress={encerrar} style={[estilos.botao, estilos.botaoPrincipal]}>
            <Text style={estilos.textoBotaoPrincipal}>Salvar no arquivo</Text>
          </Pressable>
        </View>
      ) : (
        // O sermão inteiro numa folha A4, como no Google Docs. No celular a folha toda é reduzida para caber na tela
        <ScrollView
          ref={rolagem}
          style={estilos.mesa}
          contentContainerStyle={estilos.mesaConteudo}
          scrollEventThrottle={16}
          onScroll={(e) => auto.aoRolar(e.nativeEvent.contentOffset.y)}
          onLayout={(e) => auto.medirTela(e.nativeEvent.layout.height)}
          onContentSizeChange={(_, altura) => auto.medirConteudo(altura)}
        >
          <View style={{ width: larguraA4 * escala, height: alturaFolha * escala }}>
            <View
              onLayout={(e) => setAlturaFolha(e.nativeEvent.layout.height)}
              style={[estilos.folha, { transform: [{ scale: escala }], transformOrigin: 'top left' }]}
            >
              <Text style={[estilos.titulo, estilos.tema]}>{sermao.titulo || 'Sem título'}</Text>
              {sermao.textoBase ? <Text style={estilos.base}>{sermao.textoBase}</Text> : null}
              {partes.map((parte, i) => (
                <View key={i} style={{ gap: 10 }}>
                  {parte.topico ? (
                    <TextoFormatado tipo="topico" texto={parte.titulo || 'Sem título'} tamanho={tamanhoLetra} />
                  ) : null}
                  {parte.blocos
                    .filter((b) => b.texto.trim())
                    .map((b) => {
                      // No púlpito a aplicação aparece sem o nome em cima, só pela cor
                      const titulo = tituloDaPagina(sermao.blocos, sermao.blocos.indexOf(b));
                      const rotulo = b.tipo === 'aplicacao' || titulo ? undefined : rotuloVisivel(b);
                      return (
                        <View key={b.id} style={{ gap: 2 }}>
                          {titulo && <TextoFormatado tipo="topico" texto={titulo} tamanho={tamanhoLetra} />}
                          {rotulo && rotulo !== parte.titulo && <Text style={estilos.rotulo}>{rotulo}</Text>}
                          <TextoFormatado
                            tipo={b.tipo}
                            texto={b.texto}
                            tamanho={tamanhoLetra}
                            semMoldura
                            setaNaMargem
                          />
                        </View>
                      );
                    })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
      {!terminando && (
        <View style={estilos.controles}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mais devagar"
            onPress={() => auto.mudarVelocidade(-1)}
            style={estilos.controle}
          >
            <Text style={estilos.textoControle}>−</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={auto.rolando ? 'Pausar rolagem' : 'Rolar sozinho'}
            onPress={auto.alternar}
            style={[estilos.controle, estilos.controlePrincipal]}
          >
            <Text style={[estilos.textoControle, { color: '#FFFFFF', fontSize: 15 }]}>
              {auto.rolando ? '❚❚ Pausar' : '▶ Rolar'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mais rápido"
            onPress={() => auto.mudarVelocidade(1)}
            style={estilos.controle}
          >
            <Text style={estilos.textoControle}>+</Text>
          </Pressable>
          <Text style={estilos.velocidade}>
            {auto.nivel + 1}/{velocidades.length}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  // Fundo claro, como papel, para as cores do esboço aparecerem iguais às do editor e do PDF
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  // Mesa cinza do Google Docs com a folha A4 (210 mm = 794 px) no meio
  mesa: { flex: 1, backgroundColor: '#F1F3F4', marginTop: 12 },
  mesaConteudo: { paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' },
  // Folha A4 com margens de 2,5 cm e altura mínima de uma página
  folha: {
    width: larguraA4,
    minHeight: 1123,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    paddingHorizontal: 72,
    paddingVertical: 72,
    gap: 18,
  },
  // Botões da rolagem automática, flutuando no canto de baixo, longe do texto
  controles: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  controle: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F1F3F4',
  },
  controlePrincipal: { backgroundColor: cores.destaque, paddingHorizontal: 16 },
  textoControle: { fontSize: 20, fontWeight: '700', color: cores.texto },
  velocidade: { fontSize: 12, color: cores.textoSuave, paddingRight: 6 },
  sair: { minHeight: 44, justifyContent: 'center' },
  relogio: { fontSize: 28, fontWeight: '700', color: cores.texto },
  suave: { fontSize: 15, color: cores.textoSuave },
  barra: { height: 4, backgroundColor: cores.borda, borderRadius: 2, marginTop: 12, marginHorizontal: 24 },
  barraCheia: { height: 4, backgroundColor: cores.destaque, borderRadius: 2 },
  titulo: { fontSize: 22, fontWeight: '700', lineHeight: 28, color: cores.texto },
  // O tema do sermão com o fundo verde dos tópicos
  tema: { alignSelf: 'flex-start', backgroundColor: coresPregacao.fundoTopico, paddingHorizontal: 6 },
  base: { fontSize: 15, fontWeight: '600', color: cores.textoSuave },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.textoSuave, textTransform: 'uppercase' },
  botao: { flex: 1, minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  botaoPrincipal: { backgroundColor: cores.destaque },
  textoBotaoPrincipal: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  entrada: {
    fontSize: 18,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 12,
    padding: 14,
  },
});
