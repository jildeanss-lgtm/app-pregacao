// Uma palavra do texto original: [palavra, número de Strong, código de morfologia]
export type PalavraOriginal = [palavra: string, strong: number, morfologia: string];

// Número de Strong -> [lema, transliteração, definição (inglês), tradução na KJV (inglês)]
export type Lexico = Record<string, [string, string, string, string]>;
