import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { chaveVersiculo, referenciasCruzadas } from '../../data/biblia';
import { carregarLexicoGrego, carregarLivroGrego, livrosNT, type CodigoLivroNT } from '../../data/grego';
import { descreverMorfologia } from '../../data/grego/morfologia';
import { carregarLexicoHebraico, carregarLivroHebraico, livrosAT, type CodigoLivroAT } from '../../data/hebraico';
import { descreverMorfologiaHebraica } from '../../data/hebraico/morfologia';
import { carregarTexto, livros, type CodigoLivro } from '../../data/portugues';
import type { Lexico, PalavraOriginal } from '../../data/tipos';
import { useSermao, useSermoes } from '../../store/sermoes';
import { cores, fonteBiblia } from '../../theme';

type Selecao = { ver: number; palavra: PalavraOriginal };
type Testamento = 'AT' | 'NT';
type Livro = {
  codigo: CodigoLivro;
  portugues: string[][];
  original: PalavraOriginal[][][];
  lexico: Lexico;
  lingua: 'grego' | 'hebraico';
};

const ehNT = (c: CodigoLivro): c is CodigoLivroNT => livrosNT.some((l) => l.codigo === c);
const ehAT = (c: CodigoLivro): c is CodigoLivroAT => (livrosAT as readonly string[]).includes(c);

async function carregarLivroCompleto(codigo: CodigoLivro): Promise<Livro> {
  const portugues = carregarTexto(codigo);
  if (ehNT(codigo)) {
    const [p, original, lexico] = await Promise.all([portugues, carregarLivroGrego(codigo), carregarLexicoGrego()]);
    return { codigo, portugues: p, original, lexico, lingua: 'grego' };
  }
  if (ehAT(codigo)) {
    const [p, original, lexico] = await Promise.all([
      portugues,
      carregarLivroHebraico(codigo),
      carregarLexicoHebraico(),
    ]);
    return { codigo, portugues: p, original, lexico, lingua: 'hebraico' };
  }
  return { codigo, portugues: await portugues, original: [], lexico: {}, lingua: 'grego' };
}

export default function BibliaTela() {
  const { sermao: sermaoId } = useLocalSearchParams<{ sermao?: string }>();
  const sermao = useSermao(sermaoId);
  const { adicionarBloco } = useSermoes();
  const [testamento, setTestamento] = useState<Testamento>('NT');
  const [codigo, setCodigo] = useState<CodigoLivro>('JOH');
  const [cap, setCap] = useState(3);
  const [mostrarOriginal, setMostrarOriginal] = useState(true);
  const [dados, setDados] = useState<Livro | null>(null);
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let ativo = true;
    carregarLivroCompleto(codigo).then((d) => {
      if (ativo) setDados(d);
    });
    return () => {
      ativo = false;
    };
  }, [codigo]);

  const livro = livros.find((l) => l.codigo === codigo)!;
  const carregado = dados?.codigo === codigo ? dados : null;
  const portugues = carregado?.portugues[cap - 1] ?? [];
  const original = carregado?.original[cap - 1] ?? [];
  const hebraico = carregado?.lingua === 'hebraico';
  const totalVersiculos = Math.max(portugues.length, original.length);

  const ref = (ver: number) => `${livro.nome} ${cap}:${ver}`;

  const inserir = (tipo: 'versiculo' | 'palavra', texto: string) => {
    if (!sermao) return;
    adicionarBloco(sermao.id, tipo, texto);
    setAviso(`Inserido em "${sermao.titulo || 'Sermão sem título'}"`);
  };

  const escolherLivro = (c: CodigoLivro) => {
    setCodigo(c);
    setCap(1);
    setSelecao(null);
  };

  const escolherTestamento = (t: Testamento) => {
    setTestamento(t);
    escolherLivro(livros.find((l) => l.testamento === t)!.codigo);
  };

  const verbete = selecao ? carregado?.lexico[selecao.palavra[1]] : undefined;
  const prefixo = hebraico ? 'H' : 'G';
  const nomeLingua = hebraico ? 'hebraico' : 'grego';

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.seletores}>
        {sermao && <Text style={estilos.contexto}>Estudando para: {sermao.titulo || 'Sermão sem título'}</Text>}
        <View style={estilos.linha}>
          <Pilula texto="Antigo Testamento" ativa={testamento === 'AT'} onPress={() => escolherTestamento('AT')} />
          <Pilula texto="Novo Testamento" ativa={testamento === 'NT'} onPress={() => escolherTestamento('NT')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          {livros
            .filter((l) => l.testamento === testamento)
            .map((l) => (
              <Pilula key={l.codigo} texto={l.nome} ativa={l.codigo === codigo} onPress={() => escolherLivro(l.codigo)} />
            ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          {Array.from({ length: livro.capitulos }, (_, i) => i + 1).map((n) => (
            <Pilula
              key={n}
              texto={String(n)}
              ativa={n === cap}
              acessivel={`Capítulo ${n}`}
              onPress={() => {
                setCap(n);
                setSelecao(null);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {!carregado && <ActivityIndicator style={{ marginTop: 32 }} color={cores.destaque} />}
      <FlatList
        key={`${codigo}-${cap}`}
        data={Array.from({ length: totalVersiculos }, (_, i) => i + 1)}
        keyExtractor={(ver) => String(ver)}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View style={{ gap: 8 }}>
            <Text style={estilos.titulo}>
              {livro.nome} {cap}
            </Text>
            {original.length > 0 && (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: mostrarOriginal }}
                onPress={() => setMostrarOriginal((v) => !v)}
                style={estilos.alternar}
              >
                <Text style={estilos.textoAlternar}>
                  {mostrarOriginal
                    ? `Ocultar o ${nomeLingua}`
                    : `Mostrar o ${nomeLingua} (toque numa palavra para estudar)`}
                </Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item: ver }) => {
          const texto = portugues[ver - 1];
          const palavras = original[ver - 1];
          const referencias = referenciasCruzadas[chaveVersiculo(codigo, cap, ver)];
          return (
            <Cartao style={{ gap: 8 }}>
              <Rotulo>{ref(ver)}</Rotulo>
              {texto ? <Text style={estilos.versiculo}>{texto}</Text> : null}
              {mostrarOriginal && palavras && palavras.length > 0 && (
                <Text style={[estilos.original, hebraico && estilos.hebraico]}>
                  {palavras.map((p, i) => (
                    <Text
                      key={i}
                      onPress={() => setSelecao({ ver, palavra: p })}
                      style={selecao?.palavra === p ? estilos.palavraAtiva : undefined}
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
              Texto em português: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles, fevereiro de
              2018, licença CC BY 4.0 Brasil.
              {hebraico
                ? ' Hebraico: Open Scriptures Hebrew Bible (Códice de Leningrado, CC BY 4.0).'
                : original.length > 0
                  ? ' Grego: texto bizantino de Robinson-Pierpont (domínio público).'
                  : ''}
            </Text>
          </View>
        }
      />

      {selecao && (
        <View style={estilos.painel}>
          <View style={estilos.painelTopo}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              <Text style={estilos.lema}>{verbete?.[0] ?? selecao.palavra[0]}</Text>
              <Text style={estilos.dica}>
                {verbete?.[1]} · {prefixo}
                {selecao.palavra[1]}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar estudo da palavra"
              onPress={() => setSelecao(null)}
              style={estilos.fechar}
            >
              <Text style={{ fontSize: 20, color: cores.textoSuave }}>×</Text>
            </Pressable>
          </View>
          <Text style={estilos.corpo}>
            {hebraico ? descreverMorfologiaHebraica(selecao.palavra[2]) : descreverMorfologia(selecao.palavra[2])}
          </Text>
          <Text style={estilos.dica}>Forma no texto: {selecao.palavra[0]}</Text>
          {verbete && (
            <Text style={estilos.dica}>
              Definição de Strong (inglês): {verbete[2]}
              {verbete[3] ? ` · KJV: ${verbete[3]}` : ''}
            </Text>
          )}
          {sermao && (
            <Botao
              titulo="Inserir no sermão"
              onPress={() =>
                inserir(
                  'palavra',
                  `${verbete?.[0] ?? selecao.palavra[0]} (${verbete?.[1] ?? ''}, ${prefixo}${selecao.palavra[1]}), ${ref(selecao.ver)}: ${verbete?.[2] ?? ''}`,
                )
              }
            />
          )}
        </View>
      )}
    </View>
  );
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
  original: { fontFamily: fonteBiblia, fontSize: 19, lineHeight: 30, color: cores.textoSuave },
  hebraico: { fontSize: 22, lineHeight: 36, writingDirection: 'rtl', textAlign: 'right' },
  palavraAtiva: { backgroundColor: '#D7ECEC', color: cores.texto },
  dica: { fontSize: 13, color: cores.textoSuave },
  creditos: { fontSize: 12, color: cores.textoSuave, lineHeight: 18 },
  lema: { fontFamily: fonteBiblia, fontSize: 26, fontWeight: '600', color: cores.texto },
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
