import AsyncStorage from '@react-native-async-storage/async-storage';
import { saudacaoOriginal, saudacoes, type BlocosSaudacao } from '../data/modelos';

// Saudações editadas pelo JILDEAN ficam no aparelho; sem edição, vale a original do app
const chave = (id: string) => `saudacao:${id}`;
// Quando cada saudação foi mudada pela última vez, para a cópia do Drive saber qual é a mais nova
const chaveData = (id: string) => `saudacao:${id}:em`;

export async function lerSaudacao(id: string): Promise<BlocosSaudacao | undefined> {
  const guardada = await AsyncStorage.getItem(chave(id)).catch(() => null);
  return guardada ? (JSON.parse(guardada) as BlocosSaudacao) : saudacaoOriginal(id);
}

export const guardarSaudacao = (id: string, blocos: BlocosSaudacao, em = new Date().toISOString()) =>
  AsyncStorage.multiSet([
    [chave(id), JSON.stringify(blocos)],
    [chaveData(id), em],
  ]);

export async function restaurarSaudacao(id: string, em = new Date().toISOString()) {
  await AsyncStorage.removeItem(chave(id));
  await AsyncStorage.setItem(chaveData(id), em);
}

// Saudação como vai para o Drive: blocos null quando vale a original
export type SaudacaoGuardada = { blocos: BlocosSaudacao | null; atualizadoEm: string };

export async function saudacoesGuardadas() {
  const todas: Record<string, SaudacaoGuardada> = {};
  for (const { id } of saudacoes) {
    const [[, blocos], [, em]] = await AsyncStorage.multiGet([chave(id), chaveData(id)]);
    if (em) todas[id] = { blocos: blocos ? JSON.parse(blocos) : null, atualizadoEm: em };
  }
  return todas;
}
