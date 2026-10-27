import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { normalizarPalavra, passagens, type PalavraOriginal } from '../../data/biblia';
import { useSermao, useSermoes } from '../../store/sermoes';
import { cores, fonteBiblia } from '../../theme';

export default function BibliaTela() {
  const { sermao: sermaoId } = useLocalSearchParams<{ sermao?: string }>();
  const sermao = useSermao(sermaoId);
  const { adicionarBloco } = useSermoes();
  const [passagemId, setPassagemId] = useState(passagens[0].id);
  const [selecionada, setSelecionada] = useState<{ ref: string; palavra: string; dado: PalavraOriginal } | null>(null);
  const [aviso, setAviso] = useState('');

  const passagem = passagens.find((p) => p.id === passagemId)!;

  const inserir = (tipo: 'versiculo' | 'palavra', texto: string) => {
    if (!sermao) return;
    adicionarBloco(sermao.id, tipo, texto);
    setAviso(`Inserido em "${sermao.titulo || 'Sermão sem título'}"`);
  };

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      {sermao && (
        <Text style={estilos.contexto}>Estudando para: {sermao.titulo || 'Sermão sem título'}</Text>
      )}
      <View style={estilos.linha}>
        {passagens.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            onPress={() => {
              setPassagemId(p.id);
              setSelecionada(null);
            }}
            style={[estilos.pilula, p.id === passagemId && estilos.pilulaAtiva]}
          >
            <Text style={[estilos.textoPilula, p.id === passagemId && { color: '#FFFFFF' }]}>{p.titulo}</Text>
          </Pressable>
        ))}
      </View>

      {passagem.versiculos.map((v) => (
        <Cartao key={v.ref} style={{ gap: 8 }}>
          <Rotulo>{v.ref}</Rotulo>
          <Text style={estilos.versiculo}>
            {v.texto.split(' ').map((p, i) => {
              const dado = v.palavras?.[normalizarPalavra(p)];
              const ativa = selecionada?.ref === v.ref && selecionada.palavra === p;
              return (
                <Text
                  key={i}
                  onPress={dado ? () => setSelecionada({ ref: v.ref, palavra: p, dado }) : undefined}
                  style={[dado && estilos.palavraEstudavel, ativa && estilos.palavraAtiva]}
                >
                  {p}{' '}
                </Text>
              );
            })}
          </Text>
          {v.palavras && <Text style={estilos.dica}>Toque numa palavra sublinhada para ver o original</Text>}
          {sermao && (
            <Botao
              titulo="Inserir versículo no sermão"
              variante="contorno"
              onPress={() => inserir('versiculo', `${v.ref}: ${v.texto}`)}
            />
          )}
        </Cartao>
      ))}

      {selecionada && (
        <Cartao style={{ gap: 6, borderColor: cores.destaque, borderWidth: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <Text style={estilos.grego}>{selecionada.dado.original}</Text>
            <Text style={estilos.dica}>
              {selecionada.dado.translit} · {selecionada.dado.strong}
            </Text>
          </View>
          <Text style={estilos.corpo}>Sentido: {selecionada.dado.sentido}</Text>
          <Text style={estilos.dica}>Aparece também em {selecionada.dado.outras.join(', ')}</Text>
          {sermao && (
            <Botao
              titulo="Inserir no sermão"
              onPress={() =>
                inserir(
                  'palavra',
                  `${selecionada.dado.original} (${selecionada.dado.translit}, ${selecionada.dado.strong}): ${selecionada.dado.sentido}`,
                )
              }
            />
          )}
        </Cartao>
      )}

      <Cartao style={{ gap: 6 }}>
        <Rotulo>Referências cruzadas</Rotulo>
        {passagem.referencias.map((r) => (
          <View key={r} style={estilos.referencia}>
            <Text style={estilos.corpo}>{r}</Text>
            {sermao && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Inserir ${r} no sermão`}
                onPress={() => inserir('versiculo', r)}
                style={estilos.mais}
              >
                <Text style={{ fontSize: 20, color: cores.destaque }}>+</Text>
              </Pressable>
            )}
          </View>
        ))}
      </Cartao>

      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      <Text style={estilos.dica}>
        Amostra do protótipo. O texto bíblico completo, a NVT e o léxico entram nas próximas etapas.
      </Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 12, paddingBottom: 48 },
  contexto: { fontSize: 13, fontWeight: '600', color: cores.destaque },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    backgroundColor: cores.cartao,
    justifyContent: 'center',
  },
  pilulaAtiva: { backgroundColor: cores.texto, borderColor: cores.texto },
  textoPilula: { fontSize: 14, fontWeight: '600', color: cores.texto },
  versiculo: { fontFamily: fonteBiblia, fontSize: 18, lineHeight: 28, color: cores.texto },
  palavraEstudavel: { textDecorationLine: 'underline', textDecorationColor: cores.destaque },
  palavraAtiva: { backgroundColor: '#D7ECEC' },
  dica: { fontSize: 13, color: cores.textoSuave },
  grego: { fontFamily: fonteBiblia, fontSize: 26, fontWeight: '600', color: cores.texto },
  corpo: { fontSize: 15, color: cores.texto },
  referencia: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mais: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  aviso: { fontSize: 14, fontWeight: '600', color: cores.destaqueEscuro },
});
