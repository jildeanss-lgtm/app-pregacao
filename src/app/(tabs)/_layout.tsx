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
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: cores.textoSuave,
        // A aba atual fica num bloco colorido, para ver de longe onde se está
        tabBarActiveBackgroundColor: cores.destaque,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: { borderRadius: 14, marginHorizontal: 4, marginVertical: 4 },
        tabBarStyle: { height: 72, paddingTop: 2, paddingBottom: 2, borderTopColor: cores.borda },
        headerStyle: { backgroundColor: cores.fundo },
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
