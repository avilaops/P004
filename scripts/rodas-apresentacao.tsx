import { createRoot } from "react-dom/client";
import { SemPreCarregamento } from "../src/components/LinkLoja";
import { CartProvider } from "../src/components/cart/CartProvider";
import { CabecalhoRodas, RodapeRodas } from "../src/components/home/rodas/Elementos";
import ComposicaoRodas from "../src/components/home/rodas/Composicao";
import { demonstracaoRodas } from "../src/lib/rodas-demonstracao";
import { ehTemplateRodas } from "../src/lib/templates-rodas";

const layout = document.body.dataset.layout ?? "rodas-street";
if (!ehTemplateRodas(layout)) throw new Error("Layout desconhecido");
const dados = demonstracaoRodas(layout);
const caixa = document.getElementById("apresentacao");
if (!caixa) throw new Error("Contêiner da apresentação ausente");

createRoot(caixa).render(<SemPreCarregamento><CartProvider slug={`previa-${layout}`}>
  <CabecalhoRodas loja={dados.loja} />
  <main><ComposicaoRodas {...dados} /></main>
  <RodapeRodas loja={dados.loja} />
  <p className="rw-demo-notice">Demonstração visual • catálogo ilustrativo • nenhum pedido real</p>
</CartProvider></SemPreCarregamento>);
