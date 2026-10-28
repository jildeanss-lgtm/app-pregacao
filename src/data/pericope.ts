import pericopes from './pericopes.json';

// Início de cada perícope [capítulo, versículo], pelos títulos de seção da BSB (domínio público).
// A Bíblia Livre não tem títulos, então usamos só onde cada seção começa.
const inicios = pericopes as Record<string, number[][]>;

const antes = (a: number[], b: number[]) => a[0] - b[0] || a[1] - b[1];

// Versículos da perícope que contém cap:de-ate, sem sair do capítulo
export function pericopeDe(codigo: string, cap: number, de: number, ate: number, totalVersos: number) {
  const lista = inicios[codigo] ?? [];
  const inicio = lista.filter((i) => antes(i, [cap, de]) <= 0).at(-1);
  const proxima = lista.find((i) => antes(i, [cap, ate]) > 0);
  return {
    de: inicio && inicio[0] === cap ? inicio[1] : 1,
    ate: proxima && proxima[0] === cap ? proxima[1] - 1 : totalVersos,
  };
}
