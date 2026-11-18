import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessaoDoPainel } from "@/lib/sessao";
import { permite } from "@/lib/operadores";
import { clientesDaLoja } from "@/lib/clientes";
import Clientes from "@/components/painel/Clientes";
import CabecalhoSecao from "@/components/painel/CabecalhoSecao";

export const metadata: Metadata = { title: "Clientes | Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Pagina() {
  const sessao = await sessaoDoPainel();
  if (!sessao) redirect("/entrar");
  const clientes = await clientesDaLoja(sessao.tenant.id);
  return (
    <>
      <CabecalhoSecao titulo="Clientes" descricao="Contatos da loja e histórico de compras." />
      <div className="grid gap-6">
        <Clientes
          podeCadastrar={permite(sessao.papel, "gerenciarClientes")}
          clientes={clientes.map((c) => ({
            ...c,
            primeiraCompra: c.primeiraCompra?.toISOString() ?? null,
            ultimaCompra: c.ultimaCompra?.toISOString() ?? null,
          }))}
        />
      </div>
    </>
  );
}
