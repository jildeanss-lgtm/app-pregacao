import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Etapas } from '../../components/Etapas';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { ETAPA_MONTAGEM, etapaAtual, etapas, etapasDeEstudo, type EtapaEstudo } from '../../data/etapas';
import { carregarTexto } from '../../data/portugues';
import {
  generos,
  interpretacao,
  leitura,
  observacao,
  referenciaDoTexto,
  sentidoFigurado,
  sugerirGenero,
} from '../../data/roteiro';
import { useSermao, useSermoes, type Sermao } from '../../store/sermoes';
import { cores, fonteBiblia } from '../../theme';

const perguntasAplicacao = [
  'Que verdade eterna o texto ensina?',
  'Onde ela confronta a nossa vida hoje (família, igreja, trabalho)?',
  'Onde Cristo aparece neste texto?',
  'Que pergunta vou fazer ao coração dos ouvintes?',
];

const dicasAnotacao: Record<EtapaEstudo, string> = {
  leitura: 'O que chamou sua atenção na leitura? Palavras que se repetem, frases fortes...',
  observacao: 'O que você observou: contexto, repetições, contrastes, palavras-chave...',
  interpretacao: 'O que o autor quis dizer? Significado das palavras, outros textos que confirmam...',
  aplicacao: 'Verdade central, onde ela toca a vida hoje, perguntas para a igreja...',
};

// Etapas 1 a 4 do sermão, uma tela por vez: Leitura, Observação, Interpretação e Aplicação
export default function EstudoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar } = useSermoes();

  if (!sermao) return null;

  const indice = Math.min(etapaAtual(sermao.etapa), etapasDeEstudo.length - 1);
  const etapa = etapasDeEstudo[indice];
  const anotacao = sermao.anotacoes?.[etapa] ?? (etapa === 'observacao' ? sermao.estudo : undefined) ?? '';

  const irPara = (proxima: number) => {
    atualizar(sermao.id, (s) => ({ ...s, etapa: proxima }));
    if (proxima === ETAPA_MONTAGEM) router.replace(`/sermao/${sermao.id}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: `${indice + 1}. ${etapas[indice].nome}` }} />
      <ScrollView key={indice} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Etapas sermaoId={sermao.id} atual={indice} />
        <View>
          <Text style={estilos.base}>{sermao.textoBase || 'Sem texto referência'}</Text>
          <Text style={estilos.suave}>{etapas[indice].pergunta}</Text>
        </View>

        {etapa === 'leitura' && <Leitura sermao={sermao} />}
        {etapa === 'observacao' && <Observacao sermao={sermao} />}
        {etapa === 'interpretacao' && (
          <Cartao style={{ gap: 8 }}>
            <Rotulo>As cinco chaves</Rotulo>
            {interpretacao.map((c) => (
              <Text key={c.nome} style={estilos.item}>
                <Text style={{ fontWeight: '700' }}>{c.nome}: </Text>
                {c.texto}
              </Text>
            ))}
            <Text style={estilos.subtitulo}>Literal ou figurado?</Text>
            <Lista itens={sentidoFigurado} />
          </Cartao>
        )}
        {etapa === 'aplicacao' && (
          <Cartao style={{ gap: 8 }}>
            <Rotulo>Perguntas para a aplicação</Rotulo>
            <Lista itens={perguntasAplicacao} />
          </Cartao>
        )}

        <Cartao style={{ gap: 8 }}>
          <Rotulo>Suas anotações</Rotulo>
          <TextInput
            accessibilityLabel={`Anotações da ${etapas[indice].nome}`}
            value={anotacao}
            onChangeText={(texto) =>
              atualizar(sermao.id, (s) => ({ ...s, anotacoes: { ...s.anotacoes, [etapa]: texto } }))
            }
            multiline
            placeholder={dicasAnotacao[etapa]}
            placeholderTextColor={cores.textoSuave}
            style={estilos.entrada}
          />
        </Cartao>

        <View style={estilos.navegacao}>
          {indice > 0 ? (
            <Botao titulo="Anterior" variante="contorno" onPress={() => irPara(indice - 1)} style={{ flex: 1 }} />
          ) : null}
          <Botao
            titulo={indice === etapasDeEstudo.length - 1 ? 'Montar o sermão' : `Próximo: ${etapas[indice + 1].nome}`}
            onPress={() => irPara(indice + 1)}
            style={{ flex: 2 }}
          />
        </View>
      </ScrollView>
    </>
  );
}

function Leitura({ sermao }: { sermao: Sermao }) {
  const ref = referenciaDoTexto(sermao.textoBase);
  const [versos, setVersos] = useState<{ n: number; texto: string }[]>();

  const codigo = ref?.livro.codigo;
  const capitulo = ref?.capitulo;
  const de = ref?.de;
  const ate = ref?.ate;

  useEffect(() => {
    if (!codigo || !capitulo) return;
    let ativo = true;
    carregarTexto(codigo).then((livro) => {
      if (!ativo) return;
      const todos = (livro[capitulo - 1] ?? []).map((texto, i) => ({ n: i + 1, texto }));
      setVersos(de ? todos.filter((v) => v.n >= de && v.n <= (ate ?? de)) : todos);
    });
    return () => {
      ativo = false;
    };
  }, [codigo, capitulo, de, ate]);

  return (
    <>
      <Cartao style={{ gap: 8 }}>
        {!ref ? (
          <Text style={estilos.suave}>
            Escreva o texto referência no sermão (ex.: Êxodo 8 ou João 3:16-21) para ler a passagem aqui.
          </Text>
        ) : !versos ? (
          <ActivityIndicator color={cores.destaque} />
        ) : (
          <>
            <Rotulo>
              {ref.livro.nome} {ref.capitulo} · Bíblia Livre
            </Rotulo>
            {versos.map((v) => (
              <Text key={v.n} style={estilos.versiculo}>
                <Text style={estilos.numero}>{v.n} </Text>
                {v.texto}
              </Text>
            ))}
          </>
        )}
        <Botao
          titulo="Abrir na Bíblia com grego e hebraico"
          variante="contorno"
          onPress={() => router.push({ pathname: '/biblia', params: { sermao: sermao.id } })}
        />
      </Cartao>
      <Cartao style={{ gap: 8 }}>
        <Rotulo>Como ler</Rotulo>
        <Lista itens={leitura} />
      </Cartao>
    </>
  );
}

function Observacao({ sermao }: { sermao: Sermao }) {
  const { atualizar } = useSermoes();
  const generoAtual = sermao.genero ?? sugerirGenero(sermao.textoBase);
  const genero = generos.find((g) => g.id === generoAtual);

  return (
    <>
      <Cartao style={{ gap: 8 }}>
        <Rotulo>Contexto</Rotulo>
        <Lista itens={observacao.contexto} />
        <Text style={estilos.subtitulo}>Seis pistas no texto</Text>
        <Lista itens={observacao.pistas} />
        <Text style={estilos.subtitulo}>Perguntas seletivas</Text>
        <Text style={estilos.item}>{observacao.perguntas.join('  ·  ')}</Text>
      </Cartao>
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
    </>
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
  suave: { fontSize: 14, color: cores.textoSuave },
  subtitulo: { fontSize: 15, fontWeight: '600', color: cores.texto, marginTop: 4 },
  item: { fontSize: 15, lineHeight: 21, color: cores.texto },
  versiculo: { fontSize: 18, lineHeight: 28, color: cores.texto, fontFamily: fonteBiblia },
  numero: { fontSize: 13, fontWeight: '700', color: cores.destaque },
  chave: { fontSize: 14, fontStyle: 'italic', color: cores.apoioTexto },
  entrada: { fontSize: 16, color: cores.texto, minHeight: 120, textAlignVertical: 'top' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navegacao: { flexDirection: 'row', gap: 8 },
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
