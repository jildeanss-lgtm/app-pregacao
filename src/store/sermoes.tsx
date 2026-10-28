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
  // 2 = já conta a etapa Bíblia antes da Leitura
  versao?: number;
  anotacoes?: Partial<Record<EtapaEstudo, string>>;
  // Respostas às perguntas do estudo, pela própria pergunta
  respostas?: Record<string, string>;
  // Anotações da versão antiga do roteiro, mostradas na observação
  estudo?: string;
  blocos: Bloco[];
  pregacoes: Pregacao[];
  atualizadoEm: string;
};

const CHAVE = 'sermoes:v1';

// A etapa Bíblia entrou antes da Leitura: etapas salvas antes disso andam uma casa
function migrar(s: Sermao): Sermao {
  if (s.versao === 2) return s;
  return { ...s, versao: 2, etapa: s.etapa === undefined ? undefined : s.etapa + 1 };
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
  blocos: BlocoInicial[];
};

type Contexto = {
  carregado: boolean;
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

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((salvo) => {
        if (salvo) setSermoes((JSON.parse(salvo) as Sermao[]).map(migrar));
      })
      .finally(() => setCarregado(true));
  }, []);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE, JSON.stringify(sermoes));
  }, [sermoes, carregado]);

  const atualizar = useCallback((id: string, mudar: (s: Sermao) => Sermao) => {
    setSermoes((lista) =>
      lista.map((s) => (s.id === id ? { ...mudar(s), atualizadoEm: new Date().toISOString() } : s)),
    );
  }, []);

  const criar = useCallback(({ blocos, ...dados }: NovoSermao) => {
    const sermao: Sermao = {
      id: novoId(),
      ...dados,
      versao: 2,
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
    () => ({ carregado, sermoes, criar, atualizar, remover, adicionarBloco }),
    [carregado, sermoes, criar, atualizar, remover, adicionarBloco],
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
