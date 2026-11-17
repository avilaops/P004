import type { BannerRodas, LojaRodas, ProdutoRodas } from "@/lib/rodas-modelo";
import { CategoriasVisuaisRodas, FaixaMarcasRodas, HeroRodas, LateralRodas, VitrineRodas } from "./Elementos";

export interface ComposicaoRodasProps {
  loja: LojaRodas; produtos: ProdutoRodas[]; banners: BannerRodas[];
  marcas: string[]; titulo?: string; texto?: string; sobre: string | null;
}

/** Mesmos componentes no storefront, no painel e nas capturas de comparação. */
export default function ComposicaoRodas({ loja, produtos, banners, marcas, titulo, texto, sobre }: ComposicaoRodasProps) {
  const carbon = loja.layout === "rodas-carbon";
  const night = loja.layout === "rodas-night";
  const street = loja.layout === "rodas-street";
  const ofertas = produtos.filter(p => p.oferta);
  const comuns = produtos.filter(p => !p.oferta);
  const destaques = (carbon || night ? produtos : comuns.length ? comuns : produtos).slice(0, carbon ? 9 : night ? 8 : street ? 5 : 4);
  return <div className="rw-wrap rw-home" data-rodas={loja.layout}><HeroRodas loja={loja} banners={banners} titulo={titulo} texto={texto} />
    {street && <FaixaMarcasRodas marcas={marcas} />}{night && <CategoriasVisuaisRodas categorias={loja.categorias} politica={loja.categoriaSemImagem} />}
    <div className={carbon ? "rw-catalog-layout" : "rw-main"}>{carbon && <LateralRodas loja={loja} produtos={destaques} />}<div className="rw-catalog-main"><VitrineRodas titulo="Produtos em destaque" produtos={destaques} soVer={street} />{!night && !carbon && ofertas.length > 0 && <VitrineRodas titulo="Ofertas especiais" produtos={ofertas.slice(0, street ? 5 : 4)} soVer={street} />}</div></div>
    {!street && !night && <FaixaMarcasRodas marcas={marcas} />}{night && <a className="rw-bottom-banner" href="/produtos"><span>RODAS &amp; PNEUS <strong>SEU PRÓXIMO CONJUNTO</strong></span></a>}
    {carbon && <div className="rw-editorial"><section><h2>Atendimento</h2><p>Conte com a equipe para conferir medidas e aplicação.</p><a href="/contato">Fale com a loja</a></section><section><h2>Informações úteis</h2><a href="/politicas/envio">Entrega e envio</a><a href="/politicas/devolucao">Trocas e devoluções</a><a href="/produtos">Explore o catálogo</a></section><section><h2>Nossa loja</h2><p>{sobre?.split(/\n{2,}/)[0] || loja.nome}</p><a href="/sobre">Conheça a loja</a></section></div>}
  </div>;
}
