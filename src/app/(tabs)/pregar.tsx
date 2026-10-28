import { router } from 'expo-router';
import { ListaSermoes } from '../../components/ListaSermoes';

// Aba Pregar: escolhe o sermão e abre direto no modo púlpito
export default function PregarAba() {
  return (
    <ListaSermoes
      comNovo={false}
      vazio="Nenhum sermão para pregar ainda. Monte um na aba Sermões."
      aoAbrir={(s) => router.push(`/pregar/${s.id}`)}
    />
  );
}
