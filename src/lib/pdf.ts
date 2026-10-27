import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { modelos, nomesBloco, type TipoBloco } from '../data/modelos';
import { dividirDestaques, estiloBloco, linhasDoBloco } from '../estilo';
import { minutosEstimados, type Bloco, type Sermao } from '../store/sermoes';

function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

// Converte um texto com *palavras-chave* em HTML, já escapado
function comDestaques(texto: string) {
  return dividirDestaques(texto)
    .map((p) => (p.chave ? `<b><u>${escapar(p.texto)}</u></b>` : escapar(p.texto)))
    .join('');
}

function blocoHtml(b: Bloco) {
  const e = estiloBloco[b.tipo];
  const estilo = [
    `color:${e.cor}`,
    e.italico && 'font-style:italic',
    e.negrito && 'font-weight:bold',
    e.centralizado && 'text-align:center',
  ]
    .filter(Boolean)
    .join(';');

  if (e.lista) {
    const itens = linhasDoBloco(b.texto).map((l) => `<li>${comDestaques(l)}</li>`).join('');
    return `<ul style="${estilo}">${itens}</ul>`;
  }
  if (e.fundo) {
    return `<p class="topico"><span style="${estilo};background:${e.fundo}">${comDestaques(b.texto)}</span></p>`;
  }
  const rotulo = rotulados.has(b.tipo) ? `<span class="rotulo">${nomesBloco[b.tipo]}</span><br>` : '';
  return `<p style="${estilo}">${rotulo}${e.seta ? '➔ ' : ''}${comDestaques(b.texto)}</p>`;
}

// Blocos sem cor própria levam um rótulo pequeno
const rotulados = new Set<TipoBloco>(['introducao', 'ilustracao', 'aplicacao', 'conclusao', 'apelo', 'palavra']);

export function htmlDoSermao(s: Sermao) {
  const blocos = s.blocos
    .filter((b) => b.texto.trim())
    .map(blocoHtml)
    .join('\n');

  const modelo = modelos.find((m) => m.id === s.modelo)?.nome ?? '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @page { margin: 2cm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13pt; line-height: 1.45; color: #000; }
  h1 { font-size: 20pt; margin: 0 0 4pt; }
  .meta { font-size: 10pt; color: #5B6470; margin-bottom: 18pt; }
  p { margin: 6pt 0; }
  ul { margin: 2pt 0 8pt; padding-left: 22pt; }
  .topico { margin: 18pt 0 6pt; font-size: 14pt; }
  .topico span { padding: 1pt 4pt; }
  .rotulo { font-size: 9pt; font-weight: bold; color: #5B6470; text-transform: uppercase; letter-spacing: 0.5pt; }
</style></head>
<body>
  <h1>${escapar(s.titulo || 'Sermão sem título')}</h1>
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
