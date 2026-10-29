import { ROTULO_TEXTO, type BlocoInicial, type Modelo } from '../data/modelos';
import type { NovoSermao } from '../store/sermoes';

// Importa um sermão escrito no Word ou no Google Docs (.docx) no padrão de cores do Jildean: a cor de cada
// parágrafo diz o tipo da caixa (verde = tópico, vermelho = texto bíblico, azul = frase...) e as palavras em
// negrito sublinhado viram palavra-chave

// --- Leitura do .docx (um arquivo zip): só o word/document.xml interessa ---

async function inflar(dados: Uint8Array) {
  const fluxo = new Blob([dados as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(fluxo).arrayBuffer());
}

export async function documentoDoDocx(arquivo: ArrayBuffer) {
  const b = new Uint8Array(arquivo);
  const v = new DataView(arquivo);
  // Fim do diretório central do zip: procura de trás para frente
  let fim = -1;
  for (let i = b.length - 22; i >= 0 && i >= b.length - 65_557; i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new Error('O arquivo não é um .docx.');
  const total = v.getUint16(fim + 10, true);
  let p = v.getUint32(fim + 16, true);
  for (let n = 0; n < total; n++) {
    const metodo = v.getUint16(p + 10, true);
    const tamanho = v.getUint32(p + 20, true);
    const nome = new TextDecoder().decode(b.subarray(p + 46, p + 46 + v.getUint16(p + 28, true)));
    const local = v.getUint32(p + 42, true);
    p += 46 + v.getUint16(p + 28, true) + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
    if (nome !== 'word/document.xml') continue;
    const inicio = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const bruto = b.subarray(inicio, inicio + tamanho);
    return new TextDecoder().decode(metodo === 0 ? bruto : await inflar(bruto));
  }
  throw new Error('O arquivo não tem o texto de um documento do Word.');
}

// --- Parágrafos com a cor, o fundo e o alinhamento que mais aparecem neles ---

export type Paragrafo = {
  texto: string;
  cor: string;
  fundo: string;
  centro: boolean;
  lista: boolean;
  italico: boolean;
  // Quebra de página antes deste parágrafo no documento original
  quebra?: boolean;
  // Estilo de título do Word/Docs: 1 = Título 1, 2 = Título 2 ou 3
  estilo?: 1 | 2;
};

const entidades: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const desfazer = (t: string) =>
  t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
    e[0] === '#'
      ? String.fromCodePoint(
          parseInt(e.slice(e[1] === 'x' || e[1] === 'X' ? 2 : 1), e[1]?.toLowerCase() === 'x' ? 16 : 10),
        )
      : (entidades[e] ?? m),
  );

const ligado = (props: string, tag: string) => new RegExp(`<w:${tag}(?: w:val="(?:1|true|on)")?\\s*/>`).test(props);

// Cores de fundo da marcação do Google Docs com o nome que o Word usa
const realces: Record<string, string> = { green: '00ff00', yellow: 'ffff00', cyan: '00ffff', lightGray: 'd3d3d3' };

export function lerParagrafos(xml: string): Paragrafo[] {
  const paragrafos: Paragrafo[] = [];
  for (const [p] of xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const props = p.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] ?? '';
    const pesoCor = new Map<string, number>();
    const pesoFundo = new Map<string, number>();
    let italicos = 0;
    let letras = 0;
    let texto = '';
    for (const [, rp = '', conteudo] of p.matchAll(
      /<w:r(?: [^>]*)?>(?:<w:rPr>([\s\S]*?)<\/w:rPr>)?([\s\S]*?)<\/w:r>/g,
    )) {
      const t = desfazer(
        [...conteudo.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:(tab|br)\/>/g)]
          .map((m) => (m[2] === 'tab' ? ' ' : m[2] === 'br' ? '\n' : m[1]))
          .join(''),
      );
      if (!t) continue;
      const n = t.replace(/\s/g, '').length;
      const cor = rp.match(/<w:color w:val="(\w+)"/)?.[1]?.toLowerCase() ?? '';
      const realce = rp.match(/<w:highlight w:val="(\w+)"/)?.[1];
      const sombra = rp.match(/<w:shd [^>]*w:fill="(\w+)"/)?.[1]?.toLowerCase();
      const fundo =
        (realce && realce !== 'white' ? (realces[realce] ?? realce) : '') ||
        (sombra && sombra !== 'auto' && sombra !== 'ffffff' ? sombra : '');
      pesoCor.set(cor === '000000' || cor === 'auto' ? '' : cor, (pesoCor.get(cor) ?? 0) + n);
      pesoFundo.set(fundo, (pesoFundo.get(fundo) ?? 0) + n);
      if (ligado(rp, 'i')) italicos += n;
      letras += n;
      // Negrito sublinhado = palavra-chave, entre asteriscos (os espaços ficam fora)
      const chave = ligado(rp, 'b') && /<w:u w:val="(?!none)/.test(rp) && n > 0;
      texto += chave ? t.replace(/^(\s*)([\s\S]*?)(\s*)$/, '$1*$2*$3') : t;
    }
    // Duas palavras-chave coladas viram uma só ("*E**scola*" -> "*Escola*")
    texto = texto
      .replace(/\*(\s*)\*/g, '$1')
      .replace(/[  ]+/g, ' ')
      .trim();
    if (!texto.replace(/\*/g, '').trim()) continue;
    const maior = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    paragrafos.push({
      texto,
      cor: maior(pesoCor),
      fundo: maior(pesoFundo),
      centro: /<w:jc w:val="center"/.test(props),
      lista: props.includes('<w:numPr>'),
      quebra: /<w:pageBreakBefore(?: w:val="(?:1|true|on)")?\s*\/>/.test(props) || p.includes('w:type="page"'),
      italico: letras > 0 && italicos / letras > 0.6,
      estilo: /<w:pStyle w:val="(?:Heading|Ttulo|Titulo|Title)1?"/i.test(props)
        ? 1
        : /<w:pStyle w:val="(?:Heading|Ttulo|Titulo)[23]"/i.test(props)
          ? 2
          : undefined,
    });
  }
  return paragrafos;
}

// --- Parágrafos -> caixas do sermão ---

type Tipo = 'titulo' | 'subtitulo' | 'biblia' | 'efeito' | 'pergunta' | 'aplicacao' | 'citacao' | 'frase' | 'texto';

// Matiz (0-360), saturação e luminosidade de uma cor "rrggbb"
function hsl(hex: string) {
  const [r, g, b] = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

const ehCor = (hex: string) => /^[0-9a-f]{6}$/.test(hex);

// Cores do padrão do Jildean primeiro; outra cor qualquer vai para o tipo da família dela
// (vermelho = texto bíblico, verde = frase de efeito, azul = frase, azul-claro = pergunta, roxo = aplicação...)
function tipoPelaCor(cor: string): Tipo | undefined {
  const exatas: Record<string, Tipo> = {
    '990000': 'biblia',
    '38761d': 'efeito',
    '3c78d8': 'pergunta',
    '7030a0': 'aplicacao',
    '9900ff': 'aplicacao',
    b45f06: 'citacao',
    '0000ff': 'frase',
    '0b5394': 'frase',
  };
  if (exatas[cor]) return exatas[cor];
  if (!ehCor(cor)) return undefined;
  const { h, s, l } = hsl(cor);
  if (s < 0.25 || l < 0.12 || l > 0.85) return undefined;
  if (h < 15 || h >= 340) return 'biblia';
  if (h < 50) return 'citacao';
  if (h < 70) return undefined;
  if (h < 170) return 'efeito';
  if (h < 200) return 'pergunta';
  if (h < 255) return l > 0.5 ? 'pergunta' : 'frase';
  return 'aplicacao';
}

// Fundo: verde forte (ou outra cor forte) = tópico; verde claro = subtópico
function tipoPeloFundo(fundo: string): Tipo | undefined {
  if (['00ff00', '93c47d', '6aa84f'].includes(fundo)) return 'titulo';
  if (['b6d7a8', 'd9ead3'].includes(fundo)) return 'subtitulo';
  if (!ehCor(fundo)) return undefined;
  const { h, s, l } = hsl(fundo);
  if (s < 0.2) return undefined;
  if (h >= 70 && h < 170) return l > 0.75 ? 'subtitulo' : 'titulo';
  return undefined;
}

// Referência bíblica no começo: "João 3:16 ...", "1 Coríntios 13" ou "(Sl 23:1)"
const comecaComReferencia = /^\(?(?:[1-3]\s*)?\p{Lu}\p{L}+\.?\s\d+(?::\d+)?/u;

function tipoDoParagrafo(p: Paragrafo): Tipo {
  if (p.estilo === 1) return 'titulo';
  if (p.estilo === 2) return 'subtitulo';
  const fundo = tipoPeloFundo(p.fundo);
  if (fundo) return fundo;
  if (p.cor === '0b5394' && p.texto.length < 90) return 'subtitulo';
  const cor = tipoPelaCor(p.cor);
  if (cor) return cor;
  // Sem cor do padrão: o conteúdo decide
  const t = semChaves(p.texto);
  if (comecaComReferencia.test(t) && (cabecalhoBiblico.test(t) || /^\S.*\d+:\d+(?:-\d+)?\s+[-–]\s/u.test(t)))
    return 'biblia';
  if (!p.lista && /\?["”]?$/.test(t) && t.length < 160) return 'pergunta';
  if (p.italico && /^["“]/.test(t)) return 'citacao';
  if (p.centro && t.length < 120) return 'efeito';
  return 'texto';
}

const semChaves = (t: string) => t.replace(/\*/g, '').trim();
// "Gênesis 1" ou "1 Coríntios 6": a linha que abre um texto bíblico
const cabecalhoBiblico = /^(?:[1-3]\s*)?\p{L}[\p{L} ]*\s\d+$/u;

const modeloPorNome: [RegExp, Modelo][] = [
  [/tem[aá]tico/i, 'tematico'],
  [/textual/i, 'textual'],
  [/expositivo/i, 'expositivo'],
  [/lectio/i, 'lectio'],
];

export function sermaoDosParagrafos(paragrafos: Paragrafo[], nomeArquivo = ''): NovoSermao {
  const lista = paragrafos.map((p) => ({ ...p, tipo: tipoDoParagrafo(p) }));
  const blocos: BlocoInicial[] = [];
  let titulo = '';
  let culto = '';
  let modelo: Modelo = 'tematico';
  let textoBase = '';
  let i = 0;

  // Título: o primeiro parágrafo, se for um título ou estiver centralizado; logo abaixo, centralizado, o culto
  if (lista[0] && (lista[0].tipo === 'titulo' || lista[0].centro)) {
    titulo = semChaves(lista[0].texto);
    i = 1;
    if (lista[1]?.centro && !lista[1].cor && !lista[1].fundo) {
      culto = semChaves(lista[1].texto);
      i = 2;
    }
  }

  // Pontos em preto numa lista logo abaixo de uma frase, pergunta ou aplicação
  const pontosDepois = () => {
    const pontos: string[] = [];
    while (lista[i] && lista[i].tipo === 'texto' && lista[i].lista) pontos.push(lista[i++].texto);
    return pontos;
  };

  let quebrar = false;
  // A caixa que vem depois de uma quebra de página do documento começa uma página nova
  const adicionar = (b: BlocoInicial) => {
    blocos.push(quebrar ? { ...b, novaPagina: true } : b);
    quebrar = false;
  };

  while (i < lista.length) {
    const p = lista[i++];
    if (p.quebra) quebrar = true;
    const nome = semChaves(p.texto);

    if (p.tipo === 'titulo') {
      // "Tipo de sermão": a opção marcada com X vira o modelo, e a seção não entra no sermão
      if (/^tipo de serm/i.test(nome)) {
        while (lista[i] && lista[i].tipo !== 'titulo') {
          const linha = semChaves(lista[i++].texto);
          if (/\(\s*x\s*\)/i.test(linha)) modelo = modeloPorNome.find(([r]) => r.test(linha))?.[1] ?? modelo;
        }
        continue;
      }
      // Os títulos viram subtópicos: as páginas seguem as quebras do documento original, não os títulos
      adicionar({ tipo: 'subtopico', texto: p.texto });
      if (/^texto (de )?refer/i.test(nome) && lista[i]?.tipo === 'biblia' && !textoBase) {
        const [cab, verso] = [semChaves(lista[i].texto), semChaves(lista[i + 1]?.texto ?? '')];
        const n = verso.match(/^(\d+(?:\s*[-–]\s*\d+)?)/)?.[1];
        if (cabecalhoBiblico.test(cab)) textoBase = n ? `${cab}:${n.replace(/\s/g, '')}` : cab;
      }
      continue;
    }

    if (p.tipo === 'biblia') {
      // Um texto bíblico por cabeçalho ("Gênesis 1"), com os versículos embaixo
      const linhas = [p.texto];
      while (lista[i]?.tipo === 'biblia' && !cabecalhoBiblico.test(semChaves(lista[i].texto)))
        linhas.push(lista[i++].texto);
      const cab = semChaves(linhas[0]);
      if (cabecalhoBiblico.test(cab) && linhas.length > 1) {
        const [primeiro, ...resto] = linhas.slice(1);
        const verso = primeiro.replace(/^\s*\*?(\d+)\*?\s*[-–]?\s*/, '$1 - ');
        const m = verso.match(/^(\d+) - (.*)$/s);
        adicionar({
          tipo: 'versiculo',
          texto: [m ? `${cab}:${m[1]} - ${m[2]}` : `${cab}\n${primeiro}`, ...resto].join('\n'),
        });
      } else {
        adicionar({ tipo: 'versiculo', texto: linhas.join('\n') });
      }
      continue;
    }

    if (p.tipo === 'efeito') {
      const linhas = [p.texto];
      while (lista[i]?.tipo === 'efeito') linhas.push(lista[i++].texto);
      adicionar({ tipo: 'efeito', texto: linhas.join('\n') });
      continue;
    }

    if (p.tipo === 'subtitulo') {
      // Linha azul-escura com uma lista embaixo: é a frase de um quadro, não um subtópico
      const pontos = p.fundo ? [] : pontosDepois();
      if (pontos.length) {
        adicionar({ tipo: 'quadro', texto: [p.texto, ...pontos].join('\n') });
        continue;
      }
      adicionar({ tipo: 'subtopico', texto: p.texto });
      continue;
    }

    if (p.tipo === 'citacao') {
      adicionar({ tipo: 'citacao', texto: p.texto });
      continue;
    }

    if (p.tipo === 'frase' || p.tipo === 'pergunta' || p.tipo === 'aplicacao' || (p.tipo === 'texto' && !p.lista)) {
      const pontos = pontosDepois();
      if (pontos.length) {
        const tipo = p.tipo === 'pergunta' ? 'quadroPerguntas' : p.tipo === 'aplicacao' ? 'aplicacao' : 'quadro';
        adicionar({ tipo, texto: [p.texto, ...pontos].join('\n') });
      } else if (p.tipo === 'texto') {
        adicionar({ tipo: 'palavra', rotulo: ROTULO_TEXTO, texto: p.texto });
      } else {
        adicionar({ tipo: p.tipo, texto: p.texto });
      }
      continue;
    }

    // Lista em preto sem frase em cima
    const pontos = [p.texto, ...pontosDepois()];
    adicionar({ tipo: 'pontos', texto: pontos.join('\n') });
  }

  return {
    titulo: titulo || nomeArquivo.replace(/\.docx$/i, ''),
    textoBase,
    modelo,
    culto,
    data: '',
    saudacao: '',
    blocos,
  };
}

export async function sermaoDoDocx(arquivo: ArrayBuffer, nomeArquivo = '') {
  const paragrafos = lerParagrafos(await documentoDoDocx(arquivo));
  if (!paragrafos.length) throw new Error('O documento está vazio.');
  return sermaoDosParagrafos(paragrafos, nomeArquivo);
}
