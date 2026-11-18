O pedido do Lojas dependia de uma futura operação de escrita no ERP e não emitia NF-e. Agora o próprio Lojas prepara, assina com A1 e transmite diretamente aos serviços oficiais da SEFAZ, com ambiente explícito e confirmação do XML assinado.

O formulário gera venda online para consumidor final não contribuinte no perfil revisado CRT1/CSOSN102/PIS07/COFINS07. Outros enquadramentos entram como XML revisado. Numeração, CFOP, origem, unidade e GTIN são informados e conferidos pelo emitente.

Uma tentativa ativa por CNPJ/ambiente/série/número, proteção de imutabilidade no PostgreSQL e reserva condicional impedem duplicidade. Resposta incerta exige consulta por chave, sem reenvio automático. Protocolo precisa corresponder à chave, ambiente e digest para disponibilizar XML autorizado/DANFE. Correção explícita de rascunho ou rejeição confirmada preserva a versão anterior; autorização, denegação e incerteza não podem ser substituídas assim.

Inclui migração, isolamento por tenant, API privada, revisão no pedido e na central fiscal, testes de assinatura e transporte sintético e jornada compilada no navegador. Nenhum envio real à SEFAZ faz parte do QA. Testes e build somente no GitHub CI.

Limites: modelo55 em modalidade normal; formulário com o perfil tributário descrito. Cancelamento ativo, inutilização, carta de correção e cálculo tributário geral permanecem fora desta entrega de autorização direta. Nenhuma alteração no ERP, pagamento, preço ou estoque.
