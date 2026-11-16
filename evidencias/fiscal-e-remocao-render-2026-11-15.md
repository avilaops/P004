# Lojas • recebimento fiscal e retirada do Render

## Recebimento operacional

PR [265](https://github.com/avilaops/P004/pull/265), versão
`20ddb6603d57da7a7baf62183714835bfc30d971`.

- [CI do PR](https://github.com/avilaops/P004/actions/runs/43692768983) aprovado:
  unitários, três partes PostgreSQL, tipos, lint, contratos, build e navegador.
- O navegador criou produto sem receber estoque, confirmou entrada idempotente,
  consultou fornecedor/custos e mediu ausência de vazamento lateral em
  360, 393, 768, 1280 e 1440 px. Capturas sintéticas foram inspecionadas.
- [Produção](https://github.com/avilaops/P004/actions/runs/43693482933) aprovada
  na tentativa 3. O deploy SSH verificou o backup pré-migração de 32.686.040 bytes
  e aplicou `20261115080000_fiscal_fornecedor_cadastro`.
- A primeira tentativa excedeu um minuto na recriação do container. A segunda
  registrou deploy concluído, mas atingiu o limite ao finalizar. A terceira,
  com o container saudável, concluiu a entrega e a fumaça. O timeout nativo foi
  preservado; esse limite pode exigir repetição após migrações demoradas.
- Home pública HTTP 200 com `data-dpl-id` da versão acima. API nova de custos
  HTTP 401 JSON sem sessão. Nenhuma operação fiscal ou entrada real de teste.

Emissão de pedidos (AVL-240) depende do contrato de escrita e da homologação
da AVL-250. A integração de serviço do ERP verificada em
`7dd3e6996c810c8b2f9eb92e7bfa3d62e7b94994` oferece somente recebidas e arquivos.
As atualizações no Linear preservam essa pendência.

## Retirada da integração Render

PR [267](https://github.com/avilaops/P004/pull/267), versão
`a3a3456293d65e37e44a42e0c844da54bbd87be9`.

- [CI do PR](https://github.com/avilaops/P004/actions/runs/43694069556) aprovado,
  incluindo a jornada fiscal. Foram retiradas cerca de 1.300 linhas de jobs,
  bootstrap, backup, recuperação, proxy e testes exclusivos da integração antiga.
- Destino GitHub conferido: `DEPLOY_TARGET=ssh`. Foram removidos os segredos
  `RENDER_API_KEY`, `RENDER_DATABASE_URL` e a variável `RENDER_SERVICE_ID`.
  Nova listagem confirmou ausência de nomes `RENDER_*`, também no ambiente
  production. Nenhum valor secreto foi registrado.
- R2, PostgreSQL, proxy de host público e gerador privado de DANFE preservados.
  Busca nos arquivos executáveis não encontrou configuração de origem ou
  credenciais Render. Registros históricos datados permanecem como histórico.
- [Produção da limpeza](https://github.com/avilaops/P004/actions/runs/43694671482)
  aprovada na tentativa 2. A primeira transferência concluiu o download da
  imagem, mas atingiu o limite nativo ao finalizar. A repetição usou a imagem
  disponível, concluiu o deploy SSH e passou na fumaça oficial.
- Home pública HTTP 200 com `data-dpl-id=a3a3456293d65e37e44a42e0c844da54bbd87be9`;
  health público HTTP 200, banco saudável, latência observada de 1,62 ms.
  As listagens finais retornaram zero segredos e zero variáveis `RENDER_*`.

A retirada do repositório e de suas credenciais não declara exclusão de bancos,
serviços ou acervos externos. Nenhum dado remoto foi apagado por inferência.
