import { router } from 'expo-router';
import { ListaSermoes, nomeDaEtapa } from '../../components/ListaSermoes';
import { ETAPA_MONTAGEM, etapaAtual } from '../../data/etapas';

export default function SermoesTela() {
  return (
    <ListaSermoes
      vazio="Nenhum sermão ainda. Toque em + Novo sermão para começar."
      aoAbrir={(s) => router.push(etapaAtual(s.etapa) < ETAPA_MONTAGEM ? `/estudo/${s.id}` : `/sermao/${s.id}`)}
      extra={(s) => (etapaAtual(s.etapa) < ETAPA_MONTAGEM ? `Em estudo: ${nomeDaEtapa(s)}` : undefined)}
    />
  );
}
