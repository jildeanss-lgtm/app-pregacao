import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BlocoInicial, Modelo, TipoBloco } from '../data/modelos';
import type { EtapaEstudo } from '../data/etapas';
import type { Genero } from '../data/roteiro';

export type Bloco = {
  id: string;
  tipo: TipoBloco;
  texto: string;
  // Nome próprio do bloco (ex.: "Versículo de apoio") e dica de preenchimento
  rotulo?: string;
  dica?: string;
};

export type Pregacao = {
  local: string;
  data: string;
  observacoes: string;
};

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
  temas?: string[];
  blocos: Bloco[];
  pregacoes: Pregacao[];
  atualizadoEm: string;
};

const CHAVE = 'sermoes:v1';
const CHAVE_ESTUDO = 'estudo:v1';

// Estudo em andamento nas abas Bíblia e Estudo: o texto escolhido e as respostas. Ao criar um sermão,
// ele vai junto para o sermão
export type DadosEstudo = Pick<Sermao, 'textoBase' | 'genero' | 'respostas' | 'anotacoes' | 'estudo' | 'notasBiblia' | 'temas'>;

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
  adicionarBloco: (id: string, tipo: TipoBloco, texto?: string) => void;
};

const SermoesContexto = createContext<Contexto | null>(null);

export function SermoesProvider({ children }: { children: ReactNode }) {
  const [sermoes, setSermoes] = useState<Sermao[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [estudo, setEstudo] = useState<DadosEstudo>({ textoBase: '' });

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CHAVE), AsyncStorage.getItem(CHAVE_ESTUDO)])
      .then(([salvo, estudoSalvo]) => {
        if (salvo) setSermoes((JSON.parse(salvo) as Sermao[]).map(migrar));
        if (estudoSalvo) setEstudo(JSON.parse(estudoSalvo));
      })
      .finally(() => setCarregado(true));
  }, []);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE, JSON.stringify(sermoes));
  }, [sermoes, carregado]);

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
  }, []);

  const adicionarBloco = useCallback(
    (id: string, tipo: TipoBloco, texto = '') => {
      atualizar(id, (s) => ({ ...s, blocos: [...s.blocos, { id: novoId(), tipo, texto }] }));
    },
    [atualizar],
  );

  const valor = useMemo(
    () => ({ carregado, estudo, mudarEstudo, sermoes, criar, atualizar, remover, adicionarBloco }),
    [carregado, estudo, mudarEstudo, sermoes, criar, atualizar, remover, adicionarBloco],
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

// Estimativa simples: cerca de 130 palavras faladas por minuto, mais 2 minutos por tópico
export function minutosEstimados(s: Sermao) {
  const palavras = s.blocos.reduce((t, b) => t + b.texto.split(/\s+/).filter(Boolean).length, 0);
  const topicos = s.blocos.filter((b) => b.tipo === 'topico').length;
  return Math.max(1, Math.round(palavras / 130 + topicos * 2));
}
