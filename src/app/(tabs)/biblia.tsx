import { useLocalSearchParams } from 'expo-router';
import { BibliaComum } from '../../components/BibliaComum';

// Aba Bíblia: leitura em texto corrido e escolha do texto do estudo
export default function BibliaTela() {
  const { sermao } = useLocalSearchParams<{ sermao?: string }>();
  return <BibliaComum sermaoId={sermao} />;
}
