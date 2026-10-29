import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { prepararLogin } from '../ia/drive';
import { useSermoes } from '../store/sermoes';
import { cores } from '../theme';

const hora = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

// Faixa da aba Sermão que mostra se os sermões estão guardados no Google Drive
export function PainelNuvem() {
  const { nuvem, sincronizarAgora } = useSermoes();

  // O login abre numa janela logo depois do toque: o script do Google já fica carregado
  useEffect(() => {
    if (nuvem.disponivel) prepararLogin().catch(() => undefined);
  }, [nuvem.disponivel]);

  if (!nuvem.disponivel) return null;

  const texto = !nuvem.ligada
    ? 'Seus sermões estão só neste aparelho. Toque para guardar no Google Drive e abrir no celular, iPad ou computador.'
    : nuvem.estado === 'sincronizando'
      ? 'Sincronizando com o Google Drive...'
      : nuvem.estado === 'ok'
        ? `Guardado no Google Drive às ${hora(nuvem.quando)}. Toque para buscar as mudanças dos outros aparelhos.`
        : nuvem.estado === 'erro'
          ? `Não deu para sincronizar: ${nuvem.erro} Toque para tentar de novo.`
          : 'Toque para entrar no Google e sincronizar os sermões com o Drive.';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sincronizar com o Google Drive"
      disabled={nuvem.estado === 'sincronizando'}
      onPress={sincronizarAgora}
      style={[estilos.faixa, nuvem.estado === 'ok' ? estilos.ok : nuvem.estado === 'erro' ? estilos.erro : null]}
    >
      <Text style={estilos.icone}>{nuvem.estado === 'ok' ? '☁︎ ✓' : '☁︎'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={estilos.titulo}>{nuvem.ligada ? 'Google Drive' : 'Guardar no Google Drive'}</Text>
        <Text style={estilos.texto}>{texto}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: '#F8F9FA',
  },
  ok: { borderColor: '#B7E1C1', backgroundColor: '#F1FAF3' },
  erro: { borderColor: '#F3C1C1', backgroundColor: '#FDF3F3' },
  icone: { fontSize: 20, color: cores.textoSuave },
  titulo: { fontSize: 14, fontWeight: '600', color: cores.texto },
  texto: { fontSize: 13, lineHeight: 18, color: cores.textoSuave, marginTop: 2 },
});
