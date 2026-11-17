import type { TemaLoja } from "./tema";

/** Paletas de partida do editor. A seleção é rascunho até o lojista salvar. */
const PALETAS = {
  "rodas-street": { corPrimaria: "#bc101a", corPrimariaTexto: "#ffffff", modo: "claro" },
  "rodas-racing": { corPrimaria: "#f5c518", corPrimariaTexto: "#17181b", modo: "claro" },
  "rodas-carbon": { corPrimaria: "#bc1031", corPrimariaTexto: "#ffffff", modo: "claro" },
  "rodas-night": { corPrimaria: "#f5d328", corPrimariaTexto: "#17181b", modo: "escuro" },
} as const;

export function ehTemplateRodas(layout: string): layout is keyof typeof PALETAS {
  return Object.hasOwn(PALETAS, layout);
}

export function selecionarTemplateRodas(tema: TemaLoja, layout: keyof typeof PALETAS): TemaLoja {
  return mudarModoTemplateRodas({ ...tema, ...PALETAS[layout], layout }, PALETAS[layout].modo);
}

/** Valores explícitos atravessam o PATCH, que mescla o JSON com o tema salvo. */
export function mudarModoTemplateRodas(tema: TemaLoja, modo: TemaLoja["modo"]): TemaLoja {
  return {
    ...tema, modo,
    corFundo: modo === "escuro" ? tema.layout === "rodas-night" ? "#191a1d" : "#0b0b0c" : "#ffffff",
    corTexto: modo === "escuro" ? "#fafafa" : "#18181b",
  };
}
