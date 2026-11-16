# Conferência fiscal do pedido • entrega verificada

## Versão e escopo

[PR 268](https://github.com/avilaops/P004/pull/268), versão publicada
`4fe4d40b982538864bacdf359c31576906b6ac68`.

O proprietário confirmou expressamente alterações somente no Lojas. A entrega
adiciona conferência local de pedido e edição NCM/CEST pelo catálogo existente.
Não altera código do ERP, cria documento fiscal ou libera emissão.

O contrato de serviço do ERP foi reconferido na origem
`47c8e84270d67ddf2daff21b2a47a6b8a456ad45`: `fiscal::service_routes` usa
`lojas::routes`, que oferece somente consulta de recebidas e arquivos. AVL-250
continua dependência da emissão da AVL-240; nenhuma operação foi inventada.

## Comportamento entregue

O dono abre o pedido e seleciona **Conferir dados fiscais**. Preços e descrições
vêm da compra; a classificação atual do catálogo fica identificada separadamente.
O snapshot comercial usa centavos inteiros e SHA-256 para detectar alterações.
O hash não representa assinatura ou autorização fiscal.

Uma pendência NCM/CEST abre o cadastro do produto. Em **Classificação fiscal**,
o usuário confere os códigos e salva pela escrita canônica com versão e histórico.
Zeros iniciais são preservados; vazio ou nulo limpa o campo. Após voltar ao
pedido e atualizar a conferência, a classificação e o hash refletem a alteração,
preservando preço, descrição e totais da compra.

O GET `/api/painel/pedidos/[id]/fiscal` exige sessão e permissões fiscal/pedidos.
A leitura utiliza snapshot consistente do PostgreSQL, filtra tenant e seleciona
somente os campos necessários. Erros e sucesso usam cache privado/no-store.
Produtos ou variantes externos à loja não fornecem metadados.

## Evidências

- [CI final do PR](https://github.com/avilaops/P004/actions/runs/43698281827)
  aprovada no código `e910b298e3612d54c9c4b7a725a6171b48a33414`: unitários,
  três partes PostgreSQL, tipos, lint, contratos, build e navegador.
- RED confirmado em 43696155490 e 43696270463 por módulos ausentes. Em
  43697635335, o teste comprovou que o schema anterior descartava NCM/CEST.
- Navegador: dono autorizado, anônimo 401/no-store, gerente 403 e outro tenant
  404. Gerente não recebe a seção fiscal. Leitura não alterou pedido ou estoque.
- Jornada real no banco sintético: pendência → cadastro → edição NCM/CEST →
  retorno ao pedido → conferência atualizada com novo hash e preço preservado.
  Conferência medida em 393 e 1440 px, sem vazamento lateral ou erro de página.
- Capturas sintéticas inspecionadas no artefato
  `lojas-fiscal-entry-browser-3cd5dc85193228bdb92a0d353d458f9d47bb76ad`.
- [Produção](https://github.com/avilaops/P004/actions/runs/43698926994) aprovada
  na tentativa 2. A primeira entrega registrou conclusão remota, mas atingiu o
  limite nativo do job ao finalizar; repetição concluiu a entrega e a fumaça.
- Home pública HTTP 200 com `data-dpl-id` da versão publicada acima. Rota nova
  HTTP 401 JSON sem sessão, com `Cache-Control: no-store, must-revalidate,
  max-age=0, private`. Nenhuma migração de banco necessária.

Nenhum teste/build local, emissão real, chamada ao ERP ou escrita de dados reais
foi usado como prova. Avisos de indexação estão desativados no servidor sintético
da jornada para impedir envio dos dados de QA a serviços externos.
