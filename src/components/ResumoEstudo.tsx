import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { montarPedidoResumo, resumirComChave, useChave } from '../ia/estudo';
import type { DadosEstudo } from '../store/sermoes';
import { cores, fonteEsboco } from '../theme';
import { CampoCrescente } from './CampoCrescente';
import { Botao } from './ui';

type Mudar = (mudar: (d: DadosEstudo) => DadosEstudo) => void;

// Aba Resumo: a IA junta Observação, Interpretação, Aplicação, anotações e biblioteca num rascunho já em forma
// de sermão. Com a chave da Anthropic, direto no app; sem chave, copiando o pedido para o claude.ai
export function ResumoEstudo({ estudo, mudar }: { estudo: DadosEstudo; mudar: Mudar }) {
  const chave = useChave();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [copiado, setCopiado] = useState(false);

  if (!estudo.textoBase) {
    return <Text style={estilos.dica}>Escolha um texto na aba Bíblia para fazer o resumo do estudo.</Text>;
  }

  const gerar = async () => {
    if (ocupado) return;
    if (estudo.resumo?.trim()) {
      setAviso('Apague o resumo atual antes de gerar outro. Assim nada do que você escreveu se perde.');
      return;
    }
    setOcupado(true);
    setAviso('A IA está resumindo o estudo. Isso leva de 1 a 2 minutos...');
    try {
      const resumo = await resumirComChave(chave, estudo);
      mudar((e) => ({ ...e, resumo }));
      setAviso('Pronto. Ajuste o que quiser: o resumo vai junto quando você criar o sermão.');
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  const copiar = async () => {
    await Clipboard.setStringAsync(await montarPedidoResumo(estudo));
    setCopiado(true);
    setAviso('Pedido copiado. Cole no claude.ai, espere a resposta, copie tudo e cole no campo abaixo.');
  };

  return (
    <>
      {/* Só o botão no topo: com a chave a IA resume no app; sem chave, copia o pedido para o claude.ai */}
      <View style={estilos.topo}>
        <Botao titulo={ocupado ? 'Resumindo...' : 'Gerar resumo'} onPress={() => (chave ? gerar() : copiar())} />
        {copiado && (
          <Botao
            titulo="Abrir o claude.ai"
            variante="contorno"
            onPress={() => Linking.openURL('https://claude.ai/new')}
          />
        )}
        {ocupado && <ActivityIndicator color={cores.destaque} />}
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      </View>

      <View style={estilos.folha}>
        <CampoCrescente
          accessibilityLabel="Resumo do estudo"
          value={estudo.resumo ?? ''}
          onChangeText={(resumo) => mudar((e) => ({ ...e, resumo }))}
          placeholder="O resumo aparece aqui. Sem a chave, cole aqui a resposta do claude.ai."
          placeholderTextColor={cores.textoSuave}
          alturaMinima={200}
          style={estilos.texto}
        />
      </View>

      <Botao titulo="Criar sermão" onPress={() => router.push('/novo')} />
    </>
  );
}

const estilos = StyleSheet.create({
  topo: { gap: 10 },
  dica: { fontSize: 14, lineHeight: 20, color: cores.textoSuave },
  aviso: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: cores.destaqueEscuro },
  // Folha branca, como um documento, com o rascunho do sermão
  folha: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADCE0', padding: 24 },
  texto: { fontSize: 16, lineHeight: 22, color: cores.texto, fontFamily: fonteEsboco, textAlignVertical: 'top' },
});
