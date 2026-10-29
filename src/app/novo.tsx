import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, Cartao, Rotulo } from '../components/ui';
import { BarraAbas } from '../components/BarraAbas';
import { TextoFormatado } from '../components/TextoFormatado';
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
import { lerIntroducoes, type IntroducaoEditada } from '../store/introducoes';
import { novoId, trocarCapa, trocarSaudacao, useSermao, useSermoes, type Sermao } from '../store/sermoes';
import { cores, larguraConteudo } from '../theme';

function hoje() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const ROTULO_OBJETIVO = 'Objetivo do sermão: ';
const ROTULO_INTRODUCAO = 'Introdução: ';
// Saudação que já está no sermão, quando ele foi criado antes de o app guardar qual foi escolhida
const ATUAL = 'atual';

// Sermão trazido do Google Docs: o objetivo vem como um título "OBJETIVO" com a lista de pontos embaixo
const tiposTitulo = ['topico', 'subtopico', 'subtopicoVerde'];
function objetivoImportado(blocos: Sermao['blocos']) {
  const h = blocos.findIndex(
    (b) =>
      tiposTitulo.includes(b.tipo) &&
      /^OBJETIVOS?( D[AO] (LIÇÃO|SERMÃO|AULA))?:?$/.test(
        b.texto
          .replace(/\*|\[[^\]]*\]/g, '')
          .trim()
          .toUpperCase(),
      ),
  );
  const lista = blocos[h + 1];
  if (h < 0 || !lista || !lista.tipo.startsWith('pontos')) return undefined;
  return { h, linhas: lista.texto.replace(/\[[^\]]*\]/g, '').trim() };
}

// O que foi escolhido ao criar o sermão, lido dos blocos dele, para abrir esta tela de novo e mudar
function escolhasDoSermao(s: Sermao) {
  const obj = s.blocos.find((b) => b.tipo === 'objetivo');
  const importado = obj ? undefined : objetivoImportado(s.blocos);
  const intro = s.blocos.find((b) => b.tipo === 'introducao');
  const ateTexto = s.blocos.findIndex((b) => b.tipo === 'versiculo' && b.rotulo === 'Texto');
  const temSaudacao = ateTexto > 0 && s.blocos.slice(0, ateTexto).some((b) => b.tipo !== 'objetivo');
  return {
    tipoObjetivo:
      s.tipoSermao ??
      (obj?.rotulo?.startsWith(ROTULO_OBJETIVO)
        ? obj.rotulo.slice(ROTULO_OBJETIVO.length)
        : s.capa && Object.keys(s.capa).length
          ? 'Aula EBD'
          : ''),
    objetivo:
      obj?.texto.replace(/^(?:(?:O \*OBJETIVO\* deste \*SERMÃO\* é|Os \*OBJETIVOS\* desta \*LIÇÃO\* são):)?\n/, '') ??
      importado?.linhas ??
      '',
    // Sermões novos guardam a opção pela dica da caixa; os antigos, pelo nome dela
    introducao:
      s.introducao ??
      opcoesIntroducao.find((o) => intro?.rotulo === `${ROTULO_INTRODUCAO}${o.nome}` || intro?.dica === o.dica)?.id,
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
  // Na capa da EBD, o texto bíblico do Texto de referência aparece logo abaixo dele (JILDEAN, 29/10/2026)
  const [versosCapa, setVersosCapa] = useState('');
  useEffect(() => {
    let vale = true;
    if (ehEBD && textoBase.trim())
      textoDosVersiculos(textoBase)
        .catch(() => '')
        .then((v) => vale && setVersosCapa(v));
    else setVersosCapa('');
    return () => {
      vale = false;
    };
  }, [ehEBD, textoBase]);
  // A capa como vai para o sermão: com o texto de referência já escrito
  // O texto de referência já escrito à mão ("Salmos 139:6 - TAL CONHECIMENTO...") vale como está
  const textoDaCapa = (versos: string) =>
    textoBase.includes(' - ') ? textoBase.trim() : versos ? `${textoBase} - ${versos}` : '';
  const capaCom = (versos: string) => (ehEBD && textoDaCapa(versos) ? { ...capa, texto: textoDaCapa(versos) } : capa);
  const [introducao, setIntroducao] = useState<OpcaoIntroducao>(inicio?.introducao ?? 'citacoes');
  // As introduções como o JILDEAN editou (lidas de novo ao voltar da página de edição)
  const [intros, setIntros] = useState<Partial<Record<OpcaoIntroducao, IntroducaoEditada>>>({});
  useFocusEffect(
    useCallback(() => {
      lerIntroducoes().then(setIntros);
    }, []),
  );
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
      // Sem o quadro do objetivo (sermão trazido do Docs): ele entra na capa no lugar do título "OBJETIVO" e da lista
      let semObjetivo = !blocos.some((b) => b.tipo === 'objetivo');
      if (semObjetivo && objetivos) {
        const importado = objetivoImportado(blocos);
        if (importado) blocos = blocos.filter((_, k) => k !== importado.h && k !== importado.h + 1);
        blocos = [
          {
            id: novoId(),
            tipo: 'objetivo',
            rotulo: `${ROTULO_OBJETIVO}${tipoObjetivo}`,
            texto: `${inicioObjetivo(tipoObjetivo)}${objetivos}`,
            ...(ehEBD ? { colado: true } : {}),
          },
          ...blocos,
        ];
      } else semObjetivo = false;
      if (objetivo !== inicio.objetivo || tipoObjetivo !== (inicio.tipoObjetivo || 'Pregação'))
        blocos = blocos.map((b) =>
          b.tipo === 'objetivo'
            ? {
                ...b,
                rotulo: `${ROTULO_OBJETIVO}${tipoObjetivo}`,
                texto: objetivos ? `${inicioObjetivo(tipoObjetivo)}${objetivos}` : '',
                colado: ehEBD || undefined,
              }
            : b,
        );
      if (
        semObjetivo ||
        tipoObjetivo !== (inicio.tipoObjetivo || 'Pregação') ||
        JSON.stringify(capaCom(versosCapa)) !== JSON.stringify(s.capa ?? {})
      )
        blocos = trocarCapa(blocos, tipoObjetivo, capaCom(versosCapa));
      if (introducao !== inicio.introducao)
        blocos = blocos.map((b) =>
          b.tipo === 'introducao'
            ? {
                ...b,
                rotulo: b.rotulo?.startsWith(ROTULO_INTRODUCAO) ? `${ROTULO_INTRODUCAO}${intro.nome}` : b.rotulo,
                dica: intros[introducao]?.dica || intro.dica,
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
        capa: capaCom(versosCapa),
        introducao,
        tipoSermao: tipoObjetivo,
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
      capa: capaCom(versos),
      introducao,
      tipoSermao: tipoObjetivo,
      capaColada: true,
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
        capa: capaCom(versos),
        versos,
        introducao,
        introducaoEditada: intros[introducao],
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

  // As 3 linhas do objetivo: na Aula EBD ficam dentro da capa, logo depois da Lição nº (JILDEAN, 29/10/2026)
  const objetivoCampos = (
    <>
      {ehEBD ? null : <Text style={estilos.objetivoTopo}>O OBJETIVO deste SERMÃO é:</Text>}
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
    </>
  );

  const campoTexto = (
    <TextInput
      accessibilityLabel="Texto referência"
      value={textoBase}
      onChangeText={setTextoBase}
      placeholder="Ex.: Êxodo 8 (ou toque no versículo na aba Bíblia)"
      placeholderTextColor={cores.textoSuave}
      style={estilos.entrada}
    />
  );

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
          {ehEBD ? null : (
            <>
              <Rotulo>Texto referência</Rotulo>
              {campoTexto}
            </>
          )}
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
                {/* Os objetivos abrem a capa (JILDEAN, 29/10/2026) */}
                <View style={{ gap: 8, marginBottom: 6 }}>
                  <Text style={estilos.rotuloCapa}>Objetivos da lição</Text>
                  {objetivoCampos}
                </View>
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
                      style={[estilos.entrada, (c.linhas ?? 1) > 1 && { minHeight: 64, textAlignVertical: 'top' }]}
                    />
                  </View>
                ))}
                {/* Na Aula EBD o texto de referência fecha a capa (JILDEAN, 29/10/2026) */}
                <View style={{ gap: 4 }}>
                  <Text style={estilos.rotuloCapa}>Texto de referência</Text>
                  {campoTexto}
                  {textoDaCapa(versosCapa) ? (
                    <TextoFormatado tipo="versiculo" texto={textoDaCapa(versosCapa)} tamanho={15} semMoldura />
                  ) : null}
                </View>
              </>
            ) : (
              <Text style={estilos.suave}>
                Capa de {tipoObjetivo}: as informações desta capa ainda vão ser definidas.
              </Text>
            )}
          </View>
        </Cartao>

        {/* Na Aula EBD não entram o modelo do sermão nem o gênero literário (JILDEAN, 29/10/2026) */}
        {ehEBD ? null : (
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
        )}

        {ehEBD ? null : (
          <Cartao style={{ gap: 8 }}>
            <Rotulo>Objetivo do sermão</Rotulo>
            {objetivoCampos}
          </Cartao>
        )}

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

        <Cartao style={{ gap: 8 }}>
          <Rotulo>Introdução</Rotulo>
          {opcoesIntroducao.map((o) => (
            <Escolha
              key={o.id}
              ativo={introducao === o.id}
              titulo={o.nome}
              descricao={intros[o.id]?.dica || o.dica}
              onPress={() => setIntroducao(o.id)}
              onEditar={() => router.push(`/introducao/${o.id}`)}
            />
          ))}
        </Cartao>

        {ehEBD ? null : (
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
        )}

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
  // Botão "Editar" do lado direito (saudações e introduções)
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
