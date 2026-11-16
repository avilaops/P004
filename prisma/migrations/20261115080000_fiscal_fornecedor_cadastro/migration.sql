CREATE TABLE "FornecedorLoja" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "documento" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "FornecedorLoja_tenantId_documento_key" ON "FornecedorLoja"("tenantId", "documento");

CREATE TABLE "CadastroProdutoFiscal" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "chave" TEXT NOT NULL,
  "numero" INTEGER NOT NULL,
  "resumoHash" TEXT NOT NULL,
  "varianteId" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId", "varianteId") REFERENCES "Variante"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CadastroProdutoFiscal_tenantId_chave_numero_key" ON "CadastroProdutoFiscal"("tenantId", "chave", "numero");
