# App de Pregação

App de celular (Android e iPhone) para montar pregações, com estudo bíblico como apoio. Inspirado nas ideias do Logos Bible Software.

## O que o protótipo faz

- **Sermões:** cria um sermão a partir de um modelo (expositivo, temático ou textual), com blocos que podem ser editados, reordenados e apagados. Mostra o tempo estimado.
- **Bíblia:** Novo Testamento grego completo, livro por livro. Toque numa palavra para ver o lema, a transliteração, o número de Strong, a análise morfológica em português e a definição de Strong. Versículo e palavra podem ser inseridos no sermão. Algumas passagens já têm o texto em português (amostra).
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

## Próximos passos

- Texto bíblico completo a partir de uma fonte de domínio público verificada, e NVT após obter a licença.
- Antigo Testamento em hebraico com Strong (OpenScriptures).
- Definições do léxico em português (hoje estão em inglês, como no original de Strong).
- João 7:53 a 8:11, que no texto bizantino vem num arquivo separado.
- Conexão com o Google Drive para buscar nos livros da biblioteca pessoal. Os livros nunca são copiados para dentro do app.

O texto bíblico em `src/data/biblia.ts` é só uma amostra para o protótipo.

## Fontes e licenças dos dados

- **Novo Testamento grego:** texto bizantino de Robinson-Pierpont (2018), domínio público. [byztxt/byzantine-majority-text](https://github.com/byztxt/byzantine-majority-text)
- **Dicionário grego de Strong:** versão JSON da Open Scriptures, licença CC BY-SA. [openscriptures/strongs](https://github.com/openscriptures/strongs)

Os arquivos em `src/data/grego/` são gerados por `scripts/gerar-grego.mjs` (as instruções estão no topo do script).
