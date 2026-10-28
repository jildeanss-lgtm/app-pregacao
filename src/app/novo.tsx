import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../components/ui';
import { BarraAbas } from '../components/BarraAbas';
import {
  modelos,
  montarBlocos,
  opcoesIntroducao,
  objetivosSermao,
  type Modelo,
  type OpcaoIntroducao,
} from '../data/modelos';
import { generos, sugerirGenero, type Genero } from '../data/roteiro';
import { ETAPA_MONTAGEM } from '../data/etapas';
import { lerChave, prepararSermao, textoDosVersiculos } from '../ia/estudo';
import { useSermoes } from '../store/sermoes';
import { cores } from '../theme';

function hoje() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function NovoSermaoTela() {
  const { criar, atualizar, estudo } = useSermoes();
  const [criando, setCriando] = useState(false);
  const [culto, setCulto] = useState('');
  const [data, setData] = useState(hoje);
  const [titulo, setTitulo] = useState('');
  // O texto estudado nas abas Bíblia e Estudo já vem preenchido
  const [textoBase, setTextoBase] = useState(estudo.textoBase);
  const [modelo, setModelo] = useState<Modelo>('expositivo');
  const [objetivo, setObjetivo] = useState('');
  const [tipoObjetivo, setTipoObjetivo] = useState('Pregação');
  const [introducao, setIntroducao] = useState<OpcaoIntroducao>('citacoes');
  const [generoEscolhido, setGenero] = useState<Genero>();
  // O corpo começa em branco: a saudação só entra se for pedida
  const [comSaudacao, setComSaudacao] = useState(false);
  // Temas sugeridos pela IA no estudo deste texto
  const temas = textoBase === estudo.textoBase ? (estudo.temas ?? []) : [];

  const sugerido = sugerirGenero(textoBase);
  const genero = generoEscolhido ?? sugerido;

  const criarSermao = async () => {
    if (criando) return;
    setCriando(true);
    const intro = opcoesIntroducao.find((o) => o.id === introducao)!;
    const doEstudo = textoBase === estudo.textoBase;
    const [versos, chave] = await Promise.all([textoDosVersiculos(textoBase).catch(() => ''), lerChave()]);
    const s = criar({
      titulo,
      textoBase,
      modelo,
      culto,
      data,
      genero,
      etapa: ETAPA_MONTAGEM,
      // O estudo feito para este texto vai junto e aparece em "Seu estudo" na montagem
      ...(doEstudo
        ? { respostas: estudo.respostas, anotacoes: estudo.anotacoes, notasBiblioteca: estudo.notasBiblioteca }
        : {}),
      blocos: montarBlocos({ modelo, textoBase, objetivo, tipoObjetivo, versos, introducao, comSaudacao }),
    });
    router.replace(`/sermao/${s.id}`);
    if (!chave || !textoBase.trim()) return;

    // Com a chave da IA, o objetivo e a introdução são escritos logo depois, sem segurar a tela
    atualizar(s.id, (x) => ({ ...x, iaPreparando: true, iaErro: undefined }));
    try {
      const r = await prepararSermao(chave, {
        textoBase,
        titulo,
        modelo: modelos.find((m) => m.id === modelo)?.nome ?? modelo,
        tipoObjetivo,
        introducao: intro,
        respostas: doEstudo ? estudo.respostas : undefined,
      });
      atualizar(s.id, (x) => ({
        ...x,
        iaPreparando: false,
        // Só preenche o que ainda está em branco, para não apagar o que o pregador já escreveu
        blocos: x.blocos.map((b) =>
          b.texto.trim()
            ? b
            : b.tipo === 'objetivo' && r.objetivo
              ? { ...b, texto: r.objetivo }
              : b.tipo === 'introducao' && r.introducao
                ? { ...b, texto: r.introducao }
                : b,
        ),
      }));
    } catch (e) {
      atualizar(s.id, (x) => ({
        ...x,
        iaPreparando: false,
        iaErro: e instanceof Error ? e.message : 'A IA não conseguiu escrever o objetivo e a introdução.',
      }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
          {temas.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={estilos.suave}>Temas sugeridos pelo estudo. Toque num deles para usar como título:</Text>
              {temas.map((t) => (
                <Escolha key={t} ativo={titulo === t} titulo={t} onPress={() => setTitulo(t)} />
              ))}
            </View>
          )}
          <Rotulo>Texto referência</Rotulo>
          <TextInput
            accessibilityLabel="Texto referência"
            value={textoBase}
            onChangeText={setTextoBase}
            placeholder="Ex.: Êxodo 8 (ou toque no versículo na aba Bíblia)"
            placeholderTextColor={cores.textoSuave}
            style={estilos.entrada}
          />
        </Cartao>

        <Cartao style={{ gap: 8 }}>
          <Rotulo>Tipo de sermão</Rotulo>
          {modelos.map((m) => (
            <Escolha
              key={m.id}
              ativo={modelo === m.id}
              titulo={m.nome}
              descricao={m.descricao}
              onPress={() => setModelo(m.id)}
            />
          ))}
        </Cartao>

        <Cartao style={{ gap: 8 }}>
          <Rotulo>Objetivo do sermão</Rotulo>
          <View style={estilos.linha}>
            {objetivosSermao.map((o) => (
              <Pressable
                key={o}
                accessibilityRole="radio"
                accessibilityState={{ checked: tipoObjetivo === o }}
                onPress={() => setTipoObjetivo(o)}
                style={[estilos.pilula, tipoObjetivo === o && estilos.pilulaAtiva]}
              >
                <Text style={[estilos.textoPilula, tipoObjetivo === o && { color: '#FFFFFF' }]}>{o}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            accessibilityLabel="Objetivo"
            value={objetivo}
            onChangeText={setObjetivo}
            multiline
            placeholder="Opcional. Ex.: mostrar que Deus age mesmo quando o coração endurece"
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
            <Text style={estilos.suave}>Definido pelo livro: {generos.find((g) => g.id === sugerido)?.nome}</Text>
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

        <Botao titulo={criando ? 'Criando...' : 'Criar sermão'} onPress={criarSermao} />
      </ScrollView>
      <BarraAbas atual="/" />
    </View>
  );
}

function Escolha({
  ativo,
  titulo,
  descricao,
  onPress,
}: {
  ativo: boolean;
  titulo: string;
  descricao?: string;
  onPress: () => void;
}) {
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
      {descricao ? <Text style={estilos.suave}>{descricao}</Text> : null}
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
