import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { generos, interpretacao, observacao, sentidoFigurado, sugerirGenero } from '../../data/roteiro';
import { useSermao, useSermoes } from '../../store/sermoes';
import { cores } from '../../theme';

export default function RoteiroEstudoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar } = useSermoes();

  if (!sermao) return null;

  const generoAtual = sermao.genero ?? sugerirGenero(sermao.textoBase);
  const genero = generos.find((g) => g.id === generoAtual);

  return (
    <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      <Text style={estilos.base}>{sermao.textoBase || 'Defina o texto referência no sermão'}</Text>
      <Text style={estilos.suave}>Observação → Interpretação → Aplicação. Primeiro o texto, depois os livros.</Text>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>Gênero literário</Rotulo>
        <View style={estilos.linha}>
          {generos.map((g) => (
            <Pressable
              key={g.id}
              accessibilityRole="button"
              accessibilityState={{ selected: generoAtual === g.id }}
              onPress={() => atualizar(sermao.id, (s) => ({ ...s, genero: g.id }))}
              style={[estilos.pilula, generoAtual === g.id && estilos.pilulaAtiva]}
            >
              <Text style={[estilos.textoPilula, generoAtual === g.id && { color: '#FFFFFF' }]}>{g.nome}</Text>
            </Pressable>
          ))}
        </View>
        {genero ? (
          <>
            <Text style={estilos.chave}>{genero.chave}</Text>
            <Lista itens={genero.perguntas} />
          </>
        ) : null}
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>1. Observação: o que eu vejo?</Rotulo>
        <Text style={estilos.subtitulo}>Contexto</Text>
        <Lista itens={observacao.contexto} />
        <Text style={estilos.subtitulo}>Seis pistas no texto</Text>
        <Lista itens={observacao.pistas} />
        <Text style={estilos.subtitulo}>Perguntas seletivas</Text>
        <Text style={estilos.item}>{observacao.perguntas.join('  ·  ')}</Text>
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>2. Interpretação: o que significa?</Rotulo>
        {interpretacao.map((c) => (
          <Text key={c.nome} style={estilos.item}>
            <Text style={{ fontWeight: '700' }}>{c.nome}: </Text>
            {c.texto}
          </Text>
        ))}
        <Text style={estilos.subtitulo}>Literal ou figurado?</Text>
        <Lista itens={sentidoFigurado} />
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>3. Aplicação: o que muda em mim?</Rotulo>
        <Lista
          itens={[
            'Que verdade eterna o texto ensina?',
            'Onde ela confronta a nossa vida hoje (família, igreja, trabalho)?',
            'Onde Cristo aparece neste texto?',
            'Que pergunta vou fazer ao coração dos ouvintes?',
          ]}
        />
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>Anotações do estudo</Rotulo>
        <TextInput
          accessibilityLabel="Anotações do estudo"
          value={sermao.estudo ?? ''}
          onChangeText={(estudo) => atualizar(sermao.id, (s) => ({ ...s, estudo }))}
          multiline
          placeholder="O que você observou: repetições, contrastes, palavras-chave, contexto..."
          placeholderTextColor={cores.textoSuave}
          style={estilos.entrada}
        />
      </Cartao>

      <Botao
        titulo="Abrir o texto na Bíblia"
        variante="contorno"
        onPress={() => router.push({ pathname: '/biblia', params: { sermao: sermao.id } })}
      />
    </ScrollView>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <View style={{ gap: 4 }}>
      {itens.map((t) => (
        <Text key={t} style={estilos.item}>
          • {t}
        </Text>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 12, paddingBottom: 48 },
  base: { fontSize: 20, fontWeight: '700', color: cores.texto },
  suave: { fontSize: 13, color: cores.textoSuave },
  subtitulo: { fontSize: 15, fontWeight: '600', color: cores.texto, marginTop: 4 },
  item: { fontSize: 15, lineHeight: 21, color: cores.texto },
  chave: { fontSize: 14, fontStyle: 'italic', color: cores.apoioTexto },
  entrada: { fontSize: 16, color: cores.texto, minHeight: 120, textAlignVertical: 'top' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: cores.borda,
    justifyContent: 'center',
  },
  pilulaAtiva: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  textoPilula: { fontSize: 14, color: cores.texto },
});
