import { drive } from '../ia/drive';
import { sermaoDoDocx } from '../importar/docx';
import {
  destacarTudo,
  dividirDestaques,
  dividirQuadro,
  dividirVersiculo,
  estiloBloco,
  abreNovaPagina,
} from '../estilo';
import { criarPasta } from '../store/nuvem';
import type { BlocoInicial } from '../data/modelos';
import type { Bloco, Sermao } from '../store/sermoes';

// O sermão como Google Docs na pasta "App Pregação", escrito no padrão de cores do Jildean, para editar pelo
// Drive. O caminho de volta usa a mesma leitura do "Trazer sermão do Drive" (importar/docx): cada cor do
// documento vira de novo o seu tipo de caixa

const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const GOOGLE_DOC = 'application/vnd.google-apps.document';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const linkDoDocs = (id: string) => `https://docs.google.com/document/d/${id}/edit`;

const escapar = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// *palavra-chave* -> negrito sublinhado, na cor da chave quando houver
function comChaves(texto: string, corChave?: string) {
  return dividirDestaques(texto)
    .map((p) => {
      let t = escapar(p.texto);
      if (p.chave) t = corChave ? `<b><u><span style="color:${corChave}">${t}</span></u></b>` : `<b><u>${t}</u></b>`;
      if (!p.marca) return t;
      // Cor marcada à mão no texto ([fundo verde], [azul]...)
      const { cor, fundo, italico } = p.marca;
      const css = [cor && `color:${cor}`, fundo && `background-color:${fundo}`, italico && 'font-style:italic'];
      return `<span style="${css.filter(Boolean).join(';')}">${t}</span>`;
    })
    .join('');
}

type Estilo = { cor?: string; italico?: boolean; centro?: boolean; fundo?: string; quebra?: boolean };

function paragrafo(conteudo: string, e: Estilo = {}) {
  const css = [
    'font-family:Arial',
    e.cor && `color:${e.cor}`,
    e.italico && 'font-style:italic',
    e.centro && 'text-align:center',
    e.quebra && 'page-break-before:always',
  ]
    .filter(Boolean)
    .join(';');
  const corpo = e.fundo ? `<span style="background-color:${e.fundo}">${conteudo}</span>` : conteudo;
  return `<p style="${css}">${corpo}</p>`;
}

function lista(itens: string[], e: Estilo = {}) {
  const css = ['font-family:Arial', e.cor && `color:${e.cor}`, e.italico && 'font-style:italic']
    .filter(Boolean)
    .join(';');
  return `<ul style="${css}">${itens.map((l) => `<li>${comChaves(destacarTudo(l))}</li>`).join('')}</ul>`;
}

function blocoParaDocs(b: Bloco, quebra: boolean): string {
  const e = estiloBloco[b.tipo];
  const base: Estilo = { quebra };
  switch (b.tipo) {
    case 'topico':
      return paragrafo(comChaves(b.texto), { ...base, fundo: '#00FF00' });
    case 'subtopico':
      return paragrafo(comChaves(b.texto), { ...base, fundo: '#B6D7A8' });
    case 'versiculo': {
      // "Livro 1" numa linha e cada versículo na sua, como nos esboços: a leitura junta de novo
      const { cabecalho, linhas } = dividirVersiculo(b.texto);
      const v = { cor: '#990000', italico: true };
      return [
        ...(cabecalho ? [paragrafo(`<b><u>${escapar(cabecalho)}</u></b>`, { ...base, ...v })] : []),
        ...linhas.map((l, i) => paragrafo(comChaves(destacarTudo(l)), { ...v, quebra: quebra && !cabecalho && !i })),
      ].join('');
    }
    case 'efeito':
      return b.texto
        .split('\n')
        .map((l, i) => paragrafo(comChaves(l), { cor: '#38761D', italico: true, centro: true, quebra: quebra && !i }))
        .join('');
    case 'pergunta':
      return paragrafo(comChaves(b.texto), { ...base, cor: '#3C78D8', italico: true });
    case 'frase':
      return paragrafo(comChaves(b.texto), { ...base, cor: '#0000FF' });
    case 'citacao':
      return paragrafo(comChaves(b.texto), { ...base, cor: '#B45F06', italico: true });
    case 'pontos':
      return (quebra ? paragrafo('', base) : '') + lista(b.texto.split('\n').filter((l) => l.trim()));
    case 'pontosRoxo':
      return (
        (quebra ? paragrafo('', base) : '') +
        lista(
          b.texto.split('\n').filter((l) => l.trim()),
          { cor: '#9900FF', italico: true },
        )
      );
    case 'pontosVermelho':
    case 'pontosAzul':
      return (
        (quebra ? paragrafo('', base) : '') +
        lista(
          b.texto.split('\n').filter((l) => l.trim()),
          { cor: b.tipo === 'pontosAzul' ? '#3C78D8' : '#990000', italico: true },
        )
      );
  }
  if (e.quadro) {
    // Linha de cima na cor do tipo (Texto = azul, Pergunta = azul-claro, Aplicação = roxo) e os pontos embaixo
    const { subtopico, pontos } = dividirQuadro(b.texto);
    const cor = b.tipo === 'quadroPerguntas' ? '#3C78D8' : b.tipo === 'aplicacao' ? '#7030A0' : '#0000FF';
    const italico = b.tipo !== 'quadro' && b.tipo !== 'objetivo';
    return (
      // No Texto a linha de cima é preta com as palavras-chave em azul, como no app
      (b.tipo === 'quadro' || b.tipo === 'objetivo'
        ? paragrafo(comChaves(subtopico.replace(/\n/g, ' '), cor), base)
        : paragrafo(comChaves(subtopico.replace(/\n/g, ' ')), { ...base, cor, italico })) +
      (pontos.length ? lista(pontos, b.tipo === 'aplicacao' ? { cor: '#7030A0', italico: true } : {}) : '')
    );
  }
  // Texto corrido (introdução, conclusão, texto...): preto, cada linha um parágrafo
  // Um parágrafo só, com as linhas separadas por Enter dentro dele: volta como uma caixa só
  return paragrafo(
    b.texto
      .split('\n')
      .map((l) => comChaves(l))
      .join('<br>'),
    base,
  );
}

export function htmlParaDocs(s: Sermao) {
  const cabecalho = [
    paragrafo(`<b><u>${escapar(s.titulo || 'Sermão sem título')}</u></b>`, { centro: true, fundo: '#00FF00' }),
    ...(s.culto || s.data ? [paragrafo(escapar([s.culto, s.data].filter(Boolean).join(' · ')), { centro: true })] : []),
  ];
  const blocos = s.blocos
    .map((b, i) => ({ b, quebra: !!b.novaPagina || (i > 0 && abreNovaPagina(s.blocos, i)) }))
    .filter(({ b }) => b.texto.trim())
    .map(({ b, quebra }) => blocoParaDocs(b, quebra));
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="font-family:Arial;font-size:12pt">${[
    ...cabecalho,
    ...blocos,
  ].join('\n')}</body></html>`;
}

type Resposta = { id: string; modifiedTime: string };

// Cria o Google Docs do sermão (ou reescreve o que já existe) e devolve o id e a hora da gravação
export async function gravarNoDocs(t: string, s: Sermao): Promise<Resposta> {
  const html = new Blob([htmlParaDocs(s)], { type: 'text/html' });
  const campos = 'fields=id,modifiedTime';
  if (s.docId) {
    try {
      const r = await drive(`/files/${s.docId}?uploadType=media&${campos}`, t, { method: 'PATCH', body: html }, UPLOAD);
      return (await r.json()) as Resposta;
    } catch {
      // O Docs foi apagado no Drive: cria outro
    }
  }
  const meta = {
    name: s.titulo || 'Sermão sem título',
    mimeType: GOOGLE_DOC,
    parents: [await criarPasta(t)],
    appProperties: { app: 'pregacao', sermao: s.id },
  };
  const corpo = new FormData();
  corpo.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  corpo.append('file', html);
  const r = await drive(`/files?uploadType=multipart&${campos}`, t, { method: 'POST', body: corpo }, UPLOAD);
  return (await r.json()) as Resposta;
}

// Hora da última mudança do Docs, para saber se foi editado pelo Drive
export async function quandoMudouNoDocs(t: string, id: string) {
  const r = await drive(`/files/${id}?fields=modifiedTime`, t);
  return ((await r.json()) as { modifiedTime: string }).modifiedTime;
}

// A caixa como ela fica no Docs (cor do tipo e palavras-chave, inclusive as maiúsculas que o app destaca
// sozinho), sem as cores marcadas à mão, que a leitura do Docs não traz de volta. Duas caixas iguais aqui são
// a mesma caixa; destacar uma palavra ou trocar a cor no Docs conta como mudança
const comparavel = (b: { tipo: Bloco['tipo']; texto?: string }) =>
  blocoParaDocs(
    {
      id: '',
      tipo: b.tipo,
      texto: (b.texto ?? '').replace(/\[[^\]\n]*\]/g, '').replace(/\u2028/g, ''),
    },
    false,
  )
    .replace(/\s+/g, ' ')
    .replace(/<\/u><\/b>( ?)<b><u>/g, '$1')
    .toLowerCase();

// As caixas que voltaram do Docs: a que não mudou continua a mesma do app (tipo, nome, cores marcadas,
// página), e só a que foi editada ou criada no Drive vem da leitura das cores
export function juntarComApp(app: Bloco[], doDocs: BlocoInicial[], novoId: () => string): Bloco[] {
  const sobra = new Map<string, Bloco[]>();
  for (const b of app) {
    if (!b.texto.trim()) continue;
    const k = comparavel(b);
    sobra.set(k, [...(sobra.get(k) ?? []), b]);
  }
  return doDocs.map((b) => {
    const igual = sobra.get(comparavel(b))?.shift();
    return igual ?? { ...b, id: novoId(), texto: b.texto ?? '' };
  });
}

// Lê o Docs de volta e devolve as caixas no padrão do app
export async function lerDoDocs(t: string, id: string) {
  const r = await drive(`/files/${id}/export?mimeType=${encodeURIComponent(DOCX)}`, t);
  const novo = await sermaoDoDocx(await r.arrayBuffer(), '', { manterTopicos: true });
  return { ...novo, modifiedTime: await quandoMudouNoDocs(t, id) };
}
