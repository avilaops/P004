import { tenantAtual, urlDaLoja } from "@/lib/tenant";
import { visivelNaBusca } from "@/lib/descoberta";
import { listarProdutosDoSitemap } from "@/lib/sitemap-produtos";
import { sitemapDeImagens } from "@/lib/sitemap-imagens";

export const dynamic = "force-dynamic";

/** Mesmo tenant, visibilidade e catálogo público do sitemap principal. */
export async function GET() {
  const tenant = await tenantAtual();
  if (!tenant || !visivelNaBusca(tenant)) {
    return new Response("Loja não encontrada.\n", { status: 404, headers: { "cache-control": "no-store" } });
  }
  const produtos = await listarProdutosDoSitemap(tenant.id);
  return new Response(sitemapDeImagens(urlDaLoja(tenant), produtos), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
