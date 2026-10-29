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

// Todos os sermoes.json do app, o mudado por último primeiro. Antes o Salvar gravava o arquivo como texto e
// depois não o achava mais, criando outro a cada vez: os repetidos são juntados num só
async function acharArquivos(t: string) {
  const params = new URLSearchParams({
    q: `name = '${NOME}' and appProperties has { key='app' and value='pregacao' } and trashed = false`,
    fields: 'files(id)',
    orderBy: 'modifiedTime desc',
    pageSize: '100',
  });
  const r = await drive(`/files?${params}`, t);
  return ((await r.json()) as { files: { id: string }[] }).files.map((f) => f.id);
}

export async function criarPasta(t: string) {
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
  // Com o tipo application/json: sem ele o Drive guardava como texto
  const json = new Blob([JSON.stringify(conteudo)], { type: 'application/json' });
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
  corpo.append('file', json);
  await drive('/files?uploadType=multipart', t, { method: 'POST', body: corpo }, UPLOAD);
}

// Busca a cópia do Drive, junta com a do aparelho e grava o resultado nos dois lados
export async function sincronizar(t: string, local: Dados): Promise<Dados> {
  const [id, ...repetidos] = await acharArquivos(t);
  const remotos: Arquivo[] = await Promise.all(
    [id, ...repetidos].filter(Boolean).map(async (f) => (await drive(`/files/${f}?alt=media`, t)).json()),
  );
  let dados = local;
  for (const remoto of remotos)
    dados = juntar(dados, { sermoes: remoto.sermoes ?? [], apagados: remoto.apagados ?? {} });

  const saudacoes = await saudacoesGuardadas();
  for (const remoto of remotos) {
    for (const [sid, s] of Object.entries(remoto.saudacoes ?? {})) {
      if (saudacoes[sid] && saudacoes[sid].atualizadoEm >= s.atualizadoEm) continue;
      saudacoes[sid] = s;
      if (s.blocos) await guardarSaudacao(sid, s.blocos, s.atualizadoEm);
      else await restaurarSaudacao(sid, s.atualizadoEm);
    }
  }

  await gravar(t, id, { ...dados, saudacoes });
  // Os repetidos já foram juntados no primeiro: vão para a lixeira do Drive (dá para recuperar de lá)
  for (const f of repetidos) {
    await drive(`/files/${f}`, t, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashed: true }),
    }).catch(() => undefined);
  }
  return dados;
}
