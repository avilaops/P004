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
  return { ...tema, ...PALETAS[layout], layout, corFundo: undefined, corTexto: undefined };
}
