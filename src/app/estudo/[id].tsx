import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Etapas } from '../../components/Etapas';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import {
  ETAPA_BIBLIA,
  ETAPA_ESTUDO,
  ETAPA_MONTAGEM,
  etapaAtual,
  etapas,
  nomesEstudo,
  type EtapaEstudo,
} from '../../data/etapas';
import { pericopeDe } from '../../data/pericope';
import { carregarTexto, livros, type CodigoLivro } from '../../data/portugues';
import {
  generos,
  leitura,
  perguntasDaEtapa,
  referenciaDoTexto,
  sentidoFigurado,
  sugerirGenero,
} from '../../data/roteiro';
import { useSermao, useSermoes, type Sermao } from '../../store/sermoes';
import { coresPregacao } from '../../estilo';
import { cores, fonteBiblia } from '../../theme';

const dicasAnotacao: Record<EtapaEstudo, string> = {
  leitura: 'O que chamou sua atenção na leitura? Palavras que se repetem, frases fortes...',
  observacao: 'O que você observou: contexto, repetições, contrastes, palavras-chave...',
  interpretacao: 'O que o autor quis dizer? Significado das palavras, outros textos que confirmam...',
  aplicacao: 'Verdade central, onde ela toca a vida hoje, perguntas para a igreja...',
};

const partesDoEstudo: EtapaEstudo[] = ['observacao', 'interpretacao', 'aplicacao'];

// Telas Bíblia (escolha e leitura do texto) e Estudo (Observação, Interpretação e Aplicação) do sermão
export default function EstudoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar } = useSermoes();
  // Sem texto ainda, a Bíblia já abre para escolher; o seletor fica aberto até tocar em Pronto
  const [escolhendo, setEscolhendo] = useState(() => !referenciaDoTexto(sermao?.textoBase ?? ''));
  const [parte, setParte] = useState<EtapaEstudo>('observacao');

  if (!sermao) return null;

  const indice = Math.min(etapaAtual(sermao.etapa), ETAPA_ESTUDO);
  const temTexto = !!referenciaDoTexto(sermao.textoBase);
  const posicaoParte = partesDoEstudo.indexOf(parte);

  const irPara = (proxima: number) => {
    atualizar(sermao.id, (s) => ({ ...s, etapa: proxima }));
    if (proxima === ETAPA_MONTAGEM) router.replace(`/sermao/${sermao.id}`);
  };

  const anterior = () => {
    if (indice === ETAPA_ESTUDO && posicaoParte > 0) setParte(partesDoEstudo[posicaoParte - 1]);
    else irPara(indice - 1);
  };
  const proximo = () => {
    if (indice === ETAPA_ESTUDO && posicaoParte < partesDoEstudo.length - 1) setParte(partesDoEstudo[posicaoParte + 1]);
    else irPara(indice + 1);
  };
  const tituloProximo =
    indice === ETAPA_BIBLIA
      ? 'Próximo: Estudo'
      : posicaoParte < partesDoEstudo.length - 1
        ? `Próximo: ${nomesEstudo[partesDoEstudo[posicaoParte + 1]]}`
        : 'Montar o sermão';

  return (
    <>
      <Stack.Screen options={{ title: `${indice + 1}. ${etapas[indice].nome}` }} />
      <ScrollView
        key={`${indice}-${parte}`}
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <Etapas sermaoId={sermao.id} atual={indice} />
        <View>
          <Text style={estilos.base}>{sermao.textoBase || 'Escolha o texto'}</Text>
          <Text style={estilos.suave}>{etapas[indice].pergunta}</Text>
        </View>

        {indice === ETAPA_BIBLIA && (
          <>
            {temTexto && <Leitura sermao={sermao} />}
            {temTexto && !escolhendo ? (
              <Botao titulo="Escolher outro texto" variante="contorno" onPress={() => setEscolhendo(true)} />
            ) : (
              <EscolherTexto sermao={sermao} />
            )}
            {temTexto && escolhendo ? (
              <Botao titulo="Pronto, ler a perícope" onPress={() => setEscolhendo(false)} />
            ) : null}
            <Cartao style={{ gap: 8 }}>
              <Rotulo>Como ler</Rotulo>
              <Lista itens={leitura} />
            </Cartao>
            <Anotacoes sermao={sermao} etapa="leitura" nome="Leitura" />
          </>
        )}

        {indice === ETAPA_ESTUDO && (
          <>
            <Genero sermao={sermao} />
            <View style={estilos.linha}>
              {partesDoEstudo.map((p) => (
                <Pilula key={p} texto={nomesEstudo[p]} ativa={parte === p} onPress={() => setParte(p)} />
              ))}
            </View>
            {perguntasDaEtapa(parte, sermao.textoBase, sermao.genero).map((g) => (
              <Cartao key={g.titulo} style={{ gap: 10 }}>
                <Rotulo>{g.titulo}</Rotulo>
                {g.dica ? <Text style={estilos.chave}>{g.dica}</Text> : null}
                {g.perguntas.map((q) => (
                  <View key={q.pergunta} style={{ gap: 2 }}>
                    <Text style={estilos.pergunta}>{q.pergunta}</Text>
                    <TextInput
                      accessibilityLabel={q.pergunta}
                      value={sermao.respostas?.[q.pergunta] ?? q.padrao ?? ''}
                      onChangeText={(texto) =>
                        atualizar(sermao.id, (s) => ({ ...s, respostas: { ...s.respostas, [q.pergunta]: texto } }))
                      }
                      multiline
                      placeholder="Sua resposta"
                      placeholderTextColor={cores.textoSuave}
                      style={estilos.resposta}
                    />
                  </View>
                ))}
              </Cartao>
            ))}
            {parte === 'interpretacao' && (
              <Cartao style={{ gap: 8 }}>
                <Rotulo>Literal ou figurado?</Rotulo>
                <Lista itens={sentidoFigurado} />
                <Botao titulo="Consultar a biblioteca" variante="contorno" onPress={() => router.push('/biblioteca')} />
              </Cartao>
            )}
            <Anotacoes sermao={sermao} etapa={parte} nome={nomesEstudo[parte]} />
          </>
        )}

        <View style={estilos.navegacao}>
          {indice > 0 ? <Botao titulo="Anterior" variante="contorno" onPress={anterior} style={{ flex: 1 }} /> : null}
          <Botao titulo={tituloProximo} onPress={proximo} style={{ flex: 2 }} />
        </View>
      </ScrollView>
    </>
  );
}

function Anotacoes({ sermao, etapa, nome }: { sermao: Sermao; etapa: EtapaEstudo; nome: string }) {
  const { atualizar } = useSermoes();
  const anotacao = sermao.anotacoes?.[etapa] ?? (etapa === 'observacao' ? sermao.estudo : undefined) ?? '';
  return (
    <Cartao style={{ gap: 8 }}>
      <Rotulo>Suas anotações</Rotulo>
      <TextInput
        accessibilityLabel={`Anotações da ${nome}`}
        value={anotacao}
        onChangeText={(texto) => atualizar(sermao.id, (s) => ({ ...s, anotacoes: { ...s.anotacoes, [etapa]: texto } }))}
        multiline
        placeholder={dicasAnotacao[etapa]}
        placeholderTextColor={cores.textoSuave}
        style={estilos.entrada}
      />
    </Cartao>
  );
}

function useCapitulo(codigo: CodigoLivro | undefined, capitulo: number | undefined) {
  const [versos, setVersos] = useState<{ chave: string; lista: string[] }>();
  const chave = `${codigo} ${capitulo}`;
  useEffect(() => {
    if (!codigo || !capitulo) return;
    let ativo = true;
    carregarTexto(codigo).then((livro) => {
      if (ativo) setVersos({ chave: `${codigo} ${capitulo}`, lista: livro[capitulo - 1] ?? [] });
    });
    return () => {
      ativo = false;
    };
  }, [codigo, capitulo]);
  return versos?.chave === chave ? versos.lista : undefined;
}

// Etapa Bíblia: escolher livro, capítulo e tocar no versículo (toque num segundo versículo para um trecho)
function EscolherTexto({ sermao }: { sermao: Sermao }) {
  const { atualizar } = useSermoes();
  const ref = referenciaDoTexto(sermao.textoBase);
  const [codigo, setCodigo] = useState<CodigoLivro>(ref?.livro.codigo ?? 'JOH');
  const [cap, setCap] = useState(ref?.capitulo ?? 1);
  const livro = livros.find((l) => l.codigo === codigo)!;
  const [testamento, setTestamento] = useState<'AT' | 'NT'>(livro.testamento);
  const versos = useCapitulo(codigo, cap);
  const mesmoCapitulo = ref?.livro.codigo === codigo && ref.capitulo === cap;
  const de = mesmoCapitulo ? ref.de : undefined;
  const ate = mesmoCapitulo ? (ref.ate ?? ref.de) : undefined;

  const escolher = (n: number) => {
    let inicio = n;
    let fim = n;
    if (de && ate && de === ate && n > de) inicio = de;
    else if (de === n && ate === n) return;
    const texto = `${livro.nome} ${cap}:${inicio}${fim > inicio ? `-${fim}` : ''}`;
    atualizar(sermao.id, (s) => {
      const generoAntigo = sugerirGenero(s.textoBase);
      const genero = !s.genero || s.genero === generoAntigo ? sugerirGenero(texto) : s.genero;
      return { ...s, textoBase: texto, genero };
    });
  };

  return (
    <Cartao style={{ gap: 10 }}>
      <View style={estilos.linha}>
        {(['AT', 'NT'] as const).map((t) => (
          <Pilula
            key={t}
            texto={t === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
            ativa={testamento === t}
            onPress={() => setTestamento(t)}
          />
        ))}
      </View>
      <View style={estilos.linha}>
        {livros
          .filter((l) => l.testamento === testamento)
          .map((l) => (
            <Pilula
              key={l.codigo}
              texto={l.nome}
              ativa={codigo === l.codigo}
              onPress={() => {
                setCodigo(l.codigo);
                setCap(1);
              }}
            />
          ))}
      </View>
      <Rotulo>{livro.nome}: capítulo</Rotulo>
      <View style={estilos.linha}>
        {Array.from({ length: livro.capitulos }, (_, i) => i + 1).map((c) => (
          <Pilula key={c} texto={String(c)} ativa={cap === c} onPress={() => setCap(c)} />
        ))}
      </View>
      <Rotulo>
        {livro.nome} {cap} · toque no versículo
      </Rotulo>
      {!versos ? (
        <ActivityIndicator color={cores.destaque} />
      ) : (
        versos.map((texto, i) => {
          const n = i + 1;
          const marcado = !!de && !!ate && n >= de && n <= ate;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityState={{ selected: marcado }}
              accessibilityLabel={`Versículo ${n}`}
              onPress={() => escolher(n)}
              style={[estilos.versoToque, marcado && estilos.versoMarcado]}
            >
              <Text style={[estilos.versiculo, marcado && estilos.versiculoDestaque]}>
                <Text style={estilos.numero}>{n} </Text>
                {texto}
              </Text>
            </Pressable>
          );
        })
      )}
      <Text style={estilos.suave}>Toque em outro versículo depois do primeiro para escolher um trecho.</Text>
    </Cartao>
  );
}

function Leitura({ sermao }: { sermao: Sermao }) {
  const ref = referenciaDoTexto(sermao.textoBase);
  const versos = useCapitulo(ref?.livro.codigo, ref?.capitulo);
  const de = ref?.de;
  const ate = ref?.ate ?? de;
  const pericope =
    ref && versos && de ? pericopeDe(ref.livro.codigo, ref.capitulo, de, ate ?? de, versos.length) : undefined;
  const mostrar = (versos ?? [])
    .map((texto, i) => ({ n: i + 1, texto }))
    .filter((v) => !pericope || (v.n >= pericope.de && v.n <= pericope.ate));

  return (
    <>
      <Cartao style={{ gap: 8 }}>
        {!ref ? (
          <Text style={estilos.suave}>Escolha o texto na etapa Bíblia para ler a passagem aqui.</Text>
        ) : !versos ? (
          <ActivityIndicator color={cores.destaque} />
        ) : (
          <>
            <Rotulo>
              {pericope
                ? `Perícope: ${ref.livro.nome} ${ref.capitulo}:${pericope.de}-${pericope.ate}`
                : `${ref.livro.nome} ${ref.capitulo}`}{' '}
              · Bíblia Livre
            </Rotulo>
            {mostrar.map((v) => {
              const escolhido = !!de && v.n >= de && v.n <= (ate ?? de);
              return (
                <Text key={v.n} style={[estilos.versiculo, escolhido && estilos.versiculoDestaque]}>
                  <Text style={estilos.numero}>{v.n} </Text>
                  {v.texto}
                </Text>
              );
            })}
            {pericope ? (
              <Text style={estilos.suave}>
                Em vermelho, o texto escolhido. Ao redor, a perícope: o trecho que forma uma unidade com ele.
              </Text>
            ) : null}
          </>
        )}
        <Botao
          titulo="Abrir na Bíblia com grego e hebraico"
          variante="contorno"
          onPress={() => router.push({ pathname: '/biblia', params: { sermao: sermao.id } })}
        />
      </Cartao>
    </>
  );
}

function Pilula({ texto, ativa, onPress }: { texto: string; ativa: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativa }}
      onPress={onPress}
      style={[estilos.pilula, ativa && estilos.pilulaAtiva]}
    >
      <Text style={[estilos.textoPilula, ativa && { color: '#FFFFFF' }]}>{texto}</Text>
    </Pressable>
  );
}

function Genero({ sermao }: { sermao: Sermao }) {
  const { atualizar } = useSermoes();
  const sugerido = sugerirGenero(sermao.textoBase);
  const generoAtual = sermao.genero ?? sugerido;
  const genero = generos.find((g) => g.id === generoAtual);
  const [trocando, setTrocando] = useState(false);

  return (
    <Cartao style={{ gap: 8 }}>
      <Rotulo>Gênero literário</Rotulo>
      <Text style={estilos.genero}>{genero?.nome ?? 'Não definido'}</Text>
      {genero && generoAtual === sugerido ? <Text style={estilos.suave}>Definido pelo livro do texto.</Text> : null}
      {trocando || !genero ? (
        <View style={estilos.linha}>
          {generos.map((g) => (
            <Pressable
              key={g.id}
              accessibilityRole="button"
              accessibilityState={{ selected: generoAtual === g.id }}
              onPress={() => {
                atualizar(sermao.id, (s) => ({ ...s, genero: g.id }));
                setTrocando(false);
              }}
              style={[estilos.pilula, generoAtual === g.id && estilos.pilulaAtiva]}
            >
              <Text style={[estilos.textoPilula, generoAtual === g.id && { color: '#FFFFFF' }]}>{g.nome}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Botao
          titulo="Trocar gênero"
          variante="contorno"
          onPress={() => setTrocando(true)}
          style={{ alignSelf: 'flex-start' }}
        />
      )}
    </Cartao>
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
  versiculoDestaque: { color: coresPregacao.textoBiblico, fontWeight: '700' },
  versoToque: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  versoMarcado: { backgroundColor: '#FBEAEA' },
  chave: { fontSize: 14, fontStyle: 'italic', color: cores.apoioTexto },
  genero: { fontSize: 18, fontWeight: '700', color: cores.destaque },
  pergunta: { fontSize: 15, fontWeight: '600', color: cores.texto },
  resposta: {
    fontSize: 15,
    color: cores.texto,
    minHeight: 44,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: cores.borda,
    textAlignVertical: 'top',
  },
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
