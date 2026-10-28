import Anthropic from '@anthropic-ai/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pericopeDe } from '../data/pericope';
import { carregarTexto } from '../data/portugues';
import { generos, perguntasDaEtapa, referenciaDoTexto } from '../data/roteiro';
import type { DadosEstudo } from '../store/sermoes';

// Respostas do estudo pela IA. Funciona de dois jeitos: com a chave da API guardada só no aparelho, o app chama
// o Claude direto; sem chave, o pedido é copiado para colar no claude.ai e a resposta é colada de volta

const CHAVE_IA = 'ia:chave';
const partes = ['observacao', 'interpretacao', 'aplicacao'] as const;
const nomesPartes = { observacao: 'Observação', interpretacao: 'Interpretação', aplicacao: 'Aplicação' };

export const lerChave = async () => (await AsyncStorage.getItem(CHAVE_IA)) ?? '';
export const guardarChave = (chave: string) =>
  chave ? AsyncStorage.setItem(CHAVE_IA, chave) : AsyncStorage.removeItem(CHAVE_IA);

export type ResultadoIA = { respostas: Record<string, string>; temas: string[] };

// Todas as perguntas das três partes, na ordem em que aparecem, numeradas a partir de 1
export function perguntasDoEstudo(estudo: DadosEstudo) {
  return partes.flatMap((parte) =>
    perguntasDaEtapa(parte, estudo.textoBase, estudo.genero).flatMap((g) =>
      g.perguntas.map((q) => ({ parte, grupo: g.titulo, pergunta: q.pergunta })),
    ),
  );
}

// O pedido completo: o texto escolhido, a perícope em volta e as perguntas
export async function montarPedido(estudo: DadosEstudo) {
  const ref = referenciaDoTexto(estudo.textoBase);
  if (!ref) throw new Error('Escolha um texto na aba Bíblia.');
  const capitulo = (await carregarTexto(ref.livro.codigo))[ref.capitulo - 1] ?? [];
  // Sem versículo, o capítulo inteiro
  const de = ref.de ?? 1;
  const ate = ref.ate ?? (ref.de ? de : capitulo.length);
  const per = pericopeDe(ref.livro.codigo, ref.capitulo, de, ate, capitulo.length);
  const versos = (de: number, fim: number) =>
    capitulo
      .slice(de - 1, fim)
      .map((t, i) => `${de + i} ${t}`)
      .join('\n');
  const genero = generos.find((g) => g.id === estudo.genero)?.nome;
  const perguntas = perguntasDoEstudo(estudo);

  return `Você ajuda um pregador a estudar um texto bíblico para montar um sermão. Responda em português do Brasil.

Texto escolhido: ${estudo.textoBase} (Bíblia Livre)
${versos(de, ate)}

Perícope em volta (${ref.livro.nome} ${ref.capitulo}:${per.de}-${per.ate}):
${versos(per.de, per.ate)}
${genero ? `\nGênero literário: ${genero}\n` : ''}
Responda a cada pergunta abaixo sobre o texto escolhido. Use a perícope, o livro de ${ref.livro.nome} e o restante da Bíblia como contexto, citando as referências que confirmam a resposta. Seja direto: de 2 a 5 frases por resposta, sem repetir a pergunta.

${perguntas.map((q, i) => `${i + 1}. [${nomesPartes[q.parte]} - ${q.grupo}] ${q.pergunta}`).join('\n')}

Por fim, sugira 4 temas de sermão a partir deste texto, cada um com no máximo 8 palavras.

Responda somente com um JSON neste formato, sem nenhum texto fora dele:
{"respostas": [{"numero": 1, "resposta": "..."}], "temas": ["...", "...", "...", "..."]}`;
}

const esquema = {
  type: 'object',
  properties: {
    respostas: {
      type: 'array',
      items: {
        type: 'object',
        properties: { numero: { type: 'integer' }, resposta: { type: 'string' } },
        required: ['numero', 'resposta'],
        additionalProperties: false,
      },
    },
    temas: { type: 'array', items: { type: 'string' } },
  },
  required: ['respostas', 'temas'],
  additionalProperties: false,
};

// Lê o JSON da resposta (vindo da API ou colado do claude.ai) e liga cada resposta à sua pergunta
export function lerResultado(estudo: DadosEstudo, texto: string): ResultadoIA {
  const inicio = texto.indexOf('{');
  const fim = texto.lastIndexOf('}');
  if (inicio < 0 || fim < inicio) throw new Error('A resposta não tem o JSON esperado. Cole a resposta inteira.');
  let dados: { respostas?: { numero?: number; resposta?: string }[]; temas?: string[] };
  try {
    dados = JSON.parse(texto.slice(inicio, fim + 1));
  } catch {
    throw new Error('Não consegui ler a resposta. Cole a resposta inteira do Claude.');
  }
  const perguntas = perguntasDoEstudo(estudo);
  const respostas: Record<string, string> = {};
  for (const r of dados.respostas ?? []) {
    const q = r.numero ? perguntas[r.numero - 1] : undefined;
    if (q && r.resposta?.trim()) respostas[q.pergunta] = r.resposta.trim();
  }
  const temas = (dados.temas ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);
  return { respostas, temas };
}

export async function responderComChave(chave: string, estudo: DadosEstudo): Promise<ResultadoIA> {
  const cliente = new Anthropic({ apiKey: chave, dangerouslyAllowBrowser: true });
  const pedido = await montarPedido(estudo);
  let resposta;
  try {
    resposta = await cliente.beta.messages
      .stream({
        model: 'claude-opus-5-5',
        max_tokens: 64000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: esquema } },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        messages: [{ role: 'user', content: pedido }],
      })
      .finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error('Chave inválida. Confira a chave da Anthropic.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new Error('A chave não tem permissão. Confira o console.');
    if (e instanceof Anthropic.RateLimitError) throw new Error('Muitos pedidos agora. Tente de novo em um minuto.');
    if (e instanceof Anthropic.BadRequestError && /credit/i.test(e.message))
      throw new Error('Sem crédito na conta da Anthropic. Adicione crédito em Billing.');
    if (e instanceof Anthropic.APIError) throw new Error(`Erro da IA (${e.status}): ${e.message}`);
    throw new Error('Sem conexão com a IA. Verifique a internet.');
  }
  if (resposta.stop_reason === 'refusal') throw new Error('A IA não respondeu a este pedido.');
  const texto = resposta.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  return lerResultado(estudo, texto);
}
