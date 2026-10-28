import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { SermoesProvider } from '../store/sermoes';
import { cores } from '../theme';

export default function RootLayout() {
  return (
    <SermoesProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: cores.texto,
          headerStyle: { backgroundColor: cores.cartao },
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: 17, fontWeight: '600' },
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="novo" options={{ title: 'Novo sermão' }} />
        <Stack.Screen name="sermao/[id]" options={{ title: 'Sermão' }} />
        <Stack.Screen name="biblioteca" options={{ title: 'Biblioteca' }} />
        <Stack.Screen name="pregar/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
    </SermoesProvider>
  );
}
