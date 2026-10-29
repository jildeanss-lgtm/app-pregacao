import AsyncStorage from '@react-native-async-storage/async-storage';
import { opcoesIntroducao, type OpcaoIntroducao } from '../data/modelos';

// Opções de introdução editadas pelo JILDEAN ficam no aparelho: a descrição (dica da caixa) e o texto que já
// entra na caixa da introdução. Sem edição, vale a original do app
export type IntroducaoEditada = { dica: string; texto: string };
const chave = (id: string) => `introducao:${id}`;

export async function lerIntroducao(id: OpcaoIntroducao): Promise<IntroducaoEditada> {
  const original = { dica: opcoesIntroducao.find((o) => o.id === id)?.dica ?? '', texto: '' };
  const guardada = await AsyncStorage.getItem(chave(id)).catch(() => null);
  return guardada ? { ...original, ...(JSON.parse(guardada) as Partial<IntroducaoEditada>) } : original;
}

export async function lerIntroducoes() {
  const todas = {} as Record<OpcaoIntroducao, IntroducaoEditada>;
  for (const { id } of opcoesIntroducao) todas[id] = await lerIntroducao(id);
  return todas;
}

export const guardarIntroducao = (id: OpcaoIntroducao, i: IntroducaoEditada) =>
  AsyncStorage.setItem(chave(id), JSON.stringify(i));

export const restaurarIntroducao = (id: OpcaoIntroducao) => AsyncStorage.removeItem(chave(id));
