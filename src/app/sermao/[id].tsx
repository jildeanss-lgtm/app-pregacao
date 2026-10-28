import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Etapas } from '../../components/Etapas';
import { TextoFormatado } from '../../components/TextoFormatado';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { ETAPA_MONTAGEM, etapas, etapasDeEstudo } from '../../data/etapas';
import { perguntasDaEtapa } from '../../data/roteiro';
import { modelos, nomesBloco, type TipoBloco } from '../../data/modelos';
import { estiloBloco, pontosDoQuadro } from '../../estilo';
import { exportarPdf } from '../../lib/pdf';
import { minutosEstimados, useSermao, useSermoes, type Bloco } from '../../store/sermoes';
import { cores } from '../../theme';

const tiposParaAdicionar: TipoBloco[] = [
  'topico',
  'quadro',
  'efeito',
  'versiculo',
  'subtopico',
  'citacao',
  'aplicacao',
  'quadroPerguntas',
  'frase',
  'pontos',
  'explicacao',
  'exemplo',
  'ilustracao',
];

export default function EditorTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar, adicionarBloco, remover } = useSermoes();
  const [mostrandoTipos, setMostrandoTipos] = useState(false);
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
    .map((e, i) => {
      const respostas = perguntasDaEtapa(e, sermao.textoBase, sermao.genero)
        .flatMap((g) => g.perguntas)
        .map((q) => ({
          pergunta: e === 'interpretacao' ? q.pergunta.split(':')[0] : q.pergunta,
          resposta: (sermao.respostas?.[q.pergunta] ?? q.padrao ?? '').trim(),
        }))
        .filter((q) => q.resposta)
        .map((q) => `${q.pergunta} ${q.resposta}`);
      const nota = (sermao.anotacoes?.[e] ?? (e === 'observacao' ? sermao.estudo : '') ?? '').trim();
      return { nome: etapas[i + 1].nome, texto: [...respostas, nota].filter(Boolean).join('\n') };
    })
    .filter((a) => a.texto);

  return (
    <>
      <Stack.Screen options={{ title: sermao.titulo || 'Novo sermão' }} />
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Etapas sermaoId={sermao.id} atual={ETAPA_MONTAGEM} />
        <Text style={estilos.meta}>
          {modelo?.nome} · cerca de {minutosEstimados(sermao)} min
        </Text>

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

        {mostrandoTipos ? (
          <Cartao style={{ gap: 8 }}>
            <Rotulo>Adicionar bloco</Rotulo>
            <View style={estilos.linha}>
              {tiposParaAdicionar.map((tipo) => (
                <Botao
                  key={tipo}
                  titulo={nomesBloco[tipo]}
                  variante="contorno"
                  onPress={() => {
                    adicionarBloco(sermao.id, tipo);
                    setMostrandoTipos(false);
                  }}
                />
              ))}
            </View>
          </Cartao>
        ) : (
          <View style={estilos.linha}>
            <Botao titulo="+ Bloco" variante="contorno" onPress={() => setMostrandoTipos(true)} />
            <Botao
              titulo="Abrir na Bíblia"
              variante="contorno"
              onPress={() => router.push({ pathname: '/biblia', params: { sermao: sermao.id } })}
            />
          </View>
        )}

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
    novos[i] = texto.replace(/\n/g, ' ');
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
              {campos.map((valor, i) => (
                <TextInput
                  key={i}
                  accessibilityLabel={i === 0 ? nomeTopo : `${nomeItem} ${i}`}
                  value={valor}
                  onChangeText={(t) => mudarCampo(i, t)}
                  onFocus={() => setCampo(i)}
                  onSelectionChange={(e) => setSelecao(e.nativeEvent.selection)}
                  placeholder={i === 0 ? nomeTopo : `${nomeItem} ${i}`}
                  placeholderTextColor={cores.textoSuave}
                  style={[estilos.entrada, estilos.linhaQuadro, i === 0 ? estilos.topoQuadro : i > 1 && estilos.divisoria]}
                />
              ))}
            </View>
          ) : (
            <TextInput
              accessibilityLabel={rotulo}
              value={bloco.texto}
              onChangeText={onMudar}
              onSelectionChange={(e) => setSelecao(e.nativeEvent.selection)}
              multiline
              autoFocus={!!bloco.texto}
              placeholder={bloco.dica ?? dicas[bloco.tipo] ?? 'Escreva aqui. Use *asteriscos* para destacar palavras-chave'}
              placeholderTextColor={cores.textoSuave}
              style={[estilos.entrada, { minHeight: 44 }]}
            />
          )}
          <View style={estilos.linha}>
            <Botao titulo="Destacar seleção" variante="contorno" onPress={destacar} />
            {ehQuadro && <Botao titulo={`+ ${nomeItem}`} variante="contorno" onPress={() => onMudar(`${campos.join('\n')}\n`)} />}
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
          <TextoFormatado tipo={bloco.tipo} texto={bloco.texto} />
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
  conteudo: { padding: 20, gap: 12, paddingBottom: 48 },
  meta: { fontSize: 13, color: cores.textoSuave },
  entrada: { fontSize: 16, color: cores.texto, paddingVertical: 6 },
  entradaTitulo: { fontSize: 20, fontWeight: '700' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cabecalhoBloco: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quadro: { borderWidth: 1.5, borderColor: '#000000', borderRadius: 6, overflow: 'hidden' },
  linhaQuadro: { paddingHorizontal: 10, minHeight: 44 },
  topoQuadro: { backgroundColor: '#F1EFE9', borderBottomWidth: 1.5, borderColor: '#000000' },
  divisoria: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#999999' },
  tituloEstudo: { fontSize: 13, fontWeight: '700', color: cores.apoioTexto },
  textoEstudo: { fontSize: 15, lineHeight: 21, color: cores.texto },
  acao: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
