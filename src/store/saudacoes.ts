import AsyncStorage from '@react-native-async-storage/async-storage';
import { saudacaoOriginal, type BlocosSaudacao } from '../data/modelos';

// Saudações editadas pelo JILDEAN ficam no aparelho; sem edição, vale a original do app
const chave = (id: string) => `saudacao:${id}`;

export async function lerSaudacao(id: string): Promise<BlocosSaudacao | undefined> {
  const guardada = await AsyncStorage.getItem(chave(id)).catch(() => null);
  return guardada ? (JSON.parse(guardada) as BlocosSaudacao) : saudacaoOriginal(id);
}

export const guardarSaudacao = (id: string, blocos: BlocosSaudacao) =>
  AsyncStorage.setItem(chave(id), JSON.stringify(blocos));

export const restaurarSaudacao = (id: string) => AsyncStorage.removeItem(chave(id));
