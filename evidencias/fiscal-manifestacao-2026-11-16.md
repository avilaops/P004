# Preparação e concorrência da manifestação fiscal

## Versão e escopo

- Repositório: `avilaops/P004` • somente Lojas.
- PR: <https://github.com/avilaops/P004/pull/269>.
- Versão integrada: `96f3d85757f3dad11d87a8a492755ae79f08347d`.
- Nenhuma alteração no ERP, manifestação real ou operação de estoque real.

## Comportamento

A preparação valida tipo, justificativa, certificado e assinatura antes de
reservar a intenção. Assim, erro de formulário ou certificado não bloqueia
uma tentativa corrigida. A chave única resolve confirmações concorrentes:
somente quem cria a intenção transmite; as demais chamadas consultam o
primeiro comando. Falha de transporte mantém o estado incerto sem reenvio.

Aceite, rejeição e protocolo persistidos não regridem se a auditoria falhar
depois. O registro fiscal mantém XML de envio e resposta e o servidor registra
a falha posterior. Isso não comprova reparação automática da auditoria ausente.
CNPJ integrado continua sob autoridade do ERP; respostas da API são privadas
e sem cache também em erros de autenticação, permissão e validação.

## Evidências no GitHub CI

- RED: <https://github.com/avilaops/P004/actions/runs/43857990688> • tipo herdado
  aceito e validação posterior à persistência reproduzidos.
- GREEN final: <https://github.com/avilaops/P004/actions/runs/43859738403>.
- Testes unitários, PostgreSQL, tipos, lint, contratos, build e navegador
  aprovados na versão `67ac9503c7564c9d5f1682e0e659f1ccb6d95f49` do PR.
- Cinco confirmações concorrentes produzem um envio; comando e autor originais
  permanecem. Transporte incerto não retransmite. Falha de auditoria provocada
  e comprovada mantém aceite e protocolo. CNPJ integrado não transmite localmente.
- API compilada: anônimo 401, gerente 403, tipo herdado/corpo nulo/justificativa
  com tipo incorreto 422, todos privados sem cache e sem intenção persistida.
- A jornada fiscal existente permaneceu aprovada.
- Rodadas intermediárias identificaram incompatibilidades do substituto de teste
  com o Proxy e a assinatura gerada pelo Prisma; ambas corrigidas no GREEN final.

## Publicação

Pipeline da versão integrada aprovado:
<https://github.com/avilaops/P004/actions/runs/43860889804>.
A entrega remota foi dispensada porque a `main` avançou para
`267b565663dc22c5e6b2c146f39d461b6c82720d` durante a execução. A única diferença
posterior está em `public/measurement/runtime.mjs` • PR270, trabalho concorrente.
O pipeline dessa versão, que contém o PR269, foi aprovado na tentativa 2:
<https://github.com/avilaops/P004/actions/runs/43861260846>.

A primeira tentativa concluiu o deploy remoto, mas atingiu o limite nativo
de um minuto na finalização do job. Reexecutada somente a etapa interrompida;
deploy e fumaça oficial aprovados na segunda tentativa. Sem migrações pendentes.

Verificação pública em 16/11/2026 às 12:05 UTC:

- Home HTTP 200 • `data-dpl-id=267b565663dc22c5e6b2c146f39d461b6c82720d`.
- `/api/health` HTTP 200 • banco saudável.
- POST sem sessão em `/api/painel/fiscal/documentos/verificacao-sem-sessao/manifestacao`
  devolve 401 JSON, `Cache-Control` privado sem cache e `nosniff`.

A homologação fiscal externa e a emissão de pedidos via ERP continuam separadas.
Testes sintéticos não comprovam aceite real pela SEFAZ.
