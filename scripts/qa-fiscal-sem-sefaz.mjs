// Carregado somente pelo servidor sintético da jornada fiscal no GitHub CI.
// Uma regressão de validação não pode abrir conexão com o autorizador real.
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
if (process.env.CI !== "true") throw new Error("Bloqueio fiscal de QA exige GitHub CI.");
const requestOriginal = https.request;
https.request = function (...args) {
  const destino = args[0];
  const host = typeof destino === "string" ? new URL(destino).hostname : destino?.hostname ?? destino?.host ?? "";
  if (typeof host === "string" && /(?:nfe|sefaz|fazenda)/i.test(host) && /\.gov\.br$/i.test(host)) throw new Error("QA fiscal bloqueou conexão externa com a SEFAZ.");
  return Reflect.apply(requestOriginal, this, args);
};
syncBuiltinESMExports();
