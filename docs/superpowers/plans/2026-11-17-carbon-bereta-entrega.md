# Carbon na Bereta • plano de implementação e entrega

**Objetivo:** concluir, publicar e ativar o Carbon escolhido pelo proprietário,
com catálogo real e verificação completa. Não encerrar com publicação pendente.

**Arquitetura:** conservar os componentes TSX de `home/rodas`, o modelo público
`rodas-modelo.ts` e os fluxos existentes de catálogo, carrinho e checkout.
Selecionar somente `rodas-carbon` na Bereta após a versão aprovada estar no ar.
O proprietário também determinou usar somente `beretarodas.com` para o cliente.
Esse domínio passa a ser o principal; os aliases antigos redirecionam com
preservação de caminho e consulta. Isso substitui a separação institucional/loja.
Os outros modelos permanecem disponíveis, sem alterar outras lojas.

**Stack:** TypeScript/TSX, Next.js, Prisma, CSS e PostgreSQL existentes.
**Referência aprovada:** `tests/fixtures/rodas-referencias/4.png` e prévia Carbon
entregue ao proprietário; detalhes em `design-qa.md`.

## Restrições

- Build e testes exclusivamente no GitHub CI, sem executá-los nos servidores.
- Preservar gates, hashes, origem dos artefatos e limites nativos do projeto.
- Usar preços, imagens, disponibilidade e identidade legal reais da Bereta.
- Não criar pedidos, pagamentos, mensagens ao cliente ou eventos fiscais reais.
- Preservar o projeto institucional anterior para reversão, sem mantê-lo como
  uma segunda experiência pública. Não alterar configurações de outras lojas.
- Guardar o tema anterior para permitir reversão da seleção.

## Implementação e verificação

- [ ] Conferir a integração Carbon em catálogo, categoria, detalhe, busca,
  carrinho, contato e prévia; corrigir falhas comprovadas e cobrir regressões.
  Fontes: `src/components/home/rodas/`, `src/lib/rodas-modelo.ts`,
  `src/app/layout.tsx`. Verificação: `scripts/qa-templates-rodas.mts` no CI.
- [ ] Diagnosticar os cancelamentos da CI e concluir uma execução integral
  aprovada, preservando os contratos de `scripts/ci/artefato.mjs` e a política
  de `docs/CI-ETAPAS-CURTAS.md`. Nenhum gate será considerado aprovado por
  capturas estáticas ou por uma execução de outro commit/tentativa.
  Diagnóstico: na tentativa2 de44118063520, a preparação do job de tipos levou
  cerca de19s, seguida de typegen/tsc até atingir o limite. Separar um artefato
  de qualidade sem os binários ONNX mantém os arquivos de tipos e os comandos
  originais, reduz a transferência e preserva a proveniência. Build/testes
  continuam usando o pacote completo, com o mesmo limite nativo por job.
- [ ] Revisar o delta, integrar a PR274 e publicar pela imagem produzida no
  pipeline aprovado. Conferir revisão implantada, saúde e fumaça oficial.
- [ ] Preservar o tema anterior e ativar Carbon somente na Bereta por mecanismo
  administrativo autorizado, conservando conteúdo/catálogo real e aplicando a
  paleta Carbon aprovada. Conferir carrossel e identidade da loja.
- [ ] Configurar `beretarodas.com` como domínio principal, ajustar DNS web e
  origem, redirecionar `www` e `loja.beretarodas.com` para o apex mantendo
  caminhos/consulta e verificar TLS, canonical, sitemap e links da loja.
  Preservar e-mail, outros registros DNS e implantação antiga para reversão.
- [ ] Inspecionar produção em desktop/celular, conferir navegação e ausência de
  overflow/erros; registrar capturas, versão, run e estado em evidência versionada
  e no controle da equipe. Concluir somente após todos os itens obrigatórios.

## Condições de revisão

Nomes longos não devem sobrepor botões; ausência de imagem não fabrica foto;
variantes exigem escolha no detalhe; produto sem estoque não ganha compra
direta; políticas ausentes não geram links fictícios; os dados de demonstração
da prévia nunca substituem os dados publicados.
