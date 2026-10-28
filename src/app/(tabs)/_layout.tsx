import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
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
      screenOptions={{
        // A aba atual fica na cor principal, com fundo claro, e as outras em cinza
        tabBarActiveTintColor: cores.destaque,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarActiveBackgroundColor: cores.destaqueFundo,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: { borderRadius: 12, marginHorizontal: 6, marginVertical: 6 },
        tabBarStyle: { height: 68, backgroundColor: cores.cartao, borderTopColor: cores.borda },
        headerStyle: { backgroundColor: cores.cartao },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
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
