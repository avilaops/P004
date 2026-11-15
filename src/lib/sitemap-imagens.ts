import { publicavel, type ProdutoRegras } from "./produto-regras";

type ProdutoComImagem = Pick<ProdutoRegras, "ativo" | "precoCentavos" | "imagens"> & {
  slug: string;
  imagemOrigem: string | null;
};

const escaparXml = (valor: string) => valor.replace(/[&<>"']/g, caractere => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[caractere]!);

/**
 * Mapa separado das imagens realmente exibidas no catálogo, incluindo fotos
 * representativas de fabricante. Não altera a origem nem a regra de fotos
 * próprias do sitemap principal. Uma foto de série ganha um único vínculo,
 * em vez de ser anunciada centenas de vezes em SKUs da mesma família.
 */
export function sitemapDeImagens(base: string, produtos: readonly ProdutoComImagem[]): string {
  const vistas = new Set<string>();
  const entradas: string[] = [];
  for (const produto of produtos) {
    if (!publicavel(produto) || !["propria", "representativa"].includes(produto.imagemOrigem ?? "")) continue;
    const imagens: string[] = [];
    for (const imagem of produto.imagens) {
      if (!imagem.trim()) continue;
      let url: URL;
      try {
        url = new URL(imagem.trim(), `${base}/`);
      } catch {
        continue;
      }
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) continue;
      url.hash = "";
      if (vistas.has(url.href)) continue;
      vistas.add(url.href);
      imagens.push(`<image:image><image:loc>${escaparXml(url.href)}</image:loc></image:image>`);
      if (imagens.length === 1_000) break;
    }
    if (!imagens.length) continue;
    const pagina = `${base}/produtos/${encodeURIComponent(produto.slug)}`;
    entradas.push(`<url><loc>${escaparXml(pagina)}</loc>${imagens.join("")}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entradas.join("\n")}\n</urlset>\n`;
}
