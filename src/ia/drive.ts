import type { DadosEstudo, TrechoBiblioteca } from '../store/sermoes';
import { chamarClaude } from './estudo';

// Busca automática na biblioteca do Google Drive (pasta "2 - Biblioteca"). O login é do próprio Jildean, pelo
// Google, e o acesso é só de leitura. Os livros não são copiados para o app: o texto de algumas páginas é lido
// na hora, a IA escolhe os trechos e só os trechos ficam guardados no estudo

// ID do cliente OAuth do projeto "App Pregação" no Google Cloud (não é segredo)
export const ID_CLIENTE_GOOGLE = '';

const PASTA_BIBLIOTECA = '1N-CV4gNyutRASYfWP0dBfW7hN7vsXqOH';
const ESCOPO = 'https://www.googleapis.com/auth/drive.readonly';
const API = 'https://www.googleapis.com/drive/v3';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

type Arquivo = { id: string; name: string; mimeType: string; size?: string };

// Carrega um script do navegador uma vez só
const scripts = new Map<string, Promise<void>>();
function carregarScript(src: string) {
  if (!scripts.has(src)) {
    scripts.set(
      src,
      new Promise((ok, erro) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => ok();
        s.onerror = () => erro(new Error('Sem conexão para carregar o login do Google.'));
        document.head.appendChild(s);
      }),
    );
  }
  return scripts.get(src)!;
}

// Login do Google: o token vale uma hora e fica só na memória
let token: { valor: string; ate: number } | null = null;
async function pedirToken(): Promise<string> {
  if (token && token.ate > Date.now()) return token.valor;
  if (!ID_CLIENTE_GOOGLE) throw new Error('Falta o ID do cliente do Google no app.');
  await carregarScript('https://accounts.google.com/gsi/client');
  const google = (window as unknown as { google: any }).google;
  return new Promise((ok, erro) => {
    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: ID_CLIENTE_GOOGLE,
      scope: ESCOPO,
      callback: (r: { access_token?: string; expires_in?: number; error?: string }) => {
        if (!r.access_token) return erro(new Error('O login do Google não foi concluído.'));
        token = { valor: r.access_token, ate: Date.now() + ((r.expires_in ?? 3600) - 60) * 1000 };
        ok(r.access_token);
      },
      error_callback: () => erro(new Error('O login do Google foi fechado antes de terminar.')),
    });
    cliente.requestAccessToken();
  });
}

async function drive(caminho: string, t: string) {
  const r = await fetch(`${API}${caminho}`, { headers: { Authorization: `Bearer ${t}` } });
  if (r.status === 401) token = null;
  if (!r.ok) throw new Error(`O Google Drive recusou o pedido (${r.status}).`);
  return r;
}

async function listar(q: string, t: string, campos = 'files(id,name,mimeType,size)', quantos = 100) {
  const params = new URLSearchParams({ q, fields: campos, pageSize: String(quantos), supportsAllDrives: 'true' });
  const r = await drive(`/files?${params}`, t);
  return ((await r.json()) as { files: Arquivo[] }).files;
}

// A pasta da biblioteca e todas as subpastas, para limitar a busca aos livros dela
async function pastasDaBiblioteca(t: string) {
  const pastas = [PASTA_BIBLIOTECA];
  for (let i = 0; i < pastas.length && pastas.length < 300; i += 20) {
    const grupo = pastas.slice(i, i + 20).map((id) => `'${id}' in parents`);
    const filhas = await listar(
      `(${grupo.join(' or ')}) and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      t,
      'files(id)',
      1000,
    );
    pastas.push(...filhas.map((f) => f.id));
  }
  return pastas;
}

const aspas = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// Livros da biblioteca que falam dos termos (o Google procura dentro do texto dos PDFs e documentos)
async function buscarLivros(termos: string[], t: string) {
  const pastas = await pastasDaBiblioteca(t);
  const achados = new Map<string, Arquivo & { pontos: number }>();
  for (const termo of termos) {
    for (let i = 0; i < pastas.length; i += 25) {
      const dentro = pastas.slice(i, i + 25).map((id) => `'${id}' in parents`);
      const q = `fullText contains '${aspas(termo)}' and (${dentro.join(' or ')}) and trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
      for (const f of await listar(q, t, 'files(id,name,mimeType,size)', 20)) {
        const antes = achados.get(f.id);
        achados.set(f.id, { ...f, pontos: (antes?.pontos ?? 0) + 1 });
      }
    }
  }
  return [...achados.values()].sort((a, b) => b.pontos - a.pontos).slice(0, 5);
}

// Texto de cada página do livro: Google Docs exportado como texto; PDF lido com o pdf.js
async function paginasDoLivro(f: Arquivo, t: string): Promise<string[]> {
  if (f.mimeType === 'application/vnd.google-apps.document') {
    const texto = await (await drive(`/files/${f.id}/export?mimeType=text/plain`, t)).text();
    return texto.split(/\n{2,}/);
  }
  if (f.mimeType === 'text/plain') return (await (await drive(`/files/${f.id}?alt=media`, t)).text()).split(/\n{2,}/);
  if (f.mimeType !== 'application/pdf' || Number(f.size ?? 0) > 60_000_000) return [];
  await carregarScript(`${PDFJS}/pdf.min.js`);
  const pdfjs = (window as unknown as { pdfjsLib: any }).pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.js`;
  const dados = await (await drive(`/files/${f.id}?alt=media`, t)).arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: dados }).promise;
  const paginas: string[] = [];
  for (let n = 1; n <= Math.min(pdf.numPages, 1500); n++) {
    const conteudo = await (await pdf.getPage(n)).getTextContent();
    paginas.push(conteudo.items.map((i: { str: string }) => i.str).join(' '));
  }
  return paginas;
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// As páginas que mais citam os termos, com a vizinha de cada uma, até uns 9 mil caracteres por livro
function melhoresPaginas(paginas: string[], termos: string[]) {
  const chaves = termos.map(semAcento);
  const notas = paginas.map((p, i) => {
    const texto = semAcento(p);
    return { i, pontos: chaves.reduce((s, c) => s + (texto.split(c).length - 1), 0) };
  });
  const escolhidas = notas
    .filter((n) => n.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 3)
    .flatMap((n) => [n.i, n.i + 1])
    .filter((i, k, todos) => i < paginas.length && todos.indexOf(i) === k)
    .sort((a, b) => a - b);
  let total = 0;
  const partes: string[] = [];
  for (const i of escolhidas) {
    const texto = paginas[i].replace(/\s+/g, ' ').trim().slice(0, 3500);
    if (total + texto.length > 9000) break;
    total += texto.length;
    partes.push(`[página ${i + 1}] ${texto}`);
  }
  return partes.join('\n');
}

const esquemaTermos = {
  type: 'object',
  properties: { termos: { type: 'array', items: { type: 'string' } } },
  required: ['termos'],
  additionalProperties: false,
};

const esquemaTrechos = {
  type: 'object',
  properties: {
    trechos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          livro: { type: 'string' },
          autor: { type: 'string' },
          local: { type: 'string' },
          trecho: { type: 'string' },
          comentario: { type: 'string' },
        },
        required: ['livro', 'autor', 'local', 'trecho', 'comentario'],
        additionalProperties: false,
      },
    },
  },
  required: ['trechos'],
  additionalProperties: false,
};

// Busca completa: termos de busca pela IA, livros no Drive, páginas que tratam do tema e trechos escolhidos pela IA
export async function buscarNaBiblioteca(
  chave: string,
  estudo: DadosEstudo,
  assunto: string,
  avisar: (texto: string) => void,
): Promise<TrechoBiblioteca[]> {
  const tema = assunto.trim() || [estudo.textoBase, estudo.temas?.[0]].filter(Boolean).join(', ');
  avisar('Entrando no seu Google Drive...');
  const t = await pedirToken();

  avisar('Escolhendo as palavras para procurar nos livros...');
  const pedidoTermos = `Vou procurar em livros de teologia em português (comentários, teologia sistemática, enciclopédias) o que eles dizem sobre: ${tema}. Sugira de 3 a 5 termos curtos de busca (1 a 3 palavras cada), do mais específico ao mais geral, como aparecem no texto de um livro: por exemplo o nome do livro bíblico com capítulo ("João 1"), o conceito teológico ("Verbo", "encarnação"). Responda só com o JSON.`;
  const termos = (JSON.parse(await chamarClaude(chave, pedidoTermos, esquemaTermos)) as { termos: string[] }).termos
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  avisar('Procurando nos livros da pasta "2 - Biblioteca"...');
  const livros = await buscarLivros(termos, t);
  if (!livros.length) throw new Error(`Não achei nada sobre "${termos.join('", "')}" nos livros da biblioteca.`);

  const fontes: string[] = [];
  for (const [k, livro] of livros.entries()) {
    avisar(`Lendo ${k + 1} de ${livros.length}: ${livro.name}`);
    try {
      const paginas = await paginasDoLivro(livro, t);
      const texto = melhoresPaginas(paginas, termos);
      if (texto) fontes.push(`ARQUIVO: ${livro.name}\n${texto}`);
    } catch {
      // Um livro que não abre não impede os outros
    }
  }
  if (!fontes.length)
    throw new Error('Achei livros sobre o tema, mas não consegui ler o texto deles (podem ser PDFs escaneados).');

  avisar('A IA está escolhendo os melhores trechos...');
  const pedido = `Você ajuda um pregador brasileiro a estudar ${estudo.textoBase || 'um texto bíblico'} (tema: ${tema}). Abaixo estão páginas dos livros da biblioteca dele.

${fontes.join('\n\n')}

Escolha até 8 trechos que mais ajudam no sermão, de livros diferentes quando possível. Para cada um:
- livro: título do livro (pelo nome do arquivo)
- autor: se aparecer no texto ou no nome do arquivo; senão deixe vazio
- local: a página, como "p. 233"
- trecho: as palavras do autor, copiadas do texto acima (até 4 frases), sem mudar nada
- comentario: em 1 ou 2 frases em português do Brasil, como isso ajuda no sermão

Use só o que está nas páginas acima. Não invente citações.`;
  const dados = JSON.parse(await chamarClaude(chave, pedido, esquemaTrechos)) as { trechos: TrechoBiblioteca[] };
  return dados.trechos.filter((x) => x.trecho.trim());
}
