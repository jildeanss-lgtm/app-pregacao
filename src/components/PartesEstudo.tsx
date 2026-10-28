import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EtapaEstudo } from '../data/etapas';
import { generos, perguntasDaEtapa, sentidoFigurado, sugerirGenero } from '../data/roteiro';
import type { DadosEstudo } from '../store/sermoes';
import { cores } from '../theme';
import { CampoCrescente } from './CampoCrescente';
import { Botao, Cartao, Rotulo } from './ui';

// Partes do estudo usadas na etapa Estudo do sermão e na aba Estudo
export const partesDoEstudo: EtapaEstudo[] = ['observacao', 'interpretacao', 'aplicacao'];

const dicasAnotacao: Record<EtapaEstudo, string> = {
  leitura: 'O que chamou sua atenção na leitura? Palavras que se repetem, frases fortes...',
  observacao: 'O que você observou: contexto, repetições, contrastes, palavras-chave...',
  interpretacao: 'O que o autor quis dizer? Significado das palavras, outros textos que confirmam...',
  aplicacao: 'Verdade central, onde ela toca a vida hoje, perguntas para a igreja...',
};

type Mudar = (mudar: (d: DadosEstudo) => DadosEstudo) => void;

// Perguntas de uma parte do estudo, cada uma com sua resposta, e as anotações da parte. Serve para o estudo
// em andamento (aba Estudo) e para o estudo guardado num sermão
export function ParteDoEstudo({
  sermao,
  mudar,
  parte,
  nome,
}: {
  sermao: DadosEstudo;
  mudar: Mudar;
  parte: EtapaEstudo;
  nome: string;
}) {
  return (
    <>
      {parte === 'observacao' && <Genero sermao={sermao} mudar={mudar} />}
      {perguntasDaEtapa(parte, sermao.textoBase, sermao.genero).map((g) => (
        <Cartao key={g.titulo} style={{ gap: 10 }}>
          <Rotulo>{g.titulo}</Rotulo>
          {g.dica ? <Text style={estilos.chave}>{g.dica}</Text> : null}
          {g.perguntas.map((q) => (
            <View key={q.pergunta} style={{ gap: 2 }}>
              <Text style={estilos.pergunta}>{q.pergunta}</Text>
              <CampoCrescente
                accessibilityLabel={q.pergunta}
                value={sermao.respostas?.[q.pergunta] ?? q.padrao ?? ''}
                onChangeText={(texto) => mudar((s) => ({ ...s, respostas: { ...s.respostas, [q.pergunta]: texto } }))}
                multiline
                placeholder="Sua resposta"
                placeholderTextColor={cores.textoSuave}
                style={estilos.resposta}
              />
            </View>
          ))}
        </Cartao>
      ))}
      {parte === 'interpretacao' && (
        <Cartao style={{ gap: 8 }}>
          <Rotulo>Literal ou figurado?</Rotulo>
          <Lista itens={sentidoFigurado} />
        </Cartao>
      )}
      <Anotacoes sermao={sermao} mudar={mudar} etapa={parte} nome={nome} />
    </>
  );
}

export function Anotacoes({
  sermao,
  mudar,
  etapa,
  nome,
}: {
  sermao: DadosEstudo;
  mudar: Mudar;
  etapa: EtapaEstudo;
  nome: string;
}) {
  const anotacao = sermao.anotacoes?.[etapa] ?? (etapa === 'observacao' ? sermao.estudo : undefined) ?? '';
  return (
    <Cartao style={{ gap: 8 }}>
      <Rotulo>Suas anotações</Rotulo>
      <CampoCrescente
        alturaMinima={120}
        accessibilityLabel={`Anotações da ${nome}`}
        value={anotacao}
        onChangeText={(texto) => mudar((s) => ({ ...s, anotacoes: { ...s.anotacoes, [etapa]: texto } }))}
        multiline
        placeholder={dicasAnotacao[etapa]}
        placeholderTextColor={cores.textoSuave}
        style={estilos.entrada}
      />
    </Cartao>
  );
}

// Gênero literário do texto, como primeira pergunta da Observação
function Genero({ sermao, mudar }: { sermao: DadosEstudo; mudar: Mudar }) {
  const sugerido = sugerirGenero(sermao.textoBase);
  const generoAtual = sermao.genero ?? sugerido;
  const genero = generos.find((g) => g.id === generoAtual);
  const [trocando, setTrocando] = useState(false);

  return (
    <Cartao style={{ gap: 8 }}>
      <Rotulo>Gênero literário</Rotulo>
      <Text style={estilos.pergunta}>Qual o gênero literário do texto?</Text>
      <Text style={estilos.genero}>{genero?.nome ?? 'Não definido'}</Text>
      {genero && generoAtual === sugerido ? <Text style={estilos.suave}>Definido pelo livro do texto.</Text> : null}
      {trocando || !genero ? (
        <View style={estilos.linha}>
          {generos.map((g) => (
            <Pilula
              key={g.id}
              texto={g.nome}
              ativa={generoAtual === g.id}
              onPress={() => {
                mudar((s) => ({ ...s, genero: g.id }));
                setTrocando(false);
              }}
            />
          ))}
        </View>
      ) : (
        <Botao
          titulo="Trocar gênero"
          variante="contorno"
          onPress={() => setTrocando(true)}
          style={{ alignSelf: 'flex-start' }}
        />
      )}
    </Cartao>
  );
}

export function Lista({ itens }: { itens: string[] }) {
  return (
    <View style={{ gap: 4 }}>
      {itens.map((t) => (
        <Text key={t} style={estilos.item}>
          • {t}
        </Text>
      ))}
    </View>
  );
}

export function Pilula({ texto, ativa, onPress }: { texto: string; ativa: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativa }}
      onPress={onPress}
      style={[estilos.pilula, ativa && estilos.pilulaAtiva]}
    >
      <Text style={[estilos.textoPilula, ativa && { color: '#FFFFFF' }]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  suave: { fontSize: 14, color: cores.textoSuave },
  item: { fontSize: 15, lineHeight: 21, color: cores.texto },
  chave: { fontSize: 14, fontStyle: 'italic', color: cores.apoioTexto },
  genero: { fontSize: 18, fontWeight: '700', color: cores.destaque },
  pergunta: { fontSize: 15, fontWeight: '600', color: cores.texto },
  resposta: {
    fontSize: 15,
    color: cores.texto,
    minHeight: 44,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: cores.borda,
    textAlignVertical: 'top',
  },
  entrada: { fontSize: 16, color: cores.texto, minHeight: 120, textAlignVertical: 'top' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
    justifyContent: 'center',
  },
  pilulaAtiva: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  textoPilula: { fontSize: 14, color: cores.texto },
});
