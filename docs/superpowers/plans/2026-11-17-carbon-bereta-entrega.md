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
- Preservar gates, hashes e origem dos artefatos. O proprietário retirou
  explicitamente o bloqueio de um minuto; os workflows usam dez minutos por
  job. Decisão e diagnóstico em `CI-ETAPAS-CURTAS.md`.
- A limpeza autorizada abrange somente Lojas: preservar imagem ativa e rollback,
  sem excluir uploads, backups ou imagens de outros aplicativos.
- Usar preços, imagens, disponibilidade e identidade legal reais da Bereta.
- Não criar pedidos, pagamentos, mensagens ao cliente ou eventos fiscais reais.
- Preservar o projeto institucional anterior para reversão, sem mantê-lo como
  uma segunda experiência pública. Não alterar configurações de outras lojas.
- Guardar o tema anterior para permitir reversão da seleção.

## Implementação e verificação

- [x] Conferir a integração Carbon em catálogo, categoria, detalhe, busca,
  carrinho, contato e prévia; corrigir falhas comprovadas e cobrir regressões.
  Fontes: `src/components/home/rodas/`, `src/lib/rodas-modelo.ts`,
  `src/app/layout.tsx`. Verificação: `scripts/qa-templates-rodas.mts` no CI.
- [x] Diagnosticar os cancelamentos da CI e concluir uma execução integral
  aprovada, preservando os contratos de `scripts/ci/artefato.mjs` e a política
  de `docs/CI-ETAPAS-CURTAS.md`, com dez minutos por job conforme instrução final
  explícita do proprietário.
  Nenhum gate será considerado aprovado por
  capturas estáticas ou por uma execução de outro commit/tentativa.
  Diagnóstico: na tentativa2 de44118063520, a preparação do job de tipos levou
  cerca de19s, seguida de typegen/tsc até atingir o limite. Separar um artefato
  de qualidade sem os binários ONNX mantém os arquivos de tipos e os comandos
  originais, reduz a transferência e preserva a proveniência. Build/testes
  continuam usando o pacote completo, com o mesmo limite nativo por job.
- [x] Revisar o delta, integrar a PR274 e publicar pela imagem produzida no
  pipeline aprovado. Conferir revisão implantada, saúde e fumaça oficial.
- [x] Preservar o tema anterior e ativar Carbon somente na Bereta por mecanismo
  administrativo autorizado, conservando conteúdo/catálogo real e aplicando a
  paleta Carbon aprovada. Conferir carrossel e identidade da loja.
- [x] Configurar `beretarodas.com` como domínio principal, ajustar DNS web e
  origem, redirecionar `www` e `loja.beretarodas.com` para o apex mantendo
  caminhos/consulta e verificar TLS, canonical, sitemap e links da loja.
  Preservar e-mail, outros registros DNS e implantação antiga para reversão.
- [x] Inspecionar produção em desktop/celular, conferir navegação e ausência de
  overflow/erros; registrar capturas, versão, run e estado em evidência versionada
  e no controle da equipe. Concluir somente após todos os itens obrigatórios.

## Condições de revisão

Nomes longos não devem sobrepor botões; ausência de imagem não fabrica foto;
variantes exigem escolha no detalhe; produto sem estoque não ganha compra
direta; políticas ausentes não geram links fictícios; os dados de demonstração
da prévia nunca substituem os dados publicados.

## Entrega verificada

PR274 integrou o Carbon; PR275 retirou o bloqueio de um minuto por orientação
explícita do proprietário. Produção publicada em
`b2d87fd2bc12c78a3ba9bf6a7033824e2306a725`, pelo run44133809562 aprovado
integralmente, incluindo entrega, deploy e fumaça. Carbon ativo em
`https://beretarodas.com`, com aliases públicos redirecionados e duas imagens
de execução preservadas.

Durante a conferência, o proprietário pediu uma nova foto inspirada no Racing.
O banner dourado foi gerado com imagegen e publicado como mídia da Bereta,
otimizado para 71.538 bytes; o layout continua Carbon. Nove produtos existentes
com fotos cadastradas foram selecionados como destaques. A releitura confirmou
preços, disponibilidade, estoque e imagens preservados; fotos de série mantêm
seu aviso. Nenhum produto foi criado e nenhum pedido real foi enviado.

Evidência final: [Carbon em produção](../../../evidencias/bereta-carbon-2026-11-17.md)
e [tempo/retenção](../../../evidencias/ci-cd-retencao-lojas-2026-11-17.md).
