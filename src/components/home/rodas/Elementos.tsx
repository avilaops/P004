"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CircleDot, Search, ShoppingCart, Phone, Mail, MapPin, Check } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { adicionarAoCarrinho } from "@/lib/eventos-loja";
import FotoDoCartao from "@/components/FotoDoCartao";
import type { BannerRodas, CategoriaRodas, LojaRodas, ProdutoRodas } from "@/lib/rodas-modelo";

const dinheiro = (valor: number) => (valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function BuscaRodas({ id = "rodas-busca" }: { id?: string }) {
  return <form className="rw-search" action="/produtos" method="get" role="search"><label className="rw-sr" htmlFor={id}>Buscar produtos</label><input id={id} type="search" name="q" placeholder="Buscar na loja..." maxLength={200} /><button type="submit" aria-label="Buscar"><Search size={15} aria-hidden="true" /></button></form>;
}

export function CabecalhoRodas({ loja }: { loja: LojaRodas }) {
  const carrinho = useCart();
  return <header className="rw-header">
    {loja.aviso && <p className="rw-announcement">{loja.aviso}</p>}
    <div className="rw-top"><div className="rw-wrap"><nav aria-label="Links da loja"><a href="/">Início</a><a href="/produtos">Produtos</a>{loja.politicas.some(p => p.tipo === "envio") && <a href="/politicas/envio">Entrega</a>}<a href="/contato">Contato</a></nav><span>Loja online • Brasil</span></div></div>
    <div className="rw-wrap rw-header-main"><a className="rw-logo" href="/" aria-label={loja.nome}>{loja.logo ? <img src={loja.logo} alt={loja.nome} /> : <span className="rw-wordmark"><strong>{loja.nome}</strong><small>RODAS &amp; PNEUS</small></span>}</a>
      <div className="rw-header-right"><div className="rw-account"><span>Bem-vindo à nossa loja</span>{loja.vende && <a href="/conta">Minha conta</a>}{(loja.vende || loja.whatsapp) && <a className="rw-cart" href="/carrinho"><ShoppingCart size={16} aria-hidden="true" /> Carrinho ({carrinho.quantidade})</a>}</div><div className="rw-header-search">{loja.telefone && <a className="rw-header-phone" href={loja.telefoneUri ?? undefined}><Phone size={17} aria-hidden="true" />{loja.telefone}</a>}<BuscaRodas /></div></div>
    </div>
    <nav className="rw-wrap rw-nav" aria-label="Categorias de produtos"><a href="/produtos">Todos os produtos</a>{loja.categorias.slice(0, 6).map(c => <a key={c.slug} href={`/categoria/${c.slug}`}>{c.nome}</a>)}</nav>
  </header>;
}

export function HeroRodas({ loja, banners, titulo, texto }: { loja: LojaRodas; banners: BannerRodas[]; titulo?: string; texto?: string }) {
  const [atual, definir] = useState(0);
  const banner = banners[atual] ?? banners[0];
  if (!banner) return null;
  const escuro = loja.layout === "rodas-night" || loja.layout === "rodas-carbon";
  return <section className={`rw-hero${escuro ? " rw-hero-dark" : ""}`} aria-label="Coleções da loja"><a href={banner.link} className="rw-hero-link"><img src={banner.imagem} alt={banner.alt} fetchPriority="high" /><div className="rw-hero-copy">
      {loja.layout === "rodas-street" ? <><span className="rw-hero-signature">{loja.nome}</span><h1>{titulo || "COLEÇÃO DE RODAS"}</h1></>
        : loja.layout === "rodas-racing" ? <><span className="rw-hero-signature">{loja.nome}</span><h1>{titulo || "RODAS"}<strong>{texto || "PARA O SEU ESTILO"}</strong></h1></>
        : loja.layout === "rodas-night" ? <h1><span>{titulo || "O MELHOR PARA"}</span><strong>{texto || "SUAS RODAS"}</strong></h1>
        : <h1><span>{titulo || "UMA NOVA SELEÇÃO DE"}</span><strong>{texto || "RODAS E PNEUS"}</strong></h1>}
    </div></a>{banners.length > 1 && <><button className="rw-hero-prev" aria-label="Banner anterior" onClick={() => definir((atual + banners.length - 1) % banners.length)}><ChevronLeft aria-hidden="true" /></button><button className="rw-hero-next" aria-label="Próximo banner" onClick={() => definir((atual + 1) % banners.length)}><ChevronRight aria-hidden="true" /></button><div className="rw-hero-dots">{banners.map((b, i) => <button key={`${b.imagem}-${i}`} aria-label={`Mostrar banner ${i + 1}`} aria-pressed={atual === i} onClick={() => definir(i)} />)}</div></>}</section>;
}

export function CartaoRodas({ produto, soVer = false }: { produto: ProdutoRodas; soVer?: boolean }) {
  const carrinho = useCart();
  const [adicionado, definirAdicionado] = useState(false);
  const href = `/produtos/${produto.slug}`;
  return <article className="rw-product"><a className="rw-product-photo" href={href}>{produto.imagem ? <FotoDoCartao src={produto.imagem} alt={produto.nome} /> : <span className="rw-no-photo">Foto não disponível</span>}{produto.oferta && <span className="rw-sale">Oferta</span>}{produto.seloImagem && <span className="rw-image-label">{produto.seloImagem}</span>}</a>
    <div className="rw-product-info"><a className="rw-product-name" href={href}>{produto.nome}</a>{produto.descricao && <p className="rw-product-description">{produto.descricao}</p>}<div className="rw-product-bottom"><p className="rw-price">{produto.preco > 0 ? dinheiro(produto.preco) : "Sob consulta"}{produto.precoAnterior != null && <del>{dinheiro(produto.precoAnterior)}</del>}</p><div className="rw-product-actions">
      {!soVer && produto.adicionar && <button className="rw-add" aria-label={`${adicionado ? "Adicionado" : produto.pedido ? "Adicionar ao pedido" : "Adicionar ao carrinho"}: ${produto.nome}`} onClick={() => { carrinho.adicionar({ id: produto.id, slug: produto.slug, nome: produto.nome, precoCentavos: produto.preco, imagem: produto.imagem ?? undefined }); adicionarAoCarrinho({ id: produto.id, nome: produto.nome, precoCentavos: produto.preco }); definirAdicionado(true); }}>{adicionado ? <Check size={15} aria-hidden="true" /> : <ShoppingCart size={15} aria-hidden="true" />}<span>{adicionado ? "Adicionado" : produto.pedido ? "Adicionar ao pedido" : "Comprar"}</span></button>}
      <a className="rw-view" href={href}>Ver produto</a></div></div></div>
  </article>;
}

export function VitrineRodas({ titulo, produtos, soVer }: { titulo: string; produtos: ProdutoRodas[]; soVer?: boolean }) {
  if (!produtos.length) return <section className="rw-section"><h2>{titulo}</h2><p className="rw-empty">O catálogo está sendo preparado.</p></section>;
  return <section className="rw-section"><h2>{titulo}</h2><div className="rw-grid">{produtos.map(p => <CartaoRodas key={p.id} produto={p} soVer={soVer} />)}</div></section>;
}

export function FaixaMarcasRodas({ marcas }: { marcas: string[] }) {
  if (!marcas.length) return null;
  const logos: Record<string, string> = { krmai: "krmai", raw: "raw", brw: "brw", pirelli: "pirelli", yokohama: "yokohama", volcano: "volcano" };
  return <aside className="rw-brands" aria-label="Marcas do catálogo">{marcas.slice(0, 6).map(m => <a key={m} href={`/produtos?fabricante=${encodeURIComponent(m)}`}>{logos[m.toLowerCase()] ? <img src={`/marcas/automotivo/${logos[m.toLowerCase()]}.svg`} alt={m} /> : m}</a>)}</aside>;
}

export function CategoriasVisuaisRodas({ categorias, politica }: { categorias: CategoriaRodas[]; politica: LojaRodas["categoriaSemImagem"] }) {
  const visiveis = categorias.filter(c => c.imagem || politica === "icone").slice(0, 3);
  if (!visiveis.length) return null;
  return <nav className="rw-visual-categories" aria-label="Coleções">{visiveis.map(c => <a key={c.slug} href={`/categoria/${c.slug}`}>{c.imagem ? <img src={c.imagem} alt="" /> : <CircleDot className="rw-category-icon" aria-hidden="true" />}<span>{c.nome}</span><ChevronRight aria-hidden="true" /></a>)}</nav>;
}

export function LateralRodas({ loja, produtos }: { loja: LojaRodas; produtos: ProdutoRodas[] }) {
  return <aside className="rw-sidebar"><section><h2>Coleções</h2><nav>{loja.categorias.slice(0, 8).map(c => <a key={c.slug} href={`/categoria/${c.slug}`}>{c.nome}</a>)}</nav></section><section><h2>Produtos</h2><nav><a href="/produtos">Todo o catálogo</a><a href="/contato">Fale com a equipe</a>{loja.politicas.some(p => p.tipo === "envio") && <a href="/politicas/envio">Entrega e envio</a>}</nav></section>
    {produtos.length > 0 && <section><h2>Em destaque</h2>{produtos.slice(0, 3).map(p => <a className="rw-mini-product" key={p.id} href={`/produtos/${p.slug}`}>{p.imagem && <img src={p.imagem} alt="" />}<span>{p.nome}<strong>{p.preco > 0 ? dinheiro(p.preco) : "Sob consulta"}</strong></span></a>)}</section>}
    <a className="rw-sidebar-promo" href="/produtos"><span>ENCONTRE<br />SEU ESTILO</span><img src="/media/templates-rodas/racing-hero.png" alt="Coleção ilustrativa de rodas" /></a></aside>;
}

export function RodapeRodas({ loja, preferencias }: { loja: LojaRodas; preferencias?: ReactNode }) {
  return <footer className="rw-footer"><div className="rw-wrap rw-footer-columns"><section><h2>Informações</h2><a href="/sobre">Sobre a loja</a><a href="/contato">Contato</a>{loja.politicas.map(p => <a key={p.tipo} href={`/politicas/${p.tipo}`}>{p.titulo}</a>)}</section><section><h2>Produtos</h2>{loja.categorias.slice(0, 5).map(c => <a key={c.slug} href={`/categoria/${c.slug}`}>{c.nome}</a>)}<a href="/produtos">Catálogo completo</a></section><section><h2>Sua conta</h2>{loja.vende && <a href="/conta">Minha conta</a>}{(loja.vende || loja.whatsapp) && <a href="/carrinho">Meu carrinho</a>}{preferencias}</section>
    <section className="rw-footer-contact"><h2>{loja.nome}</h2>{loja.endereco && <p><MapPin size={15} aria-hidden="true" />{loja.endereco}</p>}{loja.telefone && <a href={loja.telefoneUri ?? undefined}><Phone size={15} aria-hidden="true" />{loja.telefone}</a>}{loja.email && <a href={`mailto:${loja.email}`}><Mail size={15} aria-hidden="true" />{loja.email}</a>}{loja.whatsapp && <a href={loja.whatsapp} target="_blank" rel="noopener noreferrer">Atendimento pelo WhatsApp</a>}</section></div><p className="rw-wrap rw-copyright">© {new Date().getFullYear()} {loja.identificacao.join(" • ")} • Loja virtual por Avila Ops</p></footer>;
}
