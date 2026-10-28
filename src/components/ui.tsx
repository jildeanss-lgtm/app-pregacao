import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { cores } from '../theme';

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'principal' | 'contorno' | 'perigo';
  style?: StyleProp<ViewStyle>;
  acessivel?: string;
};

export function Botao({ titulo, onPress, variante = 'principal', style, acessivel }: BotaoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={acessivel ?? titulo}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.botao,
        variante === 'principal' && estilos.principal,
        variante === 'contorno' && estilos.contorno,
        variante === 'perigo' && estilos.perigo,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text
        style={[
          estilos.textoBotao,
          variante === 'principal'
            ? { color: '#FFFFFF' }
            : { color: variante === 'perigo' ? '#A33A2B' : cores.destaque },
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

export function Cartao({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[estilos.cartao, style]}>{children}</View>;
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.rotulo}>{children}</Text>;
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principal: { backgroundColor: cores.destaque },
  contorno: { borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.cartao },
  perigo: { borderWidth: 1, borderColor: '#E4B4AC', backgroundColor: cores.cartao },
  textoBotao: { fontSize: 15, fontWeight: '600' },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
  },
  rotulo: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: cores.textoSuave,
    textTransform: 'uppercase',
  },
});
