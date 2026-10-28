import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

// Caixa de texto que cresce com o conteúdo, para a resposta aparecer inteira sem rolar dentro da caixa
export function CampoCrescente({ style, alturaMinima = 44, ...props }: TextInputProps & { alturaMinima?: number }) {
  const [altura, setAltura] = useState(alturaMinima);
  return (
    <TextInput
      {...props}
      multiline
      scrollEnabled={false}
      onContentSizeChange={(e) => {
        const nova = Math.max(alturaMinima, Math.ceil(e.nativeEvent.contentSize.height));
        // Ignora diferenças de poucos pixels (borda), que fariam a altura mudar sem parar
        setAltura((atual) => (Math.abs(atual - nova) < 4 ? atual : nova));
      }}
      style={[style, { height: altura }]}
    />
  );
}
