# App de Pregação

App de celular (Android e iPhone) para montar pregações, com estudo bíblico como apoio. Inspirado nas ideias do Logos Bible Software.

## O que o protótipo faz

- **Novo sermão:** tela de criação baseada no modelo de pregação do Jildean. Pede culto e data, texto referência, tipo de sermão (temático, textual, expositivo ou lectio continua), objetivo (Exibir, Mostrar, Advertir, Explicar), opção de introdução (citações, análise de hoje ou tema) e gênero literário (sugerido pelo livro). O sermão já nasce com a saudação, o objetivo, a introdução, três tópicos (texto, explicação, versículo de apoio, exemplo bíblico, aplicação) e a conclusão (frase de efeito, aplicação, chamado e convite, reflexão).
- **Sermões:** blocos que podem ser editados, reordenados e apagados, com o tempo estimado.
- **Telas do app:** abas Bíblia (leitura em português), Estudo (Bíblia com hebraico e grego palavra por palavra, mais Observação, Interpretação e Aplicação do sermão escolhido), Sermão e Pregar. A Biblioteca abre pelo Estudo (Interpretação, chave Consulta).
- **Palavra por palavra:** na aba Estudo, toque numa palavra em português para ver a palavra original (grego, hebraico ou aramaico) com lema, transliteração, Strong, morfologia, como a Bíblia Livre a traduz e versículos onde ela aparece (toque para ir até eles). A ligação português-original é estatística (IBM Model 1 na Bíblia inteira, `scripts/gerar-alinhamento.mjs`, saída em `src/data/alinhamento`) e pode errar em palavras pequenas.
- **Etapas do sermão:** todo sermão segue o mesmo caminho em quatro telas: 1. Bíblia (escolha livro e capítulo e toque no versículo; um segundo toque escolhe um trecho; depois a perícope inteira aparece com o texto escolhido em vermelho, com dicas de leitura), 2. Estudo (gênero literário definido pelo livro e, numa tela só, Observação com o contexto do livro já respondido, Interpretação com as cinco chaves e o sentido figurado, e Aplicação, cada pergunta com sua resposta), 3. Sermão (montagem) e 4. Pregar. Cada parte do estudo tem um espaço para anotações, que aparecem no topo da montagem ("Seu estudo"). O sermão reabre na etapa em que parou.
- **Bíblia:** Bíblia completa em português (Bíblia Livre), com o hebraico do Antigo Testamento e o grego do Novo Testamento por baixo de cada versículo. Toque numa palavra do original para ver o lema, a transliteração, o número de Strong, a análise morfológica em português e a definição de Strong. Versículo e palavra podem ser inseridos no sermão.
- **Formato das pregações:** cada tipo de bloco tem o seu visual. Tópico em preto com fundo verde, frase em azul com ➔, pontos em lista, texto bíblico em vermelho escuro e itálico, frase de efeito centralizada em verde escuro, pergunta em azul claro com ➔, aplicação em roxo e itálico, citação em laranja escuro e itálico. O bloco "Corpo" junta, numa caixa (no púlpito aparece sem a caixa), o subtópico na linha de cima e três pontos embaixo (dá para acrescentar mais pontos). O bloco "Pergunta" tem o mesmo formato, com a pergunta e os pontos em azul claro e itálico. Nos blocos com seta (frase, pergunta, subtópico), as linhas de baixo começam embaixo da primeira letra, depois da seta. Palavras em MAIÚSCULAS (ou entre `*asteriscos*`) aparecem em negrito sublinhado, na cor do bloco; o resto do texto fica sem negrito (há um botão para destacar a seleção). Nos pontos do Corpo, na lista de pontos e no texto bíblico, se nada for marcado à mão, todas as palavras (menos conectivos como "a", "de", "o") ficam destacadas. O texto bíblico mostra o livro e o capítulo em cima e o versículo com o texto embaixo. O mesmo visual vale para o editor, o modo púlpito e o PDF.
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
- **Perícopes:** onde cada perícope começa vem dos títulos de seção da Berean Standard Bible (BSB, domínio público), em `src/data/pericopes.json`, gerado por `scripts/gerar-pericopes.mjs` a partir do USFM da BSB no [eBible.org](https://ebible.org/find/details.php?id=engbsb). Só os limites são usados; o texto mostrado é sempre o da Bíblia Livre.

- **Novo Testamento grego:** texto bizantino de Robinson-Pierpont (2018), domínio público. [byztxt/byzantine-majority-text](https://github.com/byztxt/byzantine-majority-text)
- **Antigo Testamento hebraico:** Open Scriptures Hebrew Bible, baseada no Códice de Leningrado de Westminster (domínio público), com lemas e morfologia sob licença CC BY 4.0. [openscriptures/morphhb](https://github.com/openscriptures/morphhb)
- **Dicionários grego e hebraico de Strong:** versão JSON da Open Scriptures, licença CC BY-SA. [openscriptures/strongs](https://github.com/openscriptures/strongs)

Os arquivos em `src/data/portugues/`, `src/data/grego/` e `src/data/hebraico/` são gerados pelos scripts em `scripts/` (as instruções estão no topo de cada um). Cada livro é carregado só quando é aberto.
