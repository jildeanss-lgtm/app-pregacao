# App de Pregação

App de celular (Android e iPhone) para montar pregações, com estudo bíblico como apoio. Inspirado nas ideias do Logos Bible Software.

## O que o protótipo faz

- **Novo sermão:** tela de criação baseada no modelo de pregação do Jildean. Pede culto e data, texto referência, tipo de sermão (temático, textual, expositivo ou lectio continua), objetivo (Exibir, Mostrar, Advertir, Explicar), opção de introdução (citações, análise de hoje ou tema) e gênero literário (sugerido pelo livro). O sermão já nasce com a saudação, o objetivo, a introdução, três tópicos (texto, explicação, versículo de apoio, exemplo bíblico, aplicação) e a conclusão (frase de efeito, aplicação, chamado e convite, reflexão).
- **Sermões:** blocos que podem ser editados, reordenados e apagados, com o tempo estimado.
- **Roteiro de estudo:** método indutivo (observação, interpretação, aplicação), com perguntas próprias de cada gênero literário, as seis pistas do texto, as cinco chaves da interpretação, os princípios do sentido figurado e um espaço para anotações.
- **Bíblia:** Bíblia completa em português (Bíblia Livre), com o hebraico do Antigo Testamento e o grego do Novo Testamento por baixo de cada versículo. Toque numa palavra do original para ver o lema, a transliteração, o número de Strong, a análise morfológica em português e a definição de Strong. Versículo e palavra podem ser inseridos no sermão.
- **Formato das pregações:** cada tipo de bloco tem o seu visual. Tópico em preto com fundo verde, frase em azul com ➔, pontos em lista, texto bíblico em vermelho escuro e itálico, frase de efeito centralizada em verde escuro, pergunta em azul claro com ➔, aplicação em roxo e itálico, citação em laranja escuro e itálico. O bloco "Corpo" junta, numa caixa (no púlpito aparece sem a caixa), o subtópico na linha de cima e três pontos embaixo (dá para acrescentar mais pontos). O "Quadro de perguntas" é igual, com as perguntas em azul claro. Palavras em MAIÚSCULAS (ou entre `*asteriscos*`) aparecem em negrito sublinhado, na cor do bloco; o resto do texto fica sem negrito (há um botão para destacar a seleção). Nos pontos do Corpo, na lista de pontos e no texto bíblico, se nada for marcado à mão, todas as palavras (menos conectivos como "a", "de", "o") ficam destacadas. O texto bíblico mostra o livro e o capítulo em cima e o versículo com o texto embaixo. O mesmo visual vale para o editor, o modo púlpito e o PDF.
- **Exportar PDF:** o sermão vira um PDF formatado para imprimir ou compartilhar.
- **Pregar:** modo púlpito com letra grande, nas mesmas cores do esboço, cronômetro e uma parte do sermão por vez. Ao encerrar, o sermão vai para o arquivo com data e local.
- **Biblioteca:** sermões já pregados e as pastas da biblioteca no Google Drive (conexão ainda não implementada).

Tudo fica salvo no próprio aparelho e funciona offline.

## Como rodar

```bash
npm install
npx expo start
```

Abra no celular com o app Expo Go (lendo o QR code) ou aperte `w` para abrir no navegador.

## Versão web

A cada mudança na branch `main`, o GitHub Actions publica a versão web em https://jildeanss-lgtm.github.io/app-pregacao/ (é preciso ativar uma vez em Settings > Pages > Source: GitHub Actions). Os sermões ficam salvos no navegador de cada computador.

## Próximos passos

- NVT, após obter a licença com a editora.
- Definições do léxico em português (hoje estão em inglês, como no original de Strong).
- Grego de João 7:53 a 8:11, que no texto bizantino vem num arquivo separado (o português já aparece).
- Conexão com o Google Drive para buscar nos livros da biblioteca pessoal. Os livros nunca são copiados para dentro do app.

As referências cruzadas em `src/data/biblia.ts` ainda são só uma amostra.

## Fontes e licenças dos dados

- **Português:** Bíblia Livre (BLIVRE), Copyright © Diego Santos, Mario Sérgio e Marco Teles, fevereiro de 2018. Licença Creative Commons Atribuição 4.0 Brasil. Gerado por `scripts/gerar-portugues.mjs` a partir do arquivo do [eBible.org](https://ebible.org/find/details.php?id=porbr2018).

- **Novo Testamento grego:** texto bizantino de Robinson-Pierpont (2018), domínio público. [byztxt/byzantine-majority-text](https://github.com/byztxt/byzantine-majority-text)
- **Antigo Testamento hebraico:** Open Scriptures Hebrew Bible, baseada no Códice de Leningrado de Westminster (domínio público), com lemas e morfologia sob licença CC BY 4.0. [openscriptures/morphhb](https://github.com/openscriptures/morphhb)
- **Dicionários grego e hebraico de Strong:** versão JSON da Open Scriptures, licença CC BY-SA. [openscriptures/strongs](https://github.com/openscriptures/strongs)

Os arquivos em `src/data/portugues/`, `src/data/grego/` e `src/data/hebraico/` são gerados pelos scripts em `scripts/` (as instruções estão no topo de cada um). Cada livro é carregado só quando é aberto.
