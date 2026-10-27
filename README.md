# App de Pregação

App de celular (Android e iPhone) para montar pregações, com estudo bíblico como apoio. Inspirado nas ideias do Logos Bible Software.

## O que o protótipo faz

- **Sermões:** cria um sermão a partir de um modelo (expositivo, temático ou textual), com blocos que podem ser editados, reordenados e apagados. Mostra o tempo estimado.
- **Bíblia:** leitor com amostra de passagens, toque numa palavra para ver o grego com número de Strong, referências cruzadas e botão para inserir no sermão.
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
- Léxico grego e hebraico completo (dados abertos do OpenScriptures).
- Conexão com o Google Drive para buscar nos livros da biblioteca pessoal. Os livros nunca são copiados para dentro do app.
- Exportar sermão em PDF.

O texto bíblico em `src/data/biblia.ts` é só uma amostra para o protótipo.
