type LojaPesquisavel = { nome: string; slug: string; dominioPrincipal: string | null };

/**
 * O cadastro guarda a pasta do pacote, não um arquivo específico. O ladrilho
 * da Apple é a versão quadrada da marca e continua legível no cartão pequeno.
 */
export function iconeDaLoja(faviconUrl: string | null): string | null {
  if (!faviconUrl?.startsWith("/")) return null;
  return `${faviconUrl.replace(/\/+$/, "")}/apple-touch-icon.png`;
}

export function inicialDaLoja(nome: string): string {
  return Array.from(nome.trim())[0]?.toLocaleUpperCase("pt-BR") ?? "?";
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function filtrarLojas<T extends LojaPesquisavel>(lojas: readonly T[], busca: string, base = ""): T[] {
  const termo = normalizar(busca);
  return lojas.filter((loja) => [loja.nome, loja.slug, loja.dominioPrincipal ?? (base ? `${loja.slug}.${base}` : "")]
    .some((valor) => normalizar(valor).includes(termo)));
}
