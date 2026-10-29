import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextoFormatado } from '../../components/TextoFormatado';
import { abreNovaPagina, coresPregacao, rotuloVisivel, tituloDaPagina } from '../../estilo';
import { minutosEstimados, useSermao, type Bloco } from '../../store/sermoes';
import { cores } from '../../theme';

// Divide o sermão nas mesmas páginas do editor e do PDF (capa, saudação, texto, introdução, cada tópico...)
function dividirEmPaginas(blocos: Bloco[]) {
  const paginas: Bloco[][] = [[]];
  blocos.forEach((b, i) => {
    if (abreNovaPagina(blocos, i)) paginas.push([]);
    if (b.texto.trim()) paginas[paginas.length - 1].push(b);
  });
  return paginas.filter((p, i) => i === 0 || p.length);
}

// Largura da folha A4 (210 mm) e letra do esboço, como no Google Docs
const larguraA4 = 794;
const tamanhoLetra = 15;

// Rolagem automática: velocidades em pixels da tela por segundo, da mais lenta à mais rápida
const velocidades = [8, 12, 16, 22, 30, 40, 55, 75];
const CHAVE_VELOCIDADE = 'pregar:velocidade';

// Espaço da mesa cinza acima da primeira folha
const margemMesa = 4;

// Rola a folha sozinha enquanto está ligada e para quando o fim da página atual aparece inteiro; um toque na folha
// leva ao começo da seguinte. Se o pregador rolar com o dedo, a rolagem continua de onde ele parou
function useRolagemAutomatica(rolagem: RefObject<ScrollViewInstance | null>, escala: number) {
  const [rolando, setRolando] = useState(false);
  // Ligada pelo pregador: ao passar de página, a rolagem continua sozinha; só "Pausar" desliga
  const ligada = useRef(false);
  // O botão mostra "Pausar" enquanto está ligada, mesmo parada no fim de uma página
  const [ligadaNaTela, setLigadaNaTela] = useState(false);
  const [nivel, setNivel] = useState(2);
  const posicao = useRef(0);
  const alturas = useRef({ tela: 0, conteudo: 0 });
  // Posição e altura de cada folha, no tamanho A4 (antes da redução para a tela)
  const folhas = useRef<{ topo: number; altura: number }[]>([]);
  const topoNaTela = (n: number) => margemMesa + (folhas.current[n]?.topo ?? 0) * escala;
  const paginaAtual = () => {
    let atual = 0;
    folhas.current.forEach((_, n) => {
      if (topoNaTela(n) <= posicao.current + margemMesa + 2) atual = n;
    });
    return atual;
  };

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
        const n = paginaAtual();
        const fimDaPagina = topoNaTela(n) + (folhas.current[n]?.altura ?? Infinity) * escala + margemMesa;
        const limite = Math.max(0, Math.min(alturas.current.conteudo, fimDaPagina) - alturas.current.tela);
        // Página que já cabe inteira na tela: fica onde está, sem voltar para cima
        if (limite <= posicao.current) return setRolando(false);
        posicao.current = Math.min(limite, posicao.current + (velocidades[nivel] * (agora - antes)) / 1000);
        rolagem.current?.scrollTo({ y: posicao.current, animated: false });
        // Quando o fim da página aparece inteiro, a rolagem para sozinha
        if (posicao.current >= limite) return setRolando(false);
      }
      antes = agora;
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolando, nivel, rolagem, escala]);

  const mudarVelocidade = (delta: number) =>
    setNivel((n) => {
      const novo = Math.max(0, Math.min(velocidades.length - 1, n + delta));
      AsyncStorage.setItem(CHAVE_VELOCIDADE, String(novo));
      return novo;
    });

  return {
    ligada: ligadaNaTela,
    nivel,
    alternar: () => {
      ligada.current = !ligada.current;
      setLigadaNaTela(ligada.current);
      setRolando(ligada.current);
    },
    mudarVelocidade,
    // A tela avisa onde a folha está; um salto maior que 2 px é o dedo do pregador
    aoRolar: (y: number) => {
      if (Math.abs(y - posicao.current) > 2) posicao.current = y;
    },
    medirTela: (altura: number) => (alturas.current.tela = altura),
    medirFolha: (n: number, topo: number, altura: number) => (folhas.current[n] = { topo, altura }),
    proximaPagina: () => {
      const n = paginaAtual() + 1;
      if (!folhas.current[n]) return;
      posicao.current = topoNaTela(n) - margemMesa;
      rolagem.current?.scrollTo({ y: posicao.current, animated: true });
      // Depois de chegar ao topo da página, volta a rolar na mesma velocidade
      if (ligada.current) {
        setRolando(false);
        setTimeout(() => {
          if (ligada.current) setRolando(true);
        }, 700);
      }
    },
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
  // A folha tem sempre a largura de um A4 (794 px) e é reduzida para caber na largura da tela, como um doc
  const largura = useWindowDimensions().width;
  const escala = Math.min(1, (largura - 2 * margemMesa) / larguraA4);
  const [alturaFolha, setAlturaFolha] = useState(0);
  const [segundos, setSegundos] = useState(0);
  // Hora do relógio, entre o cronômetro e o Rolar
  const [agora, setAgora] = useState(() => new Date());
  const rolagem = useRef<ScrollViewInstance>(null);
  const auto = useRolagemAutomatica(rolagem, escala);
  // A velocidade só aparece quando o pregador segura o botão de rolar
  const [vendoVelocidade, setVendoVelocidade] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSegundos((s) => s + 1);
      setAgora(new Date());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const paginas = useMemo(() => dividirEmPaginas(sermao?.blocos ?? []), [sermao?.blocos]);

  if (!sermao) return null;

  const total = minutosEstimados(sermao);
  const progresso = Math.min(1, segundos / (total * 60));

  return (
    <SafeAreaView style={estilos.tela}>
      <StatusBar style="dark" />
      {/* Faixa fina no topo: sair, tempo de pregação, hora e rolar. A folha fica com quase toda a tela */}
      <View style={estilos.topo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair"
          onPress={() => router.back()}
          style={estilos.sair}
        >
          <Text style={estilos.textoSair}>‹ Sair</Text>
        </Pressable>
        <Text style={estilos.relogio} accessibilityLabel={`Tempo ${relogio(segundos)} de ${total} minutos previstos`}>
          {relogio(segundos)}
          <Text style={estilos.previsto}> / {total}</Text>
        </Text>
        <Text style={estilos.hora} accessibilityLabel="Hora atual">
          {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={auto.ligada ? 'Pausar rolagem' : 'Rolar sozinho'}
          accessibilityHint="Segure para mudar a velocidade"
          onPress={auto.alternar}
          onLongPress={() => setVendoVelocidade((v) => !v)}
          style={estilos.rolar}
        >
          <Text style={estilos.textoRolar}>{auto.ligada ? '❚❚' : '▶'}</Text>
        </Pressable>
      </View>
      <View style={estilos.barra}>
        <View style={[estilos.barraCheia, { width: `${progresso * 100}%` }]} />
      </View>
      {/* O sermão inteiro numa folha A4, como no Google Docs. No celular a folha toda é reduzida para caber na tela */}
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
          {/* As folhas, uma embaixo da outra, como no Google Docs; a coluna inteira é reduzida no celular */}
          <View
            onLayout={(e) => setAlturaFolha(e.nativeEvent.layout.height)}
            style={[estilos.coluna, { transform: [{ scale: escala }], transformOrigin: 'top left' }]}
          >
            {paginas.map((pagina, n) => (
              // Um toque em qualquer parte da folha leva à próxima página
              <Pressable
                key={n}
                accessibilityHint="Toque para ir à próxima página"
                onPress={auto.proximaPagina}
                style={estilos.folha}
                onLayout={(e) => auto.medirFolha(n, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
              >
                {n === 0 && (
                  <>
                    <Text style={[estilos.titulo, estilos.tema]}>{sermao.titulo || 'Sem título'}</Text>
                    {sermao.textoBase ? <Text style={estilos.base}>{sermao.textoBase}</Text> : null}
                  </>
                )}
                {pagina.map((b) => {
                  const titulo = tituloDaPagina(sermao.blocos, sermao.blocos.indexOf(b));
                  // No púlpito a aplicação aparece sem o nome em cima, só pela cor
                  const rotulo = b.tipo === 'aplicacao' || b.tipo === 'topico' || titulo ? undefined : rotuloVisivel(b);
                  return (
                    <View key={b.id} style={{ gap: 2 }}>
                      {titulo && <TextoFormatado tipo="topico" texto={titulo} tamanho={tamanhoLetra} />}
                      {rotulo && <Text style={estilos.rotulo}>{rotulo}</Text>}
                      <TextoFormatado tipo={b.tipo} texto={b.texto} tamanho={tamanhoLetra} semMoldura setaNaMargem />
                    </View>
                  );
                })}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      {/* Velocidade da rolagem, aberta ao segurar o botão de rolar; o toque na folha passa para a próxima página */}
      {vendoVelocidade ? (
        <View style={estilos.controles}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mais devagar"
            onPress={() => auto.mudarVelocidade(-1)}
            style={estilos.controle}
          >
            <Text style={estilos.textoControle}>−</Text>
          </Pressable>
          <Text style={estilos.velocidade}>
            {auto.nivel + 1}/{velocidades.length}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mais rápido"
            onPress={() => auto.mudarVelocidade(1)}
            style={estilos.controle}
          >
            <Text style={estilos.textoControle}>+</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar velocidade"
            onPress={() => setVendoVelocidade(false)}
            style={estilos.controle}
          >
            <Text style={[estilos.textoControle, { fontSize: 16 }]}>✕</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  // Fundo claro, como papel, para as cores do esboço aparecerem iguais às do editor e do PDF
  tela: { flex: 1, backgroundColor: '#FFFFFF' },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  hora: { flex: 1, textAlign: 'center', fontSize: 15, color: cores.textoSuave, fontVariant: ['tabular-nums'] },
  // Mesa cinza do Google Docs com a folha A4 (210 mm = 794 px) no meio
  mesa: { flex: 1, backgroundColor: '#F1F3F4' },
  mesaConteudo: { paddingVertical: margemMesa, paddingHorizontal: margemMesa, alignItems: 'center' },
  // Folha A4 com margens de 2,5 cm e altura mínima de uma página
  coluna: { width: larguraA4, gap: 20 },
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
  rolar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.destaque,
  },
  textoRolar: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  textoControle: { fontSize: 20, fontWeight: '700', color: cores.texto },
  velocidade: { fontSize: 12, color: cores.textoSuave, paddingRight: 6 },
  sair: { minHeight: 44, justifyContent: 'center' },
  textoSair: { fontSize: 15, color: cores.textoSuave },
  relogio: { fontSize: 22, fontWeight: '800', color: cores.texto, fontVariant: ['tabular-nums'] },
  previsto: { fontSize: 13, fontWeight: '400', color: cores.textoSuave },
  barra: { height: 3, backgroundColor: cores.borda },
  barraCheia: { height: 3, backgroundColor: cores.destaque },
  titulo: { fontSize: 22, fontWeight: '700', lineHeight: 28, color: cores.texto },
  // O tema do sermão com o fundo verde dos tópicos
  tema: { alignSelf: 'flex-start', backgroundColor: coresPregacao.fundoTopico, paddingHorizontal: 6 },
  base: { fontSize: 15, fontWeight: '600', color: cores.textoSuave },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.textoSuave, textTransform: 'uppercase' },
});
