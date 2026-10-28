import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { guardarChave, lerChave, lerResultado, montarPedido, responderComChave, type ResultadoIA } from '../ia/estudo';
import type { DadosEstudo } from '../store/sermoes';
import { cores } from '../theme';
import { Botao, Cartao, Rotulo } from './ui';

// Mostra só o começo e o fim da chave, para conferir sem expor a chave inteira
const mascarar = (c: string) => `${c.slice(0, 14)}...${c.slice(-4)} (${c.length} caracteres)`;

type Mudar = (mudar: (d: DadosEstudo) => DadosEstudo) => void;

// A IA responde as perguntas de Observação, Interpretação e Aplicação e sugere 4 temas. Com a chave da
// Anthropic, direto no app; sem chave, copiando o pedido para o claude.ai e colando a resposta de volta.
// Só preenche as perguntas que ainda estão em branco
export function AjudaIA({ estudo, mudar }: { estudo: DadosEstudo; mudar: Mudar }) {
  const [chave, setChave] = useState('');
  const [editandoChave, setEditandoChave] = useState(false);
  const [novaChave, setNovaChave] = useState('');
  const [colando, setColando] = useState(false);
  const [colado, setColado] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    lerChave().then(setChave);
  }, []);

  const aplicar = (r: ResultadoIA) => {
    let novas = 0;
    mudar((e) => {
      const respostas = { ...e.respostas };
      for (const [pergunta, resposta] of Object.entries(r.respostas)) {
        if (!respostas[pergunta]?.trim()) {
          respostas[pergunta] = resposta;
          novas++;
        }
      }
      return { ...e, respostas, temas: r.temas.length ? r.temas : e.temas };
    });
    setAviso(
      `Pronto: ${novas || 'nenhuma'} resposta${novas === 1 ? '' : 's'} preenchida${novas === 1 ? '' : 's'}` +
        (r.temas.length ? ` e ${r.temas.length} temas sugeridos para o sermão.` : '.') +
        ' Respostas que você já tinha escrito ficaram como estavam.',
    );
  };

  const responder = async () => {
    setOcupado(true);
    setAviso('A IA está estudando o texto. Isso leva de 1 a 3 minutos...');
    try {
      aplicar(await responderComChave(chave, estudo));
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(await montarPedido(estudo));
      setColando(true);
      setAviso('Pedido copiado. Cole no claude.ai, espere a resposta, copie tudo e cole no campo abaixo.');
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não consegui copiar.');
    }
  };

  const preencher = () => {
    try {
      aplicar(lerResultado(estudo, colado));
      setColado('');
      setColando(false);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não consegui ler a resposta.');
    }
  };

  if (!estudo.textoBase) return null;

  return (
    <Cartao style={estilos.cartao}>
      <Rotulo>Responder com IA</Rotulo>
      <Text style={estilos.dica}>
        A IA responde todas as perguntas de Observação, Interpretação e Aplicação sobre {estudo.textoBase}, usando a
        perícope, o livro e a Bíblia como contexto, e sugere 4 temas para o sermão.
      </Text>

      {chave ? (
        <Botao titulo={ocupado ? 'Estudando...' : 'Responder com IA'} onPress={() => !ocupado && responder()} />
      ) : null}
      <Botao titulo="Copiar pedido para o Claude" variante={chave ? 'contorno' : 'principal'} onPress={copiar} />
      {ocupado && <ActivityIndicator color={cores.destaque} />}

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
          <Botao titulo="Preencher o estudo" onPress={preencher} />
        </View>
      )}

      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}

      {editandoChave ? (
        <View style={{ gap: 8 }}>
          <Text style={estilos.dica}>
            Cole a chave da API da Anthropic (começa com sk-ant-api03- e tem uns 100 caracteres). Ela fica guardada só
            neste aparelho.{chave ? ` Chave atual: ${mascarar(chave)}` : ''}
          </Text>
          <TextInput
            accessibilityLabel="Chave da Anthropic"
            value={novaChave}
            onChangeText={setNovaChave}
            placeholder="sk-ant-api03-..."
            placeholderTextColor={cores.textoSuave}
            // Campo comum, não de senha, para o Chrome não preencher com uma senha salva
            autoComplete="off"
            importantForAutofill="no"
            autoCapitalize="none"
            autoCorrect={false}
            style={estilos.campo}
          />
          <View style={estilos.linha}>
            <Botao
              titulo="Guardar"
              onPress={() => {
                // A chave não tem espaços: tira quebras de linha e espaços que vêm junto ao colar
                const c = novaChave.replace(/\s+/g, '');
                if (c && !c.startsWith('sk-ant-')) {
                  setAviso('Isso não parece uma chave da Anthropic: ela começa com sk-ant-. Copie de novo no console.');
                  return;
                }
                setChave(c);
                guardarChave(c);
                setNovaChave('');
                setEditandoChave(false);
                setAviso(c ? `Chave guardada neste aparelho: ${mascarar(c)}` : 'Chave removida.');
              }}
              style={{ flex: 1 }}
            />
            {chave ? (
              <Botao
                titulo="Remover"
                variante="perigo"
                onPress={() => {
                  setChave('');
                  guardarChave('');
                  setNovaChave('');
                  setEditandoChave(false);
                  setAviso('Chave removida.');
                }}
                style={{ flex: 1 }}
              />
            ) : null}
            <Botao
              titulo="Criar chave"
              variante="contorno"
              onPress={() => Linking.openURL('https://platform.claude.com/settings/keys')}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <Text accessibilityRole="button" onPress={() => setEditandoChave(true)} style={estilos.link}>
          {chave
            ? `Trocar ou remover a chave da Anthropic (${mascarar(chave)})`
            : 'Tenho uma chave da Anthropic (opcional)'}
        </Text>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: 10, borderColor: cores.destaque, borderWidth: 1 },
  dica: { fontSize: 14, lineHeight: 20, color: cores.textoSuave },
  aviso: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: cores.destaqueEscuro },
  linha: { flexDirection: 'row', gap: 8 },
  campo: {
    borderWidth: 1,
    borderColor: cores.bordaForte,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: cores.texto,
    backgroundColor: cores.fundo,
    textAlignVertical: 'top',
  },
  link: { fontSize: 14, fontWeight: '600', color: cores.destaque, paddingVertical: 6 },
});
