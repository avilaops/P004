# Emissão direta de NF-e pelo Lojas

## Decisão vigente

Em 16/11/2026 o proprietário determinou emissão direta pelo Lojas, sem ERP.
Esta decisão substitui a dependência de escrita ERP registrada anteriormente
para pedidos. Backend e APIs continuam TypeScript/Next.js.

## Contrato

O Lojas prepara o documento revisado, assina com o A1 do próprio emitente e
transmite diretamente aos serviços oficiais NF-e 4.00. Homologação e produção
são explícitas e isoladas. Cadastro fiscal, tributação e numeração não são
inferidos silenciosamente do catálogo ou da última nota recebida.

Preparação não transmite. Confirmação exige hash do documento imutável e
ambiente. Reserva única por emitente/ambiente/série/número e atualização
condicional impedem duplicidade. Resposta incerta exige consulta por chave,
nunca reenvio automático. Só protocolo válido da mesma chave, ambiente e
digest permite disponibilizar XML autorizado e DANFE. Consulta e arquivos
sempre respeitam tenant e permissão fiscal. Nenhum efeito automático em estoque.

## Execução

- [ ] Contratos puros: XML, chave, assinatura, destinos e retorno SEFAZ.
- [ ] Persistência por tenant e serviço de preparação/envio/consulta.
- [ ] API privada, revisão e confirmação no painel.
- [ ] Integração com pedidos sem dependência ERP.
- [ ] Testes no GitHub CI com A1 e transporte sintéticos, sem envio fiscal real.
- [ ] Atualizar Linear, decisões, evidências e publicação.

## Fontes

- [Serviços oficiais](https://dfe-portal.svrs.rs.gov.br/Nfe/Servicos).
- [MOC](https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?AspxAutoDetectCookieSupport=1&conteudo=LrBx7WT9PuA%3D).
- [Assinatura XML](https://github.com/node-saml/xml-crypto).

## Recorte implementado

Emissão NF-e modelo 55, modalidade normal, com destinos oficiais por UF.
O formulário de pedidos atende venda online a consumidor final não contribuinte
no Simples Nacional, CSOSN 102, PIS/COFINS 07, sem ST, mediante escolha explícita.
CFOP, origem, unidade e GTIN exigem revisão por item. Outros enquadramentos
entram como XML fiscal revisado, que o Lojas valida quanto à identidade, assina
e transmite diretamente • não há geração automática de tributação não suportada.

Numeração é informada pelo emitente; não é inferida de notas recebidas. O
documento assinado é imutável. Correção explícita de preparação ou rejeição
confirmada cria outra versão na mesma numeração e preserva a anterior. Troca
concorrente com envio é impedida no banco; resultado incerto, autorizado ou
denegado não pode ser substituído por este caminho. Inutilização, carta de correção, cancelamento
ativo e cálculo tributário geral não fazem parte desta entrega de autorização.
Consulta reconhece cancelamento já registrado na SEFAZ e preserva o XML original.

A preparação vinculada a pedido exige pedido pago, destinatário e total iguais.
Mudança no pedido após preparação bloqueia o envio. O XML assinado e o XML
autorizado têm proteção de imutabilidade no PostgreSQL. A integração não modifica
preço, pagamento, estoque ou situação comercial.
