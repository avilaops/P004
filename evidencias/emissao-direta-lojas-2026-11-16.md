# NF-e • emissão direta pelo Lojas

## Decisão e versão

O proprietário determinou em 16/11/2026: emissão diretamente pelo Lojas, sem
passar pelo ERP. A dependência anterior de escrita do adaptador ERP foi revogada.
Backend e APIs continuam TypeScript/Next.js. O ERP não foi alterado.

- PR: <https://github.com/avilaops/P004/pull/271>.
- Versão de implementação: `6c32cde533d85e9d4f318b1607b173769a2039c6`.
- Versão integrada: `cf8970bee5eb52148ebdb1894109805b889cfe2d`.
- Plano: `docs/superpowers/plans/2026-11-16-emissao-direta-lojas.md`.
- CI final aprovado: <https://github.com/avilaops/P004/actions/runs/43877304871>.

## Operação

No pedido, a conferência fiscal abre preparação de NF-e de venda. O proprietário
informa ambiente, série, número, IE, municípios IBGE, enquadramento e classificação
por item. Cartão exige dados reais da transação; não há integração ou autorização
de cartão presumida. Venda direta sem intermediador é confirmada explicitamente.

O formulário atende venda online direta a consumidor final não contribuinte,
no Simples Nacional • CRT1/CSOSN102/PIS07/COFINS07, sem ST. Outros enquadramentos
podem entrar como XML fiscal revisado na central ou no pedido. O motor assina e
transmite NF-e modelo55 em modalidade normal; não calcula tributação geral.

Frete e desconto do pedido são rateados em centavos, com conservação exata dos
totais. Faturamento não depende de quitação: pedidos aprovados a prazo podem
ser preparados; cotação, cancelamento e estorno bloqueiam a emissão. Destinatário,
total e versão comercial são conferidos. Não há alteração automática de preço,
pagamento, estoque ou situação comercial.

Preparação apenas assina e persiste. A transmissão requer confirmação explícita
do ambiente e hash do XML assinado. O Lojas usa A1 e HTTPS mútuo diretamente nos
serviços oficiais da SEFAZ, com destinos por UF e sem URL recebida do navegador.

Uma tentativa ativa por CNPJ, ambiente, série e número impede duplicidade,
inclusive entre tenants. Resultado incerto fica pendente de consulta por chave,
sem reenvio automático. Correção explícita de preparação ou rejeição confirmada
preserva a versão anterior e a mesma numeração. Concorrência com envio é bloqueada;
autorização, denegação e incerteza não podem ser substituídas por esse caminho.

XML assinado e XML autorizado são imutáveis no PostgreSQL. Protocolo deve corresponder
à chave, ambiente e digest antes de liberar XML autorizado/DANFE. Uma consulta
inconclusiva não desfaz autorização anterior; cancelamento já informado pela SEFAZ
é reconhecido. API, arquivos e histórico permanecem privados por tenant.

## Verificação

Testes usam certificado A1, documentos e transporte sintéticos. Nenhuma NF-e real
foi transmitida, nem houve consulta externa da SEFAZ durante o QA.

- Regressão inicial: <https://github.com/avilaops/P004/actions/runs/43869554605>.
- Contrato de geração ausente reproduzido em `43870530176`.
- Assinatura verificada, adulteração e IDs duplicados recusados antes da reserva.
- Concorrência, retorno incerto, protocolo recuperado e ausência de reenvio.
- Proteção de imutabilidade, unicidade por emitente e revisão da mesma numeração.
- Faturamento a prazo e bloqueio de pedido alterado após preparação.
- Rateio exato e ausência de tributação/intermediação/cartão presumidos.
- Jornada no navegador aprovada em `43876384036` para o mesmo frontend final:
  preparação e correção sem transmissão, confirmação, 401/403/404/409/422 e
  nenhuma alteração de estoque. Prints de 393/1440px inspecionados sem overflow.
  Essa rodada foi cancelada após os checks de navegador para liberar a versão final.
- Artefato visual: `lojas-fiscal-entry-browser-470c2a7745cf7489aea644a85ee0f78b3a5c0f52`.
- Versão final: unitários, PostgreSQL, tipos, lint, contratos, build e navegador
  aprovados em `43877304871`; artefato
  `lojas-fiscal-entry-browser-c799853fd33af598a1a1226acb21807df560e083`.
- Rodadas intermediárias corrigiram leitura de namespace, rótulos dos seletores e
  simulação do ingresso HTTPS no teste. Timeout e referência de artefato em tentativa
  repetida exigiram nova execução do CI, sem reduzir validações da aplicação.

## Publicação e limites

Publicação aprovada no pipeline
<https://github.com/avilaops/P004/actions/runs/43880331296>, tentativa 2.
A primeira tentativa aplicou a migração `20261116123000_emissao_direta_lojas`
e iniciou o container, mas atingiu o limite de finalização do job. Backup
pré-migração conferido com 32.705.884 bytes. Reexecutados somente os jobs
interrompidos; deploy e fumaça oficial aprovados.

Verificação pública em16/11/2026 às14:19UTC:

- Home HTTP200 • `data-dpl-id=cf8970bee5eb52148ebdb1894109805b889cfe2d`.
- GET `/api/painel/fiscal/emissoes` sem sessão • 401 JSON privado e sem cache.
- `/api/health` • HTTP200, banco saudável.

A validação sintética não comprova homologação real do estabelecimento na SEFAZ.
Cancelamento ativo, inutilização, carta de correção e cálculo tributário geral
não fazem parte desta entrega de autorização direta.

## Fontes técnicas

- [Serviços oficiais por autorizador](https://dfe-portal.svrs.rs.gov.br/Nfe/Servicos).
- [Web Services de São Paulo](https://portal.fazenda.sp.gov.br/servicos/nfe/Paginas/URL-WEBSERVICES.aspx).
- [MOC • visão geral](https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?AspxAutoDetectCookieSupport=1&conteudo=LrBx7WT9PuA%3D).
- [Assinatura XML](https://github.com/node-saml/xml-crypto).
