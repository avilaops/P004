# Fiscal do Lojas • conclusão operacional

## Escopo autorizado

Concluir o módulo fiscal somente no Lojas, conforme pedido de15/11/2026.
Preservar TypeScript/Next.js, razão multilocal e autoridade dos CNPJs delegados
ao ERP. Builds e testes exclusivamente no GitHub CI. Não executar manifestação,
emissão ou entrada real para testar.

## Decisões

A conferência mostrará destinatário, CEST, descontos, frete, seguro, despesas e
tributos declarados no XML. Não calcular tributação nem inferir crédito fiscal.
Fornecedor será reutilizado exclusivamente por documento exato dentro da loja,
após confirmação. O nome fiscal de cada compra permanece no recibo histórico.
O custo de aquisição por linha será informado e confirmado pelo operador em
centavos totais para as unidades físicas recebidas, sem presumir tratamento de
tributos. O recibo imutável conserva esse custo, os componentes fiscais e o
fornecedor; entradas antigas permanecem legíveis e nunca serão reescritas.

Cadastro de produto a partir da conferência usará a escrita canônica do catálogo,
com confirmação própria, preço de venda explícito e estoque inicial zero. Não
adotar automaticamente SKU do fornecedor como identidade global do produto.

Alternativas: delegar todas as entradas ao ERP conflita com a preferência já
registrada na AVL-254; duplicar seu motor de emissão viola a AVL-240. Manter a
entrada local e consumir somente contratos reais de emissão é o caminho adotado.

## Verificação e limites

Provar isolamento, fornecedor exato, custos sem sobrescrita, idempotência,
concorrência e rollback no PostgreSQL isolado da CI. Verificar a conferência
responsiva no navegador da CI. Preservar XML bruto e comportamento de resumos.
Credenciais de leitura do ERP não autorizam emissão; ausência de contrato runtime
de escrita ou homologação externa permanece impedimento explícito da AVL-240.
