import { router } from 'expo-router';
import { ListaSermoes } from '../../components/ListaSermoes';

// Aba Sermão: montar os sermões
export default function SermoesTela() {
  return (
    <ListaSermoes
      vazio="Nenhum sermão ainda. Toque em + Novo sermão para começar."
      aoAbrir={(s) => router.push(`/sermao/${s.id}`)}
      comNuvem
    />
  );
}
