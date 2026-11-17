import { ArrowRight } from "lucide-react";
import Link from "@/components/LinkLoja";
import { lerTema } from "@/lib/tema";
import { emPromocao } from "@/lib/produto-regras";
import { marcaConfirmada } from "@/lib/marca-confirmada";
import BeneficiosBarra from "../BeneficiosBarra";
import type { DadosHome } from "../tipos";
import { BuscaRodas, CategoriasRodas, ProdutosRodas } from "./Blocos";

/** Quatro composições, um catálogo e as mesmas regras de compra da plataforma. */
export default function HomeRodas(dados: DadosHome) {
  const { t, identidade, vitrine, temDestaques } = dados;
  const tema = lerTema(t.tema);
  const carbon = tema.layout === "rodas-carbon";
  const night = tema.layout === "rodas-night";
  const imagem = t.bannerUrl || vitrine.find(p => p.imagens[0])?.imagens[0];
  const titulo = tema.heroTitulo?.trim() || t.slogan || t.nome;
  const texto = tema.heroTexto?.trim() || identidade.diferencial || "Explore o catálogo e confira os detalhes de cada produto antes de escolher.";
  const promocoes = vitrine.filter(emPromocao);
  const marcas = [...new Set(vitrine.map(p => marcaConfirmada(p.marca)).filter((m): m is string => Boolean(m)))].slice(0, 6);

  return (
    <div className="rd-home container-loja" data-rodas={tema.layout}>
      <section className={`rd-hero${imagem ? "" : " rd-hero-sem-foto"}`}>
        {imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagem} alt="" className="rd-hero-foto" fetchPriority="high" />
        )}
        <div className="rd-hero-conteudo">
          <p className="rd-selo">{t.nome} • Catálogo online</p>
          <h1>{titulo}</h1>
          <p className="rd-hero-texto">{texto}</p>
          <Link href="/produtos" className="rd-cta">Explorar produtos <ArrowRight size={19} aria-hidden="true" /></Link>
        </div>
      </section>

      {night && <CategoriasRodas dados={dados} />}
      {!carbon && !night && marcas.length > 0 && <aside className="rd-marcas" aria-label="Marcas no catálogo">
        {marcas.map(marca => <Link key={marca} href={`/produtos?fabricante=${encodeURIComponent(marca)}`}>{marca}</Link>)}
      </aside>}

      <div className={carbon ? "rd-com-lateral" : "rd-conteudo"}>
        {carbon && <aside className="rd-lateral">
          <CategoriasRodas dados={dados} lateral />
          <div className="rd-orientacao"><p className="rd-selo">Antes de escolher</p><h2>Confira os detalhes.</h2><p>Consulte medidas, descrição e aplicação na página de cada produto.</p><Link href="/contato">Falar com a equipe <ArrowRight size={16} aria-hidden="true" /></Link></div>
        </aside>}
        <div className="rd-principal">
          <BuscaRodas />
          <ProdutosRodas dados={dados} titulo={temDestaques ? "Produtos em destaque" : "Explore o catálogo"} compacto={carbon} />
          {promocoes.length > 0 && <ProdutosRodas dados={dados} titulo="Ofertas do catálogo" produtos={promocoes} compacto={carbon} />}
        </div>
      </div>

      {!night && !carbon && <CategoriasRodas dados={dados} />}
      <BeneficiosBarra t={t} />
      {t.sobre && <section className="rd-sobre">
        <div><p className="rd-selo">Conheça a loja</p><h2>{t.nome}</h2></div>
        <p>{t.sobre.split(/\n{2,}/)[0]}</p><Link href="/sobre">Nossa história <ArrowRight size={17} aria-hidden="true" /></Link>
      </section>}
    </div>
  );
}
