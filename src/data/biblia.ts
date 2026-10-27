// Amostra para o protótipo. O texto bíblico completo entra depois, a partir de
// uma fonte de domínio público verificada (ver README).

export type PalavraOriginal = {
  original: string;
  translit: string;
  strong: string;
  sentido: string;
  outras: string[];
};

export type Versiculo = {
  ref: string;
  texto: string;
  // Palavra em português (minúscula, sem pontuação) -> dado do original
  palavras?: Record<string, PalavraOriginal>;
};

export type Passagem = {
  id: string;
  titulo: string;
  versiculos: Versiculo[];
  referencias: string[];
};

export const passagens: Passagem[] = [
  {
    id: 'jo3',
    titulo: 'João 3:16-17',
    versiculos: [
      {
        ref: 'João 3:16',
        texto:
          'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
        palavras: {
          amou: { original: 'ἠγάπησεν', translit: 'agapaō', strong: 'G25', sentido: 'amar', outras: ['João 13:34', 'Efésios 5:25', '1 João 4:10'] },
          mundo: { original: 'κόσμον', translit: 'kosmos', strong: 'G2889', sentido: 'mundo, humanidade', outras: ['João 1:10', 'João 17:15'] },
          deu: { original: 'ἔδωκεν', translit: 'didōmi', strong: 'G1325', sentido: 'dar, entregar', outras: ['Gálatas 1:4'] },
          unigênito: { original: 'μονογενῆ', translit: 'monogenēs', strong: 'G3439', sentido: 'único, unigênito', outras: ['João 1:14', '1 João 4:9'] },
          crê: { original: 'πιστεύων', translit: 'pisteuō', strong: 'G4100', sentido: 'crer, confiar', outras: ['João 20:31', 'Romanos 10:9'] },
          pereça: { original: 'ἀπόληται', translit: 'apollymi', strong: 'G622', sentido: 'perecer, perder-se', outras: ['Lucas 19:10'] },
          vida: { original: 'ζωὴν', translit: 'zōē', strong: 'G2222', sentido: 'vida', outras: ['João 10:10', 'João 14:6'] },
          eterna: { original: 'αἰώνιον', translit: 'aiōnios', strong: 'G166', sentido: 'eterno', outras: ['João 17:3'] },
        },
      },
      {
        ref: 'João 3:17',
        texto:
          'Porque Deus enviou o seu Filho ao mundo não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.',
      },
    ],
    referencias: ['Romanos 5:8', '1 João 4:9-10', 'João 1:14', 'Efésios 2:8'],
  },
  {
    id: 'rm5',
    titulo: 'Romanos 5:8',
    versiculos: [
      {
        ref: 'Romanos 5:8',
        texto: 'Mas Deus prova o seu amor para conosco em que Cristo morreu por nós, sendo nós ainda pecadores.',
      },
    ],
    referencias: ['João 3:16', '1 João 4:10'],
  },
];

export function normalizarPalavra(p: string) {
  return p.toLowerCase().replace(/[.,;:!?"“”()]/g, '');
}
