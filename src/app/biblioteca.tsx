import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BarraAbas } from '../components/BarraAbas';
import { CampoCrescente } from '../components/CampoCrescente';
import { Botao, Cartao, Rotulo } from '../components/ui';
import { useSermoes } from '../store/sermoes';
import { cores } from '../theme';

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

export default function BibliotecaTela() {
  const { sermoes, estudo, mudarEstudo } = useSermoes();
  const [tema, setTema] = useState(estudo.textoBase);
  const [pergunta, setPergunta] = useState('');
  const [copiado, setCopiado] = useState(false);
  const pregados = sermoes.filter((s) => s.pregacoes.length > 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
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
            onChangeText={(t) => mudarEstudo((e) => ({ ...e, notasBiblioteca: t }))}
            placeholder="Cole aqui a resposta do Claude"
            placeholderTextColor={cores.textoSuave}
            alturaMinima={120}
            style={estilos.campo}
          />
        </Cartao>
        <Rotulo>Sermões pregados</Rotulo>
        {pregados.length === 0 ? (
          <Text style={estilos.suave}>Os sermões aparecem aqui depois de pregados no modo púlpito.</Text>
        ) : (
          pregados.map((s) => (
            <Pressable key={s.id} accessibilityRole="button" onPress={() => router.push(`/sermao/${s.id}`)}>
              <Cartao>
                <Text style={estilos.titulo}>{s.titulo || 'Sermão sem título'}</Text>
                {s.pregacoes.map((p, i) => (
                  <Text key={i} style={estilos.suave}>
                    {new Date(p.data).toLocaleDateString('pt-BR')}
                    {p.local ? ` · ${p.local}` : ''}
                  </Text>
                ))}
              </Cartao>
            </Pressable>
          ))
        )}
      </ScrollView>
      <BarraAbas atual="/estudo" />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 10, paddingBottom: 48 },
  titulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
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
