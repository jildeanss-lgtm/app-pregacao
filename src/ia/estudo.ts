import Anthropic from '@anthropic-ai/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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

// Quem mostra a chave fica sabendo quando ela muda (o campo da chave fica no fim da página, longe do botão)
const ouvintes = new Set<(chave: string) => void>();
export const guardarChave = async (chave: string) => {
  await (chave ? AsyncStorage.setItem(CHAVE_IA, chave) : AsyncStorage.removeItem(CHAVE_IA));
  ouvintes.forEach((ouvir) => ouvir(chave));
};

export function useChave() {
  const [chave, setChave] = useState('');
  useEffect(() => {
    lerChave().then(setChave);
    ouvintes.add(setChave);
    return () => {
      ouvintes.delete(setChave);
    };
  }, []);
  return chave;
}

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

// Uma chamada ao Claude com a resposta presa ao esquema JSON; devolve o texto da resposta
async function chamarClaude(chave: string, pedido: string, schema: Record<string, unknown>) {
  const cliente = new Anthropic({ apiKey: chave, dangerouslyAllowBrowser: true });
  let resposta;
  try {
    resposta = await cliente.beta.messages
      .stream({
        model: 'claude-opus-5-5',
        max_tokens: 64000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        messages: [{ role: 'user', content: pedido }],
      })
      .finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError)
      throw new Error(
        'A Anthropic recusou a chave. Toque em "Trocar ou remover a chave", apague o campo e cole a chave de novo (ou crie outra no console).',
      );
    if (e instanceof Anthropic.PermissionDeniedError) throw new Error('A chave não tem permissão. Confira o console.');
    if (e instanceof Anthropic.RateLimitError) throw new Error('Muitos pedidos agora. Tente de novo em um minuto.');
    if (e instanceof Anthropic.BadRequestError && /credit/i.test(e.message))
      throw new Error('Sem crédito na conta da Anthropic. Adicione crédito em Billing.');
    if (e instanceof Anthropic.APIConnectionError) throw new Error('Sem conexão com a IA. Verifique a internet.');
    if (e instanceof Anthropic.APIError) throw new Error(`Erro da IA (${e.status}): ${e.message}`);
    throw new Error('Sem conexão com a IA. Verifique a internet.');
  }
  if (resposta.stop_reason === 'refusal') throw new Error('A IA não respondeu a este pedido.');
  return resposta.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
}

export async function responderComChave(chave: string, estudo: DadosEstudo): Promise<ResultadoIA> {
  return lerResultado(estudo, await chamarClaude(chave, await montarPedido(estudo), esquema));
}

// "Romanos 7:15-20" -> o texto dos versículos na Bíblia Livre, com os números, para o bloco Texto referência
export async function textoDosVersiculos(textoBase: string) {
  const ref = referenciaDoTexto(textoBase);
  if (!ref) return '';
  const capitulo = (await carregarTexto(ref.livro.codigo))[ref.capitulo - 1] ?? [];
  const de = ref.de ?? 1;
  const ate = ref.ate ?? (ref.de ? de : capitulo.length);
  return capitulo
    .slice(de - 1, ate)
    .map((t, i) => `${de + i} ${t}`)
    .join(' ');
}

export type DadosNovoSermao = {
  textoBase: string;
  titulo: string;
  modelo: string;
  tipoObjetivo?: string;
  introducao: { nome: string; dica: string };
  respostas?: Record<string, string>;
};

const esquemaSermao = {
  type: 'object',
  properties: { objetivos: { type: 'array', items: { type: 'string' } }, introducao: { type: 'string' } },
  required: ['objetivos', 'introducao'],
  additionalProperties: false,
};

// Ao criar o sermão: a IA escreve o objetivo e a introdução a partir do texto e do estudo feito
export async function prepararSermao(chave: string, d: DadosNovoSermao) {
  const versos = await textoDosVersiculos(d.textoBase);
  const estudo = Object.entries(d.respostas ?? {})
    .filter(([, r]) => r.trim())
    .map(([p, r]) => `- ${p} ${r}`)
    .join('\n');
  const pedido = `Você ajuda um pregador brasileiro a montar um sermão. Escreva em português do Brasil.

Texto: ${d.textoBase} (Bíblia Livre)
${versos}
${d.titulo ? `\nTítulo do sermão: ${d.titulo}` : ''}
Tipo de sermão: ${d.modelo}
Finalidade: ${d.tipoObjetivo ?? 'Pregação'}
${estudo ? `\nEstudo que o pregador já fez sobre o texto:\n${estudo}\n` : ''}
Escreva duas partes do sermão:

1. objetivos: três objetivos que completam "O objetivo deste sermão é..." (sem repetir essas palavras), cada um começando por um verbo no infinitivo como mostrar, explicar, advertir ou exibir, adequados à finalidade "${d.tipoObjetivo ?? 'Pregação'}". Uma frase curta cada.

2. introducao: a introdução do tipo "${d.introducao.nome}": ${d.introducao.dica} Use só citações e fatos que você tem certeza que existem, com autor e obra. Escreva como o pregador vai falar, em frases curtas, uma por linha, de 6 a 12 linhas.

O pregador destaca as palavras-chave em MAIÚSCULAS entre asteriscos, por exemplo: Deus *NÃO DESISTE* de *VOCÊ*. Faça o mesmo nas duas partes, com 2 a 4 destaques por linha.`;
  const texto = await chamarClaude(chave, pedido, esquemaSermao);
  const dados = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)) as {
    objetivos?: string[];
    introducao?: string;
  };
  // O objetivo vai no formato do quadro: a frase em cima e um objetivo por linha
  const objetivos = (dados.objetivos ?? []).map((o) => o.replace(/\n/g, ' ').trim()).filter(Boolean);
  return {
    objetivo: objetivos.length ? ['O *OBJETIVO* deste *SERMÃO* é:', ...objetivos.slice(0, 3)].join('\n') : '',
    introducao: dados.introducao?.trim() ?? '',
  };
}

// Resumo de todo o estudo, já em forma de sermão, na ordem do modelo do Jildean. Serve de base para montar o sermão
export async function montarPedidoResumo(estudo: DadosEstudo) {
  const versos = await textoDosVersiculos(estudo.textoBase);
  const respostas = perguntasDoEstudo(estudo)
    .map((q) => ({ ...q, resposta: estudo.respostas?.[q.pergunta]?.trim() }))
    .filter((q) => q.resposta)
    .map((q) => `[${nomesPartes[q.parte]}] ${q.pergunta} ${q.resposta}`);
  const notas = partes
    .map((p) => (estudo.anotacoes?.[p]?.trim() ? `Anotações de ${nomesPartes[p]}: ${estudo.anotacoes[p]!.trim()}` : ''))
    .filter(Boolean);
  const extras = [
    estudo.notasBiblia?.trim() && `Anotações na leitura da Bíblia: ${estudo.notasBiblia.trim()}`,
    estudo.notasBiblioteca?.trim() && `O que a minha biblioteca diz:\n${estudo.notasBiblioteca.trim()}`,
    estudo.temas?.length && `Temas sugeridos: ${estudo.temas.join('; ')}`,
  ].filter(Boolean);

  return `Você ajuda um pregador brasileiro a transformar o estudo bíblico dele num sermão. Escreva em português do Brasil.

Texto: ${estudo.textoBase} (Bíblia Livre)
${versos}

Estudo que o pregador já fez (Observação, Interpretação e Aplicação):
${[...respostas, ...notas, ...extras].join('\n') || '(sem respostas ainda: estude o texto você mesmo)'}

Faça um resumo de todo esse estudo já em forma de sermão, para servir de base ao sermão dele. Use só o que o estudo e a Bíblia sustentam, sem inventar citações. Siga esta ordem, com os títulos em linhas próprias:

TEMA: uma frase
IDEIA CENTRAL: a verdade principal do texto, numa frase
OBJETIVO: três objetivos, um por linha, começando por verbo (mostrar, explicar, advertir...)
INTRODUÇÃO: 3 a 5 linhas
TÓPICO 1, TÓPICO 2 e TÓPICO 3, cada um com:
- o título do tópico
- Texto: 2 a 4 frases curtas que explicam o ponto
- Texto bíblico: a referência (do próprio texto ou de apoio)
- Frase de efeito: uma frase curta e marcante
- Aplicação: uma frase
- Pergunta: uma pergunta para a igreja
CONCLUSÃO: 3 a 5 linhas
FRASE DE EFEITO FINAL
CHAMADO E CONVITE: 2 a 3 linhas

O pregador destaca as palavras-chave em MAIÚSCULAS entre asteriscos, por exemplo: Deus *NÃO DESISTE* de *VOCÊ*. Faça o mesmo, com 1 a 3 destaques por linha. Responda só com o resumo, em texto simples, sem tabelas e sem markdown.`;
}

const esquemaResumo = {
  type: 'object',
  properties: { resumo: { type: 'string' } },
  required: ['resumo'],
  additionalProperties: false,
};

export async function resumirComChave(chave: string, estudo: DadosEstudo) {
  const pedido = `${await montarPedidoResumo(estudo)}\n\nDevolva o resumo inteiro no campo "resumo" do JSON, com quebras de linha.`;
  const texto = await chamarClaude(chave, pedido, esquemaResumo);
  const dados = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)) as { resumo?: string };
  return dados.resumo?.trim() ?? '';
}
