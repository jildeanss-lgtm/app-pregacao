import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TextoFormatado } from '../../components/TextoFormatado';
import { CampoCrescente } from '../../components/CampoCrescente';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { etapasDeEstudo, nomesEstudo } from '../../data/etapas';
import { perguntasDaEtapa } from '../../data/roteiro';
import { modelos, nomesBloco, type TipoBloco } from '../../data/modelos';
import { coresPregacao, estiloBloco, pontosDoQuadro, quebraNoTopo } from '../../estilo';
import { exportarPdf } from '../../lib/pdf';
import { minutosEstimados, useSermao, useSermoes, type Bloco } from '../../store/sermoes';
import { cores } from '../../theme';

// Blocos sempre à vista para adicionar, na ordem do JILDEAN
const tiposParaAdicionar: TipoBloco[] = [
  'topico',
  'quadro',
  'efeito',
  'versiculo',
  'quadroPerguntas',
  'aplicacao',
  'subtopico',
  'citacao',
];

export default function EditorTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar, adicionarBloco, remover, mudarEstudo } = useSermoes();
  const [vendoEstudo, setVendoEstudo] = useState(true);

  if (!sermao) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: cores.textoSuave }}>Sermão não encontrado.</Text>
      </View>
    );
  }

  const mudarBloco = (blocoId: string, texto: string) =>
    atualizar(sermao.id, (s) => ({ ...s, blocos: s.blocos.map((b) => (b.id === blocoId ? { ...b, texto } : b)) }));

  const mover = (indice: number, direcao: -1 | 1) =>
    atualizar(sermao.id, (s) => {
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= s.blocos.length) return s;
      const blocos = [...s.blocos];
      [blocos[indice], blocos[alvo]] = [blocos[alvo], blocos[indice]];
      return { ...s, blocos };
    });

  const apagarBloco = (blocoId: string) =>
    atualizar(sermao.id, (s) => ({ ...s, blocos: s.blocos.filter((b) => b.id !== blocoId) }));

  const numerosTopico = sermao.blocos.reduce<number[]>(
    (acc, b) => [...acc, (acc.at(-1) ?? 0) + (b.tipo === 'topico' ? 1 : 0)],
    [],
  );
  const modelo = modelos.find((m) => m.id === sermao.modelo);
  // O que foi anotado nas etapas de estudo fica à vista enquanto o sermão é montado
  const anotacoes = etapasDeEstudo
    .map((e) => {
      const respostas = perguntasDaEtapa(e, sermao.textoBase, sermao.genero)
        .flatMap((g) => g.perguntas)
        .map((q) => ({
          pergunta: e === 'interpretacao' ? q.pergunta.split(':')[0] : q.pergunta,
          resposta: (sermao.respostas?.[q.pergunta] ?? q.padrao ?? '').trim(),
        }))
        .filter((q) => q.resposta)
        .map((q) => `${q.pergunta} ${q.resposta}`);
      const nota = (sermao.anotacoes?.[e] ?? (e === 'observacao' ? sermao.estudo : '') ?? '').trim();
      return { nome: nomesEstudo[e], texto: [...respostas, nota].filter(Boolean).join('\n') };
    })
    .filter((a) => a.texto);

  return (
    <>
      <Stack.Screen options={{ title: sermao.titulo || 'Novo sermão' }} />
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={estilos.meta}>
          {modelo?.nome} · cerca de {minutosEstimados(sermao)} min
        </Text>

        {sermao.iaPreparando ? (
          <Cartao style={estilos.avisoIA}>
            <Text style={estilos.textoAvisoIA}>
              A IA está escrevendo o objetivo e a introdução a partir do seu estudo. Isso leva cerca de 1 minuto.
            </Text>
          </Cartao>
        ) : sermao.iaErro ? (
          <Cartao style={estilos.avisoIA}>
            <Text style={estilos.textoAvisoIA}>{sermao.iaErro}</Text>
            <Botao
              titulo="Fechar aviso"
              variante="contorno"
              onPress={() => atualizar(sermao.id, (x) => ({ ...x, iaErro: undefined }))}
            />
          </Cartao>
        ) : null}

        {anotacoes.length > 0 && (
          <Cartao style={{ gap: 8, backgroundColor: cores.apoioFundo }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: vendoEstudo }}
              onPress={() => setVendoEstudo((v) => !v)}
              style={estilos.cabecalhoBloco}
            >
              <Rotulo>Seu estudo</Rotulo>
              <Text style={estilos.meta}>{vendoEstudo ? 'Esconder' : 'Mostrar'}</Text>
            </Pressable>
            {vendoEstudo &&
              anotacoes.map((a) => (
                <View key={a.nome} style={{ gap: 2 }}>
                  <Text style={estilos.tituloEstudo}>{a.nome}</Text>
                  <Text selectable style={estilos.textoEstudo}>
                    {a.texto}
                  </Text>
                </View>
              ))}
          </Cartao>
        )}

        <Cartao style={{ gap: 8 }}>
          <View style={estilos.linha}>
            <View style={{ flex: 2, gap: 4 }}>
              <Rotulo>Culto</Rotulo>
              <TextInput
                accessibilityLabel="Culto"
                value={sermao.culto ?? ''}
                onChangeText={(culto) => atualizar(sermao.id, (s) => ({ ...s, culto }))}
                placeholder="Ex.: Culto de Santa Ceia"
                placeholderTextColor={cores.textoSuave}
                style={estilos.entrada}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Rotulo>Data</Rotulo>
              <TextInput
                accessibilityLabel="Data"
                value={sermao.data ?? ''}
                onChangeText={(data) => atualizar(sermao.id, (s) => ({ ...s, data }))}
                placeholder="dd/mm/aaaa"
                placeholderTextColor={cores.textoSuave}
                style={estilos.entrada}
              />
            </View>
          </View>
          <Rotulo>Título</Rotulo>
          <TextInput
            accessibilityLabel="Título do sermão"
            value={sermao.titulo}
            onChangeText={(titulo) => atualizar(sermao.id, (s) => ({ ...s, titulo }))}
            placeholder="Ex.: O amor que salva"
            placeholderTextColor={cores.textoSuave}
            style={[estilos.entrada, estilos.entradaTitulo]}
          />
          <Rotulo>Texto referência</Rotulo>
          <TextInput
            accessibilityLabel="Texto referência"
            value={sermao.textoBase}
            onChangeText={(textoBase) => atualizar(sermao.id, (s) => ({ ...s, textoBase }))}
            placeholder="Ex.: João 3:16"
            placeholderTextColor={cores.textoSuave}
            style={estilos.entrada}
          />
        </Cartao>

        {sermao.blocos.map((bloco, i) => (
          <BlocoEditor
            key={bloco.id}
            bloco={bloco}
            rotulo={bloco.rotulo ?? (bloco.tipo === 'topico' ? `Tópico ${numerosTopico[i]}` : nomesBloco[bloco.tipo])}
            onMudar={(t) => mudarBloco(bloco.id, t)}
            onSubir={() => mover(i, -1)}
            onDescer={() => mover(i, 1)}
            onApagar={() => apagarBloco(bloco.id)}
          />
        ))}

        <Cartao style={{ gap: 8 }}>
          <Rotulo>+ Bloco</Rotulo>
          <View style={estilos.linha}>
            {tiposParaAdicionar.map((tipo) => {
              const e = estiloBloco[tipo];
              return (
                <Pressable
                  key={tipo}
                  accessibilityRole="button"
                  accessibilityLabel={`Adicionar ${nomesBloco[tipo]}`}
                  onPress={() => adicionarBloco(sermao.id, tipo)}
                  style={[estilos.chipBloco, e.fundo ? { backgroundColor: e.fundo, borderColor: e.fundo } : null]}
                >
                  <Text
                    style={[
                      estilos.textoChip,
                      { color: e.topo?.cor ?? e.cor, fontStyle: e.topo?.italico || e.italico ? 'italic' : 'normal' },
                      // Texto (subtópico e pontos) em caixa alta e azul, como o Jildean pediu
                      tipo === 'quadro' && { color: coresPregacao.frase, fontWeight: '800' },
                    ]}
                  >
                    + {tipo === 'quadro' ? nomesBloco[tipo].toUpperCase() : nomesBloco[tipo]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Cartao>
        <Botao
          titulo="Estudar no hebraico e grego"
          variante="contorno"
          onPress={() => {
            mudarEstudo((e) =>
              e.textoBase === sermao.textoBase ? e : { textoBase: sermao.textoBase, genero: sermao.genero },
            );
            router.push('/estudo');
          }}
        />

        <Botao titulo="Pregar" onPress={() => router.push(`/pregar/${sermao.id}`)} />
        <Botao titulo="Exportar PDF" variante="contorno" onPress={() => exportarPdf(sermao)} />
        <Botao
          titulo="Apagar sermão"
          variante="perigo"
          onPress={() => {
            remover(sermao.id);
            router.back();
          }}
        />
      </ScrollView>
    </>
  );
}

type BlocoEditorProps = {
  bloco: Bloco;
  rotulo: string;
  onMudar: (texto: string) => void;
  onSubir: () => void;
  onDescer: () => void;
  onApagar: () => void;
};

const dicas: Partial<Record<TipoBloco, string>> = {
  pontos: 'Um ponto por linha',
  versiculo: 'Ex.: 1 Tessalonicenses 5:21 - *Examinai* *tudo*. *Retende* o *bem*',
};

function BlocoEditor({ bloco, rotulo, onMudar, onSubir, onDescer, onApagar }: BlocoEditorProps) {
  const [editando, setEditando] = useState(!bloco.texto.trim());
  const [selecao, setSelecao] = useState({ start: 0, end: 0 });
  const [campo, setCampo] = useState(0);

  // O quadro é editado em linhas separadas: subtópico em cima e um campo por ponto
  const ehQuadro = !!estiloBloco[bloco.tipo].quadro;
  const nomeItem = estiloBloco[bloco.tipo].nomeItem ?? 'Ponto';
  const nomeTopo = estiloBloco[bloco.tipo].topo?.nome ?? 'Subtópico';
  const linhas = bloco.texto.split('\n');
  const campos = ehQuadro
    ? Array.from({ length: Math.max(pontosDoQuadro + 1, linhas.length) }, (_, i) => linhas[i] ?? '')
    : [bloco.texto];
  const mudarCampo = (i: number, texto: string) => {
    if (!ehQuadro) return onMudar(texto);
    const novos = [...campos];
    // No subtópico o Enter abre outra linha; nos pontos não
    novos[i] = i === 0 ? texto.replace(/\n/g, quebraNoTopo) : texto.replace(/\n/g, ' ');
    onMudar(novos.join('\n'));
  };

  // Coloca *asteriscos* em volta do trecho selecionado, marcando como palavra-chave
  const destacar = () => {
    const { start, end } = selecao;
    if (start === end) return;
    const t = campos[campo] ?? '';
    mudarCampo(campo, `${t.slice(0, start)}*${t.slice(start, end)}*${t.slice(end)}`);
  };

  return (
    <Cartao style={{ gap: 6 }}>
      <View style={estilos.cabecalhoBloco}>
        <Rotulo>{rotulo}</Rotulo>
        <View style={{ flexDirection: 'row' }}>
          <Acao rotulo="Subir bloco" simbolo="↑" onPress={onSubir} />
          <Acao rotulo="Descer bloco" simbolo="↓" onPress={onDescer} />
          <Acao rotulo="Apagar bloco" simbolo="×" onPress={onApagar} />
        </View>
      </View>
      {editando ? (
        <>
          {ehQuadro ? (
            <View style={estilos.quadro}>
              {campos.map((valor, i) =>
                i === 0 ? (
                  <CampoCrescente
                    key={i}
                    accessibilityLabel={nomeTopo}
                    value={valor.split(quebraNoTopo).join('\n')}
                    onChangeText={(t) => mudarCampo(i, t)}
                    onFocus={() => setCampo(i)}
                    onSelectionChange={(e) => setSelecao(e.nativeEvent.selection)}
                    placeholder={`${nomeTopo} (Enter para outra linha)`}
                    placeholderTextColor={cores.textoSuave}
                    alturaMinima={40}
                    style={[estilos.entrada, estilos.topoQuadro]}
                  />
                ) : (
                  <TextInput
                    key={i}
                    accessibilityLabel={i === 0 ? nomeTopo : `${nomeItem} ${i}`}
                    value={valor}
                    onChangeText={(t) => mudarCampo(i, t)}
                    onFocus={() => setCampo(i)}
                    onSelectionChange={(e) => setSelecao(e.nativeEvent.selection)}
                    placeholder={i === 0 ? nomeTopo : `${nomeItem} ${i}`}
                    placeholderTextColor={cores.textoSuave}
                    style={[estilos.entrada, estilos.linhaQuadro, estilos.itemQuadro]}
                  />
                ),
              )}
            </View>
          ) : (
            <CampoCrescente
              accessibilityLabel={rotulo}
              value={bloco.texto}
              onChangeText={onMudar}
              onSelectionChange={(e) => setSelecao(e.nativeEvent.selection)}
              multiline
              autoFocus={!!bloco.texto}
              placeholder={
                bloco.dica ?? dicas[bloco.tipo] ?? 'Escreva aqui. Use *asteriscos* para destacar palavras-chave'
              }
              placeholderTextColor={cores.textoSuave}
              style={estilos.entrada}
            />
          )}
          <View style={estilos.linha}>
            <Botao titulo="Destacar seleção" variante="contorno" onPress={destacar} />
            {ehQuadro && (
              <Botao titulo={`+ ${nomeItem}`} variante="contorno" onPress={() => onMudar(`${campos.join('\n')}\n`)} />
            )}
            {bloco.texto.trim() ? <Botao titulo="Pronto" onPress={() => setEditando(false)} /> : null}
          </View>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${rotulo}`}
          onPress={() => setEditando(true)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <TextoFormatado tipo={bloco.tipo} texto={bloco.texto} semMoldura />
        </Pressable>
      )}
    </Cartao>
  );
}

function Acao({ rotulo, simbolo, onPress }: { rotulo: string; simbolo: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} onPress={onPress} style={estilos.acao}>
      <Text style={{ fontSize: 18, color: cores.textoSuave }}>{simbolo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  avisoIA: { gap: 8, borderColor: cores.destaque, borderWidth: 1 },
  textoAvisoIA: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: cores.destaqueEscuro },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48 },
  meta: { fontSize: 13, color: cores.textoSuave },
  entrada: { fontSize: 16, color: cores.texto, paddingVertical: 6 },
  entradaTitulo: { fontSize: 20, fontWeight: '700' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipBloco: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    justifyContent: 'center',
  },
  textoChip: { fontSize: 15, fontWeight: '600' },
  cabecalhoBloco: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Corpo sem molduras: o subtópico em negrito e os pontos recuados embaixo
  quadro: { gap: 2 },
  linhaQuadro: { minHeight: 40 },
  topoQuadro: { fontWeight: '700' },
  itemQuadro: { paddingLeft: 16 },
  tituloEstudo: { fontSize: 13, fontWeight: '700', color: cores.apoioTexto },
  textoEstudo: { fontSize: 15, lineHeight: 21, color: cores.texto },
  acao: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
