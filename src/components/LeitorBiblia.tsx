import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { coresPregacao } from '../estilo';
import { carregarAlinhamento, carregarGlosas, dividirPalavras, type Glosa } from '../data/alinhamento';
import { carregarLexicoGrego, carregarLivroGrego, livrosNT, type CodigoLivroNT } from '../data/grego';
import { descreverMorfologia } from '../data/grego/morfologia';
import { carregarLexicoHebraico, carregarLivroHebraico, livrosAT, type CodigoLivroAT } from '../data/hebraico';
import { descreverMorfologiaHebraica } from '../data/hebraico/morfologia';
import { pericopeDe } from '../data/pericope';
import { carregarTexto, livros, type CodigoLivro } from '../data/portugues';
import { referenciaDoTexto } from '../data/roteiro';
import type { Lexico, PalavraOriginal } from '../data/tipos';
import { useSermoes } from '../store/sermoes';
import { cores, fonteBiblia, fonteOriginal } from '../theme';
import { Botao } from './ui';

// Palavra escolhida: o versículo, a posição da palavra no original (-1 quando a palavra do português não tem
// par) e, quando o toque foi no português, a posição da palavra tocada
type Selecao = { ver: number; original: number; portugues?: number };
type Livro = {
  codigo: CodigoLivro;
  portugues: string[][];
  original: PalavraOriginal[][][];
  alinhamento?: number[][][];
  lexico: Lexico;
  glosas: Record<string, Glosa>;
  lingua: 'grego' | 'hebraico';
};

const ehNT = (c: CodigoLivro): c is CodigoLivroNT => livrosNT.some((l) => l.codigo === c);
const ehAT = (c: CodigoLivro): c is CodigoLivroAT => (livrosAT as readonly string[]).includes(c);

async function carregarLivroCompleto(codigo: CodigoLivro): Promise<Livro> {
  const portugues = carregarTexto(codigo);
  if (ehNT(codigo) || ehAT(codigo)) {
    const lingua = ehNT(codigo) ? 'grego' : 'hebraico';
    const [p, original, lexico, alinhamento, glosas] = await Promise.all([
      portugues,
      ehNT(codigo) ? carregarLivroGrego(codigo) : carregarLivroHebraico(codigo as CodigoLivroAT),
      lingua === 'grego' ? carregarLexicoGrego() : carregarLexicoHebraico(),
      carregarAlinhamento(codigo),
      carregarGlosas(lingua),
    ]);
    return { codigo, portugues: p, original, lexico, alinhamento, glosas, lingua };
  }
  return { codigo, portugues: await portugues, original: [], lexico: {}, glosas: {}, lingua: 'grego' };
}

// "JOH.3.16" -> "João 3:16"
const nomeRef = (r: string) => {
  const [c, cap, ver] = r.split('.');
  return `${livros.find((l) => l.codigo === c)?.nome ?? c} ${cap}:${ver}`;
};

// Aba Estudo: o texto escolhido na aba Bíblia, dentro da sua perícope (escolhido em vermelho), com o
// hebraico ou grego embaixo. Tocar numa palavra do português leva à palavra original
export function LeitorBiblia() {
  const { estudo } = useSermoes();
  const escolhido = referenciaDoTexto(estudo.textoBase);
  // Ao tocar num exemplo, o leitor vai até aquele capítulo; "Voltar" retorna ao texto escolhido
  const [outro, setOutro] = useState<{ codigo: CodigoLivro; cap: number; ver: number }>();
  const codigo = outro?.codigo ?? escolhido?.livro.codigo;
  const cap = outro?.cap ?? escolhido?.capitulo ?? 1;
  const [mostrarOriginal, setMostrarOriginal] = useState(true);
  const [dados, setDados] = useState<Livro | null>(null);
  const [selecao, setSelecao] = useState<Selecao | null>(null);

  useEffect(() => {
    if (!codigo) return;
    let ativo = true;
    carregarLivroCompleto(codigo).then((d) => {
      if (ativo) setDados(d);
    });
    return () => {
      ativo = false;
    };
  }, [codigo]);

  if (!escolhido || !codigo) {
    return (
      <View style={estilos.vazio}>
        <Text style={estilos.corpo}>Toque num versículo na aba Bíblia para escolher o texto do estudo.</Text>
        <Botao titulo="Ir para a Bíblia" onPress={() => router.navigate('/biblia')} />
      </View>
    );
  }

  const livro = livros.find((l) => l.codigo === codigo)!;
  const carregado = dados?.codigo === codigo ? dados : null;
  const portugues = carregado?.portugues[cap - 1] ?? [];
  const original = carregado?.original[cap - 1] ?? [];
  const alinhamento = carregado?.alinhamento?.[cap - 1] ?? [];
  const hebraico = carregado?.lingua === 'hebraico';
  const total = Math.max(portugues.length, original.length);
  const de = outro ? undefined : escolhido.de;
  const ate = outro ? undefined : (escolhido.ate ?? escolhido.de);
  const pericope = de && total ? pericopeDe(codigo, cap, de, ate ?? de, total) : undefined;
  const versos = Array.from({ length: total }, (_, i) => i + 1).filter(
    (v) => !pericope || (v >= pericope.de && v <= pericope.ate),
  );

  const palavra = selecao && selecao.original >= 0 ? original[selecao.ver - 1]?.[selecao.original] : undefined;
  const nomeLingua = hebraico ? 'hebraico' : 'grego';

  return (
    <View style={{ flex: 1 }}>
      {!carregado && <ActivityIndicator style={{ marginTop: 32 }} color={cores.destaque} />}
      <ScrollView key={`${codigo}-${cap}`} contentContainerStyle={estilos.lista}>
        {outro ? (
          <Botao
            titulo={`← Voltar a ${estudo.textoBase}`}
            variante="contorno"
            onPress={() => {
              setOutro(undefined);
              setSelecao(null);
            }}
          />
        ) : null}
        <Text style={estilos.titulo}>
          {pericope ? `Perícope: ${livro.nome} ${cap}:${pericope.de}-${pericope.ate}` : `${livro.nome} ${cap}`}
        </Text>
        {original.length > 0 && (
          <View style={{ gap: 4 }}>
            <Text style={estilos.dica}>
              Toque numa palavra em português para ver a palavra original no {nomeLingua}, o significado e onde mais ela
              aparece.{pericope ? ' Em vermelho, o texto escolhido.' : ''}
            </Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: mostrarOriginal }}
              onPress={() => setMostrarOriginal((v) => !v)}
              style={estilos.alternar}
            >
              <Text style={estilos.textoAlternar}>
                {mostrarOriginal ? `Ocultar a linha em ${nomeLingua}` : `Mostrar a linha em ${nomeLingua}`}
              </Text>
            </Pressable>
          </View>
        )}
        {versos.map((ver) => {
          const texto = portugues[ver - 1];
          const palavras = original[ver - 1];
          const ligacoes = alinhamento[ver - 1] ?? [];
          const nesteVerso = selecao?.ver === ver;
          const vermelho = !!de && ver >= de && ver <= (ate ?? de);
          let n = -1;
          return (
            <View key={ver} style={[estilos.verso, ver === outro?.ver && estilos.versoAlvo]}>
              <Text style={[estilos.versiculo, vermelho && estilos.vermelho]}>
                <Text style={estilos.numero}>{ver} </Text>
                {texto && palavras?.length
                  ? dividirPalavras(texto).map((parte, i) => {
                      if (i % 2 === 0) return parte;
                      n += 1;
                      const j = n;
                      const ligada = ligacoes[j] ?? -1;
                      const ativa =
                        nesteVerso &&
                        (selecao.portugues === j || (selecao.original >= 0 && ligada === selecao.original));
                      return (
                        <Text
                          key={i}
                          accessibilityRole="button"
                          onPress={() => setSelecao({ ver, original: ligada, portugues: j })}
                          style={ativa ? estilos.palavraAtiva : undefined}
                        >
                          {parte}
                        </Text>
                      );
                    })
                  : texto}
              </Text>
              {mostrarOriginal && palavras && palavras.length > 0 && (
                <Text style={[estilos.original, hebraico && estilos.hebraico]}>
                  {palavras.map((p, i) => (
                    <Text
                      key={i}
                      onPress={() => setSelecao({ ver, original: i })}
                      style={nesteVerso && selecao.original === i ? estilos.palavraAtiva : undefined}
                    >
                      {p[0]}{' '}
                    </Text>
                  ))}
                </Text>
              )}
            </View>
          );
        })}
        <Text style={estilos.creditos}>
          Texto em português: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles, fevereiro de 2018,
          licença CC BY 4.0 Brasil.
          {hebraico
            ? ' Hebraico: Open Scriptures Hebrew Bible (Códice de Leningrado, CC BY 4.0).'
            : original.length > 0
              ? ' Grego: texto bizantino de Robinson-Pierpont (domínio público).'
              : ''}
          {original.length > 0
            ? ' A ligação entre o português e o original é calculada pelo app e pode errar em palavras pequenas.'
            : ''}
        </Text>
      </ScrollView>

      {selecao && carregado && (
        <EstudoDaPalavra
          palavra={palavra}
          lexico={carregado.lexico}
          glosas={carregado.glosas}
          hebraico={hebraico}
          onFechar={() => setSelecao(null)}
          onIr={(r) => {
            const [c, capitulo, ver] = r.split('.');
            setOutro({ codigo: c as CodigoLivro, cap: Number(capitulo), ver: Number(ver) });
            setSelecao(null);
          }}
        />
      )}
    </View>
  );
}

function EstudoDaPalavra({
  palavra,
  lexico,
  glosas,
  hebraico,
  onFechar,
  onIr,
}: {
  palavra?: PalavraOriginal;
  lexico: Lexico;
  glosas: Record<string, Glosa>;
  hebraico: boolean;
  onFechar: () => void;
  onIr: (ref: string) => void;
}) {
  const verbete = palavra ? lexico[palavra[1]] : undefined;
  const glosa = palavra ? glosas[palavra[1]] : undefined;
  const prefixo = hebraico ? 'H' : 'G';
  const exemplos = useExemplos(glosa?.[2]);

  return (
    <View style={estilos.painel}>
      <View style={estilos.painelTopo}>
        {palavra ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <Text style={estilos.lema}>{verbete?.[0] ?? palavra[0]}</Text>
            <Text style={estilos.dica}>
              {verbete?.[1]} · {prefixo}
              {palavra[1]}
            </Text>
          </View>
        ) : (
          <Text style={[estilos.corpo, { flex: 1 }]}>
            Esta palavra não tem uma palavra própria no original: é artigo, preposição ou foi acrescentada pela tradução
            para o português ficar claro.
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar estudo da palavra"
          onPress={onFechar}
          style={estilos.fechar}
        >
          <Text style={{ fontSize: 20, color: cores.textoSuave }}>×</Text>
        </Pressable>
      </View>
      {palavra && (
        <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 6 }}>
          <Text style={estilos.corpo}>
            {hebraico ? descreverMorfologiaHebraica(palavra[2]) : descreverMorfologia(palavra[2])}
          </Text>
          <Text style={estilos.dica}>Forma no texto: {palavra[0]}</Text>
          {glosa && glosa[0].length > 0 && (
            <Text style={estilos.corpo}>
              <Text style={estilos.negrito}>Traduzida na Bíblia Livre como: </Text>
              {glosa[0].map(([forma, n]) => `${forma} (${n}x)`).join(', ')}
            </Text>
          )}
          {verbete && (
            <Text style={estilos.dica}>
              Definição de Strong (inglês): {verbete[2]}
              {verbete[3] ? ` · KJV: ${verbete[3]}` : ''}
            </Text>
          )}
          {glosa && (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text style={estilos.negrito}>
                Como é usada: aparece em {glosa[1]} {glosa[1] === 1 ? 'versículo' : 'versículos'}
              </Text>
              {glosa[2].map((r) => (
                <Pressable key={r} accessibilityRole="button" onPress={() => onIr(r)}>
                  <Text style={estilos.exemplo}>
                    <Text style={estilos.refExemplo}>{nomeRef(r)} </Text>
                    {exemplos[r] ?? ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Texto em português dos versículos de exemplo, carregando só os livros necessários
function useExemplos(refs: string[] | undefined) {
  const [textos, setTextos] = useState<Record<string, string>>({});
  const chave = refs?.join(',') ?? '';
  useEffect(() => {
    if (!chave) return;
    let ativo = true;
    const lista = chave.split(',');
    const codigos = [...new Set(lista.map((r) => r.split('.')[0]))];
    Promise.all(codigos.map((c) => carregarTexto(c as CodigoLivro).then((t) => [c, t] as const))).then(
      (livrosLidos) => {
        if (!ativo) return;
        const porLivro = Object.fromEntries(livrosLidos);
        setTextos(
          Object.fromEntries(
            lista.map((r) => {
              const [c, cap, ver] = r.split('.');
              return [r, porLivro[c]?.[Number(cap) - 1]?.[Number(ver) - 1] ?? ''];
            }),
          ),
        );
      },
    );
    return () => {
      ativo = false;
    };
  }, [chave]);
  return textos;
}

const estilos = StyleSheet.create({
  lista: { padding: 20, gap: 14, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' },
  vazio: { padding: 20, gap: 12 },
  verso: { gap: 4, borderRadius: 8 },
  vermelho: { color: coresPregacao.textoBiblico },
  numero: { fontSize: 12, fontWeight: '700', color: cores.destaque },
  titulo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  alternar: { minHeight: 44, justifyContent: 'center' },
  textoAlternar: { fontSize: 14, fontWeight: '600', color: cores.destaque },
  versiculo: { fontFamily: fonteBiblia, fontSize: 18, lineHeight: 28, color: cores.texto },
  versoAlvo: { backgroundColor: '#FFF6D6', padding: 6 },
  original: { fontFamily: fonteOriginal, fontSize: 20, lineHeight: 32, color: cores.textoSuave },
  hebraico: { fontSize: 24, lineHeight: 38, writingDirection: 'rtl', textAlign: 'right' },
  palavraAtiva: { backgroundColor: '#FFE08A', color: cores.texto },
  dica: { fontSize: 13, color: cores.textoSuave },
  negrito: { fontSize: 14, fontWeight: '700', color: cores.texto },
  exemplo: { fontSize: 14, lineHeight: 20, color: cores.texto, fontFamily: fonteBiblia },
  refExemplo: { fontWeight: '700', color: cores.destaque },
  creditos: { fontSize: 12, color: cores.textoSuave, lineHeight: 18 },
  lema: { fontFamily: fonteOriginal, fontSize: 28, fontWeight: '600', color: cores.texto },
  corpo: { fontSize: 15, color: cores.texto },
  painel: {
    backgroundColor: cores.cartao,
    borderTopWidth: 2,
    borderTopColor: cores.destaque,
    padding: 16,
    gap: 6,
  },
  painelTopo: { flexDirection: 'row', alignItems: 'center' },
  fechar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
