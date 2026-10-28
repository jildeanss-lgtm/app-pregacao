import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Cartao, Rotulo } from '../components/ui';
import { useSermoes } from '../store/sermoes';
import { cores, larguraConteudo } from '../theme';

// Pastas da biblioteca pessoal no Google Drive. A leitura e a busca nos livros
// entram quando a conexão com o Google for implementada; os livros nunca são
// copiados para dentro do app.
const pastasDrive = ['01 Bíblia e Estudo Bíblico', '02 Teologia Sistemática', 'Enciclopédia Temática Shedd'];

export default function BibliotecaTela() {
  const { sermoes } = useSermoes();
  const pregados = sermoes.filter((s) => s.pregacoes.length > 0);

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
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

      <Rotulo>Google Drive · 2 - Biblioteca</Rotulo>
      {pastasDrive.map((nome) => (
        <Cartao key={nome}>
          <Text style={estilos.titulo}>{nome}</Text>
          <Text style={estilos.suave}>Conexão com o Drive em breve</Text>
        </Cartao>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 10, paddingBottom: 48, ...larguraConteudo },
  titulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  suave: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
});
