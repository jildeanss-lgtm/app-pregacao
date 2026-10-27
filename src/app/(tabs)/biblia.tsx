import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { chaveVersiculo, referenciasCruzadas, textoPortugues } from '../../data/biblia';
import { carregarLexico, carregarLivro, livrosNT, type CodigoLivro, type PalavraGrega } from '../../data/grego';
import { descreverMorfologia } from '../../data/grego/morfologia';
import { useSermao, useSermoes } from '../../store/sermoes';
import { cores, fonteBiblia } from '../../theme';

type Selecao = { ver: number; palavra: PalavraGrega };

export default function BibliaTela() {
  const { sermao: sermaoId } = useLocalSearchParams<{ sermao?: string }>();
  const sermao = useSermao(sermaoId);
  const { adicionarBloco } = useSermoes();
  const [codigo, setCodigo] = useState<CodigoLivro>('JOH');
  const [cap, setCap] = useState(3);
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [aviso, setAviso] = useState('');

  const livro = livrosNT.find((l) => l.codigo === codigo)!;
  const versiculos = useMemo(() => carregarLivro(codigo)[cap - 1] ?? [], [codigo, cap]);
  const lexico = useMemo(() => carregarLexico(), []);

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

  const verbete = selecao ? lexico[selecao.palavra[1]] : undefined;

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.seletores}>
        {sermao && <Text style={estilos.contexto}>Estudando para: {sermao.titulo || 'Sermão sem título'}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
          {livrosNT.map((l) => (
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

      <FlatList
        data={versiculos}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <Text style={estilos.dica}>
            Texto grego do Novo Testamento com números de Strong. Toque numa palavra para estudar.
          </Text>
        }
        renderItem={({ item: palavras, index }) => {
          const ver = index + 1;
          const chave = chaveVersiculo(codigo, cap, ver);
          const portugues = textoPortugues[chave];
          const referencias = referenciasCruzadas[chave];
          return (
            <Cartao style={{ gap: 8 }}>
              <Rotulo>{ref(ver)}</Rotulo>
              {portugues && <Text style={estilos.versiculo}>{portugues}</Text>}
              <Text style={estilos.grego}>
                {palavras.map((p, i) => {
                  const ativa = selecao?.ver === ver && selecao.palavra === p;
                  return (
                    <Text
                      key={i}
                      onPress={() => setSelecao({ ver, palavra: p })}
                      style={ativa ? estilos.palavraAtiva : undefined}
                    >
                      {p[0]}{' '}
                    </Text>
                  );
                })}
              </Text>
              {referencias && <Text style={estilos.dica}>Veja também: {referencias.join(', ')}</Text>}
              {sermao && (
                <Botao
                  titulo="Inserir versículo no sermão"
                  variante="contorno"
                  onPress={() => inserir('versiculo', portugues ? `${ref(ver)}: ${portugues}` : ref(ver))}
                />
              )}
            </Cartao>
          );
        }}
        ListFooterComponent={aviso ? <Text style={estilos.aviso}>{aviso}</Text> : undefined}
      />

      {selecao && (
        <View style={estilos.painel}>
          <View style={estilos.painelTopo}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              <Text style={estilos.lema}>{verbete?.[0] ?? selecao.palavra[0]}</Text>
              <Text style={estilos.dica}>
                {verbete?.[1]} · G{selecao.palavra[1]}
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
            {selecao.palavra[0]}: {descreverMorfologia(selecao.palavra[2])}
          </Text>
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
                  `${verbete?.[0] ?? selecao.palavra[0]} (${verbete?.[1] ?? ''}, G${selecao.palavra[1]}), ${ref(selecao.ver)}: ${verbete?.[2] ?? ''}`,
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
  grego: { fontFamily: fonteBiblia, fontSize: 20, lineHeight: 32, color: cores.texto },
  palavraAtiva: { backgroundColor: '#D7ECEC' },
  dica: { fontSize: 13, color: cores.textoSuave },
  lema: { fontFamily: fonteBiblia, fontSize: 26, fontWeight: '600', color: cores.texto },
  corpo: { fontSize: 15, color: cores.texto },
  aviso: { fontSize: 14, fontWeight: '600', color: cores.destaqueEscuro, marginTop: 8 },
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
