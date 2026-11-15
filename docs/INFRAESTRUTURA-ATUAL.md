# Infraestrutura atual • Lojas

## Publicação

O destino ativo é SSH (`DEPLOY_TARGET=ssh`). O workflow
`.github/workflows/deploy-production.yml` testa e compila no GitHub CI, publica
a imagem por digest e usa a entrega SSH restrita existente. Os jobs conferem
execuções superadas antes da preparação e da publicação. A fumaça confere a
plataforma e a loja configuradas nas variáveis do repositório.

O Render foi retirado das configurações executáveis: bootstrap, empacotamento,
backup agendado, migração, publicação, verificação e recuperação específica de
marca/referências. O proxy Cloudflare que só aceitava a origem Render também
foi retirado. Planos e evidências datados permanecem registros históricos,
sem configurar o ambiente atual.

## Serviços preservados

- PostgreSQL e os dados comerciais existentes.
- Entrada por proxy e resolução do host público por tenant.
- Gateway R2 e armazenamento privado de documentos e uploads.
- Gerador privado de DANFE e suas verificações no CI. A integração aceita o
  serviço interno `http://fiscal-avilaops-com-web:8000`; sua saúde usa a variável
  genérica `GIT_COMMIT` quando disponível.

Credenciais e recursos compartilhados não são apagados por terem sido usados
durante a recuperação. A remoção de configurações não comprova exclusão de
serviços ou bancos externos. Nenhum banco ou acervo remoto deve ser apagado
por inferência sobre sua desativação.
