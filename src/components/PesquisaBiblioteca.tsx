import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { buscarNaBiblioteca, ID_CLIENTE_GOOGLE, prepararLogin } from '../ia/drive';
import { lerTrechos, montarPedidoBiblioteca, useChave } from '../ia/estudo';
import type { DadosEstudo } from '../store/sermoes';
import { cores } from '../theme';
import { CampoCrescente } from './CampoCrescente';
import { Botao, Cartao, Rotulo } from './ui';

type Mudar = (mudar: (d: DadosEstudo) => DadosEstudo) => void;

// A biblioteca pessoal fica no Google Drive (pasta "2 - Biblioteca") e os livros nunca são copiados para o app.
// A busca é feita no claude.ai, que já tem acesso ao Drive: o botão copia o pedido, a resposta colada vira
// cartões com os trechos, como as respostas das abas Observação, Interpretação e Aplicação
export function PesquisaBiblioteca({ estudo, mudar }: { estudo: DadosEstudo; mudar: Mudar }) {
  const [assunto, setAssunto] = useState('');
  const [colando, setColando] = useState(false);
  const [colado, setColado] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const chave = useChave();
  const trechos = estudo.trechosBiblioteca ?? [];
  // Com a chave da Anthropic e o login do Google, a busca é automática; sem eles, vai pelo claude.ai
  const automatica = Platform.OS === 'web' && !!ID_CLIENTE_GOOGLE && !!chave;

  useEffect(() => {
    if (automatica) prepararLogin().catch(() => {});
  }, [automatica]);

  const buscarSozinho = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      const novos = await buscarNaBiblioteca(chave, estudo, assunto, setAviso);
      mudar((e) => ({ ...e, trechosBiblioteca: [...(e.trechosBiblioteca ?? []), ...novos] }));
      setAviso(`Pronto: ${novos.length} trecho${novos.length === 1 ? '' : 's'} da sua biblioteca.`);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  const buscar = async () => {
    await Clipboard.setStringAsync(montarPedidoBiblioteca(estudo, assunto));
    setColando(true);
    setAviso('Pedido copiado. Cole no claude.ai, espere a resposta, copie tudo e cole no campo abaixo.');
  };

  const trazer = () => {
    const novos = lerTrechos(colado);
    if (novos) {
      mudar((e) => ({ ...e, trechosBiblioteca: [...(e.trechosBiblioteca ?? []), ...novos] }));
      setAviso(`Pronto: ${novos.length} trecho${novos.length === 1 ? '' : 's'} da sua biblioteca.`);
    } else if (colado.trim()) {
      // Resposta sem o JSON: guarda o texto como está, nas anotações
      mudar((e) => ({
        ...e,
        notasBiblioteca: [e.notasBiblioteca?.trim(), colado.trim()].filter(Boolean).join('\n\n'),
      }));
      setAviso('A resposta veio sem os trechos separados; guardei o texto nas anotações abaixo.');
    }
    setColado('');
    setColando(false);
  };

  return (
    <>
      <Botao
        titulo={ocupado ? 'Buscando...' : 'Buscar na Biblioteca'}
        onPress={() => (automatica ? buscarSozinho() : buscar())}
      />
      <TextInput
        accessibilityLabel="Assunto da busca"
        value={assunto}
        onChangeText={setAssunto}
        placeholder="Assunto (opcional)"
        placeholderTextColor={cores.textoSuave}
        style={estilos.campo}
      />

      {colando && (
        <View style={{ gap: 8 }}>
          <Botao
            titulo="Abrir o claude.ai"
            variante="contorno"
            onPress={() => Linking.openURL('https://claude.ai/new')}
          />
          <TextInput
            accessibilityLabel="Resposta do Claude"
            multiline
            value={colado}
            onChangeText={setColado}
            placeholder="Cole aqui a resposta do Claude"
            placeholderTextColor={cores.textoSuave}
            style={[estilos.campo, { minHeight: 100 }]}
          />
          <Botao titulo="Trazer para o app" onPress={trazer} />
        </View>
      )}
      {ocupado && <ActivityIndicator color={cores.destaque} />}
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}

      {trechos.length > 0 && (
        <Cartao style={{ gap: 10 }}>
          <Rotulo>Trechos da sua biblioteca</Rotulo>
          {trechos.map((t, i) => (
            <View key={i} style={[estilos.trecho, i > 0 && estilos.separador]}>
              <Text style={estilos.livro}>{[t.livro, t.autor].filter(Boolean).join(' · ')}</Text>
              {t.local ? <Text style={estilos.local}>{t.local}</Text> : null}
              <Text style={estilos.citacao}>“{t.trecho}”</Text>
              {t.comentario ? <Text style={estilos.comentario}>{t.comentario}</Text> : null}
              <Text
                accessibilityRole="button"
                onPress={() =>
                  mudar((e) => ({ ...e, trechosBiblioteca: (e.trechosBiblioteca ?? []).filter((_, j) => j !== i) }))
                }
                style={estilos.remover}
              >
                Remover
              </Text>
            </View>
          ))}
        </Cartao>
      )}

      <Cartao style={{ gap: 10 }}>
        <Rotulo>Suas anotações da biblioteca</Rotulo>
        <CampoCrescente
          accessibilityLabel="Anotações da biblioteca"
          value={estudo.notasBiblioteca ?? ''}
          onChangeText={(t) => mudar((e) => ({ ...e, notasBiblioteca: t }))}
          placeholder="O que você quer guardar destas leituras"
          placeholderTextColor={cores.textoSuave}
          alturaMinima={80}
          style={estilos.campo}
        />
      </Cartao>
    </>
  );
}

const estilos = StyleSheet.create({
  aviso: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: cores.destaqueEscuro },
  campo: {
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: cores.texto,
    backgroundColor: cores.cartao,
    textAlignVertical: 'top',
  },
  trecho: { gap: 4 },
  separador: { borderTopWidth: 1, borderTopColor: cores.borda, paddingTop: 12 },
  livro: { fontSize: 15, fontWeight: '700', color: cores.texto },
  local: { fontSize: 13, color: cores.textoSuave },
  citacao: { fontSize: 15, lineHeight: 22, fontStyle: 'italic', color: cores.texto },
  comentario: { fontSize: 14, lineHeight: 20, color: cores.textoSuave },
  remover: { fontSize: 13, color: cores.textoSuave, textDecorationLine: 'underline', alignSelf: 'flex-start' },
});
