import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { drive, pedirToken } from '../ia/drive';
import { sermaoDoDocx } from '../importar/docx';
import { useSermoes } from '../store/sermoes';
import { cores } from '../theme';
import { Botao } from './ui';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const GOOGLE_DOC = 'application/vnd.google-apps.document';

type Documento = { id: string; name: string; mimeType: string; modifiedTime?: string };

const dia = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');

// Botão da aba Sermão que traz um sermão pronto do Google Drive (Google Docs ou .docx) ou um .docx do
// aparelho: o texto entra nas caixas do sermão já no padrão de cores (ver importar/docx)
export function ImportarSermao() {
  const { criar } = useSermoes();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [documentos, setDocumentos] = useState<Documento[] | null>(null);
  const [ocupado, setOcupado] = useState('');
  const [erro, setErro] = useState('');

  if (Platform.OS !== 'web') return null;

  const abrirSermao = async (arquivo: ArrayBuffer, nome: string) => {
    const novo = await sermaoDoDocx(arquivo, nome);
    const sermao = criar(novo);
    setAberto(false);
    router.push(`/sermao/${sermao.id}`);
  };

  const tentar = async (aviso: string, fazer: () => Promise<void>) => {
    setErro('');
    setOcupado(aviso);
    try {
      await fazer();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.');
    } finally {
      setOcupado('');
    }
  };

  const procurar = (texto = busca) =>
    tentar('Procurando no Drive...', async () => {
      const t = await pedirToken();
      const nome = texto.trim().replace(/['\\]/g, '\\$&');
      const q = [
        `(mimeType='${GOOGLE_DOC}' or mimeType='${DOCX}')`,
        'trashed=false',
        ...(nome ? [`name contains '${nome}'`] : []),
      ].join(' and ');
      const params = new URLSearchParams({
        q,
        fields: 'files(id,name,mimeType,modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: '30',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      });
      const r = await drive(`/files?${params}`, t);
      setDocumentos(((await r.json()) as { files?: Documento[] }).files ?? []);
    });

  const trazer = (d: Documento) =>
    tentar(`Trazendo "${d.name}"...`, async () => {
      const t = await pedirToken();
      const caminho =
        d.mimeType === GOOGLE_DOC
          ? `/files/${d.id}/export?mimeType=${encodeURIComponent(DOCX)}`
          : `/files/${d.id}?alt=media&supportsAllDrives=true`;
      const r = await drive(caminho, t);
      await abrirSermao(await r.arrayBuffer(), d.name);
    });

  const doAparelho = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `.docx,${DOCX}`;
    input.onchange = () => {
      const arquivo = input.files?.[0];
      if (arquivo)
        tentar(`Lendo "${arquivo.name}"...`, async () => abrirSermao(await arquivo.arrayBuffer(), arquivo.name));
    };
    input.click();
  };

  if (!aberto) {
    return (
      <Botao
        titulo="⤓ Trazer sermão do Drive"
        variante="contorno"
        onPress={() => {
          setAberto(true);
          if (!documentos) procurar('');
        }}
      />
    );
  }

  return (
    <View style={estilos.painel}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Trazer sermão do Drive</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setAberto(false)}>
          <Text style={estilos.fechar}>✕</Text>
        </Pressable>
      </View>
      <Text style={estilos.suave}>
        Escolha um Google Docs ou .docx. O app lê as cores e monta as caixas no seu padrão: tópico, texto bíblico,
        frase, frase de efeito, pergunta e aplicação.
      </Text>
      <TextInput
        value={busca}
        onChangeText={setBusca}
        onSubmitEditing={() => procurar()}
        placeholder="Procurar pelo nome do arquivo"
        placeholderTextColor={cores.textoSuave}
        style={estilos.busca}
        returnKeyType="search"
      />
      {ocupado ? (
        <View style={estilos.linha}>
          <ActivityIndicator color={cores.texto} />
          <Text style={estilos.suave}>{ocupado}</Text>
        </View>
      ) : null}
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
      {documentos && !ocupado ? (
        documentos.length ? (
          documentos.map((d) => (
            <Pressable key={d.id} accessibilityRole="button" onPress={() => trazer(d)} style={estilos.documento}>
              <Text style={estilos.icone}>{d.mimeType === GOOGLE_DOC ? '▤' : 'W'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nome} numberOfLines={2}>
                  {d.name}
                </Text>
                <Text style={estilos.suave}>
                  {[d.mimeType === GOOGLE_DOC ? 'Google Docs' : 'Word', dia(d.modifiedTime)].join(' · ')}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={estilos.suave}>Nenhum documento encontrado.</Text>
        )
      ) : null}
      {!documentos && !ocupado ? (
        <Botao titulo="Entrar no Google e ver os documentos" onPress={() => procurar()} />
      ) : null}
      <Pressable accessibilityRole="button" onPress={doAparelho} style={estilos.aparelho}>
        <Text style={estilos.textoAparelho}>ou escolher um .docx deste aparelho</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  painel: { gap: 10, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: cores.borda },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  fechar: { fontSize: 18, color: cores.textoSuave, paddingHorizontal: 6 },
  suave: { fontSize: 13, lineHeight: 18, color: cores.textoSuave },
  erro: { fontSize: 13, color: '#A33A2B' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busca: {
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: cores.texto,
  },
  documento: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  icone: { width: 28, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1A73E8' },
  nome: { fontSize: 15, color: cores.texto },
  aparelho: { alignSelf: 'center', paddingVertical: 6 },
  textoAparelho: { fontSize: 14, color: cores.texto, textDecorationLine: 'underline' },
});
