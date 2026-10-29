import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { editadoNoDrive, gravarNoDocs, juntarComApp, lerDoDocs, linkDoDocs, quandoMudouNoDocs } from '../exportar/docs';
import { pedirToken } from '../ia/drive';
import type { Sermao } from '../store/sermoes';
import { cores } from '../theme';
import { Botao } from './ui';

const novoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Botões do fim do editor que ligam o sermão a um Google Docs na pasta "App Pregação": o app grava o Docs no
// padrão de cores e, depois de editar pelo Drive, traz as mudanças de volta para as caixas
export function PainelDocs({
  sermao,
  atualizar,
  antesDeTrocar,
  apenasAtualizar,
}: {
  sermao: Sermao;
  atualizar: (id: string, mudar: (s: Sermao) => Sermao) => void;
  // Guarda o passo do Desfazer antes de trocar as caixas pelas do Docs
  antesDeTrocar: () => void;
  // No topo do editor (primeira página) fica só o Atualizar do Docs, como o Jildean pediu
  apenasAtualizar?: boolean;
}) {
  const [ocupado, setOcupado] = useState('');
  const [aviso, setAviso] = useState('');
  // O Docs foi mudado pelo Drive: gravar por cima só se o Jildean confirmar
  const [mudouNoDrive, setMudouNoDrive] = useState(false);

  if (Platform.OS !== 'web' || (apenasAtualizar && !sermao.docId)) return null;

  const tentar = async (texto: string, fazer: () => Promise<void>) => {
    setAviso('');
    setOcupado(texto);
    try {
      await fazer();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.');
    } finally {
      setOcupado('');
    }
  };

  const abrir = (porCima = false) => {
    // A aba nova abre já no toque (depois de esperar o Drive, o navegador bloquearia)
    const aba = window.open('', '_blank');
    tentar('Gravando no Google Docs...', async () => {
      try {
        const t = await pedirToken();
        if (sermao.docId && sermao.docEm && !porCima) {
          const mudou = await quandoMudouNoDocs(t, sermao.docId).catch(() => undefined);
          if (mudou && editadoNoDrive(mudou, sermao.docEm)) {
            setMudouNoDrive(true);
            if (aba) aba.location.href = linkDoDocs(sermao.docId);
            return;
          }
        }
        const r = await gravarNoDocs(t, sermao);
        atualizar(sermao.id, (s) => ({ ...s, docId: r.id, docEm: r.modifiedTime }));
        setMudouNoDrive(false);
        setAviso('Google Docs atualizado com o sermão do app.');
        if (aba) aba.location.href = linkDoDocs(r.id);
        else window.open(linkDoDocs(r.id), '_blank');
      } catch (e) {
        aba?.close();
        throw e;
      }
    });
  };

  const trazer = () =>
    tentar('Trazendo as mudanças do Docs...', async () => {
      const t = await pedirToken();
      const novo = await lerDoDocs(t, sermao.docId!);
      const blocos = juntarComApp(sermao.blocos, novo.blocos, novoId);
      // Caixa editada no Docs: sai a do app e entra a lida do Docs, conta uma vez só
      const mudaram = Math.max(
        blocos.filter((b) => !sermao.blocos.includes(b)).length,
        sermao.blocos.filter((b) => !blocos.includes(b)).length,
      );
      setMudouNoDrive(false);
      if (!mudaram) {
        atualizar(sermao.id, (s) => ({ ...s, docEm: novo.modifiedTime }));
        // O Google às vezes leva alguns segundos para entregar a última edição
        setAviso('Não achei mudanças no Docs. Se acabou de editar, espere uns segundos e toque de novo.');
        return;
      }
      antesDeTrocar();
      atualizar(sermao.id, (s) => ({ ...s, blocos, docEm: novo.modifiedTime }));
      setAviso(
        `${mudaram === 1 ? '1 caixa mudou' : `${mudaram} caixas mudaram`} com o Google Docs. Se não gostar, use o Desfazer.`,
      );
    });

  return (
    <View style={estilos.painel}>
      {apenasAtualizar ? null : <Botao titulo="Abrir no Google Docs" variante="contorno" onPress={() => abrir()} />}
      {sermao.docId ? <Botao titulo="Atualizar do Docs" variante="contorno" onPress={trazer} /> : null}
      {ocupado ? (
        <View style={estilos.linha}>
          <ActivityIndicator color={cores.texto} />
          <Text style={estilos.texto}>{ocupado}</Text>
        </View>
      ) : null}
      {mudouNoDrive ? (
        <View style={estilos.alerta}>
          <Text style={estilos.texto}>
            O Docs foi editado pelo Drive depois da última gravação do app. Abri o Docs sem mexer nele. Para trazer
            essas mudanças, toque em Atualizar do Docs. Para trocar o Docs pelo que está no app, grave por cima.
          </Text>
          <Botao titulo="Gravar o app por cima do Docs" variante="perigo" onPress={() => abrir(true)} />
        </View>
      ) : null}
      {aviso ? <Text style={estilos.texto}>{aviso}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  painel: { gap: 8 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  texto: { fontSize: 13, lineHeight: 18, color: cores.textoSuave },
  alerta: { gap: 8, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F3C1C1', backgroundColor: '#FDF3F3' },
});
