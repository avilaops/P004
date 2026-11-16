# Cancelamento direto de NF-e

## Contrato

Cancelar NF-e autorizada pelo próprio Lojas usando A1 e evento110111 da SEFAZ,
com justificativa, ambiente e confirmação explícitos. Nenhum evento real será
enviado no QA. Cancelamento fiscal não estorna pagamento nem movimenta estoque.

A intenção assinada é persistida antes da rede. Concorrência transmite uma vez;
resultado incerto exige consulta por chave e não autoriza reenvio. Rejeição
confirmada pode gerar nova versão somente após revisão explícita. Protocolo do
evento precisa corresponder à chave, ambiente, tipo e sequência. Recibo privado
somente com aceite comprovado. XML original de autorização permanece imutável.

A consulta da NF-e deve priorizar a situação atual cancelada mesmo quando a
resposta contém o protocolo original autorizado. Consulta inconclusiva não
desfaz cancelamento confirmado.

## Execução

- [x] Reproduzir regressão de consulta e contrato do evento no GitHub CI • RED43885632612.
- [x] Persistência imutável e envio idempotente com transporte sintético.
- [x] API privada, confirmação e comprovante no painel.
- [x] Consulta reconcilia resultado incerto sem inventar protocolo de evento.
- [x] CI43889647698, navegador393/1440px, publicação43891181312 e evidências.

Publicação463380525c1f5ea81cca183fb2e26f6fd318cc6e verificada em16/11/2026.
Registro: `evidencias/cancelamento-direto-lojas-2026-11-16.md`.

## Fontes

- [MOC • recepção de eventos](https://moc.sped.fazenda.pr.gov.br/NFe_NFCe/RecepcaoEventoGeral.html).
- [Serviços oficiais por UF](https://dfe-portal.svrs.rs.gov.br/Nfe/Servicos).
