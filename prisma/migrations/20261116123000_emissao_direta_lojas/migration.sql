CREATE TABLE "EmissaoFiscalLoja" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "pedidoId" TEXT,
  "pedidoAtualizadoEm" TIMESTAMP(3),
  "cnpj" TEXT NOT NULL,
  "uf" TEXT NOT NULL,
  "ambiente" TEXT NOT NULL,
  "serie" INTEGER NOT NULL,
  "numero" INTEGER NOT NULL,
  "chave" TEXT NOT NULL,
  "resumoHash" TEXT NOT NULL,
  "intencaoHash" TEXT NOT NULL,
  "xmlAssinado" TEXT NOT NULL,
  "total" TEXT NOT NULL,
  "destinatarioDocumento" TEXT NOT NULL,
  "destinatarioNome" TEXT NOT NULL,
  "xmlResposta" TEXT,
  "xmlAutorizado" TEXT,
  "digest" TEXT NOT NULL,
  "autor" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PREPARADA',
  "codigo" TEXT,
  "motivo" TEXT,
  "protocolo" TEXT,
  "enviadoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmissaoFiscalLoja_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmissaoFiscalLoja_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EmissaoFiscalLoja_tenantId_pedidoId_fkey" FOREIGN KEY ("tenantId", "pedidoId") REFERENCES "Pedido"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EmissaoFiscalLoja_identidade_check" CHECK ("ambiente" IN ('1','2') AND "serie" BETWEEN 0 AND 999 AND "numero" BETWEEN 1 AND 999999999 AND "chave" ~ '^[0-9]{44}$')
);
CREATE UNIQUE INDEX "EmissaoFiscalLoja_numero_ativo_key" ON "EmissaoFiscalLoja"("tenantId", "ambiente", "serie", "numero") WHERE "status" <> 'SUBSTITUIDA';
CREATE INDEX "EmissaoFiscalLoja_tenantId_ambiente_serie_numero_idx" ON "EmissaoFiscalLoja"("tenantId", "ambiente", "serie", "numero");
CREATE INDEX "EmissaoFiscalLoja_tenantId_ambiente_chave_idx" ON "EmissaoFiscalLoja"("tenantId", "ambiente", "chave");
CREATE INDEX "EmissaoFiscalLoja_tenantId_pedidoId_criadoEm_idx" ON "EmissaoFiscalLoja"("tenantId", "pedidoId", "criadoEm");

CREATE FUNCTION "preservarEmissaoFiscalLoja"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW."tenantId", NEW."pedidoId", NEW."pedidoAtualizadoEm", NEW."cnpj", NEW."uf", NEW."ambiente", NEW."serie", NEW."numero", NEW."chave", NEW."resumoHash", NEW."intencaoHash", NEW."xmlAssinado", NEW."digest", NEW."autor", NEW."total", NEW."destinatarioDocumento", NEW."destinatarioNome")
     IS DISTINCT FROM
     ROW(OLD."tenantId", OLD."pedidoId", OLD."pedidoAtualizadoEm", OLD."cnpj", OLD."uf", OLD."ambiente", OLD."serie", OLD."numero", OLD."chave", OLD."resumoHash", OLD."intencaoHash", OLD."xmlAssinado", OLD."digest", OLD."autor", OLD."total", OLD."destinatarioDocumento", OLD."destinatarioNome") THEN
    RAISE EXCEPTION 'A preparação fiscal assinada é imutável';
  END IF;
  IF OLD."xmlAutorizado" IS NOT NULL AND NEW."xmlAutorizado" IS DISTINCT FROM OLD."xmlAutorizado" THEN
    RAISE EXCEPTION 'O XML fiscal autorizado é imutável';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "EmissaoFiscalLoja_imutavel" BEFORE UPDATE ON "EmissaoFiscalLoja" FOR EACH ROW EXECUTE FUNCTION "preservarEmissaoFiscalLoja"();
