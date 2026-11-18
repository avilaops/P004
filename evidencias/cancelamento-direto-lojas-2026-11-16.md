# Cancelamento direto de NF-e • Lojas

## Entrega

PR272 implementa evento110111 com A1 e comunicação direta com a SEFAZ.
O dono revisa documento, ambiente e justificativa antes de confirmar. A intenção
assinada é persistida antes da rede e protegida por lock, índice único e trigger
de imutabilidade. Repetições não retransmitem. Rejeição permite nova versão
após revisão explícita; resultado incerto exige consulta por chave.

Protocolo de aceite135/155 precisa corresponder à chave, ambiente, tipo e
sequência. O comprovante privado contém o evento assinado e o retorno real do
transporte configurado. Consulta que confirma cancelamento sem protocolo do
evento não inventa comprovante. XML original autorizado permanece preservado;
cancelamento não altera pagamento, pedido nem estoque.

## Verificação

- RED43885632612 comprovou o defeito de consulta: situação101 cancelada era
  interpretada como autorização100 do protocolo original.
- CI43888470673 verificou a primeira implementação. CI final43889647698 aprovado
  para cba1d9bedd1e1e5770160afe8108a1e406633649, incluindo tipos, lint, contratos,
  build, assinatura, PostgreSQL e jornada compilada.
- Testes PostgreSQL usam A1 e transporte sintéticos, verificam assinatura,
  concorrência, histórico, imutabilidade, incerteza, reconciliação e isolamento.
- Navegador usa servidor compilado para permissões e downloads; a confirmação
  positiva passa pelo serviço real com transporte sintético injetado. O servidor
  de QA bloqueia conexões externas com autorizadores SEFAZ.
- Builds e testes executados exclusivamente no GitHub CI.
- Capturas393/1440px do artefato
  `lojas-fiscal-entry-browser-7f73498292ae9379662c2c3c1bb0fe124c827b27`
  inspecionadas: cancelamento aceito, comprovante e histórico legíveis, sem
  transbordamento horizontal.

## Publicação

PR272 integrado em463380525c1f5ea81cca183fb2e26f6fd318cc6e.
Publicação43891181312 aprovada na tentativa2, incluindo fumaça oficial.
Na primeira tentativa, o job atingiu o limite de1min após conferir backup de
32.708.239bytes e aplicar a migração20261116142000_cancelamento_nfe_lojas.
A segunda confirmou ausência de migrações pendentes e concluiu a implantação.

Às15:10UTC de16/11/2026, home200 com versão exata463380525c1f5ea81cca183fb2e26f6fd318cc6e;
API de cancelamento sem sessão401JSON, privado/no-store; health200 e banco ok.
Houve502 transitório durante a reinicialização, resolvido antes do aceite final.
Nenhuma NF-e ou cancelamento real foi enviado para testar esta entrega.

## Limites

Inutilização e carta de correção não fazem parte desta entrega. Homologação
fiscal real exige o certificado e a operação do emitente. O retorno da SEFAZ
valida prazo e condições do cancelamento; a aplicação não presume deferimento.

## Fontes

- [MOC • evento de cancelamento](https://moc.sped.fazenda.pr.gov.br/NFe_NFCe/RecepcaoEventoCancelamento.html).
- [MOC • consulta de protocolo](https://moc.sped.fazenda.pr.gov.br/NFe_NFCe/NFeConsultaProtocolo.html).
- [Serviços oficiais por UF](https://dfe-portal.svrs.rs.gov.br/Nfe/Servicos).
