import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  MARCA_TEXTO,
  blocosDaCapa,
  type BlocoInicial,
  type BlocosSaudacao,
  type Modelo,
  type TipoBloco,
} from '../data/modelos';
import { rotulosTextoReferencia } from '../estilo';
import type { EtapaEstudo } from '../data/etapas';
import type { Genero } from '../data/roteiro';
import { pedirToken, tokenAtual } from '../ia/drive';
import { juntar, sincronizar } from './nuvem';

export type Bloco = {
  id: string;
  tipo: TipoBloco;
  texto: string;
  // Nome próprio do bloco (ex.: "Versículo de apoio") e dica de preenchimento
  rotulo?: string;
  dica?: string;
  // Criado pelo + entre as folhas: começa numa página nova
  novaPagina?: boolean;
  // Sem o espaço que separa esta caixa da de cima
  colado?: boolean;
  // Caixa da capa do tipo de sermão (ver camposCapa)
  capa?: string;
};

export type Pregacao = {
  local: string;
  data: string;
  observacoes: string;
};

export type TrechoBiblioteca = { livro: string; autor: string; local: string; trecho: string; comentario: string };

export type Sermao = {
  id: string;
  titulo: string;
  textoBase: string;
  modelo: Modelo;
  culto?: string;
  data?: string;
  genero?: Genero;
  // Etapa em que o sermão parou (ver data/etapas) e as anotações de cada etapa do estudo
  etapa?: number;
  // 3 = quatro etapas: Bíblia, Estudo, Sermão e Pregar
  versao?: number;
  anotacoes?: Partial<Record<EtapaEstudo, string>>;
  // Respostas às perguntas do estudo, pela própria pergunta
  respostas?: Record<string, string>;
  // Anotações da versão antiga do roteiro, mostradas na observação
  estudo?: string;
  // Anotações livres feitas na aba Bíblia e os temas sugeridos pela IA no estudo
  notasBiblia?: string;
  // O que a pesquisa na biblioteca do Drive (pelo claude.ai) trouxe sobre o texto
  notasBiblioteca?: string;
  // Trechos dos livros da biblioteca que a IA trouxe sobre o tema, mostrados em cartões na aba Biblioteca
  trechosBiblioteca?: TrechoBiblioteca[];
  // Resumo de todo o estudo, já em forma de sermão, que serve de base para montar o sermão
  resumo?: string;
  temas?: string[];
  // O que foi preenchido na capa do tipo de sermão (ver camposCapa), pelo id de cada campo
  capa?: Record<string, string>;
  // Enquanto a IA escreve o objetivo e a introdução de um sermão novo, e o erro se não der certo
  iaPreparando?: boolean;
  iaErro?: string;
  // Google Docs do sermão no Drive (Abrir no Google Docs) e a hora em que o app gravou nele por último
  docId?: string;
  docEm?: string;
  // Saudação escolhida ao criar ('' = sem saudação); sermões antigos não têm
  saudacao?: string;
  blocos: Bloco[];
  pregacoes: Pregacao[];
  atualizadoEm: string;
};

const CHAVE = 'sermoes:v1';
const CHAVE_ESTUDO = 'estudo:v1';
// Sermões apagados e quando, para apagar também a cópia do Drive e dos outros aparelhos
const CHAVE_APAGADOS = 'sermoes:apagados';
// Depois do primeiro login, o app sincroniza sozinho com o Drive enquanto o login valer (uma hora)
const CHAVE_NUVEM = 'nuvem:ligada';

// Situação da cópia no Google Drive (só na versão web)
export type Nuvem = {
  disponivel: boolean;
  ligada: boolean;
  estado: 'parado' | 'sincronizando' | 'ok' | 'erro' | 'login';
  quando?: string;
  erro?: string;
};

// Estudo em andamento nas abas Bíblia e Estudo: o texto escolhido e as respostas. Ao criar um sermão,
// ele vai junto para o sermão
export type DadosEstudo = Pick<
  Sermao,
  | 'textoBase'
  | 'genero'
  | 'respostas'
  | 'anotacoes'
  | 'estudo'
  | 'notasBiblia'
  | 'notasBiblioteca'
  | 'trechosBiblioteca'
  | 'resumo'
  | 'temas'
>;

// Etapas antigas (versão 1: Leitura...Pregação; versão 2: Bíblia, Leitura...Pregação) viram as quatro de agora
const etapaV2: Record<number, number> = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 1, 5: 2, 6: 3 };

function migrar(s: Sermao): Sermao {
  if (s.versao === 3 || s.etapa === undefined) return { ...s, versao: 3 };
  const v2 = s.versao === 2 ? s.etapa : s.etapa + 1;
  return { ...s, versao: 3, etapa: etapaV2[v2] ?? 2 };
}

function novoId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export type NovoSermao = {
  titulo: string;
  textoBase: string;
  modelo: Modelo;
  culto: string;
  data: string;
  genero?: Genero;
  etapa?: number;
  respostas?: Record<string, string>;
  anotacoes?: Partial<Record<EtapaEstudo, string>>;
  saudacao?: string;
  capa?: Record<string, string>;
  blocos: BlocoInicial[];
};

type Contexto = {
  carregado: boolean;
  estudo: DadosEstudo;
  mudarEstudo: (mudar: (e: DadosEstudo) => DadosEstudo) => void;
  sermoes: Sermao[];
  criar: (dados: NovoSermao) => Sermao;
  atualizar: (id: string, mudar: (s: Sermao) => Sermao) => void;
  remover: (id: string) => void;
  nuvem: Nuvem;
  // Pelo toque do usuário: pode abrir o login do Google
  sincronizarAgora: () => Promise<void>;
  // Sem depoisDe, o bloco vai para o fim do sermão; com null, para o começo
  adicionarBloco: (id: string, tipo: TipoBloco, texto?: string, depoisDe?: string | null, novaPagina?: boolean) => void;
};

const SermoesContexto = createContext<Contexto | null>(null);

export function SermoesProvider({ children }: { children: ReactNode }) {
  const [sermoes, setSermoes] = useState<Sermao[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [estudo, setEstudo] = useState<DadosEstudo>({ textoBase: '' });
  const [apagados, setApagados] = useState<Record<string, string>>({});
  const [nuvem, setNuvem] = useState<Nuvem>({ disponivel: Platform.OS === 'web', ligada: false, estado: 'parado' });

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CHAVE),
      AsyncStorage.getItem(CHAVE_ESTUDO),
      AsyncStorage.getItem(CHAVE_APAGADOS),
      AsyncStorage.getItem(CHAVE_NUVEM),
    ])
      .then(([salvo, estudoSalvo, apagadosSalvos, ligada]) => {
        if (salvo) setSermoes((JSON.parse(salvo) as Sermao[]).map(migrar));
        if (estudoSalvo) setEstudo(JSON.parse(estudoSalvo));
        if (apagadosSalvos) setApagados(JSON.parse(apagadosSalvos));
        if (ligada && Platform.OS === 'web') setNuvem((n) => ({ ...n, ligada: true, estado: 'login' }));
      })
      .finally(() => setCarregado(true));
  }, []);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE, JSON.stringify(sermoes));
  }, [sermoes, carregado]);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE_APAGADOS, JSON.stringify(apagados));
  }, [apagados, carregado]);

  // A sincronização lê sempre a lista mais recente, mesmo chamada por um efeito antigo
  const atual = useRef({ sermoes, apagados });
  useEffect(() => {
    atual.current = { sermoes, apagados };
  }, [sermoes, apagados]);
  const rodando = useRef(false);
  // O que o Drive já tem, para não sincronizar de novo sem mudança
  const enviado = useRef('');

  const sincronizarCom = useCallback(async (t: string) => {
    if (rodando.current) return;
    rodando.current = true;
    setNuvem((n) => ({ ...n, estado: 'sincronizando', erro: undefined }));
    try {
      const dados = await sincronizar(t, atual.current);
      // O que mudou no aparelho durante a sincronização não se perde: entra na próxima
      const junto = juntar(atual.current, dados);
      atual.current = junto;
      enviado.current = JSON.stringify(dados);
      setSermoes(junto.sermoes);
      setApagados(junto.apagados);
      setNuvem((n) => ({ ...n, estado: 'ok', quando: new Date().toISOString() }));
    } catch (e) {
      setNuvem((n) => ({ ...n, estado: tokenAtual() ? 'erro' : 'login', erro: (e as Error).message }));
    } finally {
      rodando.current = false;
    }
  }, []);

  const sincronizarAgora = useCallback(async () => {
    try {
      const t = await pedirToken();
      await AsyncStorage.setItem(CHAVE_NUVEM, '1');
      setNuvem((n) => ({ ...n, ligada: true }));
      await sincronizarCom(t);
    } catch (e) {
      setNuvem((n) => ({ ...n, estado: 'erro', erro: (e as Error).message }));
    }
  }, [sincronizarCom]);

  // Cada mudança vai para o Drive alguns segundos depois, se o login ainda valer
  useEffect(() => {
    if (!carregado || !nuvem.ligada) return;
    if (JSON.stringify({ sermoes, apagados }) === enviado.current) return;
    const espera = setTimeout(() => {
      const t = tokenAtual();
      if (t) sincronizarCom(t);
      else setNuvem((n) => (n.estado === 'sincronizando' ? n : { ...n, estado: 'login' }));
    }, 4000);
    return () => clearTimeout(espera);
  }, [sermoes, apagados, carregado, nuvem.ligada, sincronizarCom]);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE_ESTUDO, JSON.stringify(estudo));
  }, [estudo, carregado]);

  const mudarEstudo = useCallback((mudar: (e: DadosEstudo) => DadosEstudo) => setEstudo(mudar), []);

  const atualizar = useCallback((id: string, mudar: (s: Sermao) => Sermao) => {
    setSermoes((lista) =>
      lista.map((s) => (s.id === id ? { ...mudar(s), atualizadoEm: new Date().toISOString() } : s)),
    );
  }, []);

  const criar = useCallback(({ blocos, ...dados }: NovoSermao) => {
    const sermao: Sermao = {
      id: novoId(),
      ...dados,
      versao: 3,
      blocos: blocos.map((b) => ({ ...b, id: novoId(), texto: b.texto ?? '' })),
      pregacoes: [],
      atualizadoEm: new Date().toISOString(),
    };
    setSermoes((lista) => [sermao, ...lista]);
    return sermao;
  }, []);

  const remover = useCallback((id: string) => {
    setSermoes((lista) => lista.filter((s) => s.id !== id));
    setApagados((a) => ({ ...a, [id]: new Date().toISOString() }));
  }, []);

  const adicionarBloco = useCallback(
    (id: string, tipo: TipoBloco, texto = '', depoisDe?: string | null, novaPagina?: boolean) => {
      atualizar(id, (s) => {
        const blocos = [...s.blocos];
        const posicao = depoisDe ? blocos.findIndex((b) => b.id === depoisDe) + 1 : 0;
        const novo: Bloco = { id: novoId(), tipo, texto, ...(novaPagina ? { novaPagina } : {}) };
        blocos.splice(depoisDe === null ? 0 : posicao > 0 ? posicao : blocos.length, 0, novo);
        return { ...s, blocos };
      });
    },
    [atualizar],
  );

  const valor = useMemo(
    () => ({
      carregado,
      estudo,
      mudarEstudo,
      sermoes,
      criar,
      atualizar,
      remover,
      adicionarBloco,
      nuvem,
      sincronizarAgora,
    }),
    [carregado, estudo, mudarEstudo, sermoes, criar, atualizar, remover, adicionarBloco, nuvem, sincronizarAgora],
  );

  return <SermoesContexto.Provider value={valor}>{children}</SermoesContexto.Provider>;
}

export function useSermoes() {
  const ctx = useContext(SermoesContexto);
  if (!ctx) throw new Error('useSermoes precisa estar dentro de SermoesProvider');
  return ctx;
}

export function useSermao(id: string | undefined) {
  const { sermoes } = useSermoes();
  return sermoes.find((s) => s.id === id);
}

// Troca a saudação de um sermão já criado: o que vem entre o objetivo e o TEXTO (saudação, qual texto e
// agradecimentos) e entre o TEXTO e a introdução sai, e entra a saudação nova
export function trocarSaudacao(blocos: Bloco[], nova: BlocosSaudacao | undefined, textoBase: string): Bloco[] {
  const criarBlocos = (lista: BlocoInicial[]) =>
    lista.map((b) => ({ ...b, id: novoId(), texto: (b.texto ?? '').split(MARCA_TEXTO).join(textoBase || '...') }));
  // Fim da capa: o objetivo e as caixas da capa do tipo de sermão
  const depoisDaCapa = blocos.findIndex((b) => b.tipo !== 'objetivo' && !b.capa);
  const objetivo = (depoisDaCapa < 0 ? blocos.length : depoisDaCapa) - 1;
  const texto = blocos.findIndex((b) => b.tipo === 'versiculo' && rotulosTextoReferencia.includes(b.rotulo ?? ''));
  const introducao = blocos.findIndex((b) => b.tipo === 'introducao');
  const fim = introducao >= 0 ? introducao : texto >= 0 ? texto + 1 : objetivo + 1;
  if (texto < 0 || texto > fim)
    return [
      ...blocos.slice(0, objetivo + 1),
      ...criarBlocos([...(nova?.antes ?? []), ...(nova?.depois ?? [])]),
      ...blocos.slice(objetivo + 1),
    ];
  return [
    ...blocos.slice(0, objetivo + 1),
    ...criarBlocos(nova?.antes ?? []),
    blocos[texto],
    ...criarBlocos(nova?.depois ?? []),
    ...blocos.slice(fim),
  ];
}

// Refaz as caixas da capa do tipo de sermão (antes e depois do quadro do objetivo) com o que foi preenchido
export function trocarCapa(blocos: Bloco[], tipo: string, capa: Record<string, string>): Bloco[] {
  const { antes, depois } = blocosDaCapa(tipo, capa);
  const criarBlocos = (lista: BlocoInicial[]) => lista.map((b) => ({ ...b, id: novoId(), texto: b.texto ?? '' }));
  const resto = blocos.filter((b) => !b.capa);
  const i = resto.findIndex((b) => b.tipo === 'objetivo') + 1;
  return [...criarBlocos(antes), ...resto.slice(0, i), ...criarBlocos(depois), ...resto.slice(i)];
}

// Estimativa simples: cerca de 130 palavras faladas por minuto, mais 2 minutos por tópico
export function minutosEstimados(s: Sermao) {
  const palavras = s.blocos.reduce((t, b) => t + b.texto.split(/\s+/).filter(Boolean).length, 0);
  const topicos = s.blocos.filter((b) => b.tipo === 'topico').length;
  return Math.max(1, Math.round(palavras / 130 + topicos * 2));
}
