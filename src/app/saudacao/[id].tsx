import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CampoCrescente } from '../../components/CampoCrescente';
import { TextoFormatado } from '../../components/TextoFormatado';
import { Botao, Cartao, Rotulo } from '../../components/ui';
import {
  MARCA_TEXTO,
  nomesBloco,
  saudacoes,
  type BlocoInicial,
  type BlocosSaudacao,
  type TipoBloco,
} from '../../data/modelos';
import { estiloBloco } from '../../estilo';
import { guardarSaudacao, lerSaudacao, restaurarSaudacao } from '../../store/saudacoes';
import { cores, larguraConteudo } from '../../theme';

// Tipos de bloco que a saudação usa, para inserir mais
const tiposSaudacao: TipoBloco[] = ['frase', 'pontos', 'efeito', 'versiculo', 'pergunta', 'aplicacao', 'palavra'];

type Parte = keyof BlocosSaudacao;
const nomesPartes: Record<Parte, string> = {
  antes: 'Saudação, qual texto e agradecimentos',
  depois: 'Depois da leitura do texto',
};

// Página para editar uma das saudações salvas: o que for salvo aqui entra em todo sermão novo com ela
export default function EditarSaudacaoTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saudacao = saudacoes.find((s) => s.id === id);
  const [blocos, setBlocos] = useState<BlocosSaudacao | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (id) lerSaudacao(id).then((b) => setBlocos(b ?? { antes: [], depois: [] }));
  }, [id]);

  if (!saudacao || !blocos) return null;

  const mudar = (parte: Parte, f: (lista: BlocoInicial[]) => BlocoInicial[]) => {
    setAviso('');
    setBlocos((b) => (b ? { ...b, [parte]: f(b[parte]) } : b));
  };
  const mover = (parte: Parte, i: number, direcao: -1 | 1) =>
    mudar(parte, (lista) => {
      const alvo = i + direcao;
      if (alvo < 0 || alvo >= lista.length) return lista;
      const nova = [...lista];
      [nova[i], nova[alvo]] = [nova[alvo], nova[i]];
      return nova;
    });

  const salvar = async () => {
    await guardarSaudacao(saudacao.id, blocos);
    setAviso('Saudação salva. Ela já vale para os próximos sermões.');
  };
  const restaurar = async () => {
    await restaurarSaudacao(saudacao.id);
    setBlocos((await lerSaudacao(saudacao.id)) ?? { antes: [], depois: [] });
    setAviso('Voltou para a saudação original.');
  };

  return (
    <>
      <Stack.Screen options={{ title: saudacao.nome }} />
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={estilos.suave}>
          Escreva {MARCA_TEXTO} onde entra o texto do sermão. Palavras entre *asteriscos* ou em MAIÚSCULAS ficam em
          destaque. Cores na linha: [fundo verde]...[/], [fundo amarelo], [fundo laranja], [vermelho], [verde], [azul],
          [roxo], [preto].
        </Text>
        {(Object.keys(nomesPartes) as Parte[]).map((parte) => (
          <Cartao key={parte} style={{ gap: 12 }}>
            <Rotulo>{nomesPartes[parte]}</Rotulo>
            {blocos[parte].map((b, i) => (
              <View key={`${parte}-${i}`} style={estilos.bloco}>
                <View style={estilos.cabecalho}>
                  <Text style={estilos.tipo}>{b.rotulo || nomesBloco[b.tipo]}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Acao rotulo="Subir bloco" simbolo="↑" onPress={() => mover(parte, i, -1)} />
                    <Acao rotulo="Descer bloco" simbolo="↓" onPress={() => mover(parte, i, 1)} />
                    <Acao
                      rotulo="Apagar bloco"
                      simbolo="×"
                      onPress={() => mudar(parte, (lista) => lista.filter((_, k) => k !== i))}
                    />
                  </View>
                </View>
                <CampoCrescente
                  accessibilityLabel={`${nomesBloco[b.tipo]} ${i + 1}`}
                  value={b.texto ?? ''}
                  onChangeText={(texto) =>
                    mudar(parte, (lista) => lista.map((x, k) => (k === i ? { ...x, texto } : x)))
                  }
                  multiline
                  alturaMinima={40}
                  style={estilos.entrada}
                />
                {b.texto?.trim() ? (
                  <View style={estilos.previa}>
                    <TextoFormatado tipo={b.tipo} texto={b.texto} tamanho={15} semMoldura />
                  </View>
                ) : null}
              </View>
            ))}
            <View style={estilos.linha}>
              {tiposSaudacao.map((tipo) => (
                <Pressable
                  key={tipo}
                  accessibilityRole="button"
                  accessibilityLabel={`Adicionar ${nomesBloco[tipo]} em ${nomesPartes[parte]}`}
                  onPress={() => mudar(parte, (lista) => [...lista, { tipo, texto: '' }])}
                  style={estilos.chip}
                >
                  <Text style={[estilos.textoChip, { color: estiloBloco[tipo].cor }]}>+ {nomesBloco[tipo]}</Text>
                </Pressable>
              ))}
            </View>
          </Cartao>
        ))}
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        <Botao titulo="Salvar saudação" onPress={salvar} />
        <Botao titulo="Voltar para a original" variante="contorno" onPress={restaurar} />
        <Botao titulo="Pronto" variante="contorno" onPress={() => router.back()} />
      </ScrollView>
    </>
  );
}

function Acao({ rotulo, simbolo, onPress }: { rotulo: string; simbolo: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} onPress={onPress} style={estilos.acao}>
      <Text style={{ fontSize: 18, color: cores.textoSuave }}>{simbolo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 20, gap: 12, paddingBottom: 48, ...larguraConteudo },
  suave: { fontSize: 13, lineHeight: 19, color: cores.textoSuave },
  bloco: { gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: cores.borda },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipo: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, color: '#9AA0A6', textTransform: 'uppercase' },
  entrada: {
    fontSize: 15,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 10,
    outlineWidth: 0,
  },
  previa: { paddingHorizontal: 4 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    justifyContent: 'center',
  },
  textoChip: { fontSize: 14, fontWeight: '600' },
  acao: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center' },
  aviso: { fontSize: 14, fontWeight: '600', color: cores.texto },
});
