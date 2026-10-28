import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { BarraAbas, type EtapaEstudar } from '../../components/BarraAbas';
import { cores } from '../../theme';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

// Ícone cheio na aba atual e contornado nas outras
const icone = (cheio: NomeIcone, contorno: NomeIcone) =>
  function IconeAba({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? cheio : contorno} size={24} color={String(color)} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      // Barra própria, com as 6 etapas do Estudar entre a Bíblia e o Sermão
      tabBar={({ state }) => {
        const rota = state.routes[state.index];
        const caminhos = { biblia: '/biblia', estudo: '/estudo', index: '/', pregar: '/pregar' } as const;
        return (
          <BarraAbas
            atual={caminhos[rota.name as keyof typeof caminhos]}
            etapa={(rota.params as { etapa?: EtapaEstudar } | undefined)?.etapa}
          />
        );
      }}
      screenOptions={{
        // A aba atual fica em preto e as outras em cinza claro, sem fundo
        tabBarActiveTintColor: cores.destaque,
        tabBarInactiveTintColor: '#A3A3A3',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: { height: 64, backgroundColor: cores.cartao, borderTopColor: cores.borda },
        headerStyle: { backgroundColor: cores.cartao },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 20, fontWeight: '700' },
        headerTitleAlign: 'left',
        headerTintColor: cores.texto,
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen name="biblia" options={{ title: 'Bíblia', tabBarIcon: icone('book', 'book-outline') }} />
      <Tabs.Screen
        name="estudo"
        options={{ title: 'Estudar', headerShown: false, tabBarIcon: icone('school', 'school-outline') }}
      />
      <Tabs.Screen name="index" options={{ title: 'Sermão', tabBarIcon: icone('create', 'create-outline') }} />
      <Tabs.Screen name="pregar" options={{ title: 'Pregar', tabBarIcon: icone('mic', 'mic-outline') }} />
    </Tabs>
  );
}
