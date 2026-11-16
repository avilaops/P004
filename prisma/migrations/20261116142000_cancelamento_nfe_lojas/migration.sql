CREATE UNIQUE INDEX "EmissaoFiscalLoja_tenantId_id_key" ON "EmissaoFiscalLoja"("tenantId", "id");
CREATE TABLE "CancelamentoEmissaoFiscalLoja" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "emissaoId" TEXT NOT NULL,
  "anteriorId" TEXT,
  "intencaoHash" TEXT NOT NULL,
  "resumoHash" TEXT NOT NULL,
  "justificativa" TEXT NOT NULL,
  "autor" TEXT NOT NULL,
  "lote" TEXT NOT NULL,
  "xmlAssinado" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PREPARADA',
  "codigo" TEXT,
  "motivo" TEXT,
  "protocolo" TEXT,
  "xmlResposta" TEXT,
  "xmlProcessado" TEXT,
  "xmlConsulta" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  "enviadoEm" TIMESTAMP(3),
  "concluidoEm" TIMESTAMP(3),
  CONSTRAINT "CancelamentoEmissaoFiscalLoja_tenantId_emissaoId_id_key" UNIQUE ("tenantId", "emissaoId", "id"),
  CONSTRAINT "CancelamentoEmissaoFiscalLoja_emissao_fkey" FOREIGN KEY ("tenantId", "emissaoId") REFERENCES "EmissaoFiscalLoja"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CancelamentoEmissaoFiscalLoja_anterior_fkey" FOREIGN KEY ("tenantId", "emissaoId", "anteriorId") REFERENCES "CancelamentoEmissaoFiscalLoja"("tenantId", "emissaoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "CancelamentoEmissaoFiscalLoja_ativo_key" ON "CancelamentoEmissaoFiscalLoja"("emissaoId") WHERE "status" <> 'SUBSTITUIDA';
CREATE INDEX "CancelamentoEmissaoFiscalLoja_tenantId_emissaoId_criadoEm_idx" ON "CancelamentoEmissaoFiscalLoja"("tenantId", "emissaoId", "criadoEm");
CREATE FUNCTION "preservarCancelamentoEmissaoFiscalLoja"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'O histórico de cancelamento fiscal é imutável';
  END IF;
  IF ROW(NEW."tenantId", NEW."emissaoId", NEW."anteriorId", NEW."intencaoHash", NEW."resumoHash", NEW."justificativa", NEW."autor", NEW."lote", NEW."xmlAssinado", NEW."criadoEm") IS DISTINCT FROM
     ROW(OLD."tenantId", OLD."emissaoId", OLD."anteriorId", OLD."intencaoHash", OLD."resumoHash", OLD."justificativa", OLD."autor", OLD."lote", OLD."xmlAssinado", OLD."criadoEm") THEN
    RAISE EXCEPTION 'A intenção de cancelamento fiscal assinada é imutável';
  END IF;
  IF OLD."xmlProcessado" IS NOT NULL AND NEW."xmlProcessado" IS DISTINCT FROM OLD."xmlProcessado" THEN
    RAISE EXCEPTION 'O comprovante de cancelamento fiscal é imutável';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "CancelamentoEmissaoFiscalLoja_imutavel" BEFORE UPDATE OR DELETE ON "CancelamentoEmissaoFiscalLoja" FOR EACH ROW EXECUTE FUNCTION "preservarCancelamentoEmissaoFiscalLoja"();
