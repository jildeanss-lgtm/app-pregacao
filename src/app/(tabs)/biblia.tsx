import { useLocalSearchParams } from 'expo-router';
import { LeitorBiblia } from '../../components/LeitorBiblia';

// Aba Bíblia: leitura simples em português
export default function BibliaTela() {
  const { sermao } = useLocalSearchParams<{ sermao?: string }>();
  return <LeitorBiblia comOriginal={false} sermaoId={sermao} />;
}
