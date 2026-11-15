# Conferência fiscal do pedido • somente Lojas

O proprietário confirmou que a continuação deve alterar somente Lojas. O ERP
oferece consulta de recebidas por credencial de serviço; não oferece emissão
por essa integração. Não acrescentar operações ao ERP nem simular autorização.

## Entrega

O dono acessa uma conferência fiscal no detalhe de seu pedido. A leitura mostra
emitente, destinatário, itens, frete, pagamento e totais comerciais preservados,
com pendências para revisão. A classificação NCM/CEST vem do cadastro atual e
é identificada como tal, sem fingir que existia quando a compra foi fechada.
Não escolher CFOP, calcular tributos, completar município por palpite ou
transformar aprovação comercial em autorização fiscal.

O contrato local `avila.lojas.fiscal.pedido.v1` identifica pedido, versão dos
dados e SHA-256 do snapshot projetado. O hash serve para detectar alterações;
não é assinatura, autorização fiscal ou chave de idempotência de emissão.
Valores monetários permanecem centavos inteiros. Divergências de linhas,
subtotal, desconto, frete ou total são pendências, sem arredondamento silencioso.

Uma transação de leitura com snapshot consistente busca exclusivamente o
tenant da sessão. O JSON seleciona campos explicitamente, não serializa Tenant,
Comprador ou credenciais completos. Produto/variante fora da loja não fornece
metadados. O GET exige permissão fiscal; equipe sem essa permissão não recebe
o controle na interface. Resposta privada e sem cache. Não envia chamadas ao
ERP, não cria documento, evento, reserva ou movimentação.

Alternativas descartadas: implementar outro emissor viola a fronteira do
produto; liberar a API do ERP contraria a confirmação de escopo. A conferência
local entrega revisão útil enquanto a emissão continua explicitamente pendente.

## Verificação

GitHub CI: centavos e limites, totais divergentes, classificação ausente,
documentos incompletos, cancelamento, hash sensível aos dados e isolamento por
tenant. PostgreSQL comprova ausência de efeitos. Navegador confere leitura no
pedido, pendências, atualização e celular/desktop. Nenhuma emissão real.
