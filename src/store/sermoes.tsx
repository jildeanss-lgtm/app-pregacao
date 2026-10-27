import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { modelos, type Modelo, type TipoBloco } from '../data/modelos';

export type Bloco = {
  id: string;
  tipo: TipoBloco;
  texto: string;
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
  blocos: Bloco[];
  pregacoes: Pregacao[];
  atualizadoEm: string;
};

const CHAVE = 'sermoes:v1';

function novoId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

type Contexto = {
  carregado: boolean;
  sermoes: Sermao[];
  criar: (modelo: Modelo) => Sermao;
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
        if (salvo) setSermoes(JSON.parse(salvo));
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

  const criar = useCallback((modelo: Modelo) => {
    const def = modelos.find((m) => m.id === modelo)!;
    const sermao: Sermao = {
      id: novoId(),
      titulo: '',
      textoBase: '',
      modelo,
      blocos: def.blocos.map((tipo) => ({ id: novoId(), tipo, texto: '' })),
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
