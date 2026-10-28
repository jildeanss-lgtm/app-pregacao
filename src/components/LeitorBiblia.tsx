import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { carregarAlinhamento, carregarGlosas, dividirPalavras, type Glosa } from '../data/alinhamento';
import { chaveVersiculo, referenciasCruzadas } from '../data/biblia';
import { carregarLexicoGrego, carregarLivroGrego, livrosNT, type CodigoLivroNT } from '../data/grego';
import { descreverMorfologia } from '../data/grego/morfologia';
import { carregarLexicoHebraico, carregarLivroHebraico, livrosAT, type CodigoLivroAT } from '../data/hebraico';
import { descreverMorfologiaHebraica } from '../data/hebraico/morfologia';
import { carregarTexto, livros, type CodigoLivro } from '../data/portugues';
import { referenciaDoTexto } from '../data/roteiro';
import type { Lexico, PalavraOriginal } from '../data/tipos';
import { useSermao, useSermoes } from '../store/sermoes';
import { cores, fonteBiblia, fonteOriginal } from '../theme';
import { Botao, Cartao, Rotulo } from './ui';

// Palavra escolhida: o versículo, a posição da palavra no original (-1 quando a palavra do português não tem
// par) e, quando o toque foi no português, a posição da palavra tocada
type Selecao = { ver: number; original: number; portugues?: number };
type Testamento = 'AT' | 'NT';
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

async function carregarLivroCompleto(codigo: CodigoLivro, comOriginal: boolean): Promise<Livro> {
  const portugues = carregarTexto(codigo);
  if (comOriginal && (ehNT(codigo) || ehAT(codigo))) {
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

// Bíblia em português; com o original, cada palavra do português leva à palavra grega ou hebraica
export function LeitorBiblia({ comOriginal, sermaoId }: { comOriginal: boolean; sermaoId?: string }) {
  const sermao = useSermao(sermaoId);
  const { adicionarBloco } = useSermoes();
  const inicio = referenciaDoTexto(sermao?.textoBase ?? '');
  const [codigo, setCodigo] = useState<CodigoLivro>(inicio?.livro.codigo ?? 'JOH');
  const [cap, setCap] = useState(inicio?.capitulo ?? 3);
  const [testamento, setTestamento] = useState<Testamento>(livros.find((l) => l.codigo === codigo)?.testamento ?? 'NT');
  const [verAlvo, setVerAlvo] = useState<number | undefined>(inicio?.de);
  const [mostrarOriginal, setMostrarOriginal] = useState(true);
  const [dados, setDados] = useState<Livro | null>(null);
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [aviso, setAviso] = useState('');
  const lista = useRef<ComponentRef<typeof FlatList<number>>>(null);

  useEffect(() => {
    let ativo = true;
    carregarLivroCompleto(codigo, comOriginal).then((d) => {
      if (ativo) setDados(d);
    });
    return () => {
      ativo = false;
    };
  }, [codigo, comOriginal]);

  const livro = livros.find((l) => l.codigo === codigo)!;
  const carregado = dados?.codigo === codigo ? dados : null;
  const portugues = carregado?.portugues[cap - 1] ?? [];
  const original = carregado?.original[cap - 1] ?? [];
  const alinhamento = carregado?.alinhamento?.[cap - 1] ?? [];
  const hebraico = carregado?.lingua === 'hebraico';
  const totalVersiculos = Math.max(portugues.length, original.length);

  // Leva a lista até o versículo pedido (texto do sermão ou exemplo tocado)
  useEffect(() => {
    if (!carregado || !verAlvo) return;
    const t = setTimeout(() => lista.current?.scrollToIndex({ index: verAlvo - 1, animated: false }), 50);
    return () => clearTimeout(t);
  }, [carregado, verAlvo, cap]);

  const ref = (ver: number) => `${livro.nome} ${cap}:${ver}`;

  const inserir = (tipo: 'versiculo' | 'palavra', texto: string) => {
    if (!sermao) return;
    adicionarBloco(sermao.id, tipo, texto);
    setAviso(`Inserido em "${sermao.titulo || 'Sermão sem título'}"`);
  };

  const irPara = (c: CodigoLivro, capitulo: number, ver?: number) => {
    setCodigo(c);
    setCap(capitulo);
    setTestamento(livros.find((l) => l.codigo === c)!.testamento);
    setVerAlvo(ver);
    setSelecao(null);
  };

  const escolherTestamento = (t: Testamento) => {
    setTestamento(t);
    irPara(livros.find((l) => l.testamento === t)!.codigo, 1);
  };

  const palavra = selecao && selecao.original >= 0 ? original[selecao.ver - 1]?.[selecao.original] : undefined;
  const nomeLingua = hebraico ? 'hebraico' : 'grego';

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.seletores}>
        {sermao && (
          <Text style={estilos.contexto}>Estudando para: {sermao.titulo || sermao.textoBase || 'Sermão'}</Text>
        )}
        <View style={estilos.linha}>
          <Pilula texto="Antigo Testamento" ativa={testamento === 'AT'} onPress={() => escolherTestamento('AT')} />
          <Pilula texto="Novo Testamento" ativa={testamento === 'NT'} onPress={() => escolherTestamento('NT')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          {livros
            .filter((l) => l.testamento === testamento)
            .map((l) => (
              <Pilula key={l.codigo} texto={l.nome} ativa={l.codigo === codigo} onPress={() => irPara(l.codigo, 1)} />
            ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          {Array.from({ length: livro.capitulos }, (_, i) => i + 1).map((n) => (
            <Pilula
              key={n}
              texto={String(n)}
              ativa={n === cap}
              acessivel={`Capítulo ${n}`}
              onPress={() => irPara(codigo, n)}
            />
          ))}
        </ScrollView>
      </View>

      {!carregado && <ActivityIndicator style={{ marginTop: 32 }} color={cores.destaque} />}
      <FlatList
        ref={lista}
        key={`${codigo}-${cap}`}
        data={Array.from({ length: totalVersiculos }, (_, i) => i + 1)}
        keyExtractor={(ver) => String(ver)}
        contentContainerStyle={estilos.lista}
        onScrollToIndexFailed={(info) =>
          setTimeout(() => lista.current?.scrollToIndex({ index: info.index, animated: false }), 200)
        }
        ListHeaderComponent={
          <View style={{ gap: 8 }}>
            <Text style={estilos.titulo}>
              {livro.nome} {cap}
            </Text>
            {comOriginal && original.length > 0 && (
              <>
                <Text style={estilos.dica}>
                  Toque numa palavra em português para ver a palavra original no {nomeLingua}, o significado e onde mais
                  ela aparece.
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
              </>
            )}
          </View>
        }
        renderItem={({ item: ver }) => {
          const texto = portugues[ver - 1];
          const palavras = original[ver - 1];
          const ligacoes = alinhamento[ver - 1] ?? [];
          const referencias = referenciasCruzadas[chaveVersiculo(codigo, cap, ver)];
          const nesteVerso = selecao?.ver === ver;
          let n = -1;
          return (
            <Cartao style={[{ gap: 8 }, ver === verAlvo && estilos.versoAlvo]}>
              <Rotulo>{ref(ver)}</Rotulo>
              {texto ? (
                <Text style={estilos.versiculo}>
                  {comOriginal && palavras?.length
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
              ) : null}
              {comOriginal && mostrarOriginal && palavras && palavras.length > 0 && (
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
              {referencias && <Text style={estilos.dica}>Veja também: {referencias.join(', ')}</Text>}
              {sermao && (
                <Botao
                  titulo="Inserir versículo no sermão"
                  variante="contorno"
                  onPress={() => inserir('versiculo', texto ? `${ref(ver)} - ${texto}` : ref(ver))}
                />
              )}
            </Cartao>
          );
        }}
        ListFooterComponent={
          <View style={{ gap: 8, marginTop: 8 }}>
            {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
            <Text style={estilos.creditos}>
              Texto em português: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles, fevereiro de 2018,
              licença CC BY 4.0 Brasil.
              {comOriginal && hebraico
                ? ' Hebraico: Open Scriptures Hebrew Bible (Códice de Leningrado, CC BY 4.0).'
                : comOriginal && original.length > 0
                  ? ' Grego: texto bizantino de Robinson-Pierpont (domínio público).'
                  : ''}
              {comOriginal && original.length > 0
                ? ' A ligação entre o português e o original é calculada pelo app e pode errar em palavras pequenas.'
                : ''}
            </Text>
          </View>
        }
      />

      {selecao && carregado && (
        <EstudoDaPalavra
          palavra={palavra}
          lexico={carregado.lexico}
          glosas={carregado.glosas}
          hebraico={hebraico}
          referencia={ref(selecao.ver)}
          onFechar={() => setSelecao(null)}
          onIr={(r) => {
            const [c, capitulo, ver] = r.split('.');
            irPara(c as CodigoLivro, Number(capitulo), Number(ver));
          }}
          onInserir={sermao ? (texto) => inserir('palavra', texto) : undefined}
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
  referencia,
  onFechar,
  onIr,
  onInserir,
}: {
  palavra?: PalavraOriginal;
  lexico: Lexico;
  glosas: Record<string, Glosa>;
  hebraico: boolean;
  referencia: string;
  onFechar: () => void;
  onIr: (ref: string) => void;
  onInserir?: (texto: string) => void;
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
          {onInserir && (
            <Botao
              titulo="Inserir no sermão"
              onPress={() =>
                onInserir(
                  `${verbete?.[0] ?? palavra[0]} (${verbete?.[1] ?? ''}, ${prefixo}${palavra[1]}), ${referencia}: ${
                    glosa?.[0].map(([f]) => f).join(', ') ?? ''
                  }${verbete?.[2] ? `. ${verbete[2]}` : ''}`,
                )
              }
            />
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

function Pilula({
  texto,
  ativa,
  onPress,
  acessivel,
}: {
  texto: string;
  ativa: boolean;
  onPress: () => void;
  acessivel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={acessivel ?? texto}
      accessibilityState={{ selected: ativa }}
      onPress={onPress}
      style={[estilos.pilula, ativa && estilos.pilulaAtiva]}
    >
      <Text style={[estilos.textoPilula, ativa && { color: '#FFFFFF' }]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  seletores: { paddingTop: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: cores.borda, paddingBottom: 12 },
  contexto: { fontSize: 13, fontWeight: '600', color: cores.destaque, paddingHorizontal: 20 },
  linha: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  lista: { padding: 20, gap: 12, paddingBottom: 48 },
  titulo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  alternar: { minHeight: 44, justifyContent: 'center' },
  textoAlternar: { fontSize: 14, fontWeight: '600', color: cores.destaque },
  pilula: {
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    backgroundColor: cores.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilulaAtiva: { backgroundColor: cores.texto, borderColor: cores.texto },
  textoPilula: { fontSize: 14, fontWeight: '600', color: cores.texto },
  versiculo: { fontFamily: fonteBiblia, fontSize: 18, lineHeight: 28, color: cores.texto },
  versoAlvo: { borderColor: cores.destaque, borderWidth: 2 },
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
  aviso: { fontSize: 14, fontWeight: '600', color: cores.destaqueEscuro },
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
