import { ArrowRight, CircleDot, Search } from "lucide-react";
import Link from "@/components/LinkLoja";
import ProductCard from "@/components/ProductCard";
import { lerTema } from "@/lib/tema";
import type { DadosHome } from "../tipos";

export function BuscaRodas() {
  return (
    <form action="/produtos" method="get" role="search" aria-label="Buscar no catálogo" className="rd-busca">
      <label className="sr-only" htmlFor="rd-termo">Produto, marca ou medida</label>
      <Search size={20} aria-hidden="true" />
      <input id="rd-termo" type="search" name="q" placeholder="Produto, marca ou medida" maxLength={200} />
      <button type="submit">Buscar <ArrowRight size={17} aria-hidden="true" /></button>
    </form>
  );
}

export function CategoriasRodas({ dados, lateral = false }: { dados: DadosHome; lateral?: boolean }) {
  const tema = lerTema(dados.t.tema);
  // O menu lateral é navegação completa; os atalhos fotográficos respeitam
  // a opção da loja de ocultar categorias sem foto.
  const categorias = dados.categorias.filter(c => lateral || c.imagemUrl || tema.categoriaSemImagem === "icone").slice(0, lateral ? 12 : 3);
  if (!categorias.length) return null;
  return (
    <nav className={lateral ? "rd-categorias-lateral" : "rd-categorias"} aria-label="Explore as categorias">
      {lateral && <h2>Categorias</h2>}
      {categorias.map(c => (
        <Link key={c.id} href={`/categoria/${c.slug}`}>
          {!lateral && (c.imagemUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={c.imagemUrl} alt="" loading="lazy" />
            : <CircleDot className="rd-categoria-icone" aria-hidden="true" />)}
          <span>{c.nome}</span><ArrowRight size={18} aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}

export function ProdutosRodas({ dados, titulo, produtos = dados.vitrine, compacto = false }: {
  dados: DadosHome; titulo: string; produtos?: DadosHome["vitrine"]; compacto?: boolean;
}) {
  return (
    <section className="rd-vitrine" aria-label={titulo}>
      <header className="rd-titulo"><h2>{titulo}</h2><Link href="/produtos">Ver todos <ArrowRight size={16} aria-hidden="true" /></Link></header>
      {produtos.length ? <div className="rd-produtos">
        {produtos.slice(0, compacto ? 9 : 8).map(produto => (
          <ProductCard key={produto.id} produto={produto} loja={dados.t} vende={dados.vende} whatsapp={dados.t.whatsapp} moto={dados.moto} compacto={compacto} apresentacoes={dados.apresentacoes?.[produto.id]} />
        ))}
      </div> : <p className="rd-vazio">O catálogo está sendo preparado.</p>}
    </section>
  );
}
