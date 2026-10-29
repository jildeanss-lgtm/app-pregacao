import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CampoCrescente } from '../../components/CampoCrescente';
import { TextoFormatado } from '../../components/TextoFormatado';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import { opcoesIntroducao, type OpcaoIntroducao } from '../../data/modelos';
import { guardarIntroducao, lerIntroducao, restaurarIntroducao, type IntroducaoEditada } from '../../store/introducoes';
import { cores, larguraConteudo } from '../../theme';

// Página para editar uma das três opções de introdução: o que for salvo aqui entra em todo sermão novo com ela
export default function EditarIntroducaoTela() {
  const { id } = useLocalSearchParams<{ id: OpcaoIntroducao }>();
  const opcao = opcoesIntroducao.find((o) => o.id === id);
  const [intro, setIntro] = useState<IntroducaoEditada | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (id) lerIntroducao(id).then(setIntro);
  }, [id]);

  if (!opcao || !intro) return null;

  const mudar = (campo: keyof IntroducaoEditada, valor: string) => {
    setAviso('');
    setIntro((x) => (x ? { ...x, [campo]: valor } : x));
  };
  const salvar = async () => {
    await guardarIntroducao(opcao.id, intro);
    setAviso('Introdução salva. Ela já vale para os próximos sermões.');
  };
  const restaurar = async () => {
    await restaurarIntroducao(opcao.id);
    setIntro(await lerIntroducao(opcao.id));
    setAviso('Voltou para a introdução original.');
  };

  return (
    <>
      <Stack.Screen options={{ title: `Introdução: ${opcao.nome}` }} />
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Cartao style={{ gap: 8 }}>
          <Rotulo>Descrição</Rotulo>
          <Text style={estilos.suave}>Aparece na lista de introduções e como dica na caixa vazia.</Text>
          <CampoCrescente
            accessibilityLabel="Descrição da introdução"
            value={intro.dica}
            onChangeText={(t) => mudar('dica', t)}
            multiline
            alturaMinima={60}
            style={estilos.entrada}
          />
        </Cartao>
        <Cartao style={{ gap: 8 }}>
          <Rotulo>Texto que já entra na introdução</Rotulo>
          <Text style={estilos.suave}>Opcional. Palavras entre *asteriscos* ou em MAIÚSCULAS ficam em destaque.</Text>
          <CampoCrescente
            accessibilityLabel="Texto da introdução"
            value={intro.texto}
            onChangeText={(t) => mudar('texto', t)}
            multiline
            alturaMinima={100}
            placeholder={intro.dica}
            placeholderTextColor={cores.textoSuave}
            style={estilos.entrada}
          />
          {intro.texto.trim() ? (
            <View style={{ paddingHorizontal: 4 }}>
              <TextoFormatado tipo="introducao" texto={intro.texto} tamanho={15} semMoldura />
            </View>
          ) : null}
        </Cartao>
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        <Botao titulo="Salvar introdução" onPress={salvar} />
        <Botao titulo="Voltar para a original" variante="contorno" onPress={restaurar} />
        <Botao titulo="Pronto" variante="contorno" onPress={() => router.back()} />
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, ...larguraConteudo },
  suave: { fontSize: 13, lineHeight: 19, color: cores.textoSuave },
  entrada: {
    fontSize: 15,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 10,
    outlineWidth: 0,
  },
  aviso: { fontSize: 14, fontWeight: '600', color: cores.texto },
});
