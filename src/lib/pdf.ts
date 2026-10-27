import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { modelos, nomesBloco } from '../data/modelos';
import { minutosEstimados, type Sermao } from '../store/sermoes';

function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export function htmlDoSermao(s: Sermao) {
  let topico = 0;
  const blocos = s.blocos
    .filter((b) => b.texto.trim())
    .map((b) => {
      if (b.tipo === 'topico') {
        topico += 1;
        return `<h2>${topico}. ${escapar(b.texto)}</h2>`;
      }
      if (b.tipo === 'versiculo' || b.tipo === 'citacao') {
        return `<blockquote>${escapar(b.texto)}</blockquote>`;
      }
      return `<p><span class="rotulo">${nomesBloco[b.tipo]}</span><br>${escapar(b.texto)}</p>`;
    })
    .join('\n');

  const modelo = modelos.find((m) => m.id === s.modelo)?.nome ?? '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @page { margin: 2cm; }
  body { font-family: Georgia, serif; font-size: 13pt; line-height: 1.5; color: #1C2430; }
  h1 { font-size: 22pt; margin: 0 0 4pt; }
  .meta { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #5B6470; margin-bottom: 18pt; }
  h2 { font-size: 15pt; margin: 18pt 0 6pt; color: #174F56; }
  blockquote { margin: 8pt 0; padding: 6pt 12pt; border-left: 3pt solid #B7791F; background: #FBF3E6; }
  .rotulo { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; font-weight: bold; color: #5B6470; text-transform: uppercase; letter-spacing: 0.5pt; }
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
