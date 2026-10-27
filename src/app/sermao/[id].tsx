import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { modelos, nomesBloco, type TipoBloco } from '../../data/modelos';
import { exportarPdf } from '../../lib/pdf';
import { minutosEstimados, useSermao, useSermoes, type Bloco } from '../../store/sermoes';
import { cores } from '../../theme';

const tiposParaAdicionar: TipoBloco[] = ['topico', 'subtopico', 'versiculo', 'ilustracao', 'aplicacao', 'citacao'];

export default function EditorTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar, adicionarBloco, remover } = useSermoes();
  const [mostrandoTipos, setMostrandoTipos] = useState(false);

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

  return (
    <>
      <Stack.Screen options={{ title: sermao.titulo || 'Novo sermão' }} />
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={estilos.meta}>
          {modelo?.nome} · cerca de {minutosEstimados(sermao)} min
        </Text>

        <Cartao style={{ gap: 8 }}>
          <Rotulo>Título</Rotulo>
          <TextInput
            accessibilityLabel="Título do sermão"
            value={sermao.titulo}
            onChangeText={(titulo) => atualizar(sermao.id, (s) => ({ ...s, titulo }))}
            placeholder="Ex.: O amor que salva"
            placeholderTextColor={cores.textoSuave}
            style={[estilos.entrada, estilos.entradaTitulo]}
          />
          <Rotulo>Texto base</Rotulo>
          <TextInput
            accessibilityLabel="Texto base"
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
            rotulo={bloco.tipo === 'topico' ? `Tópico ${numerosTopico[i]}` : nomesBloco[bloco.tipo]}
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
              titulo="Estudar a passagem"
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

function BlocoEditor({ bloco, rotulo, onMudar, onSubir, onDescer, onApagar }: BlocoEditorProps) {
  const destaque =
    bloco.tipo === 'versiculo' || bloco.tipo === 'citacao'
      ? { backgroundColor: cores.apoioFundo }
      : bloco.tipo === 'palavra'
        ? { backgroundColor: cores.destaqueFundo }
        : null;
  return (
    <Cartao style={[{ gap: 6 }, destaque]}>
      <View style={estilos.cabecalhoBloco}>
        <Rotulo>{rotulo}</Rotulo>
        <View style={{ flexDirection: 'row' }}>
          <Acao rotulo="Subir bloco" simbolo="↑" onPress={onSubir} />
          <Acao rotulo="Descer bloco" simbolo="↓" onPress={onDescer} />
          <Acao rotulo="Apagar bloco" simbolo="×" onPress={onApagar} />
        </View>
      </View>
      <TextInput
        accessibilityLabel={rotulo}
        value={bloco.texto}
        onChangeText={onMudar}
        multiline
        placeholder="Escreva aqui"
        placeholderTextColor={cores.textoSuave}
        style={[estilos.entrada, { minHeight: 44 }, bloco.tipo === 'topico' && { fontWeight: '600' }]}
      />
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
  acao: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
