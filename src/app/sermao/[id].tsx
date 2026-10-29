import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Fragment, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ChipsInserir } from '../../components/ChipsInserir';
import { TextoFormatado } from '../../components/TextoFormatado';
import { BarraAbas } from '../../components/BarraAbas';
import { CampoCrescente } from '../../components/CampoCrescente';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { etapasDeEstudo, nomesEstudo } from '../../data/etapas';
import { perguntasDaEtapa } from '../../data/roteiro';
import { modelos, nomesBloco, type TipoBloco } from '../../data/modelos';
import {
  abreNovaPagina,
  coresPregacao,
  escalaTopico,
  tituloDaPagina,
  estiloBloco,
  pontosDoQuadro,
  quebraNoTopo,
  rotuloVisivel,
} from '../../estilo';
import { exportarPdf } from '../../lib/pdf';
import { textoDaBiblioteca } from '../../ia/estudo';
import { minutosEstimados, useSermao, useSermoes, type Bloco } from '../../store/sermoes';
import { cores, fonteEsboco, larguraConteudo } from '../../theme';

// Hora atual, usada só nos toques e na digitação
const relogio = () => Date.now();

export default function EditorTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermao = useSermao(id);
  const { atualizar, adicionarBloco, remover, mudarEstudo, nuvem, sincronizarAgora } = useSermoes();
  // Aviso do botão Salvar no fim da edição
  const [salvo, setSalvo] = useState('');
  // Folha cujo + está aberto, mostrando os tipos de bloco para a página nova
  const [novaPaginaEm, setNovaPaginaEm] = useState<string>();
  const [vendoEstudo, setVendoEstudo] = useState(true);
  // Caixa concluída por último: só ela mostra o "+ Inserir" clarinho embaixo
  const [ultimaConcluida, setUltimaConcluida] = useState<string>();
  const largo = useWindowDimensions().width >= 900;
  // Altura de cada parte da folha e largura da folha, medidas na tela, para separar as páginas A4
  const [alturas, setAlturas] = useState<Record<string, number>>({});
  const [larguraFolha, setLarguraFolha] = useState(0);
  // Caixas como estavam antes de cada mudança, para o botão Desfazer
  const [passos, setPassos] = useState<Bloco[][]>([]);
  // Digitação seguida na mesma caixa conta como um passo só
  const ultimoPasso = useRef({ chave: '', em: 0 });

  if (!sermao) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: cores.textoSuave }}>Sermão não encontrado.</Text>
      </View>
    );
  }

  const guardarPasso = (chave = '') => {
    const agora = relogio();
    const seguido = chave && chave === ultimoPasso.current.chave && agora - ultimoPasso.current.em < 3000;
    ultimoPasso.current = { chave, em: agora };
    if (!seguido) setPassos((p) => [...p.slice(-49), sermao.blocos]);
  };

  const desfazer = () => {
    const anterior = passos.at(-1);
    if (!anterior) return;
    setPassos((p) => p.slice(0, -1));
    ultimoPasso.current = { chave: '', em: 0 };
    atualizar(sermao.id, (s) => ({ ...s, blocos: anterior }));
  };

  const mudarBloco = (blocoId: string, texto: string) => {
    guardarPasso(`texto:${blocoId}`);
    atualizar(sermao.id, (s) => ({ ...s, blocos: s.blocos.map((b) => (b.id === blocoId ? { ...b, texto } : b)) }));
  };

  const inserirBloco = (tipo: TipoBloco, depoisDe?: string) => {
    guardarPasso();
    adicionarBloco(sermao.id, tipo, '', depoisDe);
  };

  // O + no fim de cada folha cria uma página nova logo depois dela, começando pelo bloco escolhido
  const criarPagina = (tipo: TipoBloco, depoisDe: string) => {
    guardarPasso();
    setNovaPaginaEm(undefined);
    adicionarBloco(sermao.id, tipo, '', depoisDe === 'cabecalho' ? null : depoisDe, true);
  };
  // A página de cima de um espaço cinza: do bloco que abriu a página até antes do que abre a próxima.
  // A capa (antes do primeiro bloco que abre página) não pode ser excluída
  const paginaQueTermina = (ultimoId: string) => {
    const k = sermao.blocos.findIndex((b) => b.id === ultimoId);
    if (k < 0) return undefined;
    let inicio = k;
    while (inicio >= 0 && !abreNovaPagina(sermao.blocos, inicio)) inicio--;
    if (inicio < 0) return undefined;
    let fim = k + 1;
    while (fim < sermao.blocos.length && !abreNovaPagina(sermao.blocos, fim)) fim++;
    return { inicio, fim };
  };
  const excluirPagina = (ultimoId: string) => {
    const pagina = paginaQueTermina(ultimoId);
    if (!pagina) return;
    guardarPasso();
    setNovaPaginaEm(undefined);
    atualizar(sermao.id, (s) => ({
      ...s,
      blocos: s.blocos.filter((_, i) => i < pagina.inicio || i >= pagina.fim),
    }));
  };
  const botaoNovaPagina = (depoisDe: string) => (
    <NovaPagina
      aberto={novaPaginaEm === depoisDe}
      onAbrir={() => setNovaPaginaEm((v) => (v === depoisDe ? undefined : depoisDe))}
      onEscolher={(tipo) => criarPagina(tipo, depoisDe)}
      onExcluir={paginaQueTermina(depoisDe) ? () => excluirPagina(depoisDe) : undefined}
    />
  );

  const mover = (indice: number, direcao: -1 | 1) => {
    guardarPasso();
    atualizar(sermao.id, (s) => {
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= s.blocos.length) return s;
      const blocos = [...s.blocos];
      [blocos[indice], blocos[alvo]] = [blocos[alvo], blocos[indice]];
      return { ...s, blocos };
    });
  };

  // Troca o tipo da caixa e mantém o texto; o nome antigo (ex.: "Texto") sai junto
  const mudarTipo = (blocoId: string, tipo: TipoBloco) => {
    guardarPasso();
    atualizar(sermao.id, (s) => ({
      ...s,
      blocos: s.blocos.map((b) =>
        b.id === blocoId ? { id: b.id, tipo, texto: b.texto, novaPagina: b.novaPagina } : b,
      ),
    }));
  };

  // Começa uma página nova nesta caixa: ela e tudo abaixo vão para a próxima página (de novo, junta de volta)
  const quebrarPagina = (blocoId: string) => {
    guardarPasso();
    atualizar(sermao.id, (s) => ({
      ...s,
      blocos: s.blocos.map((b) => (b.id === blocoId ? { ...b, novaPagina: !b.novaPagina || undefined } : b)),
    }));
  };

  // Tira (ou devolve) o espaço entre esta caixa e a de cima
  const colarNaDeCima = (blocoId: string) => {
    guardarPasso();
    atualizar(sermao.id, (s) => ({
      ...s,
      blocos: s.blocos.map((b) => (b.id === blocoId ? { ...b, colado: !b.colado || undefined } : b)),
    }));
  };

  const apagarBloco = (blocoId: string) => {
    guardarPasso();
    atualizar(sermao.id, (s) => ({ ...s, blocos: s.blocos.filter((b) => b.id !== blocoId) }));
  };

  // Antes de concluir alguma caixa, o "+ Inserir" fica na última caixa preenchida
  const ultimaPreenchida = [...sermao.blocos].reverse().find((b) => b.texto.trim())?.id;
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
    .filter((a) => a.texto)
    .concat(textoDaBiblioteca(sermao) ? [{ nome: 'Biblioteca', texto: textoDaBiblioteca(sermao) }] : [])
    .concat(sermao.resumo?.trim() ? [{ nome: 'Resumo do estudo', texto: sermao.resumo.trim() }] : []);

  return (
    <>
      <Stack.Screen options={{ title: sermao.titulo || 'Novo sermão' }} />
      <ScrollView style={estilos.mesa} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
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

        {/* O sermão é escrito em folhas A4, como no Google Docs: sem caixas, o texto corrido. Cada página tem o tamanho de uma folha A4 e, como no Google Docs, a parte que não cabe vai para a próxima */}
        <View
          style={[estilos.folha, largo && estilos.folhaLarga]}
          onLayout={(e) => setLarguraFolha(e.nativeEvent.layout.width)}
        >
          {paginas(
            [
              {
                id: 'cabecalho',
                conteudo: (
                  <>
                    <View style={estilos.linhaMeta}>
                      <TextInput
                        accessibilityLabel="Culto"
                        value={sermao.culto ?? ''}
                        onChangeText={(culto) => atualizar(sermao.id, (s) => ({ ...s, culto }))}
                        placeholder="Culto (ex.: Santa Ceia)"
                        placeholderTextColor={cores.textoSuave}
                        style={[estilos.entradaMeta, { flex: 2 }]}
                      />
                      <TextInput
                        accessibilityLabel="Data"
                        value={sermao.data ?? ''}
                        onChangeText={(data) => atualizar(sermao.id, (s) => ({ ...s, data }))}
                        placeholder="dd/mm/aaaa"
                        placeholderTextColor={cores.textoSuave}
                        style={[estilos.entradaMeta, { flex: 1, textAlign: 'right' }]}
                      />
                    </View>
                    <TextInput
                      accessibilityLabel="Título do sermão"
                      value={sermao.titulo}
                      onChangeText={(titulo) => atualizar(sermao.id, (s) => ({ ...s, titulo }))}
                      placeholder="Título do sermão"
                      placeholderTextColor="#B0B5BD"
                      style={estilos.entradaTitulo}
                    />
                    {/* Texto referência e, no fim da mesma linha, o atalho para pregar */}
                    <View style={estilos.linhaBase}>
                      <TextInput
                        accessibilityLabel="Texto referência"
                        value={sermao.textoBase}
                        onChangeText={(textoBase) => atualizar(sermao.id, (s) => ({ ...s, textoBase }))}
                        placeholder="Texto referência (ex.: João 3:16)"
                        placeholderTextColor={cores.textoSuave}
                        style={[estilos.entradaBase, { flex: 1 }]}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Pregar"
                        onPress={() => router.push(`/pregar/${sermao.id}`)}
                        style={({ pressed }) => [estilos.pregarTopo, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={estilos.textoPregarTopo}>▶ Pregar</Text>
                      </Pressable>
                    </View>
                    <View style={estilos.separador} />
                  </>
                ),
              },
              ...sermao.blocos.map((bloco, i) => ({
                id: bloco.id,
                novaPagina: abreNovaPagina(sermao.blocos, i),
                colado: bloco.colado,
                conteudo: (
                  <>
                    {tituloDaPagina(sermao.blocos, i) ? (
                      <TextoFormatado tipo="topico" texto={tituloDaPagina(sermao.blocos, i)!} />
                    ) : null}
                    <BlocoEditor
                      bloco={bloco}
                      rotulo={
                        bloco.rotulo ??
                        (bloco.tipo === 'topico' ? `Tópico ${numerosTopico[i]}` : nomesBloco[bloco.tipo])
                      }
                      onMudar={(t) => mudarBloco(bloco.id, t)}
                      onSubir={() => mover(i, -1)}
                      onDescer={() => mover(i, 1)}
                      onApagar={() => apagarBloco(bloco.id)}
                      onInserir={(tipo) => inserirBloco(tipo, bloco.id)}
                      onMudarTipo={(tipo) => mudarTipo(bloco.id, tipo)}
                      paginaNova={!!bloco.novaPagina}
                      onQuebrarPagina={() => quebrarPagina(bloco.id)}
                      colado={!!bloco.colado}
                      onColar={() => colarNaDeCima(bloco.id)}
                      mostrarInserir={bloco.id === (ultimaConcluida ?? ultimaPreenchida)}
                      onConcluir={() => setUltimaConcluida(bloco.id)}
                    />
                  </>
                ),
              })),
            ],
            alturas,
            larguraFolha,
            largo,
            (id, altura) => setAlturas((h) => (h[id] === altura ? h : { ...h, [id]: altura })),
            botaoNovaPagina,
          )}
        </View>
        {botaoNovaPagina(sermao.blocos.at(-1)?.id ?? 'cabecalho')}

        <View style={estilos.inserir}>
          <Text style={estilos.meta}>Inserir</Text>
          <ChipsInserir onEscolher={(tipo) => inserirBloco(tipo)} />
        </View>
        {/* Tudo já é guardado enquanto se escreve; o Salvar confirma e, com o Drive ligado, envia na hora */}
        <Botao
          titulo={nuvem.estado === 'sincronizando' ? 'Salvando...' : 'Salvar'}
          onPress={async () => {
            setSalvo('');
            if (!nuvem.ligada) return setSalvo('Sermão salvo neste aparelho.');
            await sincronizarAgora();
            setSalvo('pronto');
          }}
        />
        {salvo ? (
          <Text style={estilos.avisoSalvo}>
            {salvo !== 'pronto'
              ? salvo
              : nuvem.estado === 'ok'
                ? 'Sermão salvo neste aparelho e no Google Drive.'
                : `Sermão salvo neste aparelho. ${nuvem.erro ?? 'Não deu para enviar ao Google Drive.'}`}
          </Text>
        ) : null}
        <View style={estilos.acoesSermao}>
          <Botao titulo="Pregar" onPress={() => router.push(`/pregar/${sermao.id}`)} style={estilos.acaoSermao} />
          <Botao
            titulo="Exportar PDF"
            variante="contorno"
            onPress={() => exportarPdf(sermao)}
            style={estilos.acaoSermao}
          />
        </View>
        <Botao
          titulo="Editar dados e saudação"
          variante="contorno"
          onPress={() => router.push(`/novo?id=${sermao.id}`)}
        />
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

        <Botao
          titulo="Apagar sermão"
          variante="perigo"
          onPress={() => {
            remover(sermao.id);
            router.back();
          }}
        />
      </ScrollView>
      {passos.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Desfazer"
          onPress={desfazer}
          style={({ pressed }) => [estilos.desfazer, pressed && { opacity: 0.7 }]}
        >
          <Text style={estilos.textoDesfazer}>↶ Desfazer</Text>
        </Pressable>
      ) : null}
      <BarraAbas />
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
  onInserir: (tipo: TipoBloco) => void;
  onMudarTipo: (tipo: TipoBloco) => void;
  // A caixa começa uma página (criada pelo + ou pelo botão "Próxima página")
  paginaNova: boolean;
  onQuebrarPagina: () => void;
  colado: boolean;
  onColar: () => void;
  // "+ Inserir" clarinho embaixo (só na caixa concluída por último)
  mostrarInserir: boolean;
  onConcluir: () => void;
};

const dicas: Partial<Record<TipoBloco, string>> = {
  pontos: 'Um ponto por linha',
  versiculo: 'Ex.: 1 Tessalonicenses 5:21 - *Examinai* *tudo*. *Retende* o *bem*',
};

function BlocoEditor({
  bloco,
  rotulo,
  onMudar,
  onSubir,
  onDescer,
  onApagar,
  onInserir,
  onMudarTipo,
  paginaNova,
  onQuebrarPagina,
  colado,
  onColar,
  mostrarInserir,
  onConcluir,
}: BlocoEditorProps) {
  const [editando, setEditando] = useState(!bloco.texto.trim());
  const [selecao, setSelecao] = useState({ start: 0, end: 0 });
  const [campo, setCampo] = useState(0);
  // Ferramentas e fundo cinza só enquanto um campo do bloco está com o cursor; ao sair, o bloco volta a
  // mostrar o texto formatado, como num doc
  const [focado, setFocado] = useState(false);
  // "Inserir" abre os tipos de bloco ali mesmo, para não precisar descer até o fim de um sermão grande
  const [inserindo, setInserindo] = useState(false);
  const saida = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const entrar = (i: number) => {
    clearTimeout(saida.current);
    setCampo(i);
    setFocado(true);
  };
  const sair = () => {
    saida.current = setTimeout(() => {
      setFocado(false);
      if (bloco.texto.trim()) {
        setEditando(false);
        onConcluir();
      }
    }, 250);
  };

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

  // Na folha, as ferramentas do bloco só aparecem enquanto ele está sendo editado
  const e = estiloBloco[bloco.tipo];
  const visual = {
    color: e.cor,
    fontStyle: e.italico ? 'italic' : 'normal',
    textAlign: e.centralizado ? 'center' : 'left',
    fontFamily: fonteEsboco,
  } as const;
  const visualTopo = e.topo
    ? ({ color: e.topo.cor, fontStyle: e.topo.italico ? 'italic' : 'normal', fontFamily: fonteEsboco } as const)
    : visual;
  const vazio = !bloco.texto.trim();

  return (
    <View style={[estilos.bloco, focado && estilos.blocoEditando]}>
      {focado || inserindo ? (
        <View style={estilos.cabecalhoBloco}>
          <Text style={estilos.rotuloBloco}>{rotulo}</Text>
          <View style={estilos.acoesBloco}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Inserir bloco abaixo"
              onPress={() => {
                clearTimeout(saida.current);
                setInserindo((v) => !v);
              }}
              style={[estilos.botaoInserir, inserindo && estilos.botaoInserirAberto]}
            >
              <Text style={[estilos.textoInserir, inserindo && { color: '#FFFFFF' }]}>+ INSERIR</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={paginaNova ? 'Juntar com a página de cima' : 'Levar para a próxima página'}
              onPress={() => {
                clearTimeout(saida.current);
                setFocado(false);
                if (bloco.texto.trim()) setEditando(false);
                onQuebrarPagina();
              }}
              style={[estilos.botaoInserir, { marginLeft: 6 }]}
            >
              <Text style={estilos.textoInserir}>{paginaNova ? '⤒ JUNTAR' : '⤓ PRÓX. PÁGINA'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={colado ? 'Devolver o espaço acima' : 'Tirar o espaço acima'}
              onPress={() => {
                clearTimeout(saida.current);
                setFocado(false);
                if (bloco.texto.trim()) setEditando(false);
                onColar();
              }}
              style={[estilos.botaoInserir, { marginLeft: 6 }, colado && estilos.botaoInserirAberto]}
            >
              <Text style={[estilos.textoInserir, colado && { color: '#FFFFFF' }]}>⇡ SEM ESPAÇO</Text>
            </Pressable>
            <Acao rotulo="Subir bloco" simbolo="↑" onPress={onSubir} />
            <Acao rotulo="Descer bloco" simbolo="↓" onPress={onDescer} />
            <Acao rotulo="Apagar bloco" simbolo="×" onPress={onApagar} />
          </View>
        </View>
      ) : vazio && bloco.tipo !== 'topico' ? (
        <Text style={estilos.rotuloBloco}>{rotulo}</Text>
      ) : rotuloVisivel(bloco) && bloco.tipo !== 'aplicacao' ? (
        <Text style={estilos.rotuloBloco}>{rotulo}</Text>
      ) : null}
      {inserindo && (
        <View style={estilos.menuInserir}>
          <Text style={estilos.meta}>Inserir abaixo deste bloco</Text>
          <ChipsInserir
            onEscolher={(tipo) => {
              setInserindo(false);
              setFocado(false);
              onInserir(tipo);
            }}
          />
          <Text style={[estilos.meta, { marginTop: 10 }]}>Mudar esta caixa para</Text>
          <ChipsInserir
            sem={bloco.tipo}
            onEscolher={(tipo) => {
              setInserindo(false);
              setFocado(false);
              onMudarTipo(tipo);
            }}
          />
        </View>
      )}
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
                    onFocus={() => entrar(i)}
                    onBlur={sair}
                    onSelectionChange={(ev) => setSelecao(ev.nativeEvent.selection)}
                    placeholder={`${nomeTopo} (Enter para outra linha)`}
                    placeholderTextColor={cores.textoSuave}
                    alturaMinima={36}
                    style={[estilos.entrada, visualTopo, estilos.topoQuadro]}
                  />
                ) : (
                  <View key={i} style={estilos.itemQuadro}>
                    <Text style={estilos.marcador}>●</Text>
                    <TextInput
                      accessibilityLabel={`${nomeItem} ${i}`}
                      value={valor}
                      onChangeText={(t) => mudarCampo(i, t)}
                      onFocus={() => entrar(i)}
                      onBlur={sair}
                      onSelectionChange={(ev) => setSelecao(ev.nativeEvent.selection)}
                      placeholder={`${nomeItem} ${i}`}
                      placeholderTextColor={cores.textoSuave}
                      style={[estilos.entrada, e.itensComoTopo ? visualTopo : { fontFamily: fonteEsboco }, { flex: 1 }]}
                    />
                  </View>
                ),
              )}
            </View>
          ) : (
            <CampoCrescente
              accessibilityLabel={rotulo}
              value={bloco.texto}
              onChangeText={onMudar}
              onSelectionChange={(ev) => setSelecao(ev.nativeEvent.selection)}
              multiline
              autoFocus={!!bloco.texto}
              onFocus={() => entrar(0)}
              onBlur={sair}
              alturaMinima={36}
              placeholder={
                bloco.tipo === 'topico'
                  ? rotulo
                  : (bloco.dica ?? dicas[bloco.tipo] ?? 'Escreva aqui. Use *asteriscos* para destacar palavras-chave')
              }
              placeholderTextColor={cores.textoSuave}
              style={[
                estilos.entrada,
                visual,
                e.fundo ? [estilos.entradaComFundo, { backgroundColor: e.fundo }] : null,
                // Tópico com a letra um pouco maior que o resto
                bloco.tipo === 'topico' && { fontSize: Math.round(16 * escalaTopico) },
              ]}
            />
          )}
          {focado && (
            <View style={estilos.ferramentas}>
              <Ferramenta titulo="Destacar seleção" onPress={destacar} />
              {ehQuadro && <Ferramenta titulo={`+ ${nomeItem}`} onPress={() => onMudar(`${campos.join('\n')}\n`)} />}
              {bloco.texto.trim() ? (
                <Ferramenta
                  titulo="Pronto"
                  principal
                  onPress={() => {
                    setEditando(false);
                    onConcluir();
                  }}
                />
              ) : null}
            </View>
          )}
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${rotulo}`}
          onPress={() => setEditando(true)}
          style={({ pressed }) => [estilos.leitura, pressed && estilos.leituraHover]}
        >
          {/* A primeira linha começa mais à esquerda: a seta passa para a margem, mesmo na folha estreita */}
          <TextoFormatado tipo={bloco.tipo} texto={bloco.texto} semMoldura setaNaMargem />
        </Pressable>
      )}
      {/* Caixa já concluída: um "+ Inserir" clarinho logo abaixo cria a próxima sem abrir esta de novo */}
      {mostrarInserir && !focado && !inserindo && !vazio ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Inserir caixa abaixo"
          onPress={() => setInserindo(true)}
          style={({ pressed }) => [estilos.inserirAbaixo, pressed && { opacity: 1 }]}
        >
          <Text style={estilos.textoInserirAbaixo}>+ Inserir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Ferramenta({ titulo, onPress, principal }: { titulo: string; onPress: () => void; principal?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[estilos.ferramenta, principal && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}
    >
      <Text style={[estilos.textoFerramenta, principal && { color: '#FFFFFF' }]}>{titulo}</Text>
    </Pressable>
  );
}

function Acao({ rotulo, simbolo, onPress }: { rotulo: string; simbolo: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} onPress={onPress} style={estilos.acao}>
      <Text style={{ fontSize: 18, color: cores.textoSuave }}>{simbolo}</Text>
    </Pressable>
  );
}

// Folha A4: 210 x 297 mm (794 x 1123 px). As margens de cima e de baixo e o espaço entre as partes
const proporcaoA4 = 1123 / 794;
const margemVertical = { larga: 64, estreita: 28 };
const margemLateral = { larga: 72, estreita: 20 };
const espacoEntrePartes = 10;

// novaPagina: a parte sempre abre uma folha nova (veja abreNovaPagina)
type Parte = { id: string; conteudo: ReactNode; novaPagina?: boolean; colado?: boolean };

// Distribui as partes do sermão em páginas do tamanho de uma folha A4. Uma parte que não cabe no resto da página
// começa na página seguinte, com o espaço cinza entre as folhas, como no Google Docs
function paginas(
  partes: Parte[],
  alturas: Record<string, number>,
  larguraFolha: number,
  largo: boolean,
  medir: (id: string, altura: number) => void,
  // O que vai no espaço cinza entre as folhas (o + de página nova), pela última parte da folha de cima
  entre: (ultimaDaFolha: string) => ReactNode,
) {
  const margem = largo ? margemVertical.larga : margemVertical.estreita;
  const lateral = largo ? margemLateral.larga : margemLateral.estreita;
  const util = larguraFolha * proporcaoA4 - 2 * margem;
  let usado = 0;
  const elementos = partes.map((parte, i) => {
    const altura = alturas[parte.id] ?? 0;
    // Sem espaço: encosta também o respiro de 4 px de cada caixa
    const espaco = i > 0 && usado > 0 ? (parte.colado ? -6 : espacoEntrePartes) : 0;
    const quebra = larguraFolha > 0 && usado > 0 && (!!parte.novaPagina || usado + espaco + altura > util);
    const resto = Math.max(0, util - usado);
    usado = quebra ? altura : usado + espaco + altura;
    return (
      <Fragment key={parte.id}>
        {quebra && (
          <View style={{ marginHorizontal: -lateral }}>
            <View style={{ height: resto + margem, backgroundColor: '#FFFFFF' }} />
            <View style={estilos.entreFolhas}>{entre(partes[i - 1].id)}</View>
            <View style={{ height: margem, backgroundColor: '#FFFFFF' }} />
          </View>
        )}
        <View
          style={[estilos.parte, { marginTop: quebra ? 0 : espaco }]}
          onLayout={(e) => medir(parte.id, Math.round(e.nativeEvent.layout.height))}
        >
          {parte.conteudo}
        </View>
      </Fragment>
    );
  });
  // A última página vai até o fim da folha
  return (
    <>
      {elementos}
      {larguraFolha > 0 && usado < util ? <View style={{ height: util - usado }} /> : null}
    </>
  );
}

const estilos = StyleSheet.create({
  novaPagina: { alignItems: 'center', gap: 8, alignSelf: 'stretch', paddingVertical: 4 },
  linhaNovaPagina: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  botaoExcluir: { borderColor: '#E3A8A3' },
  botaoNovaPagina: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B0B5BD',
    backgroundColor: '#FFFFFF',
  },
  textoNovaPagina: { fontSize: 13, fontWeight: '600', color: cores.textoSuave },
  menuNovaPagina: {
    alignSelf: 'stretch',
    gap: 8,
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  desfazer: {
    position: 'absolute',
    right: 16,
    bottom: 76,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#202124',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  textoDesfazer: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  // Mesa cinza do Google Docs em volta da folha
  mesa: { backgroundColor: '#F1F3F4' },
  avisoIA: { gap: 8, borderColor: cores.destaque, borderWidth: 1 },
  textoAvisoIA: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: cores.destaqueEscuro },
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, ...larguraConteudo, maxWidth: 834 },
  meta: { fontSize: 13, color: cores.textoSuave },
  // Sem o contorno preto do navegador ao clicar: o fundo cinza do bloco já mostra onde se está
  entrada: { fontSize: 16, color: cores.texto, paddingVertical: 4, outlineWidth: 0 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // Folha A4 (210 mm = 794 px) com margens de 2,5 cm na tela grande
  folha: {
    width: '100%',
    maxWidth: 794,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    paddingHorizontal: margemLateral.estreita,
    paddingVertical: margemVertical.estreita,
  },
  folhaLarga: { paddingHorizontal: margemLateral.larga, paddingVertical: margemVertical.larga },
  parte: { gap: espacoEntrePartes },
  // Espaço cinza entre uma folha e a próxima, com a borda das duas folhas
  entreFolhas: {
    minHeight: 20,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DADCE0',
    marginHorizontal: -1,
  },
  linhaMeta: { flexDirection: 'row', gap: 12 },
  avisoSalvo: { fontSize: 14, fontWeight: '600', color: '#38761D', textAlign: 'center' },
  linhaBase: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pregarTopo: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: '#202124' },
  textoPregarTopo: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  entradaMeta: {
    fontSize: 13,
    color: cores.textoSuave,
    paddingVertical: 2,
    fontFamily: fonteEsboco,
    minWidth: 0,
    outlineWidth: 0,
  },
  // O tema do sermão com o mesmo fundo verde dos tópicos
  entradaTitulo: {
    alignSelf: 'flex-start',
    minWidth: 220,
    maxWidth: '100%',
    backgroundColor: coresPregacao.fundoTopico,
    paddingHorizontal: 6,
    fontSize: 26,
    fontWeight: '700',
    color: cores.texto,
    paddingVertical: 4,
    fontFamily: fonteEsboco,
    outlineWidth: 0,
  },
  entradaBase: {
    fontSize: 15,
    fontWeight: '600',
    color: coresPregacao.textoBiblico,
    fontFamily: fonteEsboco,
    outlineWidth: 0,
  },
  separador: { height: 1, backgroundColor: '#E8EAED', marginVertical: 8 },
  bloco: { gap: 2, marginHorizontal: -8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  blocoEditando: { backgroundColor: '#F8F9FB' },
  // Tópico com o realce verde só do tamanho do texto, não da linha toda
  entradaComFundo: { alignSelf: 'flex-start', minWidth: 220, paddingHorizontal: 4, fontWeight: '700' },
  rotuloBloco: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, color: '#9AA0A6', textTransform: 'uppercase' },
  leitura: { minHeight: 28, justifyContent: 'center', borderRadius: 4 },
  leituraHover: { backgroundColor: '#F8F9FB' },
  ferramentas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 },
  ferramenta: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  textoFerramenta: { fontSize: 13, fontWeight: '600', color: cores.texto },
  inserir: { gap: 8, marginTop: 4 },
  acoesSermao: { flexDirection: 'row', gap: 8 },
  acaoSermao: { flex: 1 },
  cabecalhoBloco: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Corpo sem molduras: o subtópico em negrito e os pontos recuados embaixo
  quadro: { gap: 0 },
  topoQuadro: { fontWeight: '400' },
  itemQuadro: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 28 },
  marcador: { fontSize: 12, color: '#000000' },
  tituloEstudo: { fontSize: 13, fontWeight: '700', color: cores.apoioTexto },
  textoEstudo: { fontSize: 15, lineHeight: 21, color: cores.texto },
  acoesBloco: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flexShrink: 1,
    rowGap: 4,
  },
  botaoInserir: {
    minHeight: 32,
    paddingHorizontal: 10,
    marginRight: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: cores.destaque,
    justifyContent: 'center',
  },
  botaoInserirAberto: { backgroundColor: cores.destaque },
  textoInserir: { fontSize: 12, fontWeight: '800', color: cores.destaque, letterSpacing: 0.4 },
  inserirAbaixo: {
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    opacity: 0.45,
    marginTop: 4,
  },
  textoInserirAbaixo: { fontSize: 12, fontWeight: '600', color: '#737373' },
  menuInserir: { gap: 8, paddingVertical: 8 },
  acao: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center' },
});

// + no fim de cada folha: abre os tipos de bloco e cria uma página nova começando por ele
function NovaPagina({
  aberto,
  onAbrir,
  onEscolher,
  onExcluir,
}: {
  aberto: boolean;
  onAbrir: () => void;
  onEscolher: (tipo: TipoBloco) => void;
  // Exclui a página de cima (o Desfazer traz de volta)
  onExcluir?: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <View style={estilos.novaPagina}>
      <View style={estilos.linhaNovaPagina}>
        {onExcluir ? (
          confirmando ? (
            <>
              <Text style={estilos.textoNovaPagina}>Excluir a página de cima?</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirmar excluir página"
                onPress={() => {
                  setConfirmando(false);
                  onExcluir();
                }}
                style={[estilos.botaoNovaPagina, estilos.botaoExcluir]}
              >
                <Text style={[estilos.textoNovaPagina, { color: '#B3261E' }]}>Excluir</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                onPress={() => setConfirmando(false)}
                style={estilos.botaoNovaPagina}
              >
                <Text style={estilos.textoNovaPagina}>Cancelar</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Excluir página"
              onPress={() => setConfirmando(true)}
              style={({ pressed }) => [estilos.botaoNovaPagina, pressed && { opacity: 0.6 }]}
            >
              <Text style={estilos.textoNovaPagina}>− Excluir página</Text>
            </Pressable>
          )
        ) : null}
        {!confirmando ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nova página"
            accessibilityState={{ expanded: aberto }}
            onPress={onAbrir}
            style={({ pressed }) => [estilos.botaoNovaPagina, pressed && { opacity: 0.6 }]}
          >
            <Text style={estilos.textoNovaPagina}>{aberto ? '× Fechar' : '+ Nova página'}</Text>
          </Pressable>
        ) : null}
      </View>
      {aberto ? (
        <View style={estilos.menuNovaPagina}>
          <Text style={estilos.meta}>A nova página começa com:</Text>
          <ChipsInserir onEscolher={onEscolher} />
        </View>
      ) : null}
    </View>
  );
}
