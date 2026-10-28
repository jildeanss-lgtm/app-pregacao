import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { coresPregacao } from '../estilo';
import { carregarTexto, livros, type CodigoLivro } from '../data/portugues';
import { referenciaDoTexto, sugerirGenero } from '../data/roteiro';
import { useSermao, useSermoes, type DadosEstudo } from '../store/sermoes';
import { cores, fonteBiblia } from '../theme';
import { Botao } from './ui';

type Testamento = 'AT' | 'NT';

// Aba Bíblia: texto corrido do capítulo. Tocar num versículo escolhe o texto do estudo; tocar num segundo
// versículo depois dele escolhe o trecho todo
export function BibliaComum({ sermaoId }: { sermaoId?: string }) {
  const sermao = useSermao(sermaoId);
  const { estudo, mudarEstudo, adicionarBloco } = useSermoes();
  const inicio = referenciaDoTexto(sermao?.textoBase || estudo.textoBase);
  const [codigo, setCodigo] = useState<CodigoLivro>(inicio?.livro.codigo ?? 'JOH');
  const [cap, setCap] = useState(inicio?.capitulo ?? 1);
  const [escolhendo, setEscolhendo] = useState<'livro' | 'capitulo' | null>(null);
  const livro = livros.find((l) => l.codigo === codigo)!;
  const [testamento, setTestamento] = useState<Testamento>(livro.testamento);
  const [versos, setVersos] = useState<{ chave: string; lista: string[] }>();
  const [aviso, setAviso] = useState('');
  const largo = useWindowDimensions().width >= 900;

  useEffect(() => {
    let ativo = true;
    carregarTexto(codigo).then((t) => {
      if (ativo) setVersos({ chave: `${codigo} ${cap}`, lista: t[cap - 1] ?? [] });
    });
    return () => {
      ativo = false;
    };
  }, [codigo, cap]);

  const lista = versos?.chave === `${codigo} ${cap}` ? versos.lista : undefined;
  const ref = referenciaDoTexto(estudo.textoBase);
  const aqui = ref?.livro.codigo === codigo && ref.capitulo === cap;
  const de = aqui ? ref.de : undefined;
  const ate = aqui ? (ref.ate ?? ref.de) : undefined;

  const escolherVerso = (n: number) => {
    let inicio = n;
    if (de && ate && de === ate && n > de) inicio = de;
    else if (de === n && ate === n) return;
    const texto = `${livro.nome} ${cap}:${inicio}${n > inicio ? `-${n}` : ''}`;
    setAviso('');
    // Outro texto (não só mais versículos do mesmo trecho) começa um estudo limpo, para as respostas de um
    // texto não aparecerem no outro. Se o estudo tem conteúdo, pergunta antes
    const outroTexto = !aqui || inicio !== de;
    if (outroTexto && temConteudo(estudo)) {
      const ok = confirmar(
        `Começar um estudo novo de ${texto}? As respostas do estudo de ${estudo.textoBase} serão apagadas. Se você já criou o sermão, elas estão guardadas nele.`,
      );
      if (!ok) return;
    }
    mudarEstudo((e) => (outroTexto ? { textoBase: texto, genero: sugerirGenero(texto) } : { ...e, textoBase: texto }));
  };

  const textoEscolhido = () =>
    de && ate && lista
      ? lista
          .slice(de - 1, ate)
          .map((t, i) => `${de + i} ${t}`)
          .join(' ')
      : '';

  const notas = (
    <View style={[estilos.notas, largo && estilos.notasLado]}>
      <Text style={estilos.tituloNotas}>Anotações</Text>
      <TextInput
        accessibilityLabel="Anotações da leitura"
        multiline
        placeholder="Escreva aqui o que chamou sua atenção na leitura..."
        placeholderTextColor={cores.textoSuave}
        value={estudo.notasBiblia ?? ''}
        onChangeText={(t) => mudarEstudo((e) => ({ ...e, notasBiblia: t }))}
        style={[estilos.campoNotas, largo && { flex: 1 }]}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.topo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escolher livro"
          onPress={() => setEscolhendo((e) => (e === 'livro' ? null : 'livro'))}
          style={estilos.seletor}
        >
          <Text style={estilos.textoSeletor}>{livro.nome} ▾</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escolher capítulo"
          onPress={() => setEscolhendo((e) => (e === 'capitulo' ? null : 'capitulo'))}
          style={estilos.seletor}
        >
          <Text style={estilos.textoSeletor}>Capítulo {cap} ▾</Text>
        </Pressable>
      </View>

      {escolhendo ? (
        <ScrollView contentContainerStyle={estilos.grade}>
          {escolhendo === 'livro' ? (
            <>
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
                      ativa={l.codigo === codigo}
                      onPress={() => {
                        setCodigo(l.codigo);
                        setCap(1);
                        setEscolhendo(l.capitulos > 1 ? 'capitulo' : null);
                      }}
                    />
                  ))}
              </View>
            </>
          ) : (
            <View style={estilos.linha}>
              {Array.from({ length: livro.capitulos }, (_, i) => i + 1).map((n) => (
                <Pilula
                  key={n}
                  texto={String(n)}
                  ativa={n === cap}
                  acessivel={`Capítulo ${n}`}
                  onPress={() => {
                    setCap(n);
                    setEscolhendo(null);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, largo && estilos.colunas]}>
          <ScrollView
            key={`${codigo}-${cap}`}
            style={largo ? estilos.colunaTexto : undefined}
            contentContainerStyle={[estilos.conteudo, largo && estilos.conteudoLado]}
          >
            <Text style={estilos.titulo}>
              {livro.nome} {cap}
            </Text>
            {!lista ? (
              <ActivityIndicator color={cores.destaque} />
            ) : (
              <Text style={estilos.texto}>
                {lista.map((t, i) => {
                  const n = i + 1;
                  const marcado = !!de && !!ate && n >= de && n <= ate;
                  return (
                    <Text
                      key={n}
                      accessibilityRole="button"
                      accessibilityLabel={`Versículo ${n}`}
                      onPress={() => escolherVerso(n)}
                      style={marcado ? estilos.marcado : undefined}
                    >
                      <Text style={estilos.numero}>{n} </Text>
                      {t}{' '}
                    </Text>
                  );
                })}
              </Text>
            )}
            <Text style={estilos.creditos}>
              Toque num versículo para estudá-lo; toque em outro depois dele para escolher o trecho. Texto: Bíblia Livre
              (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles, 2018, licença CC BY 4.0 Brasil.
            </Text>
            {!largo && notas}
          </ScrollView>
          {largo && notas}
        </View>
      )}

      {de && !escolhendo ? (
        <View style={estilos.barra}>
          <Text style={estilos.escolhido}>{estudo.textoBase}</Text>
          {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
          <View style={estilos.linha}>
            {sermao && (
              <Botao
                titulo="Inserir no sermão"
                variante="contorno"
                onPress={() => {
                  adicionarBloco(sermao.id, 'versiculo', `${estudo.textoBase} - ${textoEscolhido()}`);
                  setAviso(`Inserido em "${sermao.titulo || 'Sermão sem título'}"`);
                }}
                style={{ flex: 1 }}
              />
            )}
            <Botao titulo="Estudar este texto" onPress={() => router.navigate('/estudo')} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}
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
  topo: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  seletor: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    backgroundColor: cores.cartao,
    justifyContent: 'center',
  },
  textoSeletor: { fontSize: 16, fontWeight: '700', color: cores.texto },
  grade: { padding: 20, gap: 12 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, maxWidth: 760, width: '100%', alignSelf: 'center' },
  colunas: { flexDirection: 'row' },
  colunaTexto: { width: '62%', flexGrow: 0 },
  conteudoLado: { maxWidth: undefined, alignSelf: 'stretch' },
  notas: { gap: 8, marginTop: 16 },
  notasLado: { width: '38%', marginTop: 0, padding: 20, borderLeftWidth: 1, borderLeftColor: cores.borda },
  tituloNotas: { fontSize: 16, fontWeight: '700', color: cores.texto },
  campoNotas: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    color: cores.texto,
    backgroundColor: cores.cartao,
    textAlignVertical: 'top',
  },
  titulo: { fontSize: 22, fontWeight: '700', color: cores.texto },
  texto: { fontFamily: fonteBiblia, fontSize: 19, lineHeight: 32, color: cores.texto },
  numero: { fontSize: 12, fontWeight: '700', color: cores.destaque },
  marcado: { color: coresPregacao.textoBiblico, backgroundColor: '#FBEAEA' },
  creditos: { fontSize: 12, color: cores.textoSuave, lineHeight: 18, marginTop: 8 },
  barra: {
    backgroundColor: cores.cartao,
    borderTopWidth: 2,
    borderTopColor: cores.destaque,
    padding: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  escolhido: { fontSize: 16, fontWeight: '700', color: coresPregacao.textoBiblico },
  aviso: { fontSize: 13, fontWeight: '600', color: cores.destaqueEscuro },
  pilula: {
    minHeight: 44,
    minWidth: 48,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.bordaForte,
    backgroundColor: cores.cartao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilulaAtiva: { backgroundColor: cores.texto, borderColor: cores.texto },
  textoPilula: { fontSize: 15, fontWeight: '600', color: cores.texto },
});

// O estudo já tem algo escrito (respostas, anotações, biblioteca ou resumo)?
function temConteudo(e: DadosEstudo) {
  const textos = [
    ...Object.values(e.respostas ?? {}),
    ...Object.values(e.anotacoes ?? {}),
    e.estudo,
    e.notasBiblia,
    e.notasBiblioteca,
    e.resumo,
  ];
  return textos.some((t) => t?.trim()) || !!e.trechosBiblioteca?.length || !!e.temas?.length;
}

function confirmar(mensagem: string) {
  // No navegador, a caixa de confirmação do próprio navegador; no celular nativo, segue sem perguntar
  return Platform.OS === 'web' ? window.confirm(mensagem) : true;
}
