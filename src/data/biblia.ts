// Amostra em português para o protótipo. O texto completo entra a partir de uma
// tradução de licença livre (ver README). Chave: "LIVRO.capitulo.versiculo".

export const textoPortugues: Record<string, string> = {
  'JOH.3.16':
    'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
  'JOH.3.17':
    'Porque Deus enviou o seu Filho ao mundo não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.',
  'ROM.5.8': 'Mas Deus prova o seu amor para conosco em que Cristo morreu por nós, sendo nós ainda pecadores.',
};

export const referenciasCruzadas: Record<string, string[]> = {
  'JOH.3.16': ['Romanos 5:8', '1 João 4:9-10', 'João 1:14', 'Efésios 2:8'],
  'ROM.5.8': ['João 3:16', '1 João 4:10'],
};

export const chaveVersiculo = (livro: string, cap: number, ver: number) => `${livro}.${cap}.${ver}`;
