# App de Pregação

App de celular (Android e iPhone) para montar pregações, com estudo bíblico como apoio. Inspirado nas ideias do Logos Bible Software.

## O que o protótipo faz

- **Sermões:** cria um sermão a partir de um modelo (expositivo, temático ou textual), com blocos que podem ser editados, reordenados e apagados. Mostra o tempo estimado.
- **Bíblia:** Bíblia completa em português (Bíblia Livre), com o hebraico do Antigo Testamento e o grego do Novo Testamento por baixo de cada versículo. Toque numa palavra do original para ver o lema, a transliteração, o número de Strong, a análise morfológica em português e a definição de Strong. Versículo e palavra podem ser inseridos no sermão.
- **Exportar PDF:** o sermão vira um PDF formatado para imprimir ou compartilhar.
- **Pregar:** modo púlpito com tela escura, letra grande, cronômetro e uma parte do sermão por vez. Ao encerrar, o sermão vai para o arquivo com data e local.
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
