import AsyncStorage from '@react-native-async-storage/async-storage';
import { chamarClaude } from './estudo';

// "Explicar palavra": a IA traduz o verbete de Strong e mostra como a palavra serve ao sermão. Cada explicação fica
// guardada no aparelho (por palavra e versículo), então abrir de novo é instantâneo e não gasta crédito

export type ExplicacaoPalavra = {
  significado: string;
  nesteVersiculo: string;
  naBiblia: string;
  paraOSermao: string;
  fraseDeEfeito: string;
};

export type DadosPalavra = {
  strong: string;
  lema: string;
  transliteracao?: string;
  definicao?: string;
  kjv?: string;
  forma: string;
  morfologia: string;
  traducoes: string;
  referencia: string;
  versiculo: string;
  exemplos: string[];
};

const esquema = {
  type: 'object',
  properties: {
    significado: { type: 'string' },
    nesteVersiculo: { type: 'string' },
    naBiblia: { type: 'string' },
    paraOSermao: { type: 'string' },
    fraseDeEfeito: { type: 'string' },
  },
  required: ['significado', 'nesteVersiculo', 'naBiblia', 'paraOSermao', 'fraseDeEfeito'],
  additionalProperties: false,
};

const chaveGuardada = (d: DadosPalavra) => `palavra:${d.strong}:${d.referencia}`;

export async function explicacaoGuardada(d: DadosPalavra): Promise<ExplicacaoPalavra | null> {
  const texto = await AsyncStorage.getItem(chaveGuardada(d));
  return texto ? (JSON.parse(texto) as ExplicacaoPalavra) : null;
}

export async function explicarPalavra(chave: string, d: DadosPalavra): Promise<ExplicacaoPalavra> {
  const pedido = `Você ajuda um pregador brasileiro a estudar uma palavra do texto original da Bíblia. Escreva em português do Brasil, simples e direto, sem termos em inglês.

Palavra: ${d.lema}${d.transliteracao ? ` (${d.transliteracao})` : ''}, Strong ${d.strong}
Definição de Strong (em inglês): ${d.definicao || 'não há'}
Traduções na KJV: ${d.kjv || 'não há'}
Forma no texto: ${d.forma} (${d.morfologia})
Traduzida na Bíblia Livre como: ${d.traducoes || 'não há'}
Versículo: ${d.referencia} — "${d.versiculo}"
Outros versículos onde aparece: ${d.exemplos.join('; ') || 'não há'}

Responda com:
- significado: a definição de Strong traduzida e explicada em 2 a 3 frases (sentido básico e nuances)
- nesteVersiculo: em 2 a 3 frases, o que essa palavra, nessa forma, acrescenta ao sentido de ${d.referencia}
- naBiblia: em 2 a 3 frases, como ela é usada no resto da Bíblia, citando 2 ou 3 referências
- paraOSermao: em 2 a 3 frases, uma aplicação prática para a igreja hoje a partir dessa palavra
- fraseDeEfeito: uma frase curta e marcante para o sermão, baseada nessa palavra

Não invente dados de dicionário: se não souber algo, diga de forma geral.`;
  const resultado = JSON.parse(await chamarClaude(chave, pedido, esquema)) as ExplicacaoPalavra;
  await AsyncStorage.setItem(chaveGuardada(d), JSON.stringify(resultado));
  return resultado;
}
