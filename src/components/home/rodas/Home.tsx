import { lerTema } from "@/lib/tema";
import { montarLojaRodas, montarProdutoRodas, bannersRodas } from "@/lib/rodas-modelo";
import { marcaConfirmada } from "@/lib/marca-confirmada";
import type { DadosHome } from "../tipos";
import ComposicaoRodas from "./Composicao";

export default function HomeRodas(dados: DadosHome) {
  const tema = lerTema(dados.t.tema);
  return <ComposicaoRodas
    loja={montarLojaRodas(dados.t, tema, dados.categorias, dados.vende, dados.identidadePublica)}
    produtos={dados.vitrine.map(p => montarProdutoRodas(p, dados.vende, Boolean(dados.t.whatsapp)))}
    banners={bannersRodas(tema, dados.t.bannerUrl)} titulo={tema.heroTitulo} texto={tema.heroTexto}
    marcas={dados.marcas?.length ? dados.marcas : [...new Set(dados.vitrine.map(p => marcaConfirmada(p.marca)).filter((m): m is string => Boolean(m)))]}
    sobre={dados.t.sobre}
  />;
}
