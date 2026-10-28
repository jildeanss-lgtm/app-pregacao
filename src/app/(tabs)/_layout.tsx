import { Tabs } from 'expo-router/tabs';
import { cores } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.destaque,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarIconStyle: { display: 'none' },
        headerStyle: { backgroundColor: cores.fundo },
        headerTintColor: cores.texto,
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen name="biblia" options={{ title: 'Bíblia' }} />
      <Tabs.Screen name="estudo" options={{ title: 'Estudo' }} />
      <Tabs.Screen name="index" options={{ title: 'Sermões' }} />
      <Tabs.Screen name="pregar" options={{ title: 'Pregar' }} />
    </Tabs>
  );
}
