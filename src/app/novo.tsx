import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../components/ui';
import { BarraAbas } from '../components/BarraAbas';
import {
  camposCapa,
  inicioObjetivo,
  modelos,
  montarBlocos,
  opcoesIntroducao,
  saudacoes,
  objetivosSermao,
  type Modelo,
  type OpcaoIntroducao,
} from '../data/modelos';
import { generos, sugerirGenero, type Genero } from '../data/roteiro';
import { ETAPA_MONTAGEM } from '../data/etapas';
import { lerChave, prepararSermao, textoDosVersiculos } from '../ia/estudo';
import { lerSaudacao } from '../store/saudacoes';
import { trocarCapa, trocarSaudacao, useSermao, useSermoes, type Sermao } from '../store/sermoes';
import { cores, larguraConteudo } from '../theme';

function hoje() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const ROTULO_OBJETIVO = 'Objetivo do sermão: ';
const ROTULO_INTRODUCAO = 'Introdução: ';
// Saudação que já está no sermão, quando ele foi criado antes de o app guardar qual foi escolhida
const ATUAL = 'atual';

// O que foi escolhido ao criar o sermão, lido dos blocos dele, para abrir esta tela de novo e mudar
function escolhasDoSermao(s: Sermao) {
  const obj = s.blocos.find((b) => b.tipo === 'objetivo');
  const intro = s.blocos.find((b) => b.tipo === 'introducao');
  const ateTexto = s.blocos.findIndex((b) => b.tipo === 'versiculo' && b.rotulo === 'Texto');
  const temSaudacao = ateTexto > 0 && s.blocos.slice(0, ateTexto).some((b) => b.tipo !== 'objetivo');
  return {
    tipoObjetivo: obj?.rotulo?.startsWith(ROTULO_OBJETIVO) ? obj.rotulo.slice(ROTULO_OBJETIVO.length) : '',
    objetivo:
      obj?.texto.replace(/^(O \*OBJETIVO\* deste \*SERMÃO\* é|Os \*OBJETIVOS\* desta \*LIÇÃO\* são):\n/, '') ?? '',
    // Sermões novos guardam a opção pela dica da caixa; os antigos, pelo nome dela
    introducao: opcoesIntroducao.find(
      (o) => intro?.rotulo === `${ROTULO_INTRODUCAO}${o.nome}` || intro?.dica === o.dica,
    )?.id,
    saudacao: s.saudacao ?? (temSaudacao ? ATUAL : ''),
  };
}

export default function NovoSermaoTela() {
  // Com id, a tela abre um sermão já criado para mudar os dados e a saudação
  const { id } = useLocalSearchParams<{ id?: string }>();
  const original = useSermao(id);
  const [inicio] = useState(() => (original ? escolhasDoSermao(original) : undefined));
  const { criar, atualizar, estudo } = useSermoes();
  const [criando, setCriando] = useState(false);
  const [culto, setCulto] = useState(original?.culto ?? '');
  const [data, setData] = useState(original ? (original.data ?? '') : hoje);
  const [titulo, setTitulo] = useState(original?.titulo ?? '');
  // O texto estudado nas abas Bíblia e Estudo já vem preenchido
  const [textoBase, setTextoBase] = useState(original?.textoBase ?? estudo.textoBase);
  const [modelo, setModelo] = useState<Modelo>(original?.modelo ?? 'expositivo');
  // Três objetivos, um por linha (como no quadro do Objetivo no sermão)
  const [objetivo, setObjetivo] = useState(inicio?.objetivo ?? '');
  const linhasObjetivo = objetivo.split('\n');
  const camposObjetivo = Array.from({ length: Math.max(3, linhasObjetivo.length) }, (_, i) => linhasObjetivo[i] ?? '');
  const mudarObjetivo = (i: number, t: string) =>
    setObjetivo(camposObjetivo.map((l, j) => (j === i ? t.replace(/\n/g, ' ') : l)).join('\n'));
  // Sem as linhas deixadas em branco
  const objetivos = linhasObjetivo
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
  const [tipoObjetivo, setTipoObjetivo] = useState(inicio?.tipoObjetivo || 'Pregação');
  // Capa do tipo de sermão (só a Aula EBD tem campos por enquanto)
  const [capa, setCapa] = useState<Record<string, string>>(original?.capa ?? {});
  const campos = camposCapa[tipoObjetivo];
  const ehEBD = tipoObjetivo === 'Aula EBD';
  const [introducao, setIntroducao] = useState<OpcaoIntroducao>(inicio?.introducao ?? 'citacoes');
  const [generoEscolhido, setGenero] = useState<Genero | undefined>(original?.genero);
  // O corpo começa em branco: a saudação só entra se for pedida
  const [saudacao, setSaudacao] = useState(inicio?.saudacao ?? '');

  // Sermão já criado: muda só o que foi mexido aqui, sem apagar o que já foi escrito nos blocos
  const salvarAlteracoes = async () => {
    if (!original || !inicio || criando) return;
    setCriando(true);
    const novaSaudacao = saudacao !== inicio.saudacao ? (saudacao ? await lerSaudacao(saudacao) : undefined) : null;
    const intro = opcoesIntroducao.find((o) => o.id === introducao)!;
    atualizar(original.id, (s) => {
      let blocos = s.blocos;
      if (objetivo !== inicio.objetivo || tipoObjetivo !== (inicio.tipoObjetivo || 'Pregação'))
        blocos = blocos.map((b) =>
          b.tipo === 'objetivo'
            ? {
                ...b,
                rotulo: `${ROTULO_OBJETIVO}${tipoObjetivo}`,
                texto: objetivos ? `${inicioObjetivo(tipoObjetivo)}${objetivos}` : '',
              }
            : b,
        );
      if (tipoObjetivo !== (inicio.tipoObjetivo || 'Pregação') || JSON.stringify(capa) !== JSON.stringify(s.capa ?? {}))
        blocos = trocarCapa(blocos, tipoObjetivo, capa);
      if (introducao !== inicio.introducao)
        blocos = blocos.map((b) =>
          b.tipo === 'introducao'
            ? {
                ...b,
                rotulo: b.rotulo?.startsWith(ROTULO_INTRODUCAO) ? `${ROTULO_INTRODUCAO}${intro.nome}` : b.rotulo,
                dica: intro.dica,
              }
            : b,
        );
      if (novaSaudacao !== null) blocos = trocarSaudacao(blocos, novaSaudacao, textoBase);
      return {
        ...s,
        culto,
        data,
        titulo,
        textoBase,
        modelo,
        genero,
        saudacao: saudacao === ATUAL ? s.saudacao : saudacao,
        capa,
        blocos,
      };
    });
    router.back();
  };
  // Temas sugeridos pela IA no estudo deste texto
  const temas = textoBase === estudo.textoBase ? (estudo.temas ?? []) : [];

  const sugerido = sugerirGenero(textoBase);
  const genero = generoEscolhido ?? sugerido;

  const criarSermao = async () => {
    if (criando) return;
    setCriando(true);
    const intro = opcoesIntroducao.find((o) => o.id === introducao)!;
    const doEstudo = textoBase === estudo.textoBase;
    const [versos, chave, blocosSaudacao] = await Promise.all([
      textoDosVersiculos(textoBase).catch(() => ''),
      lerChave(),
      saudacao ? lerSaudacao(saudacao) : undefined,
    ]);
    const s = criar({
      titulo,
      textoBase,
      modelo,
      culto,
      data,
      genero,
      saudacao,
      capa,
      etapa: ETAPA_MONTAGEM,
      // O estudo feito para este texto vai junto e aparece em "Seu estudo" na montagem
      ...(doEstudo
        ? {
            respostas: estudo.respostas,
            anotacoes: estudo.anotacoes,
            notasBiblioteca: estudo.notasBiblioteca,
            trechosBiblioteca: estudo.trechosBiblioteca,
            resumo: estudo.resumo,
          }
        : {}),
      blocos: montarBlocos({
        modelo,
        textoBase,
        objetivo: objetivos,
        tipoObjetivo,
        capa,
        versos,
        introducao,
        saudacao: blocosSaudacao,
      }),
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
      {original ? <Stack.Screen options={{ title: 'Dados do sermão' }} /> : null}
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
          {/* Cada tipo terá a sua capa; o que vai embaixo de cada um o Jildean ainda vai definir */}
          <Rotulo>Tipo de sermão</Rotulo>
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
          <View style={[estilos.capaTipo, campos && estilos.capaCampos]}>
            {campos ? (
              <>
                <Text style={estilos.tituloCapa}>Capa da {tipoObjetivo}</Text>
                {campos.map((c) => (
                  <View key={c.id} style={{ gap: 4 }}>
                    <Text style={estilos.rotuloCapa}>{c.nome}</Text>
                    <TextInput
                      accessibilityLabel={c.nome}
                      value={capa[c.id] ?? ''}
                      onChangeText={(t) => setCapa((x) => ({ ...x, [c.id]: t }))}
                      placeholder={c.dica}
                      placeholderTextColor={cores.textoSuave}
                      multiline={(c.linhas ?? 1) > 1}
                      keyboardType={c.id === 'licao' ? 'numeric' : 'default'}
                      style={[estilos.entrada, (c.linhas ?? 1) > 1 && { minHeight: 64, textAlignVertical: 'top' }]}
                    />
                  </View>
                ))}
                <Text style={estilos.suave}>Os objetivos da lição ficam no quadro do objetivo, mais abaixo.</Text>
              </>
            ) : (
              <Text style={estilos.suave}>
                Capa de {tipoObjetivo}: as informações desta capa ainda vão ser definidas.
              </Text>
            )}
          </View>
        </Cartao>

        <Cartao style={{ gap: 8 }}>
          <Rotulo>Modelo do sermão</Rotulo>
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
          <Rotulo>{ehEBD ? 'Objetivos da lição' : 'Objetivo do sermão'}</Rotulo>
          <Text style={estilos.objetivoTopo}>
            {ehEBD ? 'Os OBJETIVOS desta LIÇÃO são:' : 'O OBJETIVO deste SERMÃO é:'}
          </Text>
          {camposObjetivo.map((valor, i) => (
            <View key={i} style={estilos.linhaObjetivo}>
              <Text style={estilos.marcadorObjetivo}>●</Text>
              <TextInput
                accessibilityLabel={`Objetivo ${i + 1}`}
                value={valor}
                onChangeText={(t) => mudarObjetivo(i, t)}
                placeholder={
                  i === 0
                    ? 'Opcional. Ex.: mostrar que Deus age mesmo quando o coração endurece'
                    : `Objetivo ${i + 1} (opcional)`
                }
                placeholderTextColor={cores.textoSuave}
                style={[estilos.entrada, { flex: 1 }]}
              />
            </View>
          ))}
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

        <Cartao style={{ gap: 8 }}>
          <Rotulo>Saudação</Rotulo>
          {saudacoes.map((o) => (
            <Escolha
              key={o.id}
              ativo={saudacao === o.id}
              titulo={o.nome}
              descricao={o.resumo}
              onPress={() => setSaudacao(o.id)}
              onEditar={() => router.push(`/saudacao/${o.id}`)}
            />
          ))}
          <Escolha ativo={!saudacao} titulo="Sem saudação" onPress={() => setSaudacao('')} />
          {inicio?.saudacao === ATUAL ? (
            <Escolha
              ativo={saudacao === ATUAL}
              titulo="Manter a saudação que já está no sermão"
              onPress={() => setSaudacao(ATUAL)}
            />
          ) : null}
          {original && saudacao !== inicio?.saudacao ? (
            <Text style={estilos.suave}>
              Ao salvar, a saudação do sermão é trocada por esta (o que foi escrito na saudação antiga sai).
            </Text>
          ) : null}
        </Cartao>

        {original ? (
          <Botao titulo={criando ? 'Salvando...' : 'Salvar alterações'} onPress={salvarAlteracoes} />
        ) : (
          <Botao titulo={criando ? 'Criando...' : 'Criar sermão'} onPress={criarSermao} />
        )}
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
  onEditar,
}: {
  ativo: boolean;
  titulo: string;
  descricao?: string;
  onPress: () => void;
  // Botão "Editar" do lado direito (saudações)
  onEditar?: () => void;
}) {
  return (
    <View style={[estilos.escolha, ativo && estilos.escolhaAtiva, estilos.linhaEscolha]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: ativo }}
        onPress={onPress}
        style={{ flex: 1, padding: 12 }}
      >
        <Text style={estilos.titulo}>
          {ativo ? '◉ ' : '○ '}
          {titulo}
        </Text>
        {descricao ? <Text style={estilos.suave}>{descricao}</Text> : null}
      </Pressable>
      {onEditar ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${titulo}`}
          onPress={onEditar}
          style={estilos.editar}
        >
          <Text style={estilos.textoEditar}>Editar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, ...larguraConteudo },
  entrada: { fontSize: 16, color: cores.texto, paddingVertical: 6 },
  objetivoTopo: { fontSize: 15, color: cores.texto, marginTop: 4 },
  linhaObjetivo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 },
  marcadorObjetivo: { fontSize: 11, color: cores.texto },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  titulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  suave: { fontSize: 13, color: cores.textoSuave, marginTop: 2 },
  escolha: { borderRadius: 10, borderWidth: 1, borderColor: cores.borda, minHeight: 44 },
  linhaEscolha: { flexDirection: 'row', alignItems: 'center' },
  editar: {
    minHeight: 36,
    paddingHorizontal: 14,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.destaque,
    justifyContent: 'center',
  },
  textoEditar: { fontSize: 14, fontWeight: '700', color: cores.destaque },
  escolhaAtiva: { borderColor: cores.destaque, backgroundColor: cores.destaqueFundo },
  pilula: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    justifyContent: 'center',
  },
  capaTipo: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 12,
  },
  capaCampos: { borderStyle: 'solid', gap: 10 },
  tituloCapa: { fontSize: 15, fontWeight: '700', color: cores.texto },
  rotuloCapa: { fontSize: 13, fontWeight: '600', color: cores.textoSuave },
  pilulaAtiva: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  textoPilula: { fontSize: 14, color: cores.texto },
});
