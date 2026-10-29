import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { modelos } from '../data/modelos';
import {
  abreNovaPagina,
  tituloDaPagina,
  destacarTudo,
  dividirDestaques,
  dividirQuadro,
  estiloBloco,
  linhasParaMostrar,
  rotuloVisivel,
} from '../estilo';
import { minutosEstimados, type Bloco, type Sermao } from '../store/sermoes';

function escapar(texto: string) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

// Converte um texto com *palavras-chave* em HTML, já escapado
function comDestaques(texto: string, corChave?: string) {
  const abre = corChave ? `<b style="color:${corChave}"><u>` : '<b><u>';
  return dividirDestaques(texto)
    .map((p) => {
      const trecho = p.chave ? `${p.marca ? '<b><u>' : abre}${escapar(p.texto)}</u></b>` : escapar(p.texto);
      if (!p.marca) return trecho;
      const { cor, fundo, italico } = p.marca;
      const estilo = [cor && `color:${cor}`, fundo && `background:${fundo}`, italico && 'font-style:italic'];
      return `<span style="${estilo.filter(Boolean).join(';')}">${trecho}</span>`;
    })
    .join('');
}

function blocoHtml(b: Bloco, titulo?: string) {
  const e = estiloBloco[b.tipo];
  const estilo = [
    `color:${e.cor}`,
    e.italico && 'font-style:italic',
    e.negrito && 'font-weight:bold',
    e.centralizado && 'text-align:center',
  ]
    .filter(Boolean)
    .join(';');

  const nome = titulo ? undefined : rotuloVisivel(b);
  const rotulo = nome ? `<span class="rotulo">${escapar(nome)}</span><br>` : '';
  if (e.quadro) {
    const { subtopico, pontos } = dividirQuadro(b.texto);
    const estiloTopo = e.topo ? ` style="color:${e.topo.cor};${e.topo.italico ? 'font-style:italic' : ''}"` : '';
    const estiloItens = e.itensComoTopo ? estiloTopo : '';
    const corItens = e.itensComoTopo ? e.topo?.corChave : undefined;
    const linhas = pontos
      .map((l) => `<tr><td${estiloItens}>• ${comDestaques(e.autoDestaque ? destacarTudo(l) : l, corItens)}</td></tr>`)
      .join('');
    return `<table class="quadro"><tr><th${estiloTopo}><span class="seta">➔</span>${comDestaques(subtopico, e.topo?.corChave)}</th></tr>${linhas}</table>`;
  }
  const { cabecalho, linhas } = linhasParaMostrar(b.tipo, b.texto);
  if (e.lista) {
    const itens = linhas.map((l) => `<li>${comDestaques(l)}</li>`).join('');
    return `${rotulo ? `<p>${rotulo}</p>` : ''}<ul style="${estilo}">${itens}</ul>`;
  }
  if (e.fundo) {
    return `<p class="topico"><span style="${estilo};background:${e.fundo}">${comDestaques(b.texto)}</span></p>`;
  }
  const topo = cabecalho ? `${comDestaques(cabecalho)}<br>` : '';
  if (e.seta) {
    // Recuo deslocado: as linhas de baixo começam embaixo da primeira letra, depois da seta
    return `${rotulo ? `<p>${rotulo}</p>` : ''}<p class="seta-bloco" style="${estilo}"><span class="seta">➔</span>${comDestaques(linhas.join('\n'))}</p>`;
  }
  return `<p style="${estilo}">${rotulo}${topo}${comDestaques(linhas.join('\n'))}</p>`;
}

export function htmlDoSermao(s: Sermao) {
  const blocos = s.blocos
    .map((b, i) => ({ b, nova: abreNovaPagina(s.blocos, i), titulo: tituloDaPagina(s.blocos, i) }))
    .filter(({ b }) => b.texto.trim())
    .map(
      ({ b, nova, titulo }) =>
        (nova ? '<div class="nova-pagina"></div>' : '') +
        (titulo ? `<p class="topico"><span style="background:#00FF00">${comDestaques(titulo)}</span></p>` : '') +
        blocoHtml(b, titulo),
    )
    .join('\n');

  const modelo = modelos.find((m) => m.id === s.modelo)?.nome ?? '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @page { margin: 2cm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13pt; line-height: 1.45; color: #000; }
  h1 { font-size: 20pt; margin: 0 0 4pt; }
  h1 span { background: #00FF00; padding: 1pt 4pt; }
  .nova-pagina { break-before: page; page-break-before: always; }
  .meta { font-size: 10pt; color: #5B6470; margin-bottom: 18pt; }
  p { margin: 6pt 0; }
  ul { margin: 2pt 0 8pt; padding-left: 22pt; }
  .topico { margin: 18pt 0 6pt; font-size: 15.5pt; }
  .topico span { padding: 1pt 4pt; }
  .quadro { width: 100%; border-collapse: collapse; border: 1.5pt solid #000; margin: 8pt 0; }
  .quadro th { text-align: left; font-weight: normal; background: #F1EFE9; border-bottom: 1.5pt solid #000; padding: 4pt 8pt; }
  .quadro td { border-top: 0.5pt solid #999; padding: 4pt 8pt 4pt calc(8pt + 1.5em); }
  .seta { display: inline-block; width: 1.5em; text-indent: 0; font-weight: bold; font-style: normal; color: #000; }
  .seta-bloco { padding-left: 1.5em; text-indent: -1.5em; }
  .rotulo { font-size: 9pt; font-weight: bold; color: #5B6470; text-transform: uppercase; letter-spacing: 0.5pt; }
</style></head>
<body>
  ${s.culto || s.data ? `<div class="meta">${escapar([s.culto, s.data].filter(Boolean).join(' · '))}</div>` : ''}
  <h1><span>${escapar(s.titulo || 'Sermão sem título')}</span></h1>
  <div class="meta">${[s.textoBase, modelo, `cerca de ${minutosEstimados(s)} min`].filter(Boolean).map(escapar).join(' · ')}</div>
  ${blocos}
</body></html>`;
}

export async function exportarPdf(s: Sermao) {
  const html = htmlDoSermao(s);
  if (Platform.OS === 'web') {
    // No navegador, a janela de impressão já oferece "Salvar como PDF"
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: s.titulo });
  } else {
    await Print.printAsync({ uri });
  }
}
