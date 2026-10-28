import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../components/ui';
import {
  modelos,
  montarBlocos,
  opcoesIntroducao,
  verbosObjetivo,
  type Modelo,
  type OpcaoIntroducao,
} from '../data/modelos';
import { generos, sugerirGenero, type Genero } from '../data/roteiro';
import { useSermoes } from '../store/sermoes';
import { cores } from '../theme';

function hoje() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function NovoSermaoTela() {
  const { criar } = useSermoes();
  const [culto, setCulto] = useState('');
  const [data, setData] = useState(hoje);
  const [titulo, setTitulo] = useState('');
  const [textoBase, setTextoBase] = useState('');
  const [modelo, setModelo] = useState<Modelo>('expositivo');
  const [objetivo, setObjetivo] = useState('');
  const [introducao, setIntroducao] = useState<OpcaoIntroducao>('citacoes');
  const [generoEscolhido, setGenero] = useState<Genero>();
  const [comSaudacao, setComSaudacao] = useState(true);

  const sugerido = sugerirGenero(textoBase);
  const genero = generoEscolhido ?? sugerido;

  const usarVerbo = (verbo: string) =>
    setObjetivo((o) => {
      const linhas = o.split('\n').filter((l) => l.trim());
      return [...linhas, `*${verbo.toUpperCase()}* `].join('\n');
    });

  const criarSermao = () => {
    const s = criar({
      titulo,
      textoBase,
      modelo,
      culto,
      data,
      genero,
      etapa: 0,
      blocos: montarBlocos({ modelo, textoBase, objetivo, introducao, comSaudacao }),
    });
    router.replace(`/estudo/${s.id}`);
  };

  return (
    <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      <Cartao style={{ gap: 8 }}>
        <View style={estilos.linha}>
          <View style={{ flex: 2, gap: 4 }}>
            <Rotulo>Culto</Rotulo>
            <TextInput
              accessibilityLabel="Culto"
              value={culto}
              onChangeText={setCulto}
              placeholder="Ex.: Culto de Santa Ceia"
              placeholderTextColor={cores.textoSuave}
              style={estilos.entrada}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Rotulo>Data</Rotulo>
            <TextInput
              accessibilityLabel="Data"
              value={data}
              onChangeText={setData}
              placeholder="dd/mm/aaaa"
              placeholderTextColor={cores.textoSuave}
              style={estilos.entrada}
            />
          </View>
        </View>
        <Rotulo>Título</Rotulo>
        <TextInput
          accessibilityLabel="Título do sermão"
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Pode deixar para depois"
          placeholderTextColor={cores.textoSuave}
          style={[estilos.entrada, { fontSize: 18, fontWeight: '700' }]}
        />
        <Rotulo>Texto referência</Rotulo>
        <TextInput
          accessibilityLabel="Texto referência"
          value={textoBase}
          onChangeText={setTextoBase}
          placeholder="Ex.: Êxodo 8"
          placeholderTextColor={cores.textoSuave}
          style={estilos.entrada}
        />
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>Tipo de sermão</Rotulo>
        {modelos.map((m) => (
          <Escolha key={m.id} ativo={modelo === m.id} titulo={m.nome} descricao={m.descricao} onPress={() => setModelo(m.id)} />
        ))}
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>Objetivo desta lição</Rotulo>
        <View style={estilos.linha}>
          {verbosObjetivo.map((v) => (
            <Botao key={v} titulo={v} variante="contorno" onPress={() => usarVerbo(v)} />
          ))}
        </View>
        <TextInput
          accessibilityLabel="Objetivo"
          value={objetivo}
          onChangeText={setObjetivo}
          multiline
          placeholder="Toque num verbo e complete. Ex.: MOSTRAR que Deus age mesmo quando o coração endurece"
          placeholderTextColor={cores.textoSuave}
          style={[estilos.entrada, { minHeight: 64 }]}
        />
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>Introdução</Rotulo>
        {opcoesIntroducao.map((o) => (
          <Escolha
            key={o.id}
            ativo={introducao === o.id}
            titulo={o.nome}
            descricao={o.dica}
            onPress={() => setIntroducao(o.id)}
          />
        ))}
      </Cartao>

      <Cartao style={{ gap: 8 }}>
        <Rotulo>Gênero literário do texto</Rotulo>
        {sugerido && !generoEscolhido ? (
          <Text style={estilos.suave}>Sugestão pelo livro: {generos.find((g) => g.id === sugerido)?.nome}</Text>
        ) : null}
        <View style={estilos.linha}>
          {generos.map((g) => (
            <Pressable
              key={g.id}
              accessibilityRole="button"
              accessibilityState={{ selected: genero === g.id }}
              onPress={() => setGenero(g.id)}
              style={[estilos.pilula, genero === g.id && estilos.pilulaAtiva]}
            >
              <Text style={[estilos.textoPilula, genero === g.id && { color: '#FFFFFF' }]}>{g.nome}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={estilos.suave}>Usado no estudo do texto, na etapa de observação.</Text>
      </Cartao>

      <Cartao style={[estilos.linha, { alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo}>Incluir minha saudação</Text>
          <Text style={estilos.suave}>Louvado seja o nome de Jesus, gratidão, abra sua Bíblia, Mateus 13:19</Text>
        </View>
        <Switch
          accessibilityLabel="Incluir minha saudação"
          value={comSaudacao}
          onValueChange={setComSaudacao}
          trackColor={{ true: cores.destaque, false: cores.bordaForte }}
        />
      </Cartao>

      <Botao titulo="Criar sermão" onPress={criarSermao} />
    </ScrollView>
  );
}

function Escolha({ ativo, titulo, descricao, onPress }: { ativo: boolean; titulo: string; descricao: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
      onPress={onPress}
      style={[estilos.escolha, ativo && estilos.escolhaAtiva]}
    >
      <Text style={estilos.titulo}>
        {ativo ? '◉ ' : '○ '}
        {titulo}
      </Text>
      <Text style={estilos.suave}>{descricao}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 12, paddingBottom: 48 },
  entrada: { fontSize: 16, color: cores.texto, paddingVertical: 6 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  titulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  suave: { fontSize: 13, color: cores.textoSuave, marginTop: 2 },
  escolha: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: cores.borda, minHeight: 44 },
  escolhaAtiva: { borderColor: cores.destaque, backgroundColor: cores.destaqueFundo },
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
