import { drive, listar } from '../ia/drive';
import type { Sermao } from './sermoes';
import { guardarSaudacao, restaurarSaudacao, saudacoesGuardadas, type SaudacaoGuardada } from './saudacoes';

// Cópia dos sermões no Google Drive do JILDEAN, numa pasta "App Pregação", para abrir em qualquer aparelho.
// Cada aparelho junta a cópia do Drive com a sua: de cada sermão fica a versão mudada por último, e um sermão
// apagado num aparelho some dos outros

export type Dados = { sermoes: Sermao[]; apagados: Record<string, string> };
type Arquivo = Dados & { saudacoes?: Record<string, SaudacaoGuardada> };

const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const PASTA = 'App Pregação';
const NOME = 'sermoes.json';

// Junta duas listas de sermões: de cada um fica o mais novo, e o que foi apagado depois da última mudança sai
export function juntar(a: Dados, b: Dados): Dados {
  const apagados = { ...a.apagados };
  for (const [id, em] of Object.entries(b.apagados)) if (!apagados[id] || apagados[id] < em) apagados[id] = em;
  const porId = new Map<string, Sermao>();
  for (const s of [...a.sermoes, ...b.sermoes]) {
    const antes = porId.get(s.id);
    if (!antes || antes.atualizadoEm < s.atualizadoEm) porId.set(s.id, s);
  }
  const sermoes = [...porId.values()]
    .filter((s) => !apagados[s.id] || apagados[s.id] < s.atualizadoEm)
    // Os ids começam pela hora em que o sermão foi criado: o mais novo fica em cima
    .sort((x, y) => (x.id < y.id ? 1 : -1));
  return { sermoes, apagados };
}

async function acharArquivo(t: string) {
  const [arquivo] = await listar(
    `name = '${NOME}' and mimeType = 'application/json' and appProperties has { key='app' and value='pregacao' } and trashed = false`,
    t,
    'files(id)',
    1,
  );
  return arquivo?.id as string | undefined;
}

async function criarPasta(t: string) {
  const [pasta] = await listar(
    `mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='app' and value='pregacao' } and trashed = false`,
    t,
    'files(id)',
    1,
  );
  if (pasta) return pasta.id;
  const r = await drive('/files?fields=id', t, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: PASTA,
      mimeType: 'application/vnd.google-apps.folder',
      appProperties: { app: 'pregacao' },
    }),
  });
  return ((await r.json()) as { id: string }).id;
}

async function gravar(t: string, id: string | undefined, conteudo: Arquivo) {
  const json = JSON.stringify(conteudo);
  if (id) {
    await drive(`/files/${id}?uploadType=media`, t, { method: 'PATCH', body: json }, UPLOAD);
    return;
  }
  const meta = {
    name: NOME,
    mimeType: 'application/json',
    parents: [await criarPasta(t)],
    appProperties: { app: 'pregacao' },
  };
  const corpo = new FormData();
  corpo.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  corpo.append('file', new Blob([json], { type: 'application/json' }));
  await drive('/files?uploadType=multipart', t, { method: 'POST', body: corpo }, UPLOAD);
}

// Busca a cópia do Drive, junta com a do aparelho e grava o resultado nos dois lados
export async function sincronizar(t: string, local: Dados): Promise<Dados> {
  const id = await acharArquivo(t);
  const remoto: Arquivo = id
    ? await (await drive(`/files/${id}?alt=media`, t)).json()
    : { sermoes: [], apagados: {}, saudacoes: {} };
  const dados = juntar(local, { sermoes: remoto.sermoes ?? [], apagados: remoto.apagados ?? {} });

  const saudacoes = await saudacoesGuardadas();
  for (const [sid, s] of Object.entries(remoto.saudacoes ?? {})) {
    if (saudacoes[sid] && saudacoes[sid].atualizadoEm >= s.atualizadoEm) continue;
    saudacoes[sid] = s;
    if (s.blocos) await guardarSaudacao(sid, s.blocos, s.atualizadoEm);
    else await restaurarSaudacao(sid, s.atualizadoEm);
  }

  await gravar(t, id, { ...dados, saudacoes });
  return dados;
}
