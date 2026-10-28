import { router } from 'expo-router';
import { ListaSermoes, nomeDaEtapa } from '../../components/ListaSermoes';
import { ETAPA_ESTUDO, etapaAtual } from '../../data/etapas';
import { useSermoes } from '../../store/sermoes';

// Aba Estudo: abre o estudo (Observação, Interpretação e Aplicação) de cada sermão
export default function EstudoAba() {
  const { atualizar } = useSermoes();
  return (
    <ListaSermoes
      textoNovo="+ Novo estudo"
      vazio="Nenhum estudo ainda. Toque em + Novo estudo para começar pela Bíblia."
      aoAbrir={(s) => {
        if (etapaAtual(s.etapa) > ETAPA_ESTUDO) atualizar(s.id, (x) => ({ ...x, etapa: ETAPA_ESTUDO }));
        router.push(`/estudo/${s.id}`);
      }}
      extra={(s) => `Etapa: ${nomeDaEtapa(s)}`}
    />
  );
}
