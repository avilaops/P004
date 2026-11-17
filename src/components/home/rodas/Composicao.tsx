import type { BannerRodas, LojaRodas, ProdutoRodas } from "@/lib/rodas-modelo";
import LinkLoja from "@/components/LinkLoja";
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
    {!street && !night && <FaixaMarcasRodas marcas={marcas} />}{night && <LinkLoja className="rw-bottom-banner" href="/produtos"><span>RODAS &amp; PNEUS <strong>SEU PRÓXIMO CONJUNTO</strong></span></LinkLoja>}
    {carbon && <div className="rw-editorial"><section><h2>Atendimento</h2><p>Conte com a equipe para conferir medidas e aplicação.</p><LinkLoja href="/contato">Fale com a loja</LinkLoja></section><section><h2>Informações úteis</h2>{loja.politicas.filter(p => p.tipo === "envio" || p.tipo === "devolucao").map(p => <LinkLoja key={p.tipo} href={`/politicas/${p.tipo}`}>{p.titulo}</LinkLoja>)}<LinkLoja href="/produtos">Explore o catálogo</LinkLoja></section><section><h2>Nossa loja</h2><p>{sobre?.split(/\n{2,}/)[0] || loja.nome}</p><LinkLoja href="/sobre">Conheça a loja</LinkLoja></section></div>}
  </div>;
}
