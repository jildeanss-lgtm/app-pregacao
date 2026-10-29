// O HTML do sermão (htmlParaDocs) escrito como .docx, porque o Google Docs ignora as quebras de página
// de um HTML e só respeita as de um .docx. Lê só o HTML que o próprio app escreve: <p>, <ul><li>, <b>,
// <u>, <span>, <br> e os estilos color, background-color, font-style, text-align e page-break-before

type Formato = { b?: boolean; u?: boolean; i?: boolean; cor?: string; fundo?: string };

const desfazer = (t: string) =>
  t
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
const xml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hex = (c?: string) => c?.replace('#', '').toUpperCase();

function comEstilo(f: Formato, estilo: string): Formato {
  const valor = (nome: string) => estilo.match(new RegExp(`(?:^|;)\\s*${nome}\\s*:\\s*([^;]+)`))?.[1]?.trim();
  return {
    ...f,
    cor: valor('color') ?? f.cor,
    fundo: valor('background-color') ?? f.fundo,
    i: valor('font-style') === 'italic' || f.i,
  };
}

// Os trechos de texto de dentro de um parágrafo, cada um com a sua formatação
function trechos(html: string, base: Formato) {
  const runs: string[] = [];
  const pilha: Formato[] = [base];
  for (const [, fecha, tag, attrs, texto] of html.matchAll(/<(\/?)(\w+)([^>]*)>|([^<]+)/g)) {
    const f = pilha[pilha.length - 1];
    if (texto !== undefined) {
      const rPr = [
        f.b && '<w:b/>',
        f.i && '<w:i/>',
        f.u && '<w:u w:val="single"/>',
        f.cor && `<w:color w:val="${hex(f.cor)}"/>`,
        f.fundo && `<w:shd w:val="clear" w:color="auto" w:fill="${hex(f.fundo)}"/>`,
      ]
        .filter(Boolean)
        .join('');
      runs.push(`<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${xml(desfazer(texto))}</w:t></w:r>`);
    } else if (tag === 'br') runs.push('<w:r><w:br/></w:r>');
    else if (fecha) pilha.length > 1 && pilha.pop();
    else {
      const estilo = attrs.match(/style="([^"]*)"/)?.[1] ?? '';
      pilha.push(comEstilo({ ...f, b: f.b || tag === 'b', u: f.u || tag === 'u', i: f.i || tag === 'i' }, estilo));
    }
  }
  return runs.join('');
}

function paragrafo(conteudo: string, estilo: string, lista: boolean) {
  const base = comEstilo({}, estilo);
  const pPr = [
    lista && '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>',
    /text-indent:-17pt/.test(estilo) && '<w:ind w:left="0" w:hanging="340"/>',
    /text-align:center/.test(estilo) && '<w:jc w:val="center"/>',
  ]
    .filter(Boolean)
    .join('');
  // A quebra de página vai no começo do parágrafo, como o Docs mesmo escreve
  const quebra = /page-break-before:always/.test(estilo) ? '<w:r><w:br w:type="page"/></w:r>' : '';
  // A linha em branco (<p><br></p>) é um parágrafo vazio
  const runs = conteudo.trim() === '<br>' ? '' : trechos(conteudo, base);
  return `<w:p><w:pPr>${pPr}</w:pPr>${quebra}${runs}</w:p>`;
}

export function documentoDoHtml(html: string) {
  const corpo = html.slice(html.indexOf('<body'));
  const paragrafos: string[] = [];
  for (const [, tag, estilo = '', conteudo] of corpo.matchAll(/<(p|ul)(?: style="([^"]*)")?>([\s\S]*?)<\/\1>/g)) {
    if (tag === 'p') paragrafos.push(paragrafo(conteudo, estilo, false));
    else for (const [, li] of conteudo.matchAll(/<li>([\s\S]*?)<\/li>/g)) paragrafos.push(paragrafo(li, estilo, true));
  }
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    paragrafos.join('') +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>' +
    '</w:body></w:document>'
  );
}

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const arquivosFixos: Record<string, string> = {
  '[Content_Types].xml':
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>',
  '_rels/.rels':
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/_rels/document.xml.rels':
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>',
  // Arial 12 e sem espaço depois do parágrafo: as linhas em branco são as do próprio sermão
  'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`,
  'word/numbering.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="●"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
};

// --- Zip sem compressão (o Drive aceita), com o CRC-32 de cada arquivo ---
const tabelaCrc = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(dados: Uint8Array) {
  let c = 0xffffffff;
  for (const b of dados) c = tabelaCrc[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(arquivos: Record<string, string>) {
  const codificar = new TextEncoder();
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let posicao = 0;
  for (const [nome, texto] of Object.entries(arquivos)) {
    const n = codificar.encode(nome);
    const d = codificar.encode(texto);
    const crc = crc32(d);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint32(14, crc, true);
    local.setUint32(18, d.length, true);
    local.setUint32(22, d.length, true);
    local.setUint16(26, n.length, true);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, d.length, true);
    c.setUint32(24, d.length, true);
    c.setUint16(28, n.length, true);
    c.setUint32(42, posicao, true);
    partes.push(new Uint8Array(local.buffer), n, d);
    central.push(new Uint8Array(c.buffer), n);
    posicao += 30 + n.length + d.length;
  }
  const tamanho = central.reduce((s, p) => s + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, Object.keys(arquivos).length, true);
  fim.setUint16(10, Object.keys(arquivos).length, true);
  fim.setUint32(12, tamanho, true);
  fim.setUint32(16, posicao, true);
  const tudo = [...partes, ...central, new Uint8Array(fim.buffer)];
  const saida = new Uint8Array(tudo.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of tudo) {
    saida.set(p, i);
    i += p.length;
  }
  return saida;
}

export function docxDoHtml(html: string) {
  return zip({ ...arquivosFixos, 'word/document.xml': documentoDoHtml(html) });
}
