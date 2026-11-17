import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigir, normalizarEmail } from "@/lib/operadores";

const entrada = z.object({
  nome: z.string().trim().min(1).max(160),
  email: z.string().trim().max(254).email().transform(normalizarEmail),
  telefone: z.string().trim().max(30).optional(),
});

export async function POST(request: Request) {
  const { s, erro } = await exigir("gerenciarClientes");
  if (erro) return erro;
  const campos = entrada.safeParse(await request.json().catch(() => null));
  if (!campos.success) return Response.json({ erro: "Confira o nome, o e-mail e o telefone do contato." }, { status: 422 });

  const { nome, email, telefone } = campos.data;
  const tenantId = s.tenant.id;
  const emailExistente = { equals: email, mode: "insensitive" as const };
  const duplicado = () => Response.json({ erro: "Este e-mail já está na lista da loja. Busque o cliente pelo e-mail." }, { status: 409 });
  const [conta, pedido] = await Promise.all([
    prisma.comprador.findFirst({ where: { tenantId, email: emailExistente }, select: { id: true } }),
    prisma.pedido.findFirst({ where: { tenantId, clienteEmail: emailExistente }, select: { id: true } }),
  ]);
  if (conta || pedido) return duplicado();
  const { count } = await prisma.contatoAtendimento.createMany({ data: [{ tenantId, nome, email, telefone: telefone || null }], skipDuplicates: true });
  return count ? Response.json({ email }, { status: 201 }) : duplicado();
}
