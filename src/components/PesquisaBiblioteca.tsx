import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, StyleSheet, Text, TextInput } from 'react-native';
import type { DadosEstudo } from '../store/sermoes';
import { cores } from '../theme';
import { CampoCrescente } from './CampoCrescente';
import { Botao, Cartao, Rotulo } from './ui';

type Mudar = (mudar: (d: DadosEstudo) => DadosEstudo) => void;

// A biblioteca pessoal fica no Google Drive (pasta "2 - Biblioteca") e os livros nunca são copiados para o app.
// A pesquisa é feita no claude.ai, que já tem acesso ao Drive: o app monta o pedido e guarda a resposta colada
function pedidoBiblioteca(tema: string, pergunta: string) {
  return `Use o meu Google Drive conectado. Pesquise na pasta "2 - Biblioteca" e nas subpastas dela (por exemplo "01 Bíblia e Estudo Bíblico", "02 Teologia Sistemática" e a "Enciclopédia Temática Shedd") o que os livros dizem sobre: ${tema}.${pergunta ? `\n\nMinha pergunta: ${pergunta}` : ''}

Para cada livro que trate do assunto (até 6), traga:
- título e autor
- capítulo ou página
- um resumo de 2 a 4 frases do que o autor diz, com uma citação curta entre aspas quando houver

Use só o que está nos livros da pasta e diga quando não encontrar nada. Termine com 3 ideias para o sermão a partir dessas fontes. Responda em português do Brasil, em texto simples, sem tabelas.`;
}

// Pesquisa nos livros do Drive: usada na aba Biblioteca do Estudar e na tela Biblioteca
export function PesquisaBiblioteca({ estudo, mudar }: { estudo: DadosEstudo; mudar: Mudar }) {
  const [tema, setTema] = useState(estudo.textoBase);
  const [pergunta, setPergunta] = useState('');
  const [copiado, setCopiado] = useState(false);

  return (
    <>
      <Rotulo>Pesquisar na minha biblioteca</Rotulo>
      <Cartao style={{ gap: 10 }}>
        <Text style={estilos.suave}>
          Pesquisa nos livros da pasta “2 - Biblioteca” do seu Google Drive, pelo claude.ai. Copie o pedido, cole no
          claude.ai e depois cole a resposta aqui embaixo. Ela fica guardada no estudo e aparece em “Seu estudo” no
          sermão.
        </Text>
        <TextInput
          accessibilityLabel="Assunto da pesquisa"
          value={tema}
          onChangeText={setTema}
          placeholder="Assunto ou texto (ex.: Romanos 7:15-20, a luta contra o pecado)"
          placeholderTextColor={cores.textoSuave}
          style={estilos.campo}
        />
        <TextInput
          accessibilityLabel="Pergunta para a biblioteca"
          value={pergunta}
          onChangeText={setPergunta}
          placeholder="Pergunta (opcional)"
          placeholderTextColor={cores.textoSuave}
          style={estilos.campo}
        />
        <Botao
          titulo={copiado ? 'Pedido copiado' : 'Copiar pedido para o Claude'}
          onPress={async () => {
            await Clipboard.setStringAsync(pedidoBiblioteca(tema.trim() || 'o texto do sermão', pergunta.trim()));
            setCopiado(true);
          }}
        />
        <Botao
          titulo="Abrir o claude.ai"
          variante="contorno"
          onPress={() => Linking.openURL('https://claude.ai/new')}
        />
        <CampoCrescente
          accessibilityLabel="Resposta da biblioteca"
          value={estudo.notasBiblioteca ?? ''}
          onChangeText={(t) => mudar((e) => ({ ...e, notasBiblioteca: t }))}
          placeholder="Cole aqui a resposta do Claude"
          placeholderTextColor={cores.textoSuave}
          alturaMinima={120}
          style={estilos.campo}
        />
      </Cartao>
    </>
  );
}

const estilos = StyleSheet.create({
  suave: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
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
});
